#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

// shift_validation_rulesのPK確認
const pk = await client.query(`
  SELECT constraint_name, column_name
  FROM information_schema.key_column_usage
  WHERE table_schema = 'ops' AND table_name = 'shift_validation_rules'
  ORDER BY ordinal_position
`);
console.log('shift_validation_rules PK:', pk.rows);

// 既存データ確認
const existing = await client.query(`
  SELECT rule_id, tenant_id, rule_code, rule_name FROM ops.shift_validation_rules ORDER BY rule_id
`);
console.log('\n既存データ:');
console.table(existing.rows);

await client.end();
