#!/usr/bin/env node
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

const TENANT_ID = 3;

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('📝 不足しているマスタデータの追加（データ削除なし）');
  console.log('='.repeat(70) + '\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 0. テナントの存在確認
    console.log('0️⃣  テナント存在確認中...');
    const tenantCheck = await client.query(`
      SELECT tenant_id FROM core.tenants WHERE tenant_id = $1
    `, [TENANT_ID]);

    if (tenantCheck.rows.length === 0) {
      console.log(`❌ エラー: テナントID ${TENANT_ID} が存在しません`);
      console.log('先に setup_tenant3_test_data.mjs の register を実行してください\n');
      await client.query('ROLLBACK');
      process.exit(1);
    }
    console.log(`✅ テナントID ${TENANT_ID} が存在します\n`);

    // 1. スキーマ更新：通勤距離カラムを追加
    console.log('1️⃣  スキーマ更新中...');
    await client.query('ALTER TABLE hr.staff ADD COLUMN IF NOT EXISTS commute_distance_km NUMERIC(5,2)');
    console.log('✅ 通勤距離カラムを追加しました\n');

    // 2. 保険料率マスタの登録
    console.log('2️⃣  社会保険料率マスタ登録中...');
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

    let insuranceCount = 0;
    for (const rate of insuranceRates) {
      // まず存在チェック
      const checkResult = await client.query(`
        SELECT 1 FROM hr.insurance_rates
        WHERE tenant_id = $1 AND insurance_type = $2 AND effective_from = '2025-01-01'
      `, [TENANT_ID, rate.insurance_type]);

      if (checkResult.rows.length === 0) {
        // 存在しない場合のみ挿入
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
          TENANT_ID,
          rate.insurance_type,
          rate.rate_name,
          rate.employee_rate,
          rate.employer_rate,
          rate.employee_percentage,
          rate.employer_percentage,
          rate.applicable_employment_types
        ]);
        console.log(`  ✅ ${rate.rate_name}: 従業員${rate.employee_percentage}% / 事業主${rate.employer_percentage}%`);
        insuranceCount++;
      } else {
        console.log(`  ⏭️  ${rate.rate_name}: すでに登録済み`);
      }
    }
    console.log(`✅ 社会保険料率マスタ: ${insuranceCount}件追加\n`);

    // 3. 通勤手当マスタの登録
    console.log('3️⃣  通勤手当マスタ登録中...');
    const commuteAllowances = [
      { distance_from_km: 0, distance_to_km: 2, allowance_amount: 0, description: '2km未満' },
      { distance_from_km: 2, distance_to_km: 5, allowance_amount: 3000, description: '2km以上5km未満' },
      { distance_from_km: 5, distance_to_km: 10, allowance_amount: 6000, description: '5km以上10km未満' },
      { distance_from_km: 10, distance_to_km: 15, allowance_amount: 9000, description: '10km以上15km未満' },
      { distance_from_km: 15, distance_to_km: 999, allowance_amount: 12000, description: '15km以上' }
    ];

    let commuteCount = 0;
    for (const allowance of commuteAllowances) {
      // まず存在チェック
      const checkResult = await client.query(`
        SELECT 1 FROM hr.commute_allowance
        WHERE tenant_id = $1 AND distance_from_km = $2 AND distance_to_km = $3
      `, [TENANT_ID, allowance.distance_from_km, allowance.distance_to_km]);

      if (checkResult.rows.length === 0) {
        // 存在しない場合のみ挿入
        await client.query(`
          INSERT INTO hr.commute_allowance (
            tenant_id, distance_from_km, distance_to_km,
            allowance_amount, description, is_active
          )
          VALUES ($1, $2, $3, $4, $5, true)
        `, [
          TENANT_ID,
          allowance.distance_from_km,
          allowance.distance_to_km,
          allowance.allowance_amount,
          allowance.description
        ]);
        console.log(`  ✅ ${allowance.description}: ¥${allowance.allowance_amount.toLocaleString()}`);
        commuteCount++;
      } else {
        console.log(`  ⏭️  ${allowance.description}: すでに登録済み`);
      }
    }
    console.log(`✅ 通勤手当マスタ: ${commuteCount}件追加\n`);

    // 4. スタッフの通勤距離を更新（NULLのものだけ）
    console.log('4️⃣  スタッフの通勤距離更新中...');
    const staffResult = await client.query(`
      SELECT staff_id FROM hr.staff
      WHERE tenant_id = $1 AND commute_distance_km IS NULL
    `, [TENANT_ID]);

    let updatedCount = 0;
    for (const staff of staffResult.rows) {
      // 0km〜20kmの範囲でランダム、0.5km刻み
      const commuteDistance = (Math.floor(Math.random() * 41) * 0.5).toFixed(1);

      await client.query(`
        UPDATE hr.staff
        SET commute_distance_km = $1
        WHERE staff_id = $2
      `, [commuteDistance, staff.staff_id]);

      updatedCount++;
    }
    console.log(`✅ スタッフ通勤距離: ${updatedCount}件更新\n`);

    await client.query('COMMIT');

    console.log('='.repeat(70));
    console.log('✅ 完了');
    console.log('='.repeat(70));
    console.log(`  保険料率マスタ: ${insuranceCount}件追加`);
    console.log(`  通勤手当マスタ: ${commuteCount}件追加`);
    console.log(`  スタッフ通勤距離: ${updatedCount}件更新`);
    console.log('='.repeat(70) + '\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ エラー:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
