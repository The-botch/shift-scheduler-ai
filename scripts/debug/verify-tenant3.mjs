import { query } from './src/config/database.js';

async function check() {
  console.log('='.repeat(70));
  console.log('テナント3データ確認');
  console.log('='.repeat(70));

  // スタッフ確認
  const staff = await query(`
    SELECT
      s.name,
      s.employment_type,
      s.is_active,
      s.monthly_salary,
      s.hourly_rate,
      st.store_name,
      r.role_name
    FROM hr.staff s
    JOIN core.stores st ON s.store_id = st.store_id
    JOIN core.roles r ON s.role_id = r.role_id
    WHERE s.tenant_id = 3
    ORDER BY s.staff_id
    LIMIT 10
  `);

  console.log('\nスタッフサンプル（10名）:');
  staff.rows.forEach(row => {
    const salary = row.employment_type === 'FULL_TIME'
      ? `月給¥${row.monthly_salary?.toLocaleString() || 'N/A'}`
      : `時給¥${row.hourly_rate || 'N/A'}`;
    console.log(`  ${row.name} (${row.role_name}) - ${row.employment_type} - ${salary} - ${row.store_name}`);
  });

  // 集計
  const summary = await query(`
    SELECT
      employment_type,
      COUNT(*) as count,
      SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active
    FROM hr.staff
    WHERE tenant_id = 3
    GROUP BY employment_type
  `);

  console.log('\nスタッフ集計:');
  summary.rows.forEach(row => {
    console.log(`  ${row.employment_type}: ${row.count}名 (在籍: ${row.active}名)`);
  });

  // シフト確認
  const shifts = await query(`
    SELECT COUNT(*) as total FROM ops.shifts WHERE tenant_id = 3
  `);

  console.log(`\nシフト実績: ${shifts.rows[0].total}件`);

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
