import fs from 'fs';

// seed_transaction_data.sqlからstaff_idを抽出
const sqlContent = fs.readFileSync('../scripts/setup/seed_transaction_data.sql', 'utf8');
const shifts = sqlContent.match(/INSERT INTO ops\.shifts.*?VALUES \(([^)]+)\);/g) || [];

const staffIds = new Set();
const staffByTenant = {};

shifts.forEach(line => {
  const match = line.match(/VALUES \((\d+), (\d+), \d+, (\d+),/);
  if (match) {
    const [_, tenantId, storeId, staffId] = match;
    staffIds.add(parseInt(staffId));
    if (!staffByTenant[tenantId]) staffByTenant[tenantId] = new Set();
    staffByTenant[tenantId].add(parseInt(staffId));
  }
});

console.log(`抽出されたスタッフ: ${staffIds.size}名`);
Object.entries(staffByTenant).forEach(([tid, ids]) => {
  console.log(`  テナント${tid}: ${ids.size}名`);
});

// SQL生成
let sql = `-- ============================================
-- スタッフデータ (shiftsデータから生成)
-- 生成日時: ${new Date().toISOString()}
-- 総件数: ${staffIds.size}名
-- ============================================

`;

const sortedIds = Array.from(staffIds).sort((a, b) => a - b);

sortedIds.forEach(staffId => {
  // どのテナントに属するかを判定
  let tenantId = 1;
  let storeId = 1;
  let roleId = 5; // STAFF

  for (const [tid, ids] of Object.entries(staffByTenant)) {
    if (ids.has(staffId)) {
      tenantId = parseInt(tid);
      if (tenantId === 3) {
        // テナント3の場合、staff_idから店舗を推測
        if (staffId >= 1200) storeId = 153 + (staffId % 5);
        else storeId = 153;
        roleId = 7; // テナント3の'STAFF'役職ID
      }
      break;
    }
  }

  sql += `INSERT INTO hr.staff (staff_id, tenant_id, division_id, store_id, role_id, staff_code, name, email, phone_number, employment_type, hire_date, resignation_date, monthly_salary, hourly_rate, commute_distance_km, has_social_insurance, is_active) VALUES (${staffId}, ${tenantId}, NULL, ${storeId}, ${roleId}, 'STAFF${String(staffId).padStart(4, '0')}', 'スタッフ${staffId}', NULL, NULL, 'PART_TIME', '2024-01-01', NULL, NULL, 1200, NULL, FALSE, TRUE);\n`;
});

sql += `\n-- staff_idシーケンスを更新\n`;
sql += `SELECT setval('hr.staff_staff_id_seq', ${Math.max(...sortedIds)}, true);\n`;

fs.writeFileSync('../scripts/setup/seed_staff_data.sql', sql);
console.log('\n✅ seed_staff_data.sql を作成しました');
