#!/usr/bin/env node
/**
 * Shift.csvのサンプル1件をops.shiftsテーブルに投入するスクリプト
 *
 * 使い方:
 *   node scripts/import_shift_sample.mjs
 *
 * 処理フロー:
 *   1. CSV（シフト.csv）の1行目のデータを読み込む
 *   2. tenant_code → tenant_id を解決
 *   3. store_name → store_id を解決
 *   4. staff_name → staff_id を解決
 *   5. ops.shiftsテーブルに1件INSERT
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

/**
 * 時刻文字列を TIME 型に変換
 * 例: "9:00" → "09:00:00"
 */
function formatTime(timeStr) {
  if (!timeStr || timeStr === '〜') return null;

  const [hours, minutes] = timeStr.split(':');
  return `${hours.padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}:00`;
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
 * tenant_code から tenant_id を取得
 */
async function getTenantId(client, tenant_code) {
  const result = await client.query(
    'SELECT tenant_id FROM core.tenants WHERE tenant_code = $1',
    [tenant_code]
  );

  if (result.rows.length === 0) {
    throw new Error(`テナントが見つかりません: ${tenant_code}`);
  }

  return result.rows[0].tenant_id;
}

/**
 * store_name から store_id を取得
 * 注意: CSVの店舗名とDBの店舗名が異なる場合があるため、
 *      見つからない場合はテナントの最初の店舗を使用
 */
async function getStoreId(client, tenant_id, store_name) {
  // まずCSVの店舗名で検索
  let result = await client.query(
    'SELECT store_id, store_name FROM core.stores WHERE tenant_id = $1 AND store_name = $2',
    [tenant_id, store_name]
  );

  // 見つからない場合はテナントの最初の店舗を使用
  if (result.rows.length === 0) {
    console.log(`   ⚠️  店舗名「${store_name}」が見つかりません。テナントの最初の店舗を使用します。`);
    result = await client.query(
      'SELECT store_id, store_name FROM core.stores WHERE tenant_id = $1 ORDER BY store_id LIMIT 1',
      [tenant_id]
    );
  }

  if (result.rows.length === 0) {
    throw new Error(`店舗が見つかりません: tenant_id ${tenant_id} に店舗が登録されていません`);
  }

  return result.rows[0].store_id;
}

/**
 * staff_name から staff_id を取得
 */
async function getStaffId(client, tenant_id, staff_name) {
  const result = await client.query(
    'SELECT staff_id FROM hr.staff WHERE tenant_id = $1 AND name = $2',
    [tenant_id, staff_name]
  );

  if (result.rows.length === 0) {
    throw new Error(`スタッフが見つかりません: ${staff_name} (tenant_id: ${tenant_id})`);
  }

  return result.rows[0].staff_id;
}

/**
 * pattern_idを取得または作成
 * CSVの勤務時間に一致するパターンを検索、なければ作成
 */
async function getOrCreatePatternId(client, tenant_id, start_time, end_time, break_minutes) {
  // 既存のパターンを検索
  let result = await client.query(
    `SELECT pattern_id FROM core.shift_patterns
     WHERE tenant_id = $1 AND start_time = $2 AND end_time = $3 AND break_minutes = $4`,
    [tenant_id, start_time, end_time, break_minutes]
  );

  if (result.rows.length > 0) {
    return result.rows[0].pattern_id;
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

  console.log(`   🔄 新しいシフトパターンを作成しました (pattern_id: ${result.rows[0].pattern_id})`);
  return result.rows[0].pattern_id;
}

/**
 * plan_idを取得または作成
 * 注意: 実際のops.shiftsテーブルではplan_idが必須
 */
async function getOrCreatePlanId(client, tenant_id, store_id, shift_date) {
  // shift_dateから年月を取得
  const date = new Date(shift_date);
  const plan_year = date.getFullYear();
  const plan_month = date.getMonth() + 1; // 0-11 → 1-12

  // 既存のプランを検索
  let result = await client.query(
    'SELECT plan_id FROM ops.shift_plans WHERE tenant_id = $1 AND store_id = $2 AND plan_year = $3 AND plan_month = $4',
    [tenant_id, store_id, plan_year, plan_month]
  );

  if (result.rows.length > 0) {
    return result.rows[0].plan_id;
  }

  // プランが存在しない場合は作成
  const plan_code = `PLAN_${plan_year}${String(plan_month).padStart(2, '0')}_${store_id}`;
  const plan_name = `${plan_year}年${plan_month}月シフト`;
  const period_start = new Date(plan_year, plan_month - 1, 1); // 月初
  const period_end = new Date(plan_year, plan_month, 0); // 月末

  result = await client.query(
    `INSERT INTO ops.shift_plans (
      tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
      period_start, period_end, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING plan_id`,
    [tenant_id, store_id, plan_year, plan_month, plan_code, plan_name, period_start, period_end, 'DRAFT']
  );

  console.log(`   📋 新しいシフトプランを作成しました (plan_id: ${result.rows[0].plan_id}, ${plan_year}年${plan_month}月)`);
  return result.rows[0].plan_id;
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
    shiftData.pattern_id, // pattern_idは必須
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

    // ヘッダーをスキップして1行目のデータを取得
    if (lines.length < 2) {
      throw new Error('CSVにデータが存在しません');
    }

    const csvRow = parseCSVLine(lines[1]);
    console.log('✅ CSV解析完了');
    console.log('   データ:', csvRow);

    console.log('\n🔍 マスタデータ検索中...');

    // tenant_id を解決
    const tenant_id = await getTenantId(client, csvRow.tenant_code);
    console.log(`   tenant_id: ${tenant_id} (${csvRow.tenant_code})`);

    // store_id を解決
    const store_id = await getStoreId(client, tenant_id, csvRow.store_name);
    console.log(`   store_id: ${store_id} (${csvRow.store_name})`);

    // staff_id を解決
    const staff_id = await getStaffId(client, tenant_id, csvRow.staff_name);
    console.log(`   staff_id: ${staff_id} (${csvRow.staff_name})`);

    // pattern_id を取得または作成
    const pattern_id = await getOrCreatePatternId(
      client,
      tenant_id,
      csvRow.start_time,
      csvRow.end_time,
      csvRow.break_minutes
    );
    console.log(`   pattern_id: ${pattern_id}`);

    // plan_id を取得または作成
    const plan_id = await getOrCreatePlanId(client, tenant_id, store_id, csvRow.shift_date);
    console.log(`   plan_id: ${plan_id}`);

    console.log('\n💾 シフトデータ投入中...');

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

    const shift_id = await insertShift(client, shiftData);

    console.log('✅ シフトデータ投入完了');
    console.log(`   shift_id: ${shift_id}`);
    console.log(`   日付: ${csvRow.shift_date}`);
    console.log(`   スタッフ: ${csvRow.staff_name}`);
    console.log(`   勤務時間: ${csvRow.start_time} - ${csvRow.end_time}`);
    console.log(`   休憩: ${csvRow.break_minutes}分`);

    console.log('\n🎉 処理完了!');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
