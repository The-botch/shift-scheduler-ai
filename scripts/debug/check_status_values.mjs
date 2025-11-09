import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM ops.shift_plans
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('## shift_plansの実際のstatus値:');
    result.rows.forEach(r => console.log(`  ${r.status}: ${r.count}件`));

    await pool.end();
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
})();
