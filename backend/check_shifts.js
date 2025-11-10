const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway'
});

(async () => {
  try {
    // 武根さんとサーさんのstaff_idを確認
    const staffResult = await pool.query(`
      SELECT staff_id, name, store_id
      FROM hr.staff
      WHERE name LIKE '%武根%' OR name LIKE '%サー%'
      ORDER BY name
    `);
    
    console.log('=== スタッフ情報 ===');
    staffResult.rows.forEach(s => {
      console.log(`staff_id: ${s.staff_id}, name: ${s.name}, store_id: ${s.store_id}`);
    });
    
    if (staffResult.rows.length > 0) {
      const staffIds = staffResult.rows.map(s => s.staff_id);
      
      // 11月のシフトを確認
      const shiftsResult = await pool.query(`
        SELECT 
          s.shift_date,
          s.staff_id,
          staff.name,
          s.start_time,
          s.end_time,
          p.plan_type
        FROM ops.shifts s
        LEFT JOIN hr.staff staff ON s.staff_id = staff.staff_id
        LEFT JOIN ops.shift_plans p ON s.plan_id = p.plan_id
        WHERE s.staff_id = ANY($1)
          AND EXTRACT(YEAR FROM s.shift_date) = 2025
          AND EXTRACT(MONTH FROM s.shift_date) = 11
        ORDER BY s.shift_date, staff.name
      `, [staffIds]);
      
      console.log('\n=== 2025年11月のシフト ===');
      shiftsResult.rows.forEach(shift => {
        const date = new Date(shift.shift_date);
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        const shiftDateStr = shift.shift_date.toISOString().split('T')[0];
        console.log(`${shiftDateStr} (${dayOfWeek}) - ${shift.name}: ${shift.start_time}-${shift.end_time} [${shift.plan_type}]`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
