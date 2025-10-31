/**
 * Analytics データリポジトリ（インフラ層）
 * 給与・売上・ダッシュボード指標データをバックエンドAPIから取得
 */
import { BACKEND_API_URL } from '../../config/api'

export class AnalyticsRepository {
  /**
   * テナントID（デフォルト値）
   */
  static DEFAULT_TENANT_ID = 1

  /**
   * 給与計算データを取得
   * @param {Object} params - クエリパラメータ
   * @param {number} params.tenantId - テナントID
   * @param {number} [params.storeId] - 店舗ID（オプション）
   * @param {number} [params.staffId] - スタッフID（オプション）
   * @param {number} [params.year] - 年（オプション）
   * @param {number} [params.month] - 月（オプション）
   */
  async getPayroll(params = {}) {
    try {
      const {
        tenantId = AnalyticsRepository.DEFAULT_TENANT_ID,
        storeId,
        staffId,
        year,
        month,
      } = params

      const queryParams = new URLSearchParams({ tenant_id: tenantId })
      if (storeId) queryParams.append('store_id', storeId)
      if (staffId) queryParams.append('staff_id', staffId)
      if (year) queryParams.append('year', year)
      if (month) queryParams.append('month', month)

      const url = `${BACKEND_API_URL}/api/analytics/payroll?${queryParams}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '給与データ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`給与データ取得エラー: ${error.message}`)
    }
  }

  /**
   * 売上実績データを取得
   * @param {Object} params - クエリパラメータ
   * @param {number} params.tenantId - テナントID
   * @param {number} [params.storeId] - 店舗ID（オプション）
   * @param {number} [params.year] - 年（オプション）
   * @param {number} [params.month] - 月（オプション）
   */
  async getSalesActual(params = {}) {
    try {
      const {
        tenantId = AnalyticsRepository.DEFAULT_TENANT_ID,
        storeId,
        year,
        month,
      } = params

      const queryParams = new URLSearchParams({ tenant_id: tenantId })
      if (storeId) queryParams.append('store_id', storeId)
      if (year) queryParams.append('year', year)
      if (month) queryParams.append('month', month)

      const url = `${BACKEND_API_URL}/api/analytics/sales-actual?${queryParams}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '売上実績データ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`売上実績データ取得エラー: ${error.message}`)
    }
  }

  /**
   * 売上予測データを取得
   * @param {Object} params - クエリパラメータ
   * @param {number} params.tenantId - テナントID
   * @param {number} [params.storeId] - 店舗ID（オプション）
   * @param {number} [params.year] - 年（オプション）
   * @param {number} [params.month] - 月（オプション）
   */
  async getSalesForecast(params = {}) {
    try {
      const {
        tenantId = AnalyticsRepository.DEFAULT_TENANT_ID,
        storeId,
        year,
        month,
      } = params

      const queryParams = new URLSearchParams({ tenant_id: tenantId })
      if (storeId) queryParams.append('store_id', storeId)
      if (year) queryParams.append('year', year)
      if (month) queryParams.append('month', month)

      const url = `${BACKEND_API_URL}/api/analytics/sales-forecast?${queryParams}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '売上予測データ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`売上予測データ取得エラー: ${error.message}`)
    }
  }

  /**
   * ダッシュボード指標を取得
   * @param {Object} params - クエリパラメータ
   * @param {number} params.tenantId - テナントID
   * @param {string} [params.metricName] - 指標名（オプション）
   * @param {string} [params.status] - ステータス（オプション）
   */
  async getDashboardMetrics(params = {}) {
    try {
      const {
        tenantId = AnalyticsRepository.DEFAULT_TENANT_ID,
        metricName,
        status,
      } = params

      const queryParams = new URLSearchParams({ tenant_id: tenantId })
      if (metricName) queryParams.append('metric_name', metricName)
      if (status) queryParams.append('status', status)

      const url = `${BACKEND_API_URL}/api/analytics/dashboard-metrics?${queryParams}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'ダッシュボード指標取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`ダッシュボード指標取得エラー: ${error.message}`)
    }
  }

  /**
   * スタッフの給与履歴を取得
   * @param {number} staffId - スタッフID
   * @param {number} [year] - 年（オプション）
   */
  async getStaffPayrollHistory(staffId, year = null) {
    const params = { staffId }
    if (year) params.year = year
    return this.getPayroll(params)
  }

  /**
   * 年次給与集計を取得
   * @param {number} year - 年
   */
  async getAnnualPayroll(year) {
    return this.getPayroll({ year })
  }

  /**
   * 年次売上実績を取得
   * @param {number} year - 年
   */
  async getAnnualSalesActual(year) {
    return this.getSalesActual({ year })
  }

  /**
   * 年次売上予測を取得
   * @param {number} year - 年
   */
  async getAnnualSalesForecast(year) {
    return this.getSalesForecast({ year })
  }
}
