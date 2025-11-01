#!/usr/bin/env node

import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../backend/.env') });

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const client = await pool.connect();

try {
  // テナント3のスタッフ数を確認
  const result = await client.query(`
    SELECT COUNT(*) as total_count,
           COUNT(DISTINCT name) as unique_names
    FROM hr.staff
    WHERE tenant_id = 3
  `);

  console.log('テナント3のスタッフ状況:');
  console.log('  総登録数:', result.rows[0].total_count);
  console.log('  ユニーク名前数:', result.rows[0].unique_names);

  // 重複している名前を確認
  const dupes = await client.query(`
    SELECT name, COUNT(*) as count
    FROM hr.staff
    WHERE tenant_id = 3
    GROUP BY name
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 10
  `);

  if (dupes.rows.length > 0) {
    console.log('\n重複している名前（上位10件）:');
    dupes.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.count}回`);
    });
  } else {
    console.log('\n重複なし');
  }

  // 全スタッフリスト（最初の10件）
  const allStaff = await client.query(`
    SELECT staff_id, staff_code, name, created_at
    FROM hr.staff
    WHERE tenant_id = 3
    ORDER BY created_at
    LIMIT 20
  `);

  console.log('\n登録されているスタッフ（最初の20件）:');
  allStaff.rows.forEach((row, idx) => {
    console.log(`  ${idx + 1}. [ID:${row.staff_id}] ${row.staff_code} - ${row.name} (登録日: ${row.created_at.toISOString().split('T')[0]})`);
  });

  // 役職分布を確認
  const roleDistribution = await client.query(`
    SELECT r.role_name, COUNT(s.staff_id) as count
    FROM hr.staff s
    JOIN core.roles r ON s.role_id = r.role_id
    WHERE s.tenant_id = 3
    GROUP BY r.role_name
    ORDER BY count DESC
  `);

  console.log('\n役職分布:');
  roleDistribution.rows.forEach(row => {
    console.log(`  ${row.role_name}: ${row.count}名`);
  });

} finally {
  client.release();
  await pool.end();
}
