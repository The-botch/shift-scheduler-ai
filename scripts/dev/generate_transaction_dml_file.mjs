#!/usr/bin/env node
/**
 * 全CSVデータからトランザクションDMLファイルを生成
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// デフォルト値
const TENANT_ID = 1;
const STORE_ID = 1;

/**
 * CSVをパース（シンプルなカンマ区切り）
 */
function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || null;
    });
    rows.push(row);
  }

  return rows;
}

/**
 * SQL文字列をエスケープ
 */
function escapeSql(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function main() {
  let sql = `-- ============================================
-- トランザクションデータシードスクリプト
-- schema.sql実行後にこのスクリプトを実行してトランザクションデータを投入
-- ============================================

BEGIN;

`;

  console.log('📝 トランザクションDMLファイル生成中...\n');

  // 1. shift_plans
  console.log('1️⃣  shift_plans を生成中...');
  const shiftPlansCSV = await fs.readFile(
    path.join(__dirname, '../../fixtures/demo_data/transactions/shift_plans.csv'),
    'utf-8'
  );
  const shiftPlans = parseCSV(shiftPlansCSV);

  sql += `-- 1. shift_plans\n`;
  for (const row of shiftPlans) {
    sql += `INSERT INTO ops.shift_plans (
  tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
  period_start, period_end, status, generation_type, ai_model_version,
  total_labor_hours, total_labor_cost, coverage_score, constraint_violations
) VALUES (${TENANT_ID}, ${STORE_ID}, 2024, 10, ${escapeSql(row.plan_code)}, ${escapeSql(row.plan_name)}, ${escapeSql(row.period_start)}, ${escapeSql(row.period_end)}, ${escapeSql(row.status?.toUpperCase())}, ${escapeSql(row.generation_type)}, ${escapeSql(row.ai_model_version)}, ${row.total_labor_hours}, ${row.total_labor_cost}, ${row.coverage_score}, ${row.constraint_violations});\n`;
  }
  sql += '\n';

  // 2. demand_forecasts
  console.log('2️⃣  demand_forecasts を生成中...');
  const demandCSV = await fs.readFile(
    path.join(__dirname, '../../fixtures/demo_data/transactions/demand_forecasts.csv'),
    'utf-8'
  );
  const demands = parseCSV(demandCSV);

  sql += `-- 2. demand_forecasts\n`;
  for (const row of demands) {
    let skills = '[]';
    if (row.required_skills) {
      try {
        const skillsData = JSON.parse(row.required_skills.replace(/"/g, '"'));
        skills = JSON.stringify(skillsData);
      } catch {
        skills = '[]';
      }
    }

    sql += `INSERT INTO ops.demand_forecasts (
  tenant_id, store_id, forecast_date, hour, predicted_customers,
  predicted_sales, required_staff, required_skills, confidence_score
) VALUES (${TENANT_ID}, ${STORE_ID}, ${escapeSql(row.forecast_date)}, ${row.hour}, ${row.predicted_customers}, ${row.predicted_sales}, ${row.required_staff}, '${skills}', ${row.confidence_score});\n`;
  }
  sql += '\n';

  // 3. shift_preferences
  console.log('3️⃣  shift_preferences を生成中...');
  const prefsCSV = await fs.readFile(
    path.join(__dirname, '../../fixtures/demo_data/transactions/shift_preferences_2024_11.csv'),
    'utf-8'
  );
  const prefs = parseCSV(prefsCSV);

  // 日付ごとにグループ化
  const prefsMap = new Map();
  for (const row of prefs) {
    const key = `${row.staff_id}_${row.date.substring(0, 7)}`;
    if (!prefsMap.has(key)) {
      prefsMap.set(key, {
        staff_id: row.staff_id,
        year: parseInt(row.date.substring(0, 4)),
        month: parseInt(row.date.substring(5, 7)),
        preferred_days: [],
        ng_days: [],
        submitted_at: row.submitted_at
      });
    }

    const pref = prefsMap.get(key);
    if (row.preference === 'preferred') {
      pref.preferred_days.push(row.date);
    } else if (row.preference === 'off') {
      pref.ng_days.push(row.date);
    }
  }

  sql += `-- 3. shift_preferences\n`;
  for (const pref of prefsMap.values()) {
    const preferredDays = pref.preferred_days.length > 0 ? escapeSql(pref.preferred_days.join(',')) : 'NULL';
    const ngDays = pref.ng_days.length > 0 ? escapeSql(pref.ng_days.join(',')) : 'NULL';

    sql += `INSERT INTO ops.shift_preferences (
  tenant_id, store_id, staff_id, year, month,
  preferred_days, ng_days, status, submitted_at
) VALUES (${TENANT_ID}, ${STORE_ID}, ${pref.staff_id}, ${pref.year}, ${pref.month}, ${preferredDays}, ${ngDays}, 'PENDING', ${escapeSql(pref.submitted_at)});\n`;
  }
  sql += '\n';

  // 4. availability_requests
  console.log('4️⃣  availability_requests を生成中...');
  const availCSV = await fs.readFile(
    path.join(__dirname, '../../fixtures/demo_data/transactions/availability_requests.csv'),
    'utf-8'
  );
  const avails = parseCSV(availCSV);

  sql += `-- 4. availability_requests\n`;
  for (const row of avails) {
    const comments = row.comments ? escapeSql(row.comments) : 'NULL';
    const isProcessed = row.is_processed === 'TRUE' ? 'TRUE' : 'FALSE';

    sql += `INSERT INTO ops.availability_requests (
  tenant_id, store_id, staff_id, plan_id, request_date,
  availability, preferred_pattern, comments, submitted_at, is_processed
) VALUES (${TENANT_ID}, ${STORE_ID}, ${row.staff_id}, 1, ${escapeSql(row.request_date)}, ${escapeSql(row.availability?.toUpperCase())}, ${escapeSql(row.preferred_pattern)}, ${comments}, ${escapeSql(row.submitted_at)}, ${isProcessed});\n`;
  }
  sql += '\n';

  // 5. shifts
  console.log('5️⃣  shifts を生成中（大量データ）...');
  const shiftsCSV = await fs.readFile(
    path.join(__dirname, '../../fixtures/shift_pdfs/csv_output/シフト.csv'),
    'utf-8'
  );
  const shifts = parseCSV(shiftsCSV);

  sql += `-- 5. shifts\n`;
  let shiftCount = 0;
  for (const row of shifts) {
    // 時刻を24時間制に変換
    const formatTime = (timeStr) => {
      if (!timeStr || timeStr === '〜') return null;
      let [h, m] = timeStr.split(':');
      let hours = parseInt(h) % 24;
      return `${String(hours).padStart(2, '0')}:${m || '00'}:00`;
    };

    const startTime = formatTime(row.start_time);
    const endTime = formatTime(row.end_time);

    if (startTime && endTime) {
      const staffId = (shiftCount % 10) + 1;
      const breakMinutes = parseInt(row.break_minutes) || 0;

      sql += `INSERT INTO ops.shifts (
  tenant_id, store_id, plan_id, staff_id, shift_date,
  pattern_id, start_time, end_time, break_minutes
) VALUES (${TENANT_ID}, ${STORE_ID}, 1, ${staffId}, ${escapeSql(row.shift_date)}, 1, ${escapeSql(startTime)}, ${escapeSql(endTime)}, ${breakMinutes});\n`;

      shiftCount++;
    }
  }
  sql += '\n';
  console.log(`   ✓ ${shiftCount}件のshift生成`);

  // 6. work_hours_actual
  console.log('6️⃣  work_hours_actual を生成中...');
  const workHoursCSV = await fs.readFile(
    path.join(__dirname, '../../fixtures/demo_data/actual/work_hours_2024.csv'),
    'utf-8'
  );
  const workHours = parseCSV(workHoursCSV);

  sql += `-- 6. work_hours_actual\n`;
  for (const row of workHours) {
    const workDate = `${row.year}-${String(row.month).padStart(2, '0')}-${String(row.date).padStart(2, '0')}`;
    const isLate = row.is_late === 'TRUE' ? 'TRUE' : 'FALSE';
    const isEarlyLeave = row.is_early_leave === 'TRUE' ? 'TRUE' : 'FALSE';

    sql += `INSERT INTO ops.work_hours_actual (
  tenant_id, store_id, year, month, work_date, staff_id,
  scheduled_start, scheduled_end, actual_start, actual_end,
  scheduled_hours, actual_hours, break_minutes, overtime_minutes,
  is_late, is_early_leave
) VALUES (${TENANT_ID}, ${STORE_ID}, ${row.year}, ${row.month}, ${escapeSql(workDate)}, ${row.staff_id}, ${escapeSql(row.scheduled_start)}, ${escapeSql(row.scheduled_end)}, ${escapeSql(row.actual_start)}, ${escapeSql(row.actual_end)}, ${row.scheduled_hours}, ${row.actual_hours}, ${row.break_minutes}, ${row.overtime_minutes}, ${isLate}, ${isEarlyLeave});\n`;
  }
  sql += '\n';

  // 7. payroll
  console.log('7️⃣  payroll を生成中...');
  const payrollCSV = await fs.readFile(
    path.join(__dirname, '../../fixtures/demo_data/actual/payroll_2024.csv'),
    'utf-8'
  );
  const payrolls = parseCSV(payrollCSV);

  sql += `-- 7. payroll\n`;
  for (const row of payrolls) {
    sql += `INSERT INTO hr.payroll (
  tenant_id, store_id, year, month, staff_id, work_days, work_hours,
  base_salary, overtime_pay, commute_allowance, other_allowances,
  gross_salary, health_insurance, pension_insurance, employment_insurance,
  income_tax, resident_tax, total_deduction, net_salary,
  payment_date, payment_status
) VALUES (${TENANT_ID}, ${STORE_ID}, ${row.year}, ${row.month}, ${row.staff_id}, ${row.work_days}, ${row.work_hours}, ${row.base_salary}, ${row.overtime_pay}, ${row.commute_allowance}, ${row.other_allowances}, ${row.gross_salary}, ${row.health_insurance}, ${row.pension_insurance}, ${row.employment_insurance}, ${row.income_tax}, ${row.resident_tax}, ${row.total_deduction}, ${row.net_salary}, ${escapeSql(row.payment_date)}, ${escapeSql(row.payment_status?.toUpperCase())});\n`;
  }
  sql += '\n';

  // 8. sales_actual
  console.log('8️⃣  sales_actual を生成中...');
  const salesActualCSV = await fs.readFile(
    path.join(__dirname, '../../fixtures/demo_data/actual/sales_actual_2024.csv'),
    'utf-8'
  );
  const salesActual = parseCSV(salesActualCSV);

  sql += `-- 8. sales_actual\n`;
  for (const row of salesActual) {
    sql += `INSERT INTO analytics.sales_actual (
  tenant_id, year, month, store_id, actual_sales, daily_average, notes
) VALUES (${TENANT_ID}, ${row.year}, ${row.month}, ${STORE_ID}, ${row.actual_sales}, ${row.daily_average}, ${escapeSql(row.notes)});\n`;
  }
  sql += '\n';

  // 9. sales_forecast
  console.log('9️⃣  sales_forecast を生成中...');
  const salesForecastCSV = await fs.readFile(
    path.join(__dirname, '../../fixtures/demo_data/forecast/sales_forecast_2024.csv'),
    'utf-8'
  );
  const salesForecast = parseCSV(salesForecastCSV);

  sql += `-- 9. sales_forecast\n`;
  for (const row of salesForecast) {
    sql += `INSERT INTO analytics.sales_forecast (
  tenant_id, year, month, store_id, forecasted_sales,
  required_labor_cost, required_hours, notes
) VALUES (${TENANT_ID}, ${row.year}, ${row.month}, ${STORE_ID}, ${row.forecasted_sales}, ${row.required_labor_cost}, ${row.required_hours}, ${escapeSql(row.notes)});\n`;
  }
  sql += '\n';

  // 10. dashboard_metrics
  console.log('🔟 dashboard_metrics を生成中...');
  const metricsCSV = await fs.readFile(
    path.join(__dirname, '../../fixtures/demo_data/dashboard/metrics.csv'),
    'utf-8'
  );
  const metrics = parseCSV(metricsCSV);

  sql += `-- 10. dashboard_metrics\n`;
  for (const row of metrics) {
    let status = row.status?.toUpperCase();
    if (status === 'SUCCESS') status = 'GOOD';

    sql += `INSERT INTO analytics.dashboard_metrics (
  tenant_id, metric_name, predicted, actual, unit, status
) VALUES (${TENANT_ID}, ${escapeSql(row.metric_name)}, ${row.predicted}, ${row.actual}, ${escapeSql(row.unit)}, ${escapeSql(status)});\n`;
  }
  sql += '\n';

  sql += `COMMIT;

-- ============================================
-- 投入完了
-- ============================================
`;

  // ファイルに書き込み
  const outputPath = path.join(__dirname, '../setup/seed_transaction_data.sql');
  await fs.writeFile(outputPath, sql);

  console.log('\n✅ DMLファイル生成完了:');
  console.log(`   ${outputPath}`);
  console.log(`   (${sql.split('\n').length}行)`);
}

main();
