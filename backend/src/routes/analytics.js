import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * 給与計算データ取得
 * GET /api/analytics/payroll
 */
router.get('/payroll', async (req, res) => {
  try {
    const { tenant_id = 1, store_id, staff_id, year, month } = req.query;

    let queryText = `
      SELECT
        payroll_id,
        tenant_id,
        store_id,
        year,
        month,
        staff_id,
        staff_name,
        work_days,
        work_hours,
        base_salary,
        overtime_pay,
        commute_allowance,
        other_allowances,
        gross_salary,
        health_insurance,
        pension_insurance,
        employment_insurance,
        income_tax,
        resident_tax,
        total_deduction,
        net_salary,
        payment_date,
        payment_status,
        created_at,
        updated_at
      FROM hr.payroll
      WHERE tenant_id = $1
    `;

    const params = [tenant_id];
    let paramIndex = 2;

    if (store_id) {
      queryText += ` AND store_id = $${paramIndex}`;
      params.push(store_id);
      paramIndex++;
    }

    if (staff_id) {
      queryText += ` AND staff_id = $${paramIndex}`;
      params.push(staff_id);
      paramIndex++;
    }

    if (year) {
      queryText += ` AND year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    if (month) {
      queryText += ` AND month = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    queryText += ' ORDER BY year DESC, month DESC, staff_id';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 売上実績データ取得
 * GET /api/analytics/sales-actual
 */
router.get('/sales-actual', async (req, res) => {
  try {
    const { tenant_id = 1, store_id, year, month } = req.query;

    let queryText = `
      SELECT
        actual_id,
        tenant_id,
        year,
        month,
        store_id,
        actual_sales,
        daily_average,
        notes,
        created_at,
        updated_at
      FROM analytics.sales_actual
      WHERE tenant_id = $1
    `;

    const params = [tenant_id];
    let paramIndex = 2;

    if (store_id) {
      queryText += ` AND store_id = $${paramIndex}`;
      params.push(store_id);
      paramIndex++;
    }

    if (year) {
      queryText += ` AND year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    if (month) {
      queryText += ` AND month = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    queryText += ' ORDER BY year DESC, month DESC, store_id';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching sales actual:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 売上予測データ取得
 * GET /api/analytics/sales-forecast
 */
router.get('/sales-forecast', async (req, res) => {
  try {
    const { tenant_id = 1, store_id, year, month } = req.query;

    let queryText = `
      SELECT
        forecast_id,
        tenant_id,
        year,
        month,
        store_id,
        forecasted_sales,
        required_labor_cost,
        required_hours,
        notes,
        created_at,
        updated_at
      FROM analytics.sales_forecast
      WHERE tenant_id = $1
    `;

    const params = [tenant_id];
    let paramIndex = 2;

    if (store_id) {
      queryText += ` AND store_id = $${paramIndex}`;
      params.push(store_id);
      paramIndex++;
    }

    if (year) {
      queryText += ` AND year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    if (month) {
      queryText += ` AND month = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    queryText += ' ORDER BY year DESC, month DESC, store_id';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching sales forecast:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ダッシュボード指標データ取得
 * GET /api/analytics/dashboard-metrics
 */
router.get('/dashboard-metrics', async (req, res) => {
  try {
    const { tenant_id = 1, metric_name, status } = req.query;

    let queryText = `
      SELECT
        metric_id,
        tenant_id,
        metric_name,
        predicted,
        actual,
        unit,
        status,
        calculated_at,
        created_at,
        updated_at
      FROM analytics.dashboard_metrics
      WHERE tenant_id = $1
    `;

    const params = [tenant_id];
    let paramIndex = 2;

    if (metric_name) {
      queryText += ` AND metric_name = $${paramIndex}`;
      params.push(metric_name);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    queryText += ' ORDER BY calculated_at DESC, metric_name';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 労働時間実績データ一括登録
 * POST /api/analytics/work-hours
 */
router.post('/work-hours', async (req, res) => {
  try {
    const { tenant_id = 1, data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'データが指定されていません'
      });
    }

    // バッチINSERT用のクエリを構築
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (const row of data) {
      // work_dateから年月を抽出
      const workDate = new Date(row.shift_date);
      const year = workDate.getFullYear();
      const month = workDate.getMonth() + 1;

      values.push(
        tenant_id,
        row.store_id || 1,
        row.staff_id,
        row.shift_date,
        year,
        month,
        row.scheduled_start || null,
        row.scheduled_end || null,
        row.actual_start,
        row.actual_end,
        row.actual_hours,
        row.break_minutes || 0,
        row.is_overtime ? parseInt(row.overtime_minutes || 0) : 0,
        row.is_late || false,
        row.is_early_leave || false,
        row.notes || null
      );

      placeholders.push(
        `($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6}, $${paramIndex+7}, $${paramIndex+8}, $${paramIndex+9}, $${paramIndex+10}, $${paramIndex+11}, $${paramIndex+12}, $${paramIndex+13}, $${paramIndex+14}, $${paramIndex+15})`
      );
      paramIndex += 16;
    }

    // ON CONFLICT DO UPDATEで既存データは更新、新規データは挿入
    const insertQuery = `
      INSERT INTO ops.work_hours_actual (
        tenant_id, store_id, staff_id, work_date, year, month,
        scheduled_start, scheduled_end, actual_start, actual_end,
        actual_hours, break_minutes, overtime_minutes, is_late, is_early_leave, notes
      ) VALUES ${placeholders.join(', ')}
      ON CONFLICT (tenant_id, store_id, staff_id, work_date)
      DO UPDATE SET
        scheduled_start = EXCLUDED.scheduled_start,
        scheduled_end = EXCLUDED.scheduled_end,
        actual_start = EXCLUDED.actual_start,
        actual_end = EXCLUDED.actual_end,
        actual_hours = EXCLUDED.actual_hours,
        break_minutes = EXCLUDED.break_minutes,
        overtime_minutes = EXCLUDED.overtime_minutes,
        is_late = EXCLUDED.is_late,
        is_early_leave = EXCLUDED.is_early_leave,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
    `;

    await query(insertQuery, values);

    res.json({
      success: true,
      message: `労働時間実績データを登録しました（${data.length}件）`,
      total: data.length
    });
  } catch (error) {
    console.error('Error importing work hours:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 給与データ一括登録
 * POST /api/analytics/payroll
 */
router.post('/payroll', async (req, res) => {
  try {
    const { tenant_id = 1, data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'データが指定されていません'
      });
    }

    // バッチINSERT用のクエリを構築
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (const row of data) {
      values.push(
        tenant_id,
        row.store_id || 1,
        row.year,
        row.month,
        row.staff_id,
        row.staff_name,
        row.work_days,
        row.work_hours,
        row.base_salary,
        row.overtime_pay || 0,
        row.commute_allowance || 0,
        row.other_allowances || 0,
        row.gross_salary,
        row.health_insurance || 0,
        row.pension_insurance || 0,
        row.employment_insurance || 0,
        row.income_tax || 0,
        row.resident_tax || 0,
        row.total_deduction || 0,
        row.net_salary,
        row.payment_date || null,
        row.payment_status || 'PENDING'
      );

      placeholders.push(
        `($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6}, $${paramIndex+7}, $${paramIndex+8}, $${paramIndex+9}, $${paramIndex+10}, $${paramIndex+11}, $${paramIndex+12}, $${paramIndex+13}, $${paramIndex+14}, $${paramIndex+15}, $${paramIndex+16}, $${paramIndex+17}, $${paramIndex+18}, $${paramIndex+19}, $${paramIndex+20}, $${paramIndex+21})`
      );
      paramIndex += 22;
    }

    // ON CONFLICT DO UPDATEで既存データは更新、新規データは挿入
    const insertQuery = `
      INSERT INTO hr.payroll (
        tenant_id, store_id, year, month, staff_id, staff_name,
        work_days, work_hours, base_salary, overtime_pay,
        commute_allowance, other_allowances, gross_salary,
        health_insurance, pension_insurance, employment_insurance,
        income_tax, resident_tax, total_deduction, net_salary,
        payment_date, payment_status
      ) VALUES ${placeholders.join(', ')}
      ON CONFLICT (tenant_id, store_id, year, month, staff_id)
      DO UPDATE SET
        staff_name = EXCLUDED.staff_name,
        work_days = EXCLUDED.work_days,
        work_hours = EXCLUDED.work_hours,
        base_salary = EXCLUDED.base_salary,
        overtime_pay = EXCLUDED.overtime_pay,
        commute_allowance = EXCLUDED.commute_allowance,
        other_allowances = EXCLUDED.other_allowances,
        gross_salary = EXCLUDED.gross_salary,
        health_insurance = EXCLUDED.health_insurance,
        pension_insurance = EXCLUDED.pension_insurance,
        employment_insurance = EXCLUDED.employment_insurance,
        income_tax = EXCLUDED.income_tax,
        resident_tax = EXCLUDED.resident_tax,
        total_deduction = EXCLUDED.total_deduction,
        net_salary = EXCLUDED.net_salary,
        payment_date = EXCLUDED.payment_date,
        payment_status = EXCLUDED.payment_status,
        updated_at = CURRENT_TIMESTAMP
    `;

    await query(insertQuery, values);

    res.json({
      success: true,
      message: `給与データを登録しました（${data.length}件）`,
      total: data.length
    });
  } catch (error) {
    console.error('Error importing payroll:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 売上実績データ一括登録
 * POST /api/analytics/sales-actual
 */
router.post('/sales-actual', async (req, res) => {
  try {
    const { tenant_id = 1, data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'データが指定されていません'
      });
    }

    let insertCount = 0;
    let updateCount = 0;

    // 各行ごとに存在確認してINSERTまたはUPDATE
    for (const row of data) {
      // 既存データを確認
      const checkQuery = `
        SELECT actual_id FROM analytics.sales_actual
        WHERE tenant_id = $1 AND year = $2 AND month = $3 AND store_id = $4
      `;
      const checkResult = await query(checkQuery, [
        tenant_id,
        row.year,
        row.month,
        row.store_id || 1
      ]);

      if (checkResult.rows.length > 0) {
        // 既存データがある場合はUPDATE
        const updateQuery = `
          UPDATE analytics.sales_actual SET
            actual_sales = $1,
            daily_average = $2,
            notes = $3,
            updated_at = CURRENT_TIMESTAMP
          WHERE tenant_id = $4 AND year = $5 AND month = $6 AND store_id = $7
        `;
        await query(updateQuery, [
          row.actual_sales,
          row.daily_average || null,
          row.notes || null,
          tenant_id,
          row.year,
          row.month,
          row.store_id || 1
        ]);
        updateCount++;
      } else {
        // 既存データがない場合はINSERT
        const insertQuery = `
          INSERT INTO analytics.sales_actual (
            tenant_id, year, month, store_id, actual_sales, daily_average, notes
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
          )
        `;
        await query(insertQuery, [
          tenant_id,
          row.year,
          row.month,
          row.store_id || 1,
          row.actual_sales,
          row.daily_average || null,
          row.notes || null
        ]);
        insertCount++;
      }
    }

    res.json({
      success: true,
      message: `売上実績データを登録しました（新規: ${insertCount}件、更新: ${updateCount}件）`,
      insertCount,
      updateCount,
      total: data.length
    });
  } catch (error) {
    console.error('Error importing sales actual:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 売上予測データ一括登録
 * POST /api/analytics/sales-forecast
 */
router.post('/sales-forecast', async (req, res) => {
  try {
    const { tenant_id = 1, data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'データが指定されていません'
      });
    }

    let insertCount = 0;
    let updateCount = 0;

    // 各行ごとに存在確認してINSERTまたはUPDATE
    for (const row of data) {
      // 既存データを確認
      const checkQuery = `
        SELECT forecast_id FROM analytics.sales_forecast
        WHERE tenant_id = $1 AND year = $2 AND month = $3 AND store_id = $4
      `;
      const checkResult = await query(checkQuery, [
        tenant_id,
        row.year,
        row.month,
        row.store_id || 1
      ]);

      if (checkResult.rows.length > 0) {
        // 既存データがある場合はUPDATE
        const updateQuery = `
          UPDATE analytics.sales_forecast SET
            forecasted_sales = $1,
            required_labor_cost = $2,
            required_hours = $3,
            notes = $4,
            updated_at = CURRENT_TIMESTAMP
          WHERE tenant_id = $5 AND year = $6 AND month = $7 AND store_id = $8
        `;
        await query(updateQuery, [
          row.forecasted_sales,
          row.required_labor_cost || null,
          row.required_hours || null,
          row.notes || null,
          tenant_id,
          row.year,
          row.month,
          row.store_id || 1
        ]);
        updateCount++;
      } else {
        // 既存データがない場合はINSERT
        const insertQuery = `
          INSERT INTO analytics.sales_forecast (
            tenant_id, year, month, store_id, forecasted_sales, required_labor_cost, required_hours, notes
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          )
        `;
        await query(insertQuery, [
          tenant_id,
          row.year,
          row.month,
          row.store_id || 1,
          row.forecasted_sales,
          row.required_labor_cost || null,
          row.required_hours || null,
          row.notes || null
        ]);
        insertCount++;
      }
    }

    res.json({
      success: true,
      message: `売上予測データを登録しました（新規: ${insertCount}件、更新: ${updateCount}件）`,
      insertCount,
      updateCount,
      total: data.length
    });
  } catch (error) {
    console.error('Error importing sales forecast:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
