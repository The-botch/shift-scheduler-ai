import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const csvPath = join(__dirname, '../fixtures/shift_pdfs/csv_output/シフト.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const shifts = parse(csvContent, {
  columns: true,
  skip_empty_lines: true
});

// 武根太一さんのシフトを抽出
const takeneShifts = shifts.filter(s => s.staff_name === '武根太一');

console.log('=== 武根太一さんのシフトデータパース検証 ===\n');
console.log(`総件数: ${takeneShifts.length}件\n`);

takeneShifts.slice(0, 5).forEach((shift, idx) => {
  console.log(`--- ${idx + 1}件目 ---`);
  console.log(`CSV上の shift_date: "${shift.shift_date}"`);

  const date = new Date(shift.shift_date);
  console.log(`new Date()でパース: ${date}`);
  console.log(`toISOString(): ${date.toISOString()}`);
  console.log(`toISOString().split('T')[0]: ${date.toISOString().split('T')[0]}`);

  const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  console.log(`年月計算結果: ${yearMonth}`);
  console.log('');
});

console.log('\n=== 問題分析 ===');
const firstDate = new Date(takeneShifts[0].shift_date);
const expectedDate = '2025-07-03';
const actualDate = firstDate.toISOString().split('T')[0];

console.log(`CSV上の最初の日付: ${takeneShifts[0].shift_date}`);
console.log(`期待される日付: ${expectedDate}`);
console.log(`実際にパースされた日付: ${actualDate}`);

if (actualDate !== expectedDate) {
  console.log(`\n❌ 日付ずれを検出！ ${expectedDate} → ${actualDate}`);
  console.log(`   原因: new Date() がタイムゾーンやUTCで解釈している可能性があります`);
} else {
  console.log(`\n✅ 日付は正しくパースされています`);
}
