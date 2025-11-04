#!/usr/bin/env node

/**
 * シフトデータを分析して、各スタッフの主要勤務店舗を特定する
 */

import pg from 'pg';

const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway';

async function analyzeStaffStores() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 データベースへ接続中...\n');
    await client.connect();
    console.log('✅ 接続成功！\n');

    // スタッフごとの店舗別シフト数を集計
    const result = await client.query(`
      SELECT
        s.staff_id,
        s.staff_code,
        s.name,
        s.store_id as current_store_id,
        st_current.store_name as current_store_name,
        shift_store.store_id as shift_store_id,
        shift_store.store_name as shift_store_name,
        COUNT(sh.shift_id) as shift_count
      FROM hr.staff s
      LEFT JOIN core.stores st_current ON s.store_id = st_current.store_id
      LEFT JOIN ops.shifts sh ON s.staff_id = sh.staff_id
      LEFT JOIN ops.shift_plans sp ON sh.plan_id = sp.plan_id
      LEFT JOIN core.stores shift_store ON sp.store_id = shift_store.store_id
      WHERE s.tenant_id = 3 AND s.is_active = TRUE
      GROUP BY s.staff_id, s.staff_code, s.name, s.store_id, st_current.store_name,
               shift_store.store_id, shift_store.store_name
      ORDER BY s.staff_id, shift_count DESC
    `);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 スタッフごとの勤務店舗分析');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // スタッフごとに最も多く勤務している店舗を特定
    const staffStoreMap = new Map();

    for (const row of result.rows) {
      if (!staffStoreMap.has(row.staff_id)) {
        staffStoreMap.set(row.staff_id, {
          staff_id: row.staff_id,
          staff_code: row.staff_code,
          name: row.name,
          current_store_id: row.current_store_id,
          current_store_name: row.current_store_name,
          recommended_store_id: row.shift_store_id,
          recommended_store_name: row.shift_store_name,
          shift_count: row.shift_count,
          all_stores: []
        });
      }

      const staff = staffStoreMap.get(row.staff_id);
      if (row.shift_store_id) {
        staff.all_stores.push({
          store_id: row.shift_store_id,
          store_name: row.shift_store_name,
          shift_count: row.shift_count
        });
      }
    }

    // 結果を表示
    let needsUpdate = 0;
    const updates = [];

    console.log('スタッフID | スタッフコード | 氏名         | 現在の店舗 | 推奨店舗   | シフト数 | 要更新');
    console.log('---------- | -------------- | ------------ | ---------- | ---------- | -------- | ------');

    for (const [staffId, staff] of staffStoreMap) {
      const needUpdate = staff.current_store_id !== staff.recommended_store_id ? '⚠️ YES' : '✅ OK';
      if (staff.current_store_id !== staff.recommended_store_id) {
        needsUpdate++;
        updates.push({
          staff_id: staff.staff_id,
          staff_code: staff.staff_code,
          name: staff.name,
          from_store_id: staff.current_store_id,
          to_store_id: staff.recommended_store_id,
          to_store_name: staff.recommended_store_name
        });
      }

      console.log(
        `${String(staff.staff_id).padEnd(10)} | ` +
        `${String(staff.staff_code).padEnd(14)} | ` +
        `${String(staff.name).padEnd(12)} | ` +
        `${String(staff.current_store_name || 'なし').padEnd(10)} | ` +
        `${String(staff.recommended_store_name || 'なし').padEnd(10)} | ` +
        `${String(staff.shift_count).padEnd(8)} | ` +
        `${needUpdate}`
      );

      // 複数店舗で勤務している場合は詳細を表示
      if (staff.all_stores.length > 1) {
        console.log(`           └─ 勤務店舗: ${staff.all_stores.map(s => `${s.store_name}(${s.shift_count}件)`).join(', ')}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📌 サマリー`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`総スタッフ数: ${staffStoreMap.size}名`);
    console.log(`更新が必要: ${needsUpdate}名`);
    console.log(`問題なし: ${staffStoreMap.size - needsUpdate}名\n`);

    if (updates.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 推奨される更新内容');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      for (const update of updates) {
        console.log(`UPDATE hr.staff SET store_id = ${update.to_store_id} WHERE staff_id = ${update.staff_id}; -- ${update.name} → ${update.to_store_name}`);
      }
      console.log('');
    }

    // 店舗一覧を表示
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏪 店舗一覧');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const stores = await client.query(`
      SELECT store_id, store_code, store_name
      FROM core.stores
      WHERE tenant_id = 3 AND is_active = TRUE
      ORDER BY store_id
    `);

    for (const store of stores.rows) {
      console.log(`${store.store_id}: ${store.store_code} - ${store.store_name}`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await client.end();
  }
}

analyzeStaffStores();
