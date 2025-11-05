import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// export_transaction_data.mjsでエクスポートしているカラム
const exportedColumns = {
  'ops.shift_plans': ['tenant_id', 'store_id', 'plan_year', 'plan_month', 'plan_code', 'plan_name', 'period_start', 'period_end', 'status', 'generation_type', 'ai_model_version', 'total_labor_hours', 'total_labor_cost', 'coverage_score', 'constraint_violations', 'created_by', 'approved_by'],
  'ops.demand_forecasts': ['tenant_id', 'store_id', 'forecast_date', 'hour', 'predicted_customers', 'predicted_sales', 'required_staff', 'required_skills', 'confidence_score'],
  'ops.shift_preferences': ['tenant_id', 'store_id', 'staff_id', 'year', 'month', 'preferred_days', 'ng_days', 'status', 'submitted_at', 'staff_name', 'preferred_time_slots', 'max_hours_per_week', 'notes'],
  'ops.shifts': ['tenant_id', 'store_id', 'plan_id', 'staff_id', 'shift_date', 'pattern_id', 'start_time', 'end_time', 'break_minutes', 'total_hours', 'labor_cost', 'assigned_skills', 'is_preferred', 'is_modified', 'notes'],
  'ops.work_hours_actual': ['tenant_id', 'store_id', 'shift_id', 'year', 'month', 'work_date', 'staff_id', 'staff_name', 'scheduled_start', 'scheduled_end', 'actual_start', 'actual_end', 'scheduled_hours', 'actual_hours', 'break_minutes', 'overtime_minutes', 'is_late', 'is_early_leave', 'notes'],
  'hr.payroll': ['tenant_id', 'store_id', 'year', 'month', 'staff_id', 'staff_name', 'work_days', 'work_hours', 'base_salary', 'overtime_pay', 'commute_allowance', 'other_allowances', 'gross_salary', 'health_insurance', 'pension_insurance', 'employment_insurance', 'income_tax', 'resident_tax', 'total_deduction', 'net_salary', 'payment_date', 'payment_status'],
  'analytics.sales_actual': ['tenant_id', 'year', 'month', 'store_id', 'actual_sales', 'daily_average', 'notes'],
  'analytics.sales_forecast': ['tenant_id', 'year', 'month', 'store_id', 'forecasted_sales', 'required_labor_cost', 'required_hours', 'notes'],
  'analytics.dashboard_metrics': ['tenant_id', 'metric_name', 'predicted', 'actual', 'unit', 'status', 'calculated_at']
};

(async () => {
  try {
    console.log('## カラム構成検証\n');

    for (const [table, exportedCols] of Object.entries(exportedColumns)) {
      const [schema, tableName] = table.split('.');

      // 実際のテーブルカラムを取得
      const result = await pool.query(`
        SELECT column_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schema, tableName]);

      const actualCols = result.rows.map(r => r.column_name);

      // 自動生成カラム（created_at, updated_at, *_id）を除外
      const dataColumns = actualCols.filter(col =>
        !col.endsWith('_at') &&
        !col.endsWith('_id') ||
        exportedCols.includes(col)
      );

      // 欠けているカラム
      const missingCols = actualCols.filter(col =>
        !exportedCols.includes(col) &&
        !col.endsWith('_at') && // created_at, updated_at
        !(col.endsWith('_id') && result.rows.find(r => r.column_name === col)?.column_default?.includes('nextval')) // auto-increment ID
      );

      // 余分なカラム
      const extraCols = exportedCols.filter(col => !actualCols.includes(col));

      console.log(`### ${table}`);
      console.log(`実際のカラム数: ${actualCols.length}`);
      console.log(`エクスポート対象: ${exportedCols.length}`);

      if (missingCols.length > 0) {
        console.log(`⚠️  欠けているカラム: ${missingCols.join(', ')}`);
      }

      if (extraCols.length > 0) {
        console.log(`⚠️  存在しないカラム: ${extraCols.join(', ')}`);
      }

      if (missingCols.length === 0 && extraCols.length === 0) {
        console.log('✅ カラム構成一致');
      }

      console.log('');
    }

    await pool.end();
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
})();
