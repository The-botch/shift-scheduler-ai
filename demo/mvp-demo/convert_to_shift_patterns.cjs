const fs = require('fs');
const Papa = require('papaparse');

// CSVを読み込み
const csvData = fs.readFileSync('./public/data/transactions/availability_requests.csv', 'utf8');
const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

// コメントからシフトパターンを推測する関数
function inferPatternFromComment(comment, availability, startTime, endTime) {
  if (availability === 'unavailable') {
    return '';
  }

  const c = comment ? comment.toLowerCase() : '';

  // 早番
  if (c.includes('早番') || (startTime === '09:00' && endTime === '17:00')) {
    return 'EARLY';
  }
  // 遅番
  if (c.includes('遅番') || (startTime === '13:00' && endTime === '21:00')) {
    return 'MID';
  }
  // 夜勤・夜
  if (c.includes('夜勤') || c.includes('夜') || (startTime === '17:00' && endTime === '22:00')) {
    return 'LATE';
  }
  // 午前中のみ
  if (c.includes('午前中') || (startTime === '09:00' && endTime === '13:00')) {
    return 'SHORT_AM';
  }
  // 午後
  if (c.includes('午後') || (startTime === '14:00' && endTime === '18:00')) {
    return 'SHORT_PM';
  }
  // 14時以降、17時以降は遅番扱い
  if (c.includes('14時以降') || c.includes('17時以降')) {
    return 'LATE';
  }
  // 終日
  if (c.includes('終日') || (startTime === '09:00' && endTime === '22:00')) {
    return 'FULL';
  }

  // デフォルトは早番
  return 'EARLY';
}

// 各レコードをシフトパターンベースに変換
const updatedData = parsed.data.map(row => {
  const patternCode = inferPatternFromComment(
    row.comments,
    row.availability,
    row.preferred_start_time,
    row.preferred_end_time
  );

  return {
    request_id: row.request_id,
    staff_id: row.staff_id,
    plan_id: row.plan_id,
    request_date: row.request_date,
    availability: row.availability,
    preferred_pattern: patternCode,
    comments: row.comments,
    submitted_at: row.submitted_at,
    is_processed: row.is_processed
  };
});

// CSVに出力
const csv = Papa.unparse(updatedData);
fs.writeFileSync('./public/data/transactions/availability_requests.csv', csv, 'utf8');

console.log('✅ シフトパターンベースに変換しました');
console.log(`   - EARLY (早番): ${updatedData.filter(r => r.preferred_pattern === 'EARLY').length}件`);
console.log(`   - MID (中番): ${updatedData.filter(r => r.preferred_pattern === 'MID').length}件`);
console.log(`   - LATE (遅番): ${updatedData.filter(r => r.preferred_pattern === 'LATE').length}件`);
console.log(`   - SHORT_AM (午前): ${updatedData.filter(r => r.preferred_pattern === 'SHORT_AM').length}件`);
console.log(`   - SHORT_PM (午後): ${updatedData.filter(r => r.preferred_pattern === 'SHORT_PM').length}件`);
console.log(`   - FULL (通し): ${updatedData.filter(r => r.preferred_pattern === 'FULL').length}件`);
console.log(`   - 出勤不可: ${updatedData.filter(r => r.preferred_pattern === '').length}件`);
