#!/usr/bin/env node
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || process.env.PGHOST,
  port: process.env.DB_PORT || process.env.PGPORT || 5432,
  database: process.env.DB_NAME || process.env.PGDATABASE,
  user: process.env.DB_USER || process.env.PGUSER,
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD
});

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 インポートデータ確認');
  console.log('='.repeat(60) + '\n');

  try {
    // 労働時間実績
    const workHours = await pool.query(`
      SELECT COUNT(*) as count,
             MIN(work_date) as min_date,
             MAX(work_date) as max_date
      FROM ops.work_hours_actual
      WHERE tenant_id = 3
    `);
    console.log('📅 労働時間実績 (ops.work_hours_actual):');
    console.log(`   件数: ${workHours.rows[0].count}件`);
    console.log(`   期間: ${workHours.rows[0].min_date} ~ ${workHours.rows[0].max_date}\n`);

    // 給与明細
    const payroll = await pool.query(`
      SELECT COUNT(*) as count,
             MIN(year) as min_year, MIN(month) as min_month,
             MAX(year) as max_year, MAX(month) as max_month
      FROM hr.payroll
      WHERE tenant_id = 3
    `);
    console.log('💰 給与明細 (hr.payroll):');
    console.log(`   件数: ${payroll.rows[0].count}件`);
    console.log(`   期間: ${payroll.rows[0].min_year}年${payroll.rows[0].min_month}月 ~ ${payroll.rows[0].max_year}年${payroll.rows[0].max_month}月\n`);

    // 売上実績
    const salesActual = await pool.query(`
      SELECT COUNT(*) as count,
             MIN(year) as min_year, MIN(month) as min_month,
             MAX(year) as max_year, MAX(month) as max_month
      FROM analytics.sales_actual
      WHERE tenant_id = 3
    `);
    console.log('📈 売上実績 (analytics.sales_actual):');
    console.log(`   件数: ${salesActual.rows[0].count}件`);
    if (salesActual.rows[0].count > 0) {
      console.log(`   期間: ${salesActual.rows[0].min_year}年${salesActual.rows[0].min_month}月 ~ ${salesActual.rows[0].max_year}年${salesActual.rows[0].max_month}月\n`);
    } else {
      console.log('   データなし\n');
    }

    // 売上予測
    const salesForecast = await pool.query(`
      SELECT COUNT(*) as count,
             MIN(year) as min_year, MIN(month) as min_month,
             MAX(year) as max_year, MAX(month) as max_month
      FROM analytics.sales_forecast
      WHERE tenant_id = 3
    `);
    console.log('📊 売上予測 (analytics.sales_forecast):');
    console.log(`   件数: ${salesForecast.rows[0].count}件`);
    if (salesForecast.rows[0].count > 0) {
      console.log(`   期間: ${salesForecast.rows[0].min_year}年${salesForecast.rows[0].min_month}月 ~ ${salesForecast.rows[0].max_year}年${salesForecast.rows[0].max_month}月\n`);
    } else {
      console.log('   データなし\n');
    }

    // サンプルデータを表示
    console.log('='.repeat(60));
    console.log('📋 サンプルデータ（各テーブル先頭3件）');
    console.log('='.repeat(60) + '\n');

    const workHoursSample = await pool.query(`
      SELECT work_date, staff_id, actual_hours, gross_salary
      FROM ops.work_hours_actual
      WHERE tenant_id = 3
      ORDER BY work_date DESC
      LIMIT 3
    `);
    console.log('労働時間実績:');
    workHoursSample.rows.forEach(r => {
      console.log(`  ${r.work_date}: スタッフ${r.staff_id}, ${r.actual_hours}時間`);
    });

    const payrollSample = await pool.query(`
      SELECT year, month, staff_id, gross_salary
      FROM hr.payroll
      WHERE tenant_id = 3
      ORDER BY year DESC, month DESC
      LIMIT 3
    `);
    console.log('\n給与明細:');
    payrollSample.rows.forEach(r => {
      console.log(`  ${r.year}年${r.month}月: スタッフ${r.staff_id}, 総支給${r.gross_salary}円`);
    });

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (err) {
    console.error('❌ エラー:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
