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

    // 5. 休憩時間チェック (LAW_003/004: 6時間超で45分、8時間超で60分)
    const breakTimeViolations = this.checkBreakTime(shifts, masterData)
    violations.push(...breakTimeViolations)

    // 6. 勤務間インターバルチェック (LAW_006: 11時間)
    const intervalViolations = this.checkShiftInterval(shifts, masterData)
    violations.push(...intervalViolations)

    // 7. 月の時間外労働上限チェック (LAW_011: 45時間)
    const monthlyOvertimeViolations = this.checkMonthlyOvertime(shifts, masterData)
    violations.push(...monthlyOvertimeViolations)

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

  /**
   * 休憩時間チェック (LAW_003/004)
   * 6時間超で45分、8時間超で60分
   */
  checkBreakTime(shifts, masterData) {
    const violations = []
    const { staff } = masterData

    for (const shift of shifts) {
      const staffInfo = staff.find(s => s.staff_id === shift.staff_id)
      const workMinutes = this.timeToMinutes(shift.end_time) - this.timeToMinutes(shift.start_time)
      const workHours = workMinutes / 60
      const breakMinutes = shift.break_minutes || 0

      // 8時間超の場合、60分の休憩が必要
      if (workHours > 8) {
        if (breakMinutes < 60) {
          violations.push({
            level: 'ERROR',
            category: 'break_time',
            staff_id: shift.staff_id,
            staff_name: staffInfo?.name || '不明',
            date: shift.shift_date,
            work_hours: workHours.toFixed(1),
            break_minutes: breakMinutes,
            required_break: 60,
            message: `${staffInfo?.name}の${shift.shift_date}のシフトは${workHours.toFixed(1)}時間勤務ですが、休憩時間が${breakMinutes}分しかありません（60分必要）`
          })
        }
      }
      // 6時間超8時間以下の場合、45分の休憩が必要
      else if (workHours > 6) {
        if (breakMinutes < 45) {
          violations.push({
            level: 'ERROR',
            category: 'break_time',
            staff_id: shift.staff_id,
            staff_name: staffInfo?.name || '不明',
            date: shift.shift_date,
            work_hours: workHours.toFixed(1),
            break_minutes: breakMinutes,
            required_break: 45,
            message: `${staffInfo?.name}の${shift.shift_date}のシフトは${workHours.toFixed(1)}時間勤務ですが、休憩時間が${breakMinutes}分しかありません（45分必要）`
          })
        }
      }
    }

    return violations
  }

  /**
   * 勤務間インターバルチェック (LAW_006)
   * 前日終業〜翌日始業の間隔が11時間必要
   */
  checkShiftInterval(shifts, masterData) {
    const violations = []
    const { staff } = masterData

    const staffShifts = this.groupByStaff(shifts)

    for (const [staffId, staffShiftList] of Object.entries(staffShifts)) {
      const staffInfo = staff.find(s => s.staff_id === Number(staffId))

      // 日付でソート
      const sortedShifts = staffShiftList.sort((a, b) =>
        new Date(a.shift_date) - new Date(b.shift_date)
      )

      for (let i = 1; i < sortedShifts.length; i++) {
        const prevShift = sortedShifts[i - 1]
        const currShift = sortedShifts[i]

        const prevDate = new Date(prevShift.shift_date)
        const currDate = new Date(currShift.shift_date)
        const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24)

        // 連続する日付の場合のみチェック
        if (diffDays === 1) {
          // 前日の終業時刻
          const prevEndMinutes = this.timeToMinutes(prevShift.end_time)
          // 翌日の始業時刻
          const currStartMinutes = this.timeToMinutes(currShift.start_time)

          // 24時間 = 1440分として、インターバルを計算
          const intervalMinutes = (1440 - prevEndMinutes) + currStartMinutes
          const intervalHours = intervalMinutes / 60

          if (intervalHours < 11) {
            violations.push({
              level: 'ERROR',
              category: 'shift_interval',
              staff_id: Number(staffId),
              staff_name: staffInfo?.name || '不明',
              prev_date: prevShift.shift_date,
              prev_end: prevShift.end_time,
              curr_date: currShift.shift_date,
              curr_start: currShift.start_time,
              interval_hours: intervalHours.toFixed(1),
              required_interval: 11,
              message: `${staffInfo?.name}の${prevShift.shift_date} ${prevShift.end_time}終業〜${currShift.shift_date} ${currShift.start_time}始業の勤務間インターバルが${intervalHours.toFixed(1)}時間で、11時間未満です`
            })
          } else if (intervalHours < 12) {
            violations.push({
              level: 'WARNING',
              category: 'shift_interval',
              staff_id: Number(staffId),
              staff_name: staffInfo?.name || '不明',
              prev_date: prevShift.shift_date,
              prev_end: prevShift.end_time,
              curr_date: currShift.shift_date,
              curr_start: currShift.start_time,
              interval_hours: intervalHours.toFixed(1),
              required_interval: 11,
              message: `${staffInfo?.name}の${prevShift.shift_date} ${prevShift.end_time}終業〜${currShift.shift_date} ${currShift.start_time}始業の勤務間インターバルが${intervalHours.toFixed(1)}時間で、余裕がありません`
            })
          }
        }
      }
    }

    return violations
  }

  /**
   * 月の時間外労働上限チェック (LAW_011)
   * 正社員の場合、月の総労働時間から173時間を超えた分が時間外労働
   * 時間外労働は月45時間まで
   */
  checkMonthlyOvertime(shifts, masterData) {
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

      // 月の基本労働時間173時間を超えた分が時間外
      const overtimeHours = Math.max(0, totalHours - 173)

      if (overtimeHours > 45) {
        violations.push({
          level: 'ERROR',
          category: 'monthly_overtime',
          staff_id: Number(staffId),
          staff_name: staffInfo?.name || '不明',
          total_hours: totalHours.toFixed(1),
          overtime_hours: overtimeHours.toFixed(1),
          limit: 45,
          message: `${staffInfo?.name}の月の時間外労働が${overtimeHours.toFixed(1)}時間で、上限45時間を超えています（総労働時間${totalHours.toFixed(1)}時間）`
        })
      } else if (overtimeHours > 40) {
        violations.push({
          level: 'WARNING',
          category: 'monthly_overtime',
          staff_id: Number(staffId),
          staff_name: staffInfo?.name || '不明',
          total_hours: totalHours.toFixed(1),
          overtime_hours: overtimeHours.toFixed(1),
          limit: 45,
          message: `${staffInfo?.name}の月の時間外労働が${overtimeHours.toFixed(1)}時間で、上限45時間に近づいています（総労働時間${totalHours.toFixed(1)}時間）`
        })
      }
    }

    return violations
  }
}

export default ConstraintValidationService
