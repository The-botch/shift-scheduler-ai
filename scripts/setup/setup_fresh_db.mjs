#!/usr/bin/env node

/**
 * データベース完全セットアップスクリプト
 *
 * 実行内容:
 * 1. 既存のすべてのテーブル・スキーマを削除
 * 2. schema.sqlを実行してテーブル作成
 * 3. seed_data.sqlを実行して基本データ投入
 * 4. verify_setup.mjsで検証
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL環境変数が設定されていません');
  process.exit(1);
}

async function setupFreshDatabase() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 データベースへ接続中...\n');
    await client.connect();
    console.log('✅ 接続成功！\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️  ステップ1: 既存データベースクリア');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const dropSQL = fs.readFileSync(path.join(__dirname, '..', 'dev', 'drop_all.sql'), 'utf8');
    await client.query(dropSQL);
    console.log('✅ すべてのスキーマとテーブルを削除しました\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 ステップ2: スキーマとテーブル作成');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('✅ schema.sql実行完了 - 17マスターテーブル作成\n');

    // テーブル数確認
    const tablesResult = await client.query(`
      SELECT schemaname, COUNT(*) as count
      FROM pg_tables
      WHERE schemaname IN ('core', 'hr', 'ops')
      GROUP BY schemaname
      ORDER BY schemaname;
    `);

    let totalTables = 0;
    for (const row of tablesResult.rows) {
      console.log(`   ${row.schemaname}: ${row.count}テーブル`);
      totalTables += parseInt(row.count);
    }
    console.log(`   合計: ${totalTables}テーブル\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌱 ステップ3: 基本シードデータ投入');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const seedSQL = fs.readFileSync(path.join(__dirname, 'seed_data.sql'), 'utf8');
    await client.query(seedSQL);
    console.log('✅ seed_data.sql実行完了\n');

    await client.end();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 データベースセットアップ完了！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📌 次のステップ:\n');
    console.log('  詳細マスターデータを投入する場合:');
    console.log('  node scripts/setup/import_all_17_masters.mjs\n');
    console.log('  セットアップを検証する場合:');
    console.log('  node scripts/setup/verify_setup.mjs\n');

  } catch (error) {
    console.error('❌ エラー発生:', error.message);
    console.error('詳細:', error);
    process.exit(1);
  }
}

setupFreshDatabase();
