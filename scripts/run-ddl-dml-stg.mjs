import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pool = new Pool({
  connectionString: 'postgresql://postgres:BWmHYBbEZqnptZRYmptockuomkHRWNPO@switchyard.proxy.rlwy.net:26491/railway',
  ssl: false
})

async function runDDLandDML() {
  const client = await pool.connect()

  try {
    console.log('🔄 STG環境のDBを再構築します（テナントID 3のみ）...\n')

    // 1. 既存のスキーマを削除
    console.log('📦 既存のスキーマを削除中...')
    await client.query('DROP SCHEMA IF EXISTS analytics CASCADE')
    await client.query('DROP SCHEMA IF EXISTS ops CASCADE')
    await client.query('DROP SCHEMA IF EXISTS hr CASCADE')
    await client.query('DROP SCHEMA IF EXISTS core CASCADE')
    console.log('✅ 既存のスキーマを削除しました\n')

    // 2. DDL（スキーマ）を実行
    console.log('🏗️  DDL（スキーマ）を実行中...')
    const ddlPath = path.join(__dirname, 'database/ddl/schema.sql')
    const ddlSQL = fs.readFileSync(ddlPath, 'utf8')
    await client.query(ddlSQL)
    console.log('✅ DDL実行完了\n')

    // 3. DML（マスターデータ）を実行 - テナントID 3のみ
    console.log('📝 DML（テナントID 3）を実行中...')
    const dmlFiles = [
      'database/dml/01_core_master.sql',
      'database/dml/02_hr_master.sql',
      'database/dml/03_ops_master.sql'
    ]

    for (const dmlFile of dmlFiles) {
      console.log(`   - ${dmlFile}`)
      const dmlPath = path.join(__dirname, dmlFile)
      const dmlSQL = fs.readFileSync(dmlPath, 'utf8')
      await client.query(dmlSQL)
    }
    console.log('✅ DML実行完了\n')

    // 4. テナント3のテストデータ投入（CSVから）
    console.log('📝 テナント3のテストデータ投入中...')
    try {
      const { setupTenant3Data } = await import('./database/setup/setup_tenant3_test_data.mjs')
      await setupTenant3Data(client)
      console.log('✅ テストデータ投入完了\n')
    } catch (error) {
      console.error('⚠️  テストデータ投入でエラーが発生しました:', error.message)
      console.error('   スキップして続行します...\n')
    }

    // 5. データ確認
    console.log('🔍 データ確認中...')

    const tenants = await client.query('SELECT tenant_id, tenant_name FROM core.tenants ORDER BY tenant_id')
    console.log('\n📋 テナント一覧:')
    tenants.rows.forEach(row => {
      console.log(`   テナント${row.tenant_id}: ${row.tenant_name}`)
    })

    const staffCount = await client.query(`
      SELECT tenant_id, COUNT(*) as count
      FROM hr.staff
      GROUP BY tenant_id
      ORDER BY tenant_id
    `)
    console.log('\n👥 スタッフ数:')
    staffCount.rows.forEach(row => {
      console.log(`   テナント${row.tenant_id}: ${row.count}名`)
    })

    const storeCount = await client.query(`
      SELECT tenant_id, COUNT(*) as count
      FROM core.stores
      GROUP BY tenant_id
      ORDER BY tenant_id
    `)
    console.log('\n🏪 店舗数:')
    storeCount.rows.forEach(row => {
      console.log(`   テナント${row.tenant_id}: ${row.count}店舗`)
    })

    const tableCount = await client.query(`
      SELECT
        schemaname,
        COUNT(*) as table_count
      FROM pg_tables
      WHERE schemaname IN ('core', 'hr', 'ops', 'analytics')
      GROUP BY schemaname
      ORDER BY schemaname
    `)
    console.log('\n📊 テーブル数:')
    tableCount.rows.forEach(row => {
      console.log(`   ${row.schemaname}: ${row.table_count}テーブル`)
    })

    console.log('\n🎉 DDL/DML実行完了！')

  } catch (error) {
    console.error('❌ エラー:', error.message)
    console.error(error.stack)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runDDLandDML()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
