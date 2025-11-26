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
 * 【トランザクションデータ】
 * - ops.shift_plans (シフト計画)
 * - ops.shifts (確定シフト - CSVから自動登録)
 * - ops.shift_preferences (シフト希望)
 *
 * 注意: 以下のトランザクションデータはCSVインポートで登録してください。
 * - hr.payroll → BudgetActualManagement.jsxからインポート
 * - hr.work_hours_actual → BudgetActualManagement.jsxからインポート
 * - analytics.sales_actual → BudgetActualManagement.jsxからインポート
 * - analytics.demand_forecasts → BudgetActualManagement.jsxからインポート
 *
 * Usage:
 *   node scripts/setup/setup_tenant3_test_data.mjs register  # セットアップ
 *   node scripts/setup/setup_tenant3_test_data.mjs delete    # 削除
 *
 * Or import as module:
 *   import { setupTenant3Data } from './setup_tenant3_test_data.mjs';
 *   await setupTenant3Data(queryFunction);
 */

import pkg from 'pg';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../backend/.env') });

const { Pool } = pkg;

const TENANT_ID = 3;
const TENANT_CODE = 'STAND_BANH_MI';
const TENANT_NAME = 'Stand Banh Mi';

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('❌ DATABASE_URL が設定されていません');
    }

    const dbHost = process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'Unknown';
    console.log(`🔌 接続先: ${dbHost}`);

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 1
    });
  }
  return pool;
}

/**
 * マスターデータを削除
 */
