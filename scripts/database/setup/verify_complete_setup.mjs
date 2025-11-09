#!/usr/bin/env node

/**
 * 完全セットアップ検証スクリプト（トランザクション内で実行 → ROLLBACK）
 * 
 * DML + setup_tenant3_test_data.mjs を実行して、
 * 本番と同じデータが作られるか確認します。
 */

import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../backend/.env') });

const { Pool } = pkg;
const TENANT_ID = 3;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

async function verifyCompleteSetup() {
  const client = await pool.connect();

  try {
    console.log('🧪 完全セットアップ検証開始（トランザクション内で実行 → ROLLBACK）\n');
    console.log(`データベース: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}\n`);

    await client.query('BEGIN');

    // ========================================
    // 1. 現在のデータ件数を記録
    // ========================================
    console.log('📊 Step 1: 現在のデータ件数を記録\n');
    
    const tables = [
      { schema: 'core', table: 'tenants' },
      { schema: 'core', table: 'divisions' },
      { schema: 'core', table: 'stores' },
      { schema: 'core', table: 'roles' },
      { schema: 'core', table: 'skills' },
      { schema: 'core', table: 'employment_types' },
      { schema: 'hr', table: 'staff' },
      { schema: 'hr', table: 'tax_brackets' },
      { schema: 'ops', table: 'labor_law_constraints' },
      { schema: 'ops', table: 'labor_management_rules' },
      { schema: 'ops', table: 'store_constraints' },
      { schema: 'ops', table: 'shift_validation_rules' },
      { schema: 'ops', table: 'shift_plans' },
      { schema: 'ops', table: 'shifts' }
    ];

    const beforeCounts = {};
    for (const { schema, table } of tables) {
      const fullTable = `${schema}.${table}`;
      const result = await client.query(
        `SELECT COUNT(*) as count FROM ${fullTable} WHERE tenant_id = $1`,
        [TENANT_ID]
      );
      beforeCounts[fullTable] = parseInt(result.rows[0].count);
      console.log(`  ${fullTable}: ${beforeCounts[fullTable]}件`);
    }

    // ========================================
    // 2. 既存データを削除
    // ========================================
    console.log('\n🗑️  Step 2: Tenant 3の既存データを削除中...\n');
    
    await client.query('DELETE FROM ops.shifts WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM ops.shift_plans WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM ops.shift_validation_rules WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM ops.store_constraints WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM ops.labor_management_rules WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM ops.labor_law_constraints WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM hr.staff WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM hr.tax_brackets WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM core.stores WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM core.employment_types WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM core.skills WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM core.roles WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM core.divisions WHERE tenant_id = $1', [TENANT_ID]);
    await client.query('DELETE FROM core.tenants WHERE tenant_id = $1', [TENANT_ID]);
    
    console.log('  ✅ 削除完了');

    // ========================================
    // 3. DMLファイルを実行
    // ========================================
    console.log('\n📥 Step 3: DMLファイルでマスターデータ登録中...\n');
    
    const dmlFiles = [
      '../dml/01_core_master.sql',
      '../dml/02_hr_master.sql',
      '../dml/03_ops_master.sql'
    ];

    for (const file of dmlFiles) {
      const filePath = path.resolve(__dirname, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      try {
        await client.query(sql);
        console.log(`  ✅ ${path.basename(file)}`);
      } catch (error) {
        console.log(`  ❌ ${path.basename(file)}: ${error.message}`);
        throw error;
      }
    }

    // ========================================
    // 4. setup_tenant3_test_data.mjsを実行
    // ========================================
    console.log('\n📥 Step 4: setup_tenant3_test_data.mjsでテストデータ登録中...\n');
    
    // スクリプトをインポート
    const scriptPath = path.resolve(__dirname, './setup_tenant3_test_data.mjs');
    const module = await import(`file://${scriptPath}`);
    
    // setupTenant3Data関数を呼び出し（clientを渡してトランザクション内で実行）
    if (module.setupTenant3Data) {
      await module.setupTenant3Data(client);
      console.log('  ✅ setup_tenant3_test_data.mjs 完了');
    } else {
      console.log('  ⚠️  setupTenant3Data関数が見つかりません');
    }

    // ========================================
    // 5. 新しいデータ件数を確認
    // ========================================
    console.log('\n📊 Step 5: 新しいデータ件数を確認\n');
    
    const afterCounts = {};
    for (const { schema, table } of tables) {
      const fullTable = `${schema}.${table}`;
      const result = await client.query(
        `SELECT COUNT(*) as count FROM ${fullTable} WHERE tenant_id = $1`,
        [TENANT_ID]
      );
      afterCounts[fullTable] = parseInt(result.rows[0].count);
      console.log(`  ${fullTable}: ${afterCounts[fullTable]}件`);
    }

    // ========================================
    // 6. 差分比較
    // ========================================
    console.log('\n📈 Step 6: データ件数の差分\n');
    
    let hasError = false;
    for (const { schema, table } of tables) {
      const fullTable = `${schema}.${table}`;
      const before = beforeCounts[fullTable];
      const after = afterCounts[fullTable];
      const diff = after - before;

      let symbol = '✅';
      if (diff !== 0) {
        symbol = '⚠️';
        hasError = true;
      }

      console.log(`  ${symbol} ${fullTable}: ${before} → ${after} (差分: ${diff > 0 ? '+' : ''}${diff})`);
    }

    // ========================================
    // 7. ロールバック
    // ========================================
    console.log('\n🔄 Step 7: ロールバック中...');
    await client.query('ROLLBACK');
    console.log('✅ ロールバック完了（データベースは元の状態に戻りました）\n');

    // ========================================
    // 8. 結果サマリー
    // ========================================
    if (hasError) {
      console.log('⚠️  警告: データ件数に差分があります');
      console.log('   セットアップスクリプトの内容を確認してください\n');
    } else {
      console.log('✅ 検証成功: データ件数は完全に一致しています');
      console.log('   セットアップスクリプトは本番と同じデータを作成できます\n');
    }

  } catch (error) {
    console.error('\n❌ エラー発生:', error.message);
    console.error(error.stack);
    await client.query('ROLLBACK');
    console.log('🔄 ロールバック完了（データベースは元の状態に戻りました）\n');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyCompleteSetup();
