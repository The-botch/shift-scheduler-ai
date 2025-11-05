#!/usr/bin/env node

/**
 * tenant_id = 1のサンプルデータをシンプルな表形式で表示
 */

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('tenant_id = 1 のサンプルデータ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  // 1. 労働法制約
  console.log('【1. 労働法制約 (12件)】');
  const laborLaw = await client.query(`
    SELECT constraint_code, constraint_name, value
    FROM ops.labor_law_constraints
    WHERE tenant_id = 1
    ORDER BY constraint_id
  `);
  laborLaw.rows.forEach((row, i) => {
    console.log(`${i+1}. ${row.constraint_code} | ${row.constraint_name} | ${row.value}`);
  });

  // 2. 店舗制約
  console.log('\n【2. 店舗制約 (6件)】');
  const storeConstraints = await client.query(`
    SELECT store_id, constraint_type
    FROM ops.store_constraints
    WHERE tenant_id = 1
    ORDER BY store_constraint_id
  `);
  storeConstraints.rows.forEach((row, i) => {
    console.log(`${i+1}. store_id=${row.store_id} | ${row.constraint_type}`);
  });

  // 3. 労務管理ルール
  console.log('\n【3. 労務管理ルール (15件)】');
  const laborRules = await client.query(`
    SELECT rule_id, category, rule_type, threshold_value, unit
    FROM ops.labor_management_rules
    WHERE tenant_id = 1
    ORDER BY rule_id
  `);
  laborRules.rows.forEach((row, i) => {
    console.log(`${i+1}. ${row.rule_id} | ${row.category} | ${row.rule_type} | ${row.threshold_value} ${row.unit}`);
  });

  // 4. シフト検証ルール
  console.log('\n【4. シフト検証ルール (15件)】');
  const validationRules = await client.query(`
    SELECT rule_id, rule_code, rule_name, severity
    FROM ops.shift_validation_rules
    WHERE tenant_id = 1
    ORDER BY rule_id
  `);
  validationRules.rows.forEach((row, i) => {
    console.log(`${i+1}. ID=${row.rule_id} | ${row.rule_code} | ${row.rule_name} | ${row.severity}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

} catch (error) {
  console.error('\n❌ エラーが発生しました:', error.message);
  throw error;
}

await client.end();
