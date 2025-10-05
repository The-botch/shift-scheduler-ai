/**
 * 日付操作ユーティリティ
 */

/**
 * 日付を YYYY-MM-DD 形式にフォーマット
 * @param {Date} date - 日付オブジェクト
 * @returns {string} フォーマットされた日付文字列
 */
export const formatDate = date => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * タイムスタンプを生成（YYYYMMDDHHmmss形式）
 * @param {Date} date - 日付オブジェクト（デフォルト: 現在時刻）
 * @returns {string} タイムスタンプ文字列
 */
export const generateTimestamp = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

/**
 * 現在の年月を取得
 * @returns {Object} { year, month }
 */
export const getCurrentYearMonth = () => {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

/**
 * 指定月の日数を取得
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @returns {number} 日数
 */
export const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate()
}
