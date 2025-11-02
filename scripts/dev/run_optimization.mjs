#!/usr/bin/env node
/**
 * 労働時間インポート最適化スクリプトを実行
 */
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envを読み込む
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'railway',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD
});

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 労働時間インポート最適化スクリプト実行');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. UNIQUE制約を追加
    console.log('[1/5] UNIQUE制約を追加中...');
    try {
      await pool.query(`
        ALTER TABLE ops.work_hours_actual
        ADD CONSTRAINT uq_work_hours_actual_key
        UNIQUE (tenant_id, store_id, staff_id, work_date)
      `);
      console.log('✅ UNIQUE制約を追加しました\n');
    } catch (err) {
      if (err.code === '42P07') {
        console.log('ℹ️  UNIQUE制約は既に存在します\n');
      } else {
        throw err;
      }
    }

    // 2. 複合インデックスを追加
    console.log('[2/5] 複合インデックスを追加中...');
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_work_hours_actual_composite
        ON ops.work_hours_actual(tenant_id, store_id, staff_id, work_date)
      `);
      console.log('✅ 複合インデックスを追加しました\n');
    } catch (err) {
      console.log('ℹ️  スキップ:', err.message, '\n');
    }

    // 3. 既存の個別インデックスを削除
    console.log('[3/5] 不要な個別インデックスを削除中...');
    const indexesToDrop = [
      'ops.idx_work_hours_actual_tenant',
      'ops.idx_work_hours_actual_store',
      'ops.idx_work_hours_actual_staff',
      'ops.idx_work_hours_actual_date'
    ];

    for (const idx of indexesToDrop) {
      try {
        await pool.query(`DROP INDEX IF EXISTS ${idx}`);
        console.log(`  ✅ ${idx} を削除`);
      } catch (err) {
        console.log(`  ⚠️  ${idx}: ${err.message}`);
      }
    }
    console.log();

    // 4. 年月別のインデックスを追加
    console.log('[4/5] 年月別インデックスを追加中...');
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_work_hours_actual_year_month
        ON ops.work_hours_actual(tenant_id, year, month)
      `);
      console.log('✅ 年月別インデックスを追加しました\n');
    } catch (err) {
      console.log('ℹ️  スキップ:', err.message, '\n');
    }

    // 5. 確認
    console.log('[5/5] インデックスと制約を確認中...\n');

    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'work_hours_actual'
      ORDER BY indexname
    `);

    console.log('📊 インデックス一覧:');
    indexes.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });
    console.log();

    const constraints = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'ops.work_hours_actual'::regclass
        AND contype IN ('u', 'p')
      ORDER BY conname
    `);

    console.log('🔒 制約一覧:');
    constraints.rows.forEach(row => {
      const type = row.contype === 'p' ? 'PRIMARY KEY' : 'UNIQUE';
      console.log(`  - ${row.conname} (${type})`);
    });
    console.log();

    console.log('='.repeat(60));
    console.log('✅ 最適化完了！');
    console.log('='.repeat(60) + '\n');

    console.log('💡 期待される効果:');
    console.log('  - ON CONFLICTの速度が劇的に向上（10-100倍）');
    console.log('  - 1000件のバッチインポートが数秒で完了');
    console.log('  - インデックスメンテナンスコストの削減\n');

  } catch (err) {
    console.error('\n❌ エラー:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
