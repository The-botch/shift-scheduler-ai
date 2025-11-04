#!/usr/bin/env node

import pg from 'pg';

const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway';

async function checkKitamura() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT
        s.staff_id,
        s.staff_code,
        s.name,
        s.store_id as current_store_id,
        st.store_name as current_store_name,
        s.email,
        s.phone_number,
        s.hire_date,
        s.employment_type
      FROM hr.staff s
      LEFT JOIN core.stores st ON s.store_id = st.store_id
      WHERE s.tenant_id = 3
        AND (s.name LIKE '%北村%' OR s.name LIKE '%きたむら%')
      ORDER BY s.staff_id
    `);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 北村さんの基本情報');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (result.rows.length === 0) {
      console.log('該当するスタッフが見つかりませんでした。');
      return;
    }

    for (const staff of result.rows) {
      console.log(`スタッフID: ${staff.staff_id}`);
      console.log(`スタッフコード: ${staff.staff_code}`);
      console.log(`氏名: ${staff.name}`);
      console.log(`現在のデフォルト店舗: ${staff.current_store_name} (ID: ${staff.current_store_id})`);
      console.log(`メール: ${staff.email || 'なし'}`);
      console.log(`電話: ${staff.phone_number || 'なし'}`);
      console.log(`入社日: ${staff.hire_date || 'なし'}`);
      console.log(`雇用形態: ${staff.employment_type || 'なし'}`);

      // シフト情報を取得
      const shifts = await client.query(`
        SELECT
          sp.store_id,
          st.store_name,
          COUNT(*) as shift_count,
          MIN(sh.shift_date) as first_shift,
          MAX(sh.shift_date) as last_shift
        FROM ops.shifts sh
        JOIN ops.shift_plans sp ON sh.plan_id = sp.plan_id
        JOIN core.stores st ON sp.store_id = st.store_id
        WHERE sh.staff_id = $1
        GROUP BY sp.store_id, st.store_name
        ORDER BY shift_count DESC
      `, [staff.staff_id]);

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📅 シフト履歴（店舗別）');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      let totalShifts = 0;
      for (const shift of shifts.rows) {
        console.log(`【${shift.store_name}】`);
        console.log(`  シフト数: ${shift.shift_count}件`);
        console.log(`  期間: ${shift.first_shift} 〜 ${shift.last_shift}`);
        console.log('');
        totalShifts += parseInt(shift.shift_count);
      }

      console.log(`総シフト数: ${totalShifts}件`);

      if (shifts.rows.length > 0) {
        const mainStore = shifts.rows[0];
        console.log(`\n💡 推奨デフォルト店舗: ${mainStore.store_name} (ID: ${mainStore.store_id})`);

        if (staff.current_store_id !== mainStore.store_id) {
          console.log(`\n⚠️  現在のデフォルト店舗と異なります！`);
          console.log(`   現在: ${staff.current_store_name} (ID: ${staff.current_store_id})`);
          console.log(`   推奨: ${mainStore.store_name} (ID: ${mainStore.store_id})`);
        } else {
          console.log(`\n✅ デフォルト店舗は正しく設定されています。`);
        }
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await client.end();
  }
}

checkKitamura();
