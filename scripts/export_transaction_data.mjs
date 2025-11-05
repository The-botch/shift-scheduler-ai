#!/usr/bin/env node

/**
 * 現在のトランザクションデータを全てエクスポート
 * seed_transaction_data.sqlを生成
 */

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

async function exportTransactionData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 トランザクションデータエクスポート開始\n');

    let output = `-- ============================================
-- トランザクションデータシードスクリプト
-- 現在のデータベースから自動生成
-- 生成日時: ${new Date().toISOString()}
-- schema.sql と seed_data.sql 実行後にこのスクリプトを実行
-- ============================================

BEGIN;

`;

    // 1. shift_plans
    const shiftPlans = await client.query('SELECT * FROM ops.shift_plans ORDER BY plan_id');
    output += `-- ops.shift_plans (${shiftPlans.rows.length}件)\n`;
    console.log(`📋 ops.shift_plans: ${shiftPlans.rows.length}件`);
    for (const row of shiftPlans.rows) {
      const values = [
        row.tenant_id, row.store_id, row.plan_year, row.plan_month,
        formatValue(row.plan_code), formatValue(row.plan_name),
        formatValue(row.period_start), formatValue(row.period_end),
        formatValue(row.status), formatValue(row.generation_type),
        formatValue(row.ai_model_version), formatValue(row.total_labor_hours),
        formatValue(row.total_labor_cost), formatValue(row.coverage_score),
        row.constraint_violations
      ].join(', ');
      output += `INSERT INTO ops.shift_plans (tenant_id, store_id, plan_year, plan_month, plan_code, plan_name, period_start, period_end, status, generation_type, ai_model_version, total_labor_hours, total_labor_cost, coverage_score, constraint_violations) VALUES (${values});\n`;
    }
    output += '\n';

    // 2. demand_forecasts
    const demandForecasts = await client.query('SELECT * FROM ops.demand_forecasts ORDER BY forecast_id');
    output += `-- ops.demand_forecasts (${demandForecasts.rows.length}件)\n`;
    console.log(`📋 ops.demand_forecasts: ${demandForecasts.rows.length}件`);
    for (const row of demandForecasts.rows) {
      const values = [
        row.tenant_id, row.store_id, formatValue(row.forecast_date),
        formatValue(row.hour), formatValue(row.predicted_customers),
        formatValue(row.predicted_sales), formatValue(row.required_staff),
        formatValue(row.required_skills), formatValue(row.confidence_score)
      ].join(', ');
      output += `INSERT INTO ops.demand_forecasts (tenant_id, store_id, forecast_date, hour, predicted_customers, predicted_sales, required_staff, required_skills, confidence_score) VALUES (${values});\n`;
    }
    output += '\n';

    // 3. shift_preferences
    const shiftPreferences = await client.query('SELECT * FROM ops.shift_preferences ORDER BY preference_id');
    output += `-- ops.shift_preferences (${shiftPreferences.rows.length}件)\n`;
    console.log(`📋 ops.shift_preferences: ${shiftPreferences.rows.length}件`);
    for (const row of shiftPreferences.rows) {
      const values = [
        row.tenant_id, row.store_id, row.staff_id, row.year, row.month,
        formatValue(row.preferred_days), formatValue(row.ng_days),
        formatValue(row.status), formatValue(row.submitted_at)
      ].join(', ');
      output += `INSERT INTO ops.shift_preferences (tenant_id, store_id, staff_id, year, month, preferred_days, ng_days, status, submitted_at) VALUES (${values});\n`;
    }
    output += '\n';

    // 4. shifts (大量データ)
    const shifts = await client.query('SELECT * FROM ops.shifts ORDER BY shift_id');
    output += `-- ops.shifts (${shifts.rows.length}件)\n`;
    console.log(`📋 ops.shifts: ${shifts.rows.length}件（処理中...）`);
    for (const row of shifts.rows) {
      const values = [
        row.tenant_id, row.store_id, row.plan_id, row.staff_id,
        formatValue(row.shift_date), row.pattern_id,
        formatValue(row.start_time), formatValue(row.end_time),
        row.break_minutes, formatValue(row.total_hours),
        formatValue(row.labor_cost), formatValue(row.assigned_skills),
        formatValue(row.is_preferred), formatValue(row.is_modified),
        formatValue(row.notes)
      ].join(', ');
      output += `INSERT INTO ops.shifts (tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id, start_time, end_time, break_minutes, total_hours, labor_cost, assigned_skills, is_preferred, is_modified, notes) VALUES (${values});\n`;
    }
    output += '\n';

    // 5. work_hours_actual
    const workHours = await client.query('SELECT * FROM ops.work_hours_actual ORDER BY work_hours_id');
    output += `-- ops.work_hours_actual (${workHours.rows.length}件)\n`;
    console.log(`📋 ops.work_hours_actual: ${workHours.rows.length}件`);
    for (const row of workHours.rows) {
      const values = [
        row.tenant_id, row.store_id, formatValue(row.shift_id),
        row.year, row.month, formatValue(row.work_date),
        row.staff_id, formatValue(row.staff_name),
        formatValue(row.scheduled_start), formatValue(row.scheduled_end),
        formatValue(row.actual_start), formatValue(row.actual_end),
        formatValue(row.scheduled_hours), formatValue(row.actual_hours),
        row.break_minutes, row.overtime_minutes,
        formatValue(row.is_late), formatValue(row.is_early_leave),
        formatValue(row.notes)
      ].join(', ');
      output += `INSERT INTO ops.work_hours_actual (tenant_id, store_id, shift_id, year, month, work_date, staff_id, staff_name, scheduled_start, scheduled_end, actual_start, actual_end, scheduled_hours, actual_hours, break_minutes, overtime_minutes, is_late, is_early_leave, notes) VALUES (${values}) ON CONFLICT (tenant_id, store_id, staff_id, work_date) DO NOTHING;\n`;
    }
    output += '\n';

    // 6. payroll
    const payroll = await client.query('SELECT * FROM hr.payroll ORDER BY payroll_id');
    output += `-- hr.payroll (${payroll.rows.length}件)\n`;
    console.log(`📋 hr.payroll: ${payroll.rows.length}件`);
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
      output += `INSERT INTO hr.payroll (tenant_id, store_id, year, month, staff_id, staff_name, work_days, work_hours, base_salary, overtime_pay, commute_allowance, other_allowances, gross_salary, health_insurance, pension_insurance, employment_insurance, income_tax, resident_tax, total_deduction, net_salary, payment_date, payment_status) VALUES (${values}) ON CONFLICT (tenant_id, store_id, year, month, staff_id) DO NOTHING;\n`;
    }
    output += '\n';

    // 7. sales_actual
    const salesActual = await client.query('SELECT * FROM analytics.sales_actual ORDER BY actual_id');
    output += `-- analytics.sales_actual (${salesActual.rows.length}件)\n`;
    console.log(`📋 analytics.sales_actual: ${salesActual.rows.length}件`);
    for (const row of salesActual.rows) {
      const values = [
        row.tenant_id, row.year, row.month, row.store_id,
        formatValue(row.actual_sales), formatValue(row.daily_average),
        formatValue(row.notes)
      ].join(', ');
      output += `INSERT INTO analytics.sales_actual (tenant_id, year, month, store_id, actual_sales, daily_average, notes) VALUES (${values}) ON CONFLICT (tenant_id, year, month, store_id) DO NOTHING;\n`;
    }
    output += '\n';

    // 8. sales_forecast
    const salesForecast = await client.query('SELECT * FROM analytics.sales_forecast ORDER BY forecast_id');
    output += `-- analytics.sales_forecast (${salesForecast.rows.length}件)\n`;
    console.log(`📋 analytics.sales_forecast: ${salesForecast.rows.length}件`);
    for (const row of salesForecast.rows) {
      const values = [
        row.tenant_id, row.year, row.month, row.store_id,
        formatValue(row.forecasted_sales), formatValue(row.required_labor_cost),
        formatValue(row.required_hours), formatValue(row.notes)
      ].join(', ');
      output += `INSERT INTO analytics.sales_forecast (tenant_id, year, month, store_id, forecasted_sales, required_labor_cost, required_hours, notes) VALUES (${values}) ON CONFLICT (tenant_id, year, month, store_id) DO NOTHING;\n`;
    }
    output += '\n';

    // 9. dashboard_metrics
    const dashboardMetrics = await client.query('SELECT * FROM analytics.dashboard_metrics ORDER BY metric_id');
    output += `-- analytics.dashboard_metrics (${dashboardMetrics.rows.length}件)\n`;
    console.log(`📋 analytics.dashboard_metrics: ${dashboardMetrics.rows.length}件`);
    for (const row of dashboardMetrics.rows) {
      const values = [
        row.tenant_id, formatValue(row.metric_name),
        formatValue(row.predicted), formatValue(row.actual),
        formatValue(row.unit), formatValue(row.status),
        formatValue(row.calculated_at)
      ].join(', ');
      output += `INSERT INTO analytics.dashboard_metrics (tenant_id, metric_name, predicted, actual, unit, status, calculated_at) VALUES (${values});\n`;
    }
    output += '\n';

    output += `COMMIT;

-- ============================================
-- トランザクションデータ投入完了
-- ============================================
`;

    // ファイル保存
    const outputPath = path.join(__dirname, 'setup', 'seed_transaction_data.sql');
    fs.writeFileSync(outputPath, output, 'utf8');
    
    console.log('\n✅ seed_transaction_data.sql を生成しました');
    console.log(`📁 ${outputPath}\n`);
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

exportTransactionData().catch(err => {
  console.error('致命的エラー:', err);
  process.exit(1);
});
