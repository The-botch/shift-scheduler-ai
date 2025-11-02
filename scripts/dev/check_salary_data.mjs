#!/usr/bin/env node
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || process.env.PGHOST,
  port: process.env.DB_PORT || process.env.PGPORT || 5432,
  database: process.env.DB_NAME || process.env.PGDATABASE,
  user: process.env.DB_USER || process.env.PGUSER,
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
  connectionTimeoutMillis: 5000
});

async function main() {
  try {
    const result = await pool.query(`
      SELECT
        staff_id,
        name,
        employment_type,
        monthly_salary,
        hourly_rate,
        email,
        phone_number,
        commute_distance_km
      FROM hr.staff
      WHERE tenant_id = 3
      ORDER BY staff_id
      LIMIT 15
    `);

    console.log('\n' + '='.repeat(80));
    console.log('📊 給与データ確認（最初の15名）');
    console.log('='.repeat(80) + '\n');

    console.log('ID | 名前           | 雇用形態  | 月給      | 時給   | Email有無 | 電話有無 | 通勤距離');
    console.log('-'.repeat(80));

    result.rows.forEach(row => {
      const salary = row.monthly_salary ? `¥${row.monthly_salary.toLocaleString().padStart(7)}` : '       -';
      const hourly = row.hourly_rate ? `¥${row.hourly_rate.toLocaleString().padStart(4)}` : '     -';
      const email = row.email ? '✓' : '✗';
      const phone = row.phone_number ? '✓' : '✗';
      const distance = row.commute_distance_km ? `${row.commute_distance_km}km` : '-';

      console.log(
        `${String(row.staff_id).padStart(2)} | ${row.name.padEnd(14)} | ${row.employment_type.padEnd(9)} | ${salary} | ${hourly} | ${email.padEnd(9)} | ${phone.padEnd(8)} | ${distance}`
      );
    });

    console.log('\n' + '='.repeat(80));

    // 統計情報
    const stats = await pool.query(`
      SELECT
        employment_type,
        COUNT(*) as count,
        COUNT(monthly_salary) as with_monthly_salary,
        COUNT(hourly_rate) as with_hourly_rate,
        COUNT(email) as with_email,
        COUNT(phone_number) as with_phone,
        COUNT(commute_distance_km) as with_commute_distance
      FROM hr.staff
      WHERE tenant_id = 3
      GROUP BY employment_type
      ORDER BY employment_type
    `);

    console.log('📈 統計情報:\n');
    stats.rows.forEach(row => {
      console.log(`${row.employment_type}:`);
      console.log(`  総数: ${row.count}名`);
      console.log(`  月給設定: ${row.with_monthly_salary}名`);
      console.log(`  時給設定: ${row.with_hourly_rate}名`);
      console.log(`  Email設定: ${row.with_email}名`);
      console.log(`  電話設定: ${row.with_phone}名`);
      console.log(`  通勤距離設定: ${row.with_commute_distance}名\n`);
    });

    console.log('='.repeat(80) + '\n');

    await pool.end();
  } catch (err) {
    console.error('❌ エラー:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
