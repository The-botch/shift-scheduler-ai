/**
 * スタッフエンティティ
 */
export class Staff {
  constructor({
    staffId,
    name,
    hourlyWage,
    maxHoursPerWeek,
    employmentType,
    birthDate,
    availableShifts = [],
  }) {
    this.staffId = staffId
    this.name = name
    this.hourlyWage = hourlyWage
    this.maxHoursPerWeek = maxHoursPerWeek
    this.employmentType = employmentType
    this.birthDate = birthDate
    this.availableShifts = availableShifts
  }

  /**
   * 年齢を計算
   */
  getAge(baseDate = new Date()) {
    const birth = new Date(this.birthDate)
    let age = baseDate.getFullYear() - birth.getFullYear()
    const monthDiff = baseDate.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && baseDate.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  /**
   * 未成年かどうか
   */
  isMinor(baseDate = new Date()) {
    return this.getAge(baseDate) < 18
  }

  /**
   * 指定シフトが利用可能か
   */
  isAvailableForShift(shiftType) {
    return this.availableShifts.includes(shiftType)
  }
}
