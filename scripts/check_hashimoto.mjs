#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

console.log('=== 橋本優人さんの調査 ===\n');

// 1. スタッフマスタに存在するか
const staff = await client.query(`
  SELECT * FROM hr.staff WHERE name LIKE '%橋本%' OR name LIKE '%優人%'
`);

console.log('1. スタッフマスタ検索結果:');
console.table(staff.rows);

if (staff.rows.length > 0) {
  const staffId = staff.rows[0].staff_id;
  const tenantId = staff.rows[0].tenant_id;

  // 2. 11月のシフトデータがあるか
  console.log('\n2. 11月のシフトデータ:');
  const shifts = await client.query(`
    SELECT s.*, sp.plan_name, sp.status
    FROM ops.shifts s
    JOIN ops.shift_plans sp ON s.plan_id = sp.plan_id
    WHERE s.staff_id = $1 AND s.tenant_id = $2
      AND EXTRACT(YEAR FROM s.shift_date) = 2024
      AND EXTRACT(MONTH FROM s.shift_date) = 11
    ORDER BY s.shift_date
  `, [staffId, tenantId]);

  console.table(shifts.rows);

  // 3. is_activeフラグの確認
  console.log('\n3. スタッフステータス:');
  console.log('is_active:', staff.rows[0].is_active);
  console.log('employment_type:', staff.rows[0].employment_type);
  console.log('hire_date:', staff.rows[0].hire_date);
  console.log('termination_date:', staff.rows[0].termination_date);
}

// 4. 全スタッフ数を確認（tenant_id=3）
const allStaff = await client.query(`
  SELECT COUNT(*) as total,
         COUNT(*) FILTER (WHERE is_active = true) as active,
         COUNT(*) FILTER (WHERE is_active = false) as inactive
  FROM hr.staff WHERE tenant_id = 3
`);

console.log('\n4. tenant_id=3 のスタッフ統計:');
console.table(allStaff.rows);

await client.end();
