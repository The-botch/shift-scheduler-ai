import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * シフト計画一覧取得
 * GET /api/shifts/plans
 *
 * Query Parameters:
 * - tenant_id: テナントID (required)
 * - store_id: 店舗ID (optional)
 * - year: 年 (optional)
 * - month: 月 (optional)
 * - status: ステータス (optional) DRAFT/SUBMITTED/APPROVED/PUBLISHED/ARCHIVED
 */
router.get('/plans', async (req, res) => {
  try {
    const { tenant_id = 1, store_id, year, month, status } = req.query;

    let sql = `
      SELECT
        sp.plan_id,
        sp.tenant_id,
        sp.store_id,
        s.store_name,
        sp.plan_year,
        sp.plan_month,
        sp.plan_code,
        sp.plan_name,
        sp.period_start,
        sp.period_end,
        sp.status,
        sp.generation_type,
        sp.ai_model_version,
        sp.total_labor_hours,
        sp.total_labor_cost,
        sp.coverage_score,
        sp.constraint_violations,
        sp.created_by,
        sp.approved_by,
        sp.approved_at,
        sp.created_at,
        sp.updated_at,
        (SELECT COUNT(*) FROM ops.shifts WHERE plan_id = sp.plan_id) as shift_count,
        (SELECT COUNT(DISTINCT staff_id) FROM ops.shifts WHERE plan_id = sp.plan_id) as staff_count
      FROM ops.shift_plans sp
      LEFT JOIN core.stores s ON sp.store_id = s.store_id
      WHERE sp.tenant_id = $1
    `;

    const params = [tenant_id];
    let paramIndex = 2;

    if (store_id) {
      sql += ` AND sp.store_id = $${paramIndex}`;
      params.push(store_id);
      paramIndex++;
    }

    if (year) {
      sql += ` AND sp.plan_year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    if (month) {
      sql += ` AND sp.plan_month = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    if (status) {
      sql += ` AND sp.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY sp.plan_year DESC, sp.plan_month DESC, sp.created_at DESC`;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching shift plans:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフトサマリー取得（月別集計）
 * GET /api/shifts/summary
 *
 * Query Parameters:
 * - tenant_id: テナントID (required)
 * - store_id: 店舗ID (optional)
 * - year: 年 (required)
 * - month: 月 (optional)
 */
router.get('/summary', async (req, res) => {
  try {
    const { tenant_id = 1, store_id, year, month } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        error: 'Year parameter is required'
      });
    }

    let sql = `
      SELECT
        EXTRACT(YEAR FROM sh.shift_date) as year,
        EXTRACT(MONTH FROM sh.shift_date) as month,
        COUNT(*) as shift_count,
        COUNT(DISTINCT sh.staff_id) as staff_count,
        SUM(sh.total_hours) as total_hours,
        SUM(sh.labor_cost) as total_labor_cost,
        AVG(sh.total_hours) as avg_hours_per_shift,
        COUNT(CASE WHEN sh.is_modified = true THEN 1 END) as modified_count
      FROM ops.shifts sh
      WHERE sh.tenant_id = $1
        AND EXTRACT(YEAR FROM sh.shift_date) = $2
    `;

    const params = [tenant_id, year];
    let paramIndex = 3;

    if (store_id) {
      sql += ` AND sh.store_id = $${paramIndex}`;
      params.push(store_id);
      paramIndex++;
    }

    if (month) {
      sql += ` AND EXTRACT(MONTH FROM sh.shift_date) = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    sql += ` GROUP BY EXTRACT(YEAR FROM sh.shift_date), EXTRACT(MONTH FROM sh.shift_date)`;
    sql += ` ORDER BY year DESC, month DESC`;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching shift summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフト一覧取得
 * GET /api/shifts
 *
 * Query Parameters:
 * - tenant_id: テナントID (required)
 * - plan_id: シフト計画ID (optional)
 * - store_id: 店舗ID (optional)
 * - staff_id: スタッフID (optional)
 * - year: 年 (optional)
 * - month: 月 (optional)
 * - date_from: 開始日 (optional) YYYY-MM-DD
 * - date_to: 終了日 (optional) YYYY-MM-DD
 * - is_modified: 変更フラグ (optional) true/false
 */
router.get('/', async (req, res) => {
  try {
    const {
      tenant_id = 1,
      plan_id,
      store_id,
      staff_id,
      year,
      month,
      date_from,
      date_to,
      is_modified
    } = req.query;

    let sql = `
      SELECT
        sh.shift_id,
        sh.tenant_id,
        sh.store_id,
        st.store_name,
        sh.plan_id,
        sp.plan_name,
        sp.status as plan_status,
        sh.staff_id,
        staff.name as staff_name,
        staff.staff_code,
        r.role_name,
        sh.shift_date,
        sh.pattern_id,
        pat.pattern_name,
        pat.pattern_code,
        sh.start_time,
        sh.end_time,
        sh.break_minutes,
        sh.total_hours,
        sh.labor_cost,
        sh.assigned_skills,
        sh.is_preferred,
        sh.is_modified,
        sh.notes,
        sh.created_at,
        sh.updated_at,
        EXTRACT(DOW FROM sh.shift_date) as day_of_week
      FROM ops.shifts sh
      LEFT JOIN ops.shift_plans sp ON sh.plan_id = sp.plan_id
      LEFT JOIN core.stores st ON sh.store_id = st.store_id
      LEFT JOIN hr.staff staff ON sh.staff_id = staff.staff_id
      LEFT JOIN core.roles r ON staff.role_id = r.role_id
      LEFT JOIN core.shift_patterns pat ON sh.pattern_id = pat.pattern_id
      WHERE sh.tenant_id = $1
    `;

    const params = [tenant_id];
    let paramIndex = 2;

    if (plan_id) {
      sql += ` AND sh.plan_id = $${paramIndex}`;
      params.push(plan_id);
      paramIndex++;
    }

    if (store_id) {
      sql += ` AND sh.store_id = $${paramIndex}`;
      params.push(store_id);
      paramIndex++;
    }

    if (staff_id) {
      sql += ` AND sh.staff_id = $${paramIndex}`;
      params.push(staff_id);
      paramIndex++;
    }

    if (year && month) {
      sql += ` AND EXTRACT(YEAR FROM sh.shift_date) = $${paramIndex}`;
      params.push(year);
      paramIndex++;
      sql += ` AND EXTRACT(MONTH FROM sh.shift_date) = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    } else if (year) {
      sql += ` AND EXTRACT(YEAR FROM sh.shift_date) = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    if (date_from) {
      sql += ` AND sh.shift_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      sql += ` AND sh.shift_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    if (is_modified !== undefined) {
      sql += ` AND sh.is_modified = $${paramIndex}`;
      params.push(is_modified === 'true');
      paramIndex++;
    }

    sql += ` ORDER BY sh.shift_date, sh.start_time, staff.name`;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 特定シフト計画の詳細取得
 * GET /api/shifts/plans/:id
 */
router.get('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        sp.*,
        s.store_name,
        s.store_code,
        creator.name as creator_name,
        approver.name as approver_name,
        (SELECT COUNT(*) FROM ops.shifts WHERE plan_id = sp.plan_id) as shift_count,
        (SELECT COUNT(DISTINCT staff_id) FROM ops.shifts WHERE plan_id = sp.plan_id) as staff_count,
        (SELECT SUM(total_hours) FROM ops.shifts WHERE plan_id = sp.plan_id) as actual_total_hours,
        (SELECT SUM(labor_cost) FROM ops.shifts WHERE plan_id = sp.plan_id) as actual_total_cost
      FROM ops.shift_plans sp
      LEFT JOIN core.stores s ON sp.store_id = s.store_id
      LEFT JOIN hr.staff creator ON sp.created_by = creator.staff_id
      LEFT JOIN hr.staff approver ON sp.approved_by = approver.staff_id
      WHERE sp.plan_id = $1 AND sp.tenant_id = $2
    `, [id, tenant_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Shift plan not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching shift plan:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 特定シフトの詳細取得
 * GET /api/shifts/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        sh.*,
        st.store_name,
        st.store_code,
        sp.plan_name,
        sp.status as plan_status,
        staff.name as staff_name,
        staff.staff_code,
        staff.email as staff_email,
        r.role_name,
        pat.pattern_name,
        pat.pattern_code
      FROM ops.shifts sh
      LEFT JOIN ops.shift_plans sp ON sh.plan_id = sp.plan_id
      LEFT JOIN core.stores st ON sh.store_id = st.store_id
      LEFT JOIN hr.staff staff ON sh.staff_id = staff.staff_id
      LEFT JOIN core.roles r ON staff.role_id = r.role_id
      LEFT JOIN core.shift_patterns pat ON sh.pattern_id = pat.pattern_id
      WHERE sh.shift_id = $1 AND sh.tenant_id = $2
    `, [id, tenant_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Shift not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching shift:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// シフト希望API (Shift Preferences)
// ============================================

/**
 * シフト希望一覧取得
 * GET /api/shifts/preferences
 *
 * Query Parameters:
 * - tenant_id: テナントID (required, default: 1)
 * - store_id: 店舗ID (optional)
 * - staff_id: スタッフID (optional)
 * - year: 年 (optional)
 * - month: 月 (optional)
 * - status: ステータス (optional) PENDING/APPROVED/REJECTED
 */
router.get('/preferences', async (req, res) => {
  try {
    const { tenant_id = 1, store_id, staff_id, year, month, status } = req.query;

    let sql = `
      SELECT
        pref.preference_id,
        pref.tenant_id,
        pref.store_id,
        s.store_name,
        pref.staff_id,
        staff.name as staff_name,
        staff.staff_code,
        staff.email as staff_email,
        r.role_name,
        pref.year,
        pref.month,
        pref.preferred_days,
        pref.ng_days,
        pref.preferred_time_slots,
        pref.max_hours_per_week,
        pref.notes,
        pref.submitted_at,
        pref.status,
        pref.created_at,
        pref.updated_at
      FROM ops.shift_preferences pref
      LEFT JOIN core.stores s ON pref.store_id = s.store_id
      LEFT JOIN hr.staff staff ON pref.staff_id = staff.staff_id
      LEFT JOIN core.roles r ON staff.role_id = r.role_id
      WHERE pref.tenant_id = $1
    `;

    const params = [tenant_id];
    let paramIndex = 2;

    if (store_id) {
      sql += ` AND pref.store_id = $${paramIndex}`;
      params.push(store_id);
      paramIndex++;
    }

    if (staff_id) {
      sql += ` AND pref.staff_id = $${paramIndex}`;
      params.push(staff_id);
      paramIndex++;
    }

    if (year) {
      sql += ` AND pref.year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    if (month) {
      sql += ` AND pref.month = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    if (status) {
      sql += ` AND pref.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY pref.year DESC, pref.month DESC, staff.name ASC`;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching shift preferences:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフト希望詳細取得
 * GET /api/shifts/preferences/:id
 */
router.get('/preferences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id = 1 } = req.query;

    const result = await query(`
      SELECT
        pref.*,
        s.store_name,
        s.store_code,
        staff.name as staff_name,
        staff.staff_code,
        staff.email as staff_email,
        staff.phone as staff_phone,
        r.role_name,
        et.type_name as employment_type_name
      FROM ops.shift_preferences pref
      LEFT JOIN core.stores s ON pref.store_id = s.store_id
      LEFT JOIN hr.staff staff ON pref.staff_id = staff.staff_id
      LEFT JOIN core.roles r ON staff.role_id = r.role_id
      LEFT JOIN core.employment_types et ON staff.employment_type_id = et.employment_type_id
      WHERE pref.preference_id = $1 AND pref.tenant_id = $2
    `, [id, tenant_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Shift preference not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching shift preference:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフト希望登録
 * POST /api/shifts/preferences
 *
 * Request Body:
 * {
 *   tenant_id: number,
 *   store_id: number,
 *   staff_id: number,
 *   year: number,
 *   month: number,
 *   preferred_days?: string (comma-separated dates: "2024-11-01,2024-11-03"),
 *   ng_days?: string (comma-separated dates: "2024-11-10,2024-11-20"),
 *   preferred_time_slots?: string (comma-separated: "morning,evening"),
 *   max_hours_per_week?: number,
 *   notes?: string,
 *   status?: string (default: 'PENDING')
 * }
 */
router.post('/preferences', async (req, res) => {
  try {
    const {
      tenant_id,
      store_id,
      staff_id,
      year,
      month,
      preferred_days,
      ng_days,
      preferred_time_slots,
      max_hours_per_week,
      notes,
      status = 'PENDING'
    } = req.body;

    // 必須項目のバリデーション
    if (!tenant_id || !store_id || !staff_id || !year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['tenant_id', 'store_id', 'staff_id', 'year', 'month']
      });
    }

    // year と month のバリデーション
    if (year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year: must be between 2000 and 2100'
      });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid month: must be between 1 and 12'
      });
    }

    // max_hours_per_week のバリデーション
    if (max_hours_per_week !== undefined && max_hours_per_week < 0) {
      return res.status(400).json({
        success: false,
        error: 'max_hours_per_week must be >= 0'
      });
    }

    // submitted_at を現在時刻に設定
    const submitted_at = new Date().toISOString();

    // シフト希望を挿入
    const result = await query(`
      INSERT INTO ops.shift_preferences (
        tenant_id, store_id, staff_id, year, month,
        preferred_days, ng_days, preferred_time_slots,
        max_hours_per_week, notes, submitted_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING preference_id
    `, [
      tenant_id, store_id, staff_id, year, month,
      preferred_days || null, ng_days || null, preferred_time_slots || null,
      max_hours_per_week || null, notes || null, submitted_at, status
    ]);

    // 作成されたシフト希望の詳細情報を取得
    const detailResult = await query(`
      SELECT
        pref.*,
        s.store_name,
        s.store_code,
        staff.name as staff_name,
        staff.staff_code,
        staff.email as staff_email,
        r.role_name,
        et.type_name as employment_type_name
      FROM ops.shift_preferences pref
      LEFT JOIN core.stores s ON pref.store_id = s.store_id
      LEFT JOIN hr.staff staff ON pref.staff_id = staff.staff_id
      LEFT JOIN core.roles r ON staff.role_id = r.role_id
      LEFT JOIN core.employment_types et ON staff.employment_type_id = et.employment_type_id
      WHERE pref.preference_id = $1
    `, [result.rows[0].preference_id]);

    res.status(201).json({
      success: true,
      message: 'Shift preference created successfully',
      data: detailResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating shift preference:', error);

    // 外部キー制約エラーの場合
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Invalid reference: one or more foreign keys do not exist',
        detail: error.detail
      });
    }

    // ユニーク制約エラーの場合（同じスタッフの同じ年月の希望が既に存在）
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Shift preference already exists for this staff, year, and month',
        detail: error.detail
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフト希望更新
 * PUT /api/shifts/preferences/:id
 *
 * Request Body (部分更新 - 変更したい項目のみ送信):
 * {
 *   preferred_days?: string,
 *   ng_days?: string,
 *   preferred_time_slots?: string,
 *   max_hours_per_week?: number,
 *   notes?: string,
 *   status?: string (PENDING/APPROVED/REJECTED)
 * }
 *
 * Query Parameters:
 * - tenant_id: number (required for security)
 */
router.put('/preferences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.query;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required in query parameters'
      });
    }

    // 既存のシフト希望を取得
    const existingResult = await query(
      'SELECT * FROM ops.shift_preferences WHERE preference_id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Shift preference not found'
      });
    }

    const existingPref = existingResult.rows[0];

    // リクエストボディから更新項目を取得
    const {
      preferred_days,
      ng_days,
      preferred_time_slots,
      max_hours_per_week,
      notes,
      status
    } = req.body;

    // 更新する値を決定（指定されていれば新しい値、なければ既存の値）
    const newPreferredDays = preferred_days !== undefined ? preferred_days : existingPref.preferred_days;
    const newNgDays = ng_days !== undefined ? ng_days : existingPref.ng_days;
    const newPreferredTimeSlots = preferred_time_slots !== undefined ? preferred_time_slots : existingPref.preferred_time_slots;
    const newMaxHoursPerWeek = max_hours_per_week !== undefined ? max_hours_per_week : existingPref.max_hours_per_week;
    const newNotes = notes !== undefined ? notes : existingPref.notes;
    const newStatus = status !== undefined ? status : existingPref.status;

    // max_hours_per_week のバリデーション
    if (newMaxHoursPerWeek !== null && newMaxHoursPerWeek < 0) {
      return res.status(400).json({
        success: false,
        error: 'max_hours_per_week must be >= 0'
      });
    }

    // status のバリデーション
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (newStatus && !validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status: must be one of ${validStatuses.join(', ')}`
      });
    }

    // シフト希望を更新
    await query(`
      UPDATE ops.shift_preferences
      SET
        preferred_days = $1,
        ng_days = $2,
        preferred_time_slots = $3,
        max_hours_per_week = $4,
        notes = $5,
        status = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE preference_id = $7 AND tenant_id = $8
    `, [
      newPreferredDays, newNgDays, newPreferredTimeSlots,
      newMaxHoursPerWeek, newNotes, newStatus, id, tenant_id
    ]);

    // 更新後のシフト希望詳細情報を取得
    const detailResult = await query(`
      SELECT
        pref.*,
        s.store_name,
        s.store_code,
        staff.name as staff_name,
        staff.staff_code,
        staff.email as staff_email,
        r.role_name,
        et.type_name as employment_type_name
      FROM ops.shift_preferences pref
      LEFT JOIN core.stores s ON pref.store_id = s.store_id
      LEFT JOIN hr.staff staff ON pref.staff_id = staff.staff_id
      LEFT JOIN core.roles r ON staff.role_id = r.role_id
      LEFT JOIN core.employment_types et ON staff.employment_type_id = et.employment_type_id
      WHERE pref.preference_id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Shift preference updated successfully',
      data: detailResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating shift preference:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフト希望削除
 * DELETE /api/shifts/preferences/:id
 *
 * Query Parameters:
 * - tenant_id: number (required for security)
 */
router.delete('/preferences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.query;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required in query parameters'
      });
    }

    // 削除前に存在確認とtenant_idチェック
    const existingResult = await query(
      'SELECT preference_id, staff_id, year, month FROM ops.shift_preferences WHERE preference_id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Shift preference not found'
      });
    }

    const deletedPref = existingResult.rows[0];

    // シフト希望を削除（物理削除）
    await query(
      'DELETE FROM ops.shift_preferences WHERE preference_id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );

    res.json({
      success: true,
      message: 'Shift preference deleted successfully',
      deleted_preference_id: parseInt(id),
      deleted_preference_info: {
        staff_id: deletedPref.staff_id,
        year: deletedPref.year,
        month: deletedPref.month
      }
    });
  } catch (error) {
    console.error('Error deleting shift preference:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフト登録
 * POST /api/shifts
 *
 * Request Body:
 * {
 *   tenant_id: number,
 *   store_id: number,
 *   plan_id: number,
 *   staff_id: number,
 *   shift_date: string (YYYY-MM-DD),
 *   pattern_id: number,
 *   start_time: string (HH:MM:SS),
 *   end_time: string (HH:MM:SS),
 *   break_minutes: number,
 *   total_hours?: number (optional, auto-calculated),
 *   labor_cost?: number (optional, auto-calculated),
 *   assigned_skills?: array (optional),
 *   is_preferred?: boolean (default: false),
 *   is_modified?: boolean (default: false),
 *   notes?: string (optional)
 * }
 */
router.post('/', async (req, res) => {
  try {
    const {
      tenant_id,
      store_id,
      plan_id,
      staff_id,
      shift_date,
      pattern_id,
      start_time,
      end_time,
      break_minutes,
      total_hours,
      labor_cost,
      assigned_skills,
      is_preferred = false,
      is_modified = false,
      notes
    } = req.body;

    // 必須項目のバリデーション
    if (!tenant_id || !store_id || !plan_id || !staff_id || !shift_date ||
        !pattern_id || !start_time || !end_time || break_minutes === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['tenant_id', 'store_id', 'plan_id', 'staff_id', 'shift_date',
                   'pattern_id', 'start_time', 'end_time', 'break_minutes']
      });
    }

    // break_minutes の検証
    if (break_minutes < 0) {
      return res.status(400).json({
        success: false,
        error: 'break_minutes must be >= 0'
      });
    }

    // total_hours の自動計算（未指定の場合）
    let calculatedTotalHours = total_hours;
    if (calculatedTotalHours === undefined || calculatedTotalHours === null) {
      // 時刻を分に変換して計算
      const startParts = start_time.split(':');
      const endParts = end_time.split(':');
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

      let totalMinutes = endMinutes - startMinutes;
      // 日をまたぐ場合の処理
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60;
      }
      totalMinutes -= break_minutes;

      if (totalMinutes < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time range: break_minutes exceeds work hours'
        });
      }

      calculatedTotalHours = (totalMinutes / 60).toFixed(2);
    }

    // labor_cost の自動計算（未指定の場合）
    let calculatedLaborCost = labor_cost;
    if (calculatedLaborCost === undefined || calculatedLaborCost === null) {
      // スタッフの時給を取得
      const staffResult = await query(
        'SELECT hourly_rate FROM hr.staff WHERE staff_id = $1 AND tenant_id = $2',
        [staff_id, tenant_id]
      );

      if (staffResult.rows.length > 0 && staffResult.rows[0].hourly_rate) {
        const hourlyRate = parseFloat(staffResult.rows[0].hourly_rate);
        calculatedLaborCost = Math.round(hourlyRate * parseFloat(calculatedTotalHours));
      } else {
        calculatedLaborCost = null; // 時給データがない場合はnull
      }
    }

    // assigned_skills を JSONB 形式に変換
    const assignedSkillsJson = assigned_skills ? JSON.stringify(assigned_skills) : null;

    // シフトを挿入
    const result = await query(`
      INSERT INTO ops.shifts (
        tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
        start_time, end_time, break_minutes, total_hours, labor_cost,
        assigned_skills, is_preferred, is_modified, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
      start_time, end_time, break_minutes, calculatedTotalHours, calculatedLaborCost,
      assignedSkillsJson, is_preferred, is_modified, notes
    ]);

    // 作成されたシフトの詳細情報を取得（JOINして関連データも取得）
    const detailResult = await query(`
      SELECT
        sh.*,
        st.store_name,
        st.store_code,
        sp.plan_name,
        sp.status as plan_status,
        staff.name as staff_name,
        staff.staff_code,
        r.role_name,
        pat.pattern_name,
        pat.pattern_code
      FROM ops.shifts sh
      LEFT JOIN ops.shift_plans sp ON sh.plan_id = sp.plan_id
      LEFT JOIN core.stores st ON sh.store_id = st.store_id
      LEFT JOIN hr.staff staff ON sh.staff_id = staff.staff_id
      LEFT JOIN core.roles r ON staff.role_id = r.role_id
      LEFT JOIN core.shift_patterns pat ON sh.pattern_id = pat.pattern_id
      WHERE sh.shift_id = $1
    `, [result.rows[0].shift_id]);

    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: detailResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating shift:', error);

    // 外部キー制約エラーの場合
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Invalid reference: one or more foreign keys do not exist',
        detail: error.detail
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフト更新
 * PUT /api/shifts/:id
 *
 * Request Body (部分更新 - 変更したい項目のみ送信):
 * {
 *   start_time?: string (HH:MM:SS),
 *   end_time?: string (HH:MM:SS),
 *   break_minutes?: number,
 *   shift_date?: string (YYYY-MM-DD),
 *   pattern_id?: number,
 *   staff_id?: number,
 *   total_hours?: number (auto-calculated if time changed),
 *   labor_cost?: number (auto-calculated if time changed),
 *   assigned_skills?: array,
 *   is_preferred?: boolean,
 *   is_modified?: boolean,
 *   notes?: string
 * }
 *
 * Query Parameters:
 * - tenant_id: number (required for security)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.query;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required in query parameters'
      });
    }

    // 既存のシフトを取得
    const existingResult = await query(
      'SELECT * FROM ops.shifts WHERE shift_id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Shift not found'
      });
    }

    const existingShift = existingResult.rows[0];

    // リクエストボディから更新項目を取得
    const {
      start_time,
      end_time,
      break_minutes,
      shift_date,
      pattern_id,
      staff_id,
      total_hours,
      labor_cost,
      assigned_skills,
      is_preferred,
      is_modified,
      notes
    } = req.body;

    // 更新する値を決定（指定されていれば新しい値、なければ既存の値）
    const newStartTime = start_time !== undefined ? start_time : existingShift.start_time;
    const newEndTime = end_time !== undefined ? end_time : existingShift.end_time;
    const newBreakMinutes = break_minutes !== undefined ? break_minutes : existingShift.break_minutes;
    const newShiftDate = shift_date !== undefined ? shift_date : existingShift.shift_date;
    const newPatternId = pattern_id !== undefined ? pattern_id : existingShift.pattern_id;
    const newStaffId = staff_id !== undefined ? staff_id : existingShift.staff_id;
    const newIsPreferred = is_preferred !== undefined ? is_preferred : existingShift.is_preferred;
    const newNotes = notes !== undefined ? notes : existingShift.notes;

    // break_minutes の検証
    if (newBreakMinutes < 0) {
      return res.status(400).json({
        success: false,
        error: 'break_minutes must be >= 0'
      });
    }

    // 時間が変更された場合、is_modifiedを自動的にtrueに設定
    let newIsModified = is_modified !== undefined ? is_modified : existingShift.is_modified;
    if (start_time !== undefined || end_time !== undefined || break_minutes !== undefined) {
      newIsModified = true;
    }

    // total_hours の再計算（時間が変更された場合、または明示的に指定された場合）
    let calculatedTotalHours = total_hours;
    if (calculatedTotalHours === undefined) {
      if (start_time !== undefined || end_time !== undefined || break_minutes !== undefined) {
        // 時間関連の項目が変更された場合は再計算
        const startParts = newStartTime.split(':');
        const endParts = newEndTime.split(':');
        const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

        let totalMinutes = endMinutes - startMinutes;
        if (totalMinutes < 0) {
          totalMinutes += 24 * 60;
        }
        totalMinutes -= newBreakMinutes;

        if (totalMinutes < 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid time range: break_minutes exceeds work hours'
          });
        }

        calculatedTotalHours = (totalMinutes / 60).toFixed(2);
      } else {
        // 時間が変更されていない場合は既存の値を使用
        calculatedTotalHours = existingShift.total_hours;
      }
    }

    // labor_cost の再計算
    let calculatedLaborCost = labor_cost;
    if (calculatedLaborCost === undefined) {
      if (start_time !== undefined || end_time !== undefined || break_minutes !== undefined || staff_id !== undefined) {
        // 時間またはスタッフが変更された場合は再計算
        const staffResult = await query(
          'SELECT hourly_rate FROM hr.staff WHERE staff_id = $1 AND tenant_id = $2',
          [newStaffId, tenant_id]
        );

        if (staffResult.rows.length > 0 && staffResult.rows[0].hourly_rate) {
          const hourlyRate = parseFloat(staffResult.rows[0].hourly_rate);
          calculatedLaborCost = Math.round(hourlyRate * parseFloat(calculatedTotalHours));
        } else {
          calculatedLaborCost = null;
        }
      } else {
        // 変更されていない場合は既存の値を使用
        calculatedLaborCost = existingShift.labor_cost;
      }
    }

    // assigned_skills を JSONB 形式に変換
    const assignedSkillsJson = assigned_skills !== undefined
      ? (assigned_skills ? JSON.stringify(assigned_skills) : null)
      : existingShift.assigned_skills;

    // シフトを更新
    await query(`
      UPDATE ops.shifts
      SET
        shift_date = $1,
        pattern_id = $2,
        staff_id = $3,
        start_time = $4,
        end_time = $5,
        break_minutes = $6,
        total_hours = $7,
        labor_cost = $8,
        assigned_skills = $9,
        is_preferred = $10,
        is_modified = $11,
        notes = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE shift_id = $13 AND tenant_id = $14
    `, [
      newShiftDate, newPatternId, newStaffId, newStartTime, newEndTime,
      newBreakMinutes, calculatedTotalHours, calculatedLaborCost, assignedSkillsJson,
      newIsPreferred, newIsModified, newNotes, id, tenant_id
    ]);

    // 更新後のシフト詳細情報を取得
    const detailResult = await query(`
      SELECT
        sh.*,
        st.store_name,
        st.store_code,
        sp.plan_name,
        sp.status as plan_status,
        staff.name as staff_name,
        staff.staff_code,
        r.role_name,
        pat.pattern_name,
        pat.pattern_code
      FROM ops.shifts sh
      LEFT JOIN ops.shift_plans sp ON sh.plan_id = sp.plan_id
      LEFT JOIN core.stores st ON sh.store_id = st.store_id
      LEFT JOIN hr.staff staff ON sh.staff_id = staff.staff_id
      LEFT JOIN core.roles r ON staff.role_id = r.role_id
      LEFT JOIN core.shift_patterns pat ON sh.pattern_id = pat.pattern_id
      WHERE sh.shift_id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Shift updated successfully',
      data: detailResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating shift:', error);

    // 外部キー制約エラーの場合
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Invalid reference: one or more foreign keys do not exist',
        detail: error.detail
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフト削除
 * DELETE /api/shifts/:id
 *
 * Query Parameters:
 * - tenant_id: number (required for security)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.query;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required in query parameters'
      });
    }

    // 削除前に存在確認とtenant_idチェック
    const existingResult = await query(
      'SELECT shift_id, staff_id, shift_date, start_time, end_time FROM ops.shifts WHERE shift_id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Shift not found'
      });
    }

    const deletedShift = existingResult.rows[0];

    // シフトを削除（物理削除）
    await query(
      'DELETE FROM ops.shifts WHERE shift_id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );

    res.json({
      success: true,
      message: 'Shift deleted successfully',
      deleted_shift_id: parseInt(id),
      deleted_shift_info: {
        staff_id: deletedShift.staff_id,
        shift_date: deletedShift.shift_date,
        start_time: deletedShift.start_time,
        end_time: deletedShift.end_time
      }
    });
  } catch (error) {
    console.error('Error deleting shift:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
