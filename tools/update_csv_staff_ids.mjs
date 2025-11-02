#!/usr/bin/env node
/**
 * CSVファイル内のstaff_idをスタッフ名から検索して更新するスクリプト
 */
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envを読み込む
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'railway',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD
});

async function getStaffMapping(tenantId) {
  const result = await pool.query(`
    SELECT staff_id, name as staff_name
    FROM hr.staff
    WHERE tenant_id = $1
    ORDER BY staff_id
  `, [tenantId]);

  const staffMap = {};
  result.rows.forEach(row => {
    staffMap[row.staff_name] = row.staff_id;
  });

  console.log('\n📊 スタッフマッピング:');
  Object.entries(staffMap).forEach(([name, id]) => {
    console.log(`  ${name}: ${id}`);
  });
  console.log(`\n合計: ${Object.keys(staffMap).length} 名\n`);

  return staffMap;
}

function updateCsvFile(filePath, staffMap, staffNameColumn, staffIdColumn) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  if (lines.length === 0) return 0;

  // ヘッダー行を確認
  const header = lines[0].split(',');
  const nameIndex = header.indexOf(staffNameColumn);
  const idIndex = header.indexOf(staffIdColumn);

  if (nameIndex === -1 || idIndex === -1) {
    console.log(`  ⚠️  ${path.basename(filePath)}: 必要なカラムが見つかりません`);
    return 0;
  }

  let updatedCount = 0;

  // 各データ行を処理
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const cols = lines[i].split(',');
    const staffName = cols[nameIndex];

    if (staffName && staffMap[staffName]) {
      cols[idIndex] = staffMap[staffName];
      lines[i] = cols.join(',');
      updatedCount++;
    } else if (staffName) {
      console.log(`  ⚠️  スタッフが見つかりません: ${staffName}`);
    }
  }

  // ファイルに書き戻す
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  console.log(`  ✅ ${path.basename(filePath)}: ${updatedCount} 件のstaff_idを更新しました`);

  return updatedCount;
}

async function main() {
  const tenantId = 3;

  console.log('\n' + '='.repeat(60));
  console.log('🔄 CSVファイルのstaff_id更新');
  console.log('='.repeat(60));
  console.log(`\nテナントID: ${tenantId}\n`);

  try {
    // スタッフIDマッピングを取得
    const staffMap = await getStaffMapping(tenantId);

    if (Object.keys(staffMap).length === 0) {
      console.log('⚠️  スタッフデータが見つかりません。先にスタッフマスターを登録してください。');
      process.exit(1);
    }

    // CSVファイルを更新
    const fixturesDir = path.join(__dirname, '..', 'fixtures');
    const files = [
      { path: 'work_hours_import_tenant3.csv', nameCol: 'staff_name', idCol: 'staff_id' },
      { path: 'payroll_tenant3.csv', nameCol: 'staff_name', idCol: 'staff_id' }
    ];

    console.log('📝 CSVファイル更新中...\n');
    let totalUpdated = 0;

    for (const file of files) {
      const filePath = path.join(fixturesDir, file.path);
      if (fs.existsSync(filePath)) {
        const count = updateCsvFile(filePath, staffMap, file.nameCol, file.idCol);
        totalUpdated += count;
      } else {
        console.log(`  ⚠️  ${file.path}: ファイルが見つかりません`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ 更新完了！合計 ${totalUpdated} 件のstaff_idを更新しました`);
    console.log('='.repeat(60) + '\n');

  } catch (err) {
    console.error('❌ エラー:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
