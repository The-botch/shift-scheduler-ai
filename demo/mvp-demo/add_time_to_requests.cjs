const fs = require('fs');
const Papa = require('papaparse');

// CSVを読み込み
const csvData = fs.readFileSync('./public/data/transactions/availability_requests.csv', 'utf8');
const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

// コメントから時間帯を推測する関数
function inferTimeFromComment(comment, availability) {
  if (availability === 'unavailable') {
    return { start_time: '', end_time: '' };
  }

  const c = comment ? comment.toLowerCase() : '';

  // 早番
  if (c.includes('早番')) {
    return { start_time: '09:00', end_time: '17:00' };
  }
  // 午前中
  if (c.includes('午前中')) {
    return { start_time: '09:00', end_time: '13:00' };
  }
  // 遅番
  if (c.includes('遅番')) {
    return { start_time: '13:00', end_time: '21:00' };
  }
  // 午後
  if (c.includes('午後')) {
    return { start_time: '13:00', end_time: '22:00' };
  }
  // 夜勤
  if (c.includes('夜勤') || c.includes('夜')) {
    return { start_time: '17:00', end_time: '22:00' };
  }
  // 17時以降
  if (c.includes('17時以降')) {
    return { start_time: '17:00', end_time: '22:00' };
  }
  // 14時以降
  if (c.includes('14時以降') || c.includes('授業後14時')) {
    return { start_time: '14:00', end_time: '22:00' };
  }
  // 終日・全日
  if (c.includes('終日') || c.includes('全日')) {
    return { start_time: '09:00', end_time: '22:00' };
  }
  // 午前中だけ
  if (c.includes('午前中だけ')) {
    return { start_time: '09:00', end_time: '13:00' };
  }
  // 午前中のみ
  if (c.includes('午前中のみ')) {
    return { start_time: '09:00', end_time: '13:00' };
  }

  // デフォルト（コメントなしの場合は通常シフト）
  return { start_time: '09:00', end_time: '17:00' };
}

// 各レコードに時間帯を追加
const updatedData = parsed.data.map(row => {
  const { start_time, end_time } = inferTimeFromComment(row.comments, row.availability);
  return {
    ...row,
    preferred_start_time: start_time,
    preferred_end_time: end_time
  };
});

// CSVに出力
const csv = Papa.unparse(updatedData);
fs.writeFileSync('./public/data/transactions/availability_requests.csv', csv, 'utf8');

console.log('✅ 時間帯情報を追加しました');
