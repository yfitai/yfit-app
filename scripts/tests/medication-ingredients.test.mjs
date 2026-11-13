import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { transform } from 'esbuild'
import {
  MAX_MEDICATION_INGREDIENTS, normalizeMedicationIngredients, getMedicationIngredients,
  getMedicationIngredientLines, buildInteractionSubjects, checkMedicationInteractions,
  searchMedicationCatalog
} from '../../src/lib/medicationIngredients.js'

const id = (number) => `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`
const ingredient = (number, overrides = {}) => ({ name: `Ingredient ${number}`, dosage: `${number} mg / capsule`, medication_id: id(number), ...overrides })
const med = (number, overrides = {}) => ({ id: `patient-${number}`, medication_id: id(number), medication: { name: `Medication ${number}` }, dosage: 'one tablet', frequency: 'Once daily', ...overrides })
const compound = (numbers, overrides = {}) => ({ id: 'compound', custom_name: 'Custom four-ingredient capsule', dosage: 'one capsule', frequency: 'Twice weekly', scheduled_weekdays: [1, 4], combination_ingredients: numbers.map((number) => ingredient(number)), ...overrides })
const canonical = (a, b) => [a, b].sort().join(':')
const parsedPairs = (filter) => [...filter.matchAll(/and\(drug_a_id\.eq\.([0-9a-f-]+),drug_b_id\.eq\.([0-9a-f-]+)\)/gi)].map((match) => [match[1], match[2]])

function mockClient({ catalogIds = [], interactions = [], failTable = null, thrown = false, invalidDataTable = null, rawInteractions = false, lookupRows = [] } = {}) {
  const calls = []
  const client = {
    calls,
    from(table) {
      assert.ok(['medications', 'drug_interactions'].includes(table), `unexpected table: ${table}`)
      const call = { table, operations: [] }
      calls.push(call)
      const query = {
        select(fields) { call.fields = fields; call.operations.push('select'); return query },
        in(column, ids) { call.column = column; call.ids = ids; call.operations.push('in'); return query },
        or(filter) { call.filter = filter; call.operations.push('or'); return query },
        ilike(column, pattern) { call.searchColumn = column; call.pattern = pattern; call.operations.push('ilike'); return query },
        limit(limit) { call.limit = limit; call.operations.push('limit'); return query },
        then(resolve, reject) {
          if (failTable === table) {
            if (thrown) return Promise.reject(new Error('Mock network failure')).then(resolve, reject)
            return Promise.resolve({ data: null, error: new Error('Mock read failure') }).then(resolve, reject)
          }
          if (invalidDataTable === table) return Promise.resolve({ data: null, error: null }).then(resolve, reject)
          let data
          if (table === 'medications') {
            data = call.pattern ? lookupRows : catalogIds.filter((catalogId) => call.ids.includes(catalogId)).map((catalogId) => ({ id: catalogId, name: `Catalog ${catalogId.slice(-2)}` }))
          } else {
            const allowed = new Set(parsedPairs(call.filter).map(([a, b]) => canonical(a, b)))
            data = rawInteractions ? interactions : interactions.filter((row) => allowed.has(canonical(row.drug_a_id, row.drug_b_id)))
          }
          return Promise.resolve({ data, error: null }).then(resolve, reject)
        }
      }
      return query
    }
  }
  return client
}

const alert = (a, b, description = `${a} with ${b}`) => ({ drug_a_id: id(a), drug_b_id: id(b), severity: 'moderate', description, management: 'Consult pharmacist' })

