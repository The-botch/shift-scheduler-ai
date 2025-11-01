#!/usr/bin/env node

/**
 * テナントID=3用のテストデータ一括セットアップスクリプト
 *
 * このスクリプトは以下を一括で登録・削除します:
 *
 * 【マスターデータ】
 * - テナント情報 (core.tenants) - "Stand Banh Mi"
 * - 店舗マスタ (core.stores) - 5店舗
 * - 雇用形態マスタ (core.employment_types) - FULL_TIME, PART_TIME
 * - 役職マスタ (core.roles) - 一般スタッフ, 社員, トライアル
 * - シフトパターンマスタ (core.shift_patterns) - 早番、中番、遅番など
 * - スタッフマスタ (hr.staff) - 51名（シフトCSVから抽出）
 *
 * 【トランザクションテーブル】
 * - ops.shift_plans
 * - ops.shifts
 * - hr.payroll
 * - analytics.sales_actual
 * - analytics.demand_forecasts
 * - hr.work_hours_actual
 * - ops.shift_preferences
 * - ops.availability_requests
 *
 * 注意: トランザクションデータはCSVインポートで登録してください。
 * - 給与明細 → BudgetActualManagement.jsxからインポート
 * - 労働時間実績 → BudgetActualManagement.jsxからインポート
 * - 売上実績・予測 → BudgetActualManagement.jsxからインポート
 *
 * Usage:
 *   node scripts/setup/setup_tenant3_test_data.mjs register  # セットアップ
 *   node scripts/setup/setup_tenant3_test_data.mjs delete    # 削除
 */

import pkg from 'pg';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../backend/.env') });

const { Pool } = pkg;

const TENANT_ID = 3;
const TENANT_CODE = 'STAND_BANH_MI';
const TENANT_NAME = 'Stand Banh Mi';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FGJbfPvwLFlYWCyVgJRzCfWGczpmOzvP@autorack.proxy.rlwy.net:11738/railway',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 1
});

/**
 * マスターデータを削除
 */
async function deleteMasterData(client) {
  console.log('\n🗑️  マスターデータを削除中...');

  // スタッフ削除
  const staffResult = await client.query(`
    DELETE FROM hr.staff WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - スタッフ: ${staffResult.rowCount}件`);

  // シフトパターン削除
  const patternResult = await client.query(`
    DELETE FROM core.shift_patterns WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - シフトパターン: ${patternResult.rowCount}件`);

  // 役職削除
  const roleResult = await client.query(`
    DELETE FROM core.roles WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - 役職: ${roleResult.rowCount}件`);

  // 雇用形態削除
  const empTypeResult = await client.query(`
    DELETE FROM core.employment_types WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - 雇用形態: ${empTypeResult.rowCount}件`);

  // 店舗削除
  const storeResult = await client.query(`
    DELETE FROM core.stores WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - 店舗: ${storeResult.rowCount}件`);

  // Division削除
  const divisionResult = await client.query(`
    DELETE FROM core.divisions WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - Division: ${divisionResult.rowCount}件`);

  // テナント削除
  const tenantResult = await client.query(`
    DELETE FROM core.tenants WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - テナント: ${tenantResult.rowCount}件`);

  console.log('✅ マスターデータ削除完了');
}

/**
 * マスターデータを登録
 */
