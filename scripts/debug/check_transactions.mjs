import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const tables = [
      'ops.shift_plans',
      'ops.shifts', 
      'ops.shift_preferences',
      'ops.availability_requests',
      'ops.work_hours_actual',
      'hr.payroll',
      'analytics.sales_actual',
      'analytics.sales_forecast',
      'analytics.dashboard_metrics',
      'ops.demand_forecasts'
    ];

    console.log('## 現在のトランザクションデータ\n');
    
    for (const table of tables) {
      const result = await pool.query('SELECT COUNT(*) FROM ' + table);
      const count = result.rows[0].count;
      const padding = ' '.repeat(35 - table.length);
      console.log(table + padding + ' - ' + count + '件');
    }
    
    await pool.end();
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
})();
