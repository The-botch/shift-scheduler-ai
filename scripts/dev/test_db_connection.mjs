#!/usr/bin/env node

// Railway PostgreSQL接続テストスクリプト
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway';

async function testConnection() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Railway PostgreSQLへ接続中...\n');
    await client.connect();
    console.log('✅ 接続成功！\n');

    // PostgreSQLバージョン確認
    console.log('📊 データベース情報:');
    const versionResult = await client.query('SELECT version();');
    console.log(`  PostgreSQL Version: ${versionResult.rows[0].version}\n`);

    // 既存スキーマ確認
    console.log('📂 既存スキーマ一覧:');
    const schemaResult = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name;
    `);
    schemaResult.rows.forEach(row => {
      console.log(`  - ${row.schema_name}`);
    });
    console.log('');

    // publicスキーマのテーブル数確認
    console.log('📋 publicスキーマのテーブル数:');
    const tableCountResult = await client.query(`
      SELECT COUNT(*)
      FROM information_schema.tables
      WHERE table_schema = 'public';
    `);
    console.log(`  ${tableCountResult.rows[0].count} テーブル\n`);

    // publicスキーマのテーブル一覧
    if (parseInt(tableCountResult.rows[0].count) > 0) {
      console.log('📋 publicスキーマのテーブル一覧:');
      const tablesResult = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      console.log('');
    }

    // テスト用テーブル作成
    console.log('🧪 テスト用テーブル作成中...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ テーブル作成成功\n');

    // データ挿入（CREATE）
    console.log('📝 テストデータ挿入中...');
    const insertResult = await client.query(`
      INSERT INTO test_connection (message)
      VALUES ('Railway接続テスト成功！'), ('マルチテナント構築準備完了')
      RETURNING id, message, created_at;
    `);
    insertResult.rows.forEach(row => {
      console.log(`  ✅ ID=${row.id}: ${row.message} (${row.created_at})`);
    });
    console.log('');

    // データ取得（READ）
    console.log('🔍 全データ取得中...');
    const selectResult = await client.query(`
      SELECT id, message, created_at
      FROM test_connection
      ORDER BY id;
    `);
    console.log(`  取得件数: ${selectResult.rows.length}件`);
    selectResult.rows.forEach(row => {
      console.log(`  - ID=${row.id}: ${row.message}`);
    });
    console.log('');

    // データ更新（UPDATE）
    console.log('✏️  データ更新中...');
    const updateResult = await client.query(`
      UPDATE test_connection
      SET message = message || ' [更新済み]'
      WHERE id = 1
      RETURNING id, message;
    `);
    console.log(`  ✅ 更新成功: ${updateResult.rows[0].message}\n`);

    // データ削除（DELETE）
    console.log('🗑️  データ削除中...');
    const deleteResult = await client.query(`
      DELETE FROM test_connection
      WHERE id = 2
      RETURNING id, message;
    `);
    console.log(`  ✅ 削除成功: ID=${deleteResult.rows[0].id}\n`);

    // 最終データ確認
    console.log('🔍 最終データ確認:');
    const finalResult = await client.query(`
      SELECT id, message, created_at
      FROM test_connection
      ORDER BY id;
    `);
    console.log(`  残存データ: ${finalResult.rows.length}件`);
    finalResult.rows.forEach(row => {
      console.log(`  - ID=${row.id}: ${row.message}`);
    });
    console.log('');

    // テストテーブル削除
    console.log('🧹 テストテーブル削除中...');
    await client.query('DROP TABLE test_connection;');
    console.log('✅ テストテーブル削除完了\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 すべてのテストが成功しました！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ 接続確認: OK');
    console.log('✅ CREATE (テーブル作成): OK');
    console.log('✅ INSERT (データ挿入): OK');
    console.log('✅ SELECT (データ取得): OK');
    console.log('✅ UPDATE (データ更新): OK');
    console.log('✅ DELETE (データ削除): OK');
    console.log('✅ DROP (テーブル削除): OK');
    console.log('');
    console.log('🚀 マルチテナント構築の準備が整いました！');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error('');
    console.error('詳細:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('');
    console.log('🔌 データベース接続を切断しました。');
  }
}

testConnection();
