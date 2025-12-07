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

async function fixTTShiftPlans() {
  await client.connect()

  const tenant_id = 3
  const tt_store_id = 11  // Tipsy Tiger

  // 1. TTのシフトで、plan_idが他店舗のプランを指しているものを検索
  console.log('=== TTのシフトでplan_idが他店舗を指しているもの ===')
  const mismatchedShifts = await client.query(`
    SELECT
      s.shift_id,
      s.store_id as shift_store_id,
      s.plan_id,
      sp.store_id as plan_store_id,
      sp.plan_year,
      sp.plan_month,
      sp.plan_type,
      sp.status,
      s.shift_date
    FROM ops.shifts s
    JOIN ops.shift_plans sp ON s.plan_id = sp.plan_id
    WHERE s.tenant_id = $1
      AND s.store_id = $2
      AND sp.store_id != $2
    ORDER BY sp.plan_year, sp.plan_month, sp.plan_type
  `, [tenant_id, tt_store_id])

  console.table(mismatchedShifts.rows.length ? mismatchedShifts.rows : [{ message: '不整合なし' }])

  if (mismatchedShifts.rows.length === 0) {
    console.log('修正対象のシフトはありません')
    await client.end()
    return
  }

  // 2. 必要なプランをグループ化（year, month, plan_type）
  const requiredPlans = new Map()
  for (const shift of mismatchedShifts.rows) {
    const key = `${shift.plan_year}-${shift.plan_month}-${shift.plan_type}`
    if (!requiredPlans.has(key)) {
      requiredPlans.set(key, {
        plan_year: shift.plan_year,
        plan_month: shift.plan_month,
        plan_type: shift.plan_type,
        status: shift.status,
        shifts: []
      })
    }
    requiredPlans.get(key).shifts.push(shift)
  }

  console.log('\n=== 必要なTTプラン ===')
  for (const [key, plan] of requiredPlans) {
    console.log(`${key}: ${plan.shifts.length}シフト, status=${plan.status}`)
  }

  // 3. 各プランに対して、TTのshift_planが存在するか確認、なければ作成
  for (const [key, planInfo] of requiredPlans) {
    const { plan_year, plan_month, plan_type, status, shifts } = planInfo

    // 既存のTTプランを検索
    const existingPlan = await client.query(`
      SELECT plan_id FROM ops.shift_plans
      WHERE tenant_id = $1 AND store_id = $2 AND plan_year = $3 AND plan_month = $4 AND plan_type = $5
    `, [tenant_id, tt_store_id, plan_year, plan_month, plan_type])

    let newPlanId
    if (existingPlan.rows.length > 0) {
      newPlanId = existingPlan.rows[0].plan_id
      console.log(`\n既存のTTプラン使用: plan_id=${newPlanId} (${plan_year}/${plan_month} ${plan_type})`)
    } else {
      // 新規作成
      const periodStart = new Date(plan_year, plan_month - 1, 1)
      const periodEnd = new Date(plan_year, plan_month, 0)
      const planCode = `PLAN-${plan_year}${String(plan_month).padStart(2, '0')}-${String(tt_store_id).padStart(3, '0')}`
      const planName = `${plan_year}年${plan_month}月シフト（${plan_type === 'FIRST' ? '第1案' : '第2案'}）`

      const createResult = await client.query(`
        INSERT INTO ops.shift_plans (
          tenant_id, store_id, plan_year, plan_month,
          plan_code, plan_name, period_start, period_end,
          plan_type, status, generation_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'DATA_FIX')
        RETURNING plan_id
      `, [
        tenant_id, tt_store_id, plan_year, plan_month,
        planCode, planName, periodStart, periodEnd,
        plan_type, status
      ])
      newPlanId = createResult.rows[0].plan_id
      console.log(`\n新規TTプラン作成: plan_id=${newPlanId} (${plan_year}/${plan_month} ${plan_type})`)
    }

    // 4. シフトのplan_idを更新
    const shiftIds = shifts.map(s => s.shift_id)
    const updateResult = await client.query(`
      UPDATE ops.shifts
      SET plan_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE shift_id = ANY($2)
    `, [newPlanId, shiftIds])
    console.log(`  ${updateResult.rowCount}件のシフトを更新しました`)
  }

  // 5. 確認
  console.log('\n=== 修正後のTTプラン ===')
  const ttPlansAfter = await client.query(`
    SELECT p.plan_id, p.store_id, st.store_name, p.plan_year, p.plan_month, p.plan_type, p.status,
           (SELECT COUNT(*) FROM ops.shifts s WHERE s.plan_id = p.plan_id) as shift_count
    FROM ops.shift_plans p
    LEFT JOIN core.stores st ON p.store_id = st.store_id
    WHERE p.tenant_id = $1
      AND p.store_id = $2
    ORDER BY p.plan_year, p.plan_month, p.plan_type
  `, [tenant_id, tt_store_id])
  console.table(ttPlansAfter.rows)

  console.log('\n=== 修正後のTTシフト（12月） ===')
  const ttShiftsAfter = await client.query(`
    SELECT s.shift_id, s.store_id, s.plan_id, sp.plan_type, sp.store_id as plan_store_id,
           staff.name, s.shift_date
    FROM ops.shifts s
    JOIN hr.staff staff ON s.staff_id = staff.staff_id
    JOIN ops.shift_plans sp ON s.plan_id = sp.plan_id
    WHERE s.tenant_id = $1
      AND s.store_id = $2
      AND s.shift_date >= '2025-12-01'
    ORDER BY s.shift_date
    LIMIT 20
  `, [tenant_id, tt_store_id])
  console.table(ttShiftsAfter.rows.length ? ttShiftsAfter.rows : [{ message: 'シフトなし' }])

  await client.end()
  console.log('\n✅ 修正完了')
}

fixTTShiftPlans().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
