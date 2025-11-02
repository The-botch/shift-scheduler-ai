/**
 * アプリケーション内で使用するアラート定義
 */

export const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}

export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

/**
 * システムアラート定義
 */
export const ALERTS = {
  // シフト関連アラート
  SHIFT: {
    CONSTRAINT_VIOLATION: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.MEDIUM,
      title: '制約違反',
      message: 'シフトが制約条件に違反しています',
      action: '修正が必要です',
    },
    OVERLAP_DETECTED: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.MEDIUM,
      title: 'シフト重複',
      message: 'スタッフのシフトが重複しています',
      action: '調整してください',
    },
    UNDERSTAFFED: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.HIGH,
      title: '人員不足',
      message: (date, required, actual) =>
        `${date}日: 必要人数${required}名に対して${actual}名しか配置されていません`,
      action: 'スタッフを追加してください',
    },
    OVERSTAFFED: {
      type: ALERT_TYPES.INFO,
      severity: ALERT_SEVERITY.LOW,
      title: '人員過剰',
      message: (date, required, actual) =>
        `${date}日: 必要人数${required}名に対して${actual}名が配置されています`,
      action: '調整を検討してください',
    },
    OVERTIME_WARNING: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.HIGH,
      title: '残業時間超過警告',
      message: (staffName, hours, limit) =>
        `${staffName}さんの残業時間が${hours}時間（上限${limit}時間）を超えています`,
      action: 'シフトを調整してください',
    },
    REST_DAY_VIOLATION: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.HIGH,
      title: '休日不足',
      message: (staffName, days) =>
        `${staffName}さんの休日が${days}日しかありません（法定最低7日/月）`,
      action: '休日を追加してください',
    },
    CONSECUTIVE_WORK_WARNING: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.MEDIUM,
      title: '連続勤務警告',
      message: (staffName, days) =>
        `${staffName}さんが${days}日連続で勤務しています`,
      action: '休日の配置を検討してください',
    },
  },

  // 予算関連アラート
  BUDGET: {
    OVER_BUDGET: {
      type: ALERT_TYPES.ERROR,
      severity: ALERT_SEVERITY.CRITICAL,
      title: '予算超過',
      message: (actual, budget) =>
        `人件費が予算を超過しています（実績: ¥${actual.toLocaleString()}, 予算: ¥${budget.toLocaleString()}）`,
      action: 'シフトの見直しが必要です',
    },
    BUDGET_WARNING: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.HIGH,
      title: '予算警告',
      message: (percentage) =>
        `人件費が予算の${percentage}%に達しています`,
      action: '予算管理に注意してください',
    },
    LABOR_COST_HIGH: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.MEDIUM,
      title: '人件費率高',
      message: (rate, target) =>
        `人件費率が${rate}%（目標: ${target}%）です`,
      action: 'コスト削減を検討してください',
    },
  },

  // データ関連アラート
  DATA: {
    IMPORT_ERROR: {
      type: ALERT_TYPES.ERROR,
      severity: ALERT_SEVERITY.HIGH,
      title: 'インポートエラー',
      message: 'データのインポート中にエラーが発生しました',
      action: 'データを確認してください',
    },
    EXPORT_ERROR: {
      type: ALERT_TYPES.ERROR,
      severity: ALERT_SEVERITY.MEDIUM,
      title: 'エクスポートエラー',
      message: 'データのエクスポート中にエラーが発生しました',
      action: '再試行してください',
    },
    DATA_SYNC_ERROR: {
      type: ALERT_TYPES.ERROR,
      severity: ALERT_SEVERITY.HIGH,
      title: '同期エラー',
      message: 'データの同期に失敗しました',
      action: 'ネットワークを確認してください',
    },
    VALIDATION_ERROR: {
      type: ALERT_TYPES.ERROR,
      severity: ALERT_SEVERITY.MEDIUM,
      title: 'バリデーションエラー',
      message: (count) => `${count}件のデータに誤りがあります`,
      action: 'データを修正してください',
    },
  },

  // システム関連アラート
  SYSTEM: {
    NETWORK_ERROR: {
      type: ALERT_TYPES.ERROR,
      severity: ALERT_SEVERITY.CRITICAL,
      title: 'ネットワークエラー',
      message: 'サーバーとの通信に失敗しました',
      action: 'ネットワーク接続を確認してください',
    },
    SESSION_EXPIRED: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.HIGH,
      title: 'セッション期限切れ',
      message: 'セッションが切れました',
      action: '再度ログインしてください',
    },
    MAINTENANCE: {
      type: ALERT_TYPES.INFO,
      severity: ALERT_SEVERITY.LOW,
      title: 'メンテナンス予告',
      message: (date) => `${date}にメンテナンスを実施します`,
      action: '事前にデータを保存してください',
    },
    UPDATE_AVAILABLE: {
      type: ALERT_TYPES.INFO,
      severity: ALERT_SEVERITY.LOW,
      title: '更新通知',
      message: '新しいバージョンが利用可能です',
      action: '更新してください',
    },
  },

  // 承認フロー関連アラート
  APPROVAL: {
    PENDING_APPROVAL: {
      type: ALERT_TYPES.INFO,
      severity: ALERT_SEVERITY.MEDIUM,
      title: '承認待ち',
      message: (count) => `${count}件のシフトが承認待ちです`,
      action: '確認してください',
    },
    APPROVAL_DEADLINE: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.HIGH,
      title: '承認期限警告',
      message: (date) => `${date}が承認期限です`,
      action: '早急に承認してください',
    },
    APPROVED: {
      type: ALERT_TYPES.SUCCESS,
      severity: ALERT_SEVERITY.LOW,
      title: '承認完了',
      message: 'シフトが承認されました',
      action: null,
    },
    REJECTED: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.MEDIUM,
      title: '却下',
      message: 'シフトが却下されました',
      action: '修正して再提出してください',
    },
  },

  // スタッフ関連アラート
  STAFF: {
    SHIFT_REQUEST_PENDING: {
      type: ALERT_TYPES.INFO,
      severity: ALERT_SEVERITY.MEDIUM,
      title: 'シフト希望未提出',
      message: (staffName) => `${staffName}さんがシフト希望を提出していません`,
      action: '提出を促してください',
    },
    SHIFT_REQUEST_DEADLINE: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.HIGH,
      title: 'シフト希望締切',
      message: (date) => `${date}がシフト希望の締切です`,
      action: '提出してください',
    },
    SKILL_MISMATCH: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.MEDIUM,
      title: 'スキル不一致',
      message: (staffName, requiredSkill) =>
        `${staffName}さんには${requiredSkill}スキルがありません`,
      action: '配置を見直してください',
    },
  },
}

