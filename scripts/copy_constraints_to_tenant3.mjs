#!/usr/bin/env node

/**
 * tenant_id = 1の制約・ルールデータをtenant_id = 3にコピー
 */

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('制約・ルールデータのコピー (tenant 1 → 3)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  await client.query('BEGIN');

  // 1. 労働法制約
  console.log('1. 労働法制約をコピー中...');
  const laborLaw = await client.query(`
    INSERT INTO ops.labor_law_constraints (
      tenant_id, constraint_code, constraint_name, value, unit, description, is_active
    )
    SELECT
      3 as tenant_id, constraint_code, constraint_name, value, unit, description, is_active
    FROM ops.labor_law_constraints
    WHERE tenant_id = 1
    RETURNING constraint_id, constraint_name
  `);
  console.log(`✅ ${laborLaw.rows.length}件コピーしました`);
  laborLaw.rows.forEach(row => console.log(`   - ${row.constraint_name}`));

  // 2. 店舗制約（スキップ - store_idのマッピングが必要）
  console.log('\n2. 店舗制約をスキップ（store_idのマッピングが必要なため）');

  // 3. 労務管理ルール
  console.log('\n3. 労務管理ルールをコピー中...');
  const laborRules = await client.query(`
    INSERT INTO ops.labor_management_rules (
      tenant_id, category, rule_type, description, threshold_value, unit,
      evaluation_period, action_type, priority, auto_check, notes, is_active
    )
    SELECT
      3 as tenant_id, category, rule_type, description, threshold_value, unit,
      evaluation_period, action_type, priority, auto_check, notes, is_active
    FROM ops.labor_management_rules
    WHERE tenant_id = 1
    RETURNING rule_id, category, rule_type
  `);
  console.log(`✅ ${laborRules.rows.length}件コピーしました`);
  laborRules.rows.forEach(row => console.log(`   - ${row.category}: ${row.rule_type}`));

  // 4. シフト検証ルール
  console.log('\n4. シフト検証ルールをコピー中...');
  const validationRules = await client.query(`
    INSERT INTO ops.shift_validation_rules (
      tenant_id, rule_code, rule_name, severity, is_active
    )
    SELECT
      3 as tenant_id, rule_code, rule_name, severity, is_active
    FROM ops.shift_validation_rules
    WHERE tenant_id = 1
    RETURNING rule_id, rule_name
  `);
  console.log(`✅ ${validationRules.rows.length}件コピーしました`);
  validationRules.rows.forEach(row => console.log(`   - ${row.rule_name}`));

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
  console.error('\n❌ エラーが発生しました:', error);
  throw error;
}

await client.end();
