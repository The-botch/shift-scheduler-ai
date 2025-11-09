import { query } from './src/config/database.js';

async function fullOctoberCompare() {
  try {
    const result = await query(`
      SELECT
        tenant_id, store_id, plan_code, plan_name,
        status, plan_type, generation_type, ai_model_version,
        total_labor_hours, total_labor_cost, coverage_score,
        constraint_violations, created_by, approved_by
      FROM ops.shift_plans
      WHERE plan_year = 2025 AND plan_month = 10
      ORDER BY tenant_id, store_id
    `);

    console.log('=== 本番DB 10月データ（全フィールド） ===\n');

    const dmlData = [
      { tenant_id: 1, store_id: 1, plan_code: 'PLAN-202510-001', plan_name: '2025年10月シフト（確定）', status: 'APPROVED', plan_type: 'SECOND', generation_type: 'MANUAL', ai_model_version: 'NULL', total_labor_hours: 'NULL', total_labor_cost: 'NULL', coverage_score: 'NULL', constraint_violations: 0, created_by: 1, approved_by: 'NULL' },
      { tenant_id: 3, store_id: 153, plan_code: 'PLAN_202510_STORE153', plan_name: '2025年10月シフト計画 (COME)', status: 'APPROVED', plan_type: 'SECOND', generation_type: 'CSV_IMPORT', ai_model_version: 'NULL', total_labor_hours: 'NULL', total_labor_cost: 'NULL', coverage_score: 'NULL', constraint_violations: 0, created_by: 'NULL', approved_by: 'NULL' },
      { tenant_id: 3, store_id: 154, plan_code: 'PLAN_202510_STORE154', plan_name: '2025年10月シフト計画 (Atelier)', status: 'APPROVED', plan_type: 'SECOND', generation_type: 'CSV_IMPORT', ai_model_version: 'NULL', total_labor_hours: 'NULL', total_labor_cost: 'NULL', coverage_score: 'NULL', constraint_violations: 0, created_by: 'NULL', approved_by: 'NULL' },
      { tenant_id: 3, store_id: 155, plan_code: 'PLAN_202510_STORE155', plan_name: '2025年10月シフト計画 (SHIBUYA)', status: 'APPROVED', plan_type: 'SECOND', generation_type: 'CSV_IMPORT', ai_model_version: 'NULL', total_labor_hours: 'NULL', total_labor_cost: 'NULL', coverage_score: 'NULL', constraint_violations: 0, created_by: 'NULL', approved_by: 'NULL' },
      { tenant_id: 3, store_id: 156, plan_code: 'PLAN_202510_STORE156', plan_name: '2025年10月シフト計画 (Stand Banh Mi)', status: 'APPROVED', plan_type: 'SECOND', generation_type: 'CSV_IMPORT', ai_model_version: 'NULL', total_labor_hours: 'NULL', total_labor_cost: 'NULL', coverage_score: 'NULL', constraint_violations: 0, created_by: 'NULL', approved_by: 'NULL' },
      { tenant_id: 3, store_id: 157, plan_code: 'PLAN_202510_STORE157', plan_name: '2025年10月シフト計画 (Stand Bo Bun)', status: 'APPROVED', plan_type: 'SECOND', generation_type: 'CSV_IMPORT', ai_model_version: 'NULL', total_labor_hours: 'NULL', total_labor_cost: 'NULL', coverage_score: 'NULL', constraint_violations: 0, created_by: 'NULL', approved_by: 'NULL' }
    ];

    let allMatch = true;
    const differences = [];

    result.rows.forEach((dbRow, index) => {
      const dmlRow = dmlData[index];
      console.log(`--- Record ${index + 1}: T${dbRow.tenant_id}/S${dbRow.store_id} ---`);

      const fields = [
        'plan_code', 'plan_name', 'status', 'plan_type', 'generation_type',
        'ai_model_version', 'total_labor_hours', 'total_labor_cost',
        'coverage_score', 'constraint_violations', 'created_by', 'approved_by'
      ];

      fields.forEach(field => {
        const dbValue = dbRow[field] === null ? 'NULL' : String(dbRow[field]);
        const dmlValue = dmlRow[field] === null ? 'NULL' : String(dmlRow[field]);
        const match = dbValue === dmlValue;

        if (!match) {
          allMatch = false;
          differences.push({
            record: `T${dbRow.tenant_id}/S${dbRow.store_id}`,
            field,
            db: dbValue,
            dml: dmlValue
          });
          console.log(`  ${field}: DB="${dbValue}" vs DML="${dmlValue}" ❌`);
        } else {
          console.log(`  ${field}: "${dbValue}" ✅`);
        }
      });
      console.log('');
    });

    console.log('\n=== 比較結果 ===');
    if (allMatch) {
      console.log('✅ 10月のデータは全フィールド完全一致！');
    } else {
      console.log('❌ 以下の不一致が見つかりました:');
      differences.forEach(diff => {
        console.log(`  ${diff.record} - ${diff.field}: DB="${diff.db}" vs DML="${diff.dml}"`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

fullOctoberCompare();
