#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

console.log('📋 スタッフマスター一覧\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const result = await client.query(`
  SELECT
    s.staff_id,
    s.staff_code,
    s.name,
    s.employment_type,
    s.hire_date,
    s.hourly_rate,
    s.monthly_salary,
    s.email,
    s.phone_number,
    r.role_name,
    st.store_name,
    s.is_active
  FROM hr.staff s
  LEFT JOIN core.roles r ON s.role_id = r.role_id
  LEFT JOIN core.stores st ON s.store_id = st.store_id
  ORDER BY s.staff_id;
`);

for (const row of result.rows) {
  console.log(`ID: ${row.staff_id} | コード: ${row.staff_code}`);
  console.log(`  名前: ${row.name}`);
  console.log(`  役職: ${row.role_name}`);
  console.log(`  店舗: ${row.store_name}`);
  console.log(`  雇用形態: ${row.employment_type}`);
  console.log(`  入社日: ${row.hire_date}`);
  console.log(`  時給: ${row.hourly_rate ? row.hourly_rate + '円' : 'なし'}`);
  console.log(`  月給: ${row.monthly_salary ? row.monthly_salary + '円' : 'なし'}`);
  console.log(`  メール: ${row.email || 'なし'}`);
  console.log(`  電話: ${row.phone_number || 'なし'}`);
  console.log(`  有効: ${row.is_active ? 'はい' : 'いいえ'}`);
  console.log('');
}

console.log(`合計: ${result.rows.length}人\n`);

await client.end();
