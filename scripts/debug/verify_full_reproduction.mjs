#!/usr/bin/env node

/**
 * 完全再現性検証スクリプト
 *
 * テストDBを作成し、SQLファイルを投入して元のDBと比較します。
 * 元のDBには一切影響を与えません。
 */

import 'dotenv/config';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool, Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORIGINAL_DB_URL = process.env.DATABASE_URL;
const TEST_DB_NAME = 'shift_scheduler_test_verification';

// 元のDB URLからテストDB URLを生成
function getTestDbUrl() {
  const url = new URL(ORIGINAL_DB_URL);
  url.pathname = `/${TEST_DB_NAME}`;
  return url.toString();
}

async function createTestDatabase() {
  console.log('🔧 テストデータベース作成中...');

  // postgresデータベースに接続してテストDBを作成
  const url = new URL(ORIGINAL_DB_URL);
  url.pathname = '/postgres';
  const client = new Client({ connectionString: url.toString() });

  try {
    await client.connect();

    // 既存のテストDBを削除
    await client.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
    console.log(`  ✓ 既存のテストDBを削除`);

    // 新しいテストDBを作成
    await client.query(`CREATE DATABASE ${TEST_DB_NAME}`);
    console.log(`  ✓ テストDB "${TEST_DB_NAME}" を作成`);

  } finally {
    await client.end();
  }
}

async function loadSqlFiles() {
  console.log('\n📥 SQLファイルを投入中...');

  const testDbUrl = getTestDbUrl();
  const scriptsDir = path.join(__dirname, 'setup');
  const client = new Client({ connectionString: testDbUrl });

  const files = [
    { name: 'schema.sql', desc: 'スキーマ定義' },
    { name: 'seed_data.sql', desc: 'マスターデータ' },
    { name: 'seed_transaction_data.sql', desc: 'トランザクションデータ' }
  ];

  try {
    await client.connect();

    for (const file of files) {
      const filePath = path.join(scriptsDir, file.name);
      console.log(`  投入中: ${file.desc} (${file.name})...`);

      try {
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        console.log(`  ✓ ${file.name} 完了`);
      } catch (error) {
        console.error(`  ✗ ${file.name} エラー:`, error.message);
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

async function compareData() {
  console.log('\n🔍 データ比較中...\n');

  const originalPool = new Pool({ connectionString: ORIGINAL_DB_URL });
  const testPool = new Pool({ connectionString: getTestDbUrl() });

  const tables = [
    { schema: 'ops', table: 'shift_plans', key: 'plan_id' },
    { schema: 'ops', table: 'demand_forecasts', key: 'forecast_id' },
    { schema: 'ops', table: 'shift_preferences', key: 'preference_id' },
    { schema: 'ops', table: 'shifts', key: 'shift_id' },
    { schema: 'ops', table: 'work_hours_actual', key: 'work_hours_id' },
    { schema: 'hr', table: 'payroll', key: 'payroll_id' },
    { schema: 'analytics', table: 'sales_actual', key: 'actual_id' },
    { schema: 'analytics', table: 'sales_forecast', key: 'forecast_id' },
    { schema: 'analytics', table: 'dashboard_metrics', key: 'metric_id' }
  ];

  let allMatch = true;
  const results = [];

  for (const { schema, table, key } of tables) {
    const fullTableName = `${schema}.${table}`;

    // 件数比較
    const originalCount = await originalPool.query(`SELECT COUNT(*) FROM ${fullTableName}`);
    const testCount = await testPool.query(`SELECT COUNT(*) FROM ${fullTableName}`);

    const originalNum = parseInt(originalCount.rows[0].count);
    const testNum = parseInt(testCount.rows[0].count);

    const countMatch = originalNum === testNum;

    if (!countMatch) {
      allMatch = false;
      results.push({
        table: fullTableName,
        status: '❌',
        originalCount: originalNum,
        testCount: testNum,
        message: `件数不一致: 元=${originalNum}, テスト=${testNum}`
      });
      continue;
    }

    // created_at, updated_atを除外してデータ比較（サンプル）
    const sampleSize = Math.min(100, originalNum);
    if (sampleSize > 0) {
      const originalData = await originalPool.query(
        `SELECT * FROM ${fullTableName} ORDER BY ${key} LIMIT ${sampleSize}`
      );
      const testData = await testPool.query(
        `SELECT * FROM ${fullTableName} ORDER BY ${key} LIMIT ${sampleSize}`
      );

      let mismatchCount = 0;
      for (let i = 0; i < originalData.rows.length; i++) {
        const origRow = originalData.rows[i];
        const testRow = testData.rows[i];

        // created_at, updated_at, auto-increment IDを除外して比較
        for (const col of Object.keys(origRow)) {
          if (col === 'created_at' || col === 'updated_at' || col.endsWith('_id')) {
            continue;
          }

          const origVal = JSON.stringify(origRow[col]);
          const testVal = JSON.stringify(testRow[col]);

          if (origVal !== testVal) {
            mismatchCount++;
            if (mismatchCount === 1) {
              console.log(`  ⚠️  ${fullTableName}: データ不一致検出`);
              console.log(`     行${i + 1}, カラム=${col}`);
              console.log(`     元: ${origVal}`);
              console.log(`     テスト: ${testVal}`);
            }
            break;
          }
        }
      }

      if (mismatchCount > 0) {
        allMatch = false;
        results.push({
          table: fullTableName,
          status: '❌',
          originalCount: originalNum,
          testCount: testNum,
          message: `データ不一致: ${mismatchCount}件のミスマッチ`
        });
      } else {
        results.push({
          table: fullTableName,
          status: '✅',
          originalCount: originalNum,
          testCount: testNum,
          message: `完全一致（${sampleSize}件サンプル検証）`
        });
      }
    } else {
      results.push({
        table: fullTableName,
        status: '✅',
        originalCount: 0,
        testCount: 0,
        message: 'データなし（一致）'
      });
    }
  }

  await originalPool.end();
  await testPool.end();

  // 結果表示
  console.log('## 検証結果\n');
  console.log('| テーブル | 状態 | 元DB | テストDB | 備考 |');
  console.log('|---------|------|------|---------|------|');

  for (const result of results) {
    const padding = ' '.repeat(Math.max(0, 25 - result.table.length));
    console.log(`| ${result.table}${padding} | ${result.status} | ${result.originalCount}件 | ${result.testCount}件 | ${result.message} |`);
  }

  return allMatch;
}

async function cleanup() {
  console.log('\n🧹 テストデータベース削除中...');

  const url = new URL(ORIGINAL_DB_URL);
  url.pathname = '/postgres';
  const client = new Client({ connectionString: url.toString() });

  try {
    await client.connect();
    await client.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
    console.log(`  ✓ テストDB "${TEST_DB_NAME}" を削除`);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('==============================================');
  console.log('完全再現性検証');
  console.log('==============================================\n');

  try {
    await createTestDatabase();
    await loadSqlFiles();
    const allMatch = await compareData();
    await cleanup();

    console.log('\n==============================================');
    if (allMatch) {
      console.log('✅ 検証成功: 完全に再現できます！');
      console.log('==============================================\n');
      process.exit(0);
    } else {
      console.log('❌ 検証失敗: データに差異があります');
      console.log('==============================================\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);

    // エラー時もクリーンアップを試みる
    try {
      await cleanup();
    } catch (cleanupError) {
      console.error('クリーンアップエラー:', cleanupError.message);
    }

    process.exit(1);
  }
}

main();
