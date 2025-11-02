#!/usr/bin/env node
/**
 * 売上CSVファイルをデータベースに直接インポートするスクリプト
 */
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
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

const tenantId = 3;

async function importSalesActual() {
  console.log('\n📥 売上実績インポート開始');

  const csvPath = path.join(__dirname, '..', '..', 'fixtures', 'sales_actual_tenant3.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`読み込み: ${records.length} 件\n`);

  let imported = 0;
  for (const row of records) {
    try {
      await pool.query(`
        INSERT INTO analytics.sales_actual
        (tenant_id, year, month, store_id, actual_sales, daily_average, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (tenant_id, year, month, store_id)
        DO UPDATE SET
          actual_sales = EXCLUDED.actual_sales,
          daily_average = EXCLUDED.daily_average,
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP
      `, [
        tenantId,
        parseInt(row.year),
        parseInt(row.month),
        parseInt(row.store_id),
        parseInt(row.actual_sales),
        parseInt(row.daily_average),
        row.notes || ''
      ]);
      imported++;
      if (imported % 5 === 0 || imported === records.length) {
        console.log(`✅ [${imported}/${records.length}] ${row.year}/${row.month} store_id=${row.store_id}`);
      }
    } catch (err) {
      console.error(`❌ エラー (${row.year}/${row.month} store_id=${row.store_id}):`, err.message);
    }
  }

  console.log(`\n✅ 売上実績インポート完了: ${imported}/${records.length} 件\n`);
}

async function importSalesForecast() {
  console.log('\n📥 売上予測インポート開始');

  const csvPath = path.join(__dirname, '..', '..', 'fixtures', 'sales_forecast_tenant3.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`読み込み: ${records.length} 件\n`);

  let imported = 0;
  for (const row of records) {
    try {
      await pool.query(`
        INSERT INTO analytics.sales_forecast
        (tenant_id, year, month, store_id, forecasted_sales, required_labor_cost, required_hours, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (tenant_id, year, month, store_id)
        DO UPDATE SET
          forecasted_sales = EXCLUDED.forecasted_sales,
          required_labor_cost = EXCLUDED.required_labor_cost,
          required_hours = EXCLUDED.required_hours,
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP
      `, [
        tenantId,
        parseInt(row.year),
        parseInt(row.month),
        parseInt(row.store_id),
        parseInt(row.forecasted_sales),
        parseInt(row.required_labor_cost),
        parseInt(row.required_hours),
        row.notes || ''
      ]);
      imported++;
      if (imported % 5 === 0 || imported === records.length) {
        console.log(`✅ [${imported}/${records.length}] ${row.year}/${row.month} store_id=${row.store_id}`);
      }
    } catch (err) {
      console.error(`❌ エラー (${row.year}/${row.month} store_id=${row.store_id}):`, err.message);
    }
  }

  console.log(`\n✅ 売上予測インポート完了: ${imported}/${records.length} 件\n`);
}

async function verifyData() {
  console.log('\n📊 登録データ確認\n');

  const actualResult = await pool.query(`
    SELECT sa.year, sa.month, s.store_name, sa.actual_sales
    FROM analytics.sales_actual sa
    LEFT JOIN core.stores s ON sa.store_id = s.store_id
    WHERE sa.tenant_id = $1
    ORDER BY sa.year, sa.month, sa.store_id
  `, [tenantId]);

  console.log(`売上実績: ${actualResult.rows.length} 件`);
  if (actualResult.rows.length > 0) {
    console.table(actualResult.rows.slice(0, 10));
  }

  const forecastResult = await pool.query(`
    SELECT sf.year, sf.month, s.store_name, sf.forecasted_sales
    FROM analytics.sales_forecast sf
    LEFT JOIN core.stores s ON sf.store_id = s.store_id
    WHERE sf.tenant_id = $1
    ORDER BY sf.year, sf.month, sf.store_id
  `, [tenantId]);

  console.log(`\n売上予測: ${forecastResult.rows.length} 件`);
  if (forecastResult.rows.length > 0) {
    console.table(forecastResult.rows.slice(0, 10));
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('📦 売上データCSVインポート');
  console.log('='.repeat(60));

  try {
    await importSalesActual();
    await importSalesForecast();
    await verifyData();

    console.log('\n' + '='.repeat(60));
    console.log('✅ すべてのインポートが完了しました！');
    console.log('='.repeat(60) + '\n');

  } catch (err) {
    console.error('\n❌ エラー:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
