#!/usr/bin/env node

/**
 * 労務管理ルールとシフト検証ルールをtenant_id = 3にコピー
 * （労働法制約は既にコピー済み）
 */

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('残りのデータをコピー (tenant 1 → 3)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  await client.query('BEGIN');

  // 労務管理ルール
  console.log('1. 労務管理ルールをコピー中...');

  // 最大rule_idを取得
  const maxRuleId = await client.query('SELECT COALESCE(MAX(rule_id::integer), 0) as max_id FROM ops.labor_management_rules');
  const startId = parseInt(maxRuleId.rows[0].max_id) + 1;

  const laborRules = await client.query(`
    INSERT INTO ops.labor_management_rules (
      rule_id, tenant_id, category, rule_type, description, threshold_value, unit,
      evaluation_period, action_type, priority, auto_check, notes, is_active
    )
    SELECT
      ROW_NUMBER() OVER () + $1 - 1 as rule_id,
      3 as tenant_id, category, rule_type, description, threshold_value, unit,
      evaluation_period, action_type, priority, auto_check, notes, is_active
    FROM ops.labor_management_rules
    WHERE tenant_id = 1
    RETURNING rule_id, category, rule_type
  `, [startId]);
  console.log(`✅ ${laborRules.rows.length}件コピーしました`);

  // シフト検証ルール
  console.log('\n2. シフト検証ルールをコピー中...');

  // 最大rule_idを取得
  const maxValidationId = await client.query('SELECT COALESCE(MAX(rule_id::integer), 0) as max_id FROM ops.shift_validation_rules');
  const startValidationId = parseInt(maxValidationId.rows[0].max_id) + 1;

  const validationRules = await client.query(`
    INSERT INTO ops.shift_validation_rules (
      rule_id, tenant_id, rule_code, rule_name, severity, is_active
    )
    SELECT
      ROW_NUMBER() OVER () + $1 - 1 as rule_id,
      3 as tenant_id, rule_code, rule_name, severity, is_active
    FROM ops.shift_validation_rules
    WHERE tenant_id = 1
    RETURNING rule_id, rule_name
  `, [startValidationId]);
  console.log(`✅ ${validationRules.rows.length}件コピーしました`);

  await client.query('COMMIT');
  console.log('\n✅ トランザクションをコミットしました\n');

  // 最終確認
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('コピー後のデータ確認 (tenant_id = 3)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM ops.labor_law_constraints WHERE tenant_id = 3) as labor_law,
      (SELECT COUNT(*) FROM ops.labor_management_rules WHERE tenant_id = 3) as labor_rules,
      (SELECT COUNT(*) FROM ops.shift_validation_rules WHERE tenant_id = 3) as validation_rules
  `);

  console.log('労働法制約:', counts.rows[0].labor_law, '件');
  console.log('労務管理ルール:', counts.rows[0].labor_rules, '件');
  console.log('シフト検証ルール:', counts.rows[0].validation_rules, '件');

  console.log('\n✅ すべてのデータコピーが完了しました!\n');

} catch (error) {
  await client.query('ROLLBACK');
  console.error('\n❌ エラーが発生しました:', error.message);
  throw error;
}

await client.end();
