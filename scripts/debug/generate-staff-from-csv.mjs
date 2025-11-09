import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// employment_typeのマッピング（CSVの値 → DBの値）
const EMPLOYMENT_TYPE_MAP = {
  'monthly': 'FULL_TIME',
  'hourly': 'PART_TIME',
  'contract': 'CONTRACT'
};

async function generateStaffSQL() {
  try {
    console.log('📥 CSVからスタッフデータを読み込み中...\n');

    // CSVファイルを読み込み
    const csvPath = path.join(__dirname, '../frontend/public/data/master/staff.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');

    // CSVをパース
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`✅ ${records.length}名のスタッフを読み込みました\n`);

    // テナント別の統計
    const byActive = { active: 0, inactive: 0 };

    records.forEach(row => {
      if (row.is_active === 'TRUE' || row.is_active === 'true') {
        byActive.active++;
      } else {
        byActive.inactive++;
      }
    });

    console.log('📊 スタッフ統計:');
    console.log(`   総数: ${records.length}名`);
    console.log(`   在籍中: ${byActive.active}名`);
    console.log(`   退職済: ${byActive.inactive}名\n`);

    // SQLファイルを生成
    const now = new Date().toISOString();
    let sql = `-- ============================================
-- スタッフデータ
-- CSVから生成: ${now}
-- 総件数: ${records.length}名
-- ============================================

`;

    records.forEach(row => {
      const staffId = row.staff_id;
      const tenantId = 1; // CSVのデータは全てテナント1
      const divisionId = 'NULL';
      const storeId = row.store_id;
      const roleId = row.role_id;
      const staffCode = row.staff_code.replace(/'/g, "''");
      const name = row.name.replace(/'/g, "''");
      const email = row.email ? `'${row.email.replace(/'/g, "''")}'` : 'NULL';
      const phoneNumber = row.phone_number ? `'${row.phone_number.replace(/'/g, "''")}'` : 'NULL';

      // employment_typeを変換
      const employmentTypeRaw = row.employment_type || 'hourly';
      const employmentType = EMPLOYMENT_TYPE_MAP[employmentTypeRaw] || 'PART_TIME';

      const hireDate = row.hire_date || '2024-01-01';
      const resignationDate = row.resignation_date ? `'${row.resignation_date}'` : 'NULL';
      const monthlySalary = row.monthly_salary || 'NULL';
      const hourlyRate = row.hourly_rate || 'NULL';
      const commuteDistanceKm = row.commute_distance_km || 'NULL';
      const hasSocialInsurance = (row.has_social_insurance === 'TRUE' || row.has_social_insurance === 'true') ? 'TRUE' : 'FALSE';
      const isActive = (row.is_active === 'TRUE' || row.is_active === 'true') ? 'TRUE' : 'FALSE';

      sql += `INSERT INTO hr.staff (staff_id, tenant_id, division_id, store_id, role_id, staff_code, name, email, phone_number, employment_type, hire_date, resignation_date, monthly_salary, hourly_rate, commute_distance_km, has_social_insurance, is_active) VALUES (${staffId}, ${tenantId}, ${divisionId}, ${storeId}, ${roleId}, '${staffCode}', '${name}', ${email}, ${phoneNumber}, '${employmentType}', '${hireDate}', ${resignationDate}, ${monthlySalary}, ${hourlyRate}, ${commuteDistanceKm}, ${hasSocialInsurance}, ${isActive});\n`;
    });

    // シーケンス更新
    const maxId = Math.max(...records.map(r => parseInt(r.staff_id)));
    sql += `\n-- staff_idシーケンスを更新\n`;
    sql += `SELECT setval('hr.staff_staff_id_seq', GREATEST(${maxId}, (SELECT MAX(staff_id) FROM hr.staff)), true);\n`;

    // ファイル出力
    const outputPath = path.join(__dirname, '../scripts/setup/seed_staff_data.sql');
    fs.writeFileSync(outputPath, sql);

    console.log('✅ seed_staff_data.sql を作成しました\n');
    console.log('🎉 完了！');

  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

generateStaffSQL();
