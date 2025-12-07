import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../../../backend/.env') })

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function check() {
  await client.connect()

  // 2025年12月のshift_plansを確認
  console.log('=== 2025年12月のシフトプラン ===')
  const plans = await client.query(`
    SELECT p.plan_id, p.store_id, st.store_name, p.plan_year, p.plan_month, p.plan_type, p.status
    FROM ops.shift_plans p
    LEFT JOIN core.stores st ON p.store_id = st.store_id
    WHERE p.tenant_id = 3
      AND p.plan_year = 2025
      AND p.plan_month = 12
    ORDER BY p.store_id, p.plan_type
  `)
  console.table(plans.rows.length ? plans.rows : [{ message: 'データなし' }])

  // 2025年12月の承認済み第二案があるか
  console.log('\n=== 2025年12月のSECONDプラン ===')
  const secondPlans = await client.query(`
    SELECT p.plan_id, p.store_id, st.store_name, p.status,
           (SELECT COUNT(*) FROM ops.shifts s WHERE s.plan_id = p.plan_id) as shift_count
    FROM ops.shift_plans p
    LEFT JOIN core.stores st ON p.store_id = st.store_id
    WHERE p.tenant_id = 3
      AND p.plan_year = 2025
      AND p.plan_month = 12
      AND p.plan_type = 'SECOND'
    ORDER BY p.store_id
  `)
  console.table(secondPlans.rows.length ? secondPlans.rows : [{ message: 'データなし' }])

  // 2026年1月の全プランを確認（TTを含む）
  console.log('\n=== 2026年1月の全プラン（TTを含む） ===')
  const jan2026Plans = await client.query(`
    SELECT p.plan_id, p.store_id, st.store_name, p.plan_type, p.status,
           (SELECT COUNT(*) FROM ops.shifts s WHERE s.plan_id = p.plan_id) as shift_count
    FROM ops.shift_plans p
    LEFT JOIN core.stores st ON p.store_id = st.store_id
    WHERE p.tenant_id = 3
      AND p.plan_year = 2026
      AND p.plan_month = 1
    ORDER BY p.store_id, p.plan_type
  `)
  console.table(jan2026Plans.rows.length ? jan2026Plans.rows : [{ message: 'データなし' }])

  // TT (store_id=11) のプランを確認
  console.log('\n=== Tipsy Tiger (store_id=11) の全プラン ===')
  const ttPlans = await client.query(`
    SELECT p.plan_id, p.store_id, st.store_name, p.plan_year, p.plan_month, p.plan_type, p.status,
           (SELECT COUNT(*) FROM ops.shifts s WHERE s.plan_id = p.plan_id) as shift_count
    FROM ops.shift_plans p
    LEFT JOIN core.stores st ON p.store_id = st.store_id
    WHERE p.tenant_id = 3
      AND p.store_id = 11
    ORDER BY p.plan_year, p.plan_month, p.plan_type
  `)
  console.table(ttPlans.rows.length ? ttPlans.rows : [{ message: 'TTのプランなし' }])

  // TTスタッフ（ケサブ、加藤）の12月シフトを確認
  console.log('\n=== TTスタッフ（ケサブ、加藤）の12月シフト ===')
  const ttStaffShifts = await client.query(`
    SELECT s.shift_id, s.store_id, st.store_name as shift_store,
           s.plan_id, sp.store_id as plan_store_id, pst.store_name as plan_store,
           sp.plan_type, sp.status,
           staff.name, s.shift_date
    FROM ops.shifts s
    JOIN hr.staff staff ON s.staff_id = staff.staff_id
    JOIN ops.shift_plans sp ON s.plan_id = sp.plan_id
    LEFT JOIN core.stores st ON s.store_id = st.store_id
    LEFT JOIN core.stores pst ON sp.store_id = pst.store_id
    WHERE s.tenant_id = 3
      AND staff.name IN ('ケサブ', '加藤智津子')
      AND s.shift_date >= '2025-12-01'
      AND s.shift_date < '2026-01-01'
    ORDER BY s.shift_date, staff.name
    LIMIT 20
  `)
  console.table(ttStaffShifts.rows.length ? ttStaffShifts.rows : [{ message: 'シフトなし' }])

  // store_id=11のシフトを確認
  console.log('\n=== store_id=11 (TT) のシフト ===')
  const ttShifts = await client.query(`
    SELECT s.shift_id, s.store_id, s.plan_id, sp.plan_type, staff.name, s.shift_date
    FROM ops.shifts s
    JOIN hr.staff staff ON s.staff_id = staff.staff_id
    JOIN ops.shift_plans sp ON s.plan_id = sp.plan_id
    WHERE s.tenant_id = 3
      AND s.store_id = 11
    ORDER BY s.shift_date
    LIMIT 20
  `)
  console.table(ttShifts.rows.length ? ttShifts.rows : [{ message: 'TTのシフトなし' }])

  await client.end()
}

check()
