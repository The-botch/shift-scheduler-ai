#!/usr/bin/env node
/**
 * 売上実績・予測データの確認スクリプト
 */
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'railway',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD
});

async function main() {
  const tenantId = 3;
  const year = 2025;

  console.log('\n' + '='.repeat(60));
  console.log('📊 売上データ確認');
  console.log('='.repeat(60));
  console.log(`テナントID: ${tenantId}, 年: ${year}\n`);

  try {
    // 売上実績
    const actualResult = await pool.query(`
      SELECT year, month, store_id, actual_sales
      FROM analytics.sales_actual
      WHERE tenant_id = $1 AND year = $2
      ORDER BY year, month, store_id
    `, [tenantId, year]);

    console.log(`📈 売上実績データ: ${actualResult.rows.length} 件`);
    if (actualResult.rows.length > 0) {
      console.table(actualResult.rows.slice(0, 10));
      if (actualResult.rows.length > 10) {
        console.log(`... 他 ${actualResult.rows.length - 10} 件\n`);
      }
    } else {
      console.log('  ❌ データなし\n');
    }

    // 売上予測
    const forecastResult = await pool.query(`
      SELECT year, month, store_id, forecasted_sales, required_labor_cost
      FROM analytics.sales_forecast
      WHERE tenant_id = $1 AND year = $2
      ORDER BY year, month, store_id
    `, [tenantId, year]);

    console.log(`📊 売上予測データ: ${forecastResult.rows.length} 件`);
    if (forecastResult.rows.length > 0) {
      console.table(forecastResult.rows.slice(0, 10));
      if (forecastResult.rows.length > 10) {
        console.log(`... 他 ${forecastResult.rows.length - 10} 件\n`);
      }
    } else {
      console.log('  ❌ データなし\n');
    }

    // 給与データ
    const payrollResult = await pool.query(`
      SELECT year, month, staff_id, staff_name, gross_salary
      FROM hr.payroll
      WHERE tenant_id = $1 AND year = $2
      ORDER BY year, month, staff_id
      LIMIT 10
    `, [tenantId, year]);

    console.log(`💰 給与明細データ: ${payrollResult.rows.length} 件（最初の10件のみ表示）`);
    if (payrollResult.rows.length > 0) {
      console.table(payrollResult.rows);
    } else {
      console.log('  ❌ データなし\n');
    }

    // 月別集計
    console.log('\n📅 月別データ集計:');
    for (let month = 7; month <= 10; month++) {
      const actualMonth = actualResult.rows.filter(r => r.month === month);
      const forecastMonth = forecastResult.rows.filter(r => r.month === month);

      const actualSum = actualMonth.reduce((sum, r) => sum + parseInt(r.actual_sales || 0), 0);
      const forecastSum = forecastMonth.reduce((sum, r) => sum + parseInt(r.forecasted_sales || 0), 0);

      console.log(`\n  ${month}月:`);
      console.log(`    売上実績: ${actualSum.toLocaleString()}円 (店舗数: ${actualMonth.length})`);
      console.log(`    売上予測: ${forecastSum.toLocaleString()}円 (店舗数: ${forecastMonth.length})`);
    }

    console.log('\n' + '='.repeat(60));

  } catch (err) {
    console.error('\n❌ エラー:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
