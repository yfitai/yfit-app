import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import fs from 'node:fs/promises'
const runtime = process.env.YFIT_TEST_DEPS || '/home/ubuntu/.manus/yfit-medication/test-deps'
const require = createRequire(path.join(runtime, 'package.json'))
const { PGlite } = require('@electric-sql/pglite')

async function fixture() {
  const db = new PGlite()
  await db.exec(`CREATE TABLE public.user_medications (id integer primary key, frequency text, dosage text, notes text);
    CREATE TABLE public.medication_logs (id integer primary key, user_medication_id integer, status text, actual_time timestamptz);
    INSERT INTO public.user_medications VALUES (1, 'Once weekly', 'fictional existing strength', 'fictional existing note');
    INSERT INTO public.medication_logs VALUES (1, 1, 'taken', '2026-11-13T13:00:00Z');`)
  return db
}
const loadSql = name => fs.readFile(new URL(`../../database/${name}`, import.meta.url), 'utf8')

test('weekday migration executes twice, leaves existing fields and taken history unchanged, and creates no default schedule', async () => {
  const db = await fixture()
  try {
    const before = await db.query('SELECT * FROM medication_logs')
    const sql = await loadSql('add_medication_scheduled_weekdays.sql')
    await db.exec(sql)
    await db.exec(sql)
    const rows = (await db.query('SELECT * FROM user_medications')).rows
    assert.equal(rows[0].scheduled_weekdays, null)
    assert.equal(rows[0].frequency, 'Once weekly')
    assert.equal(rows[0].dosage, 'fictional existing strength')
    assert.equal(rows[0].notes, 'fictional existing note')
    assert.deepEqual((await db.query('SELECT * FROM medication_logs')).rows, before.rows)
    await db.exec('UPDATE user_medications SET scheduled_weekdays = ARRAY[0]::smallint[] WHERE id=1')
    assert.deepEqual((await db.query('SELECT scheduled_weekdays FROM user_medications')).rows[0].scheduled_weekdays, [0])
    for (const value of ['ARRAY[0,0]', 'ARRAY[7]', 'ARRAY[-1]', 'ARRAY[0,1,2]', 'ARRAY[]', 'ARRAY[NULL]', 'ARRAY[[0],[1]]']) {
      await assert.rejects(db.exec(`UPDATE user_medications SET scheduled_weekdays = ${value}::smallint[] WHERE id=1`), /check constraint/)
    }
  } finally { await db.close() }
})

test('weekday migration fails rather than coercing an incompatible existing column type', async () => {
  const db = await fixture()
  try {
    await db.exec('ALTER TABLE user_medications ADD COLUMN scheduled_weekdays text')
    await assert.rejects(db.exec(await loadSql('add_medication_scheduled_weekdays.sql')), /incompatible type/)
  } finally { await db.close() }
})

test('combination migration is additive and idempotent; no fictional patient dosage, frequency or history is rewritten', async () => {
  const db = await fixture()
  try {
    const sql = await loadSql('add_medication_combination_ingredients.sql')
    const before = (await db.query('SELECT * FROM medication_logs')).rows
    await db.exec(sql)
    await db.exec(sql)
    const row = (await db.query('SELECT * FROM user_medications')).rows[0]
    assert.equal(row.combination_ingredients, null)
    assert.equal(row.dosage, 'fictional existing strength')
    assert.equal(row.frequency, 'Once weekly')
    assert.deepEqual((await db.query('SELECT * FROM medication_logs')).rows, before)
    await db.query('UPDATE user_medications SET combination_ingredients = $1::jsonb WHERE id=1', [JSON.stringify([
      { name: 'Fictional ingredient A', dosage: 'label strength A', medication_id: null },
      { name: 'Fictional ingredient B', dosage: 'label strength B', medication_id: null }
    ])])
    assert.equal((await db.query('SELECT combination_ingredients FROM user_medications')).rows[0].combination_ingredients.length, 2)
  } finally { await db.close() }
})

test('combined owner handoff is atomic, additive and idempotent with both nullable fields', async () => {
  const db = await fixture()
  try {
    const before = (await db.query('SELECT * FROM medication_logs')).rows
    const sql = await loadSql('add_medication_scheduling_and_ingredients.sql')
    await db.exec(sql)
    await db.exec(sql)
    const row = (await db.query('SELECT * FROM user_medications')).rows[0]
    assert.equal(row.scheduled_weekdays, null)
    assert.equal(row.combination_ingredients, null)
    assert.equal(row.dosage, 'fictional existing strength')
    assert.equal(row.frequency, 'Once weekly')
    assert.deepEqual((await db.query('SELECT * FROM medication_logs')).rows, before)
  } finally { await db.close() }
})
