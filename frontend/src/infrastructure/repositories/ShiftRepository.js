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
        plan_type,
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
      if (plan_type) params.append('plan_type', plan_type)

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
   * @param {string} filters.status - ステータス (DRAFT/APPROVED)
   * @returns {Promise<Array>} シフト計画データ配列
   */
  async getPlans(filters = {}) {
    try {
      const { tenantId = null, storeId, year, month, status } = filters

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
      const { tenantId = null, storeId, year, month, plan_type } = filters

      const actualTenantId = tenantId ?? getCurrentTenantId()

      if (!year) {
        throw new Error('Year parameter is required')
      }

      const params = new URLSearchParams({ tenant_id: actualTenantId, year })
      if (storeId) params.append('store_id', storeId)
      if (month) params.append('month', month)
      if (plan_type) params.append('plan_type', plan_type)

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
   * ★変更: 新API形式（1日1レコード、date_from/date_to）に対応
   * @param {Object} filters - フィルタリング条件
   * @param {number} filters.tenantId - テナントID
   * @param {number} filters.staffId - スタッフID
   * @param {number} filters.storeId - 店舗ID
   * @param {string} filters.dateFrom - 開始日 (YYYY-MM-DD)
   * @param {string} filters.dateTo - 終了日 (YYYY-MM-DD)
   * @param {boolean} filters.isNg - NG日フラグでフィルタ
   * @returns {Promise<Array>} 希望シフトデータ配列
   */
  async getPreferences(filters = {}) {
    try {
      const { tenantId = null, staffId, storeId, dateFrom, dateTo, isNg } = filters

      const actualTenantId = tenantId ?? getCurrentTenantId()

      const params = new URLSearchParams({ tenant_id: actualTenantId })
      if (staffId) params.append('staff_id', staffId)
      if (storeId) params.append('store_id', storeId)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (isNg !== undefined) params.append('is_ng', isNg)

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
   * 希望シフトを一括登録（UPSERT）
   * ★新規追加: 新API形式（1日1レコード、bulk API）
   * @param {Array} preferences - 希望シフトデータ配列
   * @param {number} tenantId - テナントID
   * @returns {Promise<Object>} 登録結果
   */
  async savePreferencesBulk(preferences, tenantId = null) {
    try {
      const actualTenantId = tenantId ?? getCurrentTenantId()

      // 各preferenceにtenant_idを設定
      const preferencesWithTenantId = preferences.map(p => ({
        ...p,
        tenant_id: p.tenant_id ?? actualTenantId,
      }))

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.SHIFTS_PREFERENCES}/bulk`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: preferencesWithTenantId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '希望シフト一括登録に失敗しました')
      }

      return result
    } catch (error) {
      console.error('希望シフト一括登録エラー:', error)
      throw new Error(`希望シフト一括登録エラー: ${error.message}`)
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
   * @param {string} status - 新しいステータス (DRAFT/APPROVED)
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

  /**
   * 前月のシフトをコピーして新しいシフト計画を作成
   * @param {Object} data - リクエストデータ
   * @param {number} data.store_id - 店舗ID
   * @param {number} data.target_year - ターゲット年
   * @param {number} data.target_month - ターゲット月
   * @param {number} data.created_by - 作成者ID
   * @param {number} data.tenantId - テナントID (オプション)
   * @returns {Promise<Object>} 作成されたシフト計画データ
   */
  async copyFromPreviousMonth(data) {
    try {
      const { store_id, target_year, target_month, created_by, tenantId = null } = data

      const actualTenantId = tenantId ?? getCurrentTenantId()

      const url = `${BACKEND_API_URL}/api/shifts/plans/copy-from-previous`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: actualTenantId,
          store_id,
          target_year,
          target_month,
          created_by,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '前月からのコピーに失敗しました')
      }

      return result
    } catch (error) {
      console.error('前月からのコピーエラー:', error)
      throw new Error(`前月からのコピーエラー: ${error.message}`)
    }
  }

  /**
   * 全店舗一括で最新プランからシフトをコピーして新しいシフト計画を作成
   * @param {Object} data - リクエストデータ
   * @param {number} data.target_year - ターゲット年
   * @param {number} data.target_month - ターゲット月
   * @param {number} data.created_by - 作成者ID
   * @param {number} data.tenantId - テナントID (オプション)
   * @returns {Promise<Object>} 作成されたシフト計画データ
   */
  async copyFromPreviousAllStores(data) {
    try {
      const { target_year, target_month, created_by, tenantId = null } = data

      const actualTenantId = tenantId ?? getCurrentTenantId()

      const url = `${BACKEND_API_URL}/api/shifts/plans/copy-from-previous-all-stores`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: actualTenantId,
          target_year,
          target_month,
          created_by,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '全店舗一括コピーに失敗しました')
      }

      return result
    } catch (error) {
      console.error('全店舗一括コピーエラー:', error)
      throw new Error(`全店舗一括コピーエラー: ${error.message}`)
    }
  }

  /**
   * 全店舗の前月データを取得（DB書き込みなし）
   * @param {Object} data - リクエストデータ
   * @param {number} data.target_year - ターゲット年
   * @param {number} data.target_month - ターゲット月
   * @param {number} data.tenantId - テナントID (オプション)
   * @returns {Promise<Object>} 各店舗のシフトデータ
   */
  async fetchPreviousDataAllStores(data) {
    try {
      const { target_year, target_month, tenantId = null } = data

      const actualTenantId = tenantId ?? getCurrentTenantId()

      const url = `${BACKEND_API_URL}/api/shifts/plans/fetch-previous-data-all-stores`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: actualTenantId,
          target_year,
          target_month,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '前月データ取得に失敗しました')
      }

      return result
    } catch (error) {
      console.error('前月データ取得エラー:', error)
      throw new Error(`前月データ取得エラー: ${error.message}`)
    }
  }

  /**
   * プランとシフトを一括作成（メモリ上のデータをDBに保存）
   * @param {Object} data - リクエストデータ
   * @param {number} data.target_year - ターゲット年
   * @param {number} data.target_month - ターゲット月
   * @param {number} data.created_by - 作成者ID
   * @param {Array} data.stores - 各店舗のシフトデータ
   * @param {number} data.tenantId - テナントID (オプション)
   * @returns {Promise<Object>} 作成結果
   */
  async createPlansWithShifts(data) {
    try {
      const { target_year, target_month, created_by, stores, tenantId = null, plan_type } = data

      if (!plan_type) {
        throw new Error('plan_type is required')
      }

      const actualTenantId = tenantId ?? getCurrentTenantId()

      const url = `${BACKEND_API_URL}/api/shifts/plans/create-with-shifts`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: actualTenantId,
          target_year,
          target_month,
          created_by,
          stores,
          plan_type,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'プラン作成に失敗しました')
      }

      return result
    } catch (error) {
      console.error('プラン作成エラー:', error)
      throw new Error(`プラン作成エラー: ${error.message}`)
    }
  }

  /**
   * 月次コメント一覧取得
   * @param {Object} filters - フィルタリング条件
   * @param {number} filters.tenantId - テナントID
   * @param {number} filters.year - 年 (required)
   * @param {number} filters.month - 月 (required)
   * @param {number} filters.storeId - 店舗ID (オプション)
   * @returns {Promise<Array>} コメントデータ配列
   */
  async getMonthlyComments(filters = {}) {
    try {
      const { tenantId = null, year, month, storeId } = filters

      const actualTenantId = tenantId ?? getCurrentTenantId()

      if (!year || !month) {
        throw new Error('Year and month parameters are required')
      }

      const params = new URLSearchParams({
        tenant_id: actualTenantId,
        year,
        month,
      })
      if (storeId) params.append('store_id', storeId)

      const url = `${BACKEND_API_URL}/api/shifts/monthly-comments?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '月次コメント取得に失敗しました')
      }

      return result.data
    } catch (error) {
      console.error('月次コメント取得エラー:', error)
      // コメント取得失敗時は空配列を返す（既存機能に影響を与えない）
      return []
    }
  }
}
