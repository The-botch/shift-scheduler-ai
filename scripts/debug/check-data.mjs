import { query } from './src/config/database.js';

(async () => {
  console.log('=== スタッフと店舗の確認 ===\n');

  // 全店舗を確認
  const stores = await query(`
    SELECT store_id, store_code, store_name
    FROM core.stores
    WHERE tenant_id = 3
    ORDER BY store_id
  `);
  console.log('店舗一覧:');
  stores.rows.forEach(s => console.log(`  ${s.store_id}: ${s.store_code} (${s.store_name})`));

  // 店舗別スタッフ数
  const staffByStore = await query(`
    SELECT s.store_name, COUNT(*) as count
    FROM hr.staff staff
    JOIN core.stores s ON staff.store_id = s.store_id
    WHERE staff.tenant_id = 3
    GROUP BY s.store_name
    ORDER BY s.store_name
  `);
  console.log('\n店舗別スタッフ数:');
  staffByStore.rows.forEach(s => console.log(`  ${s.store_name}: ${s.count}名`));

  // アトリエのスタッフを確認
  const atelierStaff = await query(`
    SELECT staff.name, staff.store_id, s.store_name
    FROM hr.staff staff
    JOIN core.stores s ON staff.store_id = s.store_id
    WHERE staff.tenant_id = 3
      AND s.store_code = 'ATELIER'
    LIMIT 10
  `);
  console.log('\nAtelierスタッフ:');
  atelierStaff.rows.forEach(s => console.log(`  ${s.name} (store_id: ${s.store_id})`));

  // 7月のシフト計画を確認
  const plans = await query(`
    SELECT sp.plan_id, sp.store_id, s.store_name, sp.status, sp.plan_type,
           (SELECT COUNT(*) FROM ops.shifts WHERE plan_id = sp.plan_id) as shift_count
    FROM ops.shift_plans sp
    JOIN core.stores s ON sp.store_id = s.store_id
    WHERE sp.tenant_id = 3
      AND sp.plan_year = 2025
      AND sp.plan_month = 7
    ORDER BY s.store_name
  `);
  console.log('\n7月のシフト計画:');
  plans.rows.forEach(p => console.log(`  ${p.store_name}: plan_id=${p.plan_id}, shifts=${p.shift_count}, status=${p.status}, type=${p.plan_type}`));

  process.exit(0);
})();
