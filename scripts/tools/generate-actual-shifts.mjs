/**
 * 実績シフトランダム生成ツール
 *
 * 使い方:
 *   node scripts/tools/generate-actual-shifts.mjs --year 2025 --month 1 --dry-run
 *   node scripts/tools/generate-actual-shifts.mjs --year 2025 --month 1 --execute
 *   node scripts/tools/generate-actual-shifts.mjs --year 2025 --month 1 --store 6 --execute
 *   node scripts/tools/generate-actual-shifts.mjs --year 2025 --month 1 --delete
 *
 * オプション:
 *   --year        対象年（必須）
 *   --month       対象月（必須）
 *   --store       対象店舗ID（省略時: 全店舗、複数指定可: 6,7,8）
 *   --absence     欠勤率（%、デフォルト: 5）
 *   --time-change 時間変更率（%、デフォルト: 10）
 *   --dry-run     生成データを表示するのみ（デフォルト）
 *   --execute     実際にDBに登録する
 *   --clear       既存データを削除してから登録
 *   --delete      指定条件のデータを削除のみ（登録しない）
 *
 * 生成ロジック:
 *   - 第1案（FIRST Plan）をベースに実績シフトを生成
 *   - 一定確率で欠勤（シフトなし）を発生
 *   - 一定確率で開始・終了時間を変更
 *   - 残業（終了時間延長）も追加
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

const parseRange = (str) => {
  if (!str) return null
  if (str.includes(',')) {
    return str.split(',').map(Number)
  }
  return [parseInt(str)]
}

const yearArg = getArg('year')
const monthArg = getArg('month')
const storeArg = getArg('store')
const absenceRate = parseInt(getArg('absence') || '5') // 欠勤率（%）
const timeChangeRate = parseInt(getArg('time-change') || '10') // 時間変更率（%）
const isDryRun = !args.includes('--execute') && !args.includes('--delete')
const shouldClear = args.includes('--clear')
const deleteOnly = args.includes('--delete')

// ヘルプ表示
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
使い方: node generate-actual-shifts.mjs --year <年> --month <月> [オプション]

必須:
  --year <年>          対象年（例: 2025）
  --month <月>         対象月（例: 1）

フィルタ:
  --store <店舗ID>     対象店舗（例: 6, 6,7,8）省略時は全店舗

変動パラメータ:
  --absence <率>       欠勤率（%）デフォルト: 5
  --time-change <率>   時間変更率（%）デフォルト: 10

アクション:
  --dry-run            確認のみ（デフォルト）
  --execute            実際にDBに登録
  --clear              既存データを削除してから登録
  --delete             指定条件のデータを削除のみ

例:
  node generate-actual-shifts.mjs --year 2025 --month 1 --dry-run
  node generate-actual-shifts.mjs --year 2025 --month 1 --execute
  node generate-actual-shifts.mjs --year 2025 --month 1 --absence 10 --time-change 15 --execute
  node generate-actual-shifts.mjs --year 2025 --month 1 --store 6 --execute
  node generate-actual-shifts.mjs --year 2025 --month 1 --delete
`)
  process.exit(0)
}

if (!yearArg || !monthArg) {
  console.error('エラー: --year と --month オプションを指定してください')
  console.error('使い方を確認するには --help を実行してください')
  process.exit(1)
}

const targetYear = parseInt(yearArg)
const targetMonth = parseInt(monthArg)
const targetStores = parseRange(storeArg)
const TENANT_ID = 3 // テナントID

// ランダムユーティリティ
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min, max) => Math.random() * (max - min) + min
const shouldOccur = (percentChance) => Math.random() * 100 < percentChance

// 時間を分に変換
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

// 分を時間文字列に変換
const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// 月の日数を取得
const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate()

// メイン処理
async function main() {
  console.log('='.repeat(60))
  console.log(`実績シフトランダム生成ツール`)
  console.log('='.repeat(60))
  console.log(`対象年月: ${targetYear}年${targetMonth}月`)
  console.log(`対象店舗: ${targetStores ? targetStores.join(', ') : '全店舗'}`)
  console.log(`欠勤率: ${absenceRate}%`)
  console.log(`時間変更率: ${timeChangeRate}%`)
  console.log(`モード: ${deleteOnly ? '削除のみ' : (isDryRun ? 'ドライラン（表示のみ）' : '実行（DB登録）')}`)
  console.log(`既存データ削除: ${shouldClear || deleteOnly ? 'あり' : 'なし'}`)
  console.log('='.repeat(60))

  try {
    // 店舗一覧を取得
    let storeQuery = `SELECT store_id, store_name FROM core.stores WHERE tenant_id = $1`
    if (targetStores) {
      storeQuery += ` AND store_id IN (${targetStores.join(',')})`
    }
    const storesResult = await pool.query(storeQuery, [TENANT_ID])
    const stores = storesResult.rows

    console.log(`\n対象店舗: ${stores.length}店舗`)
    stores.forEach(s => console.log(`  - [${s.store_id}] ${s.store_name}`))

    // 削除のみモード
    if (deleteOnly) {
      for (const store of stores) {
        // ACTUALプランを検索
        const planResult = await pool.query(`
          SELECT plan_id FROM ops.shift_plans
          WHERE tenant_id = $1 AND store_id = $2 AND plan_year = $3 AND plan_month = $4 AND plan_type = 'ACTUAL'
        `, [TENANT_ID, store.store_id, targetYear, targetMonth])

        if (planResult.rows.length > 0) {
          const planId = planResult.rows[0].plan_id

          // シフトを削除
          const deleteShifts = await pool.query(`DELETE FROM ops.shifts WHERE plan_id = $1`, [planId])
          console.log(`  [${store.store_name}] シフト削除: ${deleteShifts.rowCount}件`)

          // プランを削除
          await pool.query(`DELETE FROM ops.shift_plans WHERE plan_id = $1`, [planId])
          console.log(`  [${store.store_name}] プラン削除: plan_id=${planId}`)
        } else {
          console.log(`  [${store.store_name}] 削除対象なし`)
        }
      }
      return
    }

    // 第1案（FIRSTプラン）のシフトを取得
    console.log('\n第1案のシフトを取得中...')

    const allActualShifts = []
    const allPlans = []
    const lastDay = getDaysInMonth(targetYear, targetMonth)

    let stats = {
      totalFirstPlan: 0,
      absences: 0,
      timeChanges: 0,
      overtimes: 0,
      actualGenerated: 0,
    }

    for (const store of stores) {
      console.log(`\n--- ${store.store_name} (ID: ${store.store_id}) ---`)

      // 第1案のプランとシフトを取得
      const firstPlanResult = await pool.query(`
        SELECT sp.plan_id, s.shift_id, s.staff_id, s.shift_date, s.start_time, s.end_time,
               s.break_minutes, s.total_hours, st.name as staff_name
        FROM ops.shift_plans sp
        JOIN ops.shifts s ON sp.plan_id = s.plan_id
        JOIN hr.staff st ON s.staff_id = st.staff_id
        WHERE sp.tenant_id = $1 AND sp.store_id = $2
          AND sp.plan_year = $3 AND sp.plan_month = $4
          AND sp.plan_type = 'FIRST'
        ORDER BY s.shift_date, s.staff_id
      `, [TENANT_ID, store.store_id, targetYear, targetMonth])

      if (firstPlanResult.rows.length === 0) {
        console.log(`  ⚠️ 第1案が存在しません。スキップします。`)
        console.log(`  先に generate-first-plan.mjs で第1案を生成してください。`)
        continue
      }

      console.log(`  第1案シフト数: ${firstPlanResult.rows.length}件`)
      stats.totalFirstPlan += firstPlanResult.rows.length

      // 第1案を元に実績シフトを生成
      const actualShiftsForStore = []

      for (const shift of firstPlanResult.rows) {
        // 欠勤判定
        if (shouldOccur(absenceRate)) {
          stats.absences++
          continue // このシフトは欠勤として実績に含めない
        }

        // シフトデータのコピー
        let startTime = shift.start_time
        let endTime = shift.end_time
        let isModified = false

        // 時間変更判定
        if (shouldOccur(timeChangeRate)) {
          stats.timeChanges++
          isModified = true

          // 開始時間を前後30分程度変更
          const startMinutes = timeToMinutes(startTime)
          const startVariation = randomInt(-30, 30)
          const newStartMinutes = Math.max(360, Math.min(1200, startMinutes + startVariation)) // 6:00〜20:00
          startTime = minutesToTime(newStartMinutes)

          // 終了時間を前後30分程度変更（残業含む）
          const endMinutes = timeToMinutes(endTime)
          const endVariation = randomInt(-15, 60) // 早退は15分まで、残業は60分まで
          const newEndMinutes = Math.max(newStartMinutes + 180, Math.min(1380, endMinutes + endVariation)) // 最低3時間、最大23:00
          endTime = minutesToTime(newEndMinutes)

          if (endVariation > 0) {
            stats.overtimes++
          }
        }

        // 勤務時間を再計算
        const startMinutes = timeToMinutes(startTime)
        const endMinutes = timeToMinutes(endTime)
        const breakMinutes = shift.break_minutes || 60
        const totalMinutes = endMinutes - startMinutes - breakMinutes
        const totalHours = Math.round(totalMinutes / 60 * 100) / 100

        actualShiftsForStore.push({
          tenant_id: TENANT_ID,
          store_id: store.store_id,
          staff_id: shift.staff_id,
          shift_date: shift.shift_date instanceof Date
            ? shift.shift_date.toISOString().split('T')[0]
            : shift.shift_date,
          start_time: startTime,
          end_time: endTime,
          break_minutes: breakMinutes,
          total_hours: totalHours,
          is_preferred: false,
          is_modified: isModified,
          staff_name: shift.staff_name,
        })
      }

      console.log(`  実績シフト生成: ${actualShiftsForStore.length}件`)
      console.log(`    - 欠勤: ${stats.absences}件（この店舗まで累計）`)
      console.log(`    - 時間変更: ${stats.timeChanges}件（この店舗まで累計）`)

      stats.actualGenerated += actualShiftsForStore.length

      allPlans.push({
        tenant_id: TENANT_ID,
        store_id: store.store_id,
        store_name: store.store_name,
        plan_year: targetYear,
        plan_month: targetMonth,
        plan_type: 'ACTUAL',
        status: 'APPROVED',
        shifts: actualShiftsForStore,
      })

      allActualShifts.push(...actualShiftsForStore)
    }

    // サマリ表示
    console.log('\n=== 生成サマリ ===')
    console.log(`第1案シフト総数: ${stats.totalFirstPlan}件`)
    console.log(`実績シフト総数: ${stats.actualGenerated}件`)
    console.log(`欠勤数: ${stats.absences}件 (${(stats.absences / stats.totalFirstPlan * 100).toFixed(1)}%)`)
    console.log(`時間変更数: ${stats.timeChanges}件 (${(stats.timeChanges / stats.totalFirstPlan * 100).toFixed(1)}%)`)
    console.log(`残業含む: ${stats.overtimes}件`)

    allPlans.forEach(plan => {
      console.log(`  [${plan.store_name}] ${plan.shifts.length}件`)
    })

    // サンプルデータ表示
    console.log('\n=== サンプルデータ（最初の10件） ===')
    allActualShifts.slice(0, 10).forEach(s => {
      const modified = s.is_modified ? ' [変更]' : ''
      console.log(`  ${s.shift_date} | store:${s.store_id} | ${s.staff_name} | ${s.start_time}-${s.end_time}${modified}`)
    })

    if (isDryRun) {
      console.log('\n[ドライラン] 実際の登録は行いません。')
      console.log('登録するには --execute オプションを付けて実行してください。')
    } else {
      console.log('\n登録を開始します...')

      for (const plan of allPlans) {
        if (plan.shifts.length === 0) continue

        // 既存プランをチェック＆削除（--clearの場合）
        if (shouldClear) {
          const existingPlan = await pool.query(`
            SELECT plan_id FROM ops.shift_plans
            WHERE tenant_id = $1 AND store_id = $2 AND plan_year = $3 AND plan_month = $4 AND plan_type = 'ACTUAL'
          `, [TENANT_ID, plan.store_id, targetYear, targetMonth])

          if (existingPlan.rows.length > 0) {
            const oldPlanId = existingPlan.rows[0].plan_id
            await pool.query(`DELETE FROM ops.shifts WHERE plan_id = $1`, [oldPlanId])
            await pool.query(`DELETE FROM ops.shift_plans WHERE plan_id = $1`, [oldPlanId])
            console.log(`  [${plan.store_name}] 既存プラン削除: plan_id=${oldPlanId}`)
          }
        }

        // プランを作成
        const periodStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
        const periodEnd = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        const planResult = await pool.query(`
          INSERT INTO ops.shift_plans (
            tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
            period_start, period_end, status, plan_type, generation_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING plan_id
        `, [
          TENANT_ID,
          plan.store_id,
          targetYear,
          targetMonth,
          `ACTUAL-${targetYear}${String(targetMonth).padStart(2, '0')}-${plan.store_id}`,
          `${targetYear}年${targetMonth}月 実績 (${plan.store_name})`,
          periodStart,
          periodEnd,
          'APPROVED',
          'ACTUAL',
          'MANUAL'
        ])

        const planId = planResult.rows[0].plan_id
        console.log(`  [${plan.store_name}] プラン作成: plan_id=${planId}`)

        // シフトをバッチ挿入
        const batchSize = 500
        let inserted = 0

        for (let i = 0; i < plan.shifts.length; i += batchSize) {
          const batch = plan.shifts.slice(i, i + batchSize)

          const values = batch.map((_, idx) => {
            const base = idx * 10
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10})`
          }).join(', ')

          const params = batch.flatMap(s => [
            TENANT_ID, plan.store_id, planId, s.staff_id, s.shift_date,
            s.start_time, s.end_time, s.break_minutes, s.total_hours, s.is_modified
          ])

          await pool.query(`
            INSERT INTO ops.shifts (
              tenant_id, store_id, plan_id, staff_id, shift_date,
              start_time, end_time, break_minutes, total_hours, is_modified
            ) VALUES ${values}
          `, params)

          inserted += batch.length
        }

        console.log(`  [${plan.store_name}] シフト登録: ${inserted}件`)
      }

      console.log(`\n登録完了`)
    }

  } catch (error) {
    console.error('エラー:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
