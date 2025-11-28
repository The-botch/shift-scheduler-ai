/**
 * デフォルト設定値
 *
 * ハードコーディングを避けるため、デフォルト値を一元管理します。
 * 環境変数で上書き可能です。
 */

import { getCurrentYearMonth as getJSTYearMonth } from '../utils/dateUtils'

export const DEFAULT_CONFIG = {
  // テナント・店舗設定
  TENANT_ID: parseInt(import.meta.env.VITE_DEFAULT_TENANT_ID) || 1,
  STORE_ID: parseInt(import.meta.env.VITE_DEFAULT_STORE_ID) || 1,

  // デモ・開発用設定
  DEMO_PLAN_ID: parseInt(import.meta.env.VITE_DEMO_PLAN_ID) || 4,
  DEMO_STAFF_ID: parseInt(import.meta.env.VITE_DEMO_STAFF_ID) || 5,
  DEMO_YEAR: parseInt(import.meta.env.VITE_DEMO_YEAR) || 2024,
  DEMO_MONTH: parseInt(import.meta.env.VITE_DEMO_MONTH) || 10,
}

/**
 * 現在の年月を取得（JST）
 * デモ用の固定値の代わりに、現在の年月を使用したい場合に利用
 */
export const getCurrentYearMonth = () => {
  return getJSTYearMonth()
}

/**
 * 次月の年月を取得（JST）
 */
export const getNextMonthYearMonth = () => {
  const current = getJSTYearMonth()
  const year = current.month === 12 ? current.year + 1 : current.year
  const month = current.month === 12 ? 1 : current.month + 1
  return { year, month }
}

/**
 * デモパラメータ（LINE希望入力など）
 */
export const DEMO_PARAMS = {
  tenant_id: DEFAULT_CONFIG.TENANT_ID,
  store_id: DEFAULT_CONFIG.STORE_ID,
  staff_id: DEFAULT_CONFIG.DEMO_STAFF_ID,
  year: DEFAULT_CONFIG.DEMO_YEAR,
  month: DEFAULT_CONFIG.DEMO_MONTH,
}

export default DEFAULT_CONFIG
