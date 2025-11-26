import express from 'express';
import { query } from '../config/database.js';
import DEFAULT_CONFIG from '../config/defaults.js';
import { SHIFT_PREFERENCE_STATUS, VALID_PREFERENCE_STATUSES } from '../config/constants.js';
import { VALIDATION_MESSAGES } from '../config/validation.js';
import ShiftGenerationService from '../services/shift/ShiftGenerationService.js';
import ConstraintValidationService from '../services/shift/ConstraintValidationService.js';
import { calculateWorkHours, calculateWorkHoursFixed, formatDateToYYYYMMDD } from '../utils/timeUtils.js';

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
 * - status: ステータス (optional) DRAFT/APPROVED
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
        sp.plan_type,
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
    const { tenant_id = 1, store_id, year, month, plan_type } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        error: 'Year parameter is required'
      });
    }

    let sql = `
      SELECT
        sp.plan_year as year,
        sp.plan_month as month,
        sp.plan_type,
        LOWER(sp.status) as status,
        sp.plan_id,
        sp.store_id,
        st.store_name,
        COUNT(sh.shift_id)::int as shift_count,
        COUNT(DISTINCT sh.staff_id)::int as staff_count,
        ROUND(SUM(COALESCE(sh.total_hours, 0))::numeric, 2) as total_hours,
        ROUND(SUM(COALESCE(sh.labor_cost, 0))::numeric, 2) as total_labor_cost,
        ROUND(AVG(NULLIF(sh.total_hours, NULL))::numeric, 2) as avg_hours_per_shift,
        COUNT(CASE WHEN sh.is_modified = true THEN 1 END)::int as modified_count








      FROM ops.shift_plans sp
      LEFT JOIN ops.shifts sh ON sp.plan_id = sh.plan_id AND sp.tenant_id = sh.tenant_id
      LEFT JOIN core.stores st ON sp.store_id = st.store_id
      WHERE sp.tenant_id = $1
        AND sp.plan_year = $2
    `;

    const params = [tenant_id, year];
    let paramIndex = 3;

    if (store_id) {
      sql += ` AND sp.store_id = $${paramIndex}`;
      params.push(store_id);
      paramIndex++;
    }

    if (month) {
      sql += ` AND sp.plan_month = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    if (plan_type) {
      sql += ` AND sp.plan_type = $${paramIndex}`;
      params.push(plan_type);
      paramIndex++;
    }

    sql += ` GROUP BY sp.plan_year, sp.plan_month, sp.plan_type, sp.status, sp.plan_id, sp.store_id, st.store_name`;
    sql += ` ORDER BY year DESC, month DESC, sp.store_id`;

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
      is_modified,
      plan_type
    } = req.query;

    let sql = `
      SELECT
        sh.shift_id,
        sh.tenant_id,
        sh.store_id,
        st.store_name,
        sh.plan_id,
        sp.plan_name,
        sp.plan_type,
        sp.status as plan_status,
        sh.staff_id,
        staff.name as staff_name,
        staff.staff_code,
        r.role_name,
        TO_CHAR(sh.shift_date, 'YYYY-MM-DD') as shift_date,
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

    if (plan_type) {
      sql += ` AND sp.plan_type = $${paramIndex}`;
      params.push(plan_type);
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
 * 第1案シフト作成（前月コピー）
 * POST /api/shifts/plans/generate
 *
 * Request Body:
 * {
 *   tenant_id: number,
 *   store_id: number,
 *   year: number,        // 作成したい月の年
 *   month: number,       // 作成したい月
 *   created_by?: number  // 作成者のstaff_id (optional)
 * }
 */
router.post('/plans/generate', async (req, res) => {
  try {
    const { tenant_id, store_id, year, month, created_by } = req.body;

    // 必須項目のバリデーション
    if (!tenant_id || !store_id || !year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['tenant_id', 'store_id', 'year', 'month']
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

    // 過去月チェック（現在月より前の月は作成・更新不可）
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create or update shifts for past months',
        message: `${year}年${month}月は過去の月のため、シフトを作成・更新できません。`
      });
    }

    // トランザクション開始
    await query('BEGIN');

    let isUpdate = false;
    let existingPlanId = null;

    try {
      // 既存のシフト計画とシフトデータをチェック（排他ロック）
      const existingPlan = await query(`
        SELECT plan_id, status FROM ops.shift_plans
        WHERE tenant_id = $1 AND store_id = $2 AND plan_year = $3 AND plan_month = $4
        FOR UPDATE
      `, [tenant_id, store_id, year, month]);

      // 既存データがある場合はアップデートモード
      if (existingPlan.rows.length > 0) {
        isUpdate = true;
        existingPlanId = existingPlan.rows[0].plan_id;

        // 既存のシフトデータを削除（プランは残す）
        await query(`
          DELETE FROM ops.shifts
          WHERE plan_id = $1
        `, [existingPlanId]);
      }
    } catch (lockError) {
      await query('ROLLBACK');
      throw lockError;
    }

    // 前月の計算
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    // 前月のシフトデータを取得
    const prevShifts = await query(`
      SELECT
        sh.shift_id,
        sh.tenant_id,
        sh.store_id,
        sh.plan_id,
        sh.staff_id,
        TO_CHAR(sh.shift_date, 'YYYY-MM-DD') as shift_date,
        sh.pattern_id,
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
        pat.pattern_name,
        pat.pattern_code
      FROM ops.shifts sh
      LEFT JOIN core.shift_patterns pat ON sh.pattern_id = pat.pattern_id
      WHERE sh.tenant_id = $1
        AND sh.store_id = $2
        AND EXTRACT(YEAR FROM sh.shift_date) = $3
        AND EXTRACT(MONTH FROM sh.shift_date) = $4
      ORDER BY sh.shift_date, sh.staff_id, sh.start_time
    `, [tenant_id, store_id, prevYear, prevMonth]);

    if (prevShifts.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No shift data found for previous month (${prevYear}/${prevMonth})`,
        message: '前月のシフトデータが存在しません。最初の月は手動でシフトを作成してください。'
      });
    }

    // 新規作成 or アップデート
    let newPlanId;

    if (isUpdate) {
      // アップデートの場合は既存のplan_idを使用
      newPlanId = existingPlanId;
    } else {
      // 新規作成の場合
      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0); // 月の最終日

      const planCode = `PLAN-${year}${String(month).padStart(2, '0')}-001`;
      const planName = `${year}年${month}月シフト（第1案）`;

      console.log('📝 Creating new plan with params:', {
        tenant_id,
        store_id,
        year,
        month,
        planCode,
        planName,
        plan_type: 'FIRST',
        status: 'DRAFT'
      });

      const planResult = await query(`
        INSERT INTO ops.shift_plans (
          tenant_id, store_id, plan_year, plan_month,
          plan_code, plan_name, period_start, period_end,
          plan_type, status, generation_type, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'FIRST', 'DRAFT', 'COPY_PREVIOUS', $9)
        RETURNING plan_id, store_id, plan_year, plan_month, plan_type, status
      `, [
        tenant_id, store_id, year, month,
        planCode, planName, periodStart, periodEnd,
        created_by || null
      ]);

      console.log('✅ Plan created:', planResult.rows[0]);

      newPlanId = planResult.rows[0].plan_id;
    }

    // 前月のシフトを週番号+曜日ベースでコピー
    const copiedShifts = [];

    // 週番号と曜日を計算するヘルパー関数
    const getWeekInfo = (date) => {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const dayOfWeek = date.getDay(); // 0=日, 1=月, ...
      const dayOfMonth = date.getDate();
      const weekNumber = Math.ceil((dayOfMonth + firstDay.getDay()) / 7);
      return { weekNumber, dayOfWeek };
    };

    // 前月のシフトを週番号別に整理
    const shiftsByWeekAndDay = {};
    for (const shift of prevShifts.rows) {
      const prevDate = new Date(shift.shift_date);
      const { weekNumber, dayOfWeek } = getWeekInfo(prevDate);
      const key = `w${weekNumber}_d${dayOfWeek}`;
      if (!shiftsByWeekAndDay[key]) {
        shiftsByWeekAndDay[key] = [];
      }
      shiftsByWeekAndDay[key].push(shift);
    }

    // 新しい月の全日付を週番号+曜日でマッピング
    const daysInNewMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInNewMonth; day++) {
      const newShiftDate = new Date(year, month - 1, day);
      const { weekNumber, dayOfWeek } = getWeekInfo(newShiftDate);

      // 該当する週+曜日のシフトを探す
      let key = `w${weekNumber}_d${dayOfWeek}`;
      let shiftsForDay = shiftsByWeekAndDay[key];

      // 存在しない週の場合、第1週の同じ曜日を使う
      if (!shiftsForDay || shiftsForDay.length === 0) {
        key = `w1_d${dayOfWeek}`;
        shiftsForDay = shiftsByWeekAndDay[key];
      }

      // それでもない場合はスキップ
      if (!shiftsForDay || shiftsForDay.length === 0) {
        continue;
      }

      // その日のシフトをコピー
      for (const shift of shiftsForDay) {
        // スタッフが現在も在籍しているか確認
        const staffCheck = await query(
          'SELECT staff_id, hourly_rate FROM hr.staff WHERE staff_id = $1 AND tenant_id = $2 AND is_active = true',
          [shift.staff_id, tenant_id]
        );

        if (staffCheck.rows.length === 0) {
          // 退職済みスタッフはスキップ
          continue;
        }

        // 労働時間と人件費を計算
        const startTime = shift.start_time;
        const endTime = shift.end_time;
        const breakMinutes = shift.break_minutes || 0;

        const startParts = startTime.split(':');
        const endParts = endTime.split(':');
        const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

        let totalMinutes = endMinutes - startMinutes;
        if (totalMinutes < 0) {
          totalMinutes += 24 * 60;
        }
        totalMinutes -= breakMinutes;

        const totalHours = (totalMinutes / 60).toFixed(2);
        const hourlyRate = parseFloat(staffCheck.rows[0].hourly_rate || 1200);
        const laborCost = Math.round(hourlyRate * parseFloat(totalHours));

        // 新しいシフトを挿入
        const insertResult = await query(`
          INSERT INTO ops.shifts (
            tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
            start_time, end_time, break_minutes, total_hours, labor_cost,
            assigned_skills, is_preferred, is_modified, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, false, $13)
          RETURNING shift_id
        `, [
          tenant_id, store_id, newPlanId, shift.staff_id, newShiftDate, shift.pattern_id,
          startTime, endTime, breakMinutes, totalHours, laborCost,
          shift.assigned_skills, `前月(${prevYear}/${prevMonth})第${weekNumber}週${key.includes('w1') ? '(第1週から補完)' : ''}からコピー`
        ]);

        copiedShifts.push(insertResult.rows[0].shift_id);
      }
    }

    // シフト計画の集計値を更新
    const summaryResult = await query(`
      SELECT
        COUNT(*) as shift_count,
        SUM(total_hours) as total_hours,
        SUM(labor_cost) as total_cost
      FROM ops.shifts
      WHERE plan_id = $1
    `, [newPlanId]);

    const summary = summaryResult.rows[0];

    await query(`
      UPDATE ops.shift_plans
      SET
        total_labor_hours = $1,
        total_labor_cost = $2
      WHERE plan_id = $3
    `, [
      parseFloat(summary.total_hours || 0),
      parseInt(summary.total_cost || 0),
      newPlanId
    ]);

    // 作成されたシフト計画の詳細情報を取得
    const detailResult = await query(`
      SELECT
        sp.*,
        s.store_name,
        s.store_code,
        creator.name as creator_name,
        (SELECT COUNT(*) FROM ops.shifts WHERE plan_id = sp.plan_id) as shift_count,
        (SELECT COUNT(DISTINCT staff_id) FROM ops.shifts WHERE plan_id = sp.plan_id) as staff_count
      FROM ops.shift_plans sp
      LEFT JOIN core.stores s ON sp.store_id = s.store_id
      LEFT JOIN hr.staff creator ON sp.created_by = creator.staff_id
      WHERE sp.plan_id = $1
    `, [newPlanId]);

    // トランザクションをコミット
    await query('COMMIT');

    const actionMessage = isUpdate
      ? `第1案シフトを更新しました（前月 ${prevYear}/${prevMonth} から ${copiedShifts.length} 件コピー）`
      : `第1案シフトを作成しました（前月 ${prevYear}/${prevMonth} から ${copiedShifts.length} 件コピー）`;

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: actionMessage,
      is_update: isUpdate,
      data: detailResult.rows[0],
      copied_shifts_count: copiedShifts.length,
      source_month: { year: prevYear, month: prevMonth },
      target_month: { year, month }
    });
  } catch (error) {
    // エラー時はロールバック
    await query('ROLLBACK');
    console.error('Error generating shift plan:', error);

    // 外部キー制約エラーの場合
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Invalid reference: one or more foreign keys do not exist',
        detail: error.detail
      });
    }

    // ユニーク制約エラーの場合
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Shift plan already exists for this year and month',
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
 * AIシフト自動生成
 * POST /api/shifts/plans/generate-ai
 *
 * Request Body:
 * {
 *   tenant_id: number,
 *   store_id: number,
 *   year: number,
 *   month: number,
 *   created_by?: number,
 *   options?: {
 *     model?: string (default: 'gpt-4-turbo-preview'),
 *     temperature?: number (default: 0.7),
 *     maxRetries?: number (default: 3)
 *   }
 * }
 */
router.post('/plans/generate-ai', async (req, res) => {
  try {
    const { tenant_id, store_id, year, month, created_by, options = {} } = req.body;

    // 必須項目のバリデーション
    if (!tenant_id || !store_id || !year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['tenant_id', 'store_id', 'year', 'month']
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

    // 過去月チェック
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create shifts for past months',
        message: `${year}年${month}月は過去の月のため、シフトを作成できません。`
      });
    }

    console.log('[API] AI自動生成リクエスト:', { tenant_id, store_id, year, month, options });

    // AIシフト生成サービスを実行
    const generationService = new ShiftGenerationService();
    const result = await generationService.generateShifts(
      tenant_id,
      store_id,
      year,
      month,
      options
    );

    // トランザクション開始
    await query('BEGIN');

    try {
      // 既存のシフト計画をチェック
      const existingPlan = await query(`
        SELECT plan_id, status FROM ops.shift_plans
        WHERE tenant_id = $1 AND store_id = $2 AND plan_year = $3 AND plan_month = $4
        FOR UPDATE
      `, [tenant_id, store_id, year, month]);

      let planId;
      let isUpdate = false;

      if (existingPlan.rows.length > 0) {
        // 既存プランがある場合は更新
        planId = existingPlan.rows[0].plan_id;
        isUpdate = true;

        // 既存シフトを削除
        await query('DELETE FROM ops.shifts WHERE plan_id = $1', [planId]);
      } else {
        // 新規プラン作成
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0);
        const planCode = `PLAN-${year}${String(month).padStart(2, '0')}-AI`;
        const planName = `${year}年${month}月シフト（AI生成）`;

        const planResult = await query(`
          INSERT INTO ops.shift_plans (
            tenant_id, store_id, plan_year, plan_month,
            plan_code, plan_name, period_start, period_end,
            status, generation_type, ai_model_version, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT', 'AI_GENERATED', $9, $10)
          RETURNING plan_id
        `, [
          tenant_id, store_id, year, month,
          planCode, planName, periodStart, periodEnd,
          options.model || 'gpt-4-turbo-preview',
          created_by || null
        ]);

        planId = planResult.rows[0].plan_id;
      }

      // AIが生成したシフトをDBに登録
      let insertedCount = 0;
      for (const shift of result.shifts) {
        await query(`
          INSERT INTO ops.shifts (
            tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
            start_time, end_time, break_minutes, total_hours, labor_cost,
            is_preferred, is_modified, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, false, 'AI自動生成')
        `, [
          tenant_id, store_id, planId, shift.staff_id, shift.shift_date, shift.pattern_id,
          shift.start_time, shift.end_time, shift.break_minutes,
          null, null // total_hours, labor_cost は後で集計
        ]);

        insertedCount++;
      }

      // シフト計画の集計値を更新
      const summaryResult = await query(`
        SELECT
          COUNT(*) as shift_count,
          SUM(total_hours) as total_hours,
          SUM(labor_cost) as total_cost
        FROM ops.shifts
        WHERE plan_id = $1
      `, [planId]);

      const summary = summaryResult.rows[0];

      await query(`
        UPDATE ops.shift_plans
        SET
          total_labor_hours = $1,
          total_labor_cost = $2,
          constraint_violations = $3
        WHERE plan_id = $4
      `, [
        parseFloat(summary.total_hours || 0),
        parseInt(summary.total_cost || 0),
        result.validation.violations.length,
        planId
      ]);

      // コミット
      await query('COMMIT');

      res.status(isUpdate ? 200 : 201).json({
        success: true,
        message: isUpdate
          ? `AI自動生成でシフトを更新しました (${insertedCount}件)`
          : `AI自動生成でシフトを作成しました (${insertedCount}件)`,
        is_update: isUpdate,
        data: {
          plan_id: planId,
          year,
          month,
          shifts_count: insertedCount,
          validation: result.validation.summary,
          violations: result.validation.violations,
          metadata: result.metadata
        }
      });

    } catch (dbError) {
      await query('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    console.error('[API] AI自動生成エラー:', error);

    // ShiftGenerationServiceからのエラー
    if (error.success === false) {
      return res.status(500).json({
        success: false,
        error: error.error,
        phase: error.phase,
        elapsed_ms: error.elapsed_ms
      });
    }

    // その他のエラー
    res.status(500).json({
      success: false,
      error: error.message || 'AI自動生成中にエラーが発生しました'
    });
  }
});

/**
 * 第1案承認
 * POST /api/shifts/plans/approve-first
 *
 * Request Body:
 * - plan_id: 承認するplan_id (required)
 * - tenant_id: テナントID (default: 1)
 */
router.post('/plans/approve-first', async (req, res) => {
  try {
    const { plan_id, tenant_id = 1 } = req.body;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: plan_id'
      });
    }

    // プランの存在確認
    const planCheck = await query(
      `SELECT plan_id, status FROM ops.shift_plans WHERE plan_id = $1 AND tenant_id = $2`,
      [plan_id, tenant_id]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        message: 'シフト計画が見つかりません'
      });
    }

    // ステータスをAPPROVEDに更新
    await query(
      `UPDATE ops.shift_plans
       SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
       WHERE plan_id = $1`,
      [plan_id]
    );

    res.json({
      success: true,
      message: '第1案を承認しました',
      data: {
        plan_id: plan_id,
        status: 'APPROVED'
      }
    });

  } catch (error) {
    console.error('Error approving first plan:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 第2案承認・保存
 * POST /api/shifts/plans/approve-second
 *
 * Request Body:
 * - tenant_id: テナントID (default: 1)
 * - store_id: 店舗ID (default: 1)
 * - plan_id: 第1案のplan_id (required)
 * - year: 年 (required)
 * - month: 月 (required)
 * - shifts: シフトデータ配列 (required)
 * - created_by: 作成者ID
 */
router.post('/plans/approve-second', async (req, res) => {
  try {
    const {
      tenant_id = 1,
      store_id = 1,
      plan_id: firstPlanId,
      year,
      month,
      shifts,
      created_by = 1
    } = req.body;

    // 必須パラメータチェック
    if (!firstPlanId || !year || !month || !shifts || !Array.isArray(shifts)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: plan_id, year, month, shifts'
      });
    }

    // 第1案が存在するか確認
    const firstPlanCheck = await query(
      `SELECT plan_id, status FROM ops.shift_plans
       WHERE plan_id = $1 AND tenant_id = $2`,
      [firstPlanId, tenant_id]
    );

    if (firstPlanCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'First plan not found',
        message: '第1案が見つかりません'
      });
    }

    // 第2案用のshift_planを作成または取得
    // plan_type='SECOND'のプランを探す
    const existingSecondPlan = await query(
      `SELECT plan_id FROM ops.shift_plans
       WHERE tenant_id = $1 AND store_id = $2
       AND plan_year = $3 AND plan_month = $4
       AND plan_type = 'SECOND'`,
      [tenant_id, store_id, year, month]
    );

    let secondPlanId;

    if (existingSecondPlan.rows.length > 0) {
      // 既存の第2案を更新
      secondPlanId = existingSecondPlan.rows[0].plan_id;

      // 既存のシフトを削除
      await query(
        `DELETE FROM ops.shifts
         WHERE plan_id = $1 AND tenant_id = $2`,
        [secondPlanId, tenant_id]
      );

      // shift_planを更新
      await query(
        `UPDATE ops.shift_plans
         SET status = 'DRAFT', updated_at = CURRENT_TIMESTAMP
         WHERE plan_id = $1`,
        [secondPlanId]
      );
    } else {
      // 新規第2案を作成
      const newPlan = await query(
        `INSERT INTO ops.shift_plans (
          tenant_id, store_id, plan_year, plan_month,
          plan_type, status, created_by
        ) VALUES ($1, $2, $3, $4, 'SECOND', 'DRAFT', $5)
        RETURNING plan_id`,
        [tenant_id, store_id, year, month, created_by]
      );

      secondPlanId = newPlan.rows[0].plan_id;
    }

    // シフトデータを挿入
    let insertedCount = 0;
    for (const shift of shifts) {
      // 日付を計算
      const shiftDate = `${year}-${String(month).padStart(2, '0')}-${String(shift.date).padStart(2, '0')}`;

      // スタッフ名からstaff_idを取得
      const staffResult = await query(
        `SELECT staff_id FROM hr.staff WHERE name = $1 AND tenant_id = $2 LIMIT 1`,
        [shift.name, tenant_id]
      );

      if (staffResult.rows.length === 0) {
        console.warn(`Staff not found: ${shift.name}`);
        continue;
      }

      const staffId = staffResult.rows[0].staff_id;

      // 時間をパース
      const [startHour, endHour] = shift.time.split('-');
      const startTime = `${startHour.padStart(2, '0')}:00:00`;
      const endTime = `${endHour.padStart(2, '0')}:00:00`;

      // 労働時間を計算
      const start = parseInt(startHour);
      const end = parseInt(endHour);
      const hours = end - start;

      // スタッフの時給を取得
      const staffInfo = await query(
        `SELECT hourly_wage FROM hr.staff WHERE staff_id = $1`,
        [staffId]
      );
      const hourlyWage = staffInfo.rows[0]?.hourly_wage || 0;
      const cost = hours * hourlyWage;

      // シフトを挿入
      await query(
        `INSERT INTO ops.shifts (
          tenant_id, plan_id, shift_date, staff_id,
          start_time, end_time, hours, cost,
          is_preferred, skill_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          tenant_id, secondPlanId, shiftDate, staffId,
          startTime, endTime, hours, cost,
          shift.preferred || false,
          shift.skill || 1
        ]
      );

      insertedCount++;
    }

    // 統計情報を計算
    const stats = await query(
      `SELECT
        COUNT(*) as total_shifts,
        SUM(hours) as total_hours,
        SUM(cost) as total_cost,
        COUNT(DISTINCT staff_id) as staff_count
       FROM ops.shifts
       WHERE plan_id = $1`,
      [secondPlanId]
    );

    res.json({
      success: true,
      message: shifts.length === insertedCount
        ? '第2案を保存しました'
        : `第2案を保存しました（${insertedCount}/${shifts.length}件）`,
      data: {
        plan_id: secondPlanId,
        plan_type: 'SECOND',
        year,
        month,
        inserted_shifts: insertedCount,
        total_shifts: shifts.length,
        stats: stats.rows[0]
      }
    });

  } catch (error) {
    console.error('Error approving second plan:', error);
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

// ============================================
// シフト希望API (Shift Preferences)
// ============================================
// ★大幅変更: 1日1レコード形式に対応（設計書: docs/design-docs/20251126_shift_preferences_schema_change.html）

/**
 * シフト希望一覧取得
 * GET /api/shifts/preferences
 *
 * Query Parameters:
 * - tenant_id: テナントID (required, default: 1)
 * - store_id: 店舗ID (optional)
 * - staff_id: スタッフID (optional)
 * - date_from: 開始日 (optional, format: YYYY-MM-DD) ★変更: year,month → date_from,date_to
 * - date_to: 終了日 (optional, format: YYYY-MM-DD)
 * - is_ng: NGフラグ (optional, true/false)
 */
router.get('/preferences', async (req, res) => {
  try {
    const { tenant_id = 1, store_id, staff_id, date_from, date_to, is_ng } = req.query;

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
        staff.employment_type,
        r.role_name,
        pref.preference_date,
        pref.is_ng,
        pref.start_time,
        pref.end_time,
        pref.notes,
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

    if (date_from) {
      sql += ` AND pref.preference_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      sql += ` AND pref.preference_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    if (is_ng !== undefined) {
      sql += ` AND pref.is_ng = $${paramIndex}`;
      params.push(is_ng === 'true' || is_ng === true);
      paramIndex++;
    }

    sql += ` ORDER BY pref.preference_date ASC, staff.name ASC`;

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
        pref.preference_id,
        pref.tenant_id,
        pref.store_id,
        pref.staff_id,
        pref.preference_date,
        pref.is_ng,
        pref.start_time,
        pref.end_time,
        pref.notes,
        pref.created_at,
        pref.updated_at,
        s.store_name,
        s.store_code,
        staff.name as staff_name,
        staff.staff_code,
        staff.email as staff_email,
        staff.phone_number as staff_phone,
        staff.employment_type,
        r.role_name
      FROM ops.shift_preferences pref
      LEFT JOIN core.stores s ON pref.store_id = s.store_id
      LEFT JOIN hr.staff staff ON pref.staff_id = staff.staff_id
      LEFT JOIN core.roles r ON staff.role_id = r.role_id
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
 * シフト希望登録（1日1レコード形式）
 * POST /api/shifts/preferences
 *
 * Request Body:
 * {
 *   tenant_id: number,
 *   store_id: number,
 *   staff_id: number,
 *   preference_date: string (YYYY-MM-DD),
 *   is_ng: boolean (default: false),
 *   start_time?: string (HH:MM, 例: "09:00", "25:00"),
 *   end_time?: string (HH:MM),
 *   notes?: string
 * }
 */
router.post('/preferences', async (req, res) => {
  try {
    const {
      tenant_id,
      store_id,
      staff_id,
      preference_date,
      is_ng = false,
      start_time,
      end_time,
      notes
    } = req.body;

    // 必須項目のバリデーション
    if (!tenant_id || !store_id || !staff_id || !preference_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['tenant_id', 'store_id', 'staff_id', 'preference_date']
      });
    }

    // preference_date のバリデーション（YYYY-MM-DD形式）
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(preference_date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid preference_date format: must be YYYY-MM-DD'
      });
    }

    // 時刻のバリデーション（HH:MM形式、05:00〜28:00）
    const timeRegex = /^([0-2][0-9]):([0-5][0-9])$/;
    if (start_time && !timeRegex.test(start_time)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid start_time format: must be HH:MM'
      });
    }
    if (end_time && !timeRegex.test(end_time)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid end_time format: must be HH:MM'
      });
    }

    // シフト希望を挿入
    const result = await query(`
      INSERT INTO ops.shift_preferences (
        tenant_id, store_id, staff_id, preference_date,
        is_ng, start_time, end_time, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING preference_id
    `, [
      tenant_id, store_id, staff_id, preference_date,
      is_ng, start_time || null, end_time || null, notes || null
    ]);

    // 作成されたシフト希望の詳細情報を取得
    const detailResult = await query(`
      SELECT
        pref.preference_id,
        pref.tenant_id,
        pref.store_id,
        pref.staff_id,
        pref.preference_date,
        pref.is_ng,
        pref.start_time,
        pref.end_time,
        pref.notes,
        pref.created_at,
        pref.updated_at,
        s.store_name,
        s.store_code,
        staff.name as staff_name,
        staff.staff_code,
        staff.email as staff_email,
        staff.employment_type,
        r.role_name
      FROM ops.shift_preferences pref
      LEFT JOIN core.stores s ON pref.store_id = s.store_id
      LEFT JOIN hr.staff staff ON pref.staff_id = staff.staff_id
      LEFT JOIN core.roles r ON staff.role_id = r.role_id
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

    // ユニーク制約エラーの場合（同じスタッフの同じ日付の希望が既に存在）
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Shift preference already exists for this staff and date',
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
 * シフト希望更新（1日1レコード形式）
 * PUT /api/shifts/preferences/:id
 *
 * Request Body (部分更新 - 変更したい項目のみ送信):
 * {
 *   is_ng?: boolean,
 *   start_time?: string (HH:MM),
 *   end_time?: string (HH:MM),
 *   notes?: string
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
      is_ng,
      start_time,
      end_time,
      notes
    } = req.body;

    // 更新する値を決定（指定されていれば新しい値、なければ既存の値）
    const newIsNg = is_ng !== undefined ? is_ng : existingPref.is_ng;
    const newStartTime = start_time !== undefined ? start_time : existingPref.start_time;
    const newEndTime = end_time !== undefined ? end_time : existingPref.end_time;
    const newNotes = notes !== undefined ? notes : existingPref.notes;

    // 時刻のバリデーション（HH:MM形式）
    const timeRegex = /^([0-2][0-9]):([0-5][0-9])$/;
    if (newStartTime && !timeRegex.test(newStartTime)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid start_time format: must be HH:MM'
      });
    }
    if (newEndTime && !timeRegex.test(newEndTime)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid end_time format: must be HH:MM'
      });
    }

    // シフト希望を更新
    await query(`
      UPDATE ops.shift_preferences
      SET
        is_ng = $1,
        start_time = $2,
        end_time = $3,
        notes = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE preference_id = $5 AND tenant_id = $6
    `, [
      newIsNg, newStartTime, newEndTime, newNotes, id, tenant_id
    ]);

    // 更新後のシフト希望詳細情報を取得
    const detailResult = await query(`
      SELECT
        pref.preference_id,
        pref.tenant_id,
        pref.store_id,
        pref.staff_id,
        pref.preference_date,
        pref.is_ng,
        pref.start_time,
        pref.end_time,
        pref.notes,
        pref.created_at,
        pref.updated_at,
        s.store_name,
        s.store_code,
        staff.name as staff_name,
        staff.staff_code,
        staff.email as staff_email,
        staff.employment_type,
        r.role_name
      FROM ops.shift_preferences pref
      LEFT JOIN core.stores s ON pref.store_id = s.store_id
      LEFT JOIN hr.staff staff ON pref.staff_id = staff.staff_id
      LEFT JOIN core.roles r ON staff.role_id = r.role_id
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
 * シフト希望一括登録（1日1レコード形式）
 * POST /api/shifts/preferences/bulk
 *
 * Request Body:
 * {
 *   tenant_id: number,
 *   store_id: number,
 *   staff_id: number,
 *   preferences: [
 *     {
 *       preference_date: string (YYYY-MM-DD),
 *       is_ng: boolean,
 *       start_time?: string (HH:MM),
 *       end_time?: string (HH:MM),
 *       notes?: string
 *     },
 *     ...
 *   ]
 * }
 */
router.post('/preferences/bulk', async (req, res) => {
  try {
    const {
      tenant_id,
      store_id,
      staff_id,
      preferences
    } = req.body;

    // 必須項目のバリデーション
    if (!tenant_id || !store_id || !staff_id || !preferences || !Array.isArray(preferences)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['tenant_id', 'store_id', 'staff_id', 'preferences (array)']
      });
    }

    if (preferences.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'preferences array cannot be empty'
      });
    }

    // 各preference のバリデーション
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^([0-2][0-9]):([0-5][0-9])$/;

    for (const pref of preferences) {
      if (!pref.preference_date) {
        return res.status(400).json({
          success: false,
          error: 'Each preference must have preference_date'
        });
      }
      if (!dateRegex.test(pref.preference_date)) {
        return res.status(400).json({
          success: false,
          error: `Invalid preference_date format: ${pref.preference_date}. Must be YYYY-MM-DD`
        });
      }
      if (pref.start_time && !timeRegex.test(pref.start_time)) {
        return res.status(400).json({
          success: false,
          error: `Invalid start_time format: ${pref.start_time}. Must be HH:MM`
        });
      }
      if (pref.end_time && !timeRegex.test(pref.end_time)) {
        return res.status(400).json({
          success: false,
          error: `Invalid end_time format: ${pref.end_time}. Must be HH:MM`
        });
      }
    }

    // 一括挿入（UPSERT: 既存データは更新）
    const insertedIds = [];
    const updatedIds = [];
    const errors = [];

    for (const pref of preferences) {
      try {
        // UPSERT: 存在すれば更新、なければ挿入
        const result = await query(`
          INSERT INTO ops.shift_preferences (
            tenant_id, store_id, staff_id, preference_date,
            is_ng, start_time, end_time, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (tenant_id, staff_id, preference_date)
          DO UPDATE SET
            is_ng = EXCLUDED.is_ng,
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            notes = EXCLUDED.notes,
            updated_at = CURRENT_TIMESTAMP
          RETURNING preference_id, (xmax = 0) as is_insert
        `, [
          tenant_id, store_id, staff_id, pref.preference_date,
          pref.is_ng || false,
          pref.start_time || null,
          pref.end_time || null,
          pref.notes || null
        ]);

        if (result.rows[0].is_insert) {
          insertedIds.push(result.rows[0].preference_id);
        } else {
          updatedIds.push(result.rows[0].preference_id);
        }
      } catch (err) {
        errors.push({
          preference_date: pref.preference_date,
          error: err.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Bulk operation completed',
      inserted_count: insertedIds.length,
      updated_count: updatedIds.length,
      error_count: errors.length,
      inserted_ids: insertedIds,
      updated_ids: updatedIds,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk creating shift preferences:', error);

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
      'SELECT preference_id, staff_id, preference_date FROM ops.shift_preferences WHERE preference_id = $1 AND tenant_id = $2',
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
        preference_date: deletedPref.preference_date
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
 * 特定シフトの詳細取得
 * GET /api/shifts/:id
 *
 * NOTE: このルートは /preferences などの具体的なルートより後に配置する必要があります
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
        error: VALIDATION_MESSAGES.INVALID_BREAK_MINUTES
      });
    }

    // total_hours の自動計算（未指定の場合）
    let calculatedTotalHours = total_hours;
    if (calculatedTotalHours === undefined || calculatedTotalHours === null) {
      const workHours = calculateWorkHours(start_time, end_time, break_minutes);

      if (workHours < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid time range: break_minutes exceeds work hours'
        });
      }

      calculatedTotalHours = workHours.toFixed(2);
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
        error: VALIDATION_MESSAGES.INVALID_BREAK_MINUTES
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
        const workHours = calculateWorkHours(newStartTime, newEndTime, newBreakMinutes);

        if (workHours < 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid time range: break_minutes exceeds work hours'
          });
        }

        calculatedTotalHours = workHours.toFixed(2);
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

