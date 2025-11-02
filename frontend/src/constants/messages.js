/**
 * アプリケーション内で使用するメッセージ定義
 */

export const MESSAGES = {
  // 成功メッセージ
  SUCCESS: {
    SAVE: 'データを保存しました',
    UPDATE: 'データを更新しました',
    DELETE: 'データを削除しました',
    IMPORT: 'データをインポートしました',
    EXPORT: 'データをエクスポートしました',
    APPROVE_FIRST_PLAN: '第1案を承認しました',
    APPROVE_SECOND_PLAN: '第2案を承認しました',
    SEND_MESSAGE: 'メッセージを送信しました',
    SHIFT_CREATED: 'シフトを作成しました',
    SHIFT_UPDATED: 'シフトを更新しました',
    SHIFT_DELETED: 'シフトを削除しました',
    AI_MODIFICATION_APPLIED: (count) => `${count}件の修正を適用しました`,
  },

  // エラーメッセージ
  ERROR: {
    GENERAL: 'エラーが発生しました',
    NETWORK: 'ネットワークエラーが発生しました',
    SAVE_FAILED: 'データの保存に失敗しました',
    UPDATE_FAILED: 'データの更新に失敗しました',
    DELETE_FAILED: 'データの削除に失敗しました',
    LOAD_FAILED: 'データの読み込みに失敗しました',
    IMPORT_FAILED: 'データのインポートに失敗しました',
    EXPORT_FAILED: 'データのエクスポートに失敗しました',
    INVALID_INPUT: '入力内容に誤りがあります',
    REQUIRED_FIELD: '必須項目が入力されていません',
    SHIFT_UPDATE_FAILED: 'シフトの更新に失敗しました',
    SHIFT_DELETE_FAILED: 'シフトの削除に失敗しました',
    AI_MODIFICATION_FAILED: '修正の適用中にエラーが発生しました',
    AI_API_ERROR: (message) => `AIアシスタントエラー: ${message}`,
    NO_PLAN_ID: 'シフト計画IDが見つかりません',
    CHATGPT_API_ERROR: (error) => `エラーが発生しました: ${error}\n\n申し訳ございませんが、再度お試しください。`,
  },

  // 警告メッセージ
  WARNING: {
    UNSAVED_CHANGES: '変更が保存されていません。このまま続けますか？',
    DELETE_CONFIRM: '本当に削除しますか？この操作は取り消せません。',
    OVERWRITE_CONFIRM: '既存のデータを上書きしますか？',
    CONSTRAINT_VIOLATION: '制約条件に違反しています',
    MISSING_DATA: '一部のデータが不足しています',
    SHIFT_CONFLICT: 'シフトが重複しています',
  },

  // 情報メッセージ
  INFO: {
    NO_DATA: 'データがありません',
    LOADING: '読み込み中...',
    PROCESSING: '処理中...',
    SAVED: '保存済み',
    GENERATING_SHIFT: 'シフトを生成中...',
    VIEW_ONLY: 'このシフトは確定済みのため、閲覧のみ可能です',
    BACK_TO_SHIFT_MANAGEMENT: 'シフト管理に戻りますか？',
    SELECT_STORE: '店舗を選択してください',
    SELECT_MONTH: '月を選択してください',
  },

  // バリデーションメッセージ
  VALIDATION: {
    REQUIRED: (field) => `${field}は必須です`,
    MIN_LENGTH: (field, length) => `${field}は${length}文字以上で入力してください`,
    MAX_LENGTH: (field, length) => `${field}は${length}文字以下で入力してください`,
    INVALID_EMAIL: 'メールアドレスの形式が正しくありません',
    INVALID_PHONE: '電話番号の形式が正しくありません',
    INVALID_DATE: '日付の形式が正しくありません',
    INVALID_TIME: '時刻の形式が正しくありません',
    INVALID_NUMBER: '数値を入力してください',
    MIN_VALUE: (field, value) => `${field}は${value}以上で入力してください`,
    MAX_VALUE: (field, value) => `${field}は${value}以下で入力してください`,
    TIME_RANGE_INVALID: '終了時刻は開始時刻より後に設定してください',
  },

  // シフト関連メッセージ
  SHIFT: {
    APPROVED: 'シフトを承認しました',
    COMPLETED: 'シフトを確定しました',
    DRAFT_SAVED: '下書きを保存しました',
    NO_SHIFTS: 'シフトデータがありません',
    CONFLICT_DETECTED: 'シフトの重複が検出されました',
    CONSTRAINT_CHECK: '制約条件をチェックしています...',
    STATUS: {
      NOT_STARTED: '未作成',
      DRAFT: '下書き',
      FIRST_PLAN_APPROVED: '第1案承認済み',
      SECOND_PLAN_APPROVED: '第2案承認済み',
      COMPLETED: '確定済み',
    },
  },

  // AI関連メッセージ
  AI: {
    THINKING: 'AIが考え中...',
    GENERATING: 'AIがシフトを生成しています...',
    ANALYZING: 'AIが分析中...',
    SUGGESTION_READY: 'AIの提案が準備できました',
    NO_SUGGESTIONS: '現在、提案はありません',
    APPLY_CHANGES: '修正する',
    CHAT_PLACEHOLDER: 'メッセージを入力...',
  },

  // CSV関連メッセージ
  CSV: {
    IMPORT_SUCCESS: (count) => `${count}件のデータをインポートしました`,
    EXPORT_SUCCESS: 'CSVファイルをエクスポートしました',
    INVALID_FORMAT: 'CSVファイルの形式が正しくありません',
    MISSING_COLUMNS: '必須の列が不足しています',
    PARSING_ERROR: 'CSVファイルの解析に失敗しました',
  },

  // 認証関連メッセージ
  AUTH: {
    LOGIN_SUCCESS: 'ログインしました',
    LOGOUT_SUCCESS: 'ログアウトしました',
    LOGIN_FAILED: 'ログインに失敗しました',
    SESSION_EXPIRED: 'セッションが切れました。再度ログインしてください',
    UNAUTHORIZED: 'この操作を実行する権限がありません',
  },

  // 通知メッセージ
  NOTIFICATION: {
    NEW_MESSAGE: '新しいメッセージがあります',
    SHIFT_REMINDER: 'シフト提出期限が近づいています',
    SHIFT_UPDATED: 'シフトが更新されました',
    SHIFT_APPROVED: 'シフトが承認されました',
  },
}

/**
 * メッセージを取得するヘルパー関数
 * @param {string} path - メッセージのパス（例: 'SUCCESS.SAVE'）
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
