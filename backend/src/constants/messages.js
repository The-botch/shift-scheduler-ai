/**
 * バックエンドAPIで使用するメッセージ定義
 */

export const MESSAGES = {
  // 成功メッセージ
  SUCCESS: {
    SHIFT_PLAN_CREATED: 'シフト計画を作成しました',
    SHIFT_CREATED: 'Shift created successfully',
    SHIFT_UPDATED: 'Shift updated successfully',
    SHIFT_DELETED: 'Shift deleted successfully',
    FIRST_PLAN_APPROVED: '第1案を承認しました',
    SHIFT_PREFERENCE_CREATED: 'Shift preference created successfully',
    SHIFT_PREFERENCE_UPDATED: 'Shift preference updated successfully',
    SHIFT_PREFERENCE_DELETED: 'Shift preference deleted successfully',
    DATA_IMPORTED: (count) => `${count}件のデータをインポートしました`,
    WORK_HOURS_IMPORTED: (count) => `労働時間実績データを登録しました（${count}件）`,
    PAYROLL_IMPORTED: (count) => `給与データを登録しました（${count}件）`,
  },

  // バリデーションエラー
  VALIDATION: {
    YEAR_REQUIRED: 'Year parameter is required',
    MONTH_REQUIRED: 'Month parameter is required',
    MISSING_FIELDS: 'Missing required fields',
    INVALID_YEAR: 'Invalid year: must be between 2000 and 2100',
    INVALID_MONTH: 'Invalid month: must be between 1 and 12',
    PAST_MONTH: 'Cannot create or update shifts for past months',
    INVALID_REFERENCE: 'Invalid reference: one or more foreign keys do not exist',
    PLAN_ID_REQUIRED: 'Missing required parameter: plan_id',
    MISSING_SHIFT_PARAMS: 'Missing required parameters: plan_id, year, month, shifts',
    TENANT_ID_REQUIRED: 'tenant_id is required in query parameters',
    INVALID_TIME_RANGE: 'Invalid time range: break_minutes exceeds work hours',
    STATUS_REQUIRED: 'Missing required parameter: status',
    FILENAME_CONTENT_REQUIRED: 'filename and content are required',
    PATH_REQUIRED: 'path parameter is required',
    DATA_REQUIRED: 'データが指定されていません',
    FUTURE_DATA_NOT_ALLOWED: (year, month, count) =>
      `未来のデータは登録できません。${year}年${month}月以降のデータ（${count}件）が含まれています。`,
  },

  // Not Foundエラー
  NOT_FOUND: {
    PREVIOUS_SHIFT_NOT_FOUND: '前月のシフトデータが存在しません。最初の月は手動でシフトを作成してください。',
    PLAN_NOT_FOUND: 'Plan not found',
    PLAN_NOT_FOUND_JP: 'シフト計画が見つかりません',
    FIRST_PLAN_NOT_FOUND: 'First plan not found',
    FIRST_PLAN_NOT_FOUND_JP: '第1案が見つかりません',
    SHIFT_PLAN_NOT_FOUND: 'Shift plan not found',
    SHIFT_PREFERENCE_NOT_FOUND: 'Shift preference not found',
    SHIFT_NOT_FOUND: 'Shift not found',
    TENANT_NOT_FOUND: 'テナントが見つかりません',
    FILE_NOT_FOUND: (path) => `ファイルが見つかりません: ${path}`,
    CSV_NOT_FOUND: (path) => `CSVファイルが見つかりません: ${path}`,
  },

  // Conflictエラー
  CONFLICT: {
    SHIFT_PLAN_EXISTS: 'Shift plan already exists for this year and month',
    SHIFT_PREFERENCE_EXISTS: 'Shift preference already exists for this staff, year, and month',
  },

  // システムエラー
  ERROR: {
    DATABASE_ERROR: 'Database error occurred',
    UNEXPECTED_ERROR: '予期しないエラーが発生しました',
    NETWORK_ERROR: 'Network error occurred',
    OPENAI_API_ERROR: 'OpenAI API error occurred',
    CSV_READ_ERROR: 'CSV読み込みエラー',
    VECTOR_STORE_SETUP_ERROR: 'Vector Storeセットアップエラー',
    FILE_DELETE_ERROR: '一時ファイル削除エラー',
    IMPORT_ERROR: 'データのインポートに失敗しました',
    EXPORT_ERROR: 'データのエクスポートに失敗しました',
  },

  // ログメッセージ
  LOG: {
    SERVER_STARTED: (port) => `Server running on port ${port}`,
    DB_CONNECTED: 'データベース接続成功',
    DB_QUERY_EXECUTED: 'クエリ実行',
    STAFF_NOT_FOUND: (name) => `Staff not found: ${name}`,
    VECTOR_STORE_FILE_ADDED: 'Vector Storeへのファイル追加成功',
  },
}

/**
 * メッセージを取得するヘルパー関数
 * @param {string} path - メッセージのパス（例: 'SUCCESS.SHIFT_CREATED'）
 * @param {any} args - 関数型メッセージの引数
 * @returns {string} メッセージ文字列
 */
export function getMessage(path, ...args) {
  const keys = path.split('.')
  let message = MESSAGES

  for (const key of keys) {
    if (message[key] === undefined) {
      console.warn(`Message not found: ${path}`)
      return path
    }
    message = message[key]
  }

  if (typeof message === 'function') {
    return message(...args)
  }

  return message
}

/**
 * HTTPレスポンス用のメッセージオブジェクトを生成
 * @param {boolean} success - 成功フラグ
 * @param {string} message - メッセージ
 * @param {Object} data - 追加データ
 * @returns {Object} レスポンスオブジェクト
 */
export function createResponse(success, message, data = null) {
  const response = { success, message }
  if (data !== null) {
    Object.assign(response, data)
  }
  return response
}

/**
 * エラーレスポンス用のメッセージオブジェクトを生成
 * @param {string} message - エラーメッセージ
 * @param {Error} error - エラーオブジェクト
 * @returns {Object} エラーレスポンスオブジェクト
 */
export function createErrorResponse(message, error = null) {
  const response = {
    success: false,
    message,
  }

  if (error) {
    response.error = error.message
    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack
    }
  }

  return response
}
