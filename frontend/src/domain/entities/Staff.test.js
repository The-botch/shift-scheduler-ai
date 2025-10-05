import { describe, it, expect } from 'vitest'
import { Staff } from './Staff'

describe('Staff Entity', () => {
  describe('getAge', () => {
    it('正しく年齢を計算する', () => {
      const staff = new Staff({
        staffId: 1,
        name: 'テスト太郎',
        hourlyWage: 1000,
        maxHoursPerWeek: 40,
        employmentType: 'パート',
        birthDate: '2000-01-01',
      })

      const baseDate = new Date('2023-06-15')
      expect(staff.getAge(baseDate)).toBe(23)
    })

    it('誕生日前の年齢を正しく計算する', () => {
      const staff = new Staff({
        staffId: 1,
        name: 'テスト太郎',
        hourlyWage: 1000,
        maxHoursPerWeek: 40,
        employmentType: 'パート',
        birthDate: '2000-12-31',
      })

      const baseDate = new Date('2023-06-15')
      expect(staff.getAge(baseDate)).toBe(22)
    })
  })

  describe('isMinor', () => {
    it('未成年を正しく判定する', () => {
      const minor = new Staff({
        staffId: 1,
        name: '未成年',
        hourlyWage: 900,
        maxHoursPerWeek: 28,
        employmentType: 'パート',
        birthDate: '2010-01-01',
      })

      const baseDate = new Date('2023-06-15')
      expect(minor.isMinor(baseDate)).toBe(true)
    })

    it('成人を正しく判定する', () => {
      const adult = new Staff({
        staffId: 2,
        name: '成人',
        hourlyWage: 1000,
        maxHoursPerWeek: 40,
        employmentType: 'パート',
        birthDate: '2000-01-01',
      })

      const baseDate = new Date('2023-06-15')
      expect(adult.isMinor(baseDate)).toBe(false)
    })
  })

  describe('isAvailableForShift', () => {
    it('利用可能なシフトを正しく判定する', () => {
      const staff = new Staff({
        staffId: 1,
        name: 'テスト太郎',
        hourlyWage: 1000,
        maxHoursPerWeek: 40,
        employmentType: 'パート',
        birthDate: '2000-01-01',
        availableShifts: ['morning', 'afternoon'],
      })

      expect(staff.isAvailableForShift('morning')).toBe(true)
      expect(staff.isAvailableForShift('night')).toBe(false)
    })
  })
})