test('normalization trims strings, keeps strength literal, preserves parent grouping and never sums doses', () => {
  const original = compound([1, 2, 3, 4])
  const rows = normalizeMedicationIngredients([{ name: '  Ingredient A  ', dosage: '  2.50 mg / 0.5 mL (as salt)  ', medication_id: `  ${id(1).toUpperCase()}  ` }, { name: 'Unknown', dosage: 'half tablet PRN', medication_id: null }])
  assert.deepEqual(rows, [{ name: 'Ingredient A', dosage: '2.50 mg / 0.5 mL (as salt)', medication_id: id(1) }, { name: 'Unknown', dosage: 'half tablet PRN', medication_id: null }])
  const parentPayload = { ...original, combination_ingredients: normalizeMedicationIngredients(original.combination_ingredients) }
  assert.equal(parentPayload.dosage, 'one capsule')
  assert.equal(parentPayload.frequency, 'Twice weekly')
  assert.deepEqual(parentPayload.scheduled_weekdays, [1, 4])
  assert.equal(parentPayload.combination_ingredients.length, 4)
  assert.deepEqual(original, compound([1, 2, 3, 4]), 'input never mutated')
  assert.equal(normalizeMedicationIngredients([]), null)
  assert.equal(normalizeMedicationIngredients(null), null)
  assert.equal(normalizeMedicationIngredients(undefined), null)
})

test('normalization rejects partial rows, invalid non-null UUIDs, free text, and excessive rows', () => {
  for (const rows of [[{ name: '', dosage: '1 mg' }], [{ name: 'A', dosage: '' }], [{ name: 'A', dosage: 10 }], [null], [['A', '1mg']], [{ name: 'A', dosage: '1 mg', medication_id: '' }], [{ name: 'A', dosage: '1 mg', medication_id: `${id(1)},drug_b_id.eq.${id(2)}` }], 'A 1mg+B 2mg', {}, Array.from({ length: 21 }, (_, index) => ingredient(index))]) {
    assert.throws(() => normalizeMedicationIngredients(rows))
  }
  assert.equal(normalizeMedicationIngredients([{ name: 'A', dosage: '1 mg' }])[0].medication_id, null)
})

test('display exports return clean ingredient arrays and exact report lines without guessing old dosage', () => {
  const item = { combination_ingredients: [{ name: ' A ', dosage: ' 10 mg ', medication_id: null }, ingredient(2), { name: 'Broken', dosage: '' }] }
  assert.equal(getMedicationIngredients(item).length, 2)
  assert.deepEqual(getMedicationIngredientLines(item), ['A — 10 mg', 'Ingredient 2 — 2 mg / capsule'])
  for (const value of [undefined, null, 'A 1mg+B 2mg+C 3mg+D 4mg', { freeText: 'A/B/C/D' }]) {
    assert.deepEqual(getMedicationIngredients({ combination_ingredients: value, dosage: 'A 1mg + B 2mg + C 3mg + D 4mg' }), [])
  }
})

test('four explicit ingredients each check against another medication AND all six internal pairs, in both stored directions', async () => {
  const client = mockClient({ catalogIds: [1, 2, 3, 4, 5].map(id), interactions: [alert(5, 1), alert(2, 5), alert(5, 3), alert(4, 5), alert(4, 1)] })
  const result = await checkMedicationInteractions(client, [compound([1, 2, 3, 4]), med(5)])
  assert.equal(result.interactions.length, 5)
  assert.deepEqual(result.unresolved, [])
  assert.deepEqual(result.duplicates, [])
  assert.equal(result.coverageLimited, true)
  const queries = client.calls.filter((call) => call.table === 'drug_interactions')
  assert.equal(queries.length, 1)
  assert.equal(queries[0].fields, 'drug_a_id,drug_b_id,severity,description,management')
  const oriented = new Set(parsedPairs(queries[0].filter).map(([a, b]) => `${a}:${b}`))
  assert.equal(oriented.size, 20)
  for (let a = 1; a <= 5; a += 1) for (let b = a + 1; b <= 5; b += 1) {
    assert.ok(oriented.has(`${id(a)}:${id(b)}`), `missing ${a}->${b}`)
    assert.ok(oriented.has(`${id(b)}:${id(a)}`), `missing ${b}->${a}`)
  }
  assert.equal(result.interactions[0].management, 'Consult pharmacist')
  assert.ok(result.interactions.some((row) => row.drug_b_subjects.some((subject) => subject.parent_name === 'Custom four-ingredient capsule')))
})

