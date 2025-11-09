#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway' });

await client.connect();

// 現在の状況
const all = await client.query(`
  SELECT staff_id, staff_code, name, is_active
  FROM hr.staff
  WHERE tenant_id = 3
  ORDER BY staff_id
`);

console.log('全スタッフ数:', all.rows.length);
console.log('アクティブ:', all.rows.filter(s => s.is_active).length);
console.log('非アクティブ:', all.rows.filter(s => !s.is_active).length);
console.log('');

// 重複チェック
const normalized = {};
for (const staff of all.rows) {
  const norm = staff.name.replace(/\s+/g, '').replace(/　+/g, '');
  if (!normalized[norm]) normalized[norm] = [];
  normalized[norm].push(staff);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('重複している名前:');
let hasDuplicates = false;
for (const [name, staffs] of Object.entries(normalized)) {
  if (staffs.length > 1) {
    hasDuplicates = true;
    console.log(`\n【${name}】`);
    for (const s of staffs) {
      console.log(`  - ${s.staff_code} (ID: ${s.staff_id}, active: ${s.is_active})`);
    }
  }
}

if (!hasDuplicates) {
  console.log('(重複なし)');
}

await client.end();
