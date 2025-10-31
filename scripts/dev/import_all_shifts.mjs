#!/usr/bin/env node
/**
 * Shift.csvの全データをops.shiftsテーブルに投入するスクリプト
 *
 * 使い方:
 *   DATABASE_URL="..." node scripts/import_all_shifts.mjs
 *
 * 処理フロー:
 *   1. CSV（シフト.csv）の全行を読み込む
 *   2. 各行について、tenant_code → tenant_id、store_name → store_id、staff_name → staff_id を解決
 *   3. pattern_idとplan_idを取得または作成
 *   4. ops.shiftsテーブルに一括INSERT
 */

import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// データベース接続
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

// キャッシュ（同じ検索を繰り返さないため）
const cache = {
  tenants: new Map(),      // tenant_code → tenant_id
  stores: new Map(),       // `${tenant_id}_${store_name}` → store_id
  staff: new Map(),        // `${tenant_id}_${staff_name}` → staff_id
  patterns: new Map(),     // `${tenant_id}_${start}_${end}_${break}` → pattern_id
  plans: new Map()         // `${tenant_id}_${store_id}_${year}_${month}` → plan_id
};

/**
 * 時刻文字列を TIME 型に変換
 * 例: "9:00" → "09:00:00"
 * 注意: 24時以降（26:00など）は24で割った余りに変換（26:00 → 02:00:00）
 */
function formatTime(timeStr) {
  if (!timeStr || timeStr === '〜') return null;

  let [hours, minutes] = timeStr.split(':');
  hours = parseInt(hours);

  // 24時以降の時刻は24で割った余りに変換
  if (hours >= 24) {
    hours = hours % 24;
  }

  return `${String(hours).padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}:00`;
}

/**
 * CSVの1行をパースしてオブジェクトに変換
 */
function parseCSVLine(line) {
  const values = line.split(',');
  return {
    tenant_code: values[0],
    store_name: values[1],
    plan_year: values[2],
    plan_month: values[3],
    shift_date: values[4],
    staff_name: values[5],
    employment_type: values[6],
    work_location: values[7],
    start_time: formatTime(values[8]),
    end_time: formatTime(values[9]),
    break_minutes: parseInt(values[10]) || 0,
    notes: values[11] || ''
  };
}

/**
 * tenant_code から tenant_id を取得（キャッシュ付き）
 */
async function getTenantId(client, tenant_code) {
  if (cache.tenants.has(tenant_code)) {
    return cache.tenants.get(tenant_code);
  }

  const result = await client.query(
    'SELECT tenant_id FROM core.tenants WHERE tenant_code = $1',
    [tenant_code]
  );

  if (result.rows.length === 0) {
    throw new Error(`テナントが見つかりません: ${tenant_code}`);
  }

  const tenant_id = result.rows[0].tenant_id;
  cache.tenants.set(tenant_code, tenant_id);
  return tenant_id;
}

/**
 * store_name から store_id を取得（キャッシュ付き）
 */
async function getStoreId(client, tenant_id, store_name) {
  const cacheKey = `${tenant_id}_${store_name}`;
  if (cache.stores.has(cacheKey)) {
    return cache.stores.get(cacheKey);
  }

  // まずCSVの店舗名で検索
  let result = await client.query(
    'SELECT store_id FROM core.stores WHERE tenant_id = $1 AND store_name = $2',
    [tenant_id, store_name]
  );

  // 見つからない場合はテナントの最初の店舗を使用
  if (result.rows.length === 0) {
    result = await client.query(
      'SELECT store_id FROM core.stores WHERE tenant_id = $1 ORDER BY store_id LIMIT 1',
      [tenant_id]
    );
  }

  if (result.rows.length === 0) {
    throw new Error(`店舗が見つかりません: tenant_id ${tenant_id} に店舗が登録されていません`);
  }

  const store_id = result.rows[0].store_id;
  cache.stores.set(cacheKey, store_id);
  return store_id;
}

/**
 * staff_name から staff_id を取得（キャッシュ付き）
 */
async function getStaffId(client, tenant_id, staff_name) {
  const cacheKey = `${tenant_id}_${staff_name}`;
  if (cache.staff.has(cacheKey)) {
    return cache.staff.get(cacheKey);
  }

  const result = await client.query(
    'SELECT staff_id FROM hr.staff WHERE tenant_id = $1 AND name = $2',
    [tenant_id, staff_name]
  );

  if (result.rows.length === 0) {
    throw new Error(`スタッフが見つかりません: ${staff_name} (tenant_id: ${tenant_id})`);
  }

  const staff_id = result.rows[0].staff_id;
  cache.staff.set(cacheKey, staff_id);
  return staff_id;
}

