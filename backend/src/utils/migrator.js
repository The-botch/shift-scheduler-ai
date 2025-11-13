/**
 * データベースマイグレーション管理
 * サーバー起動時に自動実行される
 */

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import db from '../config/database.js'

const pool = db.getPool()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * 自動実行が許可されたマイグレーション（ホワイトリスト）
 * 既存データに影響を与えないマイグレーションのみを指定
 */
const ALLOWED_MIGRATIONS = [
  '007_line_integration_tables.sql'  // LINE連携テーブル作成（新規テーブルのみ）
]

/**
 * マイグレーション履歴テーブルを作成
 */
async function createMigrationTable() {
  const client = await pool.connect()
  try {
    // 既存のテーブルを確認
    const tableCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'schema_migrations'
    `)

    if (tableCheck.rows.length === 0) {
      // テーブルが存在しない場合は作成
      await client.query(`
        CREATE TABLE public.schema_migrations (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('✅ Migration tracking table created')
    } else {
      // テーブルが存在する場合、migration_nameカラムがあるか確認
      const hasMigrationName = tableCheck.rows.some(row => row.column_name === 'migration_name')

      if (!hasMigrationName) {
        // 古いテーブルを削除して再作成
        console.log('⚠️  Recreating schema_migrations table with correct structure')
        await client.query('DROP TABLE IF EXISTS public.schema_migrations CASCADE')
        await client.query(`
          CREATE TABLE public.schema_migrations (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `)
        console.log('✅ Migration tracking table recreated')
      } else {
        console.log('✅ Migration tracking table ready')
      }
    }
  } catch (error) {
    console.error('❌ Failed to create migration table:', error.message)
    throw error
  } finally {
    client.release()
  }
}

/**
 * 実行済みマイグレーションを取得
 */
async function getExecutedMigrations() {
  const client = await pool.connect()
  try {
    const result = await client.query(
      'SELECT migration_name FROM public.schema_migrations ORDER BY executed_at'
    )
    return result.rows.map(row => row.migration_name)
  } catch (error) {
    console.error('❌ Failed to get executed migrations:', error.message)
    return []
  } finally {
    client.release()
  }
}

/**
 * マイグレーションを実行
 */
async function executeMigration(migrationFile, sql) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // マイグレーションSQL実行
    await client.query(sql)

    // 履歴に記録
    await client.query(
      'INSERT INTO public.schema_migrations (migration_name) VALUES ($1)',
      [migrationFile]
    )

    await client.query('COMMIT')
    console.log(`✅ Migration executed: ${migrationFile}`)
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(`❌ Migration failed: ${migrationFile}`, error.message)
    throw error
  } finally {
    client.release()
  }
}

/**
 * すべての未実行マイグレーションを実行
 */
export async function runPendingMigrations() {
  try {
    console.log('\n📦 Checking for pending migrations...')

    // マイグレーション履歴テーブルを作成
    await createMigrationTable()

    // 実行済みマイグレーションを取得
    const executedMigrations = await getExecutedMigrations()

    // マイグレーションファイルを取得（ホワイトリストのみ）
    const migrationsDir = join(__dirname, '../../migrations')
    const allFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    // ホワイトリストに含まれるファイルのみ実行
    const files = allFiles.filter(f => ALLOWED_MIGRATIONS.includes(f))

    if (files.length === 0) {
      console.log('ℹ️  No allowed migrations to run')
      return
    }

    // 未実行のマイグレーションを実行
    let executedCount = 0
    for (const file of files) {
      if (!executedMigrations.includes(file)) {
        console.log(`\n📄 Running migration: ${file}`)
        const sql = readFileSync(join(migrationsDir, file), 'utf-8')
        await executeMigration(file, sql)
        executedCount++
      }
    }

    if (executedCount === 0) {
      console.log('✅ All migrations up to date')
    } else {
      console.log(`\n✅ Successfully executed ${executedCount} migration(s)`)
    }

  } catch (error) {
    console.error('\n❌ Migration process failed:', error)
    throw error
  }
}
