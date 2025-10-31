#!/usr/bin/env node
/**
 * 全CSVデータをデータベースに投入するスクリプト
 */

import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .envファイルから DATABASE_URL を読み込む
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '../../.env');
  const envContent = await fs.readFile(envPath, 'utf-8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
  if (dbUrlMatch) process.env.DATABASE_URL = dbUrlMatch[1].trim();
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

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

async function main() {
  const client = await pool.connect();

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 全CSVデータをデータベースに投入');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await client.query('BEGIN');

    // 1. shift_plans
    console.log('1️⃣  shift_plans を投入中...');
    const shiftPlansCSV = await fs.readFile(
      path.join(__dirname, '../../fixtures/demo_data/transactions/shift_plans.csv'),
      'utf-8'
    );
    const shiftPlans = parseCSV(shiftPlansCSV);

    let planId;
    for (const row of shiftPlans) {
      const result = await client.query(`
        INSERT INTO ops.shift_plans (
          tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
          period_start, period_end, status, generation_type, ai_model_version,
          total_labor_hours, total_labor_cost, coverage_score, constraint_violations
        ) VALUES ($1, $2, 2024, 10, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING plan_id
      `, [TENANT_ID, STORE_ID, row.plan_code, row.plan_name, row.period_start, row.period_end,
          row.status?.toUpperCase(), row.generation_type, row.ai_model_version,
          parseFloat(row.total_labor_hours), parseInt(row.total_labor_cost),
          parseFloat(row.coverage_score), parseInt(row.constraint_violations)]);
      planId = result.rows[0].plan_id;
    }
    console.log(`   ✓ ${shiftPlans.length}件投入完了（plan_id: ${planId}）\n`);

    // 2. demand_forecasts
    console.log('2️⃣  demand_forecasts を投入中...');
    const demandCSV = await fs.readFile(
      path.join(__dirname, '../../fixtures/demo_data/transactions/demand_forecasts.csv'),
      'utf-8'
    );
    const demands = parseCSV(demandCSV);

    for (const row of demands) {
      // required_skillsをJSONB形式に変換
      let skills = '[]';
      if (row.required_skills) {
        try {
          // CSVから読んだJSONをパースして再度JSON化
          const skillsData = JSON.parse(row.required_skills.replace(/"/g, '"'));
          skills = JSON.stringify(skillsData);
        } catch {
          skills = '[]';
        }
      }

      await client.query(`
        INSERT INTO ops.demand_forecasts (
          tenant_id, store_id, forecast_date, hour, predicted_customers,
          predicted_sales, required_staff, required_skills, confidence_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [TENANT_ID, STORE_ID, row.forecast_date, parseInt(row.hour),
          parseInt(row.predicted_customers), parseFloat(row.predicted_sales),
          parseInt(row.required_staff), skills, parseFloat(row.confidence_score)]);
    }
    console.log(`   ✓ ${demands.length}件投入完了\n`);

    // 3. shift_preferences
    console.log('3️⃣  shift_preferences を投入中...');
    const prefsCSV = await fs.readFile(
      path.join(__dirname, '../../fixtures/demo_data/transactions/shift_preferences_2024_11.csv'),
      'utf-8'
    );
    const prefs = parseCSV(prefsCSV);

    // 日付ごとにグループ化してpreferred_days/ng_daysを集約
    const prefsMap = new Map();
    for (const row of prefs) {
      const key = `${row.staff_id}_${row.date.substring(0, 7)}`; // staff_id + YYYY-MM
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

    for (const pref of prefsMap.values()) {
      await client.query(`
        INSERT INTO ops.shift_preferences (
          tenant_id, store_id, staff_id, year, month,
          preferred_days, ng_days, status, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)
      `, [TENANT_ID, STORE_ID, pref.staff_id, pref.year, pref.month,
          pref.preferred_days.length > 0 ? pref.preferred_days.join(',') : null,
          pref.ng_days.length > 0 ? pref.ng_days.join(',') : null,
          pref.submitted_at]);
    }
    console.log(`   ✓ ${prefsMap.size}件投入完了\n`);

    // 4. availability_requests
    console.log('4️⃣  availability_requests を投入中...');
    const availCSV = await fs.readFile(
      path.join(__dirname, '../../fixtures/demo_data/transactions/availability_requests.csv'),
      'utf-8'
    );
    const avails = parseCSV(availCSV);

    for (const row of avails) {
      await client.query(`
        INSERT INTO ops.availability_requests (
          tenant_id, store_id, staff_id, plan_id, request_date,
          availability, preferred_pattern, comments, submitted_at, is_processed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [TENANT_ID, STORE_ID, parseInt(row.staff_id), planId,
          row.request_date, row.availability?.toUpperCase(), row.preferred_pattern,
          row.comments || null, row.submitted_at, row.is_processed === 'TRUE']);
    }
    console.log(`   ✓ ${avails.length}件投入完了\n`);

    // 5. shifts (シフト.csv - 大量データ)
    console.log('5️⃣  shifts を投入中...');
    const shiftsCSV = await fs.readFile(
      path.join(__dirname, '../../fixtures/shift_pdfs/csv_output/シフト.csv'),
      'utf-8'
    );
    const shifts = parseCSV(shiftsCSV);

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
        // スタッフIDはローテーション（1-10）
        const staffId = (shiftCount % 10) + 1;

        await client.query(`
          INSERT INTO ops.shifts (
            tenant_id, store_id, plan_id, staff_id, shift_date,
            pattern_id, start_time, end_time, break_minutes
          ) VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8)
        `, [TENANT_ID, STORE_ID, planId, staffId, row.shift_date,
            startTime, endTime, parseInt(row.break_minutes) || 0]);

        shiftCount++;
      }
    }
    console.log(`   ✓ ${shiftCount}件投入完了\n`);

    // 6. work_hours_actual
    console.log('6️⃣  work_hours_actual を投入中...');
    const workHoursCSV = await fs.readFile(
      path.join(__dirname, '../../fixtures/demo_data/actual/work_hours_2024.csv'),
      'utf-8'
    );
    const workHours = parseCSV(workHoursCSV);

    for (const row of workHours) {
      await client.query(`
        INSERT INTO ops.work_hours_actual (
          tenant_id, store_id, year, month, work_date, staff_id,
          scheduled_start, scheduled_end, actual_start, actual_end,
          scheduled_hours, actual_hours, break_minutes, overtime_minutes,
          is_late, is_early_leave
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [TENANT_ID, STORE_ID, parseInt(row.year), parseInt(row.month),
          `${row.year}-${String(row.month).padStart(2, '0')}-${String(row.date).padStart(2, '0')}`,
          parseInt(row.staff_id), row.scheduled_start, row.scheduled_end,
          row.actual_start, row.actual_end, parseFloat(row.scheduled_hours),
          parseFloat(row.actual_hours), parseInt(row.break_minutes),
          parseInt(row.overtime_minutes), row.is_late === 'TRUE',
          row.is_early_leave === 'TRUE']);
    }
    console.log(`   ✓ ${workHours.length}件投入完了\n`);

    // 7. payroll
    console.log('7️⃣  payroll を投入中...');
    const payrollCSV = await fs.readFile(
      path.join(__dirname, '../../fixtures/demo_data/actual/payroll_2024.csv'),
      'utf-8'
    );
    const payrolls = parseCSV(payrollCSV);

    for (const row of payrolls) {
      await client.query(`
        INSERT INTO hr.payroll (
          tenant_id, store_id, year, month, staff_id, work_days, work_hours,
          base_salary, overtime_pay, commute_allowance, other_allowances,
          gross_salary, health_insurance, pension_insurance, employment_insurance,
          income_tax, resident_tax, total_deduction, net_salary,
          payment_date, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      `, [TENANT_ID, STORE_ID, parseInt(row.year), parseInt(row.month),
          parseInt(row.staff_id), parseInt(row.work_days), parseFloat(row.work_hours),
          parseFloat(row.base_salary), parseFloat(row.overtime_pay),
          parseFloat(row.commute_allowance), parseFloat(row.other_allowances),
          parseFloat(row.gross_salary), parseFloat(row.health_insurance),
          parseFloat(row.pension_insurance), parseFloat(row.employment_insurance),
          parseFloat(row.income_tax), parseFloat(row.resident_tax),
          parseFloat(row.total_deduction), parseFloat(row.net_salary),
          row.payment_date, row.payment_status?.toUpperCase()]);
    }
    console.log(`   ✓ ${payrolls.length}件投入完了\n`);

    // 8. sales_actual
    console.log('8️⃣  sales_actual を投入中...');
    const salesActualCSV = await fs.readFile(
      path.join(__dirname, '../../fixtures/demo_data/actual/sales_actual_2024.csv'),
      'utf-8'
    );
    const salesActual = parseCSV(salesActualCSV);

    for (const row of salesActual) {
      await client.query(`
        INSERT INTO analytics.sales_actual (
          tenant_id, year, month, store_id, actual_sales, daily_average, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [TENANT_ID, parseInt(row.year), parseInt(row.month), STORE_ID,
          parseFloat(row.actual_sales), parseFloat(row.daily_average), row.notes]);
    }
    console.log(`   ✓ ${salesActual.length}件投入完了\n`);

    // 9. sales_forecast
    console.log('9️⃣  sales_forecast を投入中...');
    const salesForecastCSV = await fs.readFile(
      path.join(__dirname, '../../fixtures/demo_data/forecast/sales_forecast_2024.csv'),
      'utf-8'
    );
    const salesForecast = parseCSV(salesForecastCSV);

    for (const row of salesForecast) {
      await client.query(`
        INSERT INTO analytics.sales_forecast (
          tenant_id, year, month, store_id, forecasted_sales,
          required_labor_cost, required_hours, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [TENANT_ID, parseInt(row.year), parseInt(row.month), STORE_ID,
          parseFloat(row.forecasted_sales), parseFloat(row.required_labor_cost),
          parseFloat(row.required_hours), row.notes]);
    }
    console.log(`   ✓ ${salesForecast.length}件投入完了\n`);

    // 10. dashboard_metrics
    console.log('🔟 dashboard_metrics を投入中...');
    const metricsCSV = await fs.readFile(
      path.join(__dirname, '../../fixtures/demo_data/dashboard/metrics.csv'),
      'utf-8'
    );
    const metrics = parseCSV(metricsCSV);

    for (const row of metrics) {
      // statusの変換: success/warning/alert/critical → GOOD/WARNING/ALERT/CRITICAL
      let status = row.status?.toUpperCase();
      if (status === 'SUCCESS') status = 'GOOD';

      await client.query(`
        INSERT INTO analytics.dashboard_metrics (
          tenant_id, metric_name, predicted, actual, unit, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [TENANT_ID, row.metric_name, parseFloat(row.predicted), parseFloat(row.actual),
          row.unit, status]);
    }
    console.log(`   ✓ ${metrics.length}件投入完了\n`);

    await client.query('COMMIT');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 全CSVデータの投入が完了しました！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 最終確認
    const tables = [
      'ops.shift_plans',
      'ops.demand_forecasts',
      'ops.shift_preferences',
      'ops.availability_requests',
      'ops.shifts',
      'ops.work_hours_actual',
      'hr.payroll',
      'analytics.sales_actual',
      'analytics.sales_forecast',
      'analytics.dashboard_metrics'
    ];

    console.log('📊 投入データ件数:');
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table.padEnd(35)} : ${result.rows[0].count}件`);
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ エラーが発生しました:\n');
    console.error(error.message);
    console.error('\n詳細:');
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
