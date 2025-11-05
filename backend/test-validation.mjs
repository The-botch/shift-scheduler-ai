import { query } from './src/config/database.js'
import ConstraintValidationService from './src/services/shift/ConstraintValidationService.js'

async function testValidation() {
  try {
    console.log('=== バリデーションテスト開始 ===\n')

    // plan_id 327 (2025年12月、tenant_id=3, store_id=155) のデータを取得
    const planId = 327

    // シフトデータを取得
    const shiftsResult = await query(`
      SELECT shift_id, staff_id, shift_date, start_time, end_time, break_minutes, plan_id
      FROM ops.shifts
      WHERE plan_id = $1
      ORDER BY shift_date, staff_id
    `, [planId])

    console.log(`シフトデータ取得: ${shiftsResult.rows.length}件`)

    // スタッフデータを取得
    const staffResult = await query(`
      SELECT staff_id, name, employment_type
      FROM hr.staff
      WHERE tenant_id = 3
    `)

    console.log(`スタッフデータ取得: ${staffResult.rows.length}件`)

    // 店舗情報を取得
    const storeResult = await query(`
      SELECT store_id, name, business_hours_start, business_hours_end
      FROM hr.stores
      WHERE store_id = 155 AND tenant_id = 3
    `)

    console.log(`店舗データ取得: ${storeResult.rows.length}件\n`)

    // マスターデータを準備
    const masterData = {
      staff: staffResult.rows,
      storeInfo: storeResult.rows[0]
    }

    // バリデーション実行
    const validator = new ConstraintValidationService()
    const result = await validator.validateShifts(shiftsResult.rows, masterData)

    console.log('=== バリデーション結果 ===')
    console.log('サマリー:', JSON.stringify(result.summary, null, 2))
    console.log('\n=== 違反詳細（最初の20件）===')
    result.violations.slice(0, 20).forEach((v, i) => {
      console.log(`\n${i + 1}. [${v.level}] ${v.category}`)
      console.log(`   ${v.message}`)
    })

    // カテゴリ別の集計
    console.log('\n=== カテゴリ別違反件数 ===')
    const categoryStats = {}
    result.violations.forEach(v => {
      if (!categoryStats[v.category]) {
        categoryStats[v.category] = { ERROR: 0, WARNING: 0 }
      }
      categoryStats[v.category][v.level]++
    })
    console.log(JSON.stringify(categoryStats, null, 2))

    process.exit(0)
  } catch (error) {
    console.error('エラー:', error)
    process.exit(1)
  }
}

testValidation()
