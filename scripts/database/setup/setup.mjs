#!/usr/bin/env node

/**
 * データベースセットアップメインスクリプト
 *
 * Usage:
 *   node setup.mjs --env dev      # 開発環境セットアップ
 *   node setup.mjs --env demo     # デモ環境セットアップ
 *   node setup.mjs --help         # ヘルプ表示
 */

import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envファイル読み込み
dotenv.config({ path: path.join(__dirname, '../../../backend/.env') });

const { Pool } = pkg;

// 環境設定
const ENVIRONMENTS = {
  dev: {
    name: '開発環境',
    ddl: ['../ddl/schema.sql'],
    dml: ['../dml/01_core_master.sql', '../dml/02_hr_master.sql', '../dml/03_ops_master.sql']
  },
  demo: {
    name: 'デモ環境',
    ddl: ['../ddl/schema.sql'],
    dml: ['../dml/01_core_master.sql', '../dml/02_hr_master.sql', '../dml/03_ops_master.sql'],
    scripts: ['./setup_tenant3_test_data.mjs']
  }
};

/**
 * SQLファイルを実行
 */
async function executeSqlFile(pool, filePath) {
  const absolutePath = path.resolve(__dirname, filePath);
  console.log(`📄 ${path.basename(filePath)} を実行中...`);

  const sql = fs.readFileSync(absolutePath, 'utf-8');

  try {
    await pool.query(sql);
    console.log(`✅ ${path.basename(filePath)} 完了`);
  } catch (error) {
    console.error(`❌ ${path.basename(filePath)} でエラー発生:`);
    console.error(error.message);
    throw error;
  }
}

/**
 * JavaScriptセットアップスクリプトを実行
 */
async function executeScript(scriptPath) {
  const absolutePath = path.resolve(__dirname, scriptPath);
  console.log(`\n🔧 ${path.basename(scriptPath)} を実行中...`);

  try {
    const module = await import(`file://${absolutePath}`);
    if (module.default && typeof module.default === 'function') {
      await module.default();
    } else if (module.setupTenant3Data) {
      await module.setupTenant3Data();
    }
    console.log(`✅ ${path.basename(scriptPath)} 完了`);
  } catch (error) {
    console.error(`❌ ${path.basename(scriptPath)} でエラー発生:`);
    console.error(error.message);
    throw error;
  }
}

/**
 * メインセットアップ処理
 */
async function setup(envName) {
  const env = ENVIRONMENTS[envName];

  if (!env) {
    console.error(`❌ 不明な環境: ${envName}`);
    console.log('利用可能な環境: dev, demo');
    process.exit(1);
  }

  console.log(`\n🚀 ${env.name}のセットアップを開始します\n`);
  console.log(`データベース: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || '(未設定)'}\n`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
  });

  try {
    // 1. DDL実行
    console.log('\n=== ステップ1: DDL（スキーマ作成） ===\n');
    for (const ddlFile of env.ddl) {
      await executeSqlFile(pool, ddlFile);
    }

    // 2. DML実行
    console.log('\n=== ステップ2: DML（マスターデータ登録） ===\n');
    for (const dmlFile of env.dml) {
      await executeSqlFile(pool, dmlFile);
    }

    // 3. 追加スクリプト実行
    if (env.scripts && env.scripts.length > 0) {
      console.log('\n=== ステップ3: 追加データ登録 ===\n');
      for (const scriptPath of env.scripts) {
        await executeScript(scriptPath);
      }
    }

    console.log('\n✨ セットアップが完了しました！\n');

  } catch (error) {
    console.error('\n💥 セットアップ中にエラーが発生しました\n');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * ヘルプ表示
 */
function showHelp() {
  console.log(`
データベースセットアップスクリプト

使い方:
  node setup.mjs --env <環境名>

環境:
  dev    開発環境（最小限のマスターデータのみ）
  demo   デモ環境（マスターデータ + Tenant3のシフトデータ）

例:
  node setup.mjs --env dev
  node setup.mjs --env demo
  `);
}

// コマンドライン引数処理
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

const envIndex = args.indexOf('--env');
const envName = envIndex >= 0 ? args[envIndex + 1] : 'dev';

setup(envName);
