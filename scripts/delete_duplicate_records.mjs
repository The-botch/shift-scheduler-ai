#!/usr/bin/env node

/**
 * データが紐付いていない重複レコードを削除
 */

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

// 削除する7名のID（データが0件の方）
const idsToDelete = [
  { id: 1225, name: '高田 久瑠美', code: 'STAFF_032', keep_id: 1208 },
  { id: 1226, name: '吉田 莉乃', code: 'STAFF_033', keep_id: 1209 },
  { id: 1232, name: '武根 太一', code: 'STAFF_039', keep_id: 1216 },
  { id: 1235, name: '甲木 由紀', code: 'STAFF_042', keep_id: 1233 },
  { id: 1236, name: '佐々 美音', code: 'STAFF_043', keep_id: 1201 },
  { id: 1241, name: '相模 純平', code: 'STAFF_048', keep_id: 1215 },
  { id: 1242, name: '橋本 勇人', code: 'STAFF_049', keep_id: 1239 },
];

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('重複レコードの削除（物理削除）');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('実行前の状態を確認...\n');

const beforeTotal = await client.query(`
  SELECT COUNT(*) as count
  FROM hr.staff
  WHERE tenant_id = 3
`);
const beforeActive = await client.query(`
  SELECT COUNT(*) as count
  FROM hr.staff
  WHERE tenant_id = 3 AND is_active = TRUE
`);
console.log(`総スタッフ数: ${beforeTotal.rows[0].count}名`);
console.log(`アクティブスタッフ: ${beforeActive.rows[0].count}名\n`);

console.log('削除対象のレコードにデータが紐付いていないことを確認...\n');

for (const staff of idsToDelete) {
  const shifts = await client.query(
    'SELECT COUNT(*) as count FROM ops.shifts WHERE staff_id = $1',
    [staff.id]
  );
  const prefs = await client.query(
    'SELECT COUNT(*) as count FROM ops.shift_preferences WHERE staff_id = $1',
    [staff.id]
  );
  const skills = await client.query(
    'SELECT COUNT(*) as count FROM hr.staff_skills WHERE staff_id = $1',
    [staff.id]
  );
  const certs = await client.query(
    'SELECT COUNT(*) as count FROM hr.staff_certifications WHERE staff_id = $1',
    [staff.id]
  );

  const total =
    parseInt(shifts.rows[0].count) +
    parseInt(prefs.rows[0].count) +
    parseInt(skills.rows[0].count) +
    parseInt(certs.rows[0].count);

  console.log(`  ${staff.name} (${staff.code}, ID: ${staff.id}): ${total}件のデータ`);

  if (total > 0) {
    console.log(`    ⚠️  データが存在します！削除を中止します。`);
    await client.end();
    process.exit(1);
  }
}

console.log('\n✅ 全レコードにデータが紐付いていないことを確認\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('削除処理開始');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  await client.query('BEGIN');

  for (const staff of idsToDelete) {
    await client.query(
      'DELETE FROM hr.staff WHERE staff_id = $1',
      [staff.id]
    );
    console.log(`✅ ${staff.name} (${staff.code}, ID: ${staff.id}) を削除 → 残: ${staff.keep_id}`);
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

const afterTotal = await client.query(`
  SELECT COUNT(*) as count
  FROM hr.staff
  WHERE tenant_id = 3
`);
const afterActive = await client.query(`
  SELECT COUNT(*) as count
  FROM hr.staff
  WHERE tenant_id = 3 AND is_active = TRUE
`);
const afterInactive = await client.query(`
  SELECT COUNT(*) as count
  FROM hr.staff
  WHERE tenant_id = 3 AND is_active = FALSE
`);

console.log(`総スタッフ数: ${afterTotal.rows[0].count}名 (削除: -${parseInt(beforeTotal.rows[0].count) - parseInt(afterTotal.rows[0].count)})`);
console.log(`アクティブスタッフ: ${afterActive.rows[0].count}名`);
console.log(`非アクティブスタッフ: ${afterInactive.rows[0].count}名\n`);

// 重複チェック
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('重複チェック');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const duplicateCheck = await client.query(`
  SELECT
    REPLACE(REPLACE(name, ' ', ''), '　', '') as normalized_name,
    COUNT(*) as count
  FROM hr.staff
  WHERE tenant_id = 3 AND is_active = TRUE
  GROUP BY REPLACE(REPLACE(name, ' ', ''), '　', '')
  HAVING COUNT(*) > 1
`);

if (duplicateCheck.rows.length > 0) {
  console.log(`⚠️  重複が見つかりました: ${duplicateCheck.rows.length}組\n`);
} else {
  console.log('✅ 重複なし！全スタッフが一意になりました。\n');
}

console.log('✅ 重複レコードの削除が完了しました！\n');

await client.end();
