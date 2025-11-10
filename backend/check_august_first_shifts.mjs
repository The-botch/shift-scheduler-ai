import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

(async () => {
  try {
    const staffResult = await pool.query(`
      SELECT staff_id, name FROM hr.staff
      WHERE name LIKE '%武根%' OR name LIKE '%サー%'
      ORDER BY name
    `);
    const staffIds = staffResult.rows.map(s => s.staff_id);
    
    const shiftsResult = await pool.query(`
      SELECT 
        s.shift_date,
        s.plan_id,
        staff.name,
        s.start_time,
        s.end_time,
        p.generation_type,
        p.plan_name
      FROM ops.shifts s
      LEFT JOIN hr.staff staff ON s.staff_id = staff.staff_id
      LEFT JOIN ops.shift_plans p ON s.plan_id = p.plan_id
      WHERE s.staff_id = ANY($1)
        AND s.shift_date >= '2025-08-01'
        AND s.shift_date <= '2025-08-10'
        AND p.plan_type = 'FIRST'
      ORDER BY s.shift_date, staff.name
    `, [staffIds]);
    
    console.log('=== 8月第1案のシフト（8/1〜8/10） ===');
    if (shiftsResult.rows.length === 0) {
      console.log('シフトデータが見つかりません');
    } else {
      shiftsResult.rows.forEach(shift => {
        const date = new Date(shift.shift_date);
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        const shiftDateStr = shift.shift_date.toISOString().split('T')[0];
        console.log(shiftDateStr + ' (' + dayOfWeek + ') - ' + shift.name + ': ' + shift.start_time + '-' + shift.end_time + ' [plan_id: ' + shift.plan_id + ', ' + shift.generation_type + ']');
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
