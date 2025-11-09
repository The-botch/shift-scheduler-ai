import { query } from '../src/config/database.js';

async function updateStatusConstraint() {
  try {
    console.log('🚀 ステータス制約の更新開始');

    // 1. CHECK制約を先に削除（データ更新の前に）
    console.log('\n🔓 既存のCHECK制約を削除...');
    await query(`
      ALTER TABLE ops.shift_plans
      DROP CONSTRAINT IF EXISTS shift_plans_status_check
    `);
    console.log('  ✅ 削除完了');

    // 2. 既存データの更新
    console.log('\n📝 既存データの更新...');

    // SECOND_PLAN_APPROVED → plan_type='SECOND', status='APPROVED'
    console.log('  → SECOND_PLAN_APPROVED の修正...');
    const result1 = await query(`
      UPDATE ops.shift_plans
      SET
        plan_type = 'SECOND',
        status = 'APPROVED'
      WHERE status = 'SECOND_PLAN_APPROVED'
    `);
    console.log(`     ${result1.rowCount}件更新`);

    // FIRST_PLAN_APPROVED → plan_type='FIRST', status='APPROVED'
    console.log('  → FIRST_PLAN_APPROVED の修正...');
    const result2 = await query(`
      UPDATE ops.shift_plans
      SET
        plan_type = 'FIRST',
        status = 'APPROVED'
      WHERE status = 'FIRST_PLAN_APPROVED'
    `);
    console.log(`     ${result2.rowCount}件更新`);

    // DRAFT → plan_type='FIRST' (まだNULLの場合)
    console.log('  → DRAFT の plan_type 設定...');
    const result3 = await query(`
      UPDATE ops.shift_plans
      SET plan_type = 'FIRST'
      WHERE status = 'DRAFT'
        AND (plan_type IS NULL OR plan_type = '')
    `);
    console.log(`     ${result3.rowCount}件更新`);

    // 3. 新しいCHECK制約の追加
    console.log('\n🔒 新しいCHECK制約を追加...');
    await query(`
      ALTER TABLE ops.shift_plans
      ADD CONSTRAINT shift_plans_status_check
      CHECK (status IN ('DRAFT', 'APPROVED'))
    `);
    console.log('  ✅ 追加完了');

    // 4. 確認クエリ
    console.log('\n📊 結果確認:');
    const result = await query(`
      SELECT
        plan_type,
        status,
        COUNT(*) as count
      FROM ops.shift_plans
      GROUP BY plan_type, status
      ORDER BY plan_type, status
    `);

    console.table(result.rows);

    // 5. 制約確認
    console.log('\n📋 新しい制約定義:');
    const constraintResult = await query(`
      SELECT pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname = 'shift_plans_status_check'
    `);
    console.log(constraintResult.rows[0].constraint_definition);

    console.log('\n✅ マイグレーション完了！');
    process.exit(0);

  } catch (error) {
    console.error('❌ マイグレーションエラー:', error);
    process.exit(1);
  }
}

updateStatusConstraint();
