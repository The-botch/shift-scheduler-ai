import { query } from './src/config/database.js';

(async () => {
  console.log('=== マスターテーブル確認 ===\n');

  // coreスキーマのテーブル一覧を取得
  const tables = await query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'core'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  console.log('📋 coreスキーマのテーブル:');
  tables.rows.forEach(t => console.log(`  - ${t.table_name}`));

  // 各テーブルのレコード数を確認（tenant_id=3）
  console.log('\n\n📊 Tenant 3のマスターデータ件数:');
  console.log('─'.repeat(60));

  for (const table of tables.rows) {
    const tableName = table.table_name;

    try {
      // まずテーブル構造を確認
      const columns = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'core'
          AND table_name = $1
      `, [tableName]);

      const hasTenantId = columns.rows.some(c => c.column_name === 'tenant_id');

      if (hasTenantId) {
        const count = await query(`SELECT COUNT(*) as count FROM core.${tableName} WHERE tenant_id = 3`);
        console.log(`  ${tableName.padEnd(30)}: ${count.rows[0].count}件`);
      } else {
        const count = await query(`SELECT COUNT(*) as count FROM core.${tableName}`);
        console.log(`  ${tableName.padEnd(30)}: ${count.rows[0].count}件 (全体)`);
      }
    } catch (err) {
      console.log(`  ${tableName.padEnd(30)}: エラー - ${err.message}`);
    }
  }

  // hrスキーマも確認
  console.log('\n\n📋 hrスキーマのマスターテーブル:');
  const hrTables = await query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'hr'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  hrTables.rows.forEach(t => console.log(`  - ${t.table_name}`));

  console.log('\n\n📊 Tenant 3のhrマスターデータ件数:');
  console.log('─'.repeat(60));

  for (const table of hrTables.rows) {
    const tableName = table.table_name;

    try {
      const columns = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'hr'
          AND table_name = $1
      `, [tableName]);

      const hasTenantId = columns.rows.some(c => c.column_name === 'tenant_id');

      if (hasTenantId) {
        const count = await query(`SELECT COUNT(*) as count FROM hr.${tableName} WHERE tenant_id = 3`);
        console.log(`  ${tableName.padEnd(30)}: ${count.rows[0].count}件`);
      } else {
        const count = await query(`SELECT COUNT(*) as count FROM hr.${tableName}`);
        console.log(`  ${tableName.padEnd(30)}: ${count.rows[0].count}件 (全体)`);
      }
    } catch (err) {
      console.log(`  ${tableName.padEnd(30)}: エラー`);
    }
  }

  process.exit(0);
})();
