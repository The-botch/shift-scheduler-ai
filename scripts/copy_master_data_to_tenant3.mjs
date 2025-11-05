#!/usr/bin/env node

/**
 * tenant_id = 1のマスターデータをtenant_id = 3にコピー
 * - 労働法制約: そのままコピー
 * - 労務管理ルール: rule_idを数値型に変更してコピー
 * - シフト検証ルール: rule_idを数値型に変更してコピー
 * - 店舗制約: tenant_id=3の店舗数分コピー
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
    ON CONFLICT (tenant_id, constraint_code) DO NOTHING
    RETURNING constraint_code
  `);
  console.log(`✅ ${laborLaw.rows.length}件コピーしました`);

  // 2. 労務管理ルール (rule_idを数値型に変換)
  console.log('\n2. 労務管理ルールをコピー中...');

  // 既存の最大rule_idを取得
  const maxLaborRule = await client.query(`
    SELECT COALESCE(MAX(rule_id::integer), 0) as max_id
    FROM ops.labor_management_rules
    WHERE tenant_id = 3 AND rule_id ~ '^[0-9]+$'
  `);
  let laborRuleStartId = parseInt(maxLaborRule.rows[0].max_id) + 1;

  const sourceLaborRules = await client.query(`
    SELECT * FROM ops.labor_management_rules WHERE tenant_id = 1 ORDER BY rule_id
  `);

  for (const rule of sourceLaborRules.rows) {
    await client.query(`
      INSERT INTO ops.labor_management_rules (
        rule_id, tenant_id, category, rule_type, description, threshold_value, unit,
        evaluation_period, action_type, priority, auto_check, notes, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      laborRuleStartId.toString(),
      3,
      rule.category,
      rule.rule_type,
      rule.description,
      rule.threshold_value,
      rule.unit,
      rule.evaluation_period,
      rule.action_type,
      rule.priority,
      rule.auto_check,
      rule.notes,
      rule.is_active
    ]);
    laborRuleStartId++;
  }
  console.log(`✅ ${sourceLaborRules.rows.length}件コピーしました (rule_id: ${laborRuleStartId - sourceLaborRules.rows.length} ~ ${laborRuleStartId - 1})`);

  // 3. シフト検証ルール (rule_idを数値型に変換)
  console.log('\n3. シフト検証ルールをコピー中...');

  // 全tenant中の最大rule_idを取得（PKがrule_idのみのため）
  const maxValidationRule = await client.query(`
    SELECT COALESCE(MAX(rule_id), 0) as max_id
    FROM ops.shift_validation_rules
  `);
  let validationRuleStartId = parseInt(maxValidationRule.rows[0].max_id) + 1;

  const sourceValidationRules = await client.query(`
    SELECT * FROM ops.shift_validation_rules WHERE tenant_id = 1 ORDER BY rule_id
  `);

  for (const rule of sourceValidationRules.rows) {
    await client.query(`
      INSERT INTO ops.shift_validation_rules (
        rule_id, tenant_id, rule_code, rule_name, severity, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      validationRuleStartId,
      3,
      rule.rule_code,
      rule.rule_name,
      rule.severity,
      rule.is_active
    ]);
    validationRuleStartId++;
  }
  console.log(`✅ ${sourceValidationRules.rows.length}件コピーしました (rule_id: ${validationRuleStartId - sourceValidationRules.rows.length} ~ ${validationRuleStartId - 1})`);

  // 4. 店舗制約 (tenant_id=3の店舗数分コピー)
  console.log('\n4. 店舗制約をコピー中...');

  // tenant_id=3の店舗一覧を取得
  const tenant3Stores = await client.query(`
    SELECT store_id FROM core.stores WHERE tenant_id = 3 ORDER BY store_id
  `);

  if (tenant3Stores.rows.length === 0) {
    console.log('⚠️ tenant_id=3に店舗が存在しないためスキップ');
  } else {
    console.log(`   tenant_id=3の店舗: ${tenant3Stores.rows.map(s => s.store_id).join(', ')}`);

    // tenant_id=1のstore_id=1の制約を取得
    const sourceConstraints = await client.query(`
      SELECT * FROM ops.store_constraints WHERE tenant_id = 1 AND store_id = 1 ORDER BY store_constraint_id
    `);

    let copiedConstraints = 0;
    for (const store of tenant3Stores.rows) {
      for (const constraint of sourceConstraints.rows) {
        await client.query(`
          INSERT INTO ops.store_constraints (
            tenant_id, store_id, constraint_type, constraint_value, is_active
          )
          VALUES ($1, $2, $3, $4, $5)
        `, [
          3,
          store.store_id,
          constraint.constraint_type,
          constraint.constraint_value,
          constraint.is_active
        ]);
        copiedConstraints++;
      }
    }
    console.log(`✅ ${copiedConstraints}件コピーしました (${tenant3Stores.rows.length}店舗 × ${sourceConstraints.rows.length}制約)`);
  }

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
      (SELECT COUNT(*) FROM ops.shift_validation_rules WHERE tenant_id = 3) as validation_rules,
      (SELECT COUNT(*) FROM ops.store_constraints WHERE tenant_id = 3) as store_constraints
  `);

  console.log('労働法制約:', counts.rows[0].labor_law, '件');
  console.log('労務管理ルール:', counts.rows[0].labor_rules, '件');
  console.log('シフト検証ルール:', counts.rows[0].validation_rules, '件');
  console.log('店舗制約:', counts.rows[0].store_constraints, '件');

  console.log('\n✅ すべてのデータコピーが完了しました!\n');

} catch (error) {
  await client.query('ROLLBACK');
  console.error('\n❌ エラーが発生しました:', error.message);
  console.error(error);
  throw error;
}

await client.end();
