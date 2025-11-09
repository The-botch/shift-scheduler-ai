import { query } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 マイグレーション開始: plan_type カラム追加');

    // 1. カラム追加
    console.log('実行中: ALTER TABLE ops.shift_plans ADD COLUMN plan_type...');
    await query(`
      ALTER TABLE ops.shift_plans
      ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20)
    `);

    // 2. 既存データの更新（FIRST）
    console.log('実行中: UPDATE plan_type = FIRST (approved/draft)...');
    await query(`
      UPDATE ops.shift_plans
      SET plan_type = 'FIRST'
      WHERE plan_type IS NULL
        AND (status IN ('approved', 'first_plan_approved', 'draft'))
    `);

    // 3. 既存データの更新（SECOND）
    console.log('実行中: UPDATE plan_type = SECOND (second_plan_approved)...');
    await query(`
      UPDATE ops.shift_plans
      SET plan_type = 'SECOND'
      WHERE plan_type IS NULL
        AND status = 'second_plan_approved'
    `);

    // 4. 残りをFIRSTで埋める
    console.log('実行中: UPDATE plan_type = FIRST (残り)...');
    await query(`
      UPDATE ops.shift_plans
      SET plan_type = 'FIRST'
      WHERE plan_type IS NULL
    `);

    // 確認クエリ
    console.log('\n📊 結果確認:');
    const result = await query(`
      SELECT
        plan_type,
        status,
        COUNT(*) as count
      FROM ops.shift_plans
      GROUP BY plan_type, status
      ORDER BY plan_type, status
    `);

    console.table(result.rows);

    console.log('\n✅ マイグレーション完了！');
    process.exit(0);

  } catch (error) {
    console.error('❌ マイグレーションエラー:', error);
    process.exit(1);
  }
}

runMigration();
