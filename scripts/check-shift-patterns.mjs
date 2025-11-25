import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: 'postgresql://postgres:BWmHYBbEZqnptZRYmptockuomkHRWNPO@switchyard.proxy.rlwy.net:26491/railway',
  ssl: false
})

async function checkShiftPatterns() {
  try {
    console.log('🔍 shift_patternsテーブルを確認中...\n')

    // テナント3のshift_patternsデータを確認
    const result = await pool.query(`
      SELECT pattern_id, pattern_code, pattern_name, tenant_id, is_active
      FROM core.shift_patterns
      WHERE tenant_id = 3
      ORDER BY pattern_id
      LIMIT 20
    `)

    console.log(`📋 テナント3のshift_patterns: ${result.rows.length}件\n`)
    if (result.rows.length === 0) {
      console.log('⚠️  データなし - shift_patternsのDMLが実行されていません')
    } else {
      result.rows.forEach(row => {
        console.log(`  - pattern_id=${row.pattern_id}, code=${row.pattern_code}, name=${row.pattern_name}, active=${row.is_active}`)
      })
    }

    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ エラー:', error.message)
    await pool.end()
    process.exit(1)
  }
}

checkShiftPatterns()