/**
 * アラートを生成するヘルパー関数
 * @param {string} path - アラートのパス（例: 'SHIFT.CONSTRAINT_VIOLATION'）
 * @param {any} args - メッセージ関数の引数
 * @returns {Object} アラートオブジェクト
 */
export function createAlert(path, ...args) {
  const keys = path.split('.')
  let alert = ALERTS

  for (const key of keys) {
    if (alert[key] === undefined) {
      console.warn(`Alert not found: ${path}`)
      return null
    }
    alert = alert[key]
  }

  const result = { ...alert }
  if (typeof alert.message === 'function') {
    result.message = alert.message(...args)
  }

  result.timestamp = new Date().toISOString()
  result.id = `${path}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return result
}

/**
 * アラートの優先度を数値で取得
 * @param {string} severity - アラートの重要度
 * @returns {number} 優先度（数値が大きいほど優先度が高い）
 */
export function getAlertPriority(severity) {
  const priorities = {
    [ALERT_SEVERITY.LOW]: 1,
    [ALERT_SEVERITY.MEDIUM]: 2,
    [ALERT_SEVERITY.HIGH]: 3,
    [ALERT_SEVERITY.CRITICAL]: 4,
  }
  return priorities[severity] || 0
}

/**
 * アラートをソートするための比較関数
 * @param {Object} a - アラートA
 * @param {Object} b - アラートB
 * @returns {number} ソート順
 */
export function compareAlerts(a, b) {
  const priorityDiff = getAlertPriority(b.severity) - getAlertPriority(a.severity)
  if (priorityDiff !== 0) return priorityDiff

  return new Date(b.timestamp) - new Date(a.timestamp)
}
