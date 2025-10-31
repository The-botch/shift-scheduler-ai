#!/usr/bin/env node
/**
 * トランザクションテーブルのテストスクリプト
 *
 * 処理フロー:
 * 1. DDL適用（トランザクションテーブル作成）
 * 2. 各テーブルに5件ずつテストデータを投入
 * 3. データを参照して確認
 * 4. 全データを削除
 */

import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

/**
 * 1. DDL適用
 */
async function applyDDL(client) {
  console.log('📄 DDL読み込み中...');
  const ddlPath = path.join(__dirname, 'db/transactions.sql');
  const ddl = await fs.readFile(ddlPath, 'utf-8');

  console.log('🔨 トランザクションテーブル作成中...');
  await client.query(ddl);
  console.log('✅ DDL適用完了\n');
}

/**
 * 2. テストデータ投入（各テーブル5件ずつ）
 */
async function insertTestData(client) {
  console.log('💾 テストデータ投入開始...\n');

  // テナント・店舗・スタッフのIDを取得
  const tenant = await client.query('SELECT tenant_id FROM core.tenants LIMIT 1');
  const store = await client.query('SELECT store_id FROM core.stores LIMIT 1');
  const staff = await client.query('SELECT staff_id FROM hr.staff LIMIT 5');
  const pattern = await client.query('SELECT pattern_id FROM core.shift_patterns LIMIT 1');

  if (tenant.rows.length === 0 || store.rows.length === 0 || staff.rows.length === 0) {
    throw new Error('マスタデータが不足しています。テナント、店舗、スタッフを先に登録してください。');
  }

  const tenant_id = tenant.rows[0].tenant_id;
  const store_id = store.rows[0].store_id;
  const staff_ids = staff.rows.map(r => r.staff_id);
  const pattern_id = pattern.rows[0]?.pattern_id || 1;

  // 1. shift_plans (5件)
  console.log('  [1/13] shift_plans...');
  for (let i = 1; i <= 5; i++) {
    await client.query(`
      INSERT INTO ops.shift_plans (
        tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
        period_start, period_end, status
      ) VALUES ($1, $2, 2025, ${i}, 'PLAN_2025_${i}', '2025年${i}月シフト',
        '2025-${String(i).padStart(2, '0')}-01', '2025-${String(i).padStart(2, '0')}-28', 'DRAFT')
    `, [tenant_id, store_id]);
  }

  // plan_id取得
  const plans = await client.query('SELECT plan_id FROM ops.shift_plans ORDER BY plan_id DESC LIMIT 5');
  const plan_ids = plans.rows.map(r => r.plan_id);

  // 2. shifts (5件)
  console.log('  [2/13] shifts...');
  for (let i = 0; i < 5; i++) {
    await client.query(`
      INSERT INTO ops.shifts (
        tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
        start_time, end_time, break_minutes, total_hours
      ) VALUES ($1, $2, $3, $4, '2025-01-${String(i + 1).padStart(2, '0')}', $5,
        '09:00:00', '17:00:00', 60, 7.0)
    `, [tenant_id, store_id, plan_ids[i], staff_ids[i % staff_ids.length], pattern_id]);
  }

  // 3. shift_preferences (5件)
  console.log('  [3/13] shift_preferences...');
  for (let i = 0; i < 5; i++) {
    await client.query(`
      INSERT INTO ops.shift_preferences (
        tenant_id, store_id, staff_id, staff_name, year, month,
        preferred_days, status
      ) VALUES ($1, $2, $3, 'スタッフ${i + 1}', 2025, 1, '月,水,金', 'PENDING')
    `, [tenant_id, store_id, staff_ids[i % staff_ids.length]]);
  }

  // 4. availability_requests (5件)
  console.log('  [4/13] availability_requests...');
  for (let i = 0; i < 5; i++) {
    await client.query(`
      INSERT INTO ops.availability_requests (
        tenant_id, store_id, staff_id, plan_id, request_date,
        availability, is_processed
      ) VALUES ($1, $2, $3, $4, '2025-01-${String(i + 1).padStart(2, '0')}',
        'AVAILABLE', false)
    `, [tenant_id, store_id, staff_ids[i % staff_ids.length], plan_ids[i]]);
  }

  // 5. shift_issues (5件)
  console.log('  [5/13] shift_issues...');
  for (let i = 0; i < 5; i++) {
    await client.query(`
      INSERT INTO ops.shift_issues (
        tenant_id, store_id, plan_id, shift_date, issue_type, severity,
        description
      ) VALUES ($1, $2, $3, '2025-01-${String(i + 1).padStart(2, '0')}',
        'UNDERSTAFFED', 'MEDIUM', '人手不足の可能性')
    `, [tenant_id, store_id, plan_ids[i]]);
  }

  // issue_id取得
  const issues = await client.query('SELECT issue_id FROM ops.shift_issues ORDER BY issue_id DESC LIMIT 5');
  const issue_ids = issues.rows.map(r => r.issue_id);

  // 6. shift_solutions (5件)
  console.log('  [6/13] shift_solutions...');
  for (let i = 0; i < 5; i++) {
    await client.query(`
      INSERT INTO ops.shift_solutions (
        tenant_id, store_id, issue_id, shift_date, action_type
      ) VALUES ($1, $2, $3, '2025-01-${String(i + 1).padStart(2, '0')}', 'ADD_STAFF')
    `, [tenant_id, store_id, issue_ids[i]]);
  }

  // 7. demand_forecasts (5件)
  console.log('  [7/13] demand_forecasts...');
  for (let i = 0; i < 5; i++) {
    await client.query(`
      INSERT INTO ops.demand_forecasts (
        tenant_id, store_id, forecast_date, hour, predicted_customers,
        predicted_sales, required_staff
      ) VALUES ($1, $2, '2025-01-${String(i + 1).padStart(2, '0')}', 12, 50, 100000, 3)
    `, [tenant_id, store_id]);
  }

  // 8. work_hours_actual (5件)
  console.log('  [8/13] work_hours_actual...');
  for (let i = 0; i < 5; i++) {
    await client.query(`
      INSERT INTO ops.work_hours_actual (
        tenant_id, store_id, year, month, work_date, staff_id, staff_name,
        scheduled_hours, actual_hours
      ) VALUES ($1, $2, 2025, 1, '2025-01-${String(i + 1).padStart(2, '0')}',
        $3, 'スタッフ${i + 1}', 8.0, 8.0)
    `, [tenant_id, store_id, staff_ids[i % staff_ids.length]]);
  }

  // 9. payroll (5件)
  console.log('  [9/13] payroll...');
  for (let i = 0; i < 5; i++) {
    await client.query(`
      INSERT INTO hr.payroll (
        tenant_id, store_id, year, month, staff_id, staff_name,
        work_days, work_hours, base_salary, gross_salary, net_salary,
        payment_status
      ) VALUES ($1, $2, 2025, 1, $3, 'スタッフ${i + 1}',
        20, 160, 250000, 250000, 200000, 'PENDING')
    `, [tenant_id, store_id, staff_ids[i % staff_ids.length]]);
  }

  // 10. sales_actual (5件)
  console.log('  [10/13] sales_actual...');
  for (let i = 0; i < 5; i++) {
    await client.query(`
      INSERT INTO analytics.sales_actual (
        tenant_id, year, month, store_id, actual_sales, daily_average
      ) VALUES ($1, 2025, ${i + 1}, $2, 3000000, 100000)
    `, [tenant_id, store_id]);
  }

  // 11. sales_forecast (5件)
  console.log('  [11/13] sales_forecast...');
  for (let i = 0; i < 5; i++) {
    await client.query(`
      INSERT INTO analytics.sales_forecast (
        tenant_id, year, month, store_id, forecasted_sales,
        required_labor_cost, required_hours
      ) VALUES ($1, 2025, ${i + 1}, $2, 3200000, 800000, 600)
    `, [tenant_id, store_id]);
  }

  // 12. dashboard_metrics (5件)
  console.log('  [12/13] dashboard_metrics...');
  for (let i = 0; i < 5; i++) {
    await client.query(`
      INSERT INTO analytics.dashboard_metrics (
        tenant_id, metric_name, predicted, actual, unit, status
      ) VALUES ($1, 'メトリック${i + 1}', 100, 95, 'percent', 'GOOD')
    `, [tenant_id]);
  }

  console.log('\n✅ テストデータ投入完了（全13テーブル × 5件 = 65件）\n');
}