/**
 * pattern_idを取得または作成（キャッシュ付き）
 * 注意: end_time <= start_time の場合（夜勤）、デフォルトパターンを使用
 */
async function getOrCreatePatternId(client, tenant_id, start_time, end_time, break_minutes) {
  const cacheKey = `${tenant_id}_${start_time}_${end_time}_${break_minutes}`;
  if (cache.patterns.has(cacheKey)) {
    return cache.patterns.get(cacheKey);
  }

  // 既存のパターンを検索
  let result = await client.query(
    `SELECT pattern_id FROM core.shift_patterns
     WHERE tenant_id = $1 AND start_time = $2 AND end_time = $3 AND break_minutes = $4`,
    [tenant_id, start_time, end_time, break_minutes]
  );

  if (result.rows.length > 0) {
    const pattern_id = result.rows[0].pattern_id;
    cache.patterns.set(cacheKey, pattern_id);
    return pattern_id;
  }

  // end_time <= start_time の場合（夜勤）は、制約違反を避けるためデフォルトパターンを使用
  if (end_time <= start_time) {
    // デフォルトパターン（9:00-17:00）を検索
    result = await client.query(
      `SELECT pattern_id FROM core.shift_patterns
       WHERE tenant_id = $1 AND start_time = '09:00:00' AND end_time = '17:00:00'
       LIMIT 1`,
      [tenant_id]
    );

    if (result.rows.length > 0) {
      const pattern_id = result.rows[0].pattern_id;
      cache.patterns.set(cacheKey, pattern_id);
      return pattern_id;
    }

    // デフォルトパターンも存在しない場合は作成
    const default_pattern_code = 'PATTERN_DEFAULT';
    const default_pattern_name = 'デフォルト (9:00-17:00)';

    result = await client.query(
      `INSERT INTO core.shift_patterns (tenant_id, pattern_code, pattern_name, start_time, end_time, break_minutes, is_active)
       VALUES ($1, $2, $3, '09:00:00', '17:00:00', 60, TRUE)
       ON CONFLICT (tenant_id, pattern_code) DO UPDATE SET pattern_code = EXCLUDED.pattern_code
       RETURNING pattern_id`,
      [tenant_id, default_pattern_code, default_pattern_name]
    );

    const pattern_id = result.rows[0].pattern_id;
    cache.patterns.set(cacheKey, pattern_id);
    return pattern_id;
  }

  // パターンが存在しない場合は作成
  const pattern_code = `PATTERN_${start_time.replace(/:/g, '')}_${end_time.replace(/:/g, '')}`;
  const pattern_name = `${start_time}-${end_time} (休憩${break_minutes}分)`;

  result = await client.query(
    `INSERT INTO core.shift_patterns (tenant_id, pattern_code, pattern_name, start_time, end_time, break_minutes, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING pattern_id`,
    [tenant_id, pattern_code, pattern_name, start_time, end_time, break_minutes]
  );

  const pattern_id = result.rows[0].pattern_id;
  cache.patterns.set(cacheKey, pattern_id);
  return pattern_id;
}

/**
 * plan_idを取得または作成（キャッシュ付き）
 */
async function getOrCreatePlanId(client, tenant_id, store_id, shift_date) {
  const date = new Date(shift_date);
  const plan_year = date.getFullYear();
  const plan_month = date.getMonth() + 1;

  const cacheKey = `${tenant_id}_${store_id}_${plan_year}_${plan_month}`;
  if (cache.plans.has(cacheKey)) {
    return cache.plans.get(cacheKey);
  }

  // 既存のプランを検索
  let result = await client.query(
    'SELECT plan_id FROM ops.shift_plans WHERE tenant_id = $1 AND store_id = $2 AND plan_year = $3 AND plan_month = $4',
    [tenant_id, store_id, plan_year, plan_month]
  );

  if (result.rows.length > 0) {
    const plan_id = result.rows[0].plan_id;
    cache.plans.set(cacheKey, plan_id);
    return plan_id;
  }

  // プランが存在しない場合は作成
  const plan_code = `PLAN_${plan_year}${String(plan_month).padStart(2, '0')}_${store_id}`;
  const plan_name = `${plan_year}年${plan_month}月シフト`;
  const period_start = new Date(plan_year, plan_month - 1, 1);
  const period_end = new Date(plan_year, plan_month, 0);

  result = await client.query(
    `INSERT INTO ops.shift_plans (
      tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
      period_start, period_end, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING plan_id`,
    [tenant_id, store_id, plan_year, plan_month, plan_code, plan_name, period_start, period_end, 'DRAFT']
  );

  const plan_id = result.rows[0].plan_id;
  cache.plans.set(cacheKey, plan_id);
  return plan_id;
}