test('reverse duplicate interaction records dedupe without suppressing different warnings for the same pair', async () => {
  const client = mockClient({ catalogIds: [id(1), id(2)], interactions: [alert(1, 2, 'same warning'), alert(2, 1, 'same warning'), alert(2, 1, 'different warning')] })
  const result = await checkMedicationInteractions(client, [med(1), med(2)])
  assert.equal(result.interactions.length, 2)
})

test('known parent catalog ID retains brand checks, without counting parent versus own ingredient as a duplicate', async () => {
  const subjects = buildInteractionSubjects([compound([1, 2], { medication_id: id(1) })])
  assert.equal(subjects.subjects.length, 2)
  assert.deepEqual(subjects.duplicates, [])
  const client = mockClient({ catalogIds: [id(1), id(2), id(3), id(9)], interactions: [alert(9, 3)] })
  const result = await checkMedicationInteractions(client, [compound([1, 2], { medication_id: id(9) }), med(3)])
  assert.equal(result.interactions.length, 1)
  assert.deepEqual(result.unresolved, [])
})

test('unparsed unknown text is one unresolved record, not four ingredients or a successful safety conclusion', async () => {
  const unknown = { id: 'unknown', custom_name: 'A/B/C/D mixture', dosage: '1mg/2mg/3mg/4mg', combination_ingredients: 'A 1mg, B 2mg, C 3mg, D 4mg' }
  const client = mockClient({ catalogIds: [id(5)] })
  const result = await checkMedicationInteractions(client, [unknown, med(5)])
  assert.equal(result.unresolved.length, 1)
  assert.equal(result.unresolved[0].name, 'A/B/C/D mixture')
  assert.deepEqual(result.interactions, [])
  assert.equal(client.calls.filter((call) => call.table === 'drug_interactions').length, 0)
  const rows = buildInteractionSubjects([compound([1, 2], { combination_ingredients: [ingredient(1), { name: 'Manual ingredient', dosage: '7 mcg', medication_id: null }] })])
  assert.equal(rows.subjects.length, 1)
  assert.equal(rows.unresolved[0].name, 'Manual ingredient')
})

test('malformed strengths warn but valid selected ingredients still participate in interaction checks', async () => {
  const client = mockClient({ catalogIds: [id(1), id(2)], interactions: [alert(1, 2)] })
  const result = await checkMedicationInteractions(client, [compound([1], { combination_ingredients: [ingredient(1, { dosage: '' })] }), med(2)])
  assert.equal(result.interactions.length, 1)
  assert.equal(result.unresolved[0].name, 'Ingredient 1')
})

test('duplicate ingredients are flagged within one parent and across medication/supplement parents', async () => {
  const client = mockClient({ catalogIds: [id(1), id(2)] })
  const result = await checkMedicationInteractions(client, [compound([1, 1, 2]), med(1, { is_supplement: true }), compound([2], { id: 'other', custom_name: 'Other mixture' })])
  assert.ok(result.duplicates.some((duplicate) => duplicate.within_parent && duplicate.medication_id === id(1)))
  assert.ok(result.duplicates.some((duplicate) => !duplicate.within_parent && duplicate.medication_id === id(1)))
  assert.ok(result.duplicates.some((duplicate) => !duplicate.within_parent && duplicate.medication_id === id(2)))
  assert.equal(client.calls.filter((call) => call.table === 'drug_interactions').length, 1)
  assert.equal(parsedPairs(client.calls.find((call) => call.table === 'drug_interactions').filter).length, 2)
})

test('exact manual names only warn for duplicates; casing or fuzzy names never resolve catalog IDs', () => {
  const result = buildInteractionSubjects([{ id: 'one', custom_name: ' Unmatched A ' }, { id: 'two', custom_name: 'unmatched a' }, { id: 'three', custom_name: 'unmatched-a' }])
  assert.equal(result.subjects.length, 0)
  assert.equal(result.unresolved.length, 3)
  assert.equal(result.duplicates.length, 1)
})

