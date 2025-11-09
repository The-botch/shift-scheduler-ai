/**
 * 複数店舗のテストデータをセットアップするスクリプト
 */

import pg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pg
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

async function setupMultiStore() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 店舗を追加
    const stores = [
      { code: 'SBY', name: '渋谷店', address: '東京都渋谷区' },
      { code: 'SJK', name: '新宿店', address: '東京都新宿区' },
      { code: 'IKB', name: '池袋店', address: '東京都豊島区' },
    ]

    console.log('\n=== 店舗を追加中 ===')
    const storeIds = []
    for (const store of stores) {
      const result = await client.query(`
        INSERT INTO core.stores (tenant_id, store_code, store_name, address, created_at, updated_at)
        VALUES (1, $1, $2, $3, NOW(), NOW())
        ON CONFLICT (tenant_id, store_code)
        DO UPDATE SET store_name = EXCLUDED.store_name, address = EXCLUDED.address
        RETURNING store_id, store_code, store_name
      `, [store.code, store.name, store.address])

      storeIds.push(result.rows[0])
      console.log(`✓ ${result.rows[0].store_name} (${result.rows[0].store_code}) - ID: ${result.rows[0].store_id}`)
    }

    // スタッフの所属店舗を分散
    const staffUpdates = [
      { staffId: 1, storeCode: 'SBY' },
      { staffId: 2, storeCode: 'SBY' },
      { staffId: 3, storeCode: 'SJK' },
      { staffId: 4, storeCode: 'SJK' },
      { staffId: 5, storeCode: 'IKB' },
    ]

    console.log('\n=== スタッフの所属店舗を更新中 ===')
    for (const update of staffUpdates) {
      const store = storeIds.find(s => s.store_code === update.storeCode)
      if (store) {
        await client.query(`
          UPDATE hr.staff
          SET store_id = $1, updated_at = NOW()
          WHERE staff_id = $2 AND tenant_id = 1
        `, [store.store_id, update.staffId])

        const nameResult = await client.query(`SELECT name FROM hr.staff WHERE staff_id = $1 AND tenant_id = 1`, [update.staffId])
        console.log(`✓ ${nameResult.rows[0]?.name || `ID:${update.staffId}`} → ${store.store_name}`)
      }
    }

    // 応援勤務のシフトを作成
    console.log('\n=== 応援勤務シフトを作成中 ===')

    // 1. 田中太郎（渋谷店）が新宿店で勤務
    const sbyStore = storeIds.find(s => s.store_code === 'SBY')
    const sjkStore = storeIds.find(s => s.store_code === 'SJK')
    const ikbStore = storeIds.find(s => s.store_code === 'IKB')

    const supportShifts = [
      { staffId: 1, staffName: '田中太郎', homeStore: 'SBY', workStore: 'SJK', date: '2025-01-15', startTime: '09:00:00', endTime: '17:00:00' },
      { staffId: 1, staffName: '田中太郎', homeStore: 'SBY', workStore: 'IKB', date: '2025-01-20', startTime: '10:00:00', endTime: '18:00:00' },
      { staffId: 3, staffName: '鈴木次郎', homeStore: 'SJK', workStore: 'SBY', date: '2025-01-18', startTime: '13:00:00', endTime: '21:00:00' },
    ]

    for (const shift of supportShifts) {
      const workStore = storeIds.find(s => s.store_code === shift.workStore)
      if (workStore) {
        const result = await client.query(`
          INSERT INTO ops.shifts (
            tenant_id, staff_id, store_id, shift_date,
            start_time, end_time, break_minutes,
            status, is_modified, created_at, updated_at
          ) VALUES (
            1, $1, $2, $3, $4, $5, 60,
            'approved', false, NOW(), NOW()
          ) RETURNING shift_id
        `, [shift.staffId, workStore.store_id, shift.date, shift.startTime, shift.endTime])

        console.log(`✓ ${shift.staffName} (${shift.homeStore}所属) → ${workStore.store_name}で勤務 [${shift.date} ${shift.startTime}-${shift.endTime}]`)
      }
    }

    await client.query('COMMIT')

    console.log('\n=== セットアップ完了 ===')
    console.log('履歴画面で2025年1月を開いて、応援勤務の表示を確認してください。')
    console.log('表示例: 「SJK 9-17」のように店舗コードが表示されます。')

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('エラー:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

setupMultiStore()
