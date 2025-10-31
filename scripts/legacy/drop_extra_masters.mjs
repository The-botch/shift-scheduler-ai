#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL未設定');
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

console.log('🗑️  不要な3マスターテーブル削除中...\n');

await client.query('DROP TABLE IF EXISTS core.certifications CASCADE;');
console.log('✅ core.certifications 削除');

await client.query('DROP TABLE IF EXISTS ops.required_certifications_rules CASCADE;');
console.log('✅ ops.required_certifications_rules 削除');

await client.query('DROP TABLE IF EXISTS audit.safety_checklist_master CASCADE;');
console.log('✅ audit.safety_checklist_master 削除');

await client.query('DROP SCHEMA IF EXISTS audit CASCADE;');
console.log('✅ auditスキーマ削除（空になったため）');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 残ったマスターテーブル確認');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const result = await client.query(`
  SELECT schemaname, COUNT(*) as count
  FROM pg_tables
  WHERE schemaname IN ('core', 'hr', 'ops')
  GROUP BY schemaname
  ORDER BY schemaname;
`);

for (const row of result.rows) {
  console.log(`  ${row.schemaname}: ${row.count}テーブル`);
}

const total = await client.query(`
  SELECT COUNT(*) as total
  FROM pg_tables
  WHERE schemaname IN ('core', 'hr', 'ops');
`);

console.log(`\n合計: ${total.rows[0].total}テーブル\n`);

// テーブル一覧表示
const tables = await client.query(`
  SELECT schemaname, tablename
  FROM pg_tables
  WHERE schemaname IN ('core', 'hr', 'ops')
  ORDER BY schemaname, tablename;
`);

const bySchema = {};
for (const row of tables.rows) {
  if (!bySchema[row.schemaname]) bySchema[row.schemaname] = [];
  bySchema[row.schemaname].push(row.tablename);
}

for (const [schema, tableList] of Object.entries(bySchema)) {
  console.log(`${schema}スキーマ (${tableList.length}テーブル):`);
  tableList.forEach((t, i) => console.log(`  ${i+1}. ${schema}.${t}`));
  console.log('');
}

await client.end();
