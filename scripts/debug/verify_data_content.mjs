import 'dotenv/config';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function escapeString(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function formatValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return escapeString(value.toISOString());
  if (typeof value === 'object') return escapeString(JSON.stringify(value));
  return escapeString(value);
}

(async () => {
  try {
    console.log('## データ内容の検証\n');

    // seed_transaction_data.sqlを読み込む
    const sqlPath = path.join(__dirname, 'setup', 'seed_transaction_data.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // 1. shift_plansのサンプル検証（最初の3件）
    console.log('### ops.shift_plans (サンプル検証)');
    const plans = await pool.query(`
      SELECT * FROM ops.shift_plans ORDER BY plan_id LIMIT 3
    `);

    for (const row of plans.rows) {
      const values = [
        row.tenant_id, row.store_id, row.plan_year, row.plan_month,
        formatValue(row.plan_code), formatValue(row.plan_name),
        formatValue(row.period_start), formatValue(row.period_end),
        formatValue(row.status), formatValue(row.generation_type),
        formatValue(row.ai_model_version), formatValue(row.total_labor_hours),
        formatValue(row.total_labor_cost), formatValue(row.coverage_score),
        row.constraint_violations,
        formatValue(row.created_by), formatValue(row.approved_by)
      ].join(', ');
      const expectedLine = `INSERT INTO ops.shift_plans (tenant_id, store_id, plan_year, plan_month, plan_code, plan_name, period_start, period_end, status, generation_type, ai_model_version, total_labor_hours, total_labor_cost, coverage_score, constraint_violations, created_by, approved_by) VALUES (${values});`;

      const exists = sqlContent.includes(expectedLine);
      console.log(`plan_id ${row.plan_id}: ${exists ? '✅' : '❌'}`);
      if (!exists) {
        console.log(`  期待: ${expectedLine.substring(0, 150)}...`);
      }
    }

    // 2. shift_preferencesの全件検証（11件）
    console.log('\n### ops.shift_preferences (全件検証)');
    const prefs = await pool.query(`
      SELECT * FROM ops.shift_preferences ORDER BY preference_id
    `);

    let prefsMatched = 0;
    for (const row of prefs.rows) {
      const values = [
        row.tenant_id, row.store_id, row.staff_id, row.year, row.month,
        formatValue(row.preferred_days), formatValue(row.ng_days),
        formatValue(row.status), formatValue(row.submitted_at),
        formatValue(row.staff_name), formatValue(row.preferred_time_slots),
        formatValue(row.max_hours_per_week), formatValue(row.notes)
      ].join(', ');
      const expectedLine = `INSERT INTO ops.shift_preferences (tenant_id, store_id, staff_id, year, month, preferred_days, ng_days, status, submitted_at, staff_name, preferred_time_slots, max_hours_per_week, notes) VALUES (${values});`;

      if (sqlContent.includes(expectedLine)) {
        prefsMatched++;
      }
    }
    console.log(`${prefsMatched}/${prefs.rows.length}件が一致 ${prefsMatched === prefs.rows.length ? '✅' : '❌'}`);

    // 3. shiftsのサンプル検証（最初と最後の3件ずつ）
    console.log('\n### ops.shifts (サンプル検証: 最初と最後の3件)');
    const shiftsFirst = await pool.query(`
      SELECT * FROM ops.shifts ORDER BY shift_id LIMIT 3
    `);
    const shiftsLast = await pool.query(`
      SELECT * FROM ops.shifts ORDER BY shift_id DESC LIMIT 3
    `);

    let shiftsMatched = 0;
    const shiftsToCheck = [...shiftsFirst.rows, ...shiftsLast.rows];
    for (const row of shiftsToCheck) {
      const values = [
        row.tenant_id, row.store_id, row.plan_id, row.staff_id,
        formatValue(row.shift_date), row.pattern_id,
        formatValue(row.start_time), formatValue(row.end_time),
        row.break_minutes, formatValue(row.total_hours),
        formatValue(row.labor_cost), formatValue(row.assigned_skills),
        formatValue(row.is_preferred), formatValue(row.is_modified),
        formatValue(row.notes)
      ].join(', ');
      const expectedLine = `INSERT INTO ops.shifts (tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id, start_time, end_time, break_minutes, total_hours, labor_cost, assigned_skills, is_preferred, is_modified, notes) VALUES (${values});`;

      if (sqlContent.includes(expectedLine)) {
        shiftsMatched++;
      }
    }
    console.log(`${shiftsMatched}/${shiftsToCheck.length}件が一致 ${shiftsMatched === shiftsToCheck.length ? '✅' : '❌'}`);

    // 4. payrollのサンプル検証
    console.log('\n### hr.payroll (サンプル検証: 最初の3件)');
    const payroll = await pool.query(`
      SELECT * FROM hr.payroll ORDER BY payroll_id LIMIT 3
    `);

    let payrollMatched = 0;
    for (const row of payroll.rows) {
      const values = [
        row.tenant_id, row.store_id, row.year, row.month, row.staff_id,
        formatValue(row.staff_name), formatValue(row.work_days),
        formatValue(row.work_hours), formatValue(row.base_salary),
        formatValue(row.overtime_pay), formatValue(row.commute_allowance),
        formatValue(row.other_allowances), formatValue(row.gross_salary),
        formatValue(row.health_insurance), formatValue(row.pension_insurance),
        formatValue(row.employment_insurance), formatValue(row.income_tax),
        formatValue(row.resident_tax), formatValue(row.total_deduction),
        formatValue(row.net_salary), formatValue(row.payment_date),
        formatValue(row.payment_status)
      ].join(', ');
      const expectedLine = `INSERT INTO hr.payroll (tenant_id, store_id, year, month, staff_id, staff_name, work_days, work_hours, base_salary, overtime_pay, commute_allowance, other_allowances, gross_salary, health_insurance, pension_insurance, employment_insurance, income_tax, resident_tax, total_deduction, net_salary, payment_date, payment_status) VALUES (${values})`;

      if (sqlContent.includes(expectedLine)) {
        payrollMatched++;
      }
    }
    console.log(`${payrollMatched}/${payroll.rows.length}件が一致 ${payrollMatched === payroll.rows.length ? '✅' : '❌'}`);

    console.log('\n## 結論');
    console.log('サンプルデータの検証は完了しました。');
    console.log('100%の保証には、テスト環境での実際の投入とdiff比較が必要です。');

    await pool.end();
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
})();
