#!/usr/bin/env node

// Railway PostgreSQL - スキーマ作成とCRUD操作の総合テスト（クリーンアップなし版）
// このスクリプトはテーブルを削除せずに残すため、GUIで確認できます
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway';

async function runTests() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Railway PostgreSQLへ接続中...\n');
    await client.connect();
    console.log('✅ 接続成功！\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // テスト1: スキーマ作成
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📂 テスト1: スキーマ作成');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('1-1. テスト用スキーマ作成中...');
    await client.query('CREATE SCHEMA IF NOT EXISTS test_schema;');
    console.log('  ✅ test_schema 作成成功\n');

    console.log('1-2. 作成したスキーマ確認中...');
    const schemaResult = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name = 'test_schema';
    `);
    console.log(`  ✅ スキーマ確認: ${schemaResult.rows[0].schema_name}\n`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // テスト2: テーブル作成（複数スキーマ）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 テスト2: テーブル作成（複数スキーマ）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 2-1. publicスキーマにテーブル作成
    console.log('2-1. public.users テーブル作成中...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(200) NOT NULL,
        age INT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ public.users 作成成功\n');

    // 2-2. test_schemaにテーブル作成
    console.log('2-2. test_schema.products テーブル作成中...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_schema.products (
        product_id SERIAL PRIMARY KEY,
        product_name VARCHAR(200) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        category VARCHAR(50),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ test_schema.products 作成成功\n');

    // 2-3. test_schemaに別テーブル作成
    console.log('2-3. test_schema.orders テーブル作成中...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_schema.orders (
        order_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        total_amount DECIMAL(12,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        ordered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES test_schema.products(product_id) ON DELETE CASCADE
      );
    `);
    console.log('  ✅ test_schema.orders 作成成功（外部キー制約付き）\n');

    // 2-4. テーブル一覧確認
    console.log('2-4. 作成したテーブル一覧:');
    const tablesResult = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema IN ('public', 'test_schema')
      ORDER BY table_schema, table_name;
    `);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_schema}.${row.table_name}`);
    });
    console.log('');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // テスト3: INSERT（データ挿入）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 テスト3: INSERT（データ挿入）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 3-1. usersテーブルにデータ挿入
    console.log('3-1. public.users にデータ挿入中...');
    const usersInsert = await client.query(`
      INSERT INTO public.users (username, email, age)
      VALUES
        ('alice', 'alice@example.com', 25),
        ('bob', 'bob@example.com', 30),
        ('charlie', 'charlie@example.com', 28)
      RETURNING user_id, username, email;
    `);
    usersInsert.rows.forEach(row => {
      console.log(`  ✅ ID=${row.user_id}: ${row.username} (${row.email})`);
    });
    console.log('');

    // 3-2. productsテーブルにデータ挿入
    console.log('3-2. test_schema.products にデータ挿入中...');
    const productsInsert = await client.query(`
      INSERT INTO test_schema.products (product_name, price, stock, category)
      VALUES
        ('ノートパソコン', 120000.00, 10, '電子機器'),
        ('ワイヤレスマウス', 3500.00, 50, '電子機器'),
        ('キーボード', 8000.00, 30, '電子機器'),
        ('モニター', 45000.00, 15, '電子機器'),
        ('ヘッドホン', 15000.00, 25, '電子機器'),
        ('Webカメラ', 8500.00, 40, '電子機器')
      RETURNING product_id, product_name, price, stock;
    `);
    productsInsert.rows.forEach(row => {
      console.log(`  ✅ ID=${row.product_id}: ${row.product_name} - ¥${row.price} (在庫: ${row.stock})`);
    });
    console.log('');

    // 3-3. ordersテーブルにデータ挿入（リレーション）
    console.log('3-3. test_schema.orders にデータ挿入中（外部キー参照）...');
    const ordersInsert = await client.query(`
      INSERT INTO test_schema.orders (user_id, product_id, quantity, total_amount, status)
      VALUES
        (1, 1, 1, 120000.00, 'COMPLETED'),
        (1, 2, 2, 7000.00, 'COMPLETED'),
        (2, 3, 1, 8000.00, 'PENDING'),
        (2, 5, 1, 15000.00, 'SHIPPED'),
        (3, 4, 1, 45000.00, 'SHIPPED'),
        (3, 6, 2, 17000.00, 'PENDING')
      RETURNING order_id, user_id, product_id, quantity, status;
    `);
    ordersInsert.rows.forEach(row => {
      console.log(`  ✅ 注文ID=${row.order_id}: ユーザー${row.user_id} → 商品${row.product_id} x${row.quantity} (${row.status})`);
    });
    console.log('');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // テスト4: SELECT（データ取得・JOIN）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 テスト4: SELECT（データ取得・JOIN）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 4-1. 単純なSELECT
    console.log('4-1. 全ユーザー取得:');
    const allUsers = await client.query('SELECT * FROM public.users ORDER BY user_id;');
    allUsers.rows.forEach(row => {
      console.log(`  - ${row.username} (${row.email}), 年齢: ${row.age}`);
    });
    console.log('');

    // 4-2. WHERE条件付きSELECT
    console.log('4-2. 価格が10000円以上の商品:');
    const expensiveProducts = await client.query(`
      SELECT product_name, price, stock, is_active
      FROM test_schema.products
      WHERE price >= 10000
      ORDER BY price DESC;
    `);
    expensiveProducts.rows.forEach(row => {
      console.log(`  - ${row.product_name}: ¥${row.price} (在庫: ${row.stock}, アクティブ: ${row.is_active})`);
    });
    console.log('');

    // 4-3. JOIN（複数テーブル結合）
    console.log('4-3. 注文詳細（ユーザー名・商品名・ステータス）:');
    const orderDetails = await client.query(`
      SELECT
        o.order_id,
        u.username,
        p.product_name,
        o.quantity,
        o.total_amount,
        o.status,
        o.ordered_at
      FROM test_schema.orders o
      JOIN public.users u ON o.user_id = u.user_id
      JOIN test_schema.products p ON o.product_id = p.product_id
      ORDER BY o.order_id;
    `);
    orderDetails.rows.forEach(row => {
      console.log(`  - 注文${row.order_id}: ${row.username} が ${row.product_name} x${row.quantity} (¥${row.total_amount}) - ${row.status}`);
    });
    console.log('');

    // 4-4. 集計クエリ
    console.log('4-4. ユーザー別注文集計:');
    const userStats = await client.query(`
      SELECT
        u.username,
        COUNT(o.order_id) as order_count,
        SUM(o.total_amount) as total_spent
      FROM public.users u
      LEFT JOIN test_schema.orders o ON u.user_id = o.user_id
      GROUP BY u.user_id, u.username
      ORDER BY total_spent DESC NULLS LAST;
    `);
    userStats.rows.forEach(row => {
      console.log(`  - ${row.username}: ${row.order_count}件の注文, 合計 ¥${row.total_spent || 0}`);
    });
    console.log('');

    // 4-5. ステータス別集計
    console.log('4-5. 注文ステータス別集計:');
    const statusStats = await client.query(`
      SELECT
        status,
        COUNT(*) as count,
        SUM(total_amount) as total
      FROM test_schema.orders
      GROUP BY status
      ORDER BY count DESC;
    `);
    statusStats.rows.forEach(row => {
      console.log(`  - ${row.status}: ${row.count}件, 合計 ¥${row.total}`);
    });
    console.log('');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 最終確認
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 データベース最終確認');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 全データ件数確認
    const userCount = await client.query('SELECT COUNT(*) FROM public.users;');
    const productCount = await client.query('SELECT COUNT(*) FROM test_schema.products;');
    const orderCount = await client.query('SELECT COUNT(*) FROM test_schema.orders;');

    console.log('データ件数:');
    console.log(`  - public.users: ${userCount.rows[0].count}件`);
    console.log(`  - test_schema.products: ${productCount.rows[0].count}件`);
    console.log(`  - test_schema.orders: ${orderCount.rows[0].count}件`);
    console.log('');

    // 接続情報の表示
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 テスト完了！データはそのまま残しています');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ スキーマ作成: OK');
    console.log('✅ テーブル作成（複数スキーマ）: OK');
    console.log('✅ 外部キー制約: OK');
    console.log('✅ INSERT（データ挿入）: OK');
    console.log('✅ SELECT（データ取得・JOIN・集計）: OK');
    console.log('');
    console.log('📋 作成されたテーブル:');
    console.log('  1. public.users (3件のデータ)');
    console.log('  2. test_schema.products (6件のデータ)');
    console.log('  3. test_schema.orders (6件のデータ)');
    console.log('');
    console.log('🔍 GUIツールで確認してください:');
    console.log('');
    console.log('【接続情報】');
    console.log('  Host: mainline.proxy.rlwy.net');
    console.log('  Port: 50142');
    console.log('  Database: railway');
    console.log('  User: postgres');
    console.log('  Password: gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe');
    console.log('');
    console.log('【確認すべきテーブル】');
    console.log('  - public.users');
    console.log('  - test_schema.products');
    console.log('  - test_schema.orders');
    console.log('');
    console.log('💡 データを削除する場合:');
    console.log('  node scripts/cleanup_test_data.mjs');
    console.log('');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    console.error('');
    console.error('詳細:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 データベース接続を切断しました。');
  }
}

runTests();