test('legacy plain medications without the new field continue checking, including proposed medication without any patient write', async () => {
  const client = mockClient({ catalogIds: [id(1), id(2), id(3)], interactions: [alert(1, 2), alert(3, 2)] })
  const result = await checkMedicationInteractions(client, [med(1), med(2)], { custom_name: 'Proposed single', medication_id: id(3), dosage: '10mg' })
  assert.equal(result.interactions.length, 2)
  assert.deepEqual(result.unresolved, [])
  assert.ok(client.calls.every((call) => call.operations.every((operation) => ['select', 'in', 'or'].includes(operation))))
  assert.ok(!client.calls.some((call) => call.table === 'user_medications'))
})

test('invalid/injected UUIDs cannot enter catalog or pair filters; valid UUID absent from catalog is also unresolved', async () => {
  const bad = `${id(1)}),or(drug_a_id.eq.${id(2)}`
  const client = mockClient({ catalogIds: [id(3), id(4)] })
  const result = await checkMedicationInteractions(client, [med(1, { medication_id: bad }), compound([1, 9], { combination_ingredients: [ingredient(1, { medication_id: bad }), ingredient(9)] }), med(3), med(4)])
  assert.equal(result.unresolved.length, 3)
  for (const call of client.calls) {
    assert.ok(!(call.filter || '').includes(bad))
    assert.ok(!(call.ids || []).includes(bad))
    if (call.table === 'drug_interactions') assert.ok(!(call.filter || '').includes(id(9)), 'unknown catalog UUID never queried as an interaction')
  }
})

test('a 20-ingredient combination bounds exact pair query batches and excess ingredients warn', async () => {
  assert.equal(MAX_MEDICATION_INGREDIENTS, 20)
  const client = mockClient({ catalogIds: Array.from({ length: 21 }, (_, index) => id(index + 1)) })
  const result = await checkMedicationInteractions(client, [compound(Array.from({ length: 20 }, (_, index) => index + 1)), med(21)])
  const queries = client.calls.filter((call) => call.table === 'drug_interactions')
  assert.equal(queries.length, Math.ceil(210 / 20))
  assert.equal(queries.flatMap((call) => parsedPairs(call.filter)).length, 420)
  assert.ok(queries.every((call) => parsedPairs(call.filter).length <= 40))
  assert.deepEqual(result.unresolved, [])
  const excessive = buildInteractionSubjects([compound(Array.from({ length: 21 }, (_, index) => index + 1))])
  assert.equal(excessive.subjects.length, 20)
  assert.ok(excessive.unresolved.some((row) => row.parent_name === 'Custom four-ingredient capsule'))
})

test('overall query guard rejects excessive complete comparisons instead of silently truncating', async () => {
  const client = mockClient({ catalogIds: Array.from({ length: 143 }, (_, index) => id(index + 1)) })
  await assert.rejects(checkMedicationInteractions(client, Array.from({ length: 143 }, (_, index) => med(index + 1))), /Too many catalog pairs/)
  assert.equal(client.calls.filter((call) => call.table === 'drug_interactions').length, 0)
})

test('catalog errors, interaction errors, network errors, and invalid read results reject rather than returning a green empty result', async () => {
  for (const settings of [{ failTable: 'medications' }, { failTable: 'drug_interactions' }, { failTable: 'drug_interactions', thrown: true }, { invalidDataTable: 'medications' }, { invalidDataTable: 'drug_interactions' }]) {
    const client = mockClient({ catalogIds: [id(1), id(2)], ...settings })
    await assert.rejects(checkMedicationInteractions(client, [med(1), med(2)]))
  }
  const unexpected = mockClient({ catalogIds: [id(1), id(2)], interactions: [alert(1, 3)], rawInteractions: true })
  await assert.rejects(checkMedicationInteractions(unexpected, [med(1), med(2)]), /unexpected catalog pair/)
})

