import { describe, it, expect } from 'vitest'
import { formatDate, generateTimestamp, getCurrentYearMonth, getDaysInMonth } from './dateUtils'

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('日付を正しくフォーマットする', () => {
      const date = new Date('2023-06-15T12:00:00')
      expect(formatDate(date)).toBe('2023-06-15')
    })

    it('1桁の月日をゼロパディングする', () => {
      const date = new Date('2023-01-05T12:00:00')
      expect(formatDate(date)).toBe('2023-01-05')
    })
  })

  describe('generateTimestamp', () => {
    it('タイムスタンプを正しく生成する', () => {
      const date = new Date('2023-06-15T14:30:45')
      const timestamp = generateTimestamp(date)
      expect(timestamp).toBe('20230615_143045')
    })

    it('1桁の値をゼロパディングする', () => {
      const date = new Date('2023-01-05T09:08:07')
      const timestamp = generateTimestamp(date)
      expect(timestamp).toBe('20230105_090807')
    })
  })

  describe('getCurrentYearMonth', () => {
    it('現在の年月を正しく取得する', () => {
      const result = getCurrentYearMonth()
      expect(result).toHaveProperty('year')
      expect(result).toHaveProperty('month')
      expect(typeof result.year).toBe('number')
      expect(typeof result.month).toBe('number')
      expect(result.month).toBeGreaterThanOrEqual(1)
      expect(result.month).toBeLessThanOrEqual(12)
    })
  })

  describe('getDaysInMonth', () => {
    it('通常月の日数を正しく取得する', () => {
      expect(getDaysInMonth(2023, 6)).toBe(30)
      expect(getDaysInMonth(2023, 7)).toBe(31)
    })

    it('2月の日数を正しく取得する（平年）', () => {
      expect(getDaysInMonth(2023, 2)).toBe(28)
    })

    it('2月の日数を正しく取得する（うるう年）', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29)
    })
  })
})
