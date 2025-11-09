import { query } from './src/config/database.js';

(async () => {
  const tables = [
    { schema: 'core', table: 'skills' },
    { schema: 'hr', table: 'tax_brackets' },
    { schema: 'hr', table: 'staff_skills' },
    { schema: 'hr', table: 'staff_certifications' }
  ];

  for (const { schema, table } of tables) {
    console.log(`\n=== ${schema}.${table} ===`);
    const columns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [schema, table]);

    columns.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
  }

  process.exit(0);
})();
