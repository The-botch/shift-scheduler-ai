import Papa from 'papaparse'
import { createError, createWarning } from '../config/validationMessages.js'

/**
 * シフトバリデーションエンジン
 * CSVから読み込んだ制約ルールに基づいてシフトをバリデーションする
 */

/**
 * 制約ルールをCSVから読み込む
 * @param {string} csvPath - CSVファイルのパス
 * @returns {Promise<Array>} パースされた制約ルールの配列
 */
export const loadConstraintRules = async csvPath => {
  try {
    const response = await fetch(csvPath)
    const csvText = await response.text()

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: result => {
          if (result.errors.length > 0) {
            reject(new Error(`CSV parse error: ${result.errors[0].message}`))
          } else {
            resolve(result.data)
          }
        },
        error: error => {
          reject(error)
        },
      })
    })
  } catch (error) {
    throw new Error(`Failed to load constraint rules: ${error.message}`)
  }
}

/**
 * 複数のCSVから制約ルールを統合して読み込む
 * @returns {Promise<Object>} 全制約ルール
 */
export const loadAllConstraintRules = async () => {
  try {
    const [validationRules, laborLawRules, managementRules] = await Promise.all([
      loadConstraintRules('/data/master/shift_validation_rules.csv'),
      loadConstraintRules('/data/master/labor_law_constraints.csv'),
      loadConstraintRules('/data/master/labor_management_rules.csv'),
    ])

    return {
      validationRules: validationRules.filter(r => r.check_level === 'ERROR'),
      laborLawRules: laborLawRules.filter(r => r.penalty_level === 'critical'),
      managementRules: managementRules.filter(r => r.priority === 'HIGH'),
    }
  } catch (error) {
    throw new Error(`Failed to load all constraint rules: ${error.message}`)
  }
}

/**
 * スタッフマスタを読み込む
 * @returns {Promise<Array>} スタッフデータ配列
 */
export const loadStaffMaster = async () => {
  return loadConstraintRules('/data/master/staff.csv')
}

/**
 * 年齢を計算
 * @param {string} birthDate - 生年月日 (YYYY-MM-DD)
 * @param {string} targetDate - 基準日 (YYYY-MM-DD)
 * @returns {number} 年齢
 */
export const calculateAge = (birthDate, targetDate = new Date().toISOString().split('T')[0]) => {
  const birth = new Date(birthDate)
  const target = new Date(targetDate)
  let age = target.getFullYear() - birth.getFullYear()
  const monthDiff = target.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birth.getDate())) {
    age--
  }

  return age
}

/**
 * 時間文字列から時刻を取得
 * @param {string} date - 日付 (YYYY-MM-DD)
 * @param {string} time - 時刻 (HH:MM)
 * @returns {Date} 日時オブジェクト
 */
export const parseDateTime = (date, time) => {
  return new Date(`${date}T${time}:00`)
}

/**
 * 深夜時間帯(22:00-5:00)をチェック
 * @param {string} startTime - 開始時刻 (HH:MM)
 * @param {string} endTime - 終了時刻 (HH:MM)
 * @returns {boolean} 深夜時間帯を含むか
 */
export const isNightShift = (startTime, endTime) => {
  const start = parseInt(startTime.split(':')[0])
  const end = parseInt(endTime.split(':')[0])

  // 22時以降に開始、または5時より前に終了
  return start >= 22 || end <= 5 || (start < 22 && end > 22)
}

/**
 * シフトバリデーションクラス
 */
export class ShiftValidator {
  constructor(staffMaster, constraintRules) {
    this.staffMaster = staffMaster
    this.constraintRules = constraintRules
    this.errors = []
    this.warnings = []
  }

  /**
   * スタッフ情報を取得
   * @param {string|number} staffId - スタッフID
   * @returns {Object|null} スタッフ情報
   */
  getStaffInfo(staffId) {
    return this.staffMaster.find(s => s.staff_id == staffId) || null
  }

  /**
   * バリデーション結果をクリア
   */
  clearResults() {
    this.errors = []
    this.warnings = []
  }

  /**
   * エラーを追加
   * @param {Object} error - エラー情報
   */
  addError(error) {
    this.errors.push(error)
  }

  /**
   * 警告を追加
   * @param {Object} warning - 警告情報
   */
  addWarning(warning) {
    this.warnings.push(warning)
  }

  /**
   * シフトデータ全体をバリデーション
   * @param {Array} shifts - シフトデータ配列
   * @returns {Object} バリデーション結果
   */
  async validateShifts(shifts) {
    this.clearResults()

    // 各シフトに対して個別チェック
    for (const shift of shifts) {
      await this.validateSingleShift(shift, shifts)
    }

    // スタッフごとの集計チェック
    await this.validateStaffAggregates(shifts)

    return this.getValidationResult()
  }

