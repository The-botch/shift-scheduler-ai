#!/usr/bin/env node

/**
 * tenant_id = 1のマスターデータをtenant_id = 3にコピー
 * （store_idマッピング不要なものをすべてコピー）
 */

import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

await client.connect();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('マスターデータのコピー (tenant 1 → 3)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
  await client.query('BEGIN');

  // 1. 労働法制約（既存データは重複エラーになるがスキップ）
  console.log('1. 労働法制約をコピー中...');
  try {
    const laborLaw = await client.query(`
      INSERT INTO ops.labor_law_constraints (
        tenant_id, constraint_code, constraint_name, value, unit, description, is_active
      )
      SELECT
        3 as tenant_id, constraint_code, constraint_name, value, unit, description, is_active
      FROM ops.labor_law_constraints
      WHERE tenant_id = 1
      ON CONFLICT DO NOTHING
      RETURNING constraint_name
    `);
    console.log(`✅ ${laborLaw.rows.length}件コピーしました`);
  } catch (e) {
    console.log(`⚠️ スキップ（既にコピー済み）`);
  }

  // 2. 労務管理ルール
  console.log('\n2. 労務管理ルールをコピー中...');

  // 既存のrule_idを確認
  const existingRules = await client.query(`
    SELECT rule_id FROM ops.labor_management_rules WHERE tenant_id = 3
  `);
  const existingRuleIds = new Set(existingRules.rows.map(r => r.rule_id));

  // tenant_id=1のデータを取得
  const sourceRules = await client.query(`
    SELECT * FROM ops.labor_management_rules WHERE tenant_id = 1
  `);

  let copiedCount = 0;
  for (const rule of sourceRules.rows) {
    // 新しいrule_idを生成（LM001_T3のような形式）
    const newRuleId = `${rule.rule_id}_T3`;

    if (!existingRuleIds.has(newRuleId)) {
      await client.query(`
        INSERT INTO ops.labor_management_rules (
          rule_id, tenant_id, category, rule_type, description, threshold_value, unit,
          evaluation_period, action_type, priority, auto_check, notes, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        newRuleId, 3, rule.category, rule.rule_type, rule.description,
        rule.threshold_value, rule.unit, rule.evaluation_period, rule.action_type,
        rule.priority, rule.auto_check, rule.notes, rule.is_active
      ]);
      copiedCount++;
    }
  }
  console.log(`✅ ${copiedCount}件コピーしました`);

  // 3. シフト検証ルール
  console.log('\n3. シフト検証ルールをコピー中...');

  const existingValidation = await client.query(`
    SELECT rule_id FROM ops.shift_validation_rules WHERE tenant_id = 3
  `);
  const existingValidationIds = new Set(existingValidation.rows.map(r => r.rule_id));

  const sourceValidation = await client.query(`
    SELECT * FROM ops.shift_validation_rules WHERE tenant_id = 1
  `);

  let copiedValidationCount = 0;
  for (const rule of sourceValidation.rows) {
    const newRuleId = `${rule.rule_id}_T3`;

    if (!existingValidationIds.has(newRuleId)) {
      await client.query(`
        INSERT INTO ops.shift_validation_rules (
          rule_id, tenant_id, rule_code, rule_name, severity, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        newRuleId, 3, rule.rule_code, rule.rule_name, rule.severity, rule.is_active
      ]);
      copiedValidationCount++;
    }
  }
  console.log(`✅ ${copiedValidationCount}件コピーしました`);

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
  console.error(error);
  throw error;
}

await client.end();
