#!/usr/bin/env node
/**
 * hr.payrollテーブルにユニーク制約を追加するマイグレーション
 * ON CONFLICT句をサポートするために必要
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envを読み込む
dotenv.config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || process.env.PGHOST,
  port: process.env.DB_PORT || process.env.PGPORT || 5432,
  database: process.env.DB_NAME || process.env.PGDATABASE,
  user: process.env.DB_USER || process.env.PGUSER,
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD
});

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 hr.payrollテーブルにユニーク制約を追加');
  console.log('='.repeat(60) + '\n');

  try {
    // 既存の制約を確認
    const checkConstraint = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_schema = 'hr'
        AND table_name = 'payroll'
        AND constraint_name = 'uq_payroll_key'
    `);

    if (checkConstraint.rows.length > 0) {
      console.log('✅ ユニーク制約 uq_payroll_key は既に存在します');
      return;
    }

    // ユニーク制約を追加
    console.log('📝 ユニーク制約を追加中...');
    await pool.query(`
      ALTER TABLE hr.payroll
      ADD CONSTRAINT uq_payroll_key UNIQUE (tenant_id, store_id, year, month, staff_id)
    `);

    console.log('✅ ユニーク制約 uq_payroll_key を追加しました');
    console.log('\n' + '='.repeat(60));
    console.log('✅ マイグレーション完了');
    console.log('='.repeat(60) + '\n');

  } catch (err) {
    console.error('❌ エラー:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