  /**
   * 単一シフトをバリデーション
   * @param {Object} shift - シフトデータ
   * @param {Array} allShifts - 全シフトデータ
   */
  async validateSingleShift(shift, allShifts) {
    const staff = this.getStaffInfo(shift.staff_id)
    if (!staff) {
      const error = createError(
        'STAFF_NOT_FOUND',
        { shift_id: shift.shift_id },
        { staffId: shift.staff_id }
      )
      this.addError(error)
      return
    }

    // VAL001: 18歳未満の深夜勤務チェック
    this.checkMinorNightShift(shift, staff)

    // VAL003: 休憩時間確保チェック
    this.checkBreakTime(shift, staff)

    // VAL004: 勤務間インターバルチェック
    this.checkWorkInterval(shift, staff, allShifts)

    // LAW_007: 年少者の労働時間チェック
    this.checkMinorWorkingHours(shift, staff)
  }

  /**
   * スタッフごとの集計チェック
   * @param {Array} shifts - シフトデータ配列
   */
  async validateStaffAggregates(shifts) {
    // スタッフごとにグループ化
    const staffShifts = {}
    shifts.forEach(shift => {
      if (!staffShifts[shift.staff_id]) {
        staffShifts[shift.staff_id] = []
      }
      staffShifts[shift.staff_id].push(shift)
    })

    // 各スタッフの集計チェック
    for (const [staffId, staffShiftList] of Object.entries(staffShifts)) {
      const staff = this.getStaffInfo(staffId)
      if (!staff) continue

      // 連続勤務日数チェック
      this.checkConsecutiveDays(staffId, staff, staffShiftList)

      // 週間労働時間チェック
      this.checkWeeklyHours(staffId, staff, staffShiftList)

      // 月間労働時間チェック
      this.checkMonthlyHours(staffId, staff, staffShiftList)
    }
  }

  /**
   * VAL001: 18歳未満の深夜勤務チェック
   */
  checkMinorNightShift(shift, staff) {
    const age = calculateAge(staff.birth_date, shift.shift_date)
    if (age < 18 && isNightShift(shift.start_time, shift.end_time)) {
      const error = createError(
        'VAL001',
        {
          shift_id: shift.shift_id,
          staff_id: shift.staff_id,
          shift_date: shift.shift_date,
        },
        {
          staffName: staff.name,
        }
      )
      this.addError(error)
    }
  }

  /**
   * VAL003/LAW_003/LAW_004: 休憩時間確保チェック
   */
  checkBreakTime(shift, _staff) {
    const workHours = parseFloat(shift.total_hours || 0)
    const breakMinutes = parseInt(shift.break_minutes || 0)

    const context = {
      shift_id: shift.shift_id,
      staff_id: shift.staff_id,
      shift_date: shift.shift_date,
    }

    if (workHours > 8 && breakMinutes < 60) {
      const error = createError('VAL003', context, {
        workHours: 8,
        requiredBreak: 60,
        actualBreak: breakMinutes,
      })
      this.addError(error)
    } else if (workHours > 6 && breakMinutes < 45) {
      const error = createError('VAL003', context, {
        workHours: 6,
        requiredBreak: 45,
        actualBreak: breakMinutes,
      })
      this.addError(error)
    }
  }

  /**
   * VAL004/LAW_006: 勤務間インターバルチェック
   */
  checkWorkInterval(shift, staff, allShifts) {
    // 同じスタッフの前日のシフトを探す
    const shiftDate = new Date(shift.shift_date)
    const prevDate = new Date(shiftDate)
    prevDate.setDate(prevDate.getDate() - 1)
    const prevDateStr = prevDate.toISOString().split('T')[0]

    const prevShift = allShifts.find(
      s => s.staff_id == shift.staff_id && s.shift_date === prevDateStr
    )

    if (prevShift) {
      const prevEnd = parseDateTime(prevShift.shift_date, prevShift.end_time)
      const currentStart = parseDateTime(shift.shift_date, shift.start_time)

      // 時間差を計算（ミリ秒 → 時間）
      const intervalHours = (currentStart - prevEnd) / (1000 * 60 * 60)

      if (intervalHours < 11) {
        const warning = createWarning(
          'VAL004',
          {
            shift_id: shift.shift_id,
            staff_id: shift.staff_id,
            shift_date: shift.shift_date,
          },
          {
            intervalHours: intervalHours.toFixed(1),
          }
        )
        this.addWarning(warning)
      }
    }
  }

  /**
   * LAW_007: 年少者の労働時間チェック
   */
  checkMinorWorkingHours(shift, staff) {
    const age = calculateAge(staff.birth_date, shift.shift_date)
    const workHours = parseFloat(shift.total_hours || 0)

    if (age < 18 && workHours > 8) {
      const error = createError(
        'LAW_007',
        {
          shift_id: shift.shift_id,
          staff_id: shift.staff_id,
          shift_date: shift.shift_date,
        },
        {
          staffName: staff.name,
          hours: workHours,
        }
      )
      this.addError(error)
    }
  }

