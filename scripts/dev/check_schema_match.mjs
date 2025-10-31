#!/usr/bin/env node

/**
 * 実際のDBスキーマとschema.sqlの整合性チェック
 *
 * 実行方法:
 * export DATABASE_URL="postgresql://user:password@host:port/database"
 * node scripts/check_schema_match.mjs
 */

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ エラー: DATABASE_URL環境変数が設定されていません');
  console.error('');
  console.error('使用方法:');
  console.error('  export DATABASE_URL="postgresql://user:password@host:port/database"');
  console.error('  node scripts/check_schema_match.mjs');
  console.error('');
  process.exit(1);
}

async function checkSchemaMatch() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 データベースへ接続中...\n');
    await client.connect();
    console.log('✅ 接続成功！\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 実際のDBスキーマ確認');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 全テーブル一覧取得
    const tablesResult = await client.query(`
      SELECT
        schemaname,
        tablename
      FROM pg_tables
      WHERE schemaname IN ('core', 'hr', 'ops', 'analytics', 'audit')
      ORDER BY schemaname, tablename;
    `);

    console.log('=== 実際のDBテーブル一覧 ===\n');

    const tablesBySchema = {};
    for (const row of tablesResult.rows) {
      if (!tablesBySchema[row.schemaname]) {
        tablesBySchema[row.schemaname] = [];
      }
      tablesBySchema[row.schemaname].push(row.tablename);
    }

    for (const [schema, tables] of Object.entries(tablesBySchema)) {
      console.log(`${schema}スキーマ (${tables.length}テーブル):`);
      tables.forEach(table => console.log(`  - ${schema}.${table}`));
      console.log('');
    }

    console.log(`合計: ${tablesResult.rows.length}テーブル\n`);

    // 各テーブルのカラム情報取得
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 テーブル詳細情報');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const row of tablesResult.rows) {
      const columnsResult = await client.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position;
      `, [row.schemaname, row.tablename]);

      console.log(`\n${row.schemaname}.${row.tablename}:`);
      console.log('  カラム数:', columnsResult.rows.length);

      for (const col of columnsResult.rows) {
        let typeInfo = col.data_type;
        if (col.character_maximum_length) {
          typeInfo += `(${col.character_maximum_length})`;
        }
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`    ${col.column_name}: ${typeInfo} ${nullable}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ スキーマ確認完了');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // schema.sqlとの比較用に期待されるテーブルリスト
    const expectedTables = {
      core: ['tenants', 'divisions', 'stores', 'roles', 'skills', 'employment_types', 'shift_patterns'],
      hr: ['staff', 'staff_skills', 'staff_certifications', 'commute_allowance', 'insurance_rates', 'tax_brackets'],
      ops: ['labor_law_constraints', 'labor_management_rules', 'store_constraints', 'shift_validation_rules']
    };

    console.log('=== schema.sqlとの差分チェック ===\n');

    let hasDiscrepancy = false;

    for (const [schema, expectedTableList] of Object.entries(expectedTables)) {
      const actualTables = tablesBySchema[schema] || [];

      // 期待されるが存在しないテーブル
      const missing = expectedTableList.filter(t => !actualTables.includes(t));
      if (missing.length > 0) {
        console.log(`❌ ${schema}スキーマに不足: ${missing.join(', ')}`);
        hasDiscrepancy = true;
      }

      // 存在するが期待されていないテーブル
      const extra = actualTables.filter(t => !expectedTableList.includes(t));
      if (extra.length > 0) {
        console.log(`⚠️  ${schema}スキーマに余分: ${extra.join(', ')}`);
        hasDiscrepancy = true;
      }

      if (missing.length === 0 && extra.length === 0) {
        console.log(`✅ ${schema}スキーマ: 完全一致`);
      }
    }

    if (!hasDiscrepancy) {
      console.log('\n🎉 実際のDBとschema.sqlは完全に一致しています！');
    } else {
      console.log('\n⚠️  実際のDBとschema.sqlに差分があります');
    }

  } catch (error) {
    console.error('❌ エラー発生:', error.message);
    console.error('詳細:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 接続切断');
  }
}

checkSchemaMatch();
