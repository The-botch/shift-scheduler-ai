/**
 * テナント3の応援勤務データを確認するスクリプト
 */

import pg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pg
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

async function checkSupportWork() {
  try {
    const query = `
      SELECT
        s.shift_id,
        s.shift_date,
        s.staff_id,
        st.name as staff_name,
        st.store_id as staff_home_store_id,
        s.store_id as shift_store_id,
        s.start_time,
        s.end_time,
        store1.store_name as home_store_name,
        store1.store_code as home_store_code,
        store2.store_name as shift_store_name,
        store2.store_code as shift_store_code
      FROM ops.shifts s
      JOIN hr.staff st ON s.staff_id = st.staff_id AND s.tenant_id = st.tenant_id
      LEFT JOIN core.stores store1 ON st.store_id = store1.store_id AND st.tenant_id = store1.tenant_id
      LEFT JOIN core.stores store2 ON s.store_id = store2.store_id AND s.tenant_id = store2.tenant_id
      WHERE st.store_id != s.store_id
        AND s.tenant_id = 3
      ORDER BY s.shift_date
      LIMIT 20
    `

    const result = await pool.query(query)

    console.log(`\n=== テナント3の応援勤務データ (全${result.rows.length}件) ===\n`)

    if (result.rows.length === 0) {
      console.log('応援勤務のデータは見つかりませんでした。')

      // 店舗情報を表示
      const storesQuery = `
        SELECT store_id, store_code, store_name
        FROM core.stores
        WHERE tenant_id = 3
        ORDER BY store_id
      `
      const storesResult = await pool.query(storesQuery)
      console.log('\n=== 店舗一覧 ===')
      storesResult.rows.forEach(s => {
        console.log(`ID: ${s.store_id}, コード: ${s.store_code}, 名前: ${s.store_name}`)
      })

      // 各店舗のスタッフ数を表示
      const staffByStoreQuery = `
        SELECT store_id, COUNT(*) as staff_count
        FROM hr.staff
        WHERE tenant_id = 3 AND is_active = true
        GROUP BY store_id
        ORDER BY store_id
      `
      const staffByStoreResult = await pool.query(staffByStoreQuery)
      console.log('\n=== 店舗別スタッフ数 ===')
      staffByStoreResult.rows.forEach(s => {
        const store = storesResult.rows.find(st => st.store_id === s.store_id)
        console.log(`${store?.store_name || `店舗ID ${s.store_id}`}: ${s.staff_count}人`)
      })

    } else {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.shift_date} - ${row.staff_name}`)
        console.log(`   所属店舗: ${row.home_store_name} (${row.home_store_code})`)
        console.log(`   勤務店舗: ${row.shift_store_name} (${row.shift_store_code}) ← 応援勤務`)
        console.log(`   時間: ${row.start_time} - ${row.end_time}`)
        console.log('')
      })
    }

    // 全体の統計
    const statsQuery = `
      SELECT
        COUNT(DISTINCT s.shift_id) as total_shifts,
        COUNT(DISTINCT CASE WHEN st.store_id != s.store_id THEN s.shift_id END) as support_shifts,
        COUNT(DISTINCT s.staff_id) as total_staff,
        COUNT(DISTINCT CASE WHEN st.store_id != s.store_id THEN s.staff_id END) as staff_with_support
      FROM ops.shifts s
      JOIN hr.staff st ON s.staff_id = st.staff_id AND s.tenant_id = st.tenant_id
      WHERE s.tenant_id = 3
    `

    const statsResult = await pool.query(statsQuery)
    const stats = statsResult.rows[0]

    console.log('\n=== 統計情報 ===')
    console.log(`総シフト数: ${stats.total_shifts}件`)
    console.log(`応援勤務: ${stats.support_shifts}件 (${((stats.support_shifts / stats.total_shifts) * 100).toFixed(1)}%)`)
    console.log(`総スタッフ数: ${stats.total_staff}人`)
    console.log(`応援勤務経験者: ${stats.staff_with_support}人`)
    console.log('')

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await pool.end()
  }
}

checkSupportWork()
