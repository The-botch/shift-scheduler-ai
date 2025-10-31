#!/usr/bin/env node

import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL未設定');
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

console.log('🗑️  トランザクションテーブル削除開始...\n');

const sql = fs.readFileSync('scripts/db/drop_transaction_tables.sql', 'utf8');
await client.query(sql);

console.log('\n✅ 削除完了！\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 残ったマスターテーブル一覧');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const result = await client.query(`
  SELECT schemaname, tablename
  FROM pg_tables
  WHERE schemaname IN ('core', 'hr', 'ops', 'audit')
  ORDER BY schemaname, tablename;
`);

const bySchema = {};
for (const row of result.rows) {
  if (!bySchema[row.schemaname]) bySchema[row.schemaname] = [];
  bySchema[row.schemaname].push(row.tablename);
}

for (const [schema, tables] of Object.entries(bySchema)) {
  console.log(`${schema}スキーマ (${tables.length}テーブル):`);
  tables.forEach((t, i) => console.log(`  ${i+1}. ${schema}.${t}`));
  console.log('');
}

console.log(`合計: ${result.rows.length}テーブル\n`);

await client.end();
