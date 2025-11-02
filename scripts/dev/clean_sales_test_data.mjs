#!/usr/bin/env node
/**
 * 売上テストデータを削除するスクリプト
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

const tenantId = 3;

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🗑️  売上テストデータ削除');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. 売上実績を削除
    console.log('[1/2] 売上実績データを削除中...');
    const actualResult = await pool.query(`
      DELETE FROM analytics.sales_actual
      WHERE tenant_id = $1
    `, [tenantId]);
    console.log(`✅ ${actualResult.rowCount} 件削除しました\n`);

    // 2. 売上予測を削除
    console.log('[2/2] 売上予測データを削除中...');
    const forecastResult = await pool.query(`
      DELETE FROM analytics.sales_forecast
      WHERE tenant_id = $1
    `, [tenantId]);
    console.log(`✅ ${forecastResult.rowCount} 件削除しました\n`);

    // 3. 確認
    console.log('[3/3] 削除後の確認...\n');

    const actualCount = await pool.query(`
      SELECT COUNT(*) FROM analytics.sales_actual WHERE tenant_id = $1
    `, [tenantId]);

    const forecastCount = await pool.query(`
      SELECT COUNT(*) FROM analytics.sales_forecast WHERE tenant_id = $1
    `, [tenantId]);

    console.log(`📊 残りのデータ件数:`);
    console.log(`  - 売上実績: ${actualCount.rows[0].count} 件`);
    console.log(`  - 売上予測: ${forecastCount.rows[0].count} 件\n`);

    console.log('='.repeat(60));
    console.log('✅ テストデータのクリーンアップ完了！');
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