/**
 * シフトデータを1件挿入
 */
async function insertShift(client, shiftData) {
  const query = `
    INSERT INTO ops.shifts (
      tenant_id,
      plan_id,
      staff_id,
      shift_date,
      pattern_id,
      start_time,
      end_time,
      break_minutes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING shift_id
  `;

  const values = [
    shiftData.tenant_id,
    shiftData.plan_id,
    shiftData.staff_id,
    shiftData.shift_date,
    shiftData.pattern_id,
    shiftData.start_time,
    shiftData.end_time,
    shiftData.break_minutes
  ];

  const result = await client.query(query, values);
  return result.rows[0].shift_id;
}

/**
 * メイン処理
 */
async function main() {
  const client = await pool.connect();

  try {
    console.log('📁 CSVファイル読み込み中...');

    // CSVファイルのパス
    const csvPath = path.join(__dirname, '../fixtures/shift_pdfs/csv_output/シフト.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    console.log(`✅ CSV読み込み完了: ${lines.length - 1}行のデータ（ヘッダー除く）`);

    // トランザクション開始
    await client.query('BEGIN');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log('\n💾 シフトデータ投入開始...\n');

    // ヘッダーをスキップして各行を処理
    for (let i = 1; i < lines.length; i++) {
      try {
        const csvRow = parseCSVLine(lines[i]);

        // 空行や不正なデータをスキップ
        if (!csvRow.tenant_code || !csvRow.staff_name || !csvRow.shift_date) {
          continue;
        }

        // tenant_id を解決
        const tenant_id = await getTenantId(client, csvRow.tenant_code);

        // store_id を解決
        const store_id = await getStoreId(client, tenant_id, csvRow.store_name);

        // staff_id を解決
        const staff_id = await getStaffId(client, tenant_id, csvRow.staff_name);

        // pattern_id を取得または作成
        const pattern_id = await getOrCreatePatternId(
          client,
          tenant_id,
          csvRow.start_time,
          csvRow.end_time,
          csvRow.break_minutes
        );

        // plan_id を取得または作成
        const plan_id = await getOrCreatePlanId(client, tenant_id, store_id, csvRow.shift_date);

        // シフトデータ投入
        const shiftData = {
          tenant_id,
          plan_id,
          pattern_id,
          staff_id,
          shift_date: csvRow.shift_date,
          start_time: csvRow.start_time,
          end_time: csvRow.end_time,
          break_minutes: csvRow.break_minutes
        };

        await insertShift(client, shiftData);
        successCount++;

        // 100件ごとに進捗表示
        if (successCount % 100 === 0) {
          console.log(`   処理済み: ${successCount}件...`);
        }

      } catch (error) {
        errorCount++;
        errors.push({
          line: i + 1,
          data: lines[i],
          error: error.message
        });

        // 最初の5件のエラーはすぐに表示
        if (errorCount <= 5) {
          console.error(`   ⚠️  行${i + 1}でエラー: ${error.message}`);
        }

        // エラーが多すぎる場合は中断
        if (errorCount > 100) {
          console.error(`\n❌ エラーが100件を超えました。最初の10件のエラー:`);
          errors.slice(0, 10).forEach(err => {
            console.error(`   行${err.line}: ${err.error}`);
            console.error(`   データ: ${err.data.substring(0, 100)}...`);
          });
          throw new Error('エラーが100件を超えたため処理を中断しました');
        }
      }
    }

    // トランザクションコミット
    await client.query('COMMIT');

    console.log('\n✅ シフトデータ投入完了');
    console.log(`   成功: ${successCount}件`);
    console.log(`   失敗: ${errorCount}件`);

    if (errors.length > 0) {
      console.log('\n⚠️  エラー詳細（最大10件表示）:');
      errors.slice(0, 10).forEach(err => {
        console.log(`   行${err.line}: ${err.error}`);
      });
    }

    console.log('\n📊 キャッシュ統計:');
    console.log(`   テナント: ${cache.tenants.size}件`);
    console.log(`   店舗: ${cache.stores.size}件`);
    console.log(`   スタッフ: ${cache.staff.size}件`);
    console.log(`   パターン: ${cache.patterns.size}件`);
    console.log(`   プラン: ${cache.plans.size}件`);

    console.log('\n🎉 処理完了!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ エラーが発生しました:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