  /**
   * LM005/LAW_010: 連続勤務日数チェック
   */
  checkConsecutiveDays(staffId, staff, shifts) {
    // 日付でソート
    const sortedShifts = [...shifts].sort((a, b) => new Date(a.shift_date) - new Date(b.shift_date))

    let consecutiveDays = 1
    let maxConsecutiveDays = 1
    // let consecutiveStartDate = sortedShifts[0]?.shift_date // 将来の実装用に保持

    for (let i = 1; i < sortedShifts.length; i++) {
      const prevDate = new Date(sortedShifts[i - 1].shift_date)
      const currentDate = new Date(sortedShifts[i].shift_date)
      const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24)

      if (dayDiff === 1) {
        consecutiveDays++
        maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays)
      } else {
        consecutiveDays = 1
        // consecutiveStartDate = sortedShifts[i].shift_date // 将来の実装用に保持
      }
    }

    const maxAllowed = parseInt(staff.max_consecutive_days || 6)
    const context = { staff_id: staffId }

    if (maxConsecutiveDays > 12) {
      const error = createError('LM005', context, {
        consecutiveDays: maxConsecutiveDays,
      })
      this.addError(error)
    } else if (maxConsecutiveDays > maxAllowed) {
      const warning = createWarning('LM004', context, {
        consecutiveDays: maxConsecutiveDays,
        recommendedMax: maxAllowed,
      })
      this.addWarning(warning)
    }
  }

  /**
   * LAW_001/LAW_002: 週間労働時間チェック
   */
  checkWeeklyHours(staffId, staff, shifts) {
    // 週ごとにグループ化
    const weeklyHours = {}

    shifts.forEach(shift => {
      const date = new Date(shift.shift_date)
      // 週の開始を月曜日とする
      const weekStart = new Date(date)
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      weekStart.setDate(diff)
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!weeklyHours[weekKey]) {
        weeklyHours[weekKey] = 0
      }
      weeklyHours[weekKey] += parseFloat(shift.total_hours || 0)
    })

    const maxWeeklyHours = parseFloat(staff.max_hours_per_week || 40)

    for (const [weekStart, hours] of Object.entries(weeklyHours)) {
      if (hours > maxWeeklyHours) {
        const error = createError(
          'LAW_002',
          {
            staff_id: staffId,
            week_start: weekStart,
          },
          {
            hours: hours.toFixed(1),
            maxHours: maxWeeklyHours,
          }
        )
        this.addError(error)
      }
    }
  }

  /**
   * LAW_011/LAW_012: 月間労働時間チェック
   */
  checkMonthlyHours(staffId, staff, shifts) {
    // 月ごとにグループ化
    const monthlyHours = {}

    shifts.forEach(shift => {
      const monthKey = shift.shift_date.substring(0, 7) // YYYY-MM
      if (!monthlyHours[monthKey]) {
        monthlyHours[monthKey] = {
          totalHours: 0,
          baseHours: parseFloat(staff.max_hours_per_week || 40) * 4, // 週40h × 4週
        }
      }
      monthlyHours[monthKey].totalHours += parseFloat(shift.total_hours || 0)
    })

    for (const [month, data] of Object.entries(monthlyHours)) {
      const overtimeHours = data.totalHours - data.baseHours

      if (overtimeHours > 45) {
        const error = createError(
          'LAW_011',
          {
            staff_id: staffId,
            month: month,
          },
          {
            overtimeHours: overtimeHours.toFixed(1),
          }
        )
        this.addError(error)
      }
    }
  }

  /**
   * バリデーション結果を取得
   * @returns {Object} バリデーション結果
   */
  getValidationResult() {
    return {
      isValid: this.errors.length === 0,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        total_issues: this.errors.length + this.warnings.length,
        critical_issues: this.errors.length,
        warnings: this.warnings.length,
      },
    }
  }

  /**
   * バリデーション結果をコンソールに出力
   */
  printResults() {
    console.log('=== シフトバリデーション結果 ===')
    console.log(`エラー: ${this.errors.length}件`)
    console.log(`警告: ${this.warnings.length}件`)

    if (this.errors.length > 0) {
      console.log('\n【エラー】')
      this.errors.forEach((err, index) => {
        console.log(`${index + 1}. [${err.rule_id}] ${err.message}`)
      })
    }

    if (this.warnings.length > 0) {
      console.log('\n【警告】')
      this.warnings.forEach((warn, index) => {
        console.log(`${index + 1}. [${warn.rule_id}] ${warn.message}`)
      })
    }
  }
}

/**
 * シフトバリデーションを実行する便利関数
 * @param {Array} shifts - バリデーション対象のシフトデータ
 * @returns {Promise<Object>} バリデーション結果
 */
export const validateShifts = async shifts => {
  try {
    const [staffMaster, constraintRules] = await Promise.all([
      loadStaffMaster(),
      loadAllConstraintRules(),
    ])

    const validator = new ShiftValidator(staffMaster, constraintRules)
    const result = await validator.validateShifts(shifts)

    return result
  } catch (error) {
    throw new Error(`Validation failed: ${error.message}`)
  }
}
