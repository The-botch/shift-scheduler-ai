import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const result = await pool.query(`
      SELECT tenant_id, tenant_code, tenant_name
      FROM core.tenants
      ORDER BY tenant_id
    `);

    console.log('## 実際のtenant_id:');
    result.rows.forEach(r => console.log(`  ID=${r.tenant_id}, code=${r.tenant_code}, name=${r.tenant_name}`));

    await pool.end();
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
})();
