import { describe, it, expect } from 'vitest'
import { Shift } from './Shift'

describe('Shift Entity', () => {
  describe('isNightShift', () => {
    it('夜勤シフトを正しく判定する（22時開始）', () => {
      const shift = new Shift({
        shiftId: 1,
        shiftType: 'night',
        date: '2023-06-15',
        startTime: '22:00',
        endTime: '06:00',
        breakMinutes: 60,
        requiredStaff: 2,
      })

      expect(shift.isNightShift()).toBe(true)
    })

    it('夜勤シフトを正しく判定する（早朝終了）', () => {
      const shift = new Shift({
        shiftId: 2,
        shiftType: 'night',
        date: '2023-06-15',
        startTime: '00:00',
        endTime: '05:00',
        breakMinutes: 30,
        requiredStaff: 1,
      })

      expect(shift.isNightShift()).toBe(true)
    })

    it('日勤シフトを正しく判定する', () => {
      const shift = new Shift({
        shiftId: 3,
        shiftType: 'morning',
        date: '2023-06-15',
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
        requiredStaff: 3,
      })

      expect(shift.isNightShift()).toBe(false)
    })
  })

  describe('calculateWorkHours', () => {
    it('休憩を考慮して正しく勤務時間を計算する', () => {
      const shift = new Shift({
        shiftId: 1,
        shiftType: 'morning',
        date: '2023-06-15',
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
        requiredStaff: 3,
      })

      expect(shift.calculateWorkHours()).toBe('8.00')
    })

    it('夜勤の勤務時間を正しく計算する', () => {
      const shift = new Shift({
        shiftId: 2,
        shiftType: 'night',
        date: '2023-06-15',
        startTime: '22:00',
        endTime: '06:00',
        breakMinutes: 60,
        requiredStaff: 2,
      })

      expect(shift.calculateWorkHours()).toBe('7.00')
    })

    it('短時間シフトの勤務時間を正しく計算する', () => {
      const shift = new Shift({
        shiftId: 3,
        shiftType: 'afternoon',
        date: '2023-06-15',
        startTime: '14:00',
        endTime: '18:00',
        breakMinutes: 0,
        requiredStaff: 1,
      })

      expect(shift.calculateWorkHours()).toBe('4.00')
    })
  })
})
