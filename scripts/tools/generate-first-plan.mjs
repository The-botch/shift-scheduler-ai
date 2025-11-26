/**
 * 第1案（First Plan）ランダム生成ツール
 *
 * 使い方:
 *   node scripts/tools/generate-first-plan.mjs --year 2025 --month 1 --dry-run
 *   node scripts/tools/generate-first-plan.mjs --year 2025 --month 1 --execute
 *   node scripts/tools/generate-first-plan.mjs --year 2025 --month 1 --store 6 --execute
 *   node scripts/tools/generate-first-plan.mjs --year 2025 --month 1 --delete
 *
 * オプション:
 *   --year      対象年（必須）
 *   --month     対象月（必須）
 *   --store     対象店舗ID（省略時: 全店舗、複数指定可: 6,7,8）
 *   --dry-run   生成データを表示するのみ（デフォルト）
 *   --execute   実際にDBに登録する
 *   --clear     既存データを削除してから登録
 *   --delete    指定条件のデータを削除のみ（登録しない）
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
const isDryRun = !args.includes('--execute') && !args.includes('--delete')
const shouldClear = args.includes('--clear')
const deleteOnly = args.includes('--delete')

if (!yearArg || !monthArg) {
  console.error(`
使い方: node generate-first-plan.mjs --year <年> --month <月> [オプション]

必須:
  --year <年>        対象年（例: 2025）
  --month <月>       対象月（例: 1）

フィルタ:
  --store <店舗ID>   対象店舗（例: 6, 6,7,8）省略時は全店舗

アクション:
  --dry-run          確認のみ（デフォルト）
  --execute          実際にDBに登録
  --clear            既存データを削除してから登録
  --delete           指定条件のデータを削除のみ

例:
  node generate-first-plan.mjs --year 2025 --month 1 --dry-run
  node generate-first-plan.mjs --year 2025 --month 1 --execute
  node generate-first-plan.mjs --year 2025 --month 1 --store 6 --execute
  node generate-first-plan.mjs --year 2025 --month 1 --delete
`)
  process.exit(1)
}

const targetYear = parseInt(yearArg)
const targetMonth = parseInt(monthArg)
const targetStores = parseRange(storeArg)
const TENANT_ID = 3 // テナントID

// ランダムユーティリティ
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)]
const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5)

// 月の日数を取得
const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate()

// 曜日を取得（0=日, 1=月, ...）
const getDayOfWeek = (year, month, day) => new Date(year, month - 1, day).getDay()

// シフトパターン（デフォルト）
const SHIFT_PATTERNS = [
  { start: '09:00', end: '18:00', break: 60 },  // 日勤
  { start: '10:00', end: '19:00', break: 60 },  // 中番
  { start: '11:00', end: '20:00', break: 60 },  // 遅番1
  { start: '14:00', end: '22:00', break: 60 },  // 遅番2
]

// メイン処理
async function main() {
  console.log('='.repeat(60))
  console.log(`第1案（First Plan）ランダム生成ツール`)
  console.log('='.repeat(60))
  console.log(`対象年月: ${targetYear}年${targetMonth}月`)
  console.log(`対象店舗: ${targetStores ? targetStores.join(', ') : '全店舗'}`)
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
        // プランを検索
        const planResult = await pool.query(`
          SELECT plan_id FROM ops.shift_plans
          WHERE tenant_id = $1 AND store_id = $2 AND plan_year = $3 AND plan_month = $4 AND plan_type = 'FIRST'
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

    // 希望シフトを取得（該当月）
    const dateFrom = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
    const lastDay = getDaysInMonth(targetYear, targetMonth)
    const dateTo = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const prefsResult = await pool.query(`
      SELECT staff_id, store_id, preference_date, is_ng, start_time, end_time
      FROM ops.shift_preferences
      WHERE tenant_id = $1 AND preference_date >= $2 AND preference_date <= $3
    `, [TENANT_ID, dateFrom, dateTo])

    console.log(`\n希望シフト取得: ${prefsResult.rows.length}件`)

    // スタッフごとの希望日マップを作成
    const staffPreferences = {}
    prefsResult.rows.forEach(pref => {
      const staffId = pref.staff_id
      if (!staffPreferences[staffId]) {
        staffPreferences[staffId] = {
          storeId: pref.store_id,
          availableDays: [],
          ngDays: [],
        }
      }
      const day = new Date(pref.preference_date).getDate()
      if (pref.is_ng) {
        staffPreferences[staffId].ngDays.push(day)
      } else {
        staffPreferences[staffId].availableDays.push({
          day,
          start_time: pref.start_time,
          end_time: pref.end_time,
        })
      }
    })

    // スタッフ一覧を取得
    const staffResult = await pool.query(`
      SELECT staff_id, name, store_id, employment_type
      FROM hr.staff
      WHERE is_active = true AND tenant_id = $1
    `, [TENANT_ID])

    const allStaff = staffResult.rows
    console.log(`アクティブスタッフ: ${allStaff.length}名`)

    // 店舗ごとにプランとシフトを生成
    const allPlans = []
    const allShifts = []

    for (const store of stores) {
      console.log(`\n--- ${store.store_name} (ID: ${store.store_id}) ---`)

      // この店舗のスタッフを取得
      const storeStaff = allStaff.filter(s => parseInt(s.store_id) === parseInt(store.store_id))
      console.log(`  スタッフ数: ${storeStaff.length}名`)

      if (storeStaff.length === 0) {
        console.log(`  スキップ（スタッフなし）`)
        continue
      }

      // 月の各日にシフトを生成
      const daysInMonth = getDaysInMonth(targetYear, targetMonth)
      const shiftsForStore = []

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayOfWeek = getDayOfWeek(targetYear, targetMonth, day)

        // 曜日によって必要人数を変える（土日は多め）
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const requiredStaff = isWeekend ? randomInt(4, 6) : randomInt(2, 4)

        // この日に勤務可能なスタッフをシャッフル
        const availableStaff = storeStaff.filter(staff => {
          const pref = staffPreferences[staff.staff_id]
          // NG日でないスタッフ
          if (pref && pref.ngDays.includes(day)) return false
          return true
        })

        const shuffledStaff = shuffleArray(availableStaff)
        const assignedStaff = shuffledStaff.slice(0, Math.min(requiredStaff, shuffledStaff.length))

        // 各スタッフにシフトを割り当て
        assignedStaff.forEach(staff => {
          const pref = staffPreferences[staff.staff_id]
          let pattern

          // 希望時間がある場合はそれを使用
          if (pref) {
            const dayPref = pref.availableDays.find(d => d.day === day)
            if (dayPref && dayPref.start_time && dayPref.end_time) {
              pattern = {
                start: dayPref.start_time,
                end: dayPref.end_time,
                break: 60,
              }
            }
          }

          // 希望がない場合はランダムなパターンを使用
          if (!pattern) {
            pattern = randomChoice(SHIFT_PATTERNS)
          }

          // 勤務時間を計算
          const [startH, startM] = pattern.start.split(':').map(Number)
          const [endH, endM] = pattern.end.split(':').map(Number)
          const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - pattern.break
          const totalHours = totalMinutes / 60

          shiftsForStore.push({
            tenant_id: TENANT_ID,
            store_id: store.store_id,
            staff_id: staff.staff_id,
            shift_date: dateStr,
            start_time: pattern.start,
            end_time: pattern.end,
            break_minutes: pattern.break,
            total_hours: totalHours,
            is_preferred: pref?.availableDays.some(d => d.day === day) || false,
            is_modified: false,
            staff_name: staff.name,
          })
        })
      }

      console.log(`  生成シフト数: ${shiftsForStore.length}件`)

      allPlans.push({
        tenant_id: TENANT_ID,
        store_id: store.store_id,
        store_name: store.store_name,
        plan_year: targetYear,
        plan_month: targetMonth,
        plan_type: 'FIRST',
        status: 'DRAFT',
        shifts: shiftsForStore,
      })

      allShifts.push(...shiftsForStore)
    }

    // サマリ表示
    console.log('\n=== 生成サマリ ===')
    console.log(`プラン数: ${allPlans.length}`)
    console.log(`シフト総数: ${allShifts.length}`)

    allPlans.forEach(plan => {
      console.log(`  [${plan.store_name}] ${plan.shifts.length}件`)
    })

    // サンプルデータ表示
    console.log('\n=== サンプルデータ（最初の10件） ===')
    allShifts.slice(0, 10).forEach(s => {
      console.log(`  ${s.shift_date} | store:${s.store_id} | ${s.staff_name} | ${s.start_time}-${s.end_time}`)
    })

    if (isDryRun) {
      console.log('\n[ドライラン] 実際の登録は行いません。')
      console.log('登録するには --execute オプションを付けて実行してください。')
    } else {
      console.log('\n登録を開始します...')

      for (const plan of allPlans) {
        // 既存プランをチェック＆削除（--clearの場合）
        if (shouldClear) {
          const existingPlan = await pool.query(`
            SELECT plan_id FROM ops.shift_plans
            WHERE tenant_id = $1 AND store_id = $2 AND plan_year = $3 AND plan_month = $4 AND plan_type = 'FIRST'
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
          `FIRST-${targetYear}${String(targetMonth).padStart(2, '0')}-${plan.store_id}`,
          `${targetYear}年${targetMonth}月 第1案 (${plan.store_name})`,
          periodStart,
          periodEnd,
          'DRAFT',
          'FIRST',
          'MANUAL'
        ])

        const planId = planResult.rows[0].plan_id
        console.log(`  [${plan.store_name}] プラン作成: plan_id=${planId}`)

        // シフトをバッチ挿入
        if (plan.shifts.length > 0) {
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
              s.start_time, s.end_time, s.break_minutes, s.total_hours, s.is_preferred
            ])

            await pool.query(`
              INSERT INTO ops.shifts (
                tenant_id, store_id, plan_id, staff_id, shift_date,
                start_time, end_time, break_minutes, total_hours, is_preferred
              ) VALUES ${values}
            `, params)

            inserted += batch.length
          }

          console.log(`  [${plan.store_name}] シフト登録: ${inserted}件`)
        }
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
