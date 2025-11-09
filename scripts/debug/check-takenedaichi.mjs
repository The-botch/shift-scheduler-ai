import { query } from './src/config/database.js';

(async () => {
  console.log('=== 竹根大地さんのシフトデータ確認 ===\n');

  // スタッフ情報取得
  const staff = await query(`
    SELECT staff_id, name, store_id
    FROM hr.staff
    WHERE tenant_id = 3 AND name LIKE '%竹根%'
  `);

  if (staff.rows.length === 0) {
    console.log('❌ 竹根さんが見つかりません');
    process.exit(0);
  }

  const staffInfo = staff.rows[0];
  console.log(`スタッフ情報: ${staffInfo.name} (staff_id: ${staffInfo.staff_id}, store_id: ${staffInfo.store_id})`);

  // 7月のシフト取得
  console.log('\n📅 7月のシフト:');
  console.log('─'.repeat(100));

  const shifts = await query(`
    SELECT
      sh.shift_date,
      s.store_name,
      sh.start_time,
      sh.end_time,
      sh.break_minutes,
      sh.total_hours
    FROM ops.shifts sh
    JOIN core.stores s ON sh.store_id = s.store_id
    WHERE sh.tenant_id = 3
      AND sh.staff_id = $1
      AND EXTRACT(YEAR FROM sh.shift_date) = 2025
      AND EXTRACT(MONTH FROM sh.shift_date) = 7
    ORDER BY sh.shift_date
  `, [staffInfo.staff_id]);

  if (shifts.rows.length === 0) {
    console.log('シフトデータがありません');
  } else {
    shifts.rows.forEach(shift => {
      const date = shift.shift_date.toISOString().split('T')[0];
      console.log(
        `${date} | ${shift.store_name.padEnd(20)} | ` +
        `${shift.start_time.substring(0,5)}-${shift.end_time.substring(0,5)} | ` +
        `休憩${shift.break_minutes}分 | ${shift.total_hours}h`
      );
    });
    console.log(`\n総件数: ${shifts.rows.length}件`);
  }

  // 最初のシフト日を確認
  if (shifts.rows.length > 0) {
    const firstDate = shifts.rows[0].shift_date.toISOString().split('T')[0];
    console.log(`\n⚠️  最初のシフト日: ${firstDate}`);
    console.log('📋 CSV上の最初のシフト日: 2025-07-03 (期待値)');

    if (firstDate !== '2025-07-03') {
      console.log(`\n❌ 日付のずれを検出！データベース: ${firstDate} vs CSV: 2025-07-03`);
    } else {
      console.log('\n✅ 日付は正しく登録されています');
    }
  }

  process.exit(0);
})();
