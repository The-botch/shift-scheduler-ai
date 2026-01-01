const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:BWmHYBbEZqnptZRYmptockuomkHRWNPO@switchyard.proxy.rlwy.net:26491/railway'
});

async function run() {
  const client = await pool.connect();
  try {
    // 2026/01 SECOND と 2026/02 FIRST の両方に存在するスタッフを取得
    const staffResult = await client.query(`
      SELECT staff_id FROM (
        SELECT DISTINCT s1.staff_id
        FROM ops.shifts s1
        JOIN ops.shift_plans p1 ON s1.plan_id = p1.plan_id
        WHERE p1.tenant_id = 3 AND p1.plan_year = 2026 AND p1.plan_month = 1 AND p1.plan_type = 'SECOND'
        AND EXISTS (
          SELECT 1 FROM ops.shifts s2
          JOIN ops.shift_plans p2 ON s2.plan_id = p2.plan_id
          WHERE p2.tenant_id = 3 AND p2.plan_year = 2026 AND p2.plan_month = 2 AND p2.plan_type = 'FIRST'
          AND s2.staff_id = s1.staff_id
        )
      ) sub
      ORDER BY RANDOM()
      LIMIT 2
    `);

    const staffIds = staffResult.rows.map(r => r.staff_id);
    console.log('検証対象スタッフID:', staffIds);

    for (const staffId of staffIds) {
      console.log('\n' + '='.repeat(60));
      console.log('スタッフID:', staffId);
      console.log('='.repeat(60));

      // 2026/01 SECONDのシフト（コピー元）
      const janSecond = await client.query(`
        SELECT
          s.shift_date,
          EXTRACT(DOW FROM s.shift_date) as day_of_week,
          s.start_time,
          s.end_time,
          s.store_id
        FROM ops.shifts s
        JOIN ops.shift_plans p ON s.plan_id = p.plan_id
        WHERE p.tenant_id = 3 AND p.plan_year = 2026 AND p.plan_month = 1
          AND p.plan_type = 'SECOND' AND s.staff_id = $1
        ORDER BY s.shift_date
      `, [staffId]);

      // 2026/02 FIRSTのシフト（コピー先）
      const febFirst = await client.query(`
        SELECT
          s.shift_date,
          EXTRACT(DOW FROM s.shift_date) as day_of_week,
          s.start_time,
          s.end_time,
          s.store_id
        FROM ops.shifts s
        JOIN ops.shift_plans p ON s.plan_id = p.plan_id
        WHERE p.tenant_id = 3 AND p.plan_year = 2026 AND p.plan_month = 2
          AND p.plan_type = 'FIRST' AND s.staff_id = $1
        ORDER BY s.shift_date
      `, [staffId]);

      // 曜日名
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

      // 週番号を計算する関数
      const getWeekInfo = (dateStr) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth();
        const dayOfWeek = date.getDay();
        const dayOfMonth = date.getDate();

        let weekCount = 0;
        for (let d = 1; d <= dayOfMonth; d++) {
          const checkDate = new Date(year, month, d);
          if (checkDate.getDay() === dayOfWeek) {
            weekCount++;
          }
        }
        return { weekNumber: weekCount, dayOfWeek };
      };

      console.log('\n【2026年1月 SECOND（コピー元）】');
      const janByKey = {};
      for (const shift of janSecond.rows) {
        const dateStr = shift.shift_date.toISOString().slice(0,10);
        const { weekNumber, dayOfWeek } = getWeekInfo(shift.shift_date);
        const key = 'w' + weekNumber + '_d' + dayOfWeek;
        janByKey[key] = { dateStr, ...shift };
        console.log('  ' + dateStr + ' (' + dayNames[shift.day_of_week] + '曜・第' + weekNumber + '週) → key=' + key + ' | ' + shift.start_time + '-' + shift.end_time + ' | store=' + shift.store_id);
      }

      console.log('\n【2026年2月 FIRST（コピー先）】');
      const febByKey = {};
      for (const shift of febFirst.rows) {
        const dateStr = shift.shift_date.toISOString().slice(0,10);
        const { weekNumber, dayOfWeek } = getWeekInfo(shift.shift_date);
        const key = 'w' + weekNumber + '_d' + dayOfWeek;
        febByKey[key] = { dateStr, ...shift };
        console.log('  ' + dateStr + ' (' + dayNames[shift.day_of_week] + '曜・第' + weekNumber + '週) → key=' + key + ' | ' + shift.start_time + '-' + shift.end_time + ' | store=' + shift.store_id);
      }

      // マッピング検証
      console.log('\n【マッピング検証】');
      let matchCount = 0;
      let mismatchCount = 0;
      let notFoundCount = 0;
      for (const key of Object.keys(janByKey)) {
        const jan = janByKey[key];
        const feb = febByKey[key];
        if (feb) {
          const timeMatch = jan.start_time === feb.start_time && jan.end_time === feb.end_time;
          const storeMatch = jan.store_id === feb.store_id;
          if (timeMatch && storeMatch) {
            console.log('  ✓ ' + key + ': 1月' + jan.dateStr + ' → 2月' + feb.dateStr + ' (時間・店舗一致)');
            matchCount++;
          } else {
            console.log('  ⚠ ' + key + ': 1月' + jan.dateStr + ' → 2月' + feb.dateStr + ' (不一致: 時間=' + timeMatch + ', 店舗=' + storeMatch + ')');
            mismatchCount++;
          }
        } else {
          const parts = key.split('_');
          const weekNum = parts[0].slice(1);
          const dow = parseInt(parts[1].slice(1));
          console.log('  ✗ ' + key + ': 1月' + jan.dateStr + ' → 2月に対応なし（2月に第' + weekNum + '週の' + dayNames[dow] + '曜日がない）');
          notFoundCount++;
        }
      }
      console.log('\n  結果: 一致=' + matchCount + ', 不一致=' + mismatchCount + ', 1月のみ=' + notFoundCount);
    }

  } finally {
    client.release();
    pool.end();
  }
}
run().catch(console.error);
