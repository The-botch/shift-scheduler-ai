/**
 * シフトエンティティ
 */
export class Shift {
  constructor({
    shiftId,
    staffId,
    staffName,
    storeId,
    shiftDate,
    startTime,
    endTime,
    breakMinutes = 0,
    totalHours = 0,
  }) {
    this.shiftId = shiftId
    this.staffId = staffId
    this.staffName = staffName
    this.storeId = storeId
    this.shiftDate = shiftDate
    this.startTime = startTime
    this.endTime = endTime
    this.breakMinutes = breakMinutes
    this.totalHours = totalHours
  }

  /**
   * 夜間シフトかどうか
   */
  isNightShift() {
    const startHour = parseInt(this.startTime.split(':')[0])
    const endHour = parseInt(this.endTime.split(':')[0])
    return startHour >= 22 || endHour <= 5
  }

  /**
   * 労働時間を計算
   */
  calculateWorkHours() {
    const start = this.parseTime(this.startTime)
    const end = this.parseTime(this.endTime)
    const totalMinutes = end - start - this.breakMinutes
    return (totalMinutes / 60).toFixed(2)
  }

  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }
}
