/**
 * ロガーユーティリティ
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

class Logger {
  constructor(level = 'INFO') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.INFO
  }

  debug(message, ...args) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  }

  info(message, ...args) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, ...args)
    }
  }

  warn(message, ...args) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  }

  error(message, error = null, ...args) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, error, ...args)
    }
  }
}

// デフォルトロガーをエクスポート
export const logger = new Logger(import.meta.env.VITE_LOG_LEVEL || 'INFO')

export { Logger }
export default logger
