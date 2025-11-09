import { query } from './src/config/database.js';

(async () => {
  // アトリエ所属のスタッフIDを確認
  const atelier = await query(`
    SELECT staff_id, name, store_id
    FROM hr.staff
    WHERE tenant_id = 3 AND store_id = (SELECT store_id FROM core.stores WHERE tenant_id = 3 AND store_code = 'ATELIER')
    LIMIT 5
  `);
  console.log('アトリエ所属スタッフ:', atelier.rows);

  // そのスタッフの7月のシフトを確認
  if (atelier.rows.length > 0) {
    const staffId = atelier.rows[0].staff_id;
    const shifts = await query(`
      SELECT sh.shift_id, sh.shift_date, sh.store_id as work_store_id, staff.name, staff.store_id as staff_store_id,
             st.store_name as work_store_name
      FROM ops.shifts sh
      JOIN hr.staff staff ON sh.staff_id = staff.staff_id
      LEFT JOIN core.stores st ON sh.store_id = st.store_id
      WHERE sh.staff_id = $1
        AND EXTRACT(YEAR FROM sh.shift_date) = 2025
        AND EXTRACT(MONTH FROM sh.shift_date) = 7
      ORDER BY sh.shift_date
      LIMIT 10
    `, [staffId]);
    console.log(`\nスタッフ「${atelier.rows[0].name}」の7月のシフト:`, shifts.rows);
  }

  process.exit(0);
})();
