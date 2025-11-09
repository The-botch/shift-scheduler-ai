import { query, getPool } from './src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupTenant3Data } from '../scripts/setup/setup_tenant3_test_data.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pool = getPool();

async function runDDLandDML() {
  try {
    console.log('🔄 データベースをクリーンな状態から再構築します...\n');

    // 1. 既存のテーブルを削除
    console.log('📦 既存のテーブルを削除中...');
    await query(`DROP SCHEMA IF EXISTS core CASCADE;`);
    await query(`DROP SCHEMA IF EXISTS hr CASCADE;`);
    await query(`DROP SCHEMA IF EXISTS ops CASCADE;`);
    await query(`DROP SCHEMA IF EXISTS analytics CASCADE;`);
    console.log('✅ 既存のテーブルを削除しました\n');

    // 2. DDL（スキーマ）を実行
    console.log('🏗️  DDL（スキーマ）を実行中...');
    const ddlPath = path.join(__dirname, '../scripts/setup/schema.sql');
    const ddlSQL = fs.readFileSync(ddlPath, 'utf8');

    // ファイル全体を一度に実行
    await query(ddlSQL);
    console.log('✅ DDL実行完了\n');

    // 3. マスターデータ投入
    console.log('📝 マスターデータを実行中...');
    const seedDataPath = path.join(__dirname, '../scripts/setup/seed_data_simple.sql');
    const seedDataSQL = fs.readFileSync(seedDataPath, 'utf8');
    await query(seedDataSQL);
    console.log('✅ マスターデータ実行完了\n');

    // 4. スタッフデータ投入（全テナント）
    console.log('📝 スタッフデータを実行中...');
    const staffDataPath = path.join(__dirname, '../scripts/setup/seed_staff_data.sql');
    const staffDataSQL = fs.readFileSync(staffDataPath, 'utf8');
    await query(staffDataSQL);
    console.log('✅ スタッフデータ実行完了\n');

    // 5. トランザクションデータ投入（テナント1のみ）
    console.log('📝 トランザクションデータ（テナント1）を実行中...');
    const transDataPath = path.join(__dirname, '../scripts/setup/seed_transaction_data_tenant1_only.sql');
    const transDataSQL = fs.readFileSync(transDataPath, 'utf8');
    await query(transDataSQL);
    console.log('✅ トランザクションデータ（テナント1）実行完了\n');

    // 6. テナント3データ投入（CSVからスタッフとシフトを自動生成）
    try {
      const client = await pool.connect();
      try {
        await setupTenant3Data(client);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('⚠️  テナント3データのセットアップでエラーが発生しました:', error.message);
      console.error(error.stack);
    }

    // 7. 確認
    console.log('🔍 データ確認中...');

    // スタッフデータ確認（テナント別・雇用形態別）
    const staffByTenant = await query(`
      SELECT
        t.tenant_id,
        t.tenant_name,
        COUNT(*) as total,
        SUM(CASE WHEN s.employment_type = 'FULL_TIME' THEN 1 ELSE 0 END) as full_time,
        SUM(CASE WHEN s.employment_type = 'PART_TIME' THEN 1 ELSE 0 END) as part_time,
        SUM(CASE WHEN s.is_active = true THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN s.is_active = false THEN 1 ELSE 0 END) as inactive
      FROM hr.staff s
      JOIN core.tenants t ON s.tenant_id = t.tenant_id
      GROUP BY t.tenant_id, t.tenant_name
      ORDER BY t.tenant_id
    `);
    console.log('\n👥 スタッフデータ (テナント別):');
    staffByTenant.rows.forEach(row => {
      console.log(`   ${row.tenant_name} (テナント${row.tenant_id}): ${row.total}名`);
      console.log(`     - 正社員: ${row.full_time}名, アルバイト: ${row.part_time}名`);
      console.log(`     - 在籍: ${row.active}名, 退職: ${row.inactive}名`);
    });

    const totalStaff = await query(`SELECT COUNT(*) as total FROM hr.staff`);
    console.log(`\n✅ スタッフ総数: ${totalStaff.rows[0].total}名`);

    // シフト計画確認（テナント別）
    const plansByTenant = await query(`
      SELECT
        tenant_id,
        plan_year,
        plan_month,
        COUNT(*) as plan_count,
        array_agg(DISTINCT plan_type) as plan_types,
        array_agg(DISTINCT status) as statuses
      FROM ops.shift_plans
      GROUP BY tenant_id, plan_year, plan_month
      ORDER BY tenant_id, plan_year, plan_month
    `);

    console.log('\n📅 シフト計画 (テナント別):');
    console.table(plansByTenant.rows);

    const totalPlans = await query(`SELECT COUNT(*) as total FROM ops.shift_plans`);
    console.log(`\n✅ シフト計画総数: ${totalPlans.rows[0].total}件`);

    // シフト実績確認（テナント別）
    const shiftsByTenant = await query(`
      SELECT tenant_id, COUNT(*) as total
      FROM ops.shifts
      GROUP BY tenant_id
      ORDER BY tenant_id
    `);
    console.log('\n🔄 シフト実績 (テナント別):');
    shiftsByTenant.rows.forEach(row => {
      console.log(`   テナント${row.tenant_id}: ${row.total}件`);
    });

    const totalShifts = await query(`SELECT COUNT(*) as total FROM ops.shifts`);
    console.log(`\n✅ シフト実績総数: ${totalShifts.rows[0].total}件`);

    console.log('\n🎉 DDL/DML実行完了！');
    process.exit(0);
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

runDDLandDML();
