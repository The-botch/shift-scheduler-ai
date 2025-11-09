#!/usr/bin/env node

import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../backend/.env') });

const { Pool } = pkg;
const TENANT_ID = 3;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

async function verifyTestData() {
  const client = await pool.connect();

  try {
    console.log('🧪 テストデータスクリプト検証開始（トランザクション内で実行 → ロールバック）\n');

    await client.query('BEGIN');

    // 1. 現在のデータ件数を記録
    console.log('📊 Step 1: 現在のデータ件数を記録\n');
    
    const beforeStaff = await client.query('SELECT COUNT(*) FROM hr.staff WHERE tenant_id = $1', [TENANT_ID]);
    const beforeShifts = await client.query('SELECT COUNT(*) FROM ops.shifts WHERE tenant_id = $1', [TENANT_ID]);
    const beforePlans = await client.query('SELECT COUNT(*) FROM ops.shift_plans WHERE tenant_id = $1', [TENANT_ID]);

    console.log(`  hr.staff: ${beforeStaff.rows[0].count}件`);
    console.log(`  ops.shifts: ${beforeShifts.rows[0].count}件`);
    console.log(`  ops.shift_plans: ${beforePlans.rows[0].count}件`);

    // 2. テストデータを削除
    console.log('\n🗑️  Step 2: テストデータを削除中...\n');
    
    await client.query('DELETE FROM ops.shifts WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM ops.shift_plans WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM hr.staff WHERE tenant_id = $1', [TENANT_ID]);
    
    console.log('  ✅ 削除完了');

    // 3. setup_tenant3_test_data.mjsをインポートして実行
    console.log('\n📥 Step 3: setup_tenant3_test_data.mjsを実行中...\n');
    
    const { setupTenant3Data } = await import('./setup_tenant3_test_data.mjs');
    await setupTenant3Data(client); // トランザクション内で実行

    // 4. 新しいデータ件数を確認
    console.log('\n📊 Step 4: 新しいデータ件数を確認\n');
    
    const afterStaff = await client.query('SELECT COUNT(*) FROM hr.staff WHERE tenant_id = $1', [TENANT_ID]);
    const afterShifts = await client.query('SELECT COUNT(*) FROM ops.shifts WHERE tenant_id = $1', [TENANT_ID]);
    const afterPlans = await client.query('SELECT COUNT(*) FROM ops.shift_plans WHERE tenant_id = $1', [TENANT_ID]);

    console.log(`  hr.staff: ${afterStaff.rows[0].count}件`);
    console.log(`  ops.shifts: ${afterShifts.rows[0].count}件`);
    console.log(`  ops.shift_plans: ${afterPlans.rows[0].count}件`);

    // 5. 差分比較
    console.log('\n📈 Step 5: データ件数の差分\n');
    
    const staffDiff = parseInt(afterStaff.rows[0].count) - parseInt(beforeStaff.rows[0].count);
    const shiftsDiff = parseInt(afterShifts.rows[0].count) - parseInt(beforeShifts.rows[0].count);
    const plansDiff = parseInt(afterPlans.rows[0].count) - parseInt(beforePlans.rows[0].count);

    const staffSymbol = staffDiff === 0 ? '✅' : '⚠️';
    const shiftsSymbol = shiftsDiff === 0 ? '✅' : '⚠️';
    const plansSymbol = plansDiff === 0 ? '✅' : '⚠️';

    console.log(`  ${staffSymbol} hr.staff: ${beforeStaff.rows[0].count} → ${afterStaff.rows[0].count} (差分: ${staffDiff > 0 ? '+' : ''}${staffDiff})`);
    console.log(`  ${shiftsSymbol} ops.shifts: ${beforeShifts.rows[0].count} → ${afterShifts.rows[0].count} (差分: ${shiftsDiff > 0 ? '+' : ''}${shiftsDiff})`);
    console.log(`  ${plansSymbol} ops.shift_plans: ${beforePlans.rows[0].count} → ${afterPlans.rows[0].count} (差分: ${plansDiff > 0 ? '+' : ''}${plansDiff})`);

    // 6. ロールバック
    console.log('\n🔄 Step 6: ロールバック中...');
    await client.query('ROLLBACK');
    console.log('✅ ロールバック完了（データベースは元の状態に戻りました）\n');

    // 7. 結果サマリー
    if (staffDiff === 0 && shiftsDiff === 0 && plansDiff === 0) {
      console.log('✅ 検証成功: データ件数は完全に一致しています');
      console.log('   setup_tenant3_test_data.mjsは正しく動作します\n');
    } else {
      console.log('⚠️  警告: データ件数に差分があります');
      console.log('   setup_tenant3_test_data.mjsの内容を確認してください\n');
    }

  } catch (error) {
    console.error('\n❌ エラー発生:', error.message);
    await client.query('ROLLBACK');
    console.log('🔄 ロールバック完了（データベースは元の状態に戻りました）\n');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyTestData();
