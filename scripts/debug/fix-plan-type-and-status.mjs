import { query } from '../src/config/database.js';

async function fixPlanTypeAndStatus() {
  try {
    console.log('🚀 plan_typeとstatusの修正開始');

    // 1. SECOND_PLAN_APPROVED → plan_type='SECOND', status='approved'
    console.log('実行中: SECOND_PLAN_APPROVED の修正...');
    const result1 = await query(`
      UPDATE ops.shift_plans
      SET
        plan_type = 'SECOND',
        status = 'approved'
      WHERE status = 'SECOND_PLAN_APPROVED'
    `);
    console.log(`  → ${result1.rowCount}件更新`);

    // 2. FIRST_PLAN_APPROVED → plan_type='FIRST', status='approved'
    console.log('実行中: FIRST_PLAN_APPROVED の修正...');
    const result2 = await query(`
      UPDATE ops.shift_plans
      SET
        plan_type = 'FIRST',
        status = 'approved'
      WHERE status = 'FIRST_PLAN_APPROVED'
    `);
    console.log(`  → ${result2.rowCount}件更新`);

    // 3. draft → plan_type='FIRST'（まだNULLの場合のみ）
    console.log('実行中: draft の修正...');
    const result3 = await query(`
      UPDATE ops.shift_plans
      SET plan_type = 'FIRST'
      WHERE status = 'draft'
        AND (plan_type IS NULL OR plan_type = '')
    `);
    console.log(`  → ${result3.rowCount}件更新`);

    // 4. approved → plan_type='FIRST'（まだNULLの場合のみ）
    console.log('実行中: approved の修正...');
    const result4 = await query(`
      UPDATE ops.shift_plans
      SET plan_type = 'FIRST'
      WHERE status = 'approved'
        AND (plan_type IS NULL OR plan_type = '')
    `);
    console.log(`  → ${result4.rowCount}件更新`);

    // 確認クエリ
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

    console.log('\n✅ 修正完了！');
    process.exit(0);

  } catch (error) {
    console.error('❌ 修正エラー:', error);
    process.exit(1);
  }
}

fixPlanTypeAndStatus();
