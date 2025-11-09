import { query } from './src/config/database.js';
import fs from 'fs';

async function compareOctober() {
  try {
    // 本番DBから10月データを取得
    const result = await query(`
      SELECT
        plan_id, tenant_id, store_id, plan_year, plan_month,
        plan_code, plan_name,
        period_start::text as period_start,
        period_end::text as period_end,
        status, plan_type, generation_type, ai_model_version,
        total_labor_hours, total_labor_cost, coverage_score,
        constraint_violations, created_by, approved_by
      FROM ops.shift_plans
      WHERE plan_year = 2025 AND plan_month = 10
      ORDER BY tenant_id, store_id
    `);

    console.log('=== 本番DB 10月データ ===');
    console.log(`総件数: ${result.rows.length}\n`);

    result.rows.forEach((row, index) => {
      console.log(`--- Record ${index + 1}: Tenant ${row.tenant_id} / Store ${row.store_id} ---`);
      console.log(`plan_code: ${row.plan_code}`);
      console.log(`plan_name: ${row.plan_name}`);
      console.log(`period_start: ${row.period_start}`);
      console.log(`period_end: ${row.period_end}`);
      console.log(`status: ${row.status}`);
      console.log(`plan_type: ${row.plan_type}`);
      console.log(`generation_type: ${row.generation_type}`);
      console.log(`ai_model_version: ${row.ai_model_version}`);
      console.log(`total_labor_hours: ${row.total_labor_hours}`);
      console.log(`total_labor_cost: ${row.total_labor_cost}`);
      console.log(`coverage_score: ${row.coverage_score}`);
      console.log(`constraint_violations: ${row.constraint_violations}`);
      console.log(`created_by: ${row.created_by}`);
      console.log(`approved_by: ${row.approved_by}`);
      console.log('');
    });

    // DMLファイルから10月データを抽出
    const dmlContent = fs.readFileSync('/Users/yukiuchiyama/Dev/shift-scheduler-ai/shift-scheduler-ai/scripts/setup/seed_transaction_data.sql', 'utf8');
    const octoberLines = dmlContent.split('\n').filter(line =>
      line.includes('INSERT INTO ops.shift_plans') && line.includes('2025, 10,')
    );

    console.log('\n=== DML 10月データ ===');
    console.log(`総件数: ${octoberLines.length}\n`);

    octoberLines.forEach((line, index) => {
      console.log(`--- DML Record ${index + 1} ---`);
      console.log(line.substring(0, 200) + '...');
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

compareOctober();
