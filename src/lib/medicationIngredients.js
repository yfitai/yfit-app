// Ingredients describe one parent medication; they never create schedules or sum doses.
export const MAX_MEDICATION_INGREDIENTS = 20
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAIRS_PER_QUERY = 20
const MAX_INTERACTION_PAIRS = 10000
const text = (value) => typeof value === 'string' ? value.trim() : ''
export const isMedicationCatalogId = (value) => typeof value === 'string' && UUID.test(value)
const cleanId = (value) => isMedicationCatalogId(text(value)) ? text(value).toLowerCase() : null

/** Persistence boundary: no parsing old dosage, units, names, or free-text lists. */
export function normalizeMedicationIngredients(rows) {
  if (rows == null) return null
  if (!Array.isArray(rows)) throw new TypeError('Ingredients must be an array.')
  if (rows.length === 0) return null
  if (rows.length > MAX_MEDICATION_INGREDIENTS) throw new RangeError('A maximum of 20 ingredients is supported.')
  return rows.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new TypeError(`Ingredient ${index + 1} requires a name and exact label strength.`)
    const name = text(row.name)
    const dosage = text(row.dosage)
    if (!name || !dosage) throw new TypeError(`Ingredient ${index + 1} requires a name and exact label strength.`)
    const medication_id = row.medication_id == null ? null : cleanId(row.medication_id)
    if (row.medication_id != null && !medication_id) throw new TypeError(`Ingredient ${index + 1} has an invalid catalog ID.`)
    return { name, dosage, medication_id }
  })
}

/** Tolerant display boundary; malformed rows are not inferred or parsed. */
export function getMedicationIngredients(item) {
  const rows = item?.combination_ingredients
  if (!Array.isArray(rows)) return []
  return rows.slice(0, MAX_MEDICATION_INGREDIENTS).flatMap((row) => {
    try { return normalizeMedicationIngredients([row]) || [] } catch { return [] }
  })
}

export function getMedicationIngredientLines(item) {
  return getMedicationIngredients(item).map(({ name, dosage }) => `${name} — ${dosage}`)
}

/**
 * Include a known parent/brand ID AND explicit ingredient IDs, retaining brand
 * catalog interactions. A parent and its own matching ingredient are one query
 * subject, not duplicate therapy. Repeated ingredient rows still warn. Exact
 * case-folded names are used only to flag possible duplicates, NEVER assign IDs.
 * A custom combination parent is a grouping label, not an extra unknown drug.
 */
export function buildInteractionSubjects(items) {
  const subjects = []
  const unresolved = []
  const duplicates = []
  const occurrences = []
  const seenDuplicates = new Set()
  const seenSubjects = new Set()
  const warn = (name, parent_id, parent_name) => unresolved.push({ name, parent_id, parent_name })
  for (const [index, item] of (Array.isArray(items) ? items : []).entries()) {
    const parent_id = item?.id ?? `unsaved:${index}`
    const parent_name = text(item?.medication?.name) || text(item?.custom_name) || text(item?.name) || text(item?.custom_generic_name) || 'Unnamed medication'
    const parentIdValue = item?.medication_id ?? item?.medication?.id
    const parentCatalogId = cleanId(parentIdValue)
    const rows = item?.combination_ingredients
    const hasIngredients = Array.isArray(rows) && rows.length > 0
    // Parent position, not just supplied patient ID, distinguishes separate rows.
    const add = (name, medication_id, ingredient) => {
      const occurrence = { name, medication_id, parent_id, parent_name, index, ingredient }
      for (const previous of occurrences) {
        if (previous.index === index && !(previous.ingredient && ingredient)) continue
        const sameId = medication_id && previous.medication_id === medication_id
        const sameName = text(name).toLocaleLowerCase() === text(previous.name).toLocaleLowerCase()
        if (!sameId && !sameName) continue
        const key = `${previous.index}:${index}:${medication_id || text(name).toLocaleLowerCase()}`
        if (seenDuplicates.has(key)) continue
        seenDuplicates.add(key)
        duplicates.push({ name, medication_id, parent_id, parent_name, other_parent_id: previous.parent_id, other_parent_name: previous.parent_name, within_parent: previous.index === index })
      }
      occurrences.push(occurrence)
      if (!medication_id) return
      const key = `${index}:${medication_id}`
      if (seenSubjects.has(key)) return
      seenSubjects.add(key)
      subjects.push({ medication_id, name, parent_id, parent_name })
    }
    if (parentCatalogId) add(parent_name, parentCatalogId, false)
    else if (parentIdValue != null || !hasIngredients) warn(parent_name, parent_id, parent_name)
    if (rows != null && !Array.isArray(rows)) {
      if (parentCatalogId) warn(parent_name, parent_id, parent_name)
      continue // One unparsed value, never four inferred ingredients.
    }
    if (!hasIngredients) {
      if (!parentCatalogId) add(parent_name, null, false)
      continue
    }
    if (rows.length > MAX_MEDICATION_INGREDIENTS) warn(parent_name, parent_id, parent_name)
    for (const row of rows.slice(0, MAX_MEDICATION_INGREDIENTS)) {
      const name = text(row?.name)
      const dosage = text(row?.dosage)
      const medication_id = cleanId(row?.medication_id)
      // Even incomplete strength cannot suppress checks for a valid explicit ID.
      if (!name || !dosage || !medication_id) warn(name || parent_name, parent_id, parent_name)
      if (name || medication_id) add(name || parent_name, medication_id, true)
    }
  }
  return { subjects, unresolved, duplicates }
}

