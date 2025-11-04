#!/usr/bin/env node

/**
 * スタッフの在籍状況を更新するスクリプト
 * 各店舗の現在在籍しているスタッフのみをアクティブに保ち、
 * それ以外は退職扱い(is_active = FALSE)にする
 */

import pg from 'pg';

const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway';

async function updateStaffStatus() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 データベースへ接続中...\n');
    await client.connect();
    console.log('✅ 接続成功！\n');

    // 現在在籍しているスタッフのリスト（店舗別）
    const activeStaffByStore = {
      '学大 (Stand Banh Mi)': [
        '篠原喬人', '佐藤孝仁', '北村卓也', '梶尾真紀',
        '高田久瑠美', '佐伯結香', '吉田莉乃', '中山美和', '橋本勇人'
      ],
      '自由ヶ丘 (Atelier)': [
        '武根太一', 'サー', '秋元梢', '篠原喬人',
        '本村めい', '松本佳奈', '藤井杉子', '吉田知世',
        '甲木由紀', 'グエン', '吉田瑛里'
      ],
      '祐天寺 (Stand Bo Bun)': [
        '吉原将郎', '五十嵐ティン', '佐伯結香',
        '相模純平', '佐々美音'
      ],
      '麻布台 (COME 麻布台)': [
        '中谷晋', '会田英明', '篠原喬人',
        '中村栞', '佐々美音', 'バオ', '吉田瑛里'
      ],
      'Stand Pho You (SHIBUYA)': [
        '秋元梢', '武根太一', '佐々美音',
        '内藤加奈子', '吉田瑛里', 'ケサブ'
      ],
      'Tipsy Tiger (桜ヶ丘ステージ)': [
        'ケサブ', '加藤智津子', '佐々美音', 'プルニマ'
      ]
    };

    // 全店舗の在籍者を統合（重複なし）
    const allActiveStaff = new Set();
    Object.values(activeStaffByStore).forEach(staffList => {
      staffList.forEach(name => {
        // 名前の正規化（全角・半角スペースを削除、異体字も考慮）
        const normalized = name
          .replace(/\s+/g, '')
          .replace(/　+/g, '');
        allActiveStaff.add(normalized);
      });
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 在籍者リスト（正規化後）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`総在籍者数: ${allActiveStaff.size}名\n`);

    const sortedActive = Array.from(allActiveStaff).sort();
    sortedActive.forEach((name, idx) => {
      console.log(`  ${idx + 1}. ${name}`);
    });
    console.log('');

    // 現在アクティブなスタッフを全て取得
    const currentStaff = await client.query(`
      SELECT
        staff_id,
        staff_code,
        name,
        REPLACE(REPLACE(name, ' ', ''), '　', '') as normalized_name,
        is_active,
        store_id
      FROM hr.staff
      WHERE tenant_id = 3
      ORDER BY staff_id
    `);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 更新対象の分析');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const toKeepActive = [];
    const toDeactivate = [];

    for (const staff of currentStaff.rows) {
      const isCurrentlyActive = staff.is_active;
      const shouldBeActive = allActiveStaff.has(staff.normalized_name);

      if (shouldBeActive && !isCurrentlyActive) {
        toKeepActive.push({
          staff_id: staff.staff_id,
          name: staff.name,
          action: '再アクティブ化'
        });
      } else if (!shouldBeActive && isCurrentlyActive) {
        toDeactivate.push({
          staff_id: staff.staff_id,
          name: staff.name,
          staff_code: staff.staff_code
        });
      }
    }

    console.log(`✅ アクティブ維持: ${currentStaff.rows.filter(s => s.is_active && allActiveStaff.has(s.normalized_name)).length}名`);
    console.log(`🔄 再アクティブ化: ${toKeepActive.length}名`);
    console.log(`❌ 退職扱い: ${toDeactivate.length}名\n`);

    if (toKeepActive.length > 0) {
      console.log('【再アクティブ化対象】');
      toKeepActive.forEach(staff => {
        console.log(`  - ${staff.name} (ID: ${staff.staff_id})`);
      });
      console.log('');
    }

    if (toDeactivate.length > 0) {
      console.log('【退職扱い対象】');
      toDeactivate.forEach(staff => {
        console.log(`  - ${staff.name} (${staff.staff_code}, ID: ${staff.staff_id})`);
      });
      console.log('');
    }

    // 更新処理を実行
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️  データベース更新中...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await client.query('BEGIN');

    try {
      // 再アクティブ化
      for (const staff of toKeepActive) {
        await client.query(`
          UPDATE hr.staff
          SET is_active = TRUE
          WHERE staff_id = $1
        `, [staff.staff_id]);
        console.log(`✅ 再アクティブ化: ${staff.name}`);
      }

      // 退職扱い
      for (const staff of toDeactivate) {
        await client.query(`
          UPDATE hr.staff
          SET is_active = FALSE
          WHERE staff_id = $1
        `, [staff.staff_id]);
        console.log(`❌ 退職扱い: ${staff.name}`);
      }

      await client.query('COMMIT');
      console.log('\n✅ トランザクションをコミットしました\n');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('\n❌ エラーが発生したためロールバックしました\n');
      throw error;
    }

    // 更新後の状態を確認
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 更新後の状態');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const afterCount = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_active = TRUE) as active_count,
        COUNT(*) FILTER (WHERE is_active = FALSE) as inactive_count,
        COUNT(*) as total_count
      FROM hr.staff
      WHERE tenant_id = 3
    `);

    const counts = afterCount.rows[0];
    console.log(`アクティブ: ${counts.active_count}名`);
    console.log(`退職済み: ${counts.inactive_count}名`);
    console.log(`合計: ${counts.total_count}名\n`);

    console.log('✅ スタッフの在籍状況更新が完了しました！\n');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    await client.end();
  }
}

updateStaffStatus();
