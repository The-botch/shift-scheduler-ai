/**
 * AI応答パースサービス
 * OpenAI APIの応答をパースして検証
 */
class ResponseParserService {
  /**
   * AI応答をパースして検証
   * @param {string} aiResponse - OpenAI APIの応答 (JSON文字列)
   * @param {Object} masterData - マスターデータ (検証用)
   * @returns {Promise<Object>} { shifts: [...], errors: [...] }
   */
  async parseAndValidate(aiResponse, masterData) {
    console.log('[ResponseParser] AI応答のパース開始')

    const errors = []
    let parsedData = null

    // 1. JSON パース
    try {
      parsedData = JSON.parse(aiResponse)
    } catch (error) {
      console.error('[ResponseParser] JSONパースエラー:', error.message)
      throw new Error(`AI応答のパースに失敗しました: ${error.message}`)
    }

    // 2. 必須フィールド確認
    if (!parsedData.shifts || !Array.isArray(parsedData.shifts)) {
      throw new Error('AI応答に shifts 配列が含まれていません')
    }

    console.log(`[ResponseParser] ${parsedData.shifts.length}件のシフトをパース中...`)

    // 3. 各シフトの検証と正規化
    const validatedShifts = []
    const { staff, shiftPatterns, period } = masterData

    for (let i = 0; i < parsedData.shifts.length; i++) {
      const shift = parsedData.shifts[i]
      const validation = this.validateShift(shift, i, { staff, shiftPatterns, period })

      if (validation.isValid) {
        validatedShifts.push(validation.normalizedShift)
      } else {
        errors.push(...validation.errors)
      }
    }

    console.log('[ResponseParser] パース完了:', {
      total: parsedData.shifts.length,
      valid: validatedShifts.length,
      errors: errors.length
    })

    // 4. エラーが多すぎる場合は失敗扱い
    if (errors.length > parsedData.shifts.length * 0.5) {
      throw new Error(`AI応答の品質が低すぎます: ${errors.length}件のエラー`)
    }

    return {
      shifts: validatedShifts,
      errors
    }
  }

  /**
   * 個別シフトの検証
   * @param {Object} shift - シフトデータ
   * @param {number} index - インデックス
   * @param {Object} context - 検証コンテキスト
   * @returns {Object} { isValid, normalizedShift, errors }
   */
  validateShift(shift, index, context) {
    const errors = []
    const { staff, shiftPatterns, period } = context

    // 必須フィールドチェック
    const requiredFields = ['staff_id', 'shift_date', 'pattern_id', 'start_time', 'end_time', 'break_minutes']
    for (const field of requiredFields) {
      if (shift[field] === undefined || shift[field] === null) {
        errors.push({
          index,
          field,
          message: `必須フィールド ${field} が欠落しています`,
          shift
        })
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors }
    }

    // staff_id 検証
    const staffExists = staff.some(s => s.staff_id === shift.staff_id)
    if (!staffExists) {
      errors.push({
        index,
        field: 'staff_id',
        message: `無効なstaff_id: ${shift.staff_id}`,
        shift
      })
    }

    // pattern_id 検証
    const patternExists = shiftPatterns.some(p => p.pattern_id === shift.pattern_id)
    if (!patternExists) {
      errors.push({
        index,
        field: 'pattern_id',
        message: `無効なpattern_id: ${shift.pattern_id}`,
        shift
      })
    }

    // shift_date 検証
    const dateValidation = this.validateDate(shift.shift_date, period)
    if (!dateValidation.isValid) {
      errors.push({
        index,
        field: 'shift_date',
        message: dateValidation.error,
        shift
      })
    }

    // 時刻フォーマット検証
    if (!this.isValidTime(shift.start_time)) {
      errors.push({
        index,
        field: 'start_time',
        message: `無効な時刻フォーマット: ${shift.start_time}`,
        shift
      })
    }

    if (!this.isValidTime(shift.end_time)) {
      errors.push({
        index,
        field: 'end_time',
        message: `無効な時刻フォーマット: ${shift.end_time}`,
        shift
      })
    }

    // break_minutes 検証
    if (typeof shift.break_minutes !== 'number' || shift.break_minutes < 0) {
      errors.push({
        index,
        field: 'break_minutes',
        message: `無効な休憩時間: ${shift.break_minutes}`,
        shift
      })
    }

    if (errors.length > 0) {
      return { isValid: false, errors }
    }

    // 正規化されたシフトデータ
    const normalizedShift = {
      staff_id: Number(shift.staff_id),
      shift_date: shift.shift_date,
      pattern_id: Number(shift.pattern_id),
      start_time: shift.start_time,
      end_time: shift.end_time,
      break_minutes: Number(shift.break_minutes)
    }

    return {
      isValid: true,
      normalizedShift,
      errors: []
    }
  }

  /**
   * 日付検証
   * @param {string} dateStr - YYYY-MM-DD形式の日付
   * @param {Object} period - { year, month, daysInMonth }
   * @returns {Object} { isValid, error }
   */
  validateDate(dateStr, period) {
    // フォーマット検証
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateStr)) {
      return {
        isValid: false,
        error: `無効な日付フォーマット: ${dateStr}`
      }
    }

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        error: `無効な日付: ${dateStr}`
      }
    }

    // 期間内チェック
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    if (year !== period.year || month !== period.month) {
      return {
        isValid: false,
        error: `日付が対象期間外です: ${dateStr} (対象: ${period.year}年${period.month}月)`
      }
    }

    return { isValid: true }
  }

  /**
   * 時刻フォーマット検証
   * @param {string} timeStr - HH:MM:SS形式の時刻
   * @returns {boolean}
   */
  isValidTime(timeStr) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/
    return timeRegex.test(timeStr)
  }
}

export default ResponseParserService
