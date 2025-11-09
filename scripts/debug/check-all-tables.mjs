import { query } from './src/config/database.js';

(async () => {
  console.log('=== 全テーブル一覧 ===\n');

  const schemas = ['core', 'hr', 'ops'];

  for (const schema of schemas) {
    console.log(`\n📋 ${schema}スキーマのテーブル:`);
    console.log('─'.repeat(60));

    const tables = await query(`
      SELECT table_name,
             (SELECT COUNT(*)
              FROM information_schema.columns
              WHERE table_schema = $1 AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = $1
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `, [schema]);

    tables.rows.forEach(t => {
      console.log(`  ${t.table_name.padEnd(35)} (${t.column_count}カラム)`);
    });
  }

  process.exit(0);
})();
