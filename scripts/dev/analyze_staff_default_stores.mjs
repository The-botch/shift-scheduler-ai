#!/usr/bin/env node
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || process.env.PGHOST,
  port: process.env.DB_PORT || process.env.PGPORT || 5432,
  database: process.env.DB_NAME || process.env.PGDATABASE,
  user: process.env.DB_USER || process.env.PGUSER,
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD
});

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 スタッフ別デフォルト店舗分析（シフト履歴ベース）');
  console.log('='.repeat(70) + '\n');

  try {
    // 1. データベースから店舗マスタとスタッフマスタを取得
    const storesResult = await pool.query(`
      SELECT store_id, store_code, store_name
      FROM core.stores
      WHERE tenant_id = 3
      ORDER BY store_id
    `);

    const stores = {};
    const storeNameToId = {};
    storesResult.rows.forEach(row => {
      stores[row.store_code] = row.store_id;
      storeNameToId[row.store_name] = row.store_id;
      // COMEのエイリアスを追加
      if (row.store_code === 'COME') {
        storeNameToId['COME'] = row.store_id;
      }
    });

    const staffResult = await pool.query(`
      SELECT staff_id, name, store_id
      FROM hr.staff
      WHERE tenant_id = 3
      ORDER BY staff_id
    `);

    const staffMap = {};
    staffResult.rows.forEach(row => {
      staffMap[row.name] = {
        staff_id: row.staff_id,
        current_store_id: row.store_id
      };
    });

    // 2. シフトCSVを読み込んで店舗別出勤回数を集計
    const shiftCsvPath = path.join(__dirname, '..', '..', 'fixtures', 'shift_pdfs', 'csv_output', 'シフト.csv');

    const staffStoreCount = {}; // { staff_name: { store_name: count } }

    const csvContent = fs.readFileSync(shiftCsvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');

    const staffNameIndex = headers.indexOf('staff_name');
    const storeNameIndex = headers.indexOf('store_name');

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const staffName = values[staffNameIndex];
      const storeName = values[storeNameIndex];

      if (!staffName || !storeName) continue;

      if (!staffStoreCount[staffName]) {
        staffStoreCount[staffName] = {};
      }

      if (!staffStoreCount[staffName][storeName]) {
        staffStoreCount[staffName][storeName] = 0;
      }

      staffStoreCount[staffName][storeName]++;
    }

    // 3. 各スタッフの最頻出店舗を計算
    console.log('スタッフ別デフォルト店舗一覧:\n');
    console.log('┌─────────┬──────────────┬────────┬──────────┬────────────┐');
    console.log('│ Staff ID│ スタッフ名   │ 現在店舗│ 推奨店舗 │ 出勤回数   │');
    console.log('├─────────┼──────────────┼────────┼──────────┼────────────┤');

    const updates = [];

    for (const [staffName, storeCounts] of Object.entries(staffStoreCount)) {
      // 最頻出店舗を見つける
      let maxCount = 0;
      let mostFrequentStore = null;

      for (const [storeName, count] of Object.entries(storeCounts)) {
        if (count > maxCount) {
          maxCount = count;
          mostFrequentStore = storeName;
        }
      }

      const staffInfo = staffMap[staffName];
      if (!staffInfo) {
        console.log(`⚠️  スタッフ「${staffName}」がマスタに存在しません`);
        continue;
      }

      const recommendedStoreId = storeNameToId[mostFrequentStore];
      const currentStoreId = staffInfo.current_store_id;

      // 現在の店舗名を取得
      const currentStoreName = Object.keys(storeNameToId).find(
        name => storeNameToId[name] === currentStoreId
      ) || '不明';

      const needsUpdate = currentStoreId !== recommendedStoreId;

      console.log(
        `│ ${String(staffInfo.staff_id).padEnd(7)} │ ${staffName.padEnd(12)} │ ${currentStoreName.padEnd(6)} │ ${mostFrequentStore.padEnd(8)} │ ${String(maxCount).padStart(4)}回${needsUpdate ? ' ⚠️ ' : '    '}│`
      );

      if (needsUpdate) {
        updates.push({
          staff_id: staffInfo.staff_id,
          staff_name: staffName,
          current_store_id: currentStoreId,
          current_store_name: currentStoreName,
          recommended_store_id: recommendedStoreId,
          recommended_store_name: mostFrequentStore,
          shift_count: maxCount
        });
      }
    }

    console.log('└─────────┴──────────────┴────────┴──────────┴────────────┘\n');

    // 4. 更新が必要なレコードをまとめて表示
    if (updates.length > 0) {
      console.log('='.repeat(70));
      console.log(`🔄 更新が必要なスタッフ: ${updates.length}名\n`);

      updates.forEach(u => {
        console.log(`  • ${u.staff_name} (ID: ${u.staff_id})`);
        console.log(`    ${u.current_store_name} (現在) → ${u.recommended_store_name} (推奨: ${u.shift_count}回出勤)\n`);
      });

      console.log('='.repeat(70) + '\n');
    } else {
      console.log('✅ 全スタッフのデフォルト店舗が正しく設定されています\n');
    }

  } catch (err) {
    console.error('❌ エラー:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
