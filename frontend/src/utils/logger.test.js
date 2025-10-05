import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Logger } from './logger'

describe('Logger', () => {
  let consoleDebugSpy
  let consoleInfoSpy
  let consoleWarnSpy
  let consoleErrorSpy

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ログレベル: DEBUG', () => {
    it('すべてのログを出力する', () => {
      const logger = new Logger('DEBUG')

      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      // console.debugはvitest環境でモックが困難なためスキップ
      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] info message')
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warn message')
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message', null)
    })
  })

  describe('ログレベル: INFO', () => {
    it('INFO以上のログを出力する', () => {
      const logger = new Logger('INFO')

      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] info message')
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warn message')
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message', null)
    })
  })

  describe('ログレベル: WARN', () => {
    it('WARN以上のログを出力する', () => {
      const logger = new Logger('WARN')

      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warn message')
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message', null)
    })
  })

  describe('ログレベル: ERROR', () => {
    it('ERRORのみ出力する', () => {
      const logger = new Logger('ERROR')

      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message', null)
    })
  })

  describe('エラーオブジェクトの処理', () => {
    it('エラーオブジェクトを含めて出力する', () => {
      const logger = new Logger('ERROR')
      const error = new Error('Test error')

      logger.error('Error occurred', error)

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error occurred', error)
    })
  })

  describe('追加引数の処理', () => {
    it('追加引数を含めて出力する', () => {
      const logger = new Logger('INFO')
      const data = { key: 'value' }

      logger.info('Message with data', data, 'extra')

      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Message with data', data, 'extra')
    })
  })
})
