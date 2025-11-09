import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // 最新のshift_plans
    const plans = await pool.query(`
      SELECT plan_id, plan_code, created_at
      FROM ops.shift_plans
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('## 最新のshift_plans (上位5件):');
    plans.rows.forEach(r => {
      console.log(`  - plan_id: ${r.plan_id}, code: ${r.plan_code}, created: ${r.created_at}`);
    });

    // 最新のshifts
    const shifts = await pool.query(`
      SELECT shift_id, shift_date, created_at
      FROM ops.shifts
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('\n## 最新のshifts (上位5件):');
    shifts.rows.forEach(r => {
      console.log(`  - shift_id: ${r.shift_id}, date: ${r.shift_date}, created: ${r.created_at}`);
    });

    // 今日以降に作成されたレコード数
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentPlans = await pool.query(`
      SELECT COUNT(*) as count FROM ops.shift_plans WHERE created_at >= $1
    `, [today]);

    const recentShifts = await pool.query(`
      SELECT COUNT(*) as count FROM ops.shifts WHERE created_at >= $1
    `, [today]);

    console.log(`\n## 今日作成されたレコード:`);
    console.log(`  - shift_plans: ${recentPlans.rows[0].count}件`);
    console.log(`  - shifts: ${recentShifts.rows[0].count}件`);

    await pool.end();
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
})();
