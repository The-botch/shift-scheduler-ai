#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

const result = await client.query(`
  SELECT staff_id, staff_code, name, is_active, store_id
  FROM hr.staff
  WHERE tenant_id = 3 AND is_active = FALSE
  ORDER BY name
`);

console.log(`現在非アクティブなスタッフ（${result.rows.length}名）:`);
console.log('━━━━━━━━━━━━━━━━━━━━━━');
for (const s of result.rows) {
  console.log(`${s.name} (${s.staff_code})`);
}

await client.end();
