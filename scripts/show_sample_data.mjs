#!/usr/bin/env node

/**
 * tenant_id = 1のサンプルデータを表形式で表示
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
  console.log('【1. 労働法制約 (ops.labor_law_constraints)】');
  const laborLaw = await client.query(`
    SELECT constraint_id, constraint_code, constraint_name, value, unit, description
    FROM ops.labor_law_constraints
    WHERE tenant_id = 1
    ORDER BY constraint_id
  `);
  console.table(laborLaw.rows);

  // 2. 店舗制約
  console.log('\n【2. 店舗制約 (ops.store_constraints)】');
  const storeConstraints = await client.query(`
    SELECT store_constraint_id, store_id, constraint_type, constraint_value::text
    FROM ops.store_constraints
    WHERE tenant_id = 1
    ORDER BY store_constraint_id
  `);
  console.table(storeConstraints.rows);

  // 3. 労務管理ルール
  console.log('\n【3. 労務管理ルール (ops.labor_management_rules)】');
  const laborRules = await client.query(`
    SELECT rule_id, category, rule_type, description, threshold_value, unit, evaluation_period, action_type, priority
    FROM ops.labor_management_rules
    WHERE tenant_id = 1
    ORDER BY rule_id
  `);
  console.table(laborRules.rows);

  // 4. シフト検証ルール
  console.log('\n【4. シフト検証ルール (ops.shift_validation_rules)】');
  const validationRules = await client.query(`
    SELECT rule_id, rule_code, rule_name, severity, is_active
    FROM ops.shift_validation_rules
    WHERE tenant_id = 1
    ORDER BY rule_id
  `);
  console.table(validationRules.rows);

} catch (error) {
  console.error('\n❌ エラーが発生しました:', error.message);
  throw error;
}

await client.end();
