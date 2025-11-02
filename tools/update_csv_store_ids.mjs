#!/usr/bin/env node
/**
 * CSVファイル内のstore_codeを実際のstore_idに置き換えるスクリプト
 */
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envを読み込む
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'shift_scheduler',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function getStoreIds(tenantId) {
  const result = await pool.query(`
    SELECT store_id, store_code, store_name
    FROM core.stores
    WHERE tenant_id = $1
    ORDER BY store_id
  `, [tenantId]);

  const storeMap = {};
  result.rows.forEach(row => {
    storeMap[row.store_code] = row.store_id;
  });

  return storeMap;
}

function updateCsvFile(filePath, storeMap) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  if (lines.length === 0) return;

  // ヘッダー行を確認
  const header = lines[0];
  const hasStoreCode = header.includes('store_code');

  if (!hasStoreCode) {
    console.log(`  ⚠️  ${path.basename(filePath)}: store_code列が見つかりません`);
    return;
  }

  // ヘッダーをstore_codeからstore_idに変更
  lines[0] = header.replace('store_code', 'store_id');

  // 各データ行を処理
  const headerCols = lines[0].split(',');
  const storeIdIndex = headerCols.indexOf('store_id');

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const cols = lines[i].split(',');
    const storeCode = cols[storeIdIndex];

    if (storeCode && storeMap[storeCode]) {
      cols[storeIdIndex] = storeMap[storeCode];
      lines[i] = cols.join(',');
    }
  }

  // ファイルに書き戻す
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  console.log(`  ✅ ${path.basename(filePath)}: store_codeをstore_idに変換しました`);
}

async function main() {
  const tenantId = 3;

  console.log('\n='.repeat(60));
  console.log('🔄 CSVファイルのstore_code→store_id変換');
  console.log('='.repeat(60));
  console.log(`\nテナントID: ${tenantId}\n`);

  try {
    // 店舗IDを取得
    const storeMap = await getStoreIds(tenantId);

    console.log('📊 店舗ID マッピング:');
    Object.entries(storeMap).forEach(([code, id]) => {
      console.log(`  ${code}: ${id}`);
    });
    console.log();

    // CSVファイルを更新
    const fixturesDir = path.join(__dirname, '..', 'fixtures');
    const files = [
      'sales_actual_tenant3.csv',
      'sales_forecast_tenant3.csv'
    ];

    console.log('📝 CSVファイル更新中...\n');
    for (const file of files) {
      const filePath = path.join(fixturesDir, file);
      if (fs.existsSync(filePath)) {
        updateCsvFile(filePath, storeMap);
      } else {
        console.log(`  ⚠️  ${file}: ファイルが見つかりません`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 変換完了！');
    console.log('='.repeat(60) + '\n');

  } catch (err) {
    console.error('❌ エラー:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
