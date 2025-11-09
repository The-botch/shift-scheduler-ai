/**
 * 応援勤務のテストデータを作成するスクリプト
 */

import pg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pg
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

async function createTestData() {
  try {
    // まず、既存のスタッフと店舗を確認
    const staffQuery = `
      SELECT staff_id, name, store_id, tenant_id
      FROM hr.staff
      WHERE tenant_id = 1 AND is_active = true
      ORDER BY staff_id
      LIMIT 5
    `
    const staffResult = await pool.query(staffQuery)
    console.log('\n=== スタッフ情報 ===')
    staffResult.rows.forEach(s => {
      console.log(`ID: ${s.staff_id}, 名前: ${s.name}, 所属店舗: ${s.store_id}`)
    })

    const storesQuery = `
      SELECT store_id, store_code, store_name
      FROM core.stores
      WHERE tenant_id = 1
      ORDER BY store_id
    `
    const storesResult = await pool.query(storesQuery)
    console.log('\n=== 店舗情報 ===')
    storesResult.rows.forEach(s => {
      console.log(`ID: ${s.store_id}, コード: ${s.store_code}, 名前: ${s.store_name}`)
    })

    // テストデータを作成
    // 最初のスタッフを別の店舗に応援勤務させる
    if (staffResult.rows.length >= 1 && storesResult.rows.length >= 2) {
      const staff = staffResult.rows[0]
      const homeStoreId = staff.store_id
      // 所属店舗と異なる店舗を選択
      const targetStore = storesResult.rows.find(s => s.store_id !== homeStoreId)

      if (targetStore) {
        const insertQuery = `
          INSERT INTO ops.shifts (
            tenant_id, staff_id, store_id, shift_date,
            start_time, end_time, break_minutes,
            status, is_modified, created_at, updated_at
          ) VALUES (
            1, $1, $2, '2025-01-15',
            '09:00:00', '17:00:00', 60,
            'approved', false, NOW(), NOW()
          ) RETURNING shift_id
        `

        const result = await pool.query(insertQuery, [staff.staff_id, targetStore.store_id])

        console.log('\n=== 応援勤務テストデータを作成しました ===')
        console.log(`シフトID: ${result.rows[0].shift_id}`)
        console.log(`スタッフ: ${staff.name} (ID: ${staff.staff_id})`)
        console.log(`所属店舗ID: ${homeStoreId}`)
        console.log(`勤務店舗: ${targetStore.store_name} (${targetStore.store_code}) - ID: ${targetStore.store_id}`)
        console.log(`日付: 2025-01-15`)
        console.log(`時間: 09:00-17:00`)
        console.log('\n履歴画面で2025年1月を開いて確認してください。')
      }
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await pool.end()
  }
}

createTestData()
