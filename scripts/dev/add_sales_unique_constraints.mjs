#!/usr/bin/env node
/**
 * 売上テーブルにUNIQUE制約を追加するスクリプト
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
  console.log('\n' + '='.repeat(60));
  console.log('🔧 売上テーブルにUNIQUE制約を追加');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. sales_actualにUNIQUE制約を追加
    console.log('[1/2] analytics.sales_actual にUNIQUE制約を追加中...');
    try {
      await pool.query(`
        ALTER TABLE analytics.sales_actual
        ADD CONSTRAINT uq_sales_actual_key
        UNIQUE (tenant_id, year, month, store_id)
      `);
      console.log('✅ UNIQUE制約を追加しました (tenant_id, year, month, store_id)\n');
    } catch (err) {
      if (err.code === '42P07') {
        console.log('ℹ️  UNIQUE制約は既に存在します\n');
      } else {
        throw err;
      }
    }

    // 2. sales_forecastにUNIQUE制約を追加
    console.log('[2/2] analytics.sales_forecast にUNIQUE制約を追加中...');
    try {
      await pool.query(`
        ALTER TABLE analytics.sales_forecast
        ADD CONSTRAINT uq_sales_forecast_key
        UNIQUE (tenant_id, year, month, store_id)
      `);
      console.log('✅ UNIQUE制約を追加しました (tenant_id, year, month, store_id)\n');
    } catch (err) {
      if (err.code === '42P07') {
        console.log('ℹ️  UNIQUE制約は既に存在します\n');
      } else {
        throw err;
      }
    }

    // 3. 確認
    console.log('[3/3] 制約を確認中...\n');

    const actualConstraints = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'analytics.sales_actual'::regclass
        AND contype IN ('u', 'p')
      ORDER BY conname
    `);

    console.log('📊 analytics.sales_actual の制約:');
    actualConstraints.rows.forEach(row => {
      const type = row.contype === 'p' ? 'PRIMARY KEY' : 'UNIQUE';
      console.log(`  - ${row.conname} (${type})`);
      console.log(`    ${row.def}`);
    });
    console.log();

    const forecastConstraints = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'analytics.sales_forecast'::regclass
        AND contype IN ('u', 'p')
      ORDER BY conname
    `);

    console.log('📊 analytics.sales_forecast の制約:');
    forecastConstraints.rows.forEach(row => {
      const type = row.contype === 'p' ? 'PRIMARY KEY' : 'UNIQUE';
      console.log(`  - ${row.conname} (${type})`);
      console.log(`    ${row.def}`);
    });
    console.log();

    console.log('='.repeat(60));
    console.log('✅ UNIQUE制約の追加が完了しました！');
    console.log('='.repeat(60) + '\n');

    console.log('💡 これにより:');
    console.log('  - ON CONFLICT DO UPDATEが使用可能になります');
    console.log('  - CSVインポートの重複データを自動更新できます\n');

  } catch (err) {
    console.error('\n❌ エラー:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
