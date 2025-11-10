import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

(async () => {
  try {
    // 8月の第1案プランを確認
    const planResult = await pool.query(`
      SELECT plan_id, plan_code, plan_name, plan_type, generation_type, status, created_at
      FROM ops.shift_plans
      WHERE plan_year = 2025 AND plan_month = 8
        AND plan_type = 'FIRST'
      ORDER BY created_at DESC
    `);
    
    console.log('=== 2025年8月の第1案プラン ===');
    planResult.rows.forEach(p => {
      console.log(`plan_id: ${p.plan_id}, type: ${p.plan_type}, status: ${p.status}`);
      console.log(`  generation_type: ${p.generation_type}`);
      console.log(`  plan_name: ${p.plan_name}`);
      console.log(`  created_at: ${p.created_at}`);
    });
    
    if (planResult.rows.length > 0) {
      const planId = planResult.rows[0].plan_id;
      
      // 武根さんとサーさんのstaff_id
      const staffResult = await pool.query(`
        SELECT staff_id, name FROM hr.staff
        WHERE name LIKE '%武根%' OR name LIKE '%サー%'
        ORDER BY name
      `);
      const staffIds = staffResult.rows.map(s => s.staff_id);
      
      // 8月の第1案で8/1〜8/10のシフトを確認
      const shiftsResult = await pool.query(`
        SELECT 
          s.shift_date,
          staff.name,
          s.start_time,
          s.end_time
        FROM ops.shifts s
        LEFT JOIN hr.staff staff ON s.staff_id = staff.staff_id
        WHERE s.plan_id = $1
          AND s.staff_id = ANY($2)
          AND s.shift_date >= '2025-08-01'
          AND s.shift_date <= '2025-08-10'
        ORDER BY s.shift_date, staff.name
      `, [planId, staffIds]);
      
      console.log('\n=== 8月第1案のシフト（8/1〜8/10） ===');
      if (shiftsResult.rows.length === 0) {
        console.log('シフトデータが見つかりません');
      } else {
        shiftsResult.rows.forEach(shift => {
          const date = new Date(shift.shift_date);
          const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
          const shiftDateStr = shift.shift_date.toISOString().split('T')[0];
          console.log(`${shiftDateStr} (${dayOfWeek}) - ${shift.name}: ${shift.start_time}-${shift.end_time}`);
        });
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
