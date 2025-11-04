#!/usr/bin/env node

/**
 * スタッフの重複を検出・統合するスクリプト
 */

import pg from 'pg';

const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway';

async function deduplicateStaff() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 データベースへ接続中...\n');
    await client.connect();
    console.log('✅ 接続成功！\n');

    // 重複の可能性があるスタッフを検出
    const duplicates = [
      { name: '武根太一', staff_codes: ['STAFF_023', 'STAFF_039'] },
      { name: '佐々美音', staff_codes: ['STAFF_008', 'STAFF_043'] },
      { name: '高田久瑠美', staff_codes: ['STAFF_015', 'STAFF_032'] },
      { name: '吉田莉乃', staff_codes: ['STAFF_016', 'STAFF_033'] },
      { name: '橋本勇人', staff_codes: ['STAFF_046', 'STAFF_049'] },
      { name: '相模純平', staff_codes: ['STAFF_022', 'STAFF_048'] },
      { name: '甲木由紀', staff_codes: ['STAFF_040', 'STAFF_042'] },
    ];

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 重複スタッフの詳細調査');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const mergeOperations = [];

    for (const dup of duplicates) {
      console.log(`\n【${dup.name}】`);
      console.log('─'.repeat(50));

      for (const code of dup.staff_codes) {
        const result = await client.query(`
          SELECT
            s.staff_id,
            s.staff_code,
            s.name,
            s.email,
            s.phone_number,
            s.hire_date,
            s.store_id,
            st.store_name,
            (SELECT COUNT(*) FROM ops.shifts sh WHERE sh.staff_id = s.staff_id) as shift_count,
            (SELECT COUNT(*) FROM hr.staff_skills ss WHERE ss.staff_id = s.staff_id) as skill_count
          FROM hr.staff s
          LEFT JOIN core.stores st ON s.store_id = st.store_id
          WHERE s.tenant_id = 3 AND s.staff_code = $1
        `, [code]);

        if (result.rows.length > 0) {
          const staff = result.rows[0];
          console.log(`  ${staff.staff_code} (ID: ${staff.staff_id})`);
          console.log(`    氏名: ${staff.name}`);
          console.log(`    メール: ${staff.email || 'なし'}`);
          console.log(`    電話: ${staff.phone_number || 'なし'}`);
          console.log(`    入社日: ${staff.hire_date || 'なし'}`);
          console.log(`    店舗: ${staff.store_name || 'なし'} (ID: ${staff.store_id})`);
          console.log(`    シフト数: ${staff.shift_count}件`);
          console.log(`    スキル数: ${staff.skill_count}件`);
        }
      }

      // どちらを残すか決定（シフト数が多い方を残す）
      const staffData = [];
      for (const code of dup.staff_codes) {
        const result = await client.query(`
          SELECT
            s.staff_id,
            s.staff_code,
            (SELECT COUNT(*) FROM ops.shifts sh WHERE sh.staff_id = s.staff_id) as shift_count
          FROM hr.staff s
          WHERE s.tenant_id = 3 AND s.staff_code = $1
        `, [code]);

        if (result.rows.length > 0) {
          staffData.push(result.rows[0]);
        }
      }

      if (staffData.length === 2) {
        const [staff1, staff2] = staffData;
        const keepStaff = parseInt(staff1.shift_count) >= parseInt(staff2.shift_count) ? staff1 : staff2;
        const removeStaff = keepStaff === staff1 ? staff2 : staff1;

        console.log(`\n  💡 判定: ${keepStaff.staff_code} を残し、${removeStaff.staff_code} を統合`);

        mergeOperations.push({
          name: dup.name,
          keep_staff_id: keepStaff.staff_id,
          keep_staff_code: keepStaff.staff_code,
          remove_staff_id: removeStaff.staff_id,
          remove_staff_code: removeStaff.staff_code
        });
      }
    }

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 統合処理SQL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('-- トランザクション開始');
    console.log('BEGIN;\n');

    for (const op of mergeOperations) {
      console.log(`-- 【${op.name}】${op.remove_staff_code} → ${op.keep_staff_code} に統合`);
      console.log(`-- シフトデータを移行`);
      console.log(`UPDATE ops.shifts SET staff_id = ${op.keep_staff_id} WHERE staff_id = ${op.remove_staff_id};`);
      console.log(`-- シフト希望を移行`);
      console.log(`UPDATE ops.shift_preferences SET staff_id = ${op.keep_staff_id} WHERE staff_id = ${op.remove_staff_id};`);
      console.log(`-- スキルを移行（重複を避ける）`);
      console.log(`INSERT INTO hr.staff_skills (tenant_id, staff_id, skill_id, proficiency_level, acquired_date)`);
      console.log(`SELECT tenant_id, ${op.keep_staff_id}, skill_id, proficiency_level, acquired_date`);
      console.log(`FROM hr.staff_skills WHERE staff_id = ${op.remove_staff_id}`);
      console.log(`ON CONFLICT (tenant_id, staff_id, skill_id) DO NOTHING;`);
      console.log(`-- 古いスキルレコードを削除`);
      console.log(`DELETE FROM hr.staff_skills WHERE staff_id = ${op.remove_staff_id};`);
      console.log(`-- 資格を移行（重複を避ける）`);
      console.log(`UPDATE hr.staff_certifications SET staff_id = ${op.keep_staff_id} WHERE staff_id = ${op.remove_staff_id};`);
      console.log(`-- 重複スタッフを論理削除`);
      console.log(`UPDATE hr.staff SET is_active = FALSE WHERE staff_id = ${op.remove_staff_id};`);
      console.log('');
    }

    console.log('-- トランザクション完了');
    console.log('COMMIT;\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 サマリー');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`検出された重複: ${duplicates.length}組`);
    console.log(`統合対象: ${mergeOperations.length}組\n`);

  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  } finally {
    await client.end();
  }
}

deduplicateStaff();
