#!/usr/bin/env node

/**
 * 役職マスタを更新
 * アルバイト/社員 → 店長/一般スタッフ/トライアル
 */

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('役職マスタの更新');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('実行前の役職マスタ:');
const before = await client.query(`
  SELECT role_id, role_code, role_name, is_active
  FROM core.roles
  WHERE tenant_id = 3
  ORDER BY role_id
`);
console.table(before.rows);

console.log('\n現在のスタッフの役職分布:');
const distribution = await client.query(`
  SELECT r.role_name, COUNT(*) as count
  FROM hr.staff s
  JOIN core.roles r ON s.role_id = r.role_id
  WHERE s.tenant_id = 3 AND s.is_active = true
  GROUP BY r.role_name
  ORDER BY count DESC
`);
console.table(distribution.rows);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('更新処理開始');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  await client.query('BEGIN');

  // 既存の役職を更新（STAFFを一般スタッフに）
  await client.query(`
    UPDATE core.roles
    SET role_name = '一般スタッフ'
    WHERE tenant_id = 3 AND role_code = 'STAFF'
  `);
  console.log('✅ STAFF → 一般スタッフ に変更');

  // 既存の役職を更新（SENIORを店長に）
  await client.query(`
    UPDATE core.roles
    SET role_name = '店長'
    WHERE tenant_id = 3 AND role_code = 'SENIOR'
  `);
  console.log('✅ SENIOR → 店長 に変更');

  // 新しい役職を追加（トライアル）
  const trialExists = await client.query(`
    SELECT role_id FROM core.roles
    WHERE tenant_id = 3 AND role_code = 'TRIAL'
  `);

  if (trialExists.rows.length === 0) {
    await client.query(`
      INSERT INTO core.roles (tenant_id, role_code, role_name, display_order, is_active)
      VALUES (3, 'TRIAL', 'トライアル', 0, true)
    `);
    console.log('✅ TRIAL → トライアル を追加');
  } else {
    console.log('⚠️  トライアルは既に存在します');
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

console.log('更新後の役職マスタ:');
const after = await client.query(`
  SELECT role_id, role_code, role_name, is_active
  FROM core.roles
  WHERE tenant_id = 3
  ORDER BY role_id
`);
console.table(after.rows);

console.log('\n更新後のスタッフの役職分布:');
const distributionAfter = await client.query(`
  SELECT r.role_name, COUNT(*) as count
  FROM hr.staff s
  JOIN core.roles r ON s.role_id = r.role_id
  WHERE s.tenant_id = 3 AND s.is_active = true
  GROUP BY r.role_name
  ORDER BY count DESC
`);
console.table(distributionAfter.rows);

console.log('\n✅ 役職マスタの更新が完了しました!\n');

await client.end();
