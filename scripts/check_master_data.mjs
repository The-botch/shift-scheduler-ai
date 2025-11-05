import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const tables = [
      'core.tenants',
      'core.divisions',
      'core.stores',
      'core.roles',
      'core.skills',
      'core.employment_types',
      'core.shift_patterns'
    ];

    for (const table of tables) {
      const result = await pool.query(`SELECT * FROM ${table} ORDER BY 1 LIMIT 10`);
      console.log(`\n=== ${table} ===`);
      console.log(JSON.stringify(result.rows, null, 2));
    }

    await pool.end();
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
})();
