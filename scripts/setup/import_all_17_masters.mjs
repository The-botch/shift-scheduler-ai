#!/usr/bin/env node

/**
 * 全15個のマスターCSVファイルをDBに投入
 * 実際のDBテーブルは17個（テナント、ディビジョン含む）
 *
 * frontend/public/data/master/ 配下のCSVファイル:
 * 1. stores.csv
 * 2. roles.csv
 * 3. skills.csv
 * 4. employment_types.csv
 * 5. shift_patterns.csv
 * 6. staff.csv
 * 7. staff_skills.csv
 * 8. staff_certifications.csv
 * 9. commute_allowance.csv
 * 10. insurance_rates.csv
 * 11. tax_brackets.csv
 * 12. labor_law_constraints.csv
 * 13. labor_management_rules.csv
 * 14. shift_validation_rules.csv
 * 15. store_constraints.csv
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

const MASTER_DIR = path.join(__dirname, '..', '..', 'frontend', 'public', 'data', 'master');

// CSVパーサー
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseBool(value) {
  return value === 'TRUE' || value === 'true' || value === '1';
}

async function importAll17Masters() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 データベースへ接続中...\n');
    await client.connect();
    console.log('✅ 接続成功！\n');

    await client.query('BEGIN');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 全15個のマスターCSVデータ投入開始');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // テナント・Division・店舗作成は既存と同じ
    const tenantResult = await client.query(`
      INSERT INTO core.tenants (tenant_code, tenant_name, contract_start_date, contract_plan, max_stores, max_staff, is_active)
      VALUES ('DEMO', 'デモ企業', '2024-01-01', 'PREMIUM', 100, 1000, TRUE)
      ON CONFLICT (tenant_code) DO NOTHING
      RETURNING tenant_id;
    `);

    let tenantId;
    if (tenantResult.rows.length > 0) {
      tenantId = tenantResult.rows[0].tenant_id;
    } else {
      const existingTenant = await client.query(`SELECT tenant_id FROM core.tenants WHERE tenant_code = 'DEMO'`);
      tenantId = existingTenant.rows[0].tenant_id;
    }

    console.log(`【テナント】ID: ${tenantId}\n`);

    const divisionResult = await client.query(`
      INSERT INTO core.divisions (tenant_id, division_code, division_name, is_active)
      VALUES ($1, 'TOKYO', '東京エリア', TRUE)
      ON CONFLICT (tenant_id, division_code) DO NOTHING
      RETURNING division_id;
    `, [tenantId]);

    let divisionId;
    if (divisionResult.rows.length > 0) {
      divisionId = divisionResult.rows[0].division_id;
    } else {
      const existingDiv = await client.query(`SELECT division_id FROM core.divisions WHERE tenant_id = $1 AND division_code = 'TOKYO'`, [tenantId]);
      divisionId = existingDiv.rows[0].division_id;
    }

    console.log(`【Division】ID: ${divisionId}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let masterCount = 0;

    // 1. Stores
    console.log(`  📋 ${++masterCount}/17 stores.csv`);
    const storesCSV = fs.readFileSync(path.join(MASTER_DIR, 'stores.csv'), 'utf8');
    const { rows: storesRows } = parseCSV(storesCSV);
    for (const row of storesRows) {
      await client.query(`
        INSERT INTO core.stores (tenant_id, division_id, store_code, store_name, address, phone_number, business_hours_start, business_hours_end, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (tenant_id, division_id, store_code) DO NOTHING;
      `, [tenantId, divisionId, row.store_code, row.store_name, row.address, row.phone_number, row.business_hours_start, row.business_hours_end, parseBool(row.is_active)]);
    }
    console.log(`        ✅ ${storesRows.length}件\n`);

    // 2. Roles
    console.log(`  📋 ${++masterCount}/17 roles.csv`);
    const rolesCSV = fs.readFileSync(path.join(MASTER_DIR, 'roles.csv'), 'utf8');
    const { rows: rolesRows } = parseCSV(rolesCSV);
    for (const row of rolesRows) {
      await client.query(`
        INSERT INTO core.roles (tenant_id, role_code, role_name, display_order, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (tenant_id, role_code) DO NOTHING;
      `, [tenantId, row.role_code, row.role_name, parseInt(row.display_order || 0, 10), parseBool(row.is_active)]);
    }
    console.log(`        ✅ ${rolesRows.length}件\n`);

    // 3. Skills
    console.log(`  📋 ${++masterCount}/17 skills.csv`);
    const skillsCSV = fs.readFileSync(path.join(MASTER_DIR, 'skills.csv'), 'utf8');
    const { rows: skillsRows } = parseCSV(skillsCSV);
    for (const row of skillsRows) {
      await client.query(`
        INSERT INTO core.skills (tenant_id, skill_code, skill_name, category, display_order, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (tenant_id, skill_code) DO NOTHING;
      `, [tenantId, row.skill_code, row.skill_name, row.description || 'その他', parseInt(row.display_order || 0, 10), parseBool(row.is_active)]);
    }
    console.log(`        ✅ ${skillsRows.length}件\n`);

    // 4. Employment Types
    console.log(`  📋 ${++masterCount}/17 employment_types.csv`);
    const employmentTypesCSV = fs.readFileSync(path.join(MASTER_DIR, 'employment_types.csv'), 'utf8');
    const { rows: employmentTypesRows } = parseCSV(employmentTypesCSV);
    for (const row of employmentTypesRows) {
      await client.query(`
        INSERT INTO core.employment_types (tenant_id, employment_code, employment_name, payment_type, display_order, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (tenant_id, employment_code) DO NOTHING;
      `, [tenantId, row.employment_code, row.employment_name, row.payment_type, parseInt(row.display_order || 0, 10), parseBool(row.is_active)]);
    }
    console.log(`        ✅ ${employmentTypesRows.length}件\n`);

    // 5. Shift Patterns
    console.log(`  📋 ${++masterCount}/17 shift_patterns.csv`);
    const patternsCSV = fs.readFileSync(path.join(MASTER_DIR, 'shift_patterns.csv'), 'utf8');
    const { rows: patternsRows } = parseCSV(patternsCSV);
    for (const row of patternsRows) {
      await client.query(`
        INSERT INTO core.shift_patterns (tenant_id, pattern_code, pattern_name, start_time, end_time, break_minutes, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (tenant_id, pattern_code) DO NOTHING;
      `, [tenantId, row.pattern_code, row.pattern_name, row.start_time, row.end_time, parseInt(row.break_duration_minutes || row.break_minutes || 0, 10), parseBool(row.is_active)]);
    }
    console.log(`        ✅ ${patternsRows.length}件\n`);

    // IDマッピング取得
    const storesMap = await client.query('SELECT store_id, store_code FROM core.stores WHERE tenant_id = $1', [tenantId]);
    const storeCodeToId = {};
    storesMap.rows.forEach(row => { storeCodeToId[row.store_code] = row.store_id; });

    const rolesMap = await client.query('SELECT role_id, role_code FROM core.roles WHERE tenant_id = $1', [tenantId]);
    const roleCodeToId = {};
    rolesMap.rows.forEach(row => { roleCodeToId[row.role_code] = row.role_id; });

    // 6. Staff
    console.log(`  📋 ${++masterCount}/17 staff.csv`);
    const staffCSV = fs.readFileSync(path.join(MASTER_DIR, 'staff.csv'), 'utf8');
    const { rows: staffRows } = parseCSV(staffCSV);
    let staffInserted = 0;
    for (const row of staffRows) {
      // CSVのstore_idを直接使用（store_codeではなく）
      const storeId = parseInt(row.store_id) || storesMap.rows[0].store_id;
      const roleId = roleCodeToId[row.role_code] || rolesMap.rows[0].role_id;
      const employmentType = (row.employment_type || 'HOURLY').toUpperCase();
      const hourlyRate = (employmentType === 'HOURLY' || employmentType === 'PART_TIME') ? parseFloat(row.hourly_rate || 1200) : null;
      const monthlySalary = (employmentType === 'MONTHLY') ? parseFloat(row.monthly_salary || 250000) : null;

      try {
        await client.query(`
          INSERT INTO hr.staff (tenant_id, division_id, store_id, role_id, staff_code, name, email, phone_number, employment_type, hire_date, hourly_rate, monthly_salary, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (tenant_id, staff_code) DO NOTHING;
        `, [tenantId, divisionId, storeId, roleId, row.staff_code, row.name, row.email, row.phone_number, employmentType, row.hire_date || '2024-01-01', hourlyRate, monthlySalary, parseBool(row.is_active)]);
        staffInserted++;
      } catch (err) {
        // Skip
      }
    }
    console.log(`        ✅ ${staffInserted}件\n`);

    // 6.5. 重複スタッフの検出と統合
    console.log(`  🔍 重複スタッフの検出と統合中...`);

    // 名前の正規化（空白・全角半角を統一）
    function normalizeName(name) {
      return name.replace(/\s+/g, '').replace(/　/g, '');
    }

    // 重複を検出
    const duplicateCheck = await client.query(`
      SELECT
        name,
        ARRAY_AGG(staff_id ORDER BY staff_id) as staff_ids,
        COUNT(*) as count
      FROM hr.staff
      WHERE tenant_id = $1 AND is_active = TRUE
      GROUP BY REPLACE(REPLACE(name, ' ', ''), '　', '')
      HAVING COUNT(*) > 1
    `, [tenantId]);

    if (duplicateCheck.rows.length > 0) {
      console.log(`        ⚠️  ${duplicateCheck.rows.length}組の重複が見つかりました`);

      for (const dup of duplicateCheck.rows) {
        const staffIds = dup.staff_ids;

        // シフト数が最も多いスタッフを残す
        const shiftCounts = await client.query(`
          SELECT staff_id, COUNT(*) as shift_count
          FROM ops.shifts
          WHERE staff_id = ANY($1::int[])
          GROUP BY staff_id
          ORDER BY shift_count DESC
        `, [staffIds]);

        const keepStaffId = shiftCounts.rows[0]?.staff_id || staffIds[0];
        const removeStaffIds = staffIds.filter(id => id !== keepStaffId);

        console.log(`        🔄 "${dup.name}" → ID ${keepStaffId} を残して ID ${removeStaffIds.join(', ')} を統合`);

        for (const removeId of removeStaffIds) {
          // シフトデータを移行
          await client.query(`UPDATE ops.shifts SET staff_id = $1 WHERE staff_id = $2`, [keepStaffId, removeId]);
          // シフト希望を移行
          await client.query(`UPDATE ops.shift_preferences SET staff_id = $1 WHERE staff_id = $2`, [keepStaffId, removeId]);
          // スキルを削除（重複回避のため移行ではなく削除）
          await client.query(`DELETE FROM hr.staff_skills WHERE staff_id = $1`, [removeId]);
          // 資格を移行
          await client.query(`UPDATE hr.staff_certifications SET staff_id = $1 WHERE staff_id = $2`, [keepStaffId, removeId]);
          // 重複スタッフを論理削除
          await client.query(`UPDATE hr.staff SET is_active = FALSE WHERE staff_id = $1`, [removeId]);
        }
      }
      console.log(`        ✅ 重複統合完了\n`);
    } else {
      console.log(`        ✅ 重複なし\n`);
    }

    // 7. Staff Skills
    console.log(`  📋 ${++masterCount}/17 staff_skills.csv`);
    const staffSkillsCSV = fs.readFileSync(path.join(MASTER_DIR, 'staff_skills.csv'), 'utf8');
    const { rows: staffSkillsRows } = parseCSV(staffSkillsCSV);
    const staffMap = await client.query('SELECT staff_id FROM hr.staff WHERE tenant_id = $1 ORDER BY staff_id', [tenantId]);
    const skillsMap = await client.query('SELECT skill_id FROM core.skills WHERE tenant_id = $1 ORDER BY skill_id', [tenantId]);
    let staffSkillsInserted = 0;
    for (const row of staffSkillsRows) {
      const csvStaffId = parseInt(row.staff_id, 10);
      const csvSkillId = parseInt(row.skill_id, 10);
      const dbStaffId = staffMap.rows[csvStaffId - 1]?.staff_id;
      const dbSkillId = skillsMap.rows[csvSkillId - 1]?.skill_id;

      if (dbStaffId && dbSkillId) {
        try {
          await client.query(`
            INSERT INTO hr.staff_skills (tenant_id, staff_id, skill_id, proficiency_level, acquired_date)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (staff_id, skill_id) DO NOTHING;
          `, [tenantId, dbStaffId, dbSkillId, parseInt(row.proficiency_level || 3, 10), row.acquired_date || null]);
          staffSkillsInserted++;
        } catch (err) {}
      }
    }
    console.log(`        ✅ ${staffSkillsInserted}件\n`);

    // 8. Staff Certifications
    console.log(`  📋 ${++masterCount}/17 staff_certifications.csv`);
    // hr.staff_certificationsテーブルにデータを投入（certification_idは整数値として保存）
    let staffCertsInserted = 0;
    const staffCertsCSV = fs.readFileSync(path.join(MASTER_DIR, 'staff_certifications.csv'), 'utf8');
    const { rows: staffCertsRows } = parseCSV(staffCertsCSV);
    for (const row of staffCertsRows) {
      const csvStaffId = parseInt(row.staff_id, 10);
      const dbStaffId = staffMap.rows[csvStaffId - 1]?.staff_id;
      if (!dbStaffId) continue;

      // 複数の資格情報をカラムから読み取る
      const certs = [];
      if (row.food_hygiene_cert && row.food_hygiene_cert !== 'FALSE') certs.push({ id: 1, date: row.cert_date_fh });
      if (row.fire_prevention_cert && row.fire_prevention_cert !== 'FALSE') certs.push({ id: 2, date: row.cert_date_fp });
      if (row.alcohol_sales_cert && row.alcohol_sales_cert !== 'FALSE') certs.push({ id: 3, date: row.cert_date_as });
      if (row.cooking_license && row.cooking_license !== 'FALSE') certs.push({ id: 4, date: row.cert_date_cl });
      if (row.driver_license && row.driver_license !== 'FALSE') certs.push({ id: 5, date: row.license_expire });

      for (const cert of certs) {
        try {
          await client.query(`
            INSERT INTO hr.staff_certifications (tenant_id, staff_id, certification_id, acquired_date)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING;
          `, [tenantId, dbStaffId, cert.id, cert.date || '2024-01-01']);
          staffCertsInserted++;
        } catch (err) {}
      }
    }
    console.log(`        ✅ ${staffCertsInserted}件\n`);

    // 9. Commute Allowance
    console.log(`  📋 ${++masterCount}/17 commute_allowance.csv`);
    const commuteCSV = fs.readFileSync(path.join(MASTER_DIR, 'commute_allowance.csv'), 'utf8');
    const { rows: commuteRows } = parseCSV(commuteCSV);
    for (const row of commuteRows) {
      await client.query(`
        INSERT INTO hr.commute_allowance (tenant_id, distance_from_km, distance_to_km, allowance_amount, description, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT DO NOTHING;
      `, [tenantId, parseFloat(row.distance_from_km), parseFloat(row.distance_to_km), parseFloat(row.daily_allowance || row.monthly_max || 0), row.notes || '']);
    }
    console.log(`        ✅ ${commuteRows.length}件\n`);

    // 10. Insurance Rates
    console.log(`  📋 ${++masterCount}/17 insurance_rates.csv`);
    const insuranceCSV = fs.readFileSync(path.join(MASTER_DIR, 'insurance_rates.csv'), 'utf8');
    const { rows: insuranceRows } = parseCSV(insuranceCSV);
    for (const row of insuranceRows) {
      const insuranceTypeMap = { 'health_insurance': 'HEALTH', 'pension': 'PENSION', 'employment_insurance': 'EMPLOYMENT', 'workers_compensation': 'WORKERS_COMP' };
      const insuranceType = insuranceTypeMap[row.rate_type] || 'HEALTH';
      await client.query(`
        INSERT INTO hr.insurance_rates (tenant_id, insurance_type, employee_rate, employer_rate, effective_from, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT DO NOTHING;
      `, [tenantId, insuranceType, parseFloat(row.employee_percentage || row.rate_percentage || 0) / 100, parseFloat(row.employer_percentage || row.rate_percentage || 0) / 100, '2024-01-01']);
    }
    console.log(`        ✅ ${insuranceRows.length}件\n`);

    // 11. Tax Brackets
    console.log(`  📋 ${++masterCount}/17 tax_brackets.csv`);
    const taxCSV = fs.readFileSync(path.join(MASTER_DIR, 'tax_brackets.csv'), 'utf8');
    const { rows: taxRows } = parseCSV(taxCSV);
    for (const row of taxRows) {
      let incomeTo = parseFloat(row.income_to);
      if (incomeTo > 100000000) incomeTo = null;
      await client.query(`
        INSERT INTO hr.tax_brackets (tenant_id, tax_type, income_from, income_to, tax_rate, deduction_amount, effective_from, is_active)
        VALUES ($1, 'INCOME_TAX', $2, $3, $4, $5, $6, TRUE)
        ON CONFLICT DO NOTHING;
      `, [tenantId, parseFloat(row.income_from), incomeTo, parseFloat(row.tax_rate) / 100, parseFloat(row.deduction || 0), '2024-01-01']);
    }
    console.log(`        ✅ ${taxRows.length}件\n`);

    // 12. Labor Law Constraints
    console.log(`  📋 ${++masterCount}/17 labor_law_constraints.csv`);
    const laborCSV = fs.readFileSync(path.join(MASTER_DIR, 'labor_law_constraints.csv'), 'utf8');
    const { rows: laborRows } = parseCSV(laborCSV);
    for (const row of laborRows) {
      let value = 40;
      try {
        const ruleObj = JSON.parse(row.constraint_rule);
        value = ruleObj.max_hours_per_week || ruleObj.max_hours_per_day || ruleObj.min_break_minutes || ruleObj.min_interval_hours || 40;
      } catch (e) {}
      await client.query(`
        INSERT INTO ops.labor_law_constraints (tenant_id, constraint_code, constraint_name, value, description, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (tenant_id, constraint_code) DO NOTHING;
      `, [tenantId, row.law_code, row.law_name, value, row.description || row.legal_reference || '', parseBool(row.is_active)]);
    }
    console.log(`        ✅ ${laborRows.length}件\n`);

    // 13. Labor Management Rules
    console.log(`  📋 ${++masterCount}/17 labor_management_rules.csv`);
    const laborMgmtCSV = fs.readFileSync(path.join(MASTER_DIR, 'labor_management_rules.csv'), 'utf8');
    const { rows: laborMgmtRows } = parseCSV(laborMgmtCSV);
    for (const row of laborMgmtRows) {
      await client.query(`
        INSERT INTO ops.labor_management_rules (rule_id, tenant_id, category, rule_type, description, threshold_value, unit, evaluation_period, action_type, priority, auto_check, notes, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)
        ON CONFLICT (rule_id) DO NOTHING;
      `, [row.rule_id, tenantId, row.category, row.rule_type, row.description, parseFloat(row.threshold_value || 0), row.unit, row.evaluation_period, row.action_type, row.priority, parseBool(row.auto_check), row.notes]);
    }
    console.log(`        ✅ ${laborMgmtRows.length}件\n`);

    // 14. Shift Validation Rules
    console.log(`  📋 ${++masterCount}/17 shift_validation_rules.csv`);
    const validationCSV = fs.readFileSync(path.join(MASTER_DIR, 'shift_validation_rules.csv'), 'utf8');
    const { rows: validationRows } = parseCSV(validationCSV);
    for (const row of validationRows) {
      const severityMap = { 'ERROR': 'ERROR', 'WARNING': 'WARNING', 'INFO': 'INFO' };
      const severity = severityMap[row.check_level] || 'ERROR';
      await client.query(`
        INSERT INTO ops.shift_validation_rules (tenant_id, rule_code, rule_name, severity, is_active)
        VALUES ($1, $2, $3, $4, TRUE)
        ON CONFLICT (tenant_id, rule_code) DO NOTHING;
      `, [tenantId, row.validation_id, row.validation_rule, severity]);
    }
    console.log(`        ✅ ${validationRows.length}件\n`);

    // 15. Store Constraints
    console.log(`  📋 ${++masterCount}/17 store_constraints.csv`);
    const storeConstraintsCSV = fs.readFileSync(path.join(MASTER_DIR, 'store_constraints.csv'), 'utf8');
    const { rows: storeConstraintsRows } = parseCSV(storeConstraintsCSV);
    for (const row of storeConstraintsRows) {
      const storeId = storesMap.rows[0].store_id; // デフォルト店舗
      await client.query(`
        INSERT INTO ops.store_constraints (tenant_id, store_id, constraint_type, constraint_value, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING;
      `, [tenantId, storeId, row.constraint_type, row.constraint_value, parseBool(row.is_active)]);
    }
    console.log(`        ✅ ${storeConstraintsRows.length}件\n`);

    await client.query('COMMIT');

    // サマリー
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 投入結果サマリー');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const summary = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM core.stores WHERE tenant_id = $1) as stores,
        (SELECT COUNT(*) FROM core.roles WHERE tenant_id = $1) as roles,
        (SELECT COUNT(*) FROM core.skills WHERE tenant_id = $1) as skills,
        (SELECT COUNT(*) FROM core.employment_types WHERE tenant_id = $1) as employment_types,
        (SELECT COUNT(*) FROM core.shift_patterns WHERE tenant_id = $1) as patterns,
        (SELECT COUNT(*) FROM hr.staff WHERE tenant_id = $1) as staff,
        (SELECT COUNT(*) FROM hr.staff_skills WHERE tenant_id = $1) as staff_skills,
        (SELECT COUNT(*) FROM hr.staff_certifications WHERE tenant_id = $1) as staff_certs,
        (SELECT COUNT(*) FROM hr.commute_allowance WHERE tenant_id = $1) as commute,
        (SELECT COUNT(*) FROM hr.insurance_rates WHERE tenant_id = $1) as insurance,
        (SELECT COUNT(*) FROM hr.tax_brackets WHERE tenant_id = $1) as tax,
        (SELECT COUNT(*) FROM ops.labor_law_constraints WHERE tenant_id = $1) as labor_law,
        (SELECT COUNT(*) FROM ops.labor_management_rules WHERE tenant_id = $1) as labor_mgmt,
        (SELECT COUNT(*) FROM ops.shift_validation_rules WHERE tenant_id = $1) as validation,
        (SELECT COUNT(*) FROM ops.store_constraints WHERE tenant_id = $1) as store_constraints;
    `, [tenantId]);

    const s = summary.rows[0];
    console.log(`✅ 1. 店舗:                      ${s.stores}件`);
    console.log(`✅ 2. 役職:                      ${s.roles}件`);
    console.log(`✅ 3. スキル:                    ${s.skills}件`);
    console.log(`✅ 4. 雇用形態:                  ${s.employment_types}件`);
    console.log(`✅ 5. シフトパターン:            ${s.patterns}件`);
    console.log(`✅ 6. スタッフ:                  ${s.staff}件`);
    console.log(`✅ 7. スタッフスキル:            ${s.staff_skills}件`);
    console.log(`✅ 8. スタッフ資格:              ${s.staff_certs}件`);
    console.log(`✅ 9. 通勤手当:                  ${s.commute}件`);
    console.log(`✅ 10. 保険料率:                 ${s.insurance}件`);
    console.log(`✅ 11. 税率:                     ${s.tax}件`);
    console.log(`✅ 12. 労働基準法制約:           ${s.labor_law}件`);
    console.log(`✅ 13. 労務管理ルール:           ${s.labor_mgmt}件`);
    console.log(`✅ 14. シフト検証ルール:         ${s.validation}件`);
    console.log(`✅ 15. 店舗制約:                 ${s.store_constraints}件\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 全15個のマスターCSVデータ投入完了！（DB上は17テーブル）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ エラー発生:', error.message);
    console.error('詳細:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 接続切断');
  }
}

importAll17Masters().catch(err => {
  console.error('致命的エラー:', err);
  process.exit(1);
});
