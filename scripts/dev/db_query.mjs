#!/usr/bin/env node

// CLIからデータベースクエリを実行するツール
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway';

const QUERIES = {
  tables: {
    name: '📋 全テーブル一覧',
    sql: `
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema IN ('core', 'hr', 'ops', 'analytics', 'audit')
      ORDER BY table_schema, table_name;
    `
  },
  tenants: {
    name: '🏢 テナント一覧',
    sql: `
      SELECT
        tenant_id,
        tenant_code,
        tenant_name,
        contract_plan,
        is_active
      FROM core.tenants;
    `
  },
  stores: {
    name: '🏪 店舗一覧',
    sql: `
      SELECT
        s.store_id,
        s.store_code,
        s.store_name,
        s.address,
        d.division_name,
        s.business_hours_start || ' - ' || s.business_hours_end as hours
      FROM core.stores s
      JOIN core.divisions d ON s.division_id = d.division_id
      WHERE s.is_active = TRUE;
    `
  },
  staff: {
    name: '👥 スタッフ一覧',
    sql: `
      SELECT
        staff_id,
        staff_code,
        name,
        employment_type,
        hire_date,
        is_active
      FROM hr.staff
      ORDER BY staff_id;
    `
  },
  'staff-detail': {
    name: '👥 スタッフ詳細',
    sql: `
      SELECT
        s.staff_code,
        s.name,
        r.role_name,
        s.employment_type,
        CASE
          WHEN s.employment_type = 'MONTHLY' THEN '月給 ¥' || s.monthly_salary
          WHEN s.employment_type = 'HOURLY' THEN '時給 ¥' || s.hourly_rate
        END as salary,
        s.hire_date,
        s.email
      FROM hr.staff s
      JOIN core.roles r ON s.role_id = r.role_id
      WHERE s.is_active = TRUE
      ORDER BY r.display_order, s.staff_id;
    `
  },
  roles: {
    name: '🎖️  役職一覧',
    sql: `
      SELECT
        role_id,
        role_code,
        role_name,
        display_order
      FROM core.roles
      WHERE is_active = TRUE
      ORDER BY display_order;
    `
  },
  skills: {
    name: '🎯 スキル一覧',
    sql: `
      SELECT
        skill_id,
        skill_code,
        skill_name,
        category,
        display_order
      FROM core.skills
      WHERE is_active = TRUE
      ORDER BY display_order;
    `
  },
  patterns: {
    name: '📅 シフトパターン一覧',
    sql: `
      SELECT
        pattern_code,
        pattern_name,
        start_time,
        end_time,
        break_minutes,
        ROUND(
          (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) - (break_minutes / 60.0),
          2
        ) as work_hours
      FROM core.shift_patterns
      WHERE is_active = TRUE
      ORDER BY start_time;
    `
  },
  summary: {
    name: '📊 データ件数サマリー',
    sql: `
      SELECT
        (SELECT COUNT(*) FROM core.tenants) as tenants,
        (SELECT COUNT(*) FROM core.divisions) as divisions,
        (SELECT COUNT(*) FROM core.stores) as stores,
        (SELECT COUNT(*) FROM core.roles) as roles,
        (SELECT COUNT(*) FROM core.skills) as skills,
        (SELECT COUNT(*) FROM core.shift_patterns) as shift_patterns,
        (SELECT COUNT(*) FROM hr.staff) as staff;
    `
  },
  count: {
    name: '🔢 全テーブルレコード数',
    sql: `
      SELECT 'tenants' as table_name, COUNT(*) as count FROM core.tenants
      UNION ALL
      SELECT 'divisions', COUNT(*) FROM core.divisions
      UNION ALL
      SELECT 'stores', COUNT(*) FROM core.stores
      UNION ALL
      SELECT 'roles', COUNT(*) FROM core.roles
      UNION ALL
      SELECT 'skills', COUNT(*) FROM core.skills
      UNION ALL
      SELECT 'shift_patterns', COUNT(*) FROM core.shift_patterns
      UNION ALL
      SELECT 'staff', COUNT(*) FROM hr.staff
      ORDER BY count DESC;
    `
  },
  salary: {
    name: '💰 人件費サマリー',
    sql: `
      SELECT
        employment_type,
        COUNT(*) as staff_count,
        CASE
          WHEN employment_type = 'MONTHLY' THEN
            '¥' || TO_CHAR(SUM(monthly_salary), 'FM999,999,999')
          WHEN employment_type = 'HOURLY' THEN
            '¥' || TO_CHAR(SUM(hourly_rate * 160), 'FM999,999,999') || ' (想定)'
        END as total_monthly_cost,
        CASE
          WHEN employment_type = 'MONTHLY' THEN
            '¥' || TO_CHAR(ROUND(AVG(monthly_salary), 0), 'FM999,999,999')
          WHEN employment_type = 'HOURLY' THEN
            '¥' || TO_CHAR(ROUND(AVG(hourly_rate), 0), 'FM999,999')
        END as average
      FROM hr.staff
      WHERE is_active = TRUE
      GROUP BY employment_type;
    `
  }
};

async function runQuery(queryName) {
  const query = QUERIES[queryName];

  if (!query) {
    console.error(`❌ 不明なクエリ: ${queryName}\n`);
    console.log('利用可能なクエリ:');
    Object.keys(QUERIES).forEach(key => {
      console.log(`  - ${key}`);
    });
    process.exit(1);
  }

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();

    console.log(query.name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const result = await client.query(query.sql);

    if (result.rows.length === 0) {
      console.log('（データなし）\n');
    } else {
      console.table(result.rows);
      console.log(`\n件数: ${result.rows.length}件\n`);
    }

  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// メイン処理
const command = process.argv[2];

if (!command) {
  console.log('Usage: node scripts/db_query.mjs [command]\n');
  console.log('利用可能なコマンド:');
  Object.keys(QUERIES).forEach(key => {
    console.log(`  ${key.padEnd(15)} - ${QUERIES[key].name}`);
  });
  console.log('\n例:');
  console.log('  node scripts/db_query.mjs staff');
  console.log('  node scripts/db_query.mjs summary');
  console.log('  npm run db:staff');
  process.exit(0);
}

runQuery(command);
