import { query } from './src/config/database.js';
import fs from 'fs';

async function extractStaffData() {
  try {
    console.log('📥 本番DBからスタッフデータを抽出中...\n');

    const result = await query(`
      SELECT * FROM hr.staff
      ORDER BY tenant_id, store_id, staff_id
    `);

    console.log(`✅ ${result.rows.length}名のスタッフを抽出しました\n`);

    // SQLファイルを生成
    const now = new Date().toISOString();
    let sql = `-- ============================================
-- スタッフデータ
-- 本番DBから抽出: ${now}
-- 総件数: ${result.rows.length}名
-- ============================================

`;

    result.rows.forEach(row => {
      const values = [
        row.staff_id,
        row.tenant_id,
        row.division_id || 'NULL',
        row.store_id,
        row.role_id,
        `'${row.staff_code.replace(/'/g, "''")}'`,
        `'${row.name.replace(/'/g, "''")}'`,
        row.email ? `'${row.email.replace(/'/g, "''")}'` : 'NULL',
        row.phone_number ? `'${row.phone_number.replace(/'/g, "''")}'` : 'NULL',
        `'${row.employment_type}'`,
        `'${row.hire_date.toISOString().split('T')[0]}'`,
        row.resignation_date ? `'${row.resignation_date.toISOString().split('T')[0]}'` : 'NULL',
        row.monthly_salary || 'NULL',
        row.hourly_rate || 'NULL',
        row.commute_distance_km || 'NULL',
        row.has_social_insurance ? 'TRUE' : 'FALSE',
        row.is_active ? 'TRUE' : 'FALSE'
      ];

      sql += `INSERT INTO hr.staff (staff_id, tenant_id, division_id, store_id, role_id, staff_code, name, email, phone_number, employment_type, hire_date, resignation_date, monthly_salary, hourly_rate, commute_distance_km, has_social_insurance, is_active) VALUES (${values.join(', ')});\n`;
    });

    // シーケンス更新
    const maxId = Math.max(...result.rows.map(r => r.staff_id));
    sql += `\n-- staff_idシーケンスを更新\n`;
    sql += `SELECT setval('hr.staff_staff_id_seq', GREATEST(${maxId}, (SELECT MAX(staff_id) FROM hr.staff)), true);\n`;

    fs.writeFileSync('../scripts/setup/seed_staff_data.sql', sql);
    console.log('✅ seed_staff_data.sql を作成しました\n');

    // テナント別の統計
    const byTenant = {};
    result.rows.forEach(row => {
      byTenant[row.tenant_id] = (byTenant[row.tenant_id] || 0) + 1;
    });

    console.log('📊 テナント別スタッフ数:');
    Object.entries(byTenant).forEach(([tid, count]) => {
      console.log(`   テナント${tid}: ${count}名`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

extractStaffData();
