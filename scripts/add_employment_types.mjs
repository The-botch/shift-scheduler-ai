#!/usr/bin/env node

/**
 * 雇用形態マスタに業務委託と契約社員を追加
 */

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('雇用形態マスタの更新');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('実行前の雇用形態マスタ:');
const before = await client.query(`
  SELECT employment_type_id, employment_code, employment_name, payment_type, is_active
  FROM core.employment_types
  WHERE tenant_id = 3
  ORDER BY employment_type_id
`);
console.table(before.rows);

console.log('\n現在のスタッフの雇用形態分布:');
const distribution = await client.query(`
  SELECT employment_type, COUNT(*) as count
  FROM hr.staff
  WHERE tenant_id = 3 AND is_active = true
  GROUP BY employment_type
  ORDER BY count DESC
`);
console.table(distribution.rows);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('更新処理開始');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  await client.query('BEGIN');

  // 契約社員を追加
  const contractExists = await client.query(`
    SELECT employment_type_id FROM core.employment_types
    WHERE tenant_id = 3 AND employment_code = 'CONTRACT'
  `);

  if (contractExists.rows.length === 0) {
    await client.query(`
      INSERT INTO core.employment_types (tenant_id, employment_code, employment_name, payment_type, display_order, is_active)
      VALUES (3, 'CONTRACT', '契約社員', 'MONTHLY', 2, true)
    `);
    console.log('✅ CONTRACT → 契約社員 を追加');
  } else {
    console.log('⚠️  契約社員は既に存在します');
  }

  // 業務委託を追加
  const freelanceExists = await client.query(`
    SELECT employment_type_id FROM core.employment_types
    WHERE tenant_id = 3 AND employment_code = 'FREELANCE'
  `);

  if (freelanceExists.rows.length === 0) {
    await client.query(`
      INSERT INTO core.employment_types (tenant_id, employment_code, employment_name, payment_type, display_order, is_active)
      VALUES (3, 'FREELANCE', '業務委託', 'HOURLY', 3, true)
    `);
    console.log('✅ FREELANCE → 業務委託 を追加');
  } else {
    console.log('⚠️  業務委託は既に存在します');
  }

  await client.query('COMMIT');
  console.log('\n✅ トランザクションをコミットしました\n');
} catch (error) {
  await client.query('ROLLBACK');
  console.error('\n❌ エラーが発生しました:', error);
  throw error;
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('実行後の状態');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('更新後の雇用形態マスタ:');
const after = await client.query(`
  SELECT employment_type_id, employment_code, employment_name, payment_type, is_active
  FROM core.employment_types
  WHERE tenant_id = 3
  ORDER BY display_order, employment_type_id
`);
console.table(after.rows);

console.log('\n✅ 雇用形態マスタの更新が完了しました!\n');

await client.end();
