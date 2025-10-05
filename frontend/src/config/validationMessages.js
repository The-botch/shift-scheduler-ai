/**
 * バリデーションエラーメッセージマスタ
 * 全てのバリデーションエラー・警告メッセージを一元管理
 */

/**
 * エラーメッセージテンプレート
 * CSVの制約ルールと対応
 */
export const ERROR_MESSAGES = {
  // === shift_validation_rules.csv ===
  VAL001: {
    code: 'VAL001',
    category: '法令',
    template: '18歳未満のスタッフ「{staffName}」は深夜時間帯(22:00-05:00)に配置できません',
    lawReference: '労働基準法第61条',
    level: 'ERROR',
    autoAction: '自動削除',
  },
  VAL002: {
    code: 'VAL002',
    category: '法令',
    template: '法定労働時間を超えています（{hours}時間、上限: {maxHours}時間）',
    lawReference: '労働基準法第32条',
    level: 'ERROR',
    autoAction: 'ブロック',
  },
  VAL003: {
    code: 'VAL003',
    category: '法令',
    template:
      '{workHours}時間超の勤務には{requiredBreak}分以上の休憩が必要です（現在: {actualBreak}分）',
    lawReference: '労働基準法第34条',
    level: 'ERROR',
    autoAction: '自動挿入',
  },
  VAL004: {
    code: 'VAL004',
    category: '法令',
    template: '勤務間隔が11時間未満です（{intervalHours}時間）',
    lawReference: '労働時間等設定改善法',
    level: 'WARNING',
    autoAction: '警告表示',
  },
  VAL005: {
    code: 'VAL005',
    category: '法令',
    template: '36協定の上限を超えています（月{monthlyHours}時間・年{yearlyHours}時間）',
    lawReference: '労働基準法第36条',
    level: 'ERROR',
    autoAction: 'ブロック',
  },
  VAL006: {
    code: 'VAL006',
    category: '資格',
    template: '食品衛生責任者が不在の時間帯があります（{timeRange}）',
    lawReference: '食品衛生法',
    level: 'ERROR',
    autoAction: '代替提案',
  },
  VAL007: {
    code: 'VAL007',
    category: '資格',
    template: '防火管理者の出勤日数が不足しています（{actualDays}日、必要: 月1回以上）',
    lawReference: '消防法',
    level: 'WARNING',
    autoAction: '通知',
  },
  VAL008: {
    code: 'VAL008',
    category: '労務',
    template: '連続勤務日数が基準を超えています（{consecutiveDays}日連続）',
    lawReference: '労働基準法第35条',
    level: 'WARNING',
    autoAction: '警告/ブロック',
  },
  VAL009: {
    code: 'VAL009',
    category: '労務',
    template: '希望反映率が70%を下回っています（{reflectionRate}%）',
    lawReference: null,
    level: 'INFO',
    autoAction: '通知',
  },
  VAL010: {
    code: 'VAL010',
    category: '労務',
    template: '土日勤務が特定スタッフに偏っています（{staffName}: {rate}%）',
    lawReference: null,
    level: 'WARNING',
    autoAction: '再配分提案',
  },
  VAL011: {
    code: 'VAL011',
    category: '安全',
    template: '深夜時間帯の人員が不足しています（{actualCount}名、必要: 2名以上）',
    lawReference: null,
    level: 'ERROR',
    autoAction: '人員追加提案',
  },
  VAL012: {
    code: 'VAL012',
    category: '安全',
    template: '新人スタッフ「{staffName}」に指導者が配置されていません',
    lawReference: null,
    level: 'WARNING',
    autoAction: 'ペア提案',
  },
  VAL013: {
    code: 'VAL013',
    category: 'スキル',
    template:
      '必要スキルレベルを満たしていません（{position}: レベル{required}必要、現在: {current}）',
    lawReference: null,
    level: 'WARNING',
    autoAction: 'スタッフ変更提案',
  },
  VAL014: {
    code: 'VAL014',
    category: 'スキル',
    template:
      '役割バランスが適切ではありません（調理: {cooking}名、ホール: {hall}名、レジ: {cashier}名）',
    lawReference: null,
    level: 'WARNING',
    autoAction: '配置提案',
  },
  VAL015: {
    code: 'VAL015',
    category: 'コスト',
    template: '人件費率が目標を超過しています（{actualRate}%、目標: {targetRate}%以下）',
    lawReference: null,
    level: 'WARNING',
    autoAction: '削減提案',
  },

  // === labor_law_constraints.csv ===
  LAW_001: {
    code: 'LAW_001',
    category: '法令',
    template: '1日の労働時間が法定上限を超えています（{hours}時間、上限: 8時間）',
    lawReference: '労働基準法第32条第1項',
    level: 'ERROR',
  },
  LAW_002: {
    code: 'LAW_002',
    category: '法令',
    template: '週間労働時間が上限を超えています（{hours}時間、上限: {maxHours}時間）',
    lawReference: '労働基準法第32条第2項',
    level: 'ERROR',
  },
  LAW_003: {
    code: 'LAW_003',
    category: '法令',
    template: '6時間超の勤務には45分以上の休憩が必要です（現在: {actualBreak}分）',
    lawReference: '労働基準法第34条第1項',
    level: 'ERROR',
  },
  LAW_004: {
    code: 'LAW_004',
    category: '法令',
    template: '8時間超の勤務には60分以上の休憩が必要です（現在: {actualBreak}分）',
    lawReference: '労働基準法第34条第1項',
    level: 'ERROR',
  },
  LAW_005: {
    code: 'LAW_005',
    category: '法令',
    template: '週1回の法定休日が確保されていません',
    lawReference: '労働基準法第35条',
    level: 'ERROR',
  },
  LAW_006: {
    code: 'LAW_006',
    category: '法令',
    template: '勤務間インターバルが11時間未満です（{intervalHours}時間）',
    lawReference: '労働時間等設定改善法',
    level: 'WARNING',
  },
  LAW_007: {
    code: 'LAW_007',
    category: '法令',
    template:
      '18歳未満のスタッフ「{staffName}」は1日8時間を超えて勤務できません（現在: {hours}時間）',
    lawReference: '労働基準法第60条',
    level: 'ERROR',
  },
  LAW_008: {
    code: 'LAW_008',
    category: '法令',
    template: '18歳未満のスタッフ「{staffName}」は深夜時間帯(22:00-05:00)に勤務できません',
    lawReference: '労働基準法第61条',
    level: 'ERROR',
  },
  LAW_009: {
    code: 'LAW_009',
    category: '法令',
    template: '深夜労働の割増賃金が適用されます（22:00-05:00: 25%増）',
    lawReference: '労働基準法第37条第4項',
    level: 'INFO',
  },
  LAW_010: {
    code: 'LAW_010',
    category: '法令',
    template: '連続勤務日数が上限を超えています（{consecutiveDays}日連続、上限: 6日）',
    lawReference: '労働基準法第35条（解釈）',
    level: 'WARNING',
  },
  LAW_011: {
    code: 'LAW_011',
    category: '法令',
    template: '月間時間外労働が上限を超えています（{overtimeHours}時間、上限: 45時間）',
    lawReference: '労働基準法第36条',
    level: 'ERROR',
  },
  LAW_012: {
    code: 'LAW_012',
    category: '法令',
    template: '年間時間外労働が上限を超えています（{overtimeHours}時間、上限: 360時間）',
    lawReference: '労働基準法第36条',
    level: 'ERROR',
  },

  // === labor_management_rules.csv ===
  LM001: {
    code: 'LM001',
    category: '公平性',
    template: '土日祝勤務が特定スタッフに偏っています（{staffName}: 平均の{ratio}倍）',
    level: 'WARNING',
  },
  LM002: {
    code: 'LM002',
    category: '公平性',
    template: '希望シフト反映率が最低基準を下回っています（{rate}%、基準: 70%以上）',
    level: 'WARNING',
  },
  LM003: {
    code: 'LM003',
    category: '公平性',
    template: '総労働時間のばらつきが大きいです（標準偏差: {variance}%）',
    level: 'INFO',
  },
  LM004: {
    code: 'LM004',
    category: '健康管理',
    template:
      '連続勤務日数が推奨上限を超えています（{consecutiveDays}日連続、推奨: {recommendedMax}日以下）',
    level: 'WARNING',
  },
  LM005: {
    code: 'LM005',
    category: '健康管理',
    template: '連続勤務日数が絶対上限を超えています（{consecutiveDays}日連続、上限: 12日）',
    level: 'ERROR',
  },
  LM006: {
    code: 'LM006',
    category: '健康管理',
    template: '月間残業時間が警告ラインに達しています（{overtimeHours}時間、警告: 30時間）',
    level: 'WARNING',
  },
  LM007: {
    code: 'LM007',
    category: '健康管理',
    template: '月間残業時間が上限ラインに達しています（{overtimeHours}時間、上限: 45時間）',
    level: 'ERROR',
  },
  LM008: {
    code: 'LM008',
    category: '健康管理',
    template: '深夜勤務後の休息時間が不足しています（{intervalHours}時間、必要: 12時間）',
    level: 'ERROR',
  },
  LM009: {
    code: 'LM009',
    category: 'スキル',
    template:
      '新人スタッフ「{staffName}」の単独勤務は禁止されています（入社{months}ヶ月、制限: 3ヶ月）',
    level: 'ERROR',
  },
  LM010: {
    code: 'LM010',
    category: 'スキル',
    template: '調理場の最低スキルレベルが満たされていません（必要: レベル3以上）',
    level: 'WARNING',
  },
  LM011: {
    code: 'LM011',
    category: 'スキル',
    template: 'ホールの最低スキルレベルが満たされていません（必要: レベル2以上）',
    level: 'WARNING',
  },
  LM012: {
    code: 'LM012',
    category: 'チーム',
    template: '相性の悪いペアが同時シフトに配置されています（{staff1} & {staff2}）',
    level: 'WARNING',
  },
  LM013: {
    code: 'LM013',
    category: 'チーム',
    template: 'OJTペアが設定されていません（新人: {trainee}、トレーナー: {trainer}）',
    level: 'WARNING',
  },
  LM014: {
    code: 'LM014',
    category: '効率',
    template: 'シフト時間が最短時間未満です（{hours}時間、最短: 3時間）',
    level: 'WARNING',
  },
  LM015: {
    code: 'LM015',
    category: '効率',
    template: 'シフト時間が最長時間を超えています（{hours}時間、最長: 9時間）',
    level: 'WARNING',
  },

  // === システムエラー ===
  STAFF_NOT_FOUND: {
    code: 'STAFF_NOT_FOUND',
    category: 'システム',
    template: 'スタッフID {staffId} が見つかりません',
    level: 'ERROR',
  },
  INVALID_DATA: {
    code: 'INVALID_DATA',
    category: 'システム',
    template: '不正なデータです: {reason}',
    level: 'ERROR',
  },
}

