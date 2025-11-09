/**
 * テナントIDごとのデータを確認するスクリプト
 */

import pg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pg
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

async function checkTenantData() {
  try {
    // テナント一覧
    console.log('\n=== テナント一覧 ===')
    const tenantsResult = await pool.query('SELECT * FROM core.tenants ORDER BY tenant_id')
    tenantsResult.rows.forEach(t => {
      console.log(`ID: ${t.tenant_id}, 名前: ${t.tenant_name}`)
    })

    // 各テナントのシフト数
    console.log('\n=== テナント別シフト数 ===')
    const shiftsResult = await pool.query(`
      SELECT tenant_id, COUNT(*) as shift_count
      FROM ops.shifts
      GROUP BY tenant_id
      ORDER BY tenant_id
    `)
    shiftsResult.rows.forEach(s => {
      console.log(`テナントID ${s.tenant_id}: ${s.shift_count}件`)
    })

    // 各テナントのスタッフ数
    console.log('\n=== テナント別スタッフ数 ===')
    const staffResult = await pool.query(`
      SELECT tenant_id, COUNT(*) as staff_count
      FROM hr.staff
      GROUP BY tenant_id
      ORDER BY tenant_id
    `)
    staffResult.rows.forEach(s => {
      console.log(`テナントID ${s.tenant_id}: ${s.staff_count}人`)
    })

    // 各テナントの店舗数
    console.log('\n=== テナント別店舗数 ===')
    const storesResult = await pool.query(`
      SELECT tenant_id, COUNT(*) as store_count
      FROM core.stores
      GROUP BY tenant_id
      ORDER BY tenant_id
    `)
    storesResult.rows.forEach(s => {
      console.log(`テナントID ${s.tenant_id}: ${s.store_count}店舗`)
    })

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await pool.end()
  }
}

checkTenantData()
