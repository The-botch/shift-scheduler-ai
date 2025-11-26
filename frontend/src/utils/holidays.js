/**
 * 日本の祝日データ（バックエンドAPIから取得）
 */

import { BACKEND_API_URL } from '../config/api'

// 祝日データのキャッシュ
let holidaysCache = {}
let cacheTimestamp = 0
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24時間

/**
 * バックエンドAPIから祝日データを取得
 */
async function fetchHolidays() {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/holidays`)

    if (!response.ok) {
      throw new Error(`Failed to fetch holidays: ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error('Failed to get holidays data')
    }

    return result.data
  } catch (error) {
    console.error('祝日データ取得エラー:', error)
    // フォールバック: 最低限の祝日データ
    return getFallbackHolidays()
  }
}

/**
 * 祝日データを取得（キャッシュ付き）
 */
async function getHolidays() {
  const now = Date.now()

  // キャッシュが有効な場合はキャッシュを返す
  if (
    cacheTimestamp &&
    now - cacheTimestamp < CACHE_DURATION &&
    Object.keys(holidaysCache).length > 0
  ) {
    return holidaysCache
  }

  // キャッシュが無効な場合は新たに取得
  holidaysCache = await fetchHolidays()
  cacheTimestamp = now
  return holidaysCache
}

/**
 * フォールバックの祝日データ（空のデータ構造）
 * バックエンドAPIから取得失敗時に使用
 * ※ 警告ログは無限ループを防ぐため削除
 */
function getFallbackHolidays() {
  return {}
}

/**
 * 指定された日付が祝日かどうかを判定
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @param {number} day - 日
 * @param {object} holidaysData - 祝日データ（オプション、未指定の場合はキャッシュから取得）
 * @returns {boolean} 祝日の場合true
 */
export const isHoliday = (year, month, day, holidaysData = null) => {
  // キャッシュが空の場合はフォールバックデータを使用
  let data = holidaysData || holidaysCache
  if (!data || Object.keys(data).length === 0) {
    data = getFallbackHolidays()
  }

  if (!data[year] || !data[year][month]) {
    return false
  }

  // 新しいAPIフォーマット（配列にオブジェクト）に対応
  const monthHolidays = data[year][month]
  if (Array.isArray(monthHolidays) && monthHolidays.length > 0) {
    if (typeof monthHolidays[0] === 'object') {
      // { day: 1, name: '元日' } 形式
      return monthHolidays.some(h => h.day === day)
    } else {
      // 数値配列形式（旧フォーマット）
      return monthHolidays.includes(day)
    }
  }

  return false
}

/**
 * 指定された日付の祝日名を取得
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @param {number} day - 日
 * @param {object} holidaysData - 祝日データ（オプション）
 * @returns {string|null} 祝日名、祝日でない場合はnull
 */
export const getHolidayName = (year, month, day, holidaysData = null) => {
  // キャッシュが空の場合はフォールバックデータを使用
  let data = holidaysData || holidaysCache
  if (!data || Object.keys(data).length === 0) {
    data = getFallbackHolidays()
  }

  if (!isHoliday(year, month, day, data)) {
    return null
  }

  const monthHolidays = data[year]?.[month]
  if (Array.isArray(monthHolidays) && monthHolidays.length > 0) {
    if (typeof monthHolidays[0] === 'object') {
      // { day: 1, name: '元日' } 形式
      const holiday = monthHolidays.find(h => h.day === day)
      return holiday ? holiday.name : '祝日'
    }
  }

  return '祝日'
}

/**
 * 指定された月の祝日リストを取得
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @param {object} holidaysData - 祝日データ（オプション）
 * @returns {array} 祝日の配列
 */
export const getHolidaysInMonth = (year, month, holidaysData = null) => {
  const data = holidaysData || holidaysCache

  if (!data[year] || !data[year][month]) {
    return []
  }
  return data[year][month]
}

/**
 * 祝日データを事前に読み込む（初期化用）
 * コンポーネントのマウント時に呼び出すことを推奨
 */
export const loadHolidays = async () => {
  return await getHolidays()
}
