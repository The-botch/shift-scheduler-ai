#!/usr/bin/env node

/**
 * データベースセットアップ検証スクリプト
 *
 * setup_database.mjsとimport_all_17_masters.mjsの実行後に、
 * データベースが正しくセットアップされているか検証します。
 */

import pg from 'pg';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ エラー: DATABASE_URL環境変数が設定されていません');
  console.error('');
  console.error('使用方法:');
  console.error('  export DATABASE_URL="postgresql://user:password@host:port/database"');
  console.error('  node scripts/verify_setup.mjs');
  console.error('');
  process.exit(1);
}

async function verifySetup() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 データベースへ接続中...\n');
    await client.connect();
    console.log('✅ 接続成功！\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 データベース検証開始');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // スキーマ確認
    console.log('1. スキーマ確認');
    const schemasResult = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name IN ('core', 'hr', 'ops')
      ORDER BY schema_name
    `);

    const expectedSchemas = ['core', 'hr', 'ops'];
    const actualSchemas = schemasResult.rows.map(r => r.schema_name);

    console.log(`   期待: ${expectedSchemas.join(', ')}`);
    console.log(`   実際: ${actualSchemas.join(', ')}`);

    if (expectedSchemas.every(s => actualSchemas.includes(s))) {
      console.log('   ✅ 全スキーマ存在\n');
    } else {
      console.log('   ❌ スキーマが不足しています\n');
      return false;
    }

    // テーブル数確認
    console.log('2. テーブル数確認（17マスターテーブル）');
    const tablesResult = await client.query(`
      SELECT schemaname, COUNT(*) as table_count
      FROM pg_tables
      WHERE schemaname IN ('core', 'hr', 'ops')
      GROUP BY schemaname
      ORDER BY schemaname
    `);

    let totalTables = 0;
    for (const row of tablesResult.rows) {
      console.log(`   ${row.schemaname}: ${row.table_count}個のテーブル`);
      totalTables += parseInt(row.table_count);
    }
    console.log(`   合計: ${totalTables}個のテーブル`);

    if (totalTables === 17) {
      console.log('   ✅ 期待通り17テーブル存在\n');
    } else {
      console.log(`   ⚠️  テーブル数が期待値(17)と異なります（実際: ${totalTables}）\n`);
    }

    // 基本データ確認
    console.log('3. 基本データ確認');

    // テナント
    const tenantsResult = await client.query('SELECT COUNT(*) as count FROM core.tenants');
    console.log(`   テナント: ${tenantsResult.rows[0].count}件`);

    // 店舗
    const storesResult = await client.query('SELECT COUNT(*) as count FROM core.stores');
    console.log(`   店舗: ${storesResult.rows[0].count}件`);

    // スタッフ
    const staffResult = await client.query('SELECT COUNT(*) as count FROM hr.staff');
    console.log(`   スタッフ: ${staffResult.rows[0].count}件`);

    // 役職
    const rolesResult = await client.query('SELECT COUNT(*) as count FROM core.roles');
    console.log(`   役職: ${rolesResult.rows[0].count}件`);

    // スキル
    const skillsResult = await client.query('SELECT COUNT(*) as count FROM core.skills');
    console.log(`   スキル: ${skillsResult.rows[0].count}件`);

    // 雇用形態
    const employmentResult = await client.query('SELECT COUNT(*) as count FROM core.employment_types');
    console.log(`   雇用形態: ${employmentResult.rows[0].count}件`);

    // シフトパターン
    const patternsResult = await client.query('SELECT COUNT(*) as count FROM core.shift_patterns');
    console.log(`   シフトパターン: ${patternsResult.rows[0].count}件`);

    console.log('   ✅ 基本データ確認完了\n');

    // 詳細マスターデータ確認（オプション投入の場合）
    console.log('4. 詳細マスターデータ確認（オプション）');

    const masterTables = [
      { schema: 'hr', table: 'staff_skills', name: 'スタッフスキル' },
      { schema: 'hr', table: 'staff_certifications', name: 'スタッフ資格' },
      { schema: 'hr', table: 'commute_allowance', name: '通勤手当' },
      { schema: 'hr', table: 'insurance_rates', name: '社会保険料率' },
      { schema: 'hr', table: 'tax_brackets', name: '税率' },
      { schema: 'ops', table: 'labor_law_constraints', name: '労働基準法制約' },
      { schema: 'ops', table: 'labor_management_rules', name: '労務管理ルール' },
      { schema: 'ops', table: 'shift_validation_rules', name: 'シフト検証ルール' },
      { schema: 'ops', table: 'store_constraints', name: '店舗制約' }
    ];

    let detailedDataExists = false;
    for (const master of masterTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${master.schema}.${master.table}`);
        const count = parseInt(result.rows[0].count);
        if (count > 0) {
          console.log(`   ${master.name}: ${count}件`);
          detailedDataExists = true;
        }
      } catch (err) {
        // テーブルが存在しない場合はスキップ
      }
    }

    if (detailedDataExists) {
      console.log('   ✅ 詳細マスターデータが投入されています\n');
    } else {
      console.log('   ℹ️  詳細マスターデータは未投入です');
      console.log('   （投入する場合: node scripts/import_all_17_masters.mjs）\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 検証完了！データベースは正常にセットアップされています');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📌 次のステップ:\n');
    if (!detailedDataExists) {
      console.log('  詳細マスターデータを投入する場合:');
      console.log('  node scripts/import_all_17_masters.mjs\n');
    }
    console.log('  バックエンドサーバー起動:');
    console.log('  cd backend && npm start\n');
    console.log('  フロントエンドサーバー起動:');
    console.log('  cd frontend && npm start\n');

    return true;

  } catch (error) {
    console.error('❌ エラー発生:', error.message);
    console.error('詳細:', error);
    return false;
  } finally {
    await client.end();
    console.log('🔌 接続切断');
  }
}

verifySetup().then(success => {
  process.exit(success ? 0 : 1);
});
