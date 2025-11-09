import { query } from './src/config/database.js';

async function detailedComparison() {
  try {
    // tenant_id=1の11月データ
    const tenant1Nov = await query(`
      SELECT * FROM ops.shift_plans
      WHERE tenant_id = 1 AND store_id = 1 AND plan_year = 2025 AND plan_month = 11
    `);

    console.log('=== Tenant 1 Store 1 November ===');
    console.log(JSON.stringify(tenant1Nov.rows[0], null, 2));

    // Atelier 11月データ（FIRST）
    const atelierNov = await query(`
      SELECT * FROM ops.shift_plans
      WHERE tenant_id = 3 AND store_id = 154 AND plan_year = 2025 AND plan_month = 11
    `);

    console.log('\n=== Atelier November ===');
    console.log(JSON.stringify(atelierNov.rows[0], null, 2));

    // 全データの概要
    const all = await query(`
      SELECT
        plan_year, plan_month, tenant_id, store_id,
        plan_code, status, plan_type, generation_type,
        period_start::text, period_end::text
      FROM ops.shift_plans
      WHERE NOT (plan_year = 2025 AND plan_month = 12)
      ORDER BY plan_year, plan_month, tenant_id, store_id
    `);

    console.log(`\n=== All Data (excluding December) ===`);
    console.log(`Total: ${all.rows.length} records`);
    all.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.plan_year}-${String(row.plan_month).padStart(2,'0')} T${row.tenant_id}/S${row.store_id}: ${row.plan_code} [${row.status}/${row.plan_type}] ${row.generation_type}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

detailedComparison();
