#!/usr/bin/env node

// テストデータのクリーンアップスクリプト
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway';

async function cleanup() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Railway PostgreSQLへ接続中...\n');
    await client.connect();
    console.log('✅ 接続成功！\n');

    console.log('🧹 テストデータのクリーンアップを開始します...\n');

    // 削除前にデータ確認
    console.log('📊 削除前のデータ確認:');
    const userCount = await client.query('SELECT COUNT(*) FROM public.users;').catch(() => ({ rows: [{ count: 0 }] }));
    const productCount = await client.query('SELECT COUNT(*) FROM test_schema.products;').catch(() => ({ rows: [{ count: 0 }] }));
    const orderCount = await client.query('SELECT COUNT(*) FROM test_schema.orders;').catch(() => ({ rows: [{ count: 0 }] }));

    console.log(`  - public.users: ${userCount.rows[0].count}件`);
    console.log(`  - test_schema.products: ${productCount.rows[0].count}件`);
    console.log(`  - test_schema.orders: ${orderCount.rows[0].count}件`);
    console.log('');

    // テーブル削除
    console.log('🗑️  テーブル削除中...');

    try {
      await client.query('DROP TABLE IF EXISTS test_schema.orders CASCADE;');
      console.log('  ✅ test_schema.orders 削除');
    } catch (e) {
      console.log('  ⚠️  test_schema.orders は存在しません');
    }

    try {
      await client.query('DROP TABLE IF EXISTS test_schema.products CASCADE;');
      console.log('  ✅ test_schema.products 削除');
    } catch (e) {
      console.log('  ⚠️  test_schema.products は存在しません');
    }

    try {
      await client.query('DROP TABLE IF EXISTS public.users CASCADE;');
      console.log('  ✅ public.users 削除');
    } catch (e) {
      console.log('  ⚠️  public.users は存在しません');
    }

    try {
      await client.query('DROP SCHEMA IF EXISTS test_schema CASCADE;');
      console.log('  ✅ test_schema スキーマ削除');
    } catch (e) {
      console.log('  ⚠️  test_schema スキーマは存在しません');
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ クリーンアップ完了！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('データベースはクリーンな状態に戻りました。');

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

cleanup();
