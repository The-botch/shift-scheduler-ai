/**
 * スタッフ一括生成ツール
 *
 * 使い方:
 *   node scripts/tools/generate-staff.mjs --count 10 --dry-run
 *   node scripts/tools/generate-staff.mjs --count 10 --store 6 --execute
 *   node scripts/tools/generate-staff.mjs --count 5 --type PART_TIME --store 6,7 --execute
 *   node scripts/tools/generate-staff.mjs --list
 *   node scripts/tools/generate-staff.mjs --delete --staff 100,101,102
 *
 * オプション:
 *   --count     生成人数（必須、--listと--delete以外）
 *   --store     割り当て店舗ID（省略時: ランダム、複数指定可: 6,7,8）
 *   --type      雇用形態（FULL_TIME, PART_TIME, CONTRACT）省略時: ランダム
 *   --role      役職ID（省略時: デフォルト役職）
 *   --list      現在のスタッフ一覧を表示
 *   --delete    指定スタッフを削除
 *   --staff     削除対象スタッフID（--deleteと一緒に使用、カンマ区切り）
 *   --dry-run   生成データを表示するのみ（デフォルト）
 *   --execute   実際にDBに登録する
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

const parseList = (str) => {
  if (!str) return null
  return str.split(',').map(s => s.trim())
}

const countArg = getArg('count')
const storeArg = getArg('store')
const typeArg = getArg('type')
const roleArg = getArg('role')
const staffArg = getArg('staff')
const showList = args.includes('--list')
const deleteMode = args.includes('--delete')
const isDryRun = !args.includes('--execute')

const TENANT_ID = 3 // テナントID

// ダミーデータ
const LAST_NAMES = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水']
const FIRST_NAMES = ['太郎', '花子', '一郎', '美咲', '健太', '愛', '翔太', '結衣', '大輔', '真由',
  '優', '陽菜', '蓮', 'さくら', '颯太', '凛', '悠人', '葵', '大翔', '楓']

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// ヘルプ表示
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
使い方: node generate-staff.mjs [オプション]

生成:
  --count <人数>     生成人数（必須）
  --store <店舗ID>   割り当て店舗（例: 6, 6,7,8）
  --type <雇用形態>  FULL_TIME, PART_TIME, CONTRACT
  --role <役職ID>    役職ID

一覧:
  --list             現在のスタッフ一覧を表示

削除:
  --delete           スタッフを削除
  --staff <ID>       削除対象ID（例: 100,101,102）

アクション:
  --dry-run          確認のみ（デフォルト）
  --execute          実際に登録/削除

例:
  node generate-staff.mjs --count 10 --dry-run
  node generate-staff.mjs --count 10 --store 6 --execute
  node generate-staff.mjs --count 5 --type PART_TIME --store 6,7 --execute
  node generate-staff.mjs --list
  node generate-staff.mjs --delete --staff 100,101,102 --execute
`)
  process.exit(0)
}

// メイン処理
async function main() {
  console.log('='.repeat(60))
  console.log(`スタッフ一括生成ツール`)
  console.log('='.repeat(60))

  try {
    // 店舗一覧を取得
    const storesResult = await pool.query(`
      SELECT store_id, store_name FROM core.stores WHERE tenant_id = $1 ORDER BY store_id
    `, [TENANT_ID])
    const stores = storesResult.rows

    // 役職一覧を取得
    const rolesResult = await pool.query(`
      SELECT role_id, role_name FROM core.roles WHERE tenant_id = $1 ORDER BY role_id
    `, [TENANT_ID])
    const roles = rolesResult.rows

    // 一覧表示モード
    if (showList) {
      const staffResult = await pool.query(`
        SELECT s.staff_id, s.name, s.staff_code, s.employment_type, s.is_active,
               st.store_name, r.role_name
        FROM hr.staff s
        LEFT JOIN core.stores st ON s.store_id = st.store_id
        LEFT JOIN core.roles r ON s.role_id = r.role_id
        WHERE s.tenant_id = $1
        ORDER BY s.store_id, s.staff_id
      `, [TENANT_ID])

      console.log(`\nスタッフ一覧: ${staffResult.rows.length}名\n`)
      console.log('ID    | 名前           | コード     | 雇用形態   | 店舗       | 役職       | 状態')
      console.log('-'.repeat(90))

      staffResult.rows.forEach(s => {
        const status = s.is_active ? '有効' : '無効'
        console.log(
          `${String(s.staff_id).padEnd(5)} | ` +
          `${s.name.padEnd(12)} | ` +
          `${(s.staff_code || '-').padEnd(10)} | ` +
          `${s.employment_type.padEnd(10)} | ` +
          `${(s.store_name || '-').padEnd(10)} | ` +
          `${(s.role_name || '-').padEnd(10)} | ` +
          `${status}`
        )
      })

      // 集計
      console.log('\n=== 集計 ===')
      const byType = {}
      staffResult.rows.forEach(s => {
        byType[s.employment_type] = (byType[s.employment_type] || 0) + 1
      })
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}名`)
      })

      return
    }

    // 削除モード
    if (deleteMode) {
      const staffIds = parseList(staffArg)
      if (!staffIds || staffIds.length === 0) {
        console.error('エラー: --staff オプションで削除対象のスタッフIDを指定してください')
        process.exit(1)
      }

      console.log(`\n削除対象: ${staffIds.join(', ')}`)

      // 削除対象の確認
      const targetResult = await pool.query(`
        SELECT staff_id, name, employment_type FROM hr.staff
        WHERE tenant_id = $1 AND staff_id IN (${staffIds.join(',')})
      `, [TENANT_ID])

      if (targetResult.rows.length === 0) {
        console.log('削除対象のスタッフが見つかりません。')
        await pool.end()
        return
      }

      console.log('\n削除対象スタッフ:')
      targetResult.rows.forEach(s => {
        console.log(`  [${s.staff_id}] ${s.name} (${s.employment_type})`)
      })

      if (isDryRun) {
        console.log('\n[ドライラン] 実際の削除は行いません。')
        console.log('削除を実行するには --execute オプションを付けて実行してください。')
      } else {
        // 関連データを先に削除
        const relatedTables = [
          'ops.shifts',
          'ops.shift_preferences',
        ]

        for (const table of relatedTables) {
          const result = await pool.query(`
            DELETE FROM ${table} WHERE tenant_id = $1 AND staff_id IN (${staffIds.join(',')})
          `, [TENANT_ID])
          if (result.rowCount > 0) {
            console.log(`  ${table}: ${result.rowCount}件削除`)
          }
        }

        // スタッフを削除
        const deleteResult = await pool.query(`
          DELETE FROM hr.staff WHERE tenant_id = $1 AND staff_id IN (${staffIds.join(',')})
        `, [TENANT_ID])
        console.log(`\nスタッフ削除: ${deleteResult.rowCount}名`)
      }

      return
    }

    // 生成モード
    if (!countArg) {
      console.error('エラー: --count オプションで生成人数を指定してください')
      console.error('使い方を確認するには --help を実行してください')
      process.exit(1)
    }

    const count = parseInt(countArg)
    const targetStores = parseList(storeArg)?.map(Number) || stores.map(s => s.store_id)
    const targetType = typeArg || null

    console.log(`生成人数: ${count}名`)
    console.log(`対象店舗: ${targetStores.join(', ')}`)
    console.log(`雇用形態: ${targetType || 'ランダム'}`)
    console.log(`モード: ${isDryRun ? 'ドライラン（確認のみ）' : '実行（登録）'}`)
    console.log('='.repeat(60))

    // 既存の最大staff_codeを取得（STAFF_XXX形式）
    const maxCodeResult = await pool.query(`
      SELECT MAX(CAST(SUBSTRING(staff_code FROM 7) AS INTEGER)) as max_num
      FROM hr.staff
      WHERE tenant_id = $1 AND staff_code LIKE 'STAFF_%'
    `, [TENANT_ID])
    let nextCodeNum = (maxCodeResult.rows[0].max_num || 0) + 1

    // スタッフデータを生成
    const newStaff = []
    const employmentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT']

    for (let i = 0; i < count; i++) {
      const name = `${randomChoice(LAST_NAMES)} ${randomChoice(FIRST_NAMES)}`
      const staffCode = `STAFF_${String(nextCodeNum++).padStart(3, '0')}`
      const storeId = randomChoice(targetStores)
      const employmentType = targetType || randomChoice(employmentTypes)
      const roleId = roleArg ? parseInt(roleArg) : (roles.length > 0 ? roles[0].role_id : null)

      newStaff.push({
        tenant_id: TENANT_ID,
        name,
        staff_code: staffCode,
        store_id: storeId,
        employment_type: employmentType,
        role_id: roleId,
        hire_date: new Date().toISOString().split('T')[0], // 今日の日付
        is_active: true,
      })
    }

    // サマリ表示
    console.log('\n=== 生成データサマリ ===')
    const byType = {}
    const byStore = {}
    newStaff.forEach(s => {
      byType[s.employment_type] = (byType[s.employment_type] || 0) + 1
      byStore[s.store_id] = (byStore[s.store_id] || 0) + 1
    })

    console.log('\n雇用形態別:')
    Object.entries(byType).forEach(([type, cnt]) => {
      console.log(`  ${type}: ${cnt}名`)
    })

    console.log('\n店舗別:')
    Object.entries(byStore).forEach(([storeId, cnt]) => {
      const store = stores.find(s => s.store_id === parseInt(storeId))
      console.log(`  [${storeId}] ${store?.store_name || '不明'}: ${cnt}名`)
    })

    // サンプル表示
    console.log('\n=== サンプルデータ（最初の10件） ===')
    newStaff.slice(0, 10).forEach(s => {
      const store = stores.find(st => st.store_id === s.store_id)
      console.log(`  ${s.staff_code} | ${s.name} | ${s.employment_type} | ${store?.store_name || '不明'}`)
    })

    if (isDryRun) {
      console.log('\n[ドライラン] 実際の登録は行いません。')
      console.log('登録を実行するには --execute オプションを付けて実行してください。')
    } else {
      console.log('\n登録を開始します...')

      // バッチ挿入
      const batchSize = 100
      let inserted = 0

      for (let i = 0; i < newStaff.length; i += batchSize) {
        const batch = newStaff.slice(i, i + batchSize)

        const values = batch.map((_, idx) => {
          const base = idx * 7
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`
        }).join(', ')

        const params = batch.flatMap(s => [
          s.tenant_id, s.name, s.staff_code, s.store_id, s.employment_type, s.role_id, s.hire_date
        ])

        await pool.query(`
          INSERT INTO hr.staff (tenant_id, name, staff_code, store_id, employment_type, role_id, hire_date)
          VALUES ${values}
        `, params)

        inserted += batch.length
        console.log(`  登録進捗: ${inserted}/${newStaff.length}`)
      }

      console.log(`\n登録完了: ${inserted}名`)
    }

  } catch (error) {
    console.error('エラー:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
