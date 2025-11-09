import { query } from './src/config/database.js';

(async () => {
  console.log('=== Tenant 3: 7月5日～9日のシフトデータ ===\n');

  const shifts = await query(`
    SELECT
      sh.shift_date,
      staff.name as staff_name,
      s.store_name,
      staff.store_id as staff_home_store_id,
      sh.store_id as work_store_id,
      sh.start_time,
      sh.end_time,
      sh.break_minutes,
      sh.total_hours,
      sp.plan_type,
      sp.status
    FROM ops.shifts sh
    JOIN hr.staff staff ON sh.staff_id = staff.staff_id
    JOIN core.stores s ON sh.store_id = s.store_id
    JOIN ops.shift_plans sp ON sh.plan_id = sp.plan_id
    WHERE sh.tenant_id = 3
      AND sh.shift_date >= '2025-07-05'
      AND sh.shift_date <= '2025-07-09'
    ORDER BY sh.shift_date, staff.name
  `);

  console.log(`総件数: ${shifts.rows.length}件\n`);

  // 日付ごとにグループ化
  const byDate = {};
  shifts.rows.forEach(shift => {
    const date = shift.shift_date.toISOString().split('T')[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(shift);
  });

  // 日付ごとに表示
  Object.keys(byDate).sort().forEach(date => {
    const dayShifts = byDate[date];
    console.log(`\n【${date}】 ${dayShifts.length}件`);
    console.log('─'.repeat(100));

    dayShifts.forEach(shift => {
      const isSupport = shift.staff_home_store_id !== shift.work_store_id;
      const supportMark = isSupport ? ' 🔄応援' : '';

      console.log(
        `${shift.staff_name.padEnd(15)} | ` +
        `勤務店舗: ${shift.store_name.padEnd(18)} | ` +
        `${shift.start_time.substring(0,5)}-${shift.end_time.substring(0,5)} | ` +
        `休憩${shift.break_minutes}分 | ` +
        `${shift.total_hours}時間${supportMark}`
      );
    });
  });

  // 店舗別集計
  console.log('\n\n=== 店舗別集計 (7月5日～9日) ===');
  const byStore = {};
  shifts.rows.forEach(shift => {
    const store = shift.store_name;
    if (!byStore[store]) byStore[store] = 0;
    byStore[store]++;
  });

  Object.keys(byStore).sort().forEach(store => {
    console.log(`  ${store}: ${byStore[store]}件`);
  });

  process.exit(0);
})();
