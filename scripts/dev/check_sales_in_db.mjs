#!/usr/bin/env node
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});

async function main() {
  console.log('\n売上実績:');
  const actual = await pool.query(`
    SELECT sa.actual_id, sa.year, sa.month, sa.store_id, s.store_name, sa.actual_sales
    FROM analytics.sales_actual sa
    LEFT JOIN core.stores s ON sa.store_id = s.store_id
    WHERE sa.tenant_id = 3
    ORDER BY sa.year, sa.month
  `);
  console.log(`件数: ${actual.rows.length}`);
  if (actual.rows.length > 0) console.table(actual.rows);

  console.log('\n売上予測:');
  const forecast = await pool.query(`
    SELECT sf.forecast_id, sf.year, sf.month, sf.store_id, s.store_name, sf.forecasted_sales
    FROM analytics.sales_forecast sf
    LEFT JOIN core.stores s ON sf.store_id = s.store_id
    WHERE sf.tenant_id = 3
    ORDER BY sf.year, sf.month
  `);
  console.log(`件数: ${forecast.rows.length}`);
  if (forecast.rows.length > 0) console.table(forecast.rows);

  await pool.end();
}

main();
