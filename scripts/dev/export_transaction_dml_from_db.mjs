#!/usr/bin/env node
/**
 * データベースから直接トランザクションデータを取得してDMLファイル(.sql)を生成
 */

import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .envファイルから DATABASE_URL を読み込む
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '../../.env');
  const envContent = await fs.readFile(envPath, 'utf-8');
  const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
  if (dbUrlMatch) process.env.DATABASE_URL = dbUrlMatch[1].trim();
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

/**
 * SQL文字列をエスケープ
 */
function escapeSql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return value;
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * テーブルからデータを取得してINSERT文を生成
 */
async function generateInserts(client, tableName, columns) {
  const result = await client.query(`SELECT * FROM ${tableName} ORDER BY 1`);

  if (result.rows.length === 0) {
    return `-- ${tableName}: データなし\n\n`;
  }

  let sql = `-- ${tableName} (${result.rows.length}件)\n`;

  for (const row of result.rows) {
    const values = columns.map(col => escapeSql(row[col])).join(', ');
    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
  }

  sql += '\n';
  return sql;
}

async function main() {
  const client = await pool.connect();

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 データベースからトランザクションDMLを生成');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let sql = `-- ============================================
-- トランザクションデータシードスクリプト
-- データベースから自動生成
-- schema.sql と seed_data.sql 実行後にこのスクリプトを実行
-- ============================================

BEGIN;

`;

    // 1. shift_plans
    console.log('1️⃣  shift_plans をエクスポート中...');
    sql += await generateInserts(client, 'ops.shift_plans', [
      'tenant_id', 'store_id', 'plan_year', 'plan_month', 'plan_code', 'plan_name',
      'period_start', 'period_end', 'status', 'generation_type', 'ai_model_version',
      'total_labor_hours', 'total_labor_cost', 'coverage_score', 'constraint_violations'
    ]);

    // 2. demand_forecasts
    console.log('2️⃣  demand_forecasts をエクスポート中...');
    sql += await generateInserts(client, 'ops.demand_forecasts', [
      'tenant_id', 'store_id', 'forecast_date', 'hour', 'predicted_customers',
      'predicted_sales', 'required_staff', 'required_skills', 'confidence_score'
    ]);

    // 3. shift_preferences
    console.log('3️⃣  shift_preferences をエクスポート中...');
    sql += await generateInserts(client, 'ops.shift_preferences', [
      'tenant_id', 'store_id', 'staff_id', 'year', 'month',
      'preferred_days', 'ng_days', 'status', 'submitted_at'
    ]);

    // 4. availability_requests
    console.log('4️⃣  availability_requests をエクスポート中...');
    sql += await generateInserts(client, 'ops.availability_requests', [
      'tenant_id', 'store_id', 'staff_id', 'plan_id', 'request_date',
      'availability', 'preferred_pattern', 'comments', 'submitted_at', 'is_processed'
    ]);

    // 5. shifts
    console.log('5️⃣  shifts をエクスポート中（大量データ）...');
    sql += await generateInserts(client, 'ops.shifts', [
      'tenant_id', 'store_id', 'plan_id', 'staff_id', 'shift_date',
      'pattern_id', 'start_time', 'end_time', 'break_minutes'
    ]);

    // 6. work_hours_actual
    console.log('6️⃣  work_hours_actual をエクスポート中...');
    sql += await generateInserts(client, 'ops.work_hours_actual', [
      'tenant_id', 'store_id', 'year', 'month', 'work_date', 'staff_id',
      'scheduled_start', 'scheduled_end', 'actual_start', 'actual_end',
      'scheduled_hours', 'actual_hours', 'break_minutes', 'overtime_minutes',
      'is_late', 'is_early_leave'
    ]);

    // 7. payroll
    console.log('7️⃣  payroll をエクスポート中...');
    sql += await generateInserts(client, 'hr.payroll', [
      'tenant_id', 'store_id', 'year', 'month', 'staff_id', 'work_days', 'work_hours',
      'base_salary', 'overtime_pay', 'commute_allowance', 'other_allowances',
      'gross_salary', 'health_insurance', 'pension_insurance', 'employment_insurance',
      'income_tax', 'resident_tax', 'total_deduction', 'net_salary',
      'payment_date', 'payment_status'
    ]);

    // 8. sales_actual
    console.log('8️⃣  sales_actual をエクスポート中...');
    sql += await generateInserts(client, 'analytics.sales_actual', [
      'tenant_id', 'year', 'month', 'store_id', 'actual_sales', 'daily_average', 'notes'
    ]);

    // 9. sales_forecast
    console.log('9️⃣  sales_forecast をエクスポート中...');
    sql += await generateInserts(client, 'analytics.sales_forecast', [
      'tenant_id', 'year', 'month', 'store_id', 'forecasted_sales',
      'required_labor_cost', 'required_hours', 'notes'
    ]);

    // 10. dashboard_metrics
    console.log('🔟 dashboard_metrics をエクスポート中...');
    sql += await generateInserts(client, 'analytics.dashboard_metrics', [
      'tenant_id', 'metric_name', 'predicted', 'actual', 'unit', 'status'
    ]);

    sql += `COMMIT;

-- ============================================
-- トランザクションデータ投入完了
-- ============================================
`;

    // ファイルに書き込み
    const outputPath = path.join(__dirname, '../setup/seed_transaction_data.sql');
    await fs.writeFile(outputPath, sql);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 DMLファイル生成完了！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📄 出力ファイル: ${outputPath}`);
    console.log(`📊 総行数: ${sql.split('\n').length}行\n`);

  } catch (error) {
    console.error('\n❌ エラーが発生しました:\n');
    console.error(error.message);
    console.error('\n詳細:');
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
