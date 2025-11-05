import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('## 欠けているカラムのデータ確認\n');

    // shift_plans
    const plans = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(created_by) as created_by_count,
        COUNT(approved_by) as approved_by_count
      FROM ops.shift_plans
    `);
    console.log('### ops.shift_plans');
    console.log(`総件数: ${plans.rows[0].total}`);
    console.log(`created_by (NOT NULL): ${plans.rows[0].created_by_count}`);
    console.log(`approved_by (NOT NULL): ${plans.rows[0].approved_by_count}`);

    const plansSample = await pool.query(`
      SELECT plan_id, created_by, approved_by
      FROM ops.shift_plans
      LIMIT 3
    `);
    console.log('サンプルデータ:');
    plansSample.rows.forEach(r => {
      console.log(`  plan_id=${r.plan_id}, created_by=${r.created_by}, approved_by=${r.approved_by}`);
    });

    // shift_preferences
    const prefs = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(staff_name) as staff_name_count,
        COUNT(preferred_time_slots) as time_slots_count,
        COUNT(max_hours_per_week) as max_hours_count,
        COUNT(notes) as notes_count
      FROM ops.shift_preferences
    `);
    console.log('\n### ops.shift_preferences');
    console.log(`総件数: ${prefs.rows[0].total}`);
    console.log(`staff_name (NOT NULL): ${prefs.rows[0].staff_name_count}`);
    console.log(`preferred_time_slots (NOT NULL): ${prefs.rows[0].time_slots_count}`);
    console.log(`max_hours_per_week (NOT NULL): ${prefs.rows[0].max_hours_count}`);
    console.log(`notes (NOT NULL): ${prefs.rows[0].notes_count}`);

    const prefsSample = await pool.query(`
      SELECT preference_id, staff_id, staff_name, preferred_time_slots, max_hours_per_week, notes
      FROM ops.shift_preferences
      LIMIT 3
    `);
    console.log('サンプルデータ:');
    prefsSample.rows.forEach(r => {
      console.log(`  pref_id=${r.preference_id}, staff_id=${r.staff_id}, staff_name=${r.staff_name}, time_slots=${r.preferred_time_slots}, max_hours=${r.max_hours_per_week}, notes=${r.notes}`);
    });

    await pool.end();
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
})();
