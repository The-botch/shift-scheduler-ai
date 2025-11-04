#!/usr/bin/env node

/**
 * スタッフデータ修正を実行（重複削除+デフォルト店舗反映）
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway';

async function applyStaffFixes() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 データベースへ接続中...\n');
    await client.connect();
    console.log('✅ 接続成功！\n');

    // SQLファイルを読み込む
    const sqlPath = path.join(__dirname, 'fix_staff_data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 スタッフデータ修正を実行');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 実行内容:');
    console.log('  1. 重複スタッフの統合（7組）');
    console.log('  2. デフォルト店舗の修正（29名）\n');

    // 実行前の状態を確認
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 実行前の状態');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const beforeCount = await client.query(`
      SELECT COUNT(*) as count
      FROM hr.staff
      WHERE tenant_id = 3 AND is_active = TRUE
    `);
    console.log(`アクティブなスタッフ数: ${beforeCount.rows[0].count}名\n`);

    const beforeStores = await client.query(`
      SELECT
        s.store_id,
        st.store_name,
        COUNT(*) as staff_count
      FROM hr.staff s
      LEFT JOIN core.stores st ON s.store_id = st.store_id
      WHERE s.tenant_id = 3 AND s.is_active = TRUE
      GROUP BY s.store_id, st.store_name
      ORDER BY s.store_id
    `);

    console.log('店舗別スタッフ数:');
    for (const row of beforeStores.rows) {
      console.log(`  ${row.store_name || '不明'}: ${row.staff_count}名`);
    }
    console.log('');

    // SQLを実行
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️  SQL実行中...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await client.query(sql);

    console.log('✅ SQL実行完了！\n');

    // 実行後の状態を確認
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 実行後の状態');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const afterCount = await client.query(`
      SELECT COUNT(*) as count
      FROM hr.staff
      WHERE tenant_id = 3 AND is_active = TRUE
    `);
    console.log(`アクティブなスタッフ数: ${afterCount.rows[0].count}名\n`);

    const afterStores = await client.query(`
      SELECT
        s.store_id,
        st.store_name,
        COUNT(*) as staff_count
      FROM hr.staff s
      LEFT JOIN core.stores st ON s.store_id = st.store_id
      WHERE s.tenant_id = 3 AND s.is_active = TRUE
      GROUP BY s.store_id, st.store_name
      ORDER BY s.store_id
    `);

    console.log('店舗別スタッフ数:');
    for (const row of afterStores.rows) {
      console.log(`  ${row.store_name || '不明'}: ${row.staff_count}名`);
    }
    console.log('');

    // サマリー
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 サマリー');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const deletedCount = parseInt(beforeCount.rows[0].count) - parseInt(afterCount.rows[0].count);
    console.log(`統合されたスタッフ数: ${deletedCount}名`);
    console.log(`残存スタッフ数: ${afterCount.rows[0].count}名`);
    console.log('');
    console.log('✅ スタッフデータ修正が完了しました！\n');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    await client.end();
  }
}

applyStaffFixes();
