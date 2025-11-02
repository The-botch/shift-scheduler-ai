/**
 * 制約検証サービス
 * 労働法制約、店舗制約の違反をチェック
 */
class ConstraintValidationService {
  /**
   * シフト全体を検証
   * @param {Array} shifts - パース済みシフトデータ
   * @param {Object} masterData - マスターデータ
   * @returns {Promise<Object>} { violations: [...], summary: {...} }
   */
  async validateShifts(shifts, masterData) {
    console.log('[ConstraintValidator] 制約検証開始')

    const violations = []

    // 1. 週の労働時間チェック (労働基準法: 40時間/週)
    const weeklyHoursViolations = this.checkWeeklyHours(shifts, masterData)
    violations.push(...weeklyHoursViolations)

    // 2. 連続勤務日数チェック (労働基準法: 最大6日)
    const consecutiveDaysViolations = this.checkConsecutiveDays(shifts, masterData)
    violations.push(...consecutiveDaysViolations)

    // 3. 営業時間カバレッジチェック (店舗制約: 最低2名以上)
    const coverageViolations = this.checkCoverage(shifts, masterData)
    violations.push(...coverageViolations)

    // 4. 月の労働時間チェック (正社員: 173時間/月以内)
    const monthlyHoursViolations = this.checkMonthlyHours(shifts, masterData)
    violations.push(...monthlyHoursViolations)

    // サマリー作成
    const summary = this.createSummary(violations)

    console.log('[ConstraintValidator] 検証完了:', summary)

    return {
      violations,
      summary
    }
  }

  /**
   * 週の労働時間チェック
   */
  checkWeeklyHours(shifts, masterData) {
    const violations = []
    const { staff } = masterData

    // スタッフごとに集計
    const staffShifts = this.groupByStaff(shifts)

    for (const [staffId, staffShiftList] of Object.entries(staffShifts)) {
      const staffInfo = staff.find(s => s.staff_id === Number(staffId))

      // 週ごとに集計
      const weeklyHours = this.calculateWeeklyHours(staffShiftList)

      for (const [weekKey, hours] of Object.entries(weeklyHours)) {
        if (hours > 40) {
          violations.push({
            level: 'ERROR',
            category: 'weekly_hours',
            staff_id: Number(staffId),
            staff_name: staffInfo?.name || '不明',
            week: weekKey,
            actual_hours: hours,
            limit: 40,
            message: `${staffInfo?.name}の週の労働時間が${hours}時間で、法定上限40時間を超えています (${weekKey})`
          })
        } else if (hours > 36) {
          violations.push({
            level: 'WARNING',
            category: 'weekly_hours',
            staff_id: Number(staffId),
            staff_name: staffInfo?.name || '不明',
            week: weekKey,
            actual_hours: hours,
            limit: 40,
            message: `${staffInfo?.name}の週の労働時間が${hours}時間で、上限40時間に近づいています (${weekKey})`
          })
        }
      }
    }

    return violations
  }