/** Explicit catalog lookup. The caller must let the user select a result. */
export async function searchMedicationCatalog(client, name) {
  const term = text(name)
  if (term.length < 2) return []
  // ilike is a single encoded query value, not a constructed .or() expression.
  const pattern = `%${term.replace(/[\\%_]/g, '\\$&')}%`
  const { data, error } = await client.from('medications').select('id,name,generic_name').ilike('name', pattern).limit(8)
  if (error) throw error
  if (!Array.isArray(data)) throw new Error('Catalog lookup returned an invalid response.')
  return data.filter((row) => isMedicationCatalogId(row.id) && text(row.name)).slice(0, 8)
}

const pairKey = (a, b) => [a, b].sort().join(':')

/**
 * GET/read queries only. Verify UUIDs exist in the current catalog before querying
 * exact unordered pairs in BOTH stored orientations. No name-based clinical
 * reasoning or dose-specific clearance. Errors reject; callers MUST warn rather
 * than display a successful empty result. proposed is memory-only, never inserted.
 */
export async function checkMedicationInteractions(client, items, proposed = null) {
  const allItems = [...(Array.isArray(items) ? items : []), ...(proposed ? [proposed] : [])]
  const { subjects, unresolved, duplicates } = buildInteractionSubjects(allItems)
  const requestedIds = [...new Set(subjects.map((subject) => subject.medication_id))]
  const catalog = new Map()
  for (let offset = 0; offset < requestedIds.length; offset += 100) {
    const chunk = requestedIds.slice(offset, offset + 100)
    const { data, error } = await client.from('medications').select('id,name').in('id', chunk)
    if (error) throw error
    if (!Array.isArray(data)) throw new Error('Catalog verification returned an invalid response.')
    for (const row of data) {
      const id = cleanId(row.id)
      if (id && chunk.includes(id)) catalog.set(id, text(row.name))
    }
  }
  for (const subject of subjects) {
    if (!catalog.has(subject.medication_id)) unresolved.push({ name: subject.name, parent_id: subject.parent_id, parent_name: subject.parent_name })
  }
  const ids = requestedIds.filter((id) => catalog.has(id))
  if (ids.length * (ids.length - 1) / 2 > MAX_INTERACTION_PAIRS) throw new RangeError('Too many catalog pairs for a complete check; ask a pharmacist to review.')
  const pairs = []
  for (let a = 0; a < ids.length; a += 1) {
    for (let b = a + 1; b < ids.length; b += 1) pairs.push([ids[a], ids[b]])
  }
  const interactions = []
  const seen = new Set()
  for (let offset = 0; offset < pairs.length; offset += PAIRS_PER_QUERY) {
    const chunk = pairs.slice(offset, offset + PAIRS_PER_QUERY)
    const permittedPairs = new Set(chunk.map(([a, b]) => pairKey(a, b)))
    const filter = chunk.flatMap(([a, b]) => [
      `and(drug_a_id.eq.${a},drug_b_id.eq.${b})`,
      `and(drug_a_id.eq.${b},drug_b_id.eq.${a})`
    ]).join(',')
    const { data, error } = await client.from('drug_interactions').select('drug_a_id,drug_b_id,severity,description,management').or(filter)
    if (error) throw error
    if (!Array.isArray(data)) throw new Error('Interaction lookup returned an invalid response.')
    for (const row of data) {
      const a = cleanId(row.drug_a_id)
      const b = cleanId(row.drug_b_id)
      if (!a || !b || !permittedPairs.has(pairKey(a, b))) throw new Error('Interaction lookup returned an unexpected catalog pair.')
      const mapped = { drug_a_id: a, drug_b_id: b, severity: text(row.severity), description: text(row.description), management: text(row.management) }
      const key = JSON.stringify([pairKey(a, b), mapped.severity, mapped.description, mapped.management])
      if (seen.has(key)) continue
      seen.add(key)
      interactions.push({ ...mapped, drug_a_name: catalog.get(a), drug_b_name: catalog.get(b), drug_a_subjects: subjects.filter((subject) => subject.medication_id === a), drug_b_subjects: subjects.filter((subject) => subject.medication_id === b) })
    }
  }
  return { interactions, unresolved, duplicates, coverageLimited: true }
}
