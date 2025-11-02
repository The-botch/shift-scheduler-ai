#!/usr/bin/env node
/**
 * 売上データインポートのテストスクリプト
 */
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

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

// 店舗マッピングを取得
async function getStoreMapping() {
  const result = await pool.query(`
    SELECT store_id, store_code
    FROM core.stores
    WHERE tenant_id = $1
    ORDER BY store_id
  `, [tenantId]);

  const mapping = {};
  result.rows.forEach(row => {
    mapping[row.store_code] = row.store_id;
  });

  console.log('📍 店舗マッピング:');
  Object.entries(mapping).forEach(([code, id]) => {
    console.log(`  "${code}" → ${id}`);
  });
  console.log();

  return mapping;
}

// CSVファイルを読み込んで解析
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }

  return data;
}

// サンプルデータをインポート
async function testSalesActualImport(storeMapping) {
  console.log('\n' + '='.repeat(60));
  console.log('📥 売上実績インポートテスト');
  console.log('='.repeat(60) + '\n');

  const csvPath = path.join(__dirname, '..', '..', 'fixtures', 'sales_actual_tenant3.csv');
  const csvData = parseCSV(csvPath);

  console.log(`📄 CSV読み込み: ${csvData.length} 件\n`);

  // サンプルとして最初の2件のみテスト
  const sampleData = csvData.slice(0, 2);

  console.log('🧪 テストデータ（2件）:');
  sampleData.forEach((row, index) => {
    const storeId = storeMapping[row.store_code];
    console.log(`  [${index + 1}] ${row.year}年${row.month}月 ${row.store_code} → store_id=${storeId} 売上=${row.actual_sales}円`);

    if (!storeId) {
      console.error(`    ❌ エラー: 店舗コード "${row.store_code}" が見つかりません！`);
      return;
    }
  });
  console.log();

  // データベースに挿入
  let inserted = 0;
  for (const row of sampleData) {
    const storeId = storeMapping[row.store_code];
    if (!storeId) {
      console.error(`❌ スキップ: 不明な店舗コード "${row.store_code}"`);
      continue;
    }

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
        storeId,
        parseInt(row.actual_sales),
        parseInt(row.daily_average),
        row.notes || ''
      ]);
      inserted++;
      console.log(`✅ [${inserted}] ${row.year}/${row.month} ${row.store_code} (ID:${storeId}) 登録成功`);
    } catch (err) {
      console.error(`❌ エラー: ${err.message}`);
    }
  }

  console.log(`\n✅ インポート完了: ${inserted}/${sampleData.length} 件\n`);
}

// 売上予測のインポートテスト
async function testSalesForecastImport(storeMapping) {
  console.log('\n' + '='.repeat(60));
  console.log('📥 売上予測インポートテスト');
  console.log('='.repeat(60) + '\n');

  const csvPath = path.join(__dirname, '..', '..', 'fixtures', 'sales_forecast_tenant3.csv');
  const csvData = parseCSV(csvPath);

  console.log(`📄 CSV読み込み: ${csvData.length} 件\n`);

  // サンプルとして最初の2件のみテスト
  const sampleData = csvData.slice(0, 2);

  console.log('🧪 テストデータ（2件）:');
  sampleData.forEach((row, index) => {
    const storeId = storeMapping[row.store_code];
    console.log(`  [${index + 1}] ${row.year}年${row.month}月 ${row.store_code} → store_id=${storeId} 売上予測=${row.forecasted_sales}円`);

    if (!storeId) {
      console.error(`    ❌ エラー: 店舗コード "${row.store_code}" が見つかりません！`);
      return;
    }
  });
  console.log();

  // データベースに挿入
  let inserted = 0;
  for (const row of sampleData) {
    const storeId = storeMapping[row.store_code];
    if (!storeId) {
      console.error(`❌ スキップ: 不明な店舗コード "${row.store_code}"`);
      continue;
    }

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
        storeId,
        parseInt(row.forecasted_sales),
        parseInt(row.required_labor_cost),
        parseInt(row.required_hours),
        row.notes || ''
      ]);
      inserted++;
      console.log(`✅ [${inserted}] ${row.year}/${row.month} ${row.store_code} (ID:${storeId}) 登録成功`);
    } catch (err) {
      console.error(`❌ エラー: ${err.message}`);
    }
  }

  console.log(`\n✅ インポート完了: ${inserted}/${sampleData.length} 件\n`);
}

// インポート結果を確認
async function verifyImport() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 インポート結果確認');
  console.log('='.repeat(60) + '\n');

  const actualResult = await pool.query(`
    SELECT sa.year, sa.month, s.store_code, s.store_name, sa.actual_sales
    FROM analytics.sales_actual sa
    JOIN core.stores s ON sa.store_id = s.store_id
    WHERE sa.tenant_id = $1
    ORDER BY sa.year, sa.month, s.store_code
  `, [tenantId]);

  console.log(`📈 売上実績: ${actualResult.rows.length} 件`);
  if (actualResult.rows.length > 0) {
    console.table(actualResult.rows);
  }

  const forecastResult = await pool.query(`
    SELECT sf.year, sf.month, s.store_code, s.store_name, sf.forecasted_sales, sf.required_labor_cost
    FROM analytics.sales_forecast sf
    JOIN core.stores s ON sf.store_id = s.store_id
    WHERE sf.tenant_id = $1
    ORDER BY sf.year, sf.month, s.store_code
  `, [tenantId]);

  console.log(`\n📊 売上予測: ${forecastResult.rows.length} 件`);
  if (forecastResult.rows.length > 0) {
    console.table(forecastResult.rows);
  }

  console.log('\n' + '='.repeat(60));
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 売上データインポート テストスクリプト');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. 店舗マッピングを取得
    const storeMapping = await getStoreMapping();

    // 2. 売上実績のインポートテスト
    await testSalesActualImport(storeMapping);

    // 3. 売上予測のインポートテスト
    await testSalesForecastImport(storeMapping);

    // 4. 結果確認
    await verifyImport();

    console.log('\n✅ すべてのテストが完了しました！\n');

  } catch (err) {
    console.error('\n❌ エラー:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
