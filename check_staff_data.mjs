#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'backend', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FGJbfPvwLFlYWCyVgJRzCfWGczpmOzvP@autorack.proxy.rlwy.net:11738/railway',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
});

(async () => {
  try {
    console.log('\n✅ スタッフデータ確認\n');

    // FULL_TIME従業員の社会保険加入状況を確認
    const result = await pool.query(`
      SELECT
        name,
        employment_type,
        monthly_salary,
        hourly_rate,
        has_social_insurance,
        commute_distance_km,
        email
      FROM hr.staff
      WHERE tenant_id = 3
      ORDER BY employment_type, staff_id
      LIMIT 10
    `);

    console.log(`📋 スタッフデータサンプル（${result.rows.length}名）:\n`);

    result.rows.forEach(row => {
      console.log(`👤 ${row.name}`);
      console.log(`   雇用形態: ${row.employment_type}`);
      console.log(`   Email: ${row.email || 'なし'}`);
      console.log(`   月給: ${row.monthly_salary ? '¥' + row.monthly_salary.toLocaleString() : 'なし'}`);
      console.log(`   時給: ${row.hourly_rate ? '¥' + row.hourly_rate.toLocaleString() : 'なし'}`);
      console.log(`   社会保険: ${row.has_social_insurance ? '✓ 加入' : '✗ 未加入'}`);
      console.log(`   通勤距離: ${row.commute_distance_km ? row.commute_distance_km + 'km' : 'なし'}`);
      console.log('');
    });

    // 統計情報
    const stats = await pool.query(`
      SELECT
        employment_type,
        COUNT(*) as count,
        SUM(CASE WHEN has_social_insurance THEN 1 ELSE 0 END) as with_insurance,
        SUM(CASE WHEN monthly_salary IS NOT NULL THEN 1 ELSE 0 END) as with_monthly,
        SUM(CASE WHEN hourly_rate IS NOT NULL THEN 1 ELSE 0 END) as with_hourly
      FROM hr.staff
      WHERE tenant_id = 3
      GROUP BY employment_type
    `);

    console.log('\n📊 統計情報:\n');
    stats.rows.forEach(row => {
      console.log(`${row.employment_type}:`);
      console.log(`  - 総数: ${row.count}名`);
      console.log(`  - 社会保険加入: ${row.with_insurance}名`);
      console.log(`  - 月給設定あり: ${row.with_monthly}名`);
      console.log(`  - 時給設定あり: ${row.with_hourly}名`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ エラー:', error.message);
  } finally {
    await pool.end();
  }
})();
