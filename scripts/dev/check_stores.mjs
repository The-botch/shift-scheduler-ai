#!/usr/bin/env node
/**
 * 店舗マスターデータの確認スクリプト
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

  console.log('\n' + '='.repeat(60));
  console.log('🏪 店舗マスターデータ確認');
  console.log('='.repeat(60));
  console.log(`テナントID: ${tenantId}\n`);

  try {
    const result = await pool.query(`
      SELECT store_id, store_code, store_name, address
      FROM core.stores
      WHERE tenant_id = $1
      ORDER BY store_id
    `, [tenantId]);

    console.log(`📋 店舗一覧: ${result.rows.length} 件\n`);

    if (result.rows.length > 0) {
      console.table(result.rows);

      console.log('\n🗺️  Store Code → Store ID マッピング:');
      result.rows.forEach(row => {
        console.log(`  "${row.store_code}" → ${row.store_id} (${row.store_name})`);
      });
    } else {
      console.log('  ❌ データなし\n');
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