async function deleteMasterData(client) {
  console.log('\n🗑️  マスターデータを削除中...');

  // ops制約テーブル削除
  const laborLawResult = await client.query(`
    DELETE FROM ops.labor_law_constraints WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - 労働法制約: ${laborLawResult.rowCount}件`);

  const laborMgmtResult = await client.query(`
    DELETE FROM ops.labor_management_rules WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - 労務管理ルール: ${laborMgmtResult.rowCount}件`);

  const storeConstraintResult = await client.query(`
    DELETE FROM ops.store_constraints WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - 店舗制約: ${storeConstraintResult.rowCount}件`);

  const validationRuleResult = await client.query(`
    DELETE FROM ops.shift_validation_rules WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - シフト検証ルール: ${validationRuleResult.rowCount}件`);

  // スタッフスキル削除
  const staffSkillResult = await client.query(`
    DELETE FROM hr.staff_skills WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - スタッフスキル: ${staffSkillResult.rowCount}件`);

  // スタッフ削除
  const staffResult = await client.query(`
    DELETE FROM hr.staff WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - スタッフ: ${staffResult.rowCount}件`);

  // 税率区分削除
  const taxBracketResult = await client.query(`
    DELETE FROM hr.tax_brackets WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - 税率区分: ${taxBracketResult.rowCount}件`);

  // スキル削除
  const skillResult = await client.query(`
    DELETE FROM core.skills WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - スキル: ${skillResult.rowCount}件`);

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
 * トランザクションデータを削除
 */
async function deleteTransactionData(client) {
  console.log('\n🗑️  トランザクションデータを削除中...');

  // シフト削除（ops.shiftsはops.shift_plansに依存）
  const shiftsResult = await client.query(`
    DELETE FROM ops.shifts WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - シフト実績: ${shiftsResult.rowCount}件`);

  // シフト計画削除
  const plansResult = await client.query(`
    DELETE FROM ops.shift_plans WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - シフト計画: ${plansResult.rowCount}件`);

  // シフト希望削除
  const prefsResult = await client.query(`
    DELETE FROM ops.shift_preferences WHERE tenant_id = $1
  `, [TENANT_ID]);
  console.log(`  - シフト希望: ${prefsResult.rowCount}件`);

  console.log('✅ トランザクションデータ削除完了');
}

/**
 * マスターデータを登録
 */
async function registerMasterData(client) {
  console.log('\n📝 マスターデータを登録中...');

  // スキーマ更新：通勤距離・社会保険カラムを追加
  await client.query('ALTER TABLE hr.staff ADD COLUMN IF NOT EXISTS commute_distance_km NUMERIC(5,2)');
  await client.query('ALTER TABLE hr.staff ADD COLUMN IF NOT EXISTS has_social_insurance BOOLEAN DEFAULT false');

  // 1. テナント登録（tenant_idを明示的に指定）
  console.log('\n1️⃣  テナント情報登録中...');
  await client.query(`
    INSERT INTO core.tenants (
      tenant_id, tenant_code, tenant_name, contract_start_date,
      contract_plan, max_stores, max_staff, is_active
    )
    VALUES ($1, $2, $3, CURRENT_DATE, 'STANDARD', 10, 100, true)
    ON CONFLICT (tenant_id) DO UPDATE
    SET tenant_name = EXCLUDED.tenant_name,
        updated_at = CURRENT_TIMESTAMP
  `, [TENANT_ID, TENANT_CODE, TENANT_NAME]);

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
    { code: 'FULL_TIME', name: '正社員', paymentType: 'MONTHLY' },
    { code: 'PART_TIME', name: 'アルバイト', paymentType: 'HOURLY' }
  ];

  const empTypeIds = {};
  for (const empType of employmentTypes) {
    const result = await client.query(`
      INSERT INTO core.employment_types (tenant_id, employment_code, employment_name, payment_type, is_active)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT DO NOTHING
      RETURNING employment_type_id
    `, [tenantId, empType.code, empType.name, empType.paymentType]);

    const empTypeId = result.rows.length > 0
      ? result.rows[0].employment_type_id
      : (await client.query(`SELECT employment_type_id FROM core.employment_types WHERE tenant_id = $1 AND employment_code = $2`, [tenantId, empType.code])).rows[0].employment_type_id;
    empTypeIds[empType.code] = empTypeId;
    console.log(`  - ${empType.name}: ID ${empTypeId}`);
  }
  console.log('✅ 雇用形態登録完了');

  // 4. 役職登録
  console.log('\n4️⃣  役職登録中...');
  const roles = [
    { code: 'STAFF', name: 'アルバイト', order: 1 },
    { code: 'SENIOR', name: '社員', order: 2 }
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

  // 6. 社会保険料率マスタ登録
  console.log('\n6️⃣  社会保険料率マスタ登録中...');
  const insuranceRates = [
    {
      insurance_type: 'HEALTH',
      rate_name: '健康保険',
      employee_rate: 0.0495,
      employer_rate: 0.0495,
      employee_percentage: 4.95,
      employer_percentage: 4.95,
      applicable_employment_types: 'MONTHLY,HOURLY'
    },
    {
      insurance_type: 'PENSION',
      rate_name: '厚生年金',
      employee_rate: 0.0915,
      employer_rate: 0.0915,
      employee_percentage: 9.15,
      employer_percentage: 9.15,
      applicable_employment_types: 'MONTHLY,HOURLY'
    },
    {
      insurance_type: 'EMPLOYMENT',
      rate_name: '雇用保険',
      employee_rate: 0.0060,
      employer_rate: 0.0095,
      employee_percentage: 0.60,
      employer_percentage: 0.95,
      applicable_employment_types: 'MONTHLY,HOURLY'
    },
    {
      insurance_type: 'WORKERS_COMP',
      rate_name: '労災保険',
      employee_rate: 0.0000,
      employer_rate: 0.0030,
      employee_percentage: 0.00,
      employer_percentage: 0.30,
      applicable_employment_types: 'MONTHLY,HOURLY'
    }
  ];

  for (const rate of insuranceRates) {
    await client.query(`
      INSERT INTO hr.insurance_rates (
        tenant_id, insurance_type, rate_name,
        employee_rate, employer_rate,
        employee_percentage, employer_percentage,
        applicable_employment_types,
        effective_from, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '2025-01-01', true)
    `, [
      tenantId,
      rate.insurance_type,
      rate.rate_name,
      rate.employee_rate,
      rate.employer_rate,
      rate.employee_percentage,
      rate.employer_percentage,
      rate.applicable_employment_types
    ]);
    console.log(`  - ${rate.rate_name}: 従業員${rate.employee_percentage}% / 事業主${rate.employer_percentage}%`);
  }
  console.log('✅ 社会保険料率マスタ登録完了');

  // 7. 通勤手当マスタ登録
  console.log('\n7️⃣  通勤手当マスタ登録中...');
  const commuteAllowances = [
    { distance_from_km: 0, distance_to_km: 2, allowance_amount: 0, description: '2km未満' },
    { distance_from_km: 2, distance_to_km: 5, allowance_amount: 3000, description: '2km以上5km未満' },
    { distance_from_km: 5, distance_to_km: 10, allowance_amount: 6000, description: '5km以上10km未満' },
    { distance_from_km: 10, distance_to_km: 15, allowance_amount: 9000, description: '10km以上15km未満' },
    { distance_from_km: 15, distance_to_km: 999, allowance_amount: 12000, description: '15km以上' }
  ];

  for (const allowance of commuteAllowances) {
    await client.query(`
      INSERT INTO hr.commute_allowance (
        tenant_id, distance_from_km, distance_to_km,
        allowance_amount, description, is_active
      )
      VALUES ($1, $2, $3, $4, $5, true)
    `, [
      tenantId,
      allowance.distance_from_km,
      allowance.distance_to_km,
      allowance.allowance_amount,
      allowance.description
    ]);
    console.log(`  - ${allowance.description}: ¥${allowance.allowance_amount.toLocaleString()}`);
  }
  console.log('✅ 通勤手当マスタ登録完了');

  // 8. シフトパターン登録
  console.log('\n8️⃣  シフトパターン登録中...');
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

  const csvPath = join(__dirname, '../../../fixtures/shift_pdfs/csv_output/shift_all_data_updated.csv');
  if (!fs.existsSync(csvPath)) {
    console.log(`⚠️  シフトCSVが見つかりません: ${csvPath}`);
    console.log('   スタッフ登録をスキップします。');
  } else {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const shifts = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true  // UTF-8 BOMを処理
    });

    // スタッフ名の抽出と雇用形態判定、店舗別出勤回数の集計
    const staffSet = new Map();
    const staffStoreCount = new Map(); // { staff_name: { store_name: count } }

    shifts.forEach(shift => {
      const staffName = shift['スタッフ名'];
      const storeName = shift['店舗名'];
      const roleFromCSV = shift['役職']; // 社員 or アルバイト

      // スタッフ情報の収集
      if (!staffSet.has(staffName)) {
        // CSVの役職から判定
        // 社員 → FULL_TIME (正社員), アルバイト → PART_TIME (アルバイト)
        const empType = roleFromCSV === '社員' ? 'FULL_TIME' : 'PART_TIME';
        const role = roleFromCSV === '社員' ? 'SENIOR' : 'STAFF';

        staffSet.set(staffName, {
          role,
          empType
        });
      }

      // 店舗別出勤回数の集計
      if (!staffStoreCount.has(staffName)) {
        staffStoreCount.set(staffName, new Map());
      }
      const storeCounts = staffStoreCount.get(staffName);
      storeCounts.set(storeName, (storeCounts.get(storeName) || 0) + 1);
    });

    // CSVの店舗名 → store_code マッピング
    const storeNameToCode = {
      'COME 麻布台': 'COME',
      'Atelier': 'ATELIER',
      'SHIBUYA': 'SHIBUYA',
      'Stand Banh Mi': 'STAND_BANH_MI',
      'Stand Bo Bun': 'STAND_BO_BUN'
    };

    // 各スタッフの最頻出店舗を計算
    const staffDefaultStores = new Map();
    for (const [staffName, storeCounts] of staffStoreCount.entries()) {
      let maxCount = 0;
      let mostFrequentStoreName = 'COME 麻布台'; // デフォルト

      for (const [storeName, count] of storeCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          mostFrequentStoreName = storeName;
        }
      }

      // CSVの店舗名をstore_codeに変換
      const storeCode = storeNameToCode[mostFrequentStoreName] || 'COME';
      staffDefaultStores.set(staffName, storeCode);
    }

    console.log(`   スタッフ数: ${staffSet.size}名`);

    let count = 0;
    let updated = 0;
    let inserted = 0;

    for (const [staffName, info] of staffSet.entries()) {
      // スタッフコードを生成（STAFF_001, STAFF_002, ...）
      const staffCode = `STAFF_${String(count + 1).padStart(3, '0')}`;

      // 最頻出店舗を取得
      const defaultStoreName = staffDefaultStores.get(staffName) || 'COME';
      const defaultStoreId = storeIds[defaultStoreName] || storeIds['COME'];

      // 仮のメールアドレスを生成（ローマ字化は簡易版）
      const email = `${staffCode.toLowerCase()}@standbahnmi.example.com`;

      // 仮の電話番号を生成
      const phoneNumber = `090-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // 給与設定（雇用形態に基づく）
      let monthlySalary = null;
      let hourlyRate = null;

      if (info.empType === 'FULL_TIME') {
        // 社員：月給250,000円〜350,000円の範囲でランダム
        monthlySalary = 250000 + Math.floor(Math.random() * 100000);
      } else {
        // アルバイト：時給1,200円〜1,500円の範囲でランダム
        hourlyRate = 1200 + Math.floor(Math.random() * 300);
      }

      // 通勤距離を生成（0km〜20kmの範囲でランダム、0.5km刻み）
      const commuteDistance = (Math.floor(Math.random() * 41) * 0.5).toFixed(1);

      // 社会保険加入判定：FULL_TIMEは必ず加入
      const hasSocialInsurance = info.empType === 'FULL_TIME';

      const result = await client.query(`
        INSERT INTO hr.staff (
          tenant_id, staff_code, name, role_id, employment_type, store_id,
          hire_date, email, phone_number, monthly_salary, hourly_rate,
          commute_distance_km, has_social_insurance, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8, $9, $10, $11, $12, true)
        ON CONFLICT (tenant_id, staff_code)
        DO UPDATE SET
          name = EXCLUDED.name,
          role_id = EXCLUDED.role_id,
          employment_type = EXCLUDED.employment_type,
          store_id = EXCLUDED.store_id,
          email = EXCLUDED.email,
          phone_number = EXCLUDED.phone_number,
          monthly_salary = EXCLUDED.monthly_salary,
          hourly_rate = EXCLUDED.hourly_rate,
          commute_distance_km = EXCLUDED.commute_distance_km,
          has_social_insurance = EXCLUDED.has_social_insurance,
          is_active = EXCLUDED.is_active
      `, [
        tenantId,
        staffCode,
        staffName,
        roleIds[info.role],
        info.empType,
        defaultStoreId, // シフト履歴から計算したデフォルト店舗
        email,
        phoneNumber,
        monthlySalary,
        hourlyRate,
        commuteDistance,
        hasSocialInsurance
      ]);

      if (result.rowCount > 0) {
        // ON CONFLICTのDO UPDATEはrowCount=1を返す
        if (count === 0) {
          inserted++;
        } else {
          updated++;
        }
      }

      count++;
      if (count <= 5 || count % 10 === 0 || count === staffSet.size) {
        console.log(`  [${count}/${staffSet.size}] ${staffName} (${info.role}) → ${defaultStoreName}`);
      }
    }
    console.log(`✅ スタッフ登録完了: ${staffSet.size}名 (新規: ${inserted}名, 更新: ${updated}名)`);

    // 10月・11月のシフトに出ていないスタッフを退職者として登録
    console.log('\n👥 退職者登録中...');
    const recentStaff = new Set();
    const resignedStaff = [];

    // 10月・11月のシフトに出ているスタッフを抽出
    shifts.forEach(shift => {
      const date = new Date(shift['日付']);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (yearMonth === '2025-10' || yearMonth === '2025-11') {
        recentStaff.add(shift['スタッフ名']);
      }
    });

    // 全スタッフから10月・11月に出ていない人を抽出
    for (const [staffName] of staffSet.entries()) {
      if (!recentStaff.has(staffName)) {
        resignedStaff.push(staffName);
      }
    }

    console.log(`   10月・11月に出勤していないスタッフ: ${resignedStaff.length}名`);

    // 退職者として更新
    let resignedCount = 0;
    for (const staffName of resignedStaff) {
      await client.query(`
        UPDATE hr.staff
        SET is_active = false,
            resignation_date = '2025-09-30'
        WHERE tenant_id = $1 AND name = $2
      `, [tenantId, staffName]);
      resignedCount++;
      if (resignedCount <= 5) {
        console.log(`  退職: ${staffName}`);
      }
    }
    if (resignedStaff.length > 5) {
      console.log(`  ... 他${resignedStaff.length - 5}名`);
    }
    console.log(`✅ 退職者登録完了: ${resignedCount}名`);

    // テストスタッフ追加
    console.log('\n👤 テストスタッフ追加中...');
    const testStaff = [
      {
        staff_code: 'TEST_UCHIYAMA',
        name: 'uchiyama moriya',
        role: 'SENIOR',
        empType: 'FULL_TIME',
        store: storeIds['COME'],
        monthlySalary: 350000,
        isActive: true
      }
    ];

    for (const staff of testStaff) {
      const commuteDistance = 5.0;
      const hasSocialInsurance = true;

      await client.query(`
        INSERT INTO hr.staff (
          tenant_id, staff_code, name, role_id, employment_type, store_id,
          hire_date, monthly_salary, hourly_rate,
          commute_distance_km, has_social_insurance, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, '2024-01-01', $7, $8, $9, $10, $11)
        ON CONFLICT (tenant_id, staff_code) DO UPDATE SET
          name = EXCLUDED.name,
          role_id = EXCLUDED.role_id,
          is_active = EXCLUDED.is_active
      `, [
        tenantId,
        staff.staff_code,
        staff.name,
        roleIds[staff.role],
        staff.empType,
        staff.store,
        staff.monthlySalary || null,
        staff.hourlyRate || null,
        commuteDistance,
        hasSocialInsurance,
        staff.isActive
      ]);
      console.log(`  追加: ${staff.name} (${staff.empType})`);
    }
    console.log(`✅ テストスタッフ追加完了: ${testStaff.length}名`);
  }

  // 9. スキルマスター登録
  console.log('\n9️⃣  スキルマスター登録中...');
  const skills = [
    { code: 'COOKING_BASIC', name: '調理基礎', category: '調理', order: 1 },
    { code: 'COOKING_ADVANCED', name: '調理上級', category: '調理', order: 2 },
    { code: 'CUSTOMER_SERVICE', name: '接客', category: 'サービス', order: 3 },
    { code: 'CASHIER', name: 'レジ', category: 'サービス', order: 4 },
    { code: 'MANAGEMENT', name: 'マネジメント', category: '管理', order: 5 }
  ];

  const skillIds = {};
  for (const skill of skills) {
    const result = await client.query(`
      INSERT INTO core.skills (
        tenant_id, skill_code, skill_name, category, display_order, is_active
      )
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT DO NOTHING
      RETURNING skill_id
    `, [tenantId, skill.code, skill.name, skill.category, skill.order]);

    const skillId = result.rows.length > 0
      ? result.rows[0].skill_id
      : (await client.query(`SELECT skill_id FROM core.skills WHERE tenant_id = $1 AND skill_code = $2`, [tenantId, skill.code])).rows[0].skill_id;
    skillIds[skill.code] = skillId;
    console.log(`  - ${skill.name} (${skill.category})`);
  }
  console.log('✅ スキルマスター登録完了');

  // 10. 税率区分マスター登録
  console.log('\n🔟 税率区分マスター登録中...');
  const taxBrackets = [
    {
      tax_type: 'INCOME',
      bracket_name: '0円～1,949,000円',
      income_from: 0,
      income_to: 1949000,
      tax_rate: 0.05,
      deduction_amount: 0,
      effective_from: '2024-01-01'
    },
    {
      tax_type: 'INCOME',
      bracket_name: '1,950,000円～3,299,000円',
      income_from: 1950000,
      income_to: 3299000,
      tax_rate: 0.10,
      deduction_amount: 97500,
      effective_from: '2024-01-01'
    },
    {
      tax_type: 'INCOME',
      bracket_name: '3,300,000円～6,949,000円',
      income_from: 3300000,
      income_to: 6949000,
      tax_rate: 0.20,
      deduction_amount: 427500,
      effective_from: '2024-01-01'
    },
    {
      tax_type: 'INCOME',
      bracket_name: '6,950,000円～8,999,000円',
      income_from: 6950000,
      income_to: 8999000,
      tax_rate: 0.23,
      deduction_amount: 636000,
      effective_from: '2024-01-01'
    },
    {
      tax_type: 'INCOME',
      bracket_name: '9,000,000円～17,999,000円',
      income_from: 9000000,
      income_to: 17999000,
      tax_rate: 0.33,
      deduction_amount: 1536000,
      effective_from: '2024-01-01'
    },
    {
      tax_type: 'INCOME',
      bracket_name: '18,000,000円～39,999,000円',
      income_from: 18000000,
      income_to: 39999000,
      tax_rate: 0.40,
      deduction_amount: 2796000,
      effective_from: '2024-01-01'
    },
    {
      tax_type: 'INCOME',
      bracket_name: '40,000,000円以上',
      income_from: 40000000,
      income_to: null,
      tax_rate: 0.45,
      deduction_amount: 4796000,
      effective_from: '2024-01-01'
    }
  ];

  for (const bracket of taxBrackets) {
    await client.query(`
      INSERT INTO hr.tax_brackets (
        tenant_id, tax_type, bracket_name, income_from, income_to,
        tax_rate, deduction_amount, effective_from, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      ON CONFLICT DO NOTHING
    `, [
      tenantId,
      bracket.tax_type,
      bracket.bracket_name,
      bracket.income_from,
      bracket.income_to,
      bracket.tax_rate,
      bracket.deduction_amount,
      bracket.effective_from
    ]);
    console.log(`  - ${bracket.bracket_name}: ${(bracket.tax_rate * 100).toFixed(0)}%`);
  }
  console.log('✅ 税率区分マスター登録完了');

  // 11. 労働法制約マスター登録
  console.log('\n1️⃣1️⃣  労働法制約マスター登録中...');
  const laborLawConstraints = [
    {
      constraint_code: 'WEEKLY_MAX_HOURS',
      constraint_name: '週の法定労働時間上限',
      value: 40,
      unit: 'hours',
      description: '労働基準法第32条:1週間の労働時間は40時間を超えてはならない',
      law_code: 'LSA_32',
      law_name: '労働基準法第32条',
      category: '労働時間',
      constraint_rule: '1週間の労働時間が40時間を超えないこと',
      penalty_level: 'HIGH',
      legal_reference: '6ヶ月以下の懲役又は30万円以下の罰金'
    },
    {
      constraint_code: 'DAILY_MAX_HOURS',
      constraint_name: '1日の法定労働時間上限',
      value: 8,
      unit: 'hours',
      description: '労働基準法第32条:1日の労働時間は8時間を超えてはならない',
      law_code: 'LSA_32',
      law_name: '労働基準法第32条',
      category: '労働時間',
      constraint_rule: '1日の労働時間が8時間を超えないこと(36協定がない場合)',
      penalty_level: 'HIGH',
      legal_reference: '6ヶ月以下の懲役又は30万円以下の罰金'
    },
    {
      constraint_code: 'CONTINUOUS_REST_MIN',
      constraint_name: '継続勤務の最低休息時間',
      value: 11,
      unit: 'hours',
      description: '勤務間インターバル制度:次の勤務まで11時間以上の休息を確保',
      law_code: 'GUIDELINE',
      law_name: '労働時間等設定改善指針',
      category: '休息時間',
      constraint_rule: '勤務終了から次の勤務開始まで11時間以上の休息時間を確保すること',
      penalty_level: 'MEDIUM',
      legal_reference: '努力義務'
    },
    {
      constraint_code: 'WEEKLY_REST_DAYS',
      constraint_name: '週の最低休日数',
      value: 1,
      unit: 'days',
      description: '労働基準法第35条:毎週少なくとも1回の休日を与えなければならない',
      law_code: 'LSA_35',
      law_name: '労働基準法第35条',
      category: '休日',
      constraint_rule: '毎週少なくとも1日の休日を与えること',
      penalty_level: 'HIGH',
      legal_reference: '6ヶ月以下の懲役又は30万円以下の罰金'
    },
    {
      constraint_code: 'MONTHLY_OVERTIME_LIMIT',
      constraint_name: '月の時間外労働上限(36協定)',
      value: 45,
      unit: 'hours',
      description: '36協定による時間外労働の上限(月45時間)',
      law_code: 'LSA_36',
      law_name: '労働基準法第36条',
      category: '時間外労働',
      constraint_rule: '時間外労働が月45時間を超えないこと',
      penalty_level: 'HIGH',
      legal_reference: '6ヶ月以下の懲役又は30万円以下の罰金'
    },
    {
      constraint_code: 'BREAK_TIME_6H',
      constraint_name: '6時間超勤務時の休憩時間',
      value: 45,
      unit: 'minutes',
      description: '労働基準法第34条:6時間を超える場合は少なくとも45分の休憩',
      law_code: 'LSA_34',
      law_name: '労働基準法第34条',
      category: '休憩時間',
      constraint_rule: '労働時間が6時間を超える場合、少なくとも45分の休憩を与えること',
      penalty_level: 'HIGH',
      legal_reference: '6ヶ月以下の懲役又は30万円以下の罰金'
    },
    {
      constraint_code: 'BREAK_TIME_8H',
      constraint_name: '8時間超勤務時の休憩時間',
      value: 60,
      unit: 'minutes',
      description: '労働基準法第34条:8時間を超える場合は少なくとも1時間の休憩',
      law_code: 'LSA_34',
      law_name: '労働基準法第34条',
      category: '休憩時間',
      constraint_rule: '労働時間が8時間を超える場合、少なくとも1時間の休憩を与えること',
      penalty_level: 'HIGH',
      legal_reference: '6ヶ月以下の懲役又は30万円以下の罰金'
    }
  ];

  for (const constraint of laborLawConstraints) {
    await client.query(`
      INSERT INTO ops.labor_law_constraints (
        tenant_id, constraint_code, constraint_name, value, unit, description,
        law_code, law_name, category, constraint_rule, penalty_level, legal_reference, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
      ON CONFLICT DO NOTHING
    `, [
      tenantId,
      constraint.constraint_code,
      constraint.constraint_name,
      constraint.value,
      constraint.unit,
      constraint.description,
      constraint.law_code,
      constraint.law_name,
      constraint.category,
      constraint.constraint_rule,
      constraint.penalty_level,
      constraint.legal_reference
    ]);
    console.log(`  - ${constraint.constraint_name}: ${constraint.value}${constraint.unit}`);
  }
  console.log('✅ 労働法制約マスター登録完了');

  // 12. 労務管理ルールマスター登録
  console.log('\n1️⃣2️⃣  労務管理ルールマスター登録中...');
  const laborManagementRules = [
    {
      rule_id: 'OVERTIME_ALERT',
      category: 'WORK_HOURS',
      rule_type: 'THRESHOLD_CHECK',
      description: '時間外労働が月40時間を超えた場合にアラート',
      threshold_value: 40,
      unit: 'hours',
      evaluation_period: 'MONTHLY',
      action_type: 'ALERT',
      priority: 'HIGH'
    },
    {
      rule_id: 'CONSECUTIVE_WORK_DAYS',
      category: 'WORK_PATTERN',
      rule_type: 'SEQUENCE_CHECK',
      description: '連続勤務日数が6日を超えないようチェック',
      threshold_value: 6,
      unit: 'days',
      evaluation_period: 'WEEKLY',
      action_type: 'WARNING',
      priority: 'MEDIUM'
    },
    {
      rule_id: 'MIN_STAFF_PER_SHIFT',
      category: 'STAFFING',
      rule_type: 'COUNT_CHECK',
      description: 'シフトごとの最低必要人数チェック',
      threshold_value: 2,
      unit: 'persons',
      evaluation_period: 'SHIFT',
      action_type: 'ERROR',
      priority: 'HIGH'
    },
    {
      rule_id: 'NIGHT_SHIFT_LIMIT',
      category: 'WORK_HOURS',
      rule_type: 'THRESHOLD_CHECK',
      description: '深夜勤務(22:00-5:00)の月間回数制限',
      threshold_value: 10,
      unit: 'days',
      evaluation_period: 'MONTHLY',
      action_type: 'WARNING',
      priority: 'MEDIUM'
    },
    {
      rule_id: 'MONTHLY_HOURS_LIMIT',
      category: 'WORK_HOURS',
      rule_type: 'THRESHOLD_CHECK',
      description: '月間総労働時間の上限チェック(160時間)',
      threshold_value: 160,
      unit: 'hours',
      evaluation_period: 'MONTHLY',
      action_type: 'ERROR',
      priority: 'HIGH'
    }
  ];

  for (const rule of laborManagementRules) {
    await client.query(`
      INSERT INTO ops.labor_management_rules (
        tenant_id, rule_id, category, rule_type, description,
        threshold_value, unit, evaluation_period, action_type, priority, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      ON CONFLICT DO NOTHING
    `, [
      tenantId,
      rule.rule_id,
      rule.category,
      rule.rule_type,
      rule.description,
      rule.threshold_value,
      rule.unit,
      rule.evaluation_period,
      rule.action_type,
      rule.priority
    ]);
    console.log(`  - ${rule.description}`);
  }
  console.log('✅ 労務管理ルールマスター登録完了');

  // 13. 店舗制約マスター登録
  console.log('\n1️⃣3️⃣  店舗制約マスター登録中...');
  const storeConstraints = [];

  // 各店舗に営業時間制約を設定
  for (const [storeName, storeId] of Object.entries(storeIds)) {
    storeConstraints.push({
      store_id: storeId,
      constraint_id: `${storeName}_OPEN_HOURS`,
      constraint_type: 'BUSINESS_HOURS',
      constraint_value: JSON.stringify({ start: '10:00', end: '22:00' }),
      description: `${storeName}の営業時間: 10:00-22:00`,
      priority: 'HIGH'
    });

    storeConstraints.push({
      store_id: storeId,
      constraint_id: `${storeName}_MIN_STAFF`,
      constraint_type: 'MIN_STAFF_COUNT',
      constraint_value: '2',
      description: `${storeName}の最低必要人数: 2名`,
      priority: 'HIGH'
    });
  }

  for (const constraint of storeConstraints) {
    await client.query(`
      INSERT INTO ops.store_constraints (
        tenant_id, store_id, constraint_id, constraint_type, constraint_value, description, priority, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      ON CONFLICT DO NOTHING
    `, [
      tenantId,
      constraint.store_id,
      constraint.constraint_id,
      constraint.constraint_type,
      constraint.constraint_value,
      constraint.description,
      constraint.priority
    ]);
  }
  console.log(`  - ${storeConstraints.length}件の店舗制約を登録`);
  console.log('✅ 店舗制約マスター登録完了');

  // 14. シフト検証ルールマスター登録
  console.log('\n1️⃣4️⃣  シフト検証ルールマスター登録中...');
  const shiftValidationRules = [
    {
      validation_id: 'CHECK_OVERLAP',
      rule_code: 'SHIFT_OVERLAP',
      rule_name: 'シフト重複チェック',
      check_category: 'SCHEDULING',
      validation_rule: '同一スタッフの同一日に複数のシフトが重複していないかチェック',
      description: 'スタッフが同じ日に複数のシフトにアサインされていないか検証',
      check_level: 'ERROR',
      severity: 'HIGH',
      auto_action: 'REJECT',
      error_message: '同一スタッフが同じ日に複数のシフトにアサインされています',
      override_possible: false
    },
    {
      validation_id: 'CHECK_REST_TIME',
      rule_code: 'MIN_REST_INTERVAL',
      rule_name: '勤務間インターバルチェック',
      check_category: 'WORK_HOURS',
      validation_rule: '連続するシフト間に最低11時間の休息時間が確保されているかチェック',
      description: '労働時間等設定改善指針に基づく勤務間インターバルの検証',
      check_level: 'WARNING',
      severity: 'MEDIUM',
      auto_action: 'WARN',
      error_message: '勤務間インターバルが11時間未満です',
      override_possible: true,
      override_authority: 'MANAGER'
    },
    {
      validation_id: 'CHECK_WEEKLY_HOURS',
      rule_code: 'WEEKLY_HOURS_LIMIT',
      rule_name: '週間労働時間チェック',
      check_category: 'WORK_HOURS',
      validation_rule: '1週間の労働時間が法定上限(40時間)を超えていないかチェック',
      description: '労働基準法第32条に基づく週間労働時間の検証',
      check_level: 'ERROR',
      severity: 'HIGH',
      auto_action: 'REJECT',
      error_message: '週間労働時間が40時間を超えています',
      override_possible: true,
      override_authority: 'ADMIN'
    },
    {
      validation_id: 'CHECK_MIN_STAFF',
      rule_code: 'MIN_STAFF_COUNT',
      rule_name: '最低人数チェック',
      check_category: 'STAFFING',
      validation_rule: 'シフトごとに最低必要人数が確保されているかチェック',
      description: '各シフトに必要な最低人数が配置されているか検証',
      check_level: 'ERROR',
      severity: 'HIGH',
      auto_action: 'REJECT',
      error_message: 'シフトの最低必要人数が不足しています',
      override_possible: true,
      override_authority: 'MANAGER'
    },
    {
      validation_id: 'CHECK_BREAK_TIME',
      rule_code: 'REQUIRED_BREAK',
      rule_name: '休憩時間チェック',
      check_category: 'WORK_HOURS',
      validation_rule: '労働時間に応じた適切な休憩時間が設定されているかチェック',
      description: '労働基準法第34条に基づく休憩時間の検証(6h超:45分, 8h超:60分)',
      check_level: 'ERROR',
      severity: 'HIGH',
      auto_action: 'REJECT',
      error_message: '必要な休憩時間が不足しています',
      override_possible: false
    },
    {
      validation_id: 'CHECK_CONSECUTIVE_WORK',
      rule_code: 'MAX_CONSECUTIVE_DAYS',
      rule_name: '連続勤務日数チェック',
      check_category: 'WORK_PATTERN',
      validation_rule: '連続勤務日数が6日を超えていないかチェック',
      description: '労働基準法第35条に基づく週休の検証',
      check_level: 'WARNING',
      severity: 'MEDIUM',
      auto_action: 'WARN',
      error_message: '連続勤務日数が6日を超えています',
      override_possible: true,
      override_authority: 'MANAGER'
    }
  ];

  for (const rule of shiftValidationRules) {
    await client.query(`
      INSERT INTO ops.shift_validation_rules (
        tenant_id, validation_id, rule_code, rule_name, check_category, validation_rule,
        description, check_level, severity, auto_action, error_message,
        override_possible, override_authority, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
      ON CONFLICT DO NOTHING
    `, [
      tenantId,
      rule.validation_id,
      rule.rule_code,
      rule.rule_name,
      rule.check_category,
      rule.validation_rule,
      rule.description,
      rule.check_level,
      rule.severity,
      rule.auto_action,
      rule.error_message,
      rule.override_possible,
      rule.override_authority
    ]);
    console.log(`  - ${rule.rule_name}`);
  }
  console.log('✅ シフト検証ルールマスター登録完了');

  // 登録したIDを返す
  return {
    tenantId,
    divisionId,
    storeIds,
    empTypeIds,
    roleIds
  };
}

/**
 * シフトデータをCSVから登録
 */
async function registerShiftData(client, masterIds) {
  console.log('\n8️⃣  シフトデータ登録中...');

  const csvPath = join(__dirname, '../../../fixtures/shift_pdfs/csv_output/shift_all_data_updated.csv');
  if (!fs.existsSync(csvPath)) {
    console.log(`⚠️  シフトCSVが見つかりません: ${csvPath}`);
    console.log('   シフトデータ登録をスキップします。');
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const shifts = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true  // UTF-8 BOMを処理
  });

  console.log(`   読み込んだシフト数: ${shifts.length}件`);

  // 店舗名 → store_id マッピング（先に定義）
  const storeNameMap = {
    'COME 麻布台': masterIds.storeIds['COME'],
    'Stand Banh Mi': masterIds.storeIds['STAND_BANH_MI'],
    'Stand Bo Bun': masterIds.storeIds['STAND_BO_BUN'],
    'Atelier': masterIds.storeIds['ATELIER'],
    'SHIBUYA': masterIds.storeIds['SHIBUYA']
  };

  // シフトを年月+店舗でグループ化
  const shiftsByMonthStore = {};
  shifts.forEach(shift => {
    const date = new Date(shift['日付']);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const storeId = storeNameMap[shift['店舗名']] || masterIds.storeIds['COME'];
    const key = `${yearMonth}_${storeId}`;

    if (!shiftsByMonthStore[key]) {
      shiftsByMonthStore[key] = {
        yearMonth,
        storeId,
        storeName: shift['店舗名'],
        shifts: []
      };
    }
    shiftsByMonthStore[key].shifts.push(shift);
  });

  console.log(`   対象パターン: ${Object.keys(shiftsByMonthStore).length}件 (月×店舗)`);

  // 月×店舗ごとにシフト計画を作成
  const planIdsByMonthStore = {};
  for (const key of Object.keys(shiftsByMonthStore).sort()) {
    const group = shiftsByMonthStore[key];
    const [year, month] = group.yearMonth.split('-').map(Number);
    const monthName = `${year}年${month}月`;

    // 月の初日と最終日を計算
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);
    const periodStartStr = periodStart.toISOString().split('T')[0];
    const periodEndStr = periodEnd.toISOString().split('T')[0];

    // CSVのシフトデータは全て確定済みの過去シフトなので第二案承認済み
    const planResult = await client.query(`
      INSERT INTO ops.shift_plans (
        tenant_id, store_id, plan_year, plan_month,
        plan_code, plan_name, period_start, period_end,
        status, generation_type, plan_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'APPROVED', 'CSV_IMPORT', 'SECOND')
      ON CONFLICT DO NOTHING
      RETURNING plan_id
    `, [
      TENANT_ID,
      group.storeId,
      year,
      month,
      `PLAN_${year}${String(month).padStart(2, '0')}_STORE${group.storeId}`,
      `${monthName}シフト計画 (${group.storeName})`,
      periodStartStr,
      periodEndStr
    ]);

    if (planResult.rows.length > 0) {
      planIdsByMonthStore[key] = planResult.rows[0].plan_id;
      console.log(`   ${monthName} ${group.storeName} シフト計画作成 (plan_id: ${planResult.rows[0].plan_id}, ${group.shifts.length}件)`);
    } else {
      // 既存のプランを取得
      const existingPlan = await client.query(`
        SELECT plan_id FROM ops.shift_plans
        WHERE tenant_id = $1 AND store_id = $2 AND plan_year = $3 AND plan_month = $4
        LIMIT 1
      `, [TENANT_ID, group.storeId, year, month]);
      planIdsByMonthStore[key] = existingPlan.rows[0].plan_id;
      console.log(`   ${monthName} ${group.storeName} 既存計画を使用 (plan_id: ${existingPlan.rows[0].plan_id})`);
    }
  }

  // スタッフ名→staff_idのマッピングを取得
  const staffResult = await client.query(`
    SELECT staff_id, name FROM hr.staff WHERE tenant_id = $1
  `, [TENANT_ID]);

  const staffMap = {};
  staffResult.rows.forEach(row => {
    staffMap[row.name] = row.staff_id;
  });

  // シフトパターン取得（デフォルトパターンを使用）
  const patternResult = await client.query(`
    SELECT pattern_id FROM core.shift_patterns
    WHERE tenant_id = $1 AND pattern_code = 'EARLY'
    LIMIT 1
  `, [TENANT_ID]);

  const defaultPatternId = patternResult.rows.length > 0
    ? patternResult.rows[0].pattern_id
    : 1; // フォールバック

  // シフトデータを登録
  let inserted = 0;
  let skipped = 0;

  for (const shift of shifts) {
    const staffName = shift['スタッフ名'];
    const staffId = staffMap[staffName];

    if (!staffId) {
      skipped++;
      if (skipped <= 5) {
        console.log(`   ⚠️  スキップ: ${staffName} (スタッフマスタに存在しません)`);
      }
      continue;
    }

    // 店舗IDを取得
    const storeId = storeNameMap[shift['店舗名']] || masterIds.storeIds['COME'];

    // 日付はCSVに既にYYYY-MM-DD形式で入っている
    const shiftDate = shift['日付'];

    // このシフトの年月+店舗を取得し、対応するplan_idを使用
    const date = new Date(shiftDate);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const key = `${yearMonth}_${storeId}`;
    const planId = planIdsByMonthStore[key];

    if (!planId) {
      skipped++;
      console.error(`   ❌ plan_idが見つかりません: ${key} (店舗: ${shift['店舗名']})`);
      continue;
    }

    // 開始・終了時刻は既に HH:MM:SS 形式
    // ★変更: VARCHAR(5)対応 - 24時超過表記（25:00, 26:00など）をそのまま保存
    // HH:MM形式に変換（秒は削除）
    const formatTimeForVarchar = (timeStr) => {
      const parts = timeStr.split(':');
      const hour = parts[0];
      const minute = parts[1];
      return `${hour}:${minute}`;
    };

    const startTime = formatTimeForVarchar(shift['開始時刻']);
    const endTime = formatTimeForVarchar(shift['終了時刻']);

    // 労働時間を計算（開始〜終了 - 休憩時間）
    const breakMinutes = parseInt(shift['休憩時間']) || 0;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // 終了時刻が翌日にまたがる場合（27:00など）
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const workMinutes = endMinutes - startMinutes - breakMinutes;
    const totalHours = workMinutes / 60;

    try {
      await client.query(`
        INSERT INTO ops.shifts (
          tenant_id, store_id, plan_id, staff_id, shift_date,
          pattern_id, start_time, end_time, break_minutes,
          total_hours, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `, [
        TENANT_ID,
        storeId,
        planId,
        staffId,
        shiftDate,
        null,  // ★変更: pattern_id = NULL（MVPではシフトパターン入力なし）
        startTime,
        endTime,
        breakMinutes,
        totalHours,
        null  // notes列は新しいCSVにない
      ]);
      inserted++;

      if (inserted <= 5 || inserted % 100 === 0) {
        console.log(`  [${inserted}/${shifts.length}] ${shiftDate} - ${staffName} (${shift['店舗名']})`);
      }
    } catch (error) {
      console.error(`   ❌ エラー (${staffName}, ${shiftDate}):`, error.message);
    }
  }

  console.log(`✅ シフトデータ登録完了: ${inserted}件 (スキップ: ${skipped}件)`);
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

  console.log('\n--- トランザクションデータ ---');

  const planCount = await client.query(`SELECT COUNT(*) as count FROM ops.shift_plans WHERE tenant_id = $1`, [TENANT_ID]);
  console.log(`📅 シフト計画: ${planCount.rows[0].count}件`);

  const shiftCount = await client.query(`SELECT COUNT(*) as count FROM ops.shifts WHERE tenant_id = $1`, [TENANT_ID]);
  console.log(`🔄 確定シフト: ${shiftCount.rows[0].count}件`);

  const prefCount = await client.query(`SELECT COUNT(*) as count FROM ops.shift_preferences WHERE tenant_id = $1`, [TENANT_ID]);
  console.log(`💭 シフト希望: ${prefCount.rows[0].count}件`);

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
 * テナント3データをセットアップする（外部から呼び出し可能）
 * @param {object} externalClient - 外部から渡されたデータベースクライアント（オプション）
 */
export async function setupTenant3Data(externalClient = null) {
  console.log('\n📝 テナント3データをセットアップ中...');

  let client = externalClient;
  let shouldReleaseClient = false;
  let shouldCommit = false;

  try {
    // クライアントが渡されていない場合は自分で接続
    if (!client) {
      const localPool = getPool();
      client = await localPool.connect();
      shouldReleaseClient = true;
      shouldCommit = true;
      await client.query('BEGIN');
    }

    // 既存データを削除してクリーンアップ
    await deleteTransactionData(client);
    await deleteMasterData(client);

    // マスターデータを登録
    const masterIds = await registerMasterData(client);

    // シフトデータを登録
    await registerShiftData(client, masterIds);

    if (shouldCommit) {
      await client.query('COMMIT');
    }

    console.log('✅ テナント3データセットアップ完了');

    // サマリー表示
    await showSummary(client);

  } catch (error) {
    if (shouldCommit) {
      await client.query('ROLLBACK');
    }
    console.error('❌ テナント3データセットアップエラー:', error.message);
    throw error;
  } finally {
    if (shouldReleaseClient) {
      client.release();
      if (pool) {
        await pool.end();
      }
    }
  }
}

/**
 * メイン処理（CLIから直接実行する場合）
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
  const localPool = getPool();
  const client = await localPool.connect();
  console.log('✅ データベース接続完了');

  try {
    await client.query('BEGIN');

    if (action === 'delete') {
      await deleteTransactionData(client);
      await deleteMasterData(client);
      console.log('\n✅ テストデータの削除が完了しました');
    } else {
      // setupTenant3Data を使用
      await setupTenant3Data(client);
    }

    await client.query('COMMIT');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ エラーが発生しました:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    if (pool) {
      await pool.end();
    }
  }
}

// 直接実行された場合のみ main() を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
