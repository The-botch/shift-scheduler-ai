/**
 * データリセットツール
 *
 * 使い方:
 *   node scripts/tools/reset-data.mjs --dry-run
 *   node scripts/tools/reset-data.mjs --year 2025 --month 1 --execute
 *   node scripts/tools/reset-data.mjs --year 2025 --tables shifts,shift_preferences --execute
 *   node scripts/tools/reset-data.mjs --all --execute
 *
 * オプション:
 *   --year      対象年（省略時: 全期間）
 *   --month     対象月（省略時: 指定年の全月）
 *   --store     対象店舗ID（省略時: 全店舗）
 *   --tables    対象テーブル（カンマ区切り、省略時: shifts,shift_preferences,shift_plans）
 *   --all       全データ削除（マスタ以外）
 *   --dry-run   削除前に確認のみ（デフォルト）
 *   --execute   実際に削除する
 */

import pg from 'pg'
const { Pool } = pg

// 接続設定（STG環境）
const pool = new Pool({
  connectionString: 'postgresql://postgres:BWmHYBbEZqnptZRYmptockuomkHRWNPO@switchyard.proxy.rlwy.net:26491/railway',
  ssl: { rejectUnauthorized: false }
})

// 引数パース
const args = process.argv.slice(2)

const getArg = (name) => {
  const prefixed = args.find(a => a.startsWith(`--${name}=`))?.split('=')[1]
  if (prefixed) return prefixed
  const idx = args.indexOf(`--${name}`)
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
    return args[idx + 1]
  }
  return null
}

const yearArg = getArg('year')
const monthArg = getArg('month')
const storeArg = getArg('store')
const tablesArg = getArg('tables')
const deleteAll = args.includes('--all')
const isDryRun = !args.includes('--execute')

const TENANT_ID = 3 // テナントID

// 対象テーブル
const DEFAULT_TABLES = ['shifts', 'shift_preferences', 'shift_plans']
const ALL_DATA_TABLES = [
  'ops.shifts',
  'ops.shift_preferences',
  'ops.shift_plans',
  'ops.notifications',
  'hr.payroll',
]

const targetTables = tablesArg ? tablesArg.split(',').map(t => t.trim()) : DEFAULT_TABLES

// ヘルプ表示
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
使い方: node reset-data.mjs [オプション]

フィルタ:
  --year <年>        対象年（例: 2025）
  --month <月>       対象月（例: 1）
  --store <店舗ID>   対象店舗（例: 6）
  --tables <テーブル> 対象テーブル（カンマ区切り）
                     使用可能: shifts, shift_preferences, shift_plans

特殊:
  --all              全データ削除（マスタ以外）

アクション:
  --dry-run          確認のみ（デフォルト）
  --execute          実際に削除

例:
  node reset-data.mjs --dry-run
  node reset-data.mjs --year 2025 --month 1 --execute
  node reset-data.mjs --year 2025 --tables shifts,shift_preferences --execute
  node reset-data.mjs --all --execute
`)
  process.exit(0)
}

// メイン処理
async function main() {
  console.log('='.repeat(60))
  console.log(`データリセットツール`)
  console.log('='.repeat(60))
  console.log(`対象年: ${yearArg || '全期間'}`)
  console.log(`対象月: ${monthArg || '全月'}`)
  console.log(`対象店舗: ${storeArg || '全店舗'}`)
  console.log(`対象テーブル: ${deleteAll ? 'ALL (マスタ以外)' : targetTables.join(', ')}`)
  console.log(`モード: ${isDryRun ? 'ドライラン（確認のみ）' : '実行（削除）'}`)
  console.log('='.repeat(60))

  try {
    // 現在のデータ件数を表示
    console.log('\n=== 現在のデータ件数 ===')

    const tables = deleteAll ? ALL_DATA_TABLES : targetTables.map(t => {
      if (t === 'shifts') return 'ops.shifts'
      if (t === 'shift_preferences') return 'ops.shift_preferences'
      if (t === 'shift_plans') return 'ops.shift_plans'
      return t
    })

    const counts = {}
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table} WHERE tenant_id = $1`, [TENANT_ID])
      counts[table] = parseInt(result.rows[0].count)
      console.log(`  ${table}: ${counts[table]}件`)
    }

    // 削除対象件数を計算
    console.log('\n=== 削除対象 ===')

    const deleteTargets = {}

    for (const table of tables) {
      let conditions = [`tenant_id = ${TENANT_ID}`]

      if (yearArg) {
        if (table.includes('shift_preferences')) {
          conditions.push(`EXTRACT(YEAR FROM preference_date) = ${yearArg}`)
          if (monthArg) {
            conditions.push(`EXTRACT(MONTH FROM preference_date) = ${monthArg}`)
          }
        } else if (table.includes('shifts')) {
          conditions.push(`EXTRACT(YEAR FROM shift_date) = ${yearArg}`)
          if (monthArg) {
            conditions.push(`EXTRACT(MONTH FROM shift_date) = ${monthArg}`)
          }
        } else if (table.includes('shift_plans')) {
          conditions.push(`plan_year = ${yearArg}`)
          if (monthArg) {
            conditions.push(`plan_month = ${monthArg}`)
          }
        }
      }

      if (storeArg && (table.includes('shifts') || table.includes('shift_preferences') || table.includes('shift_plans'))) {
        conditions.push(`store_id = ${storeArg}`)
      }

      const whereClause = conditions.join(' AND ')
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table} WHERE ${whereClause}`)
      const targetCount = parseInt(countResult.rows[0].count)

      deleteTargets[table] = {
        count: targetCount,
        whereClause,
      }

      console.log(`  ${table}: ${targetCount}件`)
    }

    // 合計
    const totalToDelete = Object.values(deleteTargets).reduce((sum, t) => sum + t.count, 0)
    console.log(`\n  合計: ${totalToDelete}件`)

    if (totalToDelete === 0) {
      console.log('\n削除対象のデータがありません。')
      await pool.end()
      return
    }

    if (isDryRun) {
      console.log('\n[ドライラン] 実際の削除は行いません。')
      console.log('削除を実行するには --execute オプションを付けて実行してください。')
    } else {
      console.log('\n削除を実行します...')

      // 削除順序を考慮（外部キー制約がある場合）
      const deleteOrder = [
        'ops.shifts',
        'ops.shift_preferences',
        'ops.shift_plans',
        'ops.notifications',
        'hr.payroll',
      ]

      for (const table of deleteOrder) {
        if (!deleteTargets[table]) continue

        const { whereClause, count } = deleteTargets[table]
        if (count === 0) continue

        const result = await pool.query(`DELETE FROM ${table} WHERE ${whereClause}`)
        console.log(`  ${table}: ${result.rowCount}件削除`)
      }

      console.log('\n削除完了')

      // 削除後の件数を表示
      console.log('\n=== 削除後のデータ件数 ===')
      for (const table of tables) {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table} WHERE tenant_id = $1`, [TENANT_ID])
        console.log(`  ${table}: ${result.rows[0].count}件`)
      }
    }

  } catch (error) {
    console.error('エラー:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
