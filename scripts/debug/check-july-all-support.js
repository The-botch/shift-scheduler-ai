/**
 * 2025年7月の全応援勤務を確認
 */

import pg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pg
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

async function checkJulySupport() {
  try {
    const query = `
      SELECT
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
      WHERE s.tenant_id = 3
        AND s.shift_date >= '2025-07-01'
        AND s.shift_date < '2025-08-01'
        AND st.store_id != s.store_id
      ORDER BY s.shift_date, shift_store_name, s.staff_id
    `

    const result = await pool.query(query)

    console.log('\n=== 2025年7月の全応援勤務 ===\n')

    if (result.rows.length === 0) {
      console.log('応援勤務のデータが見つかりませんでした。')
    } else {
      result.rows.forEach((row, index) => {
        const date = row.shift_date.toISOString().split('T')[0]
        console.log(`${index + 1}. ${date} - ${row.staff_name}`)
        console.log(`   所属: ${row.home_store_name} (${row.home_store_code})`)
        console.log(`   勤務: ${row.shift_store_name} (${row.shift_store_code}) ← 応援`)
        console.log(`   時間: ${row.start_time} - ${row.end_time}`)
        console.log('')
      })
      console.log(`合計: ${result.rows.length}件`)

      // 店舗別集計
      const byStore = {}
      result.rows.forEach(row => {
        if (!byStore[row.shift_store_name]) {
          byStore[row.shift_store_name] = 0
        }
        byStore[row.shift_store_name]++
      })

      console.log('\n=== 店舗別応援勤務数 ===')
      Object.entries(byStore).forEach(([store, count]) => {
        console.log(`${store}: ${count}件`)
      })
    }
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await pool.end()
  }
}

checkJulySupport()
