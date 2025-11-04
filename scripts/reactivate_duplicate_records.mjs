#!/usr/bin/env node

/**
 * 重複統合で非アクティブにした7名のレコードを再アクティブ化
 */

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

// 再アクティブ化する7名のID
const idsToReactivate = [
  { id: 1225, name: '高田 久瑠美', code: 'STAFF_032' },
  { id: 1226, name: '吉田 莉乃', code: 'STAFF_033' },
  { id: 1232, name: '武根 太一', code: 'STAFF_039' },
  { id: 1235, name: '甲木 由紀', code: 'STAFF_042' },
  { id: 1236, name: '佐々 美音', code: 'STAFF_043' },
  { id: 1241, name: '相模 純平', code: 'STAFF_048' },
  { id: 1242, name: '橋本 勇人', code: 'STAFF_049' },
];

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('重複統合レコードの再アクティブ化');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('実行前の状態を確認...\n');

const beforeActive = await client.query(`
  SELECT COUNT(*) as count
  FROM hr.staff
  WHERE tenant_id = 3 AND is_active = TRUE
`);
console.log(`アクティブスタッフ: ${beforeActive.rows[0].count}名\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('再アクティブ化処理開始');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  await client.query('BEGIN');

  for (const staff of idsToReactivate) {
    await client.query(
      'UPDATE hr.staff SET is_active = TRUE WHERE staff_id = $1',
      [staff.id]
    );
    console.log(`✅ ${staff.name} (${staff.code}, ID: ${staff.id}) を再アクティブ化`);
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

console.log(`アクティブスタッフ: ${afterActive.rows[0].count}名 (変更: +${parseInt(afterActive.rows[0].count) - parseInt(beforeActive.rows[0].count)})`);
console.log(`非アクティブスタッフ: ${afterInactive.rows[0].count}名\n`);

// 重複チェック
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('アクティブスタッフの重複チェック');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const duplicateCheck = await client.query(`
  SELECT
    REPLACE(REPLACE(name, ' ', ''), '　', '') as normalized_name,
    COUNT(*) as count,
    ARRAY_AGG(staff_id ORDER BY staff_id) as staff_ids,
    ARRAY_AGG(staff_code ORDER BY staff_id) as staff_codes
  FROM hr.staff
  WHERE tenant_id = 3 AND is_active = TRUE
  GROUP BY REPLACE(REPLACE(name, ' ', ''), '　', '')
  HAVING COUNT(*) > 1
  ORDER BY normalized_name
`);

if (duplicateCheck.rows.length > 0) {
  console.log(`⚠️  重複が見つかりました: ${duplicateCheck.rows.length}組\n`);
  duplicateCheck.rows.forEach((dup, idx) => {
    console.log(`${idx + 1}. ${dup.normalized_name}`);
    console.log(`   スタッフID: ${dup.staff_ids.join(', ')}`);
    console.log(`   スタッフコード: ${dup.staff_codes.join(', ')}`);
    console.log('');
  });
  console.log('これは想定通りです。同じ人が2つのアクティブレコードを持つことになります。');
} else {
  console.log('✅ 重複なし');
}

console.log('\n✅ 再アクティブ化が完了しました！\n');

await client.end();