/**
 * 3. データ参照
 */
async function verifyData(client) {
  console.log('🔍 データ参照中...\n');

  const tables = [
    { schema: 'ops', name: 'shift_plans' },
    { schema: 'ops', name: 'shifts' },
    { schema: 'ops', name: 'shift_preferences' },
    { schema: 'ops', name: 'availability_requests' },
    { schema: 'ops', name: 'shift_issues' },
    { schema: 'ops', name: 'shift_solutions' },
    { schema: 'ops', name: 'demand_forecasts' },
    { schema: 'ops', name: 'work_hours_actual' },
    { schema: 'hr', name: 'payroll' },
    { schema: 'analytics', name: 'sales_actual' },
    { schema: 'analytics', name: 'sales_forecast' },
    { schema: 'analytics', name: 'dashboard_metrics' }
  ];

  for (const table of tables) {
    const result = await client.query(`SELECT COUNT(*) as count FROM ${table.schema}.${table.name}`);
    const count = result.rows[0].count;
    console.log(`  ${table.schema}.${table.name}: ${count}件`);
  }

  console.log('\n✅ 全テーブルのデータ参照完了\n');
}

/**
 * 4. データ削除
 */
async function deleteData(client) {
  console.log('🗑️  テストデータ削除中...\n');

  // 外部キー制約の順序を考慮して削除
  const deleteOrder = [
    'ops.shift_solutions',
    'ops.shift_issues',
    'ops.work_hours_actual',
    'ops.demand_forecasts',
    'ops.availability_requests',
    'ops.shift_preferences',
    'ops.shifts',
    'ops.shift_plans',
    'hr.payroll',
    'analytics.sales_actual',
    'analytics.sales_forecast',
    'analytics.dashboard_metrics'
  ];

  for (const table of deleteOrder) {
    const result = await client.query(`DELETE FROM ${table}`);
    console.log(`  ${table}: ${result.rowCount}件削除`);
  }

  console.log('\n✅ 全テストデータ削除完了\n');
}

/**
 * メイン処理
 */
async function main() {
  const client = await pool.connect();

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 トランザクションテーブルテスト開始');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. DDL適用
    await applyDDL(client);

    // 2. テストデータ投入
    await insertTestData(client);

    // 3. データ参照
    await verifyData(client);

    // 4. データ削除
    await deleteData(client);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 全処理完了！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