/**
 * メッセージをフォーマット
 * @param {string} messageCode - メッセージコード (例: 'VAL001', 'LAW_007')
 * @param {Object} params - 置換パラメータ
 * @returns {Object} フォーマット済みメッセージ情報
 */
export const formatMessage = (messageCode, params = {}) => {
  const messageTemplate = ERROR_MESSAGES[messageCode]

  if (!messageTemplate) {
    return {
      code: messageCode,
      message: `未定義のエラーコード: ${messageCode}`,
      level: 'ERROR',
      category: 'システム',
    }
  }

  // テンプレート内の変数を置換
  let message = messageTemplate.template
  Object.keys(params).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g')
    message = message.replace(regex, params[key])
  })

  return {
    code: messageCode,
    message,
    category: messageTemplate.category,
    level: messageTemplate.level,
    lawReference: messageTemplate.lawReference,
    autoAction: messageTemplate.autoAction,
    ...params,
  }
}

/**
 * エラーオブジェクトを作成
 * @param {string} messageCode - メッセージコード
 * @param {Object} context - コンテキスト情報（shift_id, staff_id, etc）
 * @param {Object} params - メッセージパラメータ
 * @returns {Object} エラーオブジェクト
 */
export const createError = (messageCode, context = {}, params = {}) => {
  const formattedMessage = formatMessage(messageCode, params)

  return {
    rule_id: messageCode,
    level: 'ERROR',
    timestamp: new Date().toISOString(),
    ...context,
    ...formattedMessage,
  }
}

