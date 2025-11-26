/**
 * 希望シフトランダム生成ツール
 *
 * 使い方:
 *   node scripts/tools/generate-random-preferences.mjs --year 2025 --dry-run
 *   node scripts/tools/generate-random-preferences.mjs --year 2025 --month 1 --execute
 *   node scripts/tools/generate-random-preferences.mjs --year 2025 --store 6 --execute
 *   node scripts/tools/generate-random-preferences.mjs --year 2025 --month 1-3 --execute
 *   node scripts/tools/generate-random-preferences.mjs --year 2025 --delete
 *
 * オプション:
 *   --year      対象年（必須）
 *   --month     対象月（省略時: 1-12全月、範囲指定可: 1-3, 単月: 6）
 *   --store     対象店舗ID（省略時: 全店舗、複数指定可: 6,7,8）
 *   --staff     対象スタッフID（省略時: 全スタッフ、複数指定可: 1,2,3）
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
  if (str.includes('-')) {
    const [start, end] = str.split('-').map(Number)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }
  if (str.includes(',')) {
    return str.split(',').map(Number)
  }
  return [parseInt(str)]
}

const yearArg = getArg('year')
const monthArg = getArg('month')
const storeArg = getArg('store')
const staffArg = getArg('staff')
const isDryRun = !args.includes('--execute') && !args.includes('--delete')
const shouldClear = args.includes('--clear')
const deleteOnly = args.includes('--delete')

if (!yearArg) {
  console.error(`
使い方: node generate-random-preferences.mjs --year <年> [オプション]

必須:
  --year <年>        対象年（例: 2025）

フィルタ:
  --month <月>       対象月（例: 1, 1-3, 1,2,3）省略時は1-12月
  --store <店舗ID>   対象店舗（例: 6, 6,7,8）省略時は全店舗
  --staff <スタッフID> 対象スタッフ（例: 56, 1,2,3）省略時は全スタッフ

アクション:
  --dry-run          確認のみ（デフォルト）
  --execute          実際にDBに登録
  --clear            既存データを削除してから登録
  --delete           指定条件のデータを削除のみ

例:
  node generate-random-preferences.mjs --year 2025 --dry-run
  node generate-random-preferences.mjs --year 2025 --month 1 --execute
  node generate-random-preferences.mjs --year 2025 --store 6,7 --execute
  node generate-random-preferences.mjs --year 2025 --month 1-6 --delete
`)
  process.exit(1)
}

const targetYear = parseInt(yearArg)
const targetMonths = parseRange(monthArg) || Array.from({ length: 12 }, (_, i) => i + 1)
const targetStores = parseRange(storeArg)
const targetStaffIds = parseRange(staffArg)
const TENANT_ID = 3 // テナントID

// ランダムユーティリティ
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)]
const shuffleArray = (arr) => arr.sort(() => Math.random() - 0.5)

// 時間パターン（アルバイト用）
const TIME_PATTERNS = [
  { start: '09:00', end: '14:00' },  // 早番
  { start: '14:00', end: '22:00' },  // 遅番
  { start: '09:00', end: '18:00' },  // 日勤
  { start: '10:00', end: '19:00' },  // 中番
  { start: '17:00', end: '22:00' },  // 夕方のみ
  { start: '09:00', end: '22:00' },  // 通し
]

// 月の日数を取得
const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate()

// スタッフの希望パターンを決定
const getStaffPreferencePattern = (staff, staffIndex) => {
  const isFullTime = staff.employment_type === 'FULL_TIME'

  if (isFullTime) {
    const pattern = staffIndex % 10
    if (pattern < 3) return { type: 'NO_NG', ngDaysPerMonth: 0 }
    if (pattern < 7) return { type: 'FEW_NG', ngDaysPerMonth: randomInt(1, 2) }
    return { type: 'SOME_NG', ngDaysPerMonth: randomInt(3, 5) }
  } else {
    const pattern = staffIndex % 10
    if (pattern < 3) return { type: 'FEW_SHIFTS', shiftDaysPerMonth: randomInt(5, 8) }
    if (pattern < 8) return { type: 'NORMAL_SHIFTS', shiftDaysPerMonth: randomInt(8, 12) }
    return { type: 'MANY_SHIFTS', shiftDaysPerMonth: randomInt(12, 18) }
  }
}

// 1ヶ月分の希望を生成
const generateMonthPreferences = (staff, year, month, pattern) => {
  const preferences = []
  const daysInMonth = getDaysInMonth(year, month)
  const isFullTime = staff.employment_type === 'FULL_TIME'

  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const shuffledDays = shuffleArray([...allDays])

  if (isFullTime) {
    if (pattern.ngDaysPerMonth === 0) return []

    const ngDays = shuffledDays.slice(0, pattern.ngDaysPerMonth)
    ngDays.forEach(day => {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      preferences.push({
        tenant_id: TENANT_ID,
        store_id: staff.store_id,
        staff_id: staff.staff_id,
        preference_date: dateStr,
        is_ng: true,
        start_time: null,
        end_time: null,
        notes: null
      })
    })
  } else {
    const shiftDays = shuffledDays.slice(0, pattern.shiftDaysPerMonth)
    shiftDays.forEach(day => {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const timePattern = randomChoice(TIME_PATTERNS)

      const notes = Math.random() < 0.1
        ? randomChoice(['この日は早めに上がりたいです', '遅刻する可能性あり', '研修参加のため', null])
        : null

      preferences.push({
        tenant_id: TENANT_ID,
        store_id: staff.store_id,
        staff_id: staff.staff_id,
        preference_date: dateStr,
        is_ng: false,
        start_time: timePattern.start,
        end_time: timePattern.end,
        notes
      })
    })
  }

  return preferences
}

// 削除用のWHERE句を構築
const buildWhereClause = () => {
  const conditions = [`tenant_id = ${TENANT_ID}`, `EXTRACT(YEAR FROM preference_date) = ${targetYear}`]

  if (targetMonths.length < 12) {
    conditions.push(`EXTRACT(MONTH FROM preference_date) IN (${targetMonths.join(',')})`)
  }
  if (targetStores) {
    conditions.push(`store_id IN (${targetStores.join(',')})`)
  }
  if (targetStaffIds) {
    conditions.push(`staff_id IN (${targetStaffIds.join(',')})`)
  }

  return conditions.join(' AND ')
}

// メイン処理
async function main() {
  console.log('='.repeat(60))
  console.log(`希望シフトランダム生成ツール`)
  console.log('='.repeat(60))
  console.log(`対象年: ${targetYear}`)
  console.log(`対象月: ${targetMonths.join(', ')}月`)
  console.log(`対象店舗: ${targetStores ? targetStores.join(', ') : '全店舗'}`)
  console.log(`対象スタッフ: ${targetStaffIds ? targetStaffIds.join(', ') : '全スタッフ'}`)
  console.log(`モード: ${deleteOnly ? '削除のみ' : (isDryRun ? 'ドライラン（表示のみ）' : '実行（DB登録）')}`)
  console.log(`既存データ削除: ${shouldClear || deleteOnly ? 'あり' : 'なし'}`)
  console.log('='.repeat(60))

  // 削除のみモード
  if (deleteOnly) {
    try {
      const whereClause = buildWhereClause()

      const countResult = await pool.query(`
        SELECT COUNT(*) as count FROM ops.shift_preferences WHERE ${whereClause}
      `)

      const count = parseInt(countResult.rows[0].count)
      console.log(`\n対象データ: ${count}件`)

      if (count === 0) {
        console.log('削除するデータがありません。')
      } else {
        console.log('削除を実行します...')
        const deleteResult = await pool.query(`
          DELETE FROM ops.shift_preferences WHERE ${whereClause}
        `)
        console.log(`削除完了: ${deleteResult.rowCount}件`)
      }
    } catch (error) {
      console.error('エラー:', error)
      process.exit(1)
    } finally {
      await pool.end()
    }
    return
  }

  try {
    // アクティブスタッフを取得
    let staffQuery = `
      SELECT staff_id, name, store_id, employment_type
      FROM hr.staff
      WHERE is_active = true AND tenant_id = $1
    `
    const queryParams = [TENANT_ID]

    if (targetStores) {
      staffQuery += ` AND store_id IN (${targetStores.join(',')})`
    }
    if (targetStaffIds) {
      staffQuery += ` AND staff_id IN (${targetStaffIds.join(',')})`
    }
    staffQuery += ` ORDER BY employment_type, staff_id`

    const staffResult = await pool.query(staffQuery, queryParams)

    const staffList = staffResult.rows
    console.log(`\n対象スタッフ: ${staffList.length}名`)
    console.log(`  - 社員(FULL_TIME): ${staffList.filter(s => s.employment_type === 'FULL_TIME').length}名`)
    console.log(`  - アルバイト(PART_TIME): ${staffList.filter(s => s.employment_type === 'PART_TIME').length}名`)

    // 全希望データを生成
    const allPreferences = []
    const summaryByStaff = []

    staffList.forEach((staff, index) => {
      const pattern = getStaffPreferencePattern(staff, index)
      let totalPrefs = 0

      targetMonths.forEach(month => {
        const monthPrefs = generateMonthPreferences(staff, targetYear, month, pattern)
        allPreferences.push(...monthPrefs)
        totalPrefs += monthPrefs.length
      })

      summaryByStaff.push({
        staff_id: staff.staff_id,
        name: staff.name,
        store_id: staff.store_id,
        type: staff.employment_type,
        pattern: pattern.type,
        total: totalPrefs
      })
    })

    console.log(`\n生成データ: ${allPreferences.length}件`)

    // スタッフ別サマリ
    console.log('\n=== スタッフ別サマリ ===')
    console.log('社員（FULL_TIME）:')
    summaryByStaff
      .filter(s => s.type === 'FULL_TIME')
      .forEach(s => {
        console.log(`  [店舗${s.store_id}] ${s.name}: ${s.pattern} → ${s.total}件`)
      })

    console.log('\nアルバイト（PART_TIME）:')
    summaryByStaff
      .filter(s => s.type === 'PART_TIME')
      .forEach(s => {
        console.log(`  [店舗${s.store_id}] ${s.name}: ${s.pattern} → ${s.total}件`)
      })

    // 月別サマリ
    console.log('\n=== 月別サマリ ===')
    targetMonths.forEach(month => {
      const monthPrefs = allPreferences.filter(p => p.preference_date.startsWith(`${targetYear}-${String(month).padStart(2, '0')}`))
      const ngCount = monthPrefs.filter(p => p.is_ng).length
      const shiftCount = monthPrefs.filter(p => !p.is_ng).length
      console.log(`  ${month}月: ${monthPrefs.length}件 (NG: ${ngCount}, 希望: ${shiftCount})`)
    })

    // サンプルデータ表示
    console.log('\n=== サンプルデータ（最初の10件） ===')
    allPreferences.slice(0, 10).forEach(p => {
      console.log(`  ${p.preference_date} | store:${p.store_id} | staff:${p.staff_id} | is_ng:${p.is_ng} | ${p.start_time || '-'}-${p.end_time || '-'}`)
    })

    if (isDryRun) {
      console.log('\n[ドライラン] 実際の登録は行いません。')
      console.log('登録するには --execute オプションを付けて実行してください。')
    } else {
      console.log('\n登録を開始します...')

      if (shouldClear) {
        console.log('既存データを削除中...')
        const whereClause = buildWhereClause()
        const deleteResult = await pool.query(`
          DELETE FROM ops.shift_preferences WHERE ${whereClause}
        `)
        console.log(`  削除: ${deleteResult.rowCount}件`)
      }

      // バッチ挿入（1000件ずつ）
      const batchSize = 1000
      let inserted = 0

      for (let i = 0; i < allPreferences.length; i += batchSize) {
        const batch = allPreferences.slice(i, i + batchSize)

        const values = batch.map((p, idx) => {
          const base = idx * 8
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`
        }).join(', ')

        const params = batch.flatMap(p => [
          p.tenant_id, p.store_id, p.staff_id, p.preference_date,
          p.is_ng, p.start_time, p.end_time, p.notes
        ])

        await pool.query(`
          INSERT INTO ops.shift_preferences
            (tenant_id, store_id, staff_id, preference_date, is_ng, start_time, end_time, notes)
          VALUES ${values}
        `, params)

        inserted += batch.length
        console.log(`  登録進捗: ${inserted}/${allPreferences.length}`)
      }

      console.log(`\n登録完了: ${inserted}件`)
    }

  } catch (error) {
    console.error('エラー:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