async function registerMasterData(client) {
  console.log('\n📝 マスターデータを登録中...');

  // 1. テナント登録
  console.log('\n1️⃣  テナント情報登録中...');
  const tenantResult = await client.query(`
    INSERT INTO core.tenants (
      tenant_code, tenant_name, contract_start_date,
      contract_plan, max_stores, max_staff, is_active
    )
    VALUES ($1, $2, CURRENT_DATE, 'STANDARD', 10, 100, true)
    ON CONFLICT (tenant_id) DO UPDATE
    SET tenant_name = EXCLUDED.tenant_name,
        updated_at = CURRENT_TIMESTAMP
    RETURNING tenant_id
  `, [TENANT_CODE, TENANT_NAME]);

  const tenantId = TENANT_ID;
  console.log(`✅ テナント登録完了: ${TENANT_NAME} (ID: ${tenantId})`);

  // 2. Division登録（デフォルト1つ）
  console.log('\n2️⃣  Division登録中...');
  const divisionResult = await client.query(`
    INSERT INTO core.divisions (
      tenant_id, division_code, division_name, is_active
    )
    VALUES ($1, 'DEFAULT', 'デフォルト部門', true)
    ON CONFLICT DO NOTHING
    RETURNING division_id
  `, [tenantId]);

  const divisionId = divisionResult.rows.length > 0
    ? divisionResult.rows[0].division_id
    : (await client.query(`SELECT division_id FROM core.divisions WHERE tenant_id = $1 LIMIT 1`, [tenantId])).rows[0].division_id;
  console.log(`✅ Division登録完了 (ID: ${divisionId})`);

  // 3. 雇用形態登録
  console.log('\n3️⃣  雇用形態登録中...');
  const employmentTypes = [
    { code: 'FULL_TIME', name: '正社員' },
    { code: 'PART_TIME', name: 'アルバイト' }
  ];

  const empTypeIds = {};
  for (const empType of employmentTypes) {
    const result = await client.query(`
      INSERT INTO core.employment_types (tenant_id, employment_type_code, employment_type_name, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT DO NOTHING
      RETURNING employment_type_id
    `, [tenantId, empType.code, empType.name]);

    const empTypeId = result.rows.length > 0
      ? result.rows[0].employment_type_id
      : (await client.query(`SELECT employment_type_id FROM core.employment_types WHERE tenant_id = $1 AND employment_type_code = $2`, [tenantId, empType.code])).rows[0].employment_type_id;
    empTypeIds[empType.code] = empTypeId;
    console.log(`  - ${empType.name}: ID ${empTypeId}`);
  }
  console.log('✅ 雇用形態登録完了');

  // 4. 役職登録
  console.log('\n4️⃣  役職登録中...');
  const roles = [
    { code: 'STAFF', name: '一般スタッフ', order: 1 },
    { code: 'SENIOR', name: '社員', order: 2 },
    { code: 'TRIAL', name: 'トライアル', order: 3 }
  ];

  const roleIds = {};
  for (const role of roles) {
    const result = await client.query(`
      INSERT INTO core.roles (tenant_id, role_code, role_name, display_order, is_active)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT DO NOTHING
      RETURNING role_id
    `, [tenantId, role.code, role.name, role.order]);

    const roleId = result.rows.length > 0
      ? result.rows[0].role_id
      : (await client.query(`SELECT role_id FROM core.roles WHERE tenant_id = $1 AND role_code = $2`, [tenantId, role.code])).rows[0].role_id;
    roleIds[role.code] = roleId;
    console.log(`  - ${role.name}: ID ${roleId}`);
  }
  console.log('✅ 役職登録完了');

  // 5. 店舗登録
  console.log('\n5️⃣  店舗登録中...');
  const stores = [
    { code: 'COME', name: 'COME 麻布台', hours_start: '09:00', hours_end: '22:00' },
    { code: 'ATELIER', name: 'Atelier', hours_start: '09:00', hours_end: '22:00' },
    { code: 'SHIBUYA', name: 'SHIBUYA', hours_start: '10:00', hours_end: '23:00' },
    { code: 'STAND_BANH_MI', name: 'Stand Banh Mi', hours_start: '10:00', hours_end: '21:00' },
    { code: 'STAND_BO_BUN', name: 'Stand Bo Bun', hours_start: '10:00', hours_end: '21:00' }
  ];

  const storeIds = {};
  for (const store of stores) {
    const result = await client.query(`
      INSERT INTO core.stores (
        tenant_id, division_id, store_code, store_name,
        business_hours_start, business_hours_end, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT DO NOTHING
      RETURNING store_id
    `, [tenantId, divisionId, store.code, store.name, store.hours_start, store.hours_end]);

    const storeId = result.rows.length > 0
      ? result.rows[0].store_id
      : (await client.query(`SELECT store_id FROM core.stores WHERE tenant_id = $1 AND store_code = $2`, [tenantId, store.code])).rows[0].store_id;
    storeIds[store.code] = storeId;
    console.log(`  - ${store.name}: ID ${storeId}`);
  }
  console.log('✅ 店舗登録完了');

  // 6. シフトパターン登録
  console.log('\n6️⃣  シフトパターン登録中...');
  const shiftPatterns = [
    { code: 'EARLY', name: '早番', start: '09:00', end: '17:00', break: 60 },
    { code: 'MID', name: '中番', start: '12:00', end: '20:00', break: 60 },
    { code: 'LATE', name: '遅番', start: '15:00', end: '23:00', break: 60 },
    { code: 'FULL', name: '通し', start: '09:00', end: '22:00', break: 90 }
  ];

  for (const pattern of shiftPatterns) {
    await client.query(`
      INSERT INTO core.shift_patterns (
        tenant_id, pattern_code, pattern_name,
        start_time, end_time, break_minutes, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT DO NOTHING
    `, [tenantId, pattern.code, pattern.name, pattern.start, pattern.end, pattern.break]);
    console.log(`  - ${pattern.name} (${pattern.start}~${pattern.end})`);
  }
  console.log('✅ シフトパターン登録完了');

  // 7. スタッフ登録（シフトCSVから抽出）
  console.log('\n7️⃣  スタッフ登録中...');

  const csvPath = 'fixtures/shift_pdfs/csv_output/シフト.csv';
  if (!fs.existsSync(csvPath)) {
    console.log(`⚠️  シフトCSVが見つかりません: ${csvPath}`);
    console.log('   スタッフ登録をスキップします。');
  } else {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const shifts = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // スタッフ名の正規化と役職判定
    const staffSet = new Map();
    shifts.forEach(shift => {
      const originalName = shift.staff_name;
      let baseName = originalName.replace(/[（(].*?[）)]/, '').trim().replace(/\s+/g, '');

      if (!staffSet.has(baseName)) {
        staffSet.set(baseName, {
          originalName,
          role: 'STAFF',
          empType: 'PART_TIME'
        });
      }

      const staffInfo = staffSet.get(baseName);
      if (originalName.includes('社員') || originalName.includes('（社員）')) {
        staffInfo.role = 'SENIOR';
        staffInfo.empType = 'FULL_TIME';
      } else if (originalName.includes('トライアル')) {
        staffInfo.role = 'TRIAL';
      }
    });

    console.log(`   スタッフ数: ${staffSet.size}名`);

    let count = 0;
    for (const [baseName, info] of staffSet.entries()) {
      await client.query(`
        INSERT INTO hr.staff (
          tenant_id, name, role_id, employment_type_id, store_id
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [
        tenantId,
        baseName,
        roleIds[info.role],
        empTypeIds[info.empType],
        storeIds['COME'] // デフォルト店舗
      ]);
      count++;
      if (count <= 5 || count % 10 === 0 || count === staffSet.size) {
        console.log(`  [${count}/${staffSet.size}] ${baseName} (${info.role})`);
      }
    }
    console.log(`✅ スタッフ登録完了: ${staffSet.size}名`);
  }
}

/**
 * データ概要を表示
 */
async function showSummary(client) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 登録データ概要');
  console.log('='.repeat(70));

  const tenantResult = await client.query(`SELECT * FROM core.tenants WHERE tenant_id = $1`, [TENANT_ID]);
  if (tenantResult.rows.length > 0) {
    console.log(`\n🏢 テナント: ${tenantResult.rows[0].tenant_name} (ID: ${TENANT_ID})`);
  }

  const divisionCount = await client.query(`SELECT COUNT(*) as count FROM core.divisions WHERE tenant_id = $1`, [TENANT_ID]);
  console.log(`📁 Division: ${divisionCount.rows[0].count}個`);

  const storeCount = await client.query(`SELECT COUNT(*) as count FROM core.stores WHERE tenant_id = $1`, [TENANT_ID]);
  console.log(`🏪 店舗: ${storeCount.rows[0].count}店舗`);

  const empTypeCount = await client.query(`SELECT COUNT(*) as count FROM core.employment_types WHERE tenant_id = $1`, [TENANT_ID]);
  console.log(`💼 雇用形態: ${empTypeCount.rows[0].count}種類`);

  const roleCount = await client.query(`SELECT COUNT(*) as count FROM core.roles WHERE tenant_id = $1`, [TENANT_ID]);
  console.log(`👔 役職: ${roleCount.rows[0].count}種類`);

  const patternCount = await client.query(`SELECT COUNT(*) as count FROM core.shift_patterns WHERE tenant_id = $1`, [TENANT_ID]);
  console.log(`⏰ シフトパターン: ${patternCount.rows[0].count}種類`);

  const staffCount = await client.query(`SELECT COUNT(*) as count FROM hr.staff WHERE tenant_id = $1`, [TENANT_ID]);
  console.log(`👥 スタッフ: ${staffCount.rows[0].count}名`);

  console.log('\n' + '='.repeat(70));
  console.log('\n📝 次のステップ:');
  console.log('   BudgetActualManagement.jsxから以下のCSVをインポートしてください:');
  console.log('   1. fixtures/payroll_tenant3.csv (給与明細)');
  console.log('   2. fixtures/work_hours_import_tenant3.csv (労働時間実績)');
  console.log('   3. fixtures/sales_actual_tenant3.csv (売上実績)');
  console.log('   4. fixtures/sales_forecast_tenant3.csv (売上予測)');
  console.log('=' + '='.repeat(69) + '\n');
}

/**
 * メイン処理
 */
async function main() {
  const action = process.argv[2] || 'register';

  if (!['register', 'delete'].includes(action)) {
    console.error('❌ 使用方法:');
    console.error('  node scripts/setup/setup_tenant3_test_data.mjs register  # セットアップ');
    console.error('  node scripts/setup/setup_tenant3_test_data.mjs delete    # 削除');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`🎯 テナントID=${TENANT_ID} テストデータ${action === 'register' ? 'セットアップ' : '削除'}`);
  console.log('='.repeat(70));

  console.log('\n🔌 データベース接続中...');
  const client = await pool.connect();
  console.log('✅ データベース接続完了');

  try {
    await client.query('BEGIN');

    if (action === 'delete') {
      await deleteMasterData(client);
      console.log('\n✅ テストデータの削除が完了しました');
    } else {
      await deleteMasterData(client); // 既存データを削除してクリーンアップ
      await registerMasterData(client);
      console.log('\n✅ テストデータのセットアップが完了しました');
    }

    await client.query('COMMIT');

    if (action === 'register') {
      await showSummary(client);
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ エラーが発生しました:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
