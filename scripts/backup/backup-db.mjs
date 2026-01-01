#!/usr/bin/env node

/**
 * データベースバックアップスクリプト
 *
 * Phase 1: ローカル手動実行用（現在の実装）
 * - 本番DBからバックアップを取得してローカルに保存
 *
 * Phase 2: SharePoint自動アップロード対応（将来実装予定）
 * - GitHub Actionsで自動実行
 * - SharePointへの自動アップロード
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../..');

// プロジェクトルートの.envファイルを読み込む
dotenv.config({ path: path.join(rootDir, '.env') });

// 設定
const BACKUP_ROOT_DIR = path.join(__dirname, '../../backups');
const now = new Date();
const TIMESTAMP = now.toISOString()
  .replace(/T/, '-')
  .replace(/:/g, '')
  .replace(/\..+/, '')
  .slice(0, 15); // YYYY-MM-DD-HHMMSS 形式
const BACKUP_DIR = path.join(BACKUP_ROOT_DIR, TIMESTAMP);

// 環境変数からデータベースURLを取得
const DATABASE_URL = process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL;

// バックアップ対象のスキーマ
const SCHEMAS = ['core', 'hr', 'ops', 'analytics'];

/**
 * 各スキーマのバックアップを作成
 */
async function backupSchema(schema) {
  const backupFile = path.join(BACKUP_DIR, `${schema}.dmp`);

  console.log(`💾 スキーマ「${schema}」をバックアップ中...`);

  try {
    // pg_dump で dmp 形式（カスタムフォーマット）でバックアップを作成
    const { stdout, stderr } = await execAsync(
      `pg_dump -Fc -n ${schema} "${DATABASE_URL}" -f "${backupFile}"`,
      { maxBuffer: 1024 * 1024 * 100 } // 100MB buffer
    );

    if (stderr && !stderr.includes('WARNING')) {
      console.warn(`⚠️  警告 (${schema}):`, stderr);
    }

    // ファイルサイズを確認
    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ ${schema}: ${fileSizeMB} MB`);

    return { schema, success: true, file: backupFile, size: fileSizeMB };

  } catch (error) {
    console.error(`❌ ${schema}: バックアップに失敗しました -`, error.message);
    return { schema, success: false, error: error.message };
  }
}

/**
 * データベースのバックアップを作成
 */
async function createBackup() {
  console.log('🚀 データベースバックアップを開始します...');
  console.log(`📅 日時: ${now.toLocaleString('ja-JP')}`);
  console.log(`📋 対象スキーマ: ${SCHEMAS.join(', ')}`);
  console.log(`📂 保存フォルダ: ${TIMESTAMP}`);
  console.log('');

  // DATABASE_URLのチェック
  if (!DATABASE_URL) {
    console.error('❌ エラー: DATABASE_URL または DATABASE_URL_PRODUCTION が設定されていません');
    console.error('');
    console.error('以下のいずれかの方法で設定してください：');
    console.error('1. プロジェクトルートの .env ファイルに DATABASE_URL_PRODUCTION を追加');
    console.error('2. コマンド実行時に環境変数を指定:');
    console.error('   DATABASE_URL_PRODUCTION="postgresql://..." npm run bk:prod');
    process.exit(1);
  }

  // バックアップディレクトリの作成（タイムスタンプごとのフォルダ）
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log(`📁 バックアップディレクトリを作成: ${BACKUP_DIR}`);
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  try {
    // 各スキーマを順番にバックアップ
    const results = [];

    for (const schema of SCHEMAS) {
      const result = await backupSchema(schema);
      results.push(result);
    }

    console.log('');
    console.log('📊 バックアップ結果サマリー:');
    console.log('');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
      console.log(`✅ 成功: ${successful.length}/${SCHEMAS.length} スキーマ`);
      successful.forEach(r => {
        console.log(`   - ${r.schema}: ${r.size} MB`);
      });
    }

    if (failed.length > 0) {
      console.log('');
      console.log(`❌ 失敗: ${failed.length}/${SCHEMAS.length} スキーマ`);
      failed.forEach(r => {
        console.log(`   - ${r.schema}: ${r.error}`);
      });
    }

    console.log('');
    console.log(`📍 保存場所: ${BACKUP_DIR}`);
    console.log('');

    // 古いバックアップファイルを確認
    listBackups();

    // 失敗があった場合はエラー終了
    if (failed.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ バックアップ中にエラーが発生しました:', error.message);

    // エラーの詳細を表示
    if (error.message.includes('pg_dump')) {
      console.error('');
      console.error('💡 pg_dump がインストールされていない可能性があります。');
      console.error('以下のコマンドでインストールしてください：');
      console.error('  macOS: brew install postgresql');
      console.error('  Ubuntu: sudo apt-get install postgresql-client');
      console.error('  Windows: https://www.postgresql.org/download/windows/');
    }

    process.exit(1);
  }
}

/**
 * 既存のバックアップフォルダ一覧を表示
 */
function listBackups() {
  if (!fs.existsSync(BACKUP_ROOT_DIR)) {
    return;
  }

  // バックアップフォルダを取得（タイムスタンプ形式のフォルダのみ）
  const folders = fs.readdirSync(BACKUP_ROOT_DIR)
    .filter(item => {
      const fullPath = path.join(BACKUP_ROOT_DIR, item);
      return fs.statSync(fullPath).isDirectory() && /^\d{4}-\d{2}-\d{2}-\d{6}$/.test(item);
    })
    .sort()
    .reverse();

  if (folders.length > 0) {
    console.log('📋 既存のバックアップ:');
    console.log('');

    folders.forEach((folder, index) => {
      const isLatest = index === 0;
      const folderPath = path.join(BACKUP_ROOT_DIR, folder);

      // フォルダ内のdmpファイルを取得
      const files = fs.existsSync(folderPath)
        ? fs.readdirSync(folderPath).filter(file => file.endsWith('.dmp'))
        : [];

      // 合計サイズを計算
      let totalSize = 0;
      const schemaInfo = [];

      files.forEach(file => {
        const filePath = path.join(folderPath, file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const fileSizeMB = stats.size / (1024 * 1024);
          totalSize += fileSizeMB;

          const schema = file.replace('.dmp', '');
          schemaInfo.push({ schema, size: fileSizeMB.toFixed(2) });
        }
      });

      console.log(`  ${isLatest ? '✨' : '  '} ${folder}${isLatest ? ' [最新]' : ''}`);
      console.log(`     合計: ${totalSize.toFixed(2)} MB (${files.length} スキーマ)`);

      schemaInfo.forEach(info => {
        console.log(`     - ${info.schema}: ${info.size} MB`);
      });

      console.log('');
    });

    console.log(`💡 ヒント: 古いバックアップフォルダは手動で削除してください (${BACKUP_ROOT_DIR})`);
  }
}

// スクリプト実行
createBackup();
