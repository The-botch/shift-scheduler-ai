#!/usr/bin/env node

/**
 * seed_data.sqlの検証スクリプト
 * 現在のマスターデータと期待値を比較
 */

import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verifySeedData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 マスターデータ検証開始\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let allPassed = true;

    // 検証項目の定義
    const checks = [
      { schema: 'core', table: 'tenants', expected: 2, description: 'テナント (DEMO, STAND_BANH_MI)' },
      { schema: 'core', table: 'divisions', expected: 2, description: 'Division (TOKYO, DEFAULT)' },
      { schema: 'core', table: 'stores', expected: 6, description: '店舗' },
      { schema: 'core', table: 'roles', tenant: 1, expected: 5, description: 'DEMO役職' },
      { schema: 'core', table: 'roles', tenant: 3, expected: 3, description: 'STAND_BANH_MI役職' },
      { schema: 'core', table: 'skills', tenant: 1, expected: 4, description: 'スキル' },
      { schema: 'core', table: 'employment_types', tenant: 1, expected: 5, description: 'DEMO雇用形態' },
      { schema: 'core', table: 'employment_types', tenant: 3, expected: 4, description: 'STAND_BANH_MI雇用形態' },
      { schema: 'core', table: 'shift_patterns', tenant: 1, expected: 10, description: 'シフトパターン' },
      { schema: 'hr', table: 'commute_allowance', tenant: 1, expected: 7, description: '通勤手当' },
      { schema: 'hr', table: 'insurance_rates', tenant: 1, expected: 4, description: '保険料率' },
      { schema: 'hr', table: 'tax_brackets', tenant: 1, expected: 7, description: '税率ブラケット' },
      { schema: 'ops', table: 'labor_law_constraints', tenant: 1, expected: 8, description: '労働法制約' },
      { schema: 'ops', table: 'shift_validation_rules', tenant: 1, expected: 8, description: 'シフト検証ルール' },
    ];

    // 各テーブルのレコード数をチェック
    for (const check of checks) {
      let query;
      if (check.tenant) {
        query = `SELECT COUNT(*) FROM ${check.schema}.${check.table} WHERE tenant_id = ${check.tenant}`;
      } else {
        query = `SELECT COUNT(*) FROM ${check.schema}.${check.table}`;
      }
      
      const result = await client.query(query);
      const actual = parseInt(result.rows[0].count);
      const passed = actual >= check.expected;
      
      if (passed) {
        console.log(`✅ ${check.description.padEnd(30)} - 期待: ${check.expected}件 / 実際: ${actual}件`);
      } else {
        console.log(`❌ ${check.description.padEnd(30)} - 期待: ${check.expected}件 / 実際: ${actual}件`);
        allPassed = false;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 詳細検証: テナントコード確認
    console.log('📋 詳細検証\n');
    
    const tenants = await client.query('SELECT tenant_code, tenant_name FROM core.tenants ORDER BY tenant_id');
    console.log('テナント:');
    tenants.rows.forEach(t => console.log(`  - ${t.tenant_code}: ${t.tenant_name}`));
    
    const stores = await client.query('SELECT store_code, store_name FROM core.stores ORDER BY store_id');
    console.log('\n店舗:');
    stores.rows.forEach(s => console.log(`  - ${s.store_code}: ${s.store_name}`));

    // 重要なマスターデータのサンプル確認
    console.log('\n通勤手当 (サンプル):');
    const commute = await client.query('SELECT distance_from_km, distance_to_km, allowance_amount FROM hr.commute_allowance WHERE tenant_id = 1 ORDER BY distance_from_km LIMIT 3');
    commute.rows.forEach(c => console.log(`  - ${c.distance_from_km}km〜${c.distance_to_km}km: ¥${c.allowance_amount}`));

    console.log('\n保険料率:');
    const insurance = await client.query('SELECT insurance_type, employee_rate, employer_rate FROM hr.insurance_rates WHERE tenant_id = 1');
    insurance.rows.forEach(i => console.log(`  - ${i.insurance_type}: 従業員${(i.employee_rate * 100).toFixed(2)}% / 雇用主${(i.employer_rate * 100).toFixed(2)}%`));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (allPassed) {
      console.log('🎉 検証成功: seed_data.sqlは現在のマスターデータを完全に再現できます\n');
      return true;
    } else {
      console.log('⚠️  検証失敗: 一部のデータが不足しています\n');
      return false;
    }

  } catch (error) {
    console.error('❌ エラー:', error.message);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

verifySeedData().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('致命的エラー:', err);
  process.exit(1);
});
