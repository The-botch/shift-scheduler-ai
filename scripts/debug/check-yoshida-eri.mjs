import { query } from './src/config/database.js';

(async () => {
  console.log('=== 吉田瑛里さんの情報 ===\n');

  // スタッフ基本情報
  const staff = await query(`
    SELECT
      staff.staff_id,
      staff.name,
      staff.store_id,
      s.store_name,
      staff.is_active,
      staff.hire_date,
      staff.termination_date
    FROM hr.staff staff
    LEFT JOIN core.stores s ON staff.store_id = s.store_id
    WHERE staff.tenant_id = 3
      AND staff.name = '吉田瑛里'
  `);

  if (staff.rows.length === 0) {
    console.log('❌ 吉田瑛里さんが見つかりません');
    process.exit(0);
  }

  const info = staff.rows[0];
  console.log('📋 基本情報');
  console.log('─'.repeat(60));
  console.log(`スタッフID: ${info.staff_id}`);
  console.log(`名前: ${info.name}`);
  console.log(`所属店舗: ${info.store_name} (store_id: ${info.store_id})`);
  console.log(`役職: ${info.position_name || 'なし'}`);
  console.log(`雇用形態: ${info.employment_type || 'なし'}`);
  console.log(`時給: ${info.hourly_wage ? `¥${info.hourly_wage}` : 'なし'}`);
  console.log(`月給: ${info.monthly_salary ? `¥${info.monthly_salary}` : 'なし'}`);
  console.log(`在職状況: ${info.is_active ? '在職中' : '退職済'}`);
  console.log(`入社日: ${info.hire_date ? info.hire_date.toISOString().split('T')[0] : 'なし'}`);
  console.log(`退職日: ${info.termination_date ? info.termination_date.toISOString().split('T')[0] : 'なし'}`);

  // 7月のシフト集計
  console.log('\n\n📅 7月のシフト実績');
  console.log('─'.repeat(60));

  const julyShifts = await query(`
    SELECT
      sh.shift_date,
      s.store_name,
      sh.start_time,
      sh.end_time,
      sh.break_minutes,
      sh.total_hours,
      sh.store_id as work_store_id,
      staff.store_id as home_store_id
    FROM ops.shifts sh
    JOIN hr.staff staff ON sh.staff_id = staff.staff_id
    JOIN core.stores s ON sh.store_id = s.store_id
    WHERE sh.tenant_id = 3
      AND staff.name = '吉田瑛里'
      AND EXTRACT(YEAR FROM sh.shift_date) = 2025
      AND EXTRACT(MONTH FROM sh.shift_date) = 7
    ORDER BY sh.shift_date
  `);

  console.log(`総シフト数: ${julyShifts.rows.length}件\n`);

  let totalHours = 0;
  const byStore = {};

  julyShifts.rows.forEach(shift => {
    const date = shift.shift_date.toISOString().split('T')[0];
    const isSupport = shift.work_store_id !== shift.home_store_id;
    const mark = isSupport ? ' 🔄応援' : '';

    console.log(
      `${date} | ${shift.store_name.padEnd(18)} | ` +
      `${shift.start_time.substring(0,5)}-${shift.end_time.substring(0,5)} | ` +
      `休憩${shift.break_minutes}分 | ${shift.total_hours}h${mark}`
    );

    totalHours += parseFloat(shift.total_hours);

    if (!byStore[shift.store_name]) {
      byStore[shift.store_name] = { count: 0, hours: 0 };
    }
    byStore[shift.store_name].count++;
    byStore[shift.store_name].hours += parseFloat(shift.total_hours);
  });

  console.log('\n店舗別集計:');
  Object.keys(byStore).forEach(store => {
    console.log(`  ${store}: ${byStore[store].count}日, ${byStore[store].hours.toFixed(1)}時間`);
  });
  console.log(`\n合計労働時間: ${totalHours.toFixed(1)}時間`);

  // 8-11月の月別集計
  console.log('\n\n📊 月別シフト集計 (7-11月)');
  console.log('─'.repeat(60));

  const monthlyStats = await query(`
    SELECT
      EXTRACT(YEAR FROM sh.shift_date) as year,
      EXTRACT(MONTH FROM sh.shift_date) as month,
      COUNT(*) as shift_count,
      SUM(sh.total_hours) as total_hours,
      COUNT(DISTINCT CASE WHEN sh.store_id != staff.store_id THEN sh.shift_date END) as support_count
    FROM ops.shifts sh
    JOIN hr.staff staff ON sh.staff_id = staff.staff_id
    WHERE sh.tenant_id = 3
      AND staff.name = '吉田瑛里'
      AND EXTRACT(YEAR FROM sh.shift_date) = 2025
      AND EXTRACT(MONTH FROM sh.shift_date) BETWEEN 7 AND 11
    GROUP BY EXTRACT(YEAR FROM sh.shift_date), EXTRACT(MONTH FROM sh.shift_date)
    ORDER BY year, month
  `);

  monthlyStats.rows.forEach(stat => {
    console.log(
      `${stat.year}年${stat.month}月: ` +
      `${stat.shift_count}日勤務, ` +
      `${parseFloat(stat.total_hours).toFixed(1)}時間, ` +
      `応援${stat.support_count}日`
    );
  });

  process.exit(0);
})();