/**
 * シフト計画の削除
 * DELETE /api/shifts/plans/:plan_id
 *
 * Query Parameters:
 * - tenant_id: テナントID (required)
 *
 * 注意: 過去月以外のプランは削除可能（ステータスに関わらず）
 */
router.delete('/plans/:plan_id', async (req, res) => {
  try {
    const { plan_id } = req.params;
    const { tenant_id = 1 } = req.query;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: plan_id'
      });
    }

    // トランザクション開始
    await query('BEGIN');

    try {
      // プランの存在確認とステータスチェック
      const planCheck = await query(
        `SELECT plan_id, status, plan_year, plan_month, store_id FROM ops.shift_plans
         WHERE plan_id = $1 AND tenant_id = $2`,
        [plan_id, tenant_id]
      );

      if (planCheck.rows.length === 0) {
        await query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Plan not found',
          message: 'シフト計画が見つかりません'
        });
      }

      const plan = planCheck.rows[0];

      // 過去月チェック：過去月のシフトは削除不可
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const isPastMonth = (plan.plan_year < currentYear) ||
                          (plan.plan_year === currentYear && plan.plan_month < currentMonth);

      if (isPastMonth) {
        await query('ROLLBACK');
        return res.status(403).json({
          success: false,
          error: 'Cannot delete past month plan',
          message: `${plan.plan_year}年${plan.plan_month}月は過去月のため削除できません`
        });
      }

      // 関連するシフトデータを削除
      const deleteShiftsResult = await query(
        `DELETE FROM ops.shifts WHERE plan_id = $1 AND tenant_id = $2 RETURNING shift_id`,
        [plan_id, tenant_id]
      );

      // プランを削除
      await query(
        `DELETE FROM ops.shift_plans WHERE plan_id = $1 AND tenant_id = $2`,
        [plan_id, tenant_id]
      );

      // コミット
      await query('COMMIT');

      res.json({
        success: true,
        message: `${plan.plan_year}年${plan.plan_month}月のシフト計画を削除しました`,
        data: {
          deleted_plan_id: parseInt(plan_id),
          deleted_shifts_count: deleteShiftsResult.rows.length,
          plan_year: plan.plan_year,
          plan_month: plan.plan_month,
          store_id: plan.store_id
        }
      });

    } catch (dbError) {
      await query('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    console.error('Error deleting shift plan:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフト計画のステータス更新
 * PUT /api/shifts/plans/:plan_id/status
 *
 * Request Body:
 * - status: 新しいステータス (required)
 */
router.put('/plans/:plan_id/status', async (req, res) => {
  try {
    const { plan_id } = req.params;
    const { status } = req.body;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: plan_id'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: status'
      });
    }

    // 有効なステータスかチェック
    const validStatuses = ['DRAFT', 'APPROVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // プランの存在確認
    const planCheck = await query(
      `SELECT plan_id, status FROM ops.shift_plans WHERE plan_id = $1`,
      [plan_id]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found',
        message: 'シフト計画が見つかりません'
      });
    }

    console.log('📝 Updating plan status:', {
      plan_id,
      new_status: status,
      old_status: planCheck.rows[0].status
    });

    // ステータスを更新
    const updateResult = await query(
      `UPDATE ops.shift_plans
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE plan_id = $2
       RETURNING plan_id, store_id, plan_year, plan_month, plan_type, status`,
      [status, plan_id]
    );

    console.log('✅ Plan status updated:', updateResult.rows[0]);

    res.json({
      success: true,
      message: `ステータスを${status}に更新しました`,
      data: {
        plan_id: parseInt(plan_id),
        old_status: planCheck.rows[0].status,
        new_status: status
      }
    });
  } catch (error) {
    console.error('Error updating plan status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 先月のシフトをコピーして新規プラン作成
 * POST /api/shifts/plans/copy-from-previous
 *
 * Body Parameters:
 * - tenant_id: テナントID (required)
 * - store_id: 店舗ID (required)
 * - target_year: コピー先の年 (required)
 * - target_month: コピー先の月 (required)
 * - created_by: 作成者ID (optional)
 *
 * ロジック:
 * - 先月（target_month - 1）のシフトを取得
 * - 曜日ベース + 第N週でマッピング
 *   例: 先月の「第1月曜日」→ 今月の「第1月曜日」
 */
router.post('/plans/copy-from-previous', async (req, res) => {
  try {
    const { tenant_id = 1, store_id, target_year, target_month, created_by } = req.body;

    // バリデーション
    if (!store_id || !target_year || !target_month) {
      return res.status(400).json({
        success: false,
        error: 'store_id, target_year, target_month は必須です'
      });
    }

    // 先月を計算
    let source_year = target_year;
    let source_month = target_month - 1;
    if (source_month === 0) {
      source_month = 12;
      source_year = target_year - 1;
    }

    console.log(`[CopyFromPrevious] ${source_year}年${source_month}月 → ${target_year}年${target_month}月へコピー`);

    // トランザクション開始
    await query('BEGIN');

    try {
      // 先月のシフトプランを検索（第2案＝確定版を取得）
      const sourcePlanResult = await query(`
        SELECT plan_id
        FROM ops.shift_plans
        WHERE tenant_id = $1 AND store_id = $2
          AND plan_year = $3 AND plan_month = $4
          AND plan_type = 'SECOND'
        ORDER BY created_at DESC
        LIMIT 1
      `, [tenant_id, store_id, source_year, source_month]);

      if (sourcePlanResult.rows.length === 0) {
        await query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: `${source_year}年${source_month}月の第2案（確定版）が見つかりません`
        });
      }

      const source_plan_id = sourcePlanResult.rows[0].plan_id;

      // 先月のシフトを取得
      const sourceShiftsResult = await query(`
        SELECT *
        FROM ops.shifts
        WHERE plan_id = $1
        ORDER BY shift_date, start_time
      `, [source_plan_id]);

      if (sourceShiftsResult.rows.length === 0) {
        await query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: `${source_year}年${source_month}月のシフトデータが空です`
        });
      }

      console.log(`[CopyFromPrevious] コピー元シフト件数: ${sourceShiftsResult.rows.length}件`);

      // 新規プラン作成
      const periodStart = new Date(target_year, target_month - 1, 1);
      const periodEnd = new Date(target_year, target_month, 0);
      const planCode = `PLAN-${target_year}${String(target_month).padStart(2, '0')}-COPY`;
      const planName = `${target_year}年${target_month}月シフト（前月コピー）`;

      const newPlanResult = await query(`
        INSERT INTO ops.shift_plans (
          tenant_id, store_id, plan_year, plan_month,
          plan_code, plan_name, period_start, period_end,
          status, generation_type, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT', 'COPIED_FROM_PREVIOUS', $9)
        RETURNING plan_id
      `, [
        tenant_id, store_id, target_year, target_month,
        planCode, planName, periodStart, periodEnd,
        created_by || null
      ]);

      const new_plan_id = newPlanResult.rows[0].plan_id;
      console.log(`[CopyFromPrevious] 新規プランID: ${new_plan_id}`);

      // 曜日ベースマッピングを構築
      // 先月の各日について「第N週の○曜日」を計算
      const sourceMapping = {}; // { "第1月曜日": [日付1, 日付2, ...], "第2月曜日": [...], ... }

      sourceShiftsResult.rows.forEach(shift => {
        const shiftDate = new Date(shift.shift_date);
        const dayOfWeek = shiftDate.getDay(); // 0=日, 1=月, ..., 6=土
        const dayOfMonth = shiftDate.getDate();

        // その月の1日から数えて、その曜日が何回目に現れるか
        const firstDayOfMonth = new Date(source_year, source_month - 1, 1);
        let weekCount = 0;
        for (let d = 1; d <= dayOfMonth; d++) {
          const checkDate = new Date(source_year, source_month - 1, d);
          if (checkDate.getDay() === dayOfWeek) {
            weekCount++;
          }
        }

        const key = `week${weekCount}_dow${dayOfWeek}`; // 例: "week1_dow1" (第1月曜日)

        if (!sourceMapping[key]) {
          sourceMapping[key] = [];
        }
        sourceMapping[key].push(shift);
      });

      // 今月の「第N週の○曜日」の日付を計算
      const targetMapping = {}; // { "week1_dow1": 日付, ... }
      const daysInTargetMonth = new Date(target_year, target_month, 0).getDate();

      for (let day = 1; day <= daysInTargetMonth; day++) {
        const date = new Date(target_year, target_month - 1, day);
        const dayOfWeek = date.getDay();

        // その曜日が何回目か計算
        let weekCount = 0;
        for (let d = 1; d <= day; d++) {
          const checkDate = new Date(target_year, target_month - 1, d);
          if (checkDate.getDay() === dayOfWeek) {
            weekCount++;
          }
        }

        const key = `week${weekCount}_dow${dayOfWeek}`;
        targetMapping[key] = day;
      }

      // シフトをコピー挿入
      let insertedCount = 0;
      let skippedCount = 0;
      let fallbackCount = 0;

      for (const [key, sourceShifts] of Object.entries(sourceMapping)) {
        let targetDay = targetMapping[key];
        let usedFallback = false;

        if (!targetDay) {
          // 今月にその「第N週の○曜日」が存在しない場合（例: 第5月曜日）
          // 第1週の同じ曜日にフォールバックする
          const match = key.match(/week(\d+)_dow(\d+)/);
          if (match) {
            const weekNumber = match[1];
            const dayOfWeek = match[2];
            const fallbackKey = `week1_dow${dayOfWeek}`;
            targetDay = targetMapping[fallbackKey];

            if (targetDay) {
              console.log(`[CopyFromPrevious] ${key}が存在しないため、${fallbackKey}にフォールバック`);
              usedFallback = true;
              fallbackCount += sourceShifts.length;
            }
          }

          if (!targetDay) {
            console.log(`[CopyFromPrevious] スキップ: ${key} (フォールバック先も存在しない)`);
            skippedCount += sourceShifts.length;
            continue;
          }
        }

        const targetDate = `${target_year}-${String(target_month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

        // その日のシフトをコピー
        for (const sourceShift of sourceShifts) {
          await query(`
            INSERT INTO ops.shifts (
              tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
              start_time, end_time, break_minutes, total_hours, labor_cost,
              assigned_skills, is_preferred, is_modified, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, $14)
          `, [
            tenant_id,
            store_id,
            new_plan_id,
            sourceShift.staff_id,
            targetDate,
            sourceShift.pattern_id,
            sourceShift.start_time,
            sourceShift.end_time,
            sourceShift.break_minutes,
            sourceShift.total_hours,
            sourceShift.labor_cost,
            sourceShift.assigned_skills,
            sourceShift.is_preferred,
            usedFallback ? '前月からコピー（第1週にフォールバック）' : '前月からコピー'
          ]);

          insertedCount++;
        }
      }

      console.log(`[CopyFromPrevious] コピー完了: ${insertedCount}件挿入, ${skippedCount}件スキップ, ${fallbackCount}件フォールバック`);

      // コミット
      await query('COMMIT');

      // === 労働基準法チェック ===
      console.log('[CopyFromPrevious] 労働基準法チェック開始');

      // コピーしたシフトデータを取得
      const copiedShiftsResult = await query(`
        SELECT
          s.*,
          staff.name as staff_name,
          staff.employment_type,
          staff.hourly_rate
        FROM ops.shifts s
        LEFT JOIN hr.staff staff ON s.staff_id = staff.staff_id
        WHERE s.plan_id = $1
        ORDER BY s.shift_date, s.staff_id
      `, [new_plan_id]);

      // スタッフ情報を取得
      const staffResult = await query(`
        SELECT
          staff.staff_id,
          staff.name,
          staff.employment_type,
          staff.hourly_rate,
          r.role_name
        FROM hr.staff staff
        LEFT JOIN core.roles r ON staff.role_id = r.role_id
        WHERE staff.tenant_id = $1 AND staff.store_id = $2 AND staff.is_active = true
      `, [tenant_id, store_id]);

      // 店舗情報を取得
      const storeResult = await query(`
        SELECT * FROM core.stores WHERE store_id = $1 AND tenant_id = $2
      `, [store_id, tenant_id]);

      // マスターデータを準備
      const masterData = {
        staff: staffResult.rows,
        storeInfo: storeResult.rows[0] || {}
      };

      // シフトデータを整形（JSTでフォーマット）
      const shiftsForValidation = copiedShiftsResult.rows.map(shift => ({
        shift_id: shift.shift_id,
        staff_id: shift.staff_id,
        shift_date: formatDateToYYYYMMDD(shift.shift_date),
        start_time: shift.start_time,
        end_time: shift.end_time,
        break_minutes: shift.break_minutes || 0,
        staff_name: shift.staff_name,
        employment_type: shift.employment_type
      }));

      // バリデーション実行
      const validationService = new ConstraintValidationService();
      const validationResult = await validationService.validateShifts(
        shiftsForValidation,
        masterData
      );

      console.log('[CopyFromPrevious] バリデーション完了:', validationResult.summary);

      // レスポンスにバリデーション結果を含める
      res.status(201).json({
        success: true,
        message: `${source_year}年${source_month}月のシフトを${target_year}年${target_month}月にコピーしました`,
        data: {
          plan_id: new_plan_id,
          source_year,
          source_month,
          target_year,
          target_month,
          inserted_count: insertedCount,
          skipped_count: skippedCount,
          fallback_count: fallbackCount,
          total_source_count: sourceShiftsResult.rows.length,
          validation: validationResult
        }
      });

    } catch (dbError) {
      await query('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    console.error('Error copying shifts from previous month:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 全店舗一括で最新プランからシフトをコピーして新規プラン作成
 * POST /api/shifts/plans/copy-from-previous-all-stores
 *
 * Body Parameters:
 * - tenant_id: テナントID (required)
 * - target_year: コピー先の年 (required)
 * - target_month: コピー先の月 (required)
 * - created_by: 作成者ID (optional)
 *
 * ロジック:
 * - テナントの全店舗を取得
 * - 各店舗ごとに最新のプランを検索（前月、前々月...と遡る）
 * - 最新プランが見つかればコピー、なければ空プラン作成
 */
router.post('/plans/copy-from-previous-all-stores', async (req, res) => {
  try {
    const { tenant_id = 1, target_year, target_month, created_by } = req.body;

    // バリデーション
    if (!target_year || !target_month) {
      return res.status(400).json({
        success: false,
        error: 'target_year, target_month は必須です'
      });
    }

    console.log(`[CopyFromPreviousAllStores] ${target_year}年${target_month}月を全店舗で作成`);

    // テナントの全店舗を取得
    const storesResult = await query(`
      SELECT store_id, store_name
      FROM core.stores
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY store_id
    `, [tenant_id]);

    if (storesResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'アクティブな店舗が見つかりません'
      });
    }

    const createdPlans = [];
    const errors = [];

    // 各店舗ごとにプラン作成
    for (const store of storesResult.rows) {
      try {
        console.log(`  店舗 ${store.store_name} (ID: ${store.store_id}) の処理開始`);

        // この店舗の最新プランを検索（最大12ヶ月遡る）
        let sourceYear = target_year;
        let sourceMonth = target_month - 1;
        let sourcePlan = null;

        for (let i = 0; i < 12; i++) {
          if (sourceMonth === 0) {
            sourceMonth = 12;
            sourceYear--;
          }

          const planCheck = await query(`
            SELECT plan_id, plan_year, plan_month
            FROM ops.shift_plans
            WHERE tenant_id = $1 AND store_id = $2
              AND plan_year = $3 AND plan_month = $4
            ORDER BY plan_id DESC
            LIMIT 1
          `, [tenant_id, store.store_id, sourceYear, sourceMonth]);

          if (planCheck.rows.length > 0) {
            sourcePlan = planCheck.rows[0];
            console.log(`    最新プラン発見: ${sourcePlan.plan_year}年${sourcePlan.plan_month}月 (plan_id: ${sourcePlan.plan_id})`);
            break;
          }

          sourceMonth--;
        }

        // トランザクション開始
        await query('BEGIN');

        try {
          // 新規プラン作成
          const periodStart = new Date(target_year, target_month - 1, 1);
          const periodEnd = new Date(target_year, target_month, 0);
          const planCode = `PLAN-${target_year}${String(target_month).padStart(2, '0')}-${String(store.store_id).padStart(3, '0')}`;
          const planName = `${target_year}年${target_month}月シフト（第1案）`;

          const planResult = await query(`
            INSERT INTO ops.shift_plans (
              tenant_id, store_id, plan_year, plan_month,
              plan_code, plan_name, period_start, period_end,
              plan_type, status, generation_type, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'FIRST', 'DRAFT', 'COPY_ALL_STORES', $9)
            RETURNING plan_id, store_id, plan_year, plan_month, plan_type, status
          `, [
            tenant_id, store.store_id, target_year, target_month,
            planCode, planName, periodStart, periodEnd,
            created_by || null
          ]);

          const newPlanId = planResult.rows[0].plan_id;
          console.log(`    新規プラン作成: plan_id=${newPlanId}`);

          let copiedShiftsCount = 0;
          const shiftsToInsert = []; // バルクINSERT用の配列

          // 最新プランが見つかった場合はシフトをコピー
          if (sourcePlan) {
            const sourceShifts = await query(`
              SELECT *
              FROM ops.shifts
              WHERE plan_id = $1
              ORDER BY shift_date, staff_id
            `, [sourcePlan.plan_id]);

            console.log(`    コピー元シフト数: ${sourceShifts.rows.length}`);

            // 曜日ベースでコピー（既存ロジックと同じ）
            const getWeekInfo = (date) => {
              const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
              const dayOfWeek = date.getDay();
              const dayOfMonth = date.getDate();
              const weekNumber = Math.ceil((dayOfMonth + firstDay.getDay()) / 7);
              return { weekNumber, dayOfWeek };
            };

            const shiftsByWeekAndDay = {};
            for (const shift of sourceShifts.rows) {
              const shiftDate = new Date(shift.shift_date);
              const { weekNumber, dayOfWeek } = getWeekInfo(shiftDate);
              const key = `w${weekNumber}_d${dayOfWeek}`;
              if (!shiftsByWeekAndDay[key]) {
                shiftsByWeekAndDay[key] = [];
              }
              shiftsByWeekAndDay[key].push(shift);
            }

            const daysInTargetMonth = new Date(target_year, target_month, 0).getDate();
            for (let day = 1; day <= daysInTargetMonth; day++) {
              const newShiftDate = new Date(target_year, target_month - 1, day);
              const { weekNumber, dayOfWeek } = getWeekInfo(newShiftDate);

              let key = `w${weekNumber}_d${dayOfWeek}`;
              let shiftsForDay = shiftsByWeekAndDay[key];

              if (!shiftsForDay || shiftsForDay.length === 0) {
                key = `w1_d${dayOfWeek}`;
                shiftsForDay = shiftsByWeekAndDay[key];
              }

              if (!shiftsForDay || shiftsForDay.length === 0) {
                continue;
              }

              for (const sourceShift of shiftsForDay) {
                shiftsToInsert.push({
                  tenant_id,
                  store_id: store.store_id,
                  plan_id: newPlanId,
                  staff_id: sourceShift.staff_id,
                  shift_date: formatDateToYYYYMMDD(newShiftDate),
                  pattern_id: sourceShift.pattern_id,
                  start_time: sourceShift.start_time,
                  end_time: sourceShift.end_time,
                  break_minutes: sourceShift.break_minutes
                });
              }
            }

            // バルクINSERT: 全シフトを一度に挿入
            if (shiftsToInsert.length > 0) {
              const values = shiftsToInsert.map((s, idx) => {
                const base = idx * 9;
                return `($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5}, $${base+6}, $${base+7}, $${base+8}, $${base+9})`;
              }).join(',');

              const params = shiftsToInsert.flatMap(s => [
                s.tenant_id, s.store_id, s.plan_id, s.staff_id, s.shift_date,
                s.pattern_id, s.start_time, s.end_time, s.break_minutes
              ]);

              await query(`
                INSERT INTO ops.shifts (
                  tenant_id, store_id, plan_id, staff_id, shift_date,
                  pattern_id, start_time, end_time, break_minutes
                ) VALUES ${values}
              `, params);

              copiedShiftsCount = shiftsToInsert.length;
            }
          }

          await query('COMMIT');

          createdPlans.push({
            plan_id: newPlanId,
            store_id: store.store_id,
            store_name: store.store_name,
            year: target_year,
            month: target_month,
            source_plan: sourcePlan ? `${sourcePlan.plan_year}年${sourcePlan.plan_month}月` : 'なし',
            copied_shifts_count: copiedShiftsCount
          });

          console.log(`    完了: ${copiedShiftsCount}件のシフトをコピー`);

        } catch (error) {
          await query('ROLLBACK');
          throw error;
        }

      } catch (storeError) {
        console.error(`  店舗 ${store.store_name} でエラー:`, storeError);
        errors.push({
          store_id: store.store_id,
          store_name: store.store_name,
          error: storeError.message
        });
      }
    }

    // 結果を返す
    res.json({
      success: true,
      message: `${createdPlans.length}店舗のプランを作成しました`,
      data: {
        created_plans: createdPlans,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Error copying shifts for all stores:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 全店舗の前月データを取得（DB書き込みなし）
 * POST /api/shifts/plans/fetch-previous-data-all-stores
 *
 * Body Parameters:
 * - tenant_id: テナントID (required)
 * - target_year: 対象年 (required)
 * - target_month: 対象月 (required)
 *
 * Returns:
 * - stores: 各店舗のシフトデータ配列
 */
router.post('/plans/fetch-previous-data-all-stores', async (req, res) => {
  try {
    const { tenant_id = 1, target_year, target_month } = req.body;

    // バリデーション
    if (!target_year || !target_month) {
      return res.status(400).json({
        success: false,
        error: 'target_year, target_month は必須です'
      });
    }

    console.log(`[FetchPreviousDataAllStores] ${target_year}年${target_month}月の前月データを全店舗で取得`);

    // テナントの全店舗を取得
    const storesResult = await query(`
      SELECT store_id, store_name
      FROM core.stores
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY store_id
    `, [tenant_id]);

    if (storesResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'アクティブな店舗が見つかりません'
      });
    }

    const storesData = [];

    // 各店舗ごとにデータ取得
    for (const store of storesResult.rows) {
      try {
        console.log(`  店舗 ${store.store_name} (ID: ${store.store_id}) の処理開始`);

        // この店舗の最新プランを検索（最大12ヶ月遡る）
        let sourceYear = target_year;
        let sourceMonth = target_month - 1;
        let sourcePlan = null;

        for (let i = 0; i < 12; i++) {
          if (sourceMonth === 0) {
            sourceMonth = 12;
            sourceYear--;
          }

          const planCheck = await query(`
            SELECT plan_id, plan_year, plan_month
            FROM ops.shift_plans
            WHERE tenant_id = $1 AND store_id = $2
              AND plan_year = $3 AND plan_month = $4
            ORDER BY plan_id DESC
            LIMIT 1
          `, [tenant_id, store.store_id, sourceYear, sourceMonth]);

          if (planCheck.rows.length > 0) {
            sourcePlan = planCheck.rows[0];
            console.log(`    最新プラン発見: ${sourcePlan.plan_year}年${sourcePlan.plan_month}月 (plan_id: ${sourcePlan.plan_id})`);
            break;
          }

          sourceMonth--;
        }

        const shifts = [];

        // 最新プランが見つかった場合はシフトデータを取得して変換
        if (sourcePlan) {
          const sourceShifts = await query(`
            SELECT *
            FROM ops.shifts
            WHERE plan_id = $1
            ORDER BY shift_date, staff_id
          `, [sourcePlan.plan_id]);

          console.log(`    取得元シフト数: ${sourceShifts.rows.length}`);

          // 曜日ベースで対象月に変換（特定の曜日が何回目に出現するかをカウント）
          const getWeekInfo = (date) => {
            const year = date.getFullYear();
            const month = date.getMonth();
            const dayOfWeek = date.getDay();
            const dayOfMonth = date.getDate();

            // この曜日が月内で何回目の出現かをカウント
            let weekCount = 0;
            for (let d = 1; d <= dayOfMonth; d++) {
              const checkDate = new Date(year, month, d);
              if (checkDate.getDay() === dayOfWeek) {
                weekCount++;
              }
            }

            return { weekNumber: weekCount, dayOfWeek };
          };

          const shiftsByWeekAndDay = {};
          for (const shift of sourceShifts.rows) {
            const shiftDate = new Date(shift.shift_date);
            const { weekNumber, dayOfWeek } = getWeekInfo(shiftDate);
            const key = `w${weekNumber}_d${dayOfWeek}`;
            if (!shiftsByWeekAndDay[key]) {
              shiftsByWeekAndDay[key] = [];
            }
            shiftsByWeekAndDay[key].push(shift);
          }

          const daysInTargetMonth = new Date(target_year, target_month, 0).getDate();
          for (let day = 1; day <= daysInTargetMonth; day++) {
            const newShiftDate = new Date(target_year, target_month - 1, day);
            const { weekNumber, dayOfWeek } = getWeekInfo(newShiftDate);

            let key = `w${weekNumber}_d${dayOfWeek}`;
            let shiftsForDay = shiftsByWeekAndDay[key];

            if (!shiftsForDay || shiftsForDay.length === 0) {
              key = `w1_d${dayOfWeek}`;
              shiftsForDay = shiftsByWeekAndDay[key];
            }

            if (!shiftsForDay || shiftsForDay.length === 0) {
              continue;
            }

            for (const sourceShift of shiftsForDay) {
              shifts.push({
                store_id: store.store_id,
                staff_id: sourceShift.staff_id,
                shift_date: formatDateToYYYYMMDD(newShiftDate),
                pattern_id: sourceShift.pattern_id,
                start_time: sourceShift.start_time,
                end_time: sourceShift.end_time,
                break_minutes: sourceShift.break_minutes
              });
            }
          }
        }

        storesData.push({
          store_id: store.store_id,
          store_name: store.store_name,
          source_plan: sourcePlan ? `${sourcePlan.plan_year}年${sourcePlan.plan_month}月` : null,
          shifts: shifts
        });

        console.log(`    完了: ${shifts.length}件のシフトデータを生成`);

      } catch (storeError) {
        console.error(`  店舗 ${store.store_name} でエラー:`, storeError);
        storesData.push({
          store_id: store.store_id,
          store_name: store.store_name,
          error: storeError.message,
          shifts: []
        });
      }
    }

    // データを返す（DB書き込みなし）
    res.json({
      success: true,
      message: `${storesData.length}店舗のデータを取得しました`,
      data: {
        target_year,
        target_month,
        stores: storesData
      }
    });

  } catch (error) {
    console.error('Error fetching previous data for all stores:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * プランとシフトを一括作成（メモリ上のデータをDBに保存）
 * POST /api/shifts/plans/create-with-shifts
 *
 * Body Parameters:
 * - tenant_id: テナントID (required)
 * - target_year: 対象年 (required)
 * - target_month: 対象月 (required)
 * - created_by: 作成者ID (required)
 * - stores: 各店舗のシフトデータ配列 (required)
 *   - store_id: 店舗ID
 *   - shifts: シフトデータ配列
 */
router.post('/plans/create-with-shifts', async (req, res) => {
  try {
    const { tenant_id = 1, target_year, target_month, created_by, stores } = req.body;

    // バリデーション
    if (!target_year || !target_month || !stores || !Array.isArray(stores)) {
      return res.status(400).json({
        success: false,
        error: 'target_year, target_month, stores は必須です'
      });
    }

    console.log(`[CreateWithShifts] ${target_year}年${target_month}月のプランとシフトを一括作成`);

    const createdPlans = [];
    const errors = [];

    // 各店舗ごとにプラン+シフト作成
    for (const storeData of stores) {
      try {
        const { store_id, shifts } = storeData;

        if (!store_id) {
          errors.push({ error: 'store_idが必要です', storeData });
          continue;
        }

        console.log(`  店舗ID ${store_id} の処理開始`);

        await query('BEGIN');

        try {
          // 新規プラン作成
          const periodStart = new Date(target_year, target_month - 1, 1);
          const periodEnd = new Date(target_year, target_month, 0);
          const planCode = `PLAN-${target_year}${String(target_month).padStart(2, '0')}-${String(store_id).padStart(3, '0')}`;
          const planName = `${target_year}年${target_month}月シフト（第1案）`;

          const planResult = await query(`
            INSERT INTO ops.shift_plans (
              tenant_id, store_id, plan_year, plan_month,
              plan_code, plan_name, period_start, period_end,
              plan_type, status, generation_type, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'FIRST', 'DRAFT', 'MANUAL', $9)
            RETURNING plan_id, store_id, plan_year, plan_month, plan_type, status
          `, [
            tenant_id, store_id, target_year, target_month,
            planCode, planName, periodStart, periodEnd,
            created_by || null
          ]);

          const newPlanId = planResult.rows[0].plan_id;
          console.log(`    新規プラン作成: plan_id=${newPlanId}`);

          // シフトデータを挿入
          if (shifts && shifts.length > 0) {
            const values = shifts.map((s, idx) => {
              const base = idx * 9;
              return `($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5}, $${base+6}, $${base+7}, $${base+8}, $${base+9})`;
            }).join(',');

            const params = shifts.flatMap(s => [
              tenant_id,
              store_id,
              newPlanId,
              s.staff_id,
              s.shift_date,
              s.pattern_id || null,
              s.start_time,
              s.end_time,
              s.break_minutes || 0
            ]);

            await query(`
              INSERT INTO ops.shifts (
                tenant_id, store_id, plan_id, staff_id, shift_date,
                pattern_id, start_time, end_time, break_minutes
              ) VALUES ${values}
            `, params);

            console.log(`    ${shifts.length}件のシフトを作成`);
          }

          await query('COMMIT');

          createdPlans.push({
            plan_id: newPlanId,
            store_id: store_id,
            shifts_count: shifts ? shifts.length : 0
          });

        } catch (error) {
          await query('ROLLBACK');
          throw error;
        }

      } catch (storeError) {
        console.error(`  店舗ID ${storeData.store_id} でエラー:`, storeError);
        errors.push({
          store_id: storeData.store_id,
          error: storeError.message
        });
      }
    }

    // 結果を返す
    res.json({
      success: true,
      message: `${createdPlans.length}店舗のプランとシフトを作成しました`,
      data: {
        created_plans: createdPlans,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Error creating plans with shifts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
