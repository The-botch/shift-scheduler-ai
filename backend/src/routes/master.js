import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * テナントマスタ取得
 */
router.get('/tenants', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        tenant_id,
        tenant_code,
        tenant_name,
        corporate_number,
        contract_plan,
        contract_start_date,
        contract_end_date,
        max_divisions,
        max_stores,
        max_staff,
        is_active
      FROM core.tenants
      WHERE is_active = TRUE
      ORDER BY tenant_id
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 部門マスタ取得
 */
router.get('/divisions', async (req, res) => {
  try {
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        division_id,
        division_code,
        division_name,
        division_type,
        parent_division_id,
        contact_email,
        contact_phone,
        is_active
      FROM core.divisions
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY division_id
    `, [tenant_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching divisions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 店舗マスタ取得
 */
router.get('/stores', async (req, res) => {
  try {
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        store_id,
        store_code,
        store_name,
        address,
        phone_number,
        business_hours_start,
        business_hours_end,
        is_active
      FROM core.stores
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY store_id
    `, [tenant_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * スタッフマスタ取得
 */
router.get('/staff', async (req, res) => {
  try {
    const { tenant_id = 1, store_id } = req.query;

    let queryText = `
      SELECT
        s.staff_id,
        s.staff_code,
        s.name,
        s.email,
        s.phone_number,
        s.employment_type,
        s.hire_date,
        s.monthly_salary,
        s.hourly_rate,
        s.has_social_insurance,
        s.commute_distance_km,
        s.is_active,
        s.store_id,
        s.role_id,
        st.store_name
      FROM hr.staff s
      LEFT JOIN core.stores st ON s.store_id = st.store_id
      WHERE s.tenant_id = $1 AND s.is_active = TRUE
    `;

    const params = [tenant_id];

    if (store_id) {
      queryText += ' AND s.store_id = $2';
      params.push(store_id);
    }

    queryText += ' ORDER BY s.staff_id';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 役職マスタ取得
 */
router.get('/roles', async (req, res) => {
  try {
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        role_id,
        role_code,
        role_name,
        display_order
      FROM core.roles
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY display_order, role_id
    `, [tenant_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * スキルマスタ取得
 */
router.get('/skills', async (req, res) => {
  try {
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        skill_id,
        skill_code,
        skill_name,
        category,
        display_order
      FROM core.skills
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY display_order, skill_id
    `, [tenant_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフトパターンマスタ取得
 */
router.get('/shift-patterns', async (req, res) => {
  try {
    const { tenant_id = 1, store_id } = req.query;

    let queryText;
    let queryParams;

    if (store_id) {
      // 店舗指定ありの場合: その店舗のパターンのみ
      queryText = `
        SELECT
          pattern_id,
          pattern_code,
          pattern_name,
          start_time,
          end_time,
          break_minutes,
          store_id
        FROM core.shift_patterns
        WHERE tenant_id = $1 AND is_active = TRUE
          AND (store_id IS NULL OR store_id = $2)
        ORDER BY pattern_id
      `;
      queryParams = [tenant_id, store_id];
    } else {
      // 店舗指定なしの場合: そのテナントの全パターン（重複除外）
      queryText = `
        SELECT DISTINCT ON (pattern_code)
          pattern_id,
          pattern_code,
          pattern_name,
          start_time,
          end_time,
          break_minutes,
          store_id
        FROM core.shift_patterns
        WHERE tenant_id = $1 AND is_active = TRUE
        ORDER BY pattern_code, pattern_id
      `;
      queryParams = [tenant_id];
    }

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching shift patterns:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 税額区分マスタ取得
 */
router.get('/tax-brackets', async (req, res) => {
  try {
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        bracket_id,
        tax_type,
        bracket_name,
        income_from,
        income_to,
        tax_rate,
        deduction_amount,
        deduction,
        effective_from,
        effective_to,
        notes,
        is_active
      FROM hr.tax_brackets
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY tax_type, income_from
    `, [tenant_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching tax brackets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * スタッフスキルマスタ取得
 */
router.get('/staff-skills', async (req, res) => {
  try {
    const { tenant_id = 1, staff_id } = req.query;

    let queryText = `
      SELECT
        staff_skill_id,
        staff_id,
        skill_id,
        proficiency_level,
        acquired_date
      FROM hr.staff_skills
      WHERE tenant_id = $1
    `;

    const params = [tenant_id];

    if (staff_id) {
      queryText += ' AND staff_id = $2';
      params.push(staff_id);
    }

    queryText += ' ORDER BY staff_id, skill_id';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching staff skills:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * スタッフ資格マスタ取得
 */
router.get('/staff-certifications', async (req, res) => {
  try {
    const { tenant_id = 1, staff_id } = req.query;

    let queryText = `
      SELECT
        staff_certification_id,
        staff_id,
        certification_id,
        staff_name,
        food_hygiene_cert,
        cert_date_fh,
        fire_prevention_cert,
        cert_type_fp,
        cert_date_fp,
        alcohol_sales_cert,
        cert_date_as,
        next_training_as,
        cooking_license,
        cert_date_cl,
        driver_license,
        license_expire,
        health_manager_cert,
        other_certs,
        acquired_date,
        expiration_date,
        certification_number,
        notes
      FROM hr.staff_certifications
      WHERE tenant_id = $1
    `;

    const params = [tenant_id];

    if (staff_id) {
      queryText += ' AND staff_id = $2';
      params.push(staff_id);
    }

    queryText += ' ORDER BY staff_id, acquired_date DESC';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching staff certifications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 保険料率マスタ取得
 */
router.get('/insurance-rates', async (req, res) => {
  try {
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        rate_id,
        insurance_type,
        employee_rate,
        employer_rate,
        effective_from,
        effective_to,
        is_active
      FROM hr.insurance_rates
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY insurance_type, effective_from DESC
    `, [tenant_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching insurance rates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 通勤手当マスタ取得
 */
router.get('/commute-allowance', async (req, res) => {
  try {
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        allowance_id,
        distance_from_km,
        distance_to_km,
        allowance_amount,
        daily_allowance,
        monthly_max,
        description,
        notes,
        is_active
      FROM hr.commute_allowance
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY distance_from_km
    `, [tenant_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching commute allowance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 労働法制約マスタ取得
 */
router.get('/labor-law-constraints', async (req, res) => {
  try {
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        constraint_id,
        law_id,
        law_code,
        law_name,
        constraint_code,
        constraint_name,
        category,
        value,
        unit,
        constraint_rule,
        penalty_level,
        legal_reference,
        description,
        is_active
      FROM ops.labor_law_constraints
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY constraint_id
    `, [tenant_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching labor law constraints:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 店舗制約マスタ取得
 */
router.get('/store-constraints', async (req, res) => {
  try {
    const { tenant_id = 1, store_id } = req.query;

    let queryText = `
      SELECT
        store_constraint_id,
        store_id,
        constraint_id,
        constraint_type,
        constraint_value,
        description,
        priority,
        is_active
      FROM ops.store_constraints
      WHERE tenant_id = $1 AND is_active = TRUE
    `;

    const params = [tenant_id];

    if (store_id) {
      queryText += ' AND store_id = $2';
      params.push(store_id);
    }

    queryText += ' ORDER BY store_constraint_id';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching store constraints:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 雇用形態マスタ取得
 */
router.get('/employment-types', async (req, res) => {
  try {
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        employment_type_id,
        employment_code,
        employment_name,
        payment_type,
        display_order,
        is_active
      FROM core.employment_types
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY display_order, employment_type_id
    `, [tenant_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching employment types:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 労務管理ルールマスタ取得
 */
router.get('/labor-management-rules', async (req, res) => {
  try {
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        rule_id,
        category,
        rule_type,
        description,
        threshold_value,
        unit,
        evaluation_period,
        action_type,
        priority,
        auto_check,
        notes,
        is_active
      FROM ops.labor_management_rules
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY priority, rule_id
    `, [tenant_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching labor management rules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフト検証ルールマスタ取得
 */
router.get('/shift-validation-rules', async (req, res) => {
  try {
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        rule_id,
        validation_id,
        rule_code,
        rule_name,
        check_category,
        validation_rule,
        description,
        check_level,
        severity,
        auto_action,
        error_message,
        override_possible,
        override_authority,
        implementation_status,
        is_active
      FROM ops.shift_validation_rules
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY severity DESC, rule_id
    `, [tenant_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching shift validation rules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 全マスターデータを一括取得
 */
router.get('/all', async (req, res) => {
  try {
    const { tenant_id = 1, store_id } = req.query;

    const [
      stores,
      staff,
      roles,
      skills,
      shiftPatterns,
      laborLawConstraints,
      storeConstraints,
      shiftValidationRules
    ] = await Promise.all([
      query('SELECT * FROM core.stores WHERE tenant_id = $1 AND is_active = TRUE', [tenant_id]),
      query('SELECT * FROM hr.staff WHERE tenant_id = $1 AND is_active = TRUE', [tenant_id]),
      query('SELECT * FROM core.roles WHERE tenant_id = $1 AND is_active = TRUE', [tenant_id]),
      query('SELECT * FROM core.skills WHERE tenant_id = $1 AND is_active = TRUE', [tenant_id]),
      query('SELECT * FROM core.shift_patterns WHERE tenant_id = $1 AND is_active = TRUE', [tenant_id]),
      query('SELECT * FROM ops.labor_law_constraints WHERE tenant_id = $1 AND is_active = TRUE', [tenant_id]),
      query('SELECT * FROM ops.store_constraints WHERE tenant_id = $1 AND is_active = TRUE', [tenant_id]),
      query('SELECT * FROM ops.shift_validation_rules WHERE tenant_id = $1 AND is_active = TRUE', [tenant_id])
    ]);

    res.json({
      success: true,
      data: {
        stores: stores.rows,
        staff: staff.rows,
        roles: roles.rows,
        skills: skills.rows,
        shift_patterns: shiftPatterns.rows,
        labor_law_constraints: laborLawConstraints.rows,
        store_constraints: storeConstraints.rows,
        shift_validation_rules: shiftValidationRules.rows
      }
    });
  } catch (error) {
    console.error('Error fetching all master data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ===================
 * CRUD API - 役職マスター
 * ===================
 */

// 役職作成
router.post('/roles', async (req, res) => {
  try {
    const { tenant_id, role_code, role_name, description } = req.body;

    // 必須チェック
    if (!tenant_id || !role_code || !role_name) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id, role_code, role_name are required'
      });
    }

    const result = await query(`
      INSERT INTO hr.roles (tenant_id, role_code, role_name, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [tenant_id, role_code, role_name, description || null]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 役職更新
router.put('/roles/:role_id', async (req, res) => {
  try {
    const { role_id } = req.params;
    const { role_code, role_name, description } = req.body;

    // 必須チェック
    if (!role_code || !role_name) {
      return res.status(400).json({
        success: false,
        error: 'role_code and role_name are required'
      });
    }

    const result = await query(`
      UPDATE hr.roles
      SET role_code = $1, role_name = $2, description = $3, updated_at = CURRENT_TIMESTAMP
      WHERE role_id = $4
      RETURNING *
    `, [role_code, role_name, description || null, role_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 役職削除（論理削除）
router.delete('/roles/:role_id', async (req, res) => {
  try {
    const { role_id } = req.params;

    const result = await query(`
      UPDATE hr.roles
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE role_id = $1
      RETURNING *
    `, [role_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
