/**
 * マスターデータリポジトリ（インフラ層）
 * データベースから各種マスターデータを取得
 */
import { BACKEND_API_URL, API_ENDPOINTS } from '../../config/api'
import { getCurrentTenantId } from '../../config/tenant'

export class MasterRepository {
  /**
   * テナントID（デフォルト値）
   * @deprecated 代わりに getCurrentTenantId() を使用してください
   */
  static DEFAULT_TENANT_ID = 1

  /**
   * スタッフマスタを取得
   */
  async getStaff(tenantId = null, storeId = null) {
    // tenantIdが指定されていない場合は、現在のテナントIDを使用
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const params = new URLSearchParams({ tenant_id: actualTenantId })
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
   * スタッフを作成
   */
  async createStaff(data) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_STAFF}`, {
        method: 'POST',
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
        throw new Error(result.error || 'スタッフ作成に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`スタッフ作成エラー: ${error.message}`)
    }
  }

  /**
   * スタッフを更新
   */
  async updateStaff(staffId, data) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_STAFF}/${staffId}`, {
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
        throw new Error(result.error || 'スタッフ更新に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`スタッフ更新エラー: ${error.message}`)
    }
  }

  /**
   * スタッフを削除（論理削除）
   */
  async deleteStaff(staffId) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_STAFF}/${staffId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'スタッフ削除に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`スタッフ削除エラー: ${error.message}`)
    }
  }

  /**
   * 役職マスタを取得
   */
  async getRoles(tenantId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_ROLES}?tenant_id=${actualTenantId}`
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
  async getSkills(tenantId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_SKILLS}?tenant_id=${actualTenantId}`
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
  async getStores(tenantId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_STORES}?tenant_id=${actualTenantId}`
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
   * 店舗を作成
   */
  async createStore(data) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_STORES}`, {
        method: 'POST',
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
        throw new Error(result.error || '店舗作成に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`店舗作成エラー: ${error.message}`)
    }
  }

  /**
   * 店舗を更新
   */
  async updateStore(storeId, data) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_STORES}/${storeId}`, {
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
        throw new Error(result.error || '店舗更新に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`店舗更新エラー: ${error.message}`)
    }
  }

  /**
   * 店舗を削除（論理削除）
   */
  async deleteStore(storeId) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_STORES}/${storeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '店舗削除に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`店舗削除エラー: ${error.message}`)
    }
  }

  /**
   * シフトパターンマスタを取得
   */
  async getShiftPatterns(tenantId = null, storeId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const params = new URLSearchParams({ tenant_id: actualTenantId })
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
  async getCommuteAllowance(tenantId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_COMMUTE_ALLOWANCE}?tenant_id=${actualTenantId}`
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
  async getInsuranceRates(tenantId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_INSURANCE_RATES}?tenant_id=${actualTenantId}`
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
  async getTaxBrackets(tenantId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_TAX_BRACKETS}?tenant_id=${actualTenantId}`
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
  async getStaffSkills(tenantId = null, staffId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const params = new URLSearchParams({ tenant_id: actualTenantId })
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
  async getStaffCertifications(tenantId = null, staffId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const params = new URLSearchParams({ tenant_id: actualTenantId })
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
  async getLaborLawConstraints(tenantId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_LABOR_LAW_CONSTRAINTS}?tenant_id=${actualTenantId}`
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
  async getStoreConstraints(tenantId = null, storeId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const params = new URLSearchParams({ tenant_id: actualTenantId })
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
  async getEmploymentTypes(tenantId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_EMPLOYMENT_TYPES}?tenant_id=${actualTenantId}`
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
  async getLaborManagementRules(tenantId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_LABOR_MANAGEMENT_RULES}?tenant_id=${actualTenantId}`
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
  async getShiftValidationRules(tenantId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_SHIFT_VALIDATION_RULES}?tenant_id=${actualTenantId}`
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

  /**
   * ===================
   * CRUD メソッド - 役職マスター
   * ===================
   */

  /**
   * 役職を作成
   */
  async createRole(data) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_ROLES}`, {
        method: 'POST',
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
        throw new Error(result.error || '役職作成に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`役職作成エラー: ${error.message}`)
    }
  }

  /**
   * 役職を更新
   */
  async updateRole(roleId, data) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_ROLES}/${roleId}`, {
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
        throw new Error(result.error || '役職更新に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`役職更新エラー: ${error.message}`)
    }
  }

  /**
   * 役職を削除（論理削除）
   */
  async deleteRole(roleId) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_ROLES}/${roleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '役職削除に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`役職削除エラー: ${error.message}`)
    }
  }

  /**
   * ===================
   * CRUD メソッド - スキルマスター
   * ===================
   */

  /**
   * スキルを作成
   */
  async createSkill(data) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_SKILLS}`, {
        method: 'POST',
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
        throw new Error(result.error || 'スキル作成に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`スキル作成エラー: ${error.message}`)
    }
  }

  /**
   * スキルを更新
   */
  async updateSkill(skillId, data) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_SKILLS}/${skillId}`, {
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
        throw new Error(result.error || 'スキル更新に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`スキル更新エラー: ${error.message}`)
    }
  }

  /**
   * スキルを削除（論理削除）
   */
  async deleteSkill(skillId) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_SKILLS}/${skillId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'スキル削除に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`スキル削除エラー: ${error.message}`)
    }
  }

  /**
   * ===================
   * CRUD メソッド - 雇用形態マスター
   * ===================
   */

  /**
   * 雇用形態を作成
   */
  async createEmploymentType(data) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_EMPLOYMENT_TYPES}`, {
        method: 'POST',
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
        throw new Error(result.error || '雇用形態作成に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`雇用形態作成エラー: ${error.message}`)
    }
  }

  /**
   * 雇用形態を更新
   */
  async updateEmploymentType(employmentTypeId, data) {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_EMPLOYMENT_TYPES}/${employmentTypeId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '雇用形態更新に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`雇用形態更新エラー: ${error.message}`)
    }
  }

  /**
   * 雇用形態を削除（論理削除）
   */
  async deleteEmploymentType(employmentTypeId) {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_EMPLOYMENT_TYPES}/${employmentTypeId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '雇用形態削除に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`雇用形態削除エラー: ${error.message}`)
    }
  }

  /**
   * ===================
   * CRUD メソッド - シフトパターンマスター
   * ===================
   */

  /**
   * シフトパターンを作成
   */
  async createShiftPattern(data) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_SHIFT_PATTERNS}`, {
        method: 'POST',
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
        throw new Error(result.error || 'シフトパターン作成に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`シフトパターン作成エラー: ${error.message}`)
    }
  }

  /**
   * シフトパターンを更新
   */
  async updateShiftPattern(patternId, data) {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_SHIFT_PATTERNS}/${patternId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'シフトパターン更新に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`シフトパターン更新エラー: ${error.message}`)
    }
  }

  /**
   * シフトパターンを削除（論理削除）
   */
  async deleteShiftPattern(patternId) {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_SHIFT_PATTERNS}/${patternId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'シフトパターン削除に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`シフトパターン削除エラー: ${error.message}`)
    }
  }

  // ======================
  // Divisions Master CRUD
  // ======================

  async getDivisions(tenantId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_DIVISIONS}?tenant_id=${actualTenantId}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '部署マスタ取得に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`部署マスタ取得エラー: ${error.message}`)
    }
  }

  async createDivision(data) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_DIVISIONS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to create division: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '部署作成に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`部署作成エラー: ${error.message}`)
    }
  }

  async updateDivision(divisionId, data) {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_DIVISIONS}/${divisionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to update division: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '部署更新に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`部署更新エラー: ${error.message}`)
    }
  }

  async deleteDivision(divisionId) {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_DIVISIONS}/${divisionId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to delete division: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '部署削除に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`部署削除エラー: ${error.message}`)
    }
  }

  // ===========================
  // Commute Allowance Master CRUD
  // ===========================

  async getCommuteAllowances(tenantId = null) {
    const actualTenantId = tenantId ?? getCurrentTenantId()
    try {
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_COMMUTE_ALLOWANCE}?tenant_id=${actualTenantId}`
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

  async createCommuteAllowance(data) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.MASTER_COMMUTE_ALLOWANCE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to create commute allowance: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '通勤手当作成に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`通勤手当作成エラー: ${error.message}`)
    }
  }

  async updateCommuteAllowance(allowanceId, data) {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_COMMUTE_ALLOWANCE}/${allowanceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to update commute allowance: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '通勤手当更新に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`通勤手当更新エラー: ${error.message}`)
    }
  }

  async deleteCommuteAllowance(allowanceId) {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}${API_ENDPOINTS.MASTER_COMMUTE_ALLOWANCE}/${allowanceId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to delete commute allowance: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '通勤手当削除に失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`通勤手当削除エラー: ${error.message}`)
    }
  }
}
