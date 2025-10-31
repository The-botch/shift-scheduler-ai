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

export default router;
