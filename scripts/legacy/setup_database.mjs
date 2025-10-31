#!/usr/bin/env node

/**
 * データベース完全セットアップスクリプト
 *
 * リポジトリをcloneした人が自分のデータベースをセットアップする際に実行
 *
 * 実行順序:
 * 1. DDL実行（テーブル作成）
 * 2. 基本マスターデータシード投入
 * 3. オプション: 詳細マスターデータ投入
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ エラー: DATABASE_URL環境変数が設定されていません');
  console.error('');
  console.error('使用方法:');
  console.error('  export DATABASE_URL="postgresql://user:password@host:port/database"');
  console.error('  node scripts/setup_database.mjs');
  console.error('');
  process.exit(1);
}

async function setupDatabase() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 データベースへ接続中...\n');
    await client.connect();
    console.log('✅ 接続成功！\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 データベースセットアップ開始');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // スキーマ作成
    console.log('[1/2] schema.sqlを実行中...');
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('  ✅ 完了\n');

    // シードデータ投入
    console.log('[2/2] seed_data.sqlを実行中...');
    const seedPath = path.join(__dirname, 'db', 'seed_data.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('  ✅ 完了\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 データベースセットアップ完了！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📌 次のステップ（オプション）:\n');
    console.log('  詳細なマスターデータ（17個のCSVファイル）を投入する場合:');
    console.log('  node scripts/import_all_17_masters.mjs\n');

  } catch (error) {
    console.error('❌ エラー発生:', error.message);
    console.error('詳細:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 接続切断');
  }
}

setupDatabase();
