/**
 * シフトデータリポジトリ（インフラ層）
 * データベースからシフトデータを取得
 */
import { BACKEND_API_URL, API_ENDPOINTS } from '../../config/api'
import { getCurrentTenantId } from '../../config/tenant'

export class ShiftRepository {
  /**
   * テナントID（デフォルト値）
   * @deprecated 代わりに getCurrentTenantId() を使用してください
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
        tenantId = null,
        planId,
        storeId,
        staffId,
        year,
        month,
        dateFrom,
        dateTo,
        isModified,
      } = filters

      const actualTenantId = tenantId ?? getCurrentTenantId()

      const params = new URLSearchParams({ tenant_id: actualTenantId })
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
  async getShift(shiftId, tenantId = null) {
    try {
      const actualTenantId = tenantId ?? getCurrentTenantId()

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS}/${shiftId}?tenant_id=${actualTenantId}`
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
        tenantId = null,
        storeId,
        year,
        month,
        status,
      } = filters

      const actualTenantId = tenantId ?? getCurrentTenantId()

      const params = new URLSearchParams({ tenant_id: actualTenantId })
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
  async getPlan(planId, tenantId = null) {
    try {
      const actualTenantId = tenantId ?? getCurrentTenantId()

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS_PLANS}/${planId}?tenant_id=${actualTenantId}`
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
        tenantId = null,
        storeId,
        year,
        month,
      } = filters

      const actualTenantId = tenantId ?? getCurrentTenantId()

      if (!year) {
        throw new Error('Year parameter is required')
      }

      const params = new URLSearchParams({ tenant_id: actualTenantId, year })
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
        tenantId = null,
        staffId,
        year,
        month,
      } = filters

      const actualTenantId = tenantId ?? getCurrentTenantId()

      const params = new URLSearchParams({ tenant_id: actualTenantId })
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

  /**
   * シフトを更新
   * @param {number} shiftId - シフトID
   * @param {Object} data - 更新データ
   * @param {number} tenantId - テナントID
   * @returns {Promise<Object>} 更新後のシフトデータ
   */
  async updateShift(shiftId, data, tenantId = null) {
    try {
      const actualTenantId = tenantId ?? getCurrentTenantId()

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS}/${shiftId}?tenant_id=${actualTenantId}`
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'シフト更新に失敗しました')
      }

      return result.data
    } catch (error) {
      console.error('シフト更新エラー:', error)
      throw new Error(`シフト更新エラー: ${error.message}`)
    }
  }

  /**
   * シフトを削除
   * @param {number} shiftId - シフトID
   * @param {number} tenantId - テナントID
   * @returns {Promise<boolean>} 削除成功フラグ
   */
  async deleteShift(shiftId, tenantId = null) {
    try {
      const actualTenantId = tenantId ?? getCurrentTenantId()

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS}/${shiftId}?tenant_id=${actualTenantId}`
      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'シフト削除に失敗しました')
      }

      return true
    } catch (error) {
      console.error('シフト削除エラー:', error)
      throw new Error(`シフト削除エラー: ${error.message}`)
    }
  }

  /**
   * 新規シフトを作成
   * @param {Object} data - シフトデータ
   * @param {number} tenantId - テナントID
   * @returns {Promise<Object>} 作成されたシフトデータ
   */
  async createShift(data, tenantId = null) {
    try {
      const actualTenantId = tenantId ?? getCurrentTenantId()

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tenant_id: actualTenantId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'シフト作成に失敗しました')
      }

      return result.data
    } catch (error) {
      console.error('シフト作成エラー:', error)
      throw new Error(`シフト作成エラー: ${error.message}`)
    }
  }

  /**
   * シフト計画のステータスを更新
   * @param {number} planId - プランID
   * @param {string} status - 新しいステータス (DRAFT/SUBMITTED/APPROVED/PUBLISHED/ARCHIVED)
   * @param {number} tenantId - テナントID
   * @returns {Promise<Object>} 更新後のプランデータ
   */
  async updatePlanStatus(planId, status, tenantId = null) {
    try {
      const actualTenantId = tenantId ?? getCurrentTenantId()

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS_PLANS}/${planId}/status?tenant_id=${actualTenantId}`
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'プランステータス更新に失敗しました')
      }

      return result.data
    } catch (error) {
      console.error('プランステータス更新エラー:', error)
      throw new Error(`プランステータス更新エラー: ${error.message}`)
    }
  }
}
