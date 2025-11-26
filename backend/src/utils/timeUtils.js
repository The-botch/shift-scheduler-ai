/**
 * 時刻計算ユーティリティ
 * VARCHAR(5)形式の時刻（"09:00", "25:00"など）を扱う
 * 日付はJST (Asia/Tokyo) で処理
 */

/**
 * Dateオブジェクトをローカルタイムゾーン（JST）でYYYY-MM-DD形式に変換
 * toISOString().split('T')[0] はUTCで変換するため使わない
 * @param {Date} date - 日付オブジェクト
 * @returns {string} YYYY-MM-DD形式の日付文字列
 */
function formatDateToYYYYMMDD(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * VARCHAR(5)形式の時刻を分に変換
 * @param {string} timeStr - "09:00", "25:00" など
 * @returns {number} 分単位の値（"09:00" → 540, "25:00" → 1500）
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  return hour * 60 + minute;
}

/**
 * 分を VARCHAR(5)形式の時刻に変換
 * @param {number} minutes - 分単位の値
 * @returns {string} "09:00", "25:00" など
 */
function minutesToTime(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * 勤務時間を計算（時間単位）
 * @param {string} startTime - 開始時刻 "09:00"
 * @param {string} endTime - 終了時刻 "18:00" or "25:00"
 * @param {number} breakMinutes - 休憩時間（分）
 * @returns {number} 勤務時間（時間単位、小数）
 */
function calculateWorkHours(startTime, endTime, breakMinutes = 0) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  let totalMin = endMin - startMin;

  // 日をまたぐ場合の処理（例: 22:00 → 06:00）
  // ただし "25:00" 形式の場合は既に24時間超えで表現されているので不要
  if (totalMin < 0) {
    totalMin += 24 * 60;
  }

  totalMin -= breakMinutes;

  return totalMin / 60;
}

/**
 * 勤務時間を計算（時間単位、小数点2桁で丸め）
 * @param {string} startTime - 開始時刻
 * @param {string} endTime - 終了時刻
 * @param {number} breakMinutes - 休憩時間（分）
 * @returns {string} 勤務時間（文字列、小数点2桁）
 */
function calculateWorkHoursFixed(startTime, endTime, breakMinutes = 0) {
  return calculateWorkHours(startTime, endTime, breakMinutes).toFixed(2);
}

export {
  formatDateToYYYYMMDD,
  timeToMinutes,
  minutesToTime,
  calculateWorkHours,
  calculateWorkHoursFixed,
};
