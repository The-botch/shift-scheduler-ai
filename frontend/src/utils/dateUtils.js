/**
 * 日付操作ユーティリティ
 *
 * このアプリケーションは全てJST (Asia/Tokyo) で動作します。
 * date-fns-tz を使用してタイムゾーンを明示的に扱います。
 */

import { toZonedTime } from 'date-fns-tz'
import { parse, getDay, getDaysInMonth as dateFnsGetDaysInMonth, getYear, getMonth } from 'date-fns'

// JST タイムゾーン定数
const JST_TIMEZONE = 'Asia/Tokyo'

/**
 * YYYY-MM-DD 形式の文字列をJSTの日付オブジェクトとしてパース
 * @param {string} dateStr - YYYY-MM-DD 形式の日付文字列
 * @returns {Date} JST日付オブジェクト
 */
export const parseJSTDate = (dateStr) => {
  // YYYY-MM-DD 形式をパース（JSTとして扱う）
  const parsed = parse(dateStr, 'yyyy-MM-dd', new Date())
  return toZonedTime(parsed, JST_TIMEZONE)
}

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
 * YYYY-MM-DD 形式の日付文字列から曜日を取得（JST）
 * @param {string} dateStr - YYYY-MM-DD 形式の日付文字列
 * @returns {number} 曜日 (0=日曜, 1=月曜, ..., 6=土曜)
 */
export const getDayOfWeekFromString = (dateStr) => {
  const jstDate = parseJSTDate(dateStr)
  return getDay(jstDate)
}

/**
 * 年月日から曜日を取得（JST）
 * @param {number} year - 年
 * @param {number} month - 月 (1-12)
 * @param {number} day - 日
 * @returns {number} 曜日 (0=日曜, 1=月曜, ..., 6=土曜)
 */
export const getDayOfWeek = (year, month, day) => {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return getDayOfWeekFromString(dateStr)
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
 * 現在の年月を取得（JST）
 * @returns {Object} { year, month }
 */
export const getCurrentYearMonth = () => {
  const now = new Date()
  const jstNow = toZonedTime(now, JST_TIMEZONE)
  return {
    year: getYear(jstNow),
    month: getMonth(jstNow) + 1,  // date-fns の getMonth は0始まり
  }
}

/**
 * JST で現在の年を取得
 * @returns {number} 年
 */
export const getCurrentYear = () => {
  const now = new Date()
  const jstNow = toZonedTime(now, JST_TIMEZONE)
  return getYear(jstNow)
}

/**
 * JST で現在の月を取得
 * @returns {number} 月（1-12）
 */
export const getCurrentMonth = () => {
  const now = new Date()
  const jstNow = toZonedTime(now, JST_TIMEZONE)
  return getMonth(jstNow) + 1  // date-fns の getMonth は0始まり
}

/**
 * 指定月の日数を取得
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @returns {number} 日数
 */
export const getDaysInMonth = (year, month) => {
  // date-fns の getDaysInMonth は Date オブジェクトが必要
  // YYYY-MM-01 の形式で日付を作成
  const dateStr = `${year}-${String(month).padStart(2, '0')}-01`
  const date = parseJSTDate(dateStr)
  return dateFnsGetDaysInMonth(date)
}
