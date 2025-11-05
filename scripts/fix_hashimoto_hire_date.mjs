#!/usr/bin/env node

/**
 * 橋本勇人さんの入社日を2025-11-01から2024-11-01に修正
 */

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

console.log('橋本勇人さんの入社日を修正します...\n');

try {
  await client.query('BEGIN');

  // 修正前の状態を確認
  const before = await client.query(`
    SELECT staff_id, name, hire_date, is_active
    FROM hr.staff
    WHERE name LIKE '%橋本%' AND tenant_id = 3
  `);

  console.log('修正前:');
  console.table(before.rows);

  // 入社日を2024-11-01に修正
  const result = await client.query(`
    UPDATE hr.staff
    SET hire_date = '2024-11-01'
    WHERE name LIKE '%橋本%' AND tenant_id = 3
    RETURNING staff_id, name, hire_date
  `);

  console.log('\n修正後:');
  console.table(result.rows);

  await client.query('COMMIT');
  console.log('\n✅ 入社日を修正しました');

} catch (error) {
  await client.query('ROLLBACK');
  console.error('❌ エラー:', error);
  throw error;
}

await client.end();
