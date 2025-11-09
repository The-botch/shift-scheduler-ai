/**
 * 2025年7月のStand Bo Bunでの応援勤務を確認
 */

import pg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pg
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

async function checkJulyBobun() {
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
        AND store2.store_name LIKE '%ボブン%'
      ORDER BY s.shift_date, s.staff_id
    `

    const result = await pool.query(query)

    console.log('\n=== Stand Bo Bun (ボブン) での応援勤務 (2025年7月) ===\n')

    if (result.rows.length === 0) {
      console.log('応援勤務のデータが見つかりませんでした。')
    } else {
      result.rows.forEach(row => {
        const date = row.shift_date.toISOString().split('T')[0]
        console.log(`日付: ${date}`)
        console.log(`スタッフ: ${row.staff_name} (所属: ${row.home_store_name})`)
        console.log(`勤務店舗: ${row.shift_store_name} (${row.shift_store_code})`)
        console.log(`時間: ${row.start_time} - ${row.end_time}`)
        console.log('')
      })
      console.log(`合計: ${result.rows.length}件`)
    }
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await pool.end()
  }
}

checkJulyBobun()
