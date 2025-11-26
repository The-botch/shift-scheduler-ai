import { describe, it, expect } from 'vitest'
import {
  formatDate,
  generateTimestamp,
  getCurrentYearMonth,
  getDaysInMonth,
  isoToJSTDateString,
  isoToJSTDateParts,
} from './dateUtils'

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

  describe('isoToJSTDateString', () => {
    it('UTC 15:00をJSTの翌日に変換する', () => {
      // UTC 15:00 = JST 翌日00:00
      const result = isoToJSTDateString('2025-12-05T15:00:00.000Z')
      expect(result).toBe('2025-12-06')
    })

    it('UTC 00:00をJSTの同日に変換する', () => {
      // UTC 00:00 = JST 09:00 (同日)
      const result = isoToJSTDateString('2025-12-06T00:00:00.000Z')
      expect(result).toBe('2025-12-06')
    })

    it('UTC 14:59をJSTの同日に変換する', () => {
      // UTC 14:59 = JST 23:59 (同日)
      const result = isoToJSTDateString('2025-12-05T14:59:00.000Z')
      expect(result).toBe('2025-12-05')
    })

    it('nullの場合は空文字を返す', () => {
      expect(isoToJSTDateString(null)).toBe('')
    })

    it('undefinedの場合は空文字を返す', () => {
      expect(isoToJSTDateString(undefined)).toBe('')
    })

    it('空文字の場合は空文字を返す', () => {
      expect(isoToJSTDateString('')).toBe('')
    })

    it('無効な日付文字列の場合は空文字を返す', () => {
      expect(isoToJSTDateString('invalid-date')).toBe('')
    })

    it('split(T)[0]より正しい日付を返す', () => {
      const isoString = '2025-12-05T15:00:00.000Z'
      // 間違った方法 (UTC)
      const wrongResult = isoString.split('T')[0]
      expect(wrongResult).toBe('2025-12-05') // UTC日付
      // 正しい方法 (JST)
      const correctResult = isoToJSTDateString(isoString)
      expect(correctResult).toBe('2025-12-06') // JST日付
    })
  })

  describe('isoToJSTDateParts', () => {
    it('UTC 15:00をJSTの翌日のパーツに変換する', () => {
      const result = isoToJSTDateParts('2025-12-05T15:00:00.000Z')
      expect(result).toEqual({ year: 2025, month: 12, day: 6 })
    })

    it('UTC 00:00をJSTの同日のパーツに変換する', () => {
      const result = isoToJSTDateParts('2025-12-06T00:00:00.000Z')
      expect(result).toEqual({ year: 2025, month: 12, day: 6 })
    })

    it('年をまたぐ場合も正しく変換する（12/31 UTC 15:00 = 1/1 JST）', () => {
      const result = isoToJSTDateParts('2025-12-31T15:00:00.000Z')
      expect(result).toEqual({ year: 2026, month: 1, day: 1 })
    })

    it('nullの場合は0を返す', () => {
      expect(isoToJSTDateParts(null)).toEqual({ year: 0, month: 0, day: 0 })
    })

    it('undefinedの場合は0を返す', () => {
      expect(isoToJSTDateParts(undefined)).toEqual({ year: 0, month: 0, day: 0 })
    })

    it('無効な日付の場合は0を返す', () => {
      expect(isoToJSTDateParts('invalid')).toEqual({ year: 0, month: 0, day: 0 })
    })
  })
})
