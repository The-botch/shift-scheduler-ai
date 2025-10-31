/**
 * マスターデータリポジトリ（インフラ層）
 * データベースから各種マスターデータを取得
 */
import { BACKEND_API_URL, API_ENDPOINTS } from '../../config/api'

export class MasterRepository {
  /**
   * テナントID（デフォルト値）
   */
  static DEFAULT_TENANT_ID = 1

  /**
   * スタッフマスタを取得
   */
  async getStaff(tenantId = MasterRepository.DEFAULT_TENANT_ID, storeId = null) {
    try {
      const params = new URLSearchParams({ tenant_id: tenantId })
      if (storeId) params.append('store_id', storeId)

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_STAFF}?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'スタッフマスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`スタッフマスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * 役職マスタを取得
   */
  async getRoles(tenantId = MasterRepository.DEFAULT_TENANT_ID) {
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_ROLES}?tenant_id=${tenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '役職マスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`役職マスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * スキルマスタを取得
   */
  async getSkills(tenantId = MasterRepository.DEFAULT_TENANT_ID) {
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_SKILLS}?tenant_id=${tenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'スキルマスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`スキルマスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * 店舗マスタを取得
   */
  async getStores(tenantId = MasterRepository.DEFAULT_TENANT_ID) {
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_STORES}?tenant_id=${tenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '店舗マスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`店舗マスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * シフトパターンマスタを取得
   */
  async getShiftPatterns(tenantId = MasterRepository.DEFAULT_TENANT_ID, storeId = null) {
    try {
      const params = new URLSearchParams({ tenant_id: tenantId })
      if (storeId) params.append('store_id', storeId)

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_SHIFT_PATTERNS}?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'シフトパターンマスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`シフトパターンマスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * 通勤手当マスタを取得
   */
  async getCommuteAllowance(tenantId = MasterRepository.DEFAULT_TENANT_ID) {
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_COMMUTE_ALLOWANCE}?tenant_id=${tenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '通勤手当マスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`通勤手当マスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * 保険料率マスタを取得
   */
  async getInsuranceRates(tenantId = MasterRepository.DEFAULT_TENANT_ID) {
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_INSURANCE_RATES}?tenant_id=${tenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '保険料率マスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`保険料率マスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * 税額区分マスタを取得
   */
  async getTaxBrackets(tenantId = MasterRepository.DEFAULT_TENANT_ID) {
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_TAX_BRACKETS}?tenant_id=${tenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '税額区分マスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`税額区分マスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * スタッフスキルマスタを取得
   */
  async getStaffSkills(tenantId = MasterRepository.DEFAULT_TENANT_ID, staffId = null) {
    try {
      const params = new URLSearchParams({ tenant_id: tenantId })
      if (staffId) params.append('staff_id', staffId)

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_STAFF_SKILLS}?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'スタッフスキルマスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`スタッフスキルマスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * スタッフ資格マスタを取得
   */
  async getStaffCertifications(tenantId = MasterRepository.DEFAULT_TENANT_ID, staffId = null) {
    try {
      const params = new URLSearchParams({ tenant_id: tenantId })
      if (staffId) params.append('staff_id', staffId)

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_STAFF_CERTIFICATIONS}?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'スタッフ資格マスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`スタッフ資格マスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * 労働法制約マスタを取得
   */
  async getLaborLawConstraints(tenantId = MasterRepository.DEFAULT_TENANT_ID) {
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_LABOR_LAW_CONSTRAINTS}?tenant_id=${tenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '労働法制約マスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`労働法制約マスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * 店舗制約マスタを取得
   */
  async getStoreConstraints(tenantId = MasterRepository.DEFAULT_TENANT_ID, storeId = null) {
    try {
      const params = new URLSearchParams({ tenant_id: tenantId })
      if (storeId) params.append('store_id', storeId)

      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_STORE_CONSTRAINTS}?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '店舗制約マスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`店舗制約マスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * 雇用形態マスタを取得
   */
  async getEmploymentTypes(tenantId = MasterRepository.DEFAULT_TENANT_ID) {
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_EMPLOYMENT_TYPES}?tenant_id=${tenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '雇用形態マスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`雇用形態マスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * 労務管理ルールマスタを取得
   */
  async getLaborManagementRules(tenantId = MasterRepository.DEFAULT_TENANT_ID) {
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_LABOR_MANAGEMENT_RULES}?tenant_id=${tenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '労務管理ルールマスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`労務管理ルールマスタ取得エラー: ${error.message}`)
    }
  }

  /**
   * シフト検証ルールマスタを取得
   */
  async getShiftValidationRules(tenantId = MasterRepository.DEFAULT_TENANT_ID) {
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_SHIFT_VALIDATION_RULES}?tenant_id=${tenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'シフト検証ルールマスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`シフト検証ルールマスタ取得エラー: ${error.message}`)
    }
  }
}
