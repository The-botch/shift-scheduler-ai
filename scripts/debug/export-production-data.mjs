import { query } from './src/config/database.js';

async function exportProductionData() {
  try {
    // 12月を除外し、月・店舗順でソート
    const result = await query(`
      SELECT
        tenant_id, store_id, plan_year, plan_month,
        plan_code, plan_name,
        period_start::text as period_start,
        period_end::text as period_end,
        status, plan_type, generation_type,
        total_labor_hours, total_labor_cost, coverage_score,
        constraint_violations, created_by, approved_by
      FROM ops.shift_plans
      WHERE NOT (plan_year = 2025 AND plan_month = 12)
      ORDER BY plan_year, plan_month, tenant_id, store_id
    `);

    console.log('本番DB（12月除く）のデータ:');
    console.log(`総件数: ${result.rows.length}\n`);

    result.rows.forEach((row, index) => {
      console.log(`--- Record ${index + 1} ---`);
      console.log(`Month: ${row.plan_year}-${row.plan_month}`);
      console.log(`Tenant/Store: ${row.tenant_id}/${row.store_id}`);
      console.log(`Plan Code: ${row.plan_code}`);
      console.log(`Plan Name: ${row.plan_name}`);
      console.log(`Period: ${row.period_start} to ${row.period_end}`);
      console.log(`Status/Type: ${row.status}/${row.plan_type}`);
      console.log(`Generation: ${row.generation_type}`);
      console.log(`Labor: ${row.total_labor_hours}h / ¥${row.total_labor_cost}`);
      console.log(`Score/Violations: ${row.coverage_score} / ${row.constraint_violations}`);
      console.log(`Created/Approved by: ${row.created_by} / ${row.approved_by}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

exportProductionData();
