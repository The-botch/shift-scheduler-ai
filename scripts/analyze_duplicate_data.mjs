#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

// 7組の重複ペア
const duplicatePairs = [
  { name: '高田久瑠美', active_id: 1208, inactive_id: 1225 },
  { name: '吉田莉乃', active_id: 1209, inactive_id: 1226 },
  { name: '武根太一', active_id: 1216, inactive_id: 1232 },
  { name: '甲木由紀', active_id: 1233, inactive_id: 1235 },
  { name: '佐々美音', active_id: 1201, inactive_id: 1236 },
  { name: '相模純平', active_id: 1215, inactive_id: 1241 },
  { name: '橋本勇人', active_id: 1239, inactive_id: 1242 },
];

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('7組の重複レコードの関連データ分析');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

for (const pair of duplicatePairs) {
  console.log(`【${pair.name}】`);
  console.log(`  アクティブID: ${pair.active_id}`);
  console.log(`  非アクティブID: ${pair.inactive_id}\n`);

  // シフト数を確認
  const shiftsActive = await client.query(
    'SELECT COUNT(*) as count FROM ops.shifts WHERE staff_id = $1',
    [pair.active_id]
  );
  const shiftsInactive = await client.query(
    'SELECT COUNT(*) as count FROM ops.shifts WHERE staff_id = $1',
    [pair.inactive_id]
  );

  console.log(`  シフト数:`);
  console.log(`    アクティブID: ${shiftsActive.rows[0].count}件`);
  console.log(`    非アクティブID: ${shiftsInactive.rows[0].count}件`);

  // シフト希望を確認
  const prefsActive = await client.query(
    'SELECT COUNT(*) as count FROM ops.shift_preferences WHERE staff_id = $1',
    [pair.active_id]
  );
  const prefsInactive = await client.query(
    'SELECT COUNT(*) as count FROM ops.shift_preferences WHERE staff_id = $1',
    [pair.inactive_id]
  );

  console.log(`  シフト希望:`);
  console.log(`    アクティブID: ${prefsActive.rows[0].count}件`);
  console.log(`    非アクティブID: ${prefsInactive.rows[0].count}件`);

  // スキルを確認
  const skillsActive = await client.query(
    'SELECT COUNT(*) as count FROM hr.staff_skills WHERE staff_id = $1',
    [pair.active_id]
  );
  const skillsInactive = await client.query(
    'SELECT COUNT(*) as count FROM hr.staff_skills WHERE staff_id = $1',
    [pair.inactive_id]
  );

  console.log(`  スキル:`);
  console.log(`    アクティブID: ${skillsActive.rows[0].count}件`);
  console.log(`    非アクティブID: ${skillsInactive.rows[0].count}件`);

  // 資格を確認
  const certsActive = await client.query(
    'SELECT COUNT(*) as count FROM hr.staff_certifications WHERE staff_id = $1',
    [pair.active_id]
  );
  const certsInactive = await client.query(
    'SELECT COUNT(*) as count FROM hr.staff_certifications WHERE staff_id = $1',
    [pair.inactive_id]
  );

  console.log(`  資格:`);
  console.log(`    アクティブID: ${certsActive.rows[0].count}件`);
  console.log(`    非アクティブID: ${certsInactive.rows[0].count}件`);

  // 判定
  const totalActive =
    parseInt(shiftsActive.rows[0].count) +
    parseInt(prefsActive.rows[0].count) +
    parseInt(skillsActive.rows[0].count) +
    parseInt(certsActive.rows[0].count);

  const totalInactive =
    parseInt(shiftsInactive.rows[0].count) +
    parseInt(prefsInactive.rows[0].count) +
    parseInt(skillsInactive.rows[0].count) +
    parseInt(certsInactive.rows[0].count);

  console.log(`\n  💡 判定:`);
  if (totalInactive > 0) {
    console.log(`    ⚠️  非アクティブIDにもデータあり（合計${totalInactive}件）`);
    console.log(`    → 両方のIDのデータを統合する必要があります`);
  } else {
    console.log(`    ✅ 全データがアクティブIDに統合済み`);
    console.log(`    → 非アクティブIDをアクティブに戻すだけでOK`);
  }

  console.log('\n' + '─'.repeat(60) + '\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('サマリー');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

await client.end();
