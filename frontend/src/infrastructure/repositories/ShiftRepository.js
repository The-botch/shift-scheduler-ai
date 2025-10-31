/**
 * シフトデータリポジトリ（インフラ層）
 * データベースからシフトデータを取得
 */
import { BACKEND_API_URL, API_ENDPOINTS } from '../../config/api'

export class ShiftRepository {
  /**
   * テナントID（デフォルト値）
   */
  static DEFAULT_TENANT_ID = 1

  /**
   * シフト一覧を取得
   * @param {Object} filters - フィルタリング条件
   * @param {number} filters.tenantId - テナントID
   * @param {number} filters.planId - シフト計画ID
   * @param {number} filters.storeId - 店舗ID
   * @param {number} filters.staffId - スタッフID
   * @param {number} filters.year - 年
   * @param {number} filters.month - 月
   * @param {string} filters.dateFrom - 開始日 (YYYY-MM-DD)
   * @param {string} filters.dateTo - 終了日 (YYYY-MM-DD)
   * @param {boolean} filters.isModified - 変更フラグ
   * @returns {Promise<Array>} シフトデータ配列
   */
  async getShifts(filters = {}) {
    try {
      const {
        tenantId = ShiftRepository.DEFAULT_TENANT_ID,
        planId,
        storeId,
        staffId,
        year,
        month,
        dateFrom,
        dateTo,
        isModified,
      } = filters

      const params = new URLSearchParams({ tenant_id: tenantId })
      if (planId) params.append('plan_id', planId)
      if (storeId) params.append('store_id', storeId)
      if (staffId) params.append('staff_id', staffId)
      if (year) params.append('year', year)
      if (month) params.append('month', month)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (isModified !== undefined) params.append('is_modified', isModified)

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS}?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'シフト一覧取得に失敗しました')
      }

      return result.data
    } catch (error) {
      console.error('シフト一覧取得エラー:', error)
      throw new Error(`シフト一覧取得エラー: ${error.message}`)
    }
  }

  /**
   * 特定のシフト詳細を取得
   * @param {number} shiftId - シフトID
   * @param {number} tenantId - テナントID
   * @returns {Promise<Object>} シフト詳細データ
   */
  async getShift(shiftId, tenantId = ShiftRepository.DEFAULT_TENANT_ID) {
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS}/${shiftId}?tenant_id=${tenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'シフト詳細取得に失敗しました')
      }

      return result.data
    } catch (error) {
      console.error('シフト詳細取得エラー:', error)
      throw new Error(`シフト詳細取得エラー: ${error.message}`)
    }
  }

  /**
   * シフト計画一覧を取得
   * @param {Object} filters - フィルタリング条件
   * @param {number} filters.tenantId - テナントID
   * @param {number} filters.storeId - 店舗ID
   * @param {number} filters.year - 年
   * @param {number} filters.month - 月
   * @param {string} filters.status - ステータス (DRAFT/SUBMITTED/APPROVED/PUBLISHED/ARCHIVED)
   * @returns {Promise<Array>} シフト計画データ配列
   */
  async getPlans(filters = {}) {
    try {
      const {
        tenantId = ShiftRepository.DEFAULT_TENANT_ID,
        storeId,
        year,
        month,
        status,
      } = filters

      const params = new URLSearchParams({ tenant_id: tenantId })
      if (storeId) params.append('store_id', storeId)
      if (year) params.append('year', year)
      if (month) params.append('month', month)
      if (status) params.append('status', status)

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS_PLANS}?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'シフト計画一覧取得に失敗しました')
      }

      return result.data
    } catch (error) {
      console.error('シフト計画一覧取得エラー:', error)
      throw new Error(`シフト計画一覧取得エラー: ${error.message}`)
    }
  }

  /**
   * 特定のシフト計画詳細を取得
   * @param {number} planId - シフト計画ID
   * @param {number} tenantId - テナントID
   * @returns {Promise<Object>} シフト計画詳細データ
   */
  async getPlan(planId, tenantId = ShiftRepository.DEFAULT_TENANT_ID) {
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS_PLANS}/${planId}?tenant_id=${tenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'シフト計画詳細取得に失敗しました')
      }

      return result.data
    } catch (error) {
      console.error('シフト計画詳細取得エラー:', error)
      throw new Error(`シフト計画詳細取得エラー: ${error.message}`)
    }
  }

  /**
   * シフトサマリー（月別集計）を取得
   * @param {Object} filters - フィルタリング条件
   * @param {number} filters.tenantId - テナントID
   * @param {number} filters.storeId - 店舗ID
   * @param {number} filters.year - 年 (required)
   * @param {number} filters.month - 月
   * @returns {Promise<Array>} シフトサマリーデータ配列
   */
  async getSummary(filters = {}) {
    try {
      const {
        tenantId = ShiftRepository.DEFAULT_TENANT_ID,
        storeId,
        year,
        month,
      } = filters

      if (!year) {
        throw new Error('Year parameter is required')
      }

      const params = new URLSearchParams({ tenant_id: tenantId, year })
      if (storeId) params.append('store_id', storeId)
      if (month) params.append('month', month)

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS_SUMMARY}?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'シフトサマリー取得に失敗しました')
      }

      return result.data
    } catch (error) {
      console.error('シフトサマリー取得エラー:', error)
      throw new Error(`シフトサマリー取得エラー: ${error.message}`)
    }
  }

  /**
   * 希望シフト一覧を取得
   * @param {Object} filters - フィルタリング条件
   * @param {number} filters.tenantId - テナントID
   * @param {number} filters.staffId - スタッフID
   * @param {number} filters.year - 年
   * @param {number} filters.month - 月
   * @returns {Promise<Array>} 希望シフトデータ配列
   */
  async getPreferences(filters = {}) {
    try {
      const {
        tenantId = ShiftRepository.DEFAULT_TENANT_ID,
        staffId,
        year,
        month,
      } = filters

      const params = new URLSearchParams({ tenant_id: tenantId })
      if (staffId) params.append('staff_id', staffId)
      if (year) params.append('year', year)
      if (month) params.append('month', month)

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS_PREFERENCES}?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '希望シフト取得に失敗しました')
      }

      return result.data
    } catch (error) {
      console.error('希望シフト取得エラー:', error)
      throw new Error(`希望シフト取得エラー: ${error.message}`)
    }
  }
}
