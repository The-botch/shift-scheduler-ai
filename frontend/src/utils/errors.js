/**
 * カスタムエラークラス
 */

export class AppError extends Error {
  constructor(message, code = 'APP_ERROR', statusCode = 500) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', 400)
    this.details = details
  }
}

export class APIError extends AppError {
  constructor(message, statusCode = 500) {
    super(message, 'API_ERROR', statusCode)
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

/**
 * エラーハンドラー
 */
export const handleError = (error, context = '') => {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    context,
    name: error.name,
    message: error.message,
    code: error.code || 'UNKNOWN_ERROR',
    stack: error.stack,
  }

  console.error('Error:', errorInfo)
  
  return errorInfo
}