test('catalog search uses an encoded literal ilike value, read limit eight, and never auto-selects by name', async () => {
  const client = mockClient({ lookupRows: [ingredient(1, { id: id(1) }), { id: 'invalid', name: 'Invalid record' }, { id: id(2), name: 'Selected only by user' }] })
  const matches = await searchMedicationCatalog(client, '  A%),or(id.eq.any)_  ')
  assert.equal(matches.length, 2)
  const call = client.calls[0]
  assert.equal(call.table, 'medications')
  assert.equal(call.limit, 8)
  assert.equal(call.searchColumn, 'name')
  assert.equal(call.pattern, '%A\\%),or(id.eq.any)\\_%')
  assert.ok(!call.operations.includes('or'))
  assert.equal(await searchMedicationCatalog(client, 'x').then((rows) => rows.length), 0)
  await assert.rejects(searchMedicationCatalog(mockClient({ failTable: 'medications' }), 'Unknown'))
})

test('UI and migration retain read-only proposed checks, explicit selection, cancellation, warnings and one-parent persistence', async () => {
  const root = new URL('../../', import.meta.url)
  const checker = await readFile(new URL('src/components/InteractionChecker.jsx', root), 'utf8')
  const editor = await readFile(new URL('src/components/MedicationIngredientEditor.jsx', root), 'utf8')
  const sql = await readFile(new URL('database/add_medication_combination_ingredients.sql', root), 'utf8')
  assert.ok(!checker.includes('CheckCircle'))
  assert.ok(!checker.includes('noInteractionsDesc'))
  assert.ok(!checker.includes('.insert('))
  assert.ok(checker.includes("from('safety_alerts').update("), 'legacy acknowledgement preserved')
  assert.ok(checker.includes('checkMedicationInteractions(supabase, active, draft)'))
  assert.ok(checker.includes('catalogCoverageLimited'))
  assert.ok(checker.includes('currentCheckFailed'))
  assert.ok(editor.includes('request.current += 1'))
  assert.ok(editor.includes('version !== request.current'))
  assert.ok(editor.includes('medication_id: null'))
  assert.ok(editor.includes('selectCatalogMatch'))
  assert.ok(editor.includes('row.dosage'))
  assert.match(sql, /ADD COLUMN IF NOT EXISTS combination_ingredients jsonb/)
  assert.match(sql, /jsonb_array_length\(combination_ingredients\) <= 20/)
  assert.match(sql, /NOTIFY pgrst, 'reload schema'/)
  assert.ok(!/\b(?:INSERT INTO|UPDATE public|DELETE FROM|DROP |CREATE FUNCTION|CREATE POLICY)\b/i.test(sql))
})

// Compile only the already-owned JSX text in memory, never build/write bundles.
// Minimal hook harness exercises event contracts without browser or patient data.
async function componentHarness(filename, componentName, bindings = {}) {
  const raw = await readFile(new URL(`../../src/components/${filename}`, import.meta.url), 'utf8')
  const source = raw.replace(/^import .*$/gm, '').replace(/export default function/g, 'function')
  const { code } = await transform(source, { loader: 'jsx', jsxFactory: 'h', jsxFragment: 'Fragment' })
  const slots = []
  let cursor = 0
  let effects = []
  const context = {
    ...bindings,
    h: (type, props, ...children) => ({ type, props: props || {}, children }),
    Fragment: 'fragment',
    useTranslation: () => ({ t: (_key, fallback) => fallback }),
    useId: () => 'test-row',
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
      return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }]
    },
    useRef(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = { current: initial }
      return slots[index]
    },
    useEffect(effect, dependencies) {
      const index = cursor++
      const previous = slots[index]
      if (!previous || dependencies.some((value, position) => value !== previous.dependencies[position])) {
        effects.push(() => {
          previous?.cleanup?.()
          slots[index] = { dependencies, cleanup: effect() }
        })
      }
    }
  }
  runInNewContext(`${code}\nglobalThis.testComponent = ${componentName}`, context)
  return {
    render(props) {
      cursor = 0
      effects = []
      const tree = context.testComponent(props)
      effects.forEach((effect) => effect())
      return tree
    },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()) }
  }
}

