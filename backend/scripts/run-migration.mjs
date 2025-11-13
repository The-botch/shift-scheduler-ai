#!/usr/bin/env node
/**
 * マイグレーション実行スクリプト
 * 使い方: node scripts/run-migration.mjs <マイグレーションファイル名>
 * 例: node scripts/run-migration.mjs 007_line_integration_tables.sql
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// データベース接続
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : false
})

async function runMigration(migrationFile) {
  const client = await pool.connect()

  try {
    console.log(`\n📦 マイグレーション開始: ${migrationFile}`)

    // マイグレーションファイルを読み込み
    const migrationPath = join(__dirname, '../migrations', migrationFile)
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('📄 SQLファイル読み込み完了')

    // マイグレーション実行
    await client.query(sql)

    console.log('✅ マイグレーション完了！')
    console.log(`\n実行されたマイグレーション: ${migrationFile}`)

  } catch (error) {
    console.error('❌ マイグレーション失敗:', error.message)
    console.error('詳細:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

// コマンドライン引数からマイグレーションファイル名を取得
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ エラー: マイグレーションファイル名を指定してください')
  console.log('\n使い方:')
  console.log('  node scripts/run-migration.mjs <マイグレーションファイル名>')
  console.log('\n例:')
  console.log('  node scripts/run-migration.mjs 007_line_integration_tables.sql')
  process.exit(1)
}

// マイグレーション実行
runMigration(migrationFile)
