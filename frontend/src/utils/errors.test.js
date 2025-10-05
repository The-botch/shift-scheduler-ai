import { describe, it, expect } from 'vitest'
import {
  AppError,
  ValidationError,
  APIError,
  NotFoundError,
  handleError,
} from './errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('正しくエラーを作成する', () => {
      const error = new AppError('Test error')
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('APP_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe('AppError')
    })

    it('カスタムコードとステータスコードを設定できる', () => {
      const error = new AppError('Custom error', 'CUSTOM_CODE', 400)
      expect(error.code).toBe('CUSTOM_CODE')
      expect(error.statusCode).toBe(400)
    })
  })

  describe('ValidationError', () => {
    it('正しくバリデーションエラーを作成する', () => {
      const error = new ValidationError('Invalid input', { field: 'email' })
      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('Invalid input')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual({ field: 'email' })
    })
  })

  describe('APIError', () => {
    it('正しくAPIエラーを作成する', () => {
      const error = new APIError('API failed', 503)
      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('API failed')
      expect(error.code).toBe('API_ERROR')
      expect(error.statusCode).toBe(503)
    })
  })

  describe('NotFoundError', () => {
    it('正しく404エラーを作成する', () => {
      const error = new NotFoundError('User')
      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('User not found')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.statusCode).toBe(404)
    })

    it('デフォルトリソース名を使用する', () => {
      const error = new NotFoundError()
      expect(error.message).toBe('Resource not found')
    })
  })
})

describe('handleError', () => {
  it('エラー情報を正しく構造化する', () => {
    const error = new AppError('Test error', 'TEST_CODE', 500)
    const errorInfo = handleError(error, 'test-context')

    expect(errorInfo).toHaveProperty('timestamp')
    expect(errorInfo.context).toBe('test-context')
    expect(errorInfo.name).toBe('AppError')
    expect(errorInfo.message).toBe('Test error')
    expect(errorInfo.code).toBe('TEST_CODE')
    expect(errorInfo).toHaveProperty('stack')
  })

  it('通常のエラーも処理できる', () => {
    const error = new Error('Standard error')
    const errorInfo = handleError(error)

    expect(errorInfo.name).toBe('Error')
    expect(errorInfo.message).toBe('Standard error')
    expect(errorInfo.code).toBe('UNKNOWN_ERROR')
  })
})