function nodes(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, predicate))
  if (!tree || typeof tree !== 'object') return []
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.children, predicate)]
}

function visibleText(tree) {
  if (Array.isArray(tree)) return tree.map(visibleText).join(' ')
  if (tree == null || typeof tree === 'boolean') return ''
  if (typeof tree !== 'object') return String(tree)
  return visibleText(tree.children)
}

test('ingredient editor cancels a stale lookup after name edits, never chooses the first match, and clears selected IDs', async () => {
  let finishLookup
  let row = ingredient(1, { name: 'First name', medication_id: null })
  const harness = await componentHarness('MedicationIngredientEditor.jsx', 'IngredientRow', {
    supabase: {},
    isMedicationCatalogId: (value) => value === id(1),
    searchMedicationCatalog: async () => new Promise((resolve) => { finishLookup = resolve })
  })
  const props = () => ({ row, index: 0, onChange: (next) => { row = next }, onRemove: () => {} })
  let tree = harness.render(props())
  tree = harness.render(props()) // Flush initial effect state changes.
  let pending = nodes(tree, (node) => node.type === 'button')[0].props.onClick()
  nodes(tree, (node) => node.type === 'input')[0].props.onChange({ target: { value: 'Edited name' } })
  harness.render(props())
  finishLookup([{ id: id(1), name: 'First name' }])
  await pending
  tree = harness.render(props())
  assert.equal(row.medication_id, null)
  assert.equal(nodes(tree, (node) => node.type === 'select').length, 0, 'stale search not displayed')
  pending = nodes(tree, (node) => node.type === 'button')[0].props.onClick()
  finishLookup([{ id: id(1), name: 'Catalog choice' }])
  await pending
  tree = harness.render(props())
  assert.equal(row.medication_id, null, 'search does not automatically assign first result')
  const select = nodes(tree, (node) => node.type === 'select')[0]
  assert.equal(select.props.value, '')
  select.props.onChange({ target: { value: id(1) } })
  assert.equal(row.name, 'Catalog choice')
  assert.equal(row.medication_id, id(1))
  tree = harness.render(props())
  nodes(tree, (node) => node.type === 'input')[0].props.onChange({ target: { value: 'Manual correction' } })
  assert.equal(row.medication_id, null, 'name correction clears obsolete ID')
  assert.equal(row.dosage, '1 mg / capsule')
  harness.unmount()
})

test('ingredient lookup failure visibly warns and does not claim resolution', async () => {
  const harness = await componentHarness('MedicationIngredientEditor.jsx', 'IngredientRow', {
    supabase: {}, isMedicationCatalogId: () => false,
    searchMedicationCatalog: async () => { throw new Error('Read failure') }
  })
  const props = { row: ingredient(1, { medication_id: null }), index: 0, onChange: () => {}, onRemove: () => {} }
  harness.render(props)
  const tree = harness.render(props)
  await nodes(tree, (node) => node.type === 'button')[0].props.onClick()
  const text = visibleText(harness.render(props))
  assert.match(text, /Catalog lookup failed/)
  assert.match(text, /not checked until you select a catalog record/)
  harness.unmount()
})

test('result rendering shows unresolved warnings and never renders empty-success text for a query failure', async () => {
  const harness = await componentHarness('InteractionChecker.jsx', 'CheckResults')
  const result = { interactions: [], duplicates: [], unresolved: [{ name: 'Unknown ingredient', parent_name: 'Compound' }], coverageLimited: true }
  let text = visibleText(harness.render({ result, busy: false, error: '', title: 'Catalog check' }))
  assert.match(text, /Catalog coverage is limited/)
  assert.match(text, /not exact doses/)
  assert.match(text, /not clinical clearance/)
  assert.match(text, /Unknown ingredient/)
  text = visibleText(harness.render({ result, busy: false, error: 'Read failed: no safety conclusion', title: 'Catalog check' }))
  assert.match(text, /Read failed/)
  assert.ok(!text.includes('No recorded catalog pair interactions returned'))
})
