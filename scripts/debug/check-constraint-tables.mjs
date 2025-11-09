import { query } from './src/config/database.js';

(async () => {
  const tables = [
    { schema: 'ops', table: 'labor_law_constraints' },
    { schema: 'ops', table: 'labor_management_rules' },
    { schema: 'ops', table: 'store_constraints' },
    { schema: 'ops', table: 'shift_validation_rules' }
  ];

  for (const { schema, table } of tables) {
    console.log(`\n=== ${schema}.${table} ===`);
    console.log('─'.repeat(80));

    // テーブル構造を取得
    const columns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [schema, table]);

    columns.rows.forEach(col => {
      const nullable = col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
    });

    // Tenant 3のデータ件数を確認
    const hasTenantId = columns.rows.some(c => c.column_name === 'tenant_id');
    if (hasTenantId) {
      const count = await query(`SELECT COUNT(*) as count FROM ${schema}.${table} WHERE tenant_id = 3`);
      console.log(`\n  📊 Tenant 3のデータ件数: ${count.rows[0].count}件`);
    } else {
      const count = await query(`SELECT COUNT(*) as count FROM ${schema}.${table}`);
      console.log(`\n  📊 全体のデータ件数: ${count.rows[0].count}件`);
    }
  }

  process.exit(0);
})();