  /**
   * 連続勤務日数チェック
   */
  checkConsecutiveDays(shifts, masterData) {
    const violations = []
    const { staff } = masterData

    const staffShifts = this.groupByStaff(shifts)

    for (const [staffId, staffShiftList] of Object.entries(staffShifts)) {
      const staffInfo = staff.find(s => s.staff_id === Number(staffId))

      // 日付でソート
      const sortedDates = staffShiftList
        .map(s => s.shift_date)
        .sort()

      let consecutiveCount = 1
      let consecutiveStart = sortedDates[0]

      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1])
        const currDate = new Date(sortedDates[i])
        const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24)

        if (diffDays === 1) {
          consecutiveCount++

          if (consecutiveCount > 6) {
            violations.push({
              level: 'ERROR',
              category: 'consecutive_days',
              staff_id: Number(staffId),
              staff_name: staffInfo?.name || '不明',
              consecutive_days: consecutiveCount,
              limit: 6,
              start_date: consecutiveStart,
              end_date: sortedDates[i],
              message: `${staffInfo?.name}が${consecutiveCount}日連続勤務しています (${consecutiveStart} 〜 ${sortedDates[i]})`
            })
          } else if (consecutiveCount === 6) {
            violations.push({
              level: 'WARNING',
              category: 'consecutive_days',
              staff_id: Number(staffId),
              staff_name: staffInfo?.name || '不明',
              consecutive_days: consecutiveCount,
              limit: 6,
              start_date: consecutiveStart,
              end_date: sortedDates[i],
              message: `${staffInfo?.name}が6日連続勤務の上限に達しています (${consecutiveStart} 〜 ${sortedDates[i]})`
            })
          }
        } else {
          consecutiveCount = 1
          consecutiveStart = sortedDates[i]
        }
      }
    }

    return violations
  }

  /**
   * 営業時間カバレッジチェック
   */
  checkCoverage(shifts, masterData) {
    const violations = []
    const { storeInfo } = masterData

    if (!storeInfo?.business_hours_start || !storeInfo?.business_hours_end) {
      return violations
    }

    // 日付ごとに集計
    const dateShifts = this.groupByDate(shifts)

    for (const [date, dateShiftList] of Object.entries(dateShifts)) {
      // 営業時間を1時間刻みでチェック
      const businessStart = this.timeToMinutes(storeInfo.business_hours_start)
      const businessEnd = this.timeToMinutes(storeInfo.business_hours_end)

      for (let hour = businessStart; hour < businessEnd; hour += 60) {
        const staffCount = dateShiftList.filter(shift => {
          const shiftStart = this.timeToMinutes(shift.start_time)
          const shiftEnd = this.timeToMinutes(shift.end_time)
          return shiftStart <= hour && hour < shiftEnd
        }).length

        if (staffCount < 2) {
          const hourStr = this.minutesToTime(hour)
          violations.push({
            level: staffCount === 0 ? 'ERROR' : 'WARNING',
            category: 'coverage',
            date,
            hour: hourStr,
            staff_count: staffCount,
            minimum: 2,
            message: `${date} ${hourStr}時点で勤務スタッフが${staffCount}名しかいません (最低2名必要)`
          })
        }
      }
    }

    return violations
  }

  /**
   * 月の労働時間チェック (正社員のみ)
   */
  checkMonthlyHours(shifts, masterData) {
    const violations = []
    const { staff } = masterData

    const staffShifts = this.groupByStaff(shifts)

    for (const [staffId, staffShiftList] of Object.entries(staffShifts)) {
      const staffInfo = staff.find(s => s.staff_id === Number(staffId))

      // 正社員のみチェック
      if (staffInfo?.employment_type !== '正社員') {
        continue
      }

      const totalHours = staffShiftList.reduce((sum, shift) => {
        const hours = this.calculateShiftHours(shift)
        return sum + hours
      }, 0)

      if (totalHours > 173) {
        violations.push({
          level: 'ERROR',
          category: 'monthly_hours',
          staff_id: Number(staffId),
          staff_name: staffInfo?.name || '不明',
          actual_hours: totalHours,
          limit: 173,
          message: `${staffInfo?.name}の月の労働時間が${totalHours}時間で、上限173時間を超えています`
        })
      } else if (totalHours > 160) {
        violations.push({
          level: 'WARNING',
          category: 'monthly_hours',
          staff_id: Number(staffId),
          staff_name: staffInfo?.name || '不明',
          actual_hours: totalHours,
          limit: 173,
          message: `${staffInfo?.name}の月の労働時間が${totalHours}時間で、上限173時間に近づいています`
        })
      }
    }

    return violations
  }

  /**
   * スタッフごとにシフトをグループ化
   */
  groupByStaff(shifts) {
    return shifts.reduce((acc, shift) => {
      const key = shift.staff_id
      if (!acc[key]) acc[key] = []
      acc[key].push(shift)
      return acc
    }, {})
  }

  /**
   * 日付ごとにシフトをグループ化
   */
  groupByDate(shifts) {
    return shifts.reduce((acc, shift) => {
      const key = shift.shift_date
      if (!acc[key]) acc[key] = []
      acc[key].push(shift)
      return acc
    }, {})
  }

  /**
   * 週ごとの労働時間を計算
   */
  calculateWeeklyHours(shifts) {
    const weeklyHours = {}

    for (const shift of shifts) {
      const date = new Date(shift.shift_date)
      const weekKey = this.getWeekKey(date)
      const hours = this.calculateShiftHours(shift)

      if (!weeklyHours[weekKey]) {
        weeklyHours[weekKey] = 0
      }
      weeklyHours[weekKey] += hours
    }

    return weeklyHours
  }

  /**
   * シフトの実労働時間を計算
   */
  calculateShiftHours(shift) {
    const start = this.timeToMinutes(shift.start_time)
    const end = this.timeToMinutes(shift.end_time)
    const totalMinutes = end - start - shift.break_minutes
    return totalMinutes / 60
  }

  /**
   * 時刻文字列を分に変換 (HH:MM:SS -> 分)
   */
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * 分を時刻文字列に変換 (分 -> HH:MM)
   */
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60)
    return `${String(hours).padStart(2, '0')}:00`
  }

  /**
   * 週のキーを取得 (YYYY-Www形式、週は日曜日始まり)
   */
  getWeekKey(date) {
    const year = date.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const dayOfWeek = date.getDay()
    const daysSinceStartOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24))
    const weekNumber = Math.floor((daysSinceStartOfYear + startOfYear.getDay()) / 7) + 1

    return `${year}-W${String(weekNumber).padStart(2, '0')}`
  }

  /**
   * サマリー作成
   */
  createSummary(violations) {
    const errorCount = violations.filter(v => v.level === 'ERROR').length
    const warningCount = violations.filter(v => v.level === 'WARNING').length
    const infoCount = violations.filter(v => v.level === 'INFO').length

    return {
      total: violations.length,
      error: errorCount,
      warning: warningCount,
      info: infoCount,
      is_valid: errorCount === 0,
      categories: this.summarizeByCategory(violations)
    }
  }

  /**
   * カテゴリ別サマリー
   */
  summarizeByCategory(violations) {
    const categories = {}

    for (const violation of violations) {
      const cat = violation.category
      if (!categories[cat]) {
        categories[cat] = { error: 0, warning: 0, info: 0 }
      }
      categories[cat][violation.level.toLowerCase()]++
    }

    return categories
  }
}

export default ConstraintValidationService
