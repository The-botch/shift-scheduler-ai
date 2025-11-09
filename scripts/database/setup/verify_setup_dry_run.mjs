#!/usr/bin/env node

/**
 * 新しいセットアップスクリプトの検証（ドライラン）
 *
 * トランザクション内で実行し、最後にROLLBACKするため、
 * 現在のデータベースは一切変更されません。
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

async function verifySetup() {
  const client = await pool.connect();

  try {
    console.log('🧪 検証開始（トランザクション内で実行 → 最後にロールバック）\n');
    console.log(`データベース: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}\n`);

    await client.query('BEGIN');

    // ========================================
    // 1. 現在のデータ件数を記録
    // ========================================
    console.log('📊 Step 1: 現在のデータ件数を記録\n');
    const beforeCounts = {};

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
    // 2. 既存データを一時削除
    // ========================================
    console.log('\n🗑️  Step 2: Tenant 3の既存データを削除中...\n');

    // 外部キー制約を考慮した削除順序
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
    // 3. 新しいDMLで登録
    // ========================================
    console.log('\n📥 Step 3: 新しいDMLでデータ登録中...\n');

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
    // 4. 新しいデータ件数を確認
    // ========================================
    console.log('\n📊 Step 4: 新しいデータ件数を確認\n');
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
    // 5. 差分比較
    // ========================================
    console.log('\n📈 Step 5: データ件数の差分\n');
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
    // 6. ロールバック
    // ========================================
    console.log('\n🔄 Step 6: ロールバック中...');
    await client.query('ROLLBACK');

    console.log('✅ ロールバック完了（データベースは元の状態に戻りました）\n');

    // ========================================
    // 7. 結果サマリー
    // ========================================
    if (hasError) {
      console.log('⚠️  警告: データ件数に差分があります');
      console.log('   新しいセットアップスクリプトの内容を確認してください\n');
    } else {
      console.log('✅ 検証成功: データ件数は完全に一致しています');
      console.log('   新しいセットアップスクリプトは正しく動作します\n');
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

verifySetup();
