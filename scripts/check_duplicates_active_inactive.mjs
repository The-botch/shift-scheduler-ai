#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

// アクティブスタッフ取得
const activeResult = await client.query(`
  SELECT staff_id, staff_code, name, REPLACE(REPLACE(name, ' ', ''), '　', '') as normalized_name
  FROM hr.staff
  WHERE tenant_id = 3 AND is_active = TRUE
  ORDER BY staff_id
`);

// 非アクティブスタッフ取得
const inactiveResult = await client.query(`
  SELECT staff_id, staff_code, name, REPLACE(REPLACE(name, ' ', ''), '　', '') as normalized_name
  FROM hr.staff
  WHERE tenant_id = 3 AND is_active = FALSE
  ORDER BY staff_id
`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('アクティブと非アクティブの重複チェック');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`アクティブスタッフ: ${activeResult.rows.length}名`);
console.log(`非アクティブスタッフ: ${inactiveResult.rows.length}名\n`);

// 正規化された名前で重複をチェック
const activeNames = new Map();
activeResult.rows.forEach(staff => {
  activeNames.set(staff.normalized_name, staff);
});

const duplicates = [];
inactiveResult.rows.forEach(inactiveStaff => {
  if (activeNames.has(inactiveStaff.normalized_name)) {
    const activeStaff = activeNames.get(inactiveStaff.normalized_name);
    duplicates.push({
      name: inactiveStaff.normalized_name,
      active: activeStaff,
      inactive: inactiveStaff
    });
  }
});

if (duplicates.length > 0) {
  console.log(`⚠️  重複発見: ${duplicates.length}組\n`);

  duplicates.forEach((dup, idx) => {
    console.log(`【${idx + 1}. ${dup.name}】`);
    console.log(`  アクティブ:   ${dup.active.staff_code} (ID: ${dup.active.staff_id}) - ${dup.active.name}`);
    console.log(`  非アクティブ: ${dup.inactive.staff_code} (ID: ${dup.inactive.staff_id}) - ${dup.inactive.name}`);
    console.log('');
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('推奨アクション');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('これらの非アクティブレコードは重複統合時に作成された古いレコードです。');
  console.log('アクティブな方が正しいレコードなので、非アクティブレコードはそのままで問題ありません。\n');
} else {
  console.log('✅ 重複なし！');
  console.log('アクティブスタッフと非アクティブスタッフの間に名前の重複はありません。\n');
}

await client.end();
