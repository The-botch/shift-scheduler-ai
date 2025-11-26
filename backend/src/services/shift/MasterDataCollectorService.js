import { query } from '../../config/database.js'

/**
 * マスターデータ収集サービス
 * シフト生成に必要な全データをDBから取得
 */
class MasterDataCollectorService {
  /**
   * シフト生成に必要な全マスターデータを収集
   * @param {number} tenantId - テナントID
   * @param {number} storeId - 店舗ID
   * @param {number} year - 対象年
   * @param {number} month - 対象月
   * @returns {Promise<Object>} マスターデータオブジェクト
   */
  async collectMasterData(tenantId, storeId, year, month) {
    const [
      staff,
      shiftPatterns,
      laborLawConstraints,
      storeConstraints,
      validationRules,
      storeInfo
    ] = await Promise.all([
      this.getStaff(tenantId, storeId),
      this.getShiftPatterns(tenantId, storeId),
      this.getLaborLawConstraints(tenantId),
      this.getStoreConstraints(tenantId, storeId),
      this.getValidationRules(tenantId),
      this.getStoreInfo(tenantId, storeId)
    ])

    const daysInMonth = new Date(year, month, 0).getDate()

    return {
      staff,
      shiftPatterns,
      constraints: {
        labor: laborLawConstraints,
        store: storeConstraints,
        validation: validationRules
      },
      storeInfo,
      period: {
        year,
        month,
        daysInMonth
      }
    }
  }

  /**
   * スタッフ情報取得
   */
  async getStaff(tenantId, storeId) {
    const result = await query(`
      SELECT
        s.staff_id,
        s.staff_code,
        s.name,
        s.employment_type,
        s.hourly_rate,
        s.monthly_salary,
        r.role_name,
        r.role_code
      FROM hr.staff s
      LEFT JOIN core.roles r ON s.role_id = r.role_id
      WHERE s.tenant_id = $1
        AND s.store_id = $2
        AND s.is_active = TRUE
      ORDER BY s.staff_id
    `, [tenantId, storeId])

    return result.rows
  }

  /**
   * シフトパターン取得
   */
  async getShiftPatterns(tenantId, storeId) {
    const result = await query(`
      SELECT
        pattern_id,
        pattern_code,
        pattern_name,
        start_time,
        end_time,
        break_minutes
      FROM core.shift_patterns
      WHERE tenant_id = $1
        AND (store_id IS NULL OR store_id = $2)
        AND is_active = TRUE
      ORDER BY pattern_id
    `, [tenantId, storeId])

    return result.rows
  }

  /**
   * 労働法制約取得
   */
  async getLaborLawConstraints(tenantId) {
    const result = await query(`
      SELECT
        constraint_id,
        constraint_code,
        constraint_name,
        category,
        value,
        unit,
        constraint_rule,
        penalty_level,
        description
      FROM ops.labor_law_constraints
      WHERE tenant_id = $1
        AND is_active = TRUE
      ORDER BY constraint_id
    `, [tenantId])

    return result.rows
  }

  /**
   * 店舗制約取得
   */
  async getStoreConstraints(tenantId, storeId) {
    const result = await query(`
      SELECT
        store_constraint_id,
        constraint_type,
        constraint_value,
        description,
        priority
      FROM ops.store_constraints
      WHERE tenant_id = $1
        AND store_id = $2
        AND is_active = TRUE
      ORDER BY priority DESC
    `, [tenantId, storeId])

    return result.rows
  }

  /**
   * シフト検証ルール取得
   */
  async getValidationRules(tenantId) {
    const result = await query(`
      SELECT
        rule_id,
        rule_code,
        rule_name,
        check_category,
        validation_rule,
        description,
        severity
      FROM ops.shift_validation_rules
      WHERE tenant_id = $1
        AND is_active = TRUE
      ORDER BY severity DESC
    `, [tenantId])

    return result.rows
  }

  /**
   * 店舗情報取得
   */
  async getStoreInfo(tenantId, storeId) {
    const result = await query(`
      SELECT
        store_id,
        store_code,
        store_name,
        business_hours_start,
        business_hours_end
      FROM core.stores
      WHERE tenant_id = $1
        AND store_id = $2
        AND is_active = TRUE
    `, [tenantId, storeId])

    return result.rows[0] || null
  }
}

export default MasterDataCollectorService
