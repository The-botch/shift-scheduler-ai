import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: 'postgresql://postgres:BWmHYBbEZqnptZRYmptockuomkHRWNPO@switchyard.proxy.rlwy.net:26491/railway',
  ssl: false
})

async function checkDB() {
  try {
    console.log('🔍 STG環境のDBスキーマを確認中...\n')

    // スキーマ一覧
    const schemas = await pool.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schema_name
    `)

    console.log('📂 スキーマ一覧:')
    if (schemas.rows.length === 0) {
      console.log('   (スキーマなし - 空のDB)')
    } else {
      schemas.rows.forEach(row => console.log(`   - ${row.schema_name}`))
    }

    // テーブル数確認
    if (schemas.rows.length > 0) {
      console.log('\n📊 テーブル数:')
      for (const schema of schemas.rows) {
        const tables = await pool.query(`
          SELECT COUNT(*) as count
          FROM information_schema.tables
          WHERE table_schema = $1
        `, [schema.schema_name])
        console.log(`   ${schema.schema_name}: ${tables.rows[0].count}テーブル`)
      }
    }

    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ エラー:', error.message)
    process.exit(1)
  }
}

checkDB()