/**
 * 警告オブジェクトを作成
 * @param {string} messageCode - メッセージコード
 * @param {Object} context - コンテキスト情報
 * @param {Object} params - メッセージパラメータ
 * @returns {Object} 警告オブジェクト
 */
export const createWarning = (messageCode, context = {}, params = {}) => {
  const formattedMessage = formatMessage(messageCode, params)

  return {
    rule_id: messageCode,
    level: 'WARNING',
    timestamp: new Date().toISOString(),
    ...context,
    ...formattedMessage,
  }
}

/**
 * カテゴリ別のメッセージコード一覧を取得
 * @param {string} category - カテゴリ名
 * @returns {Array} メッセージコード配列
 */
export const getMessagesByCategory = category => {
  return Object.entries(ERROR_MESSAGES)
    .filter(([_, msg]) => msg.category === category)
    .map(([code, _]) => code)
}

/**
 * レベル別のメッセージコード一覧を取得
 * @param {string} level - レベル ('ERROR', 'WARNING', 'INFO')
 * @returns {Array} メッセージコード配列
 */
export const getMessagesByLevel = level => {
  return Object.entries(ERROR_MESSAGES)
    .filter(([_, msg]) => msg.level === level)
    .map(([code, _]) => code)
}

/**
 * 全メッセージコード一覧を取得
 * @returns {Array} メッセージコード配列
 */
export const getAllMessageCodes = () => {
  return Object.keys(ERROR_MESSAGES)
}

/**
 * メッセージ情報を取得
 * @param {string} messageCode - メッセージコード
 * @returns {Object|null} メッセージ情報
 */
export const getMessageInfo = messageCode => {
  return ERROR_MESSAGES[messageCode] || null
}
