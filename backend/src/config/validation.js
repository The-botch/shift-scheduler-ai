/**
 * バリデーションルール定数
 *
 * バリデーションで使用する閾値や制約値を一元管理します。
 */

export const VALIDATION_RULES = {
  // 勤務時間関連
  MIN_HOURS_PER_WEEK: 0,
  MIN_BREAK_MINUTES: 0,
  MINUTES_PER_DAY: 24 * 60,
  HOURS_PER_DAY: 24,

  // その他の制約
  MAX_CONSECUTIVE_DAYS: 7,  // 最大連続勤務日数（労働基準法準拠）
  MIN_REST_HOURS: 11,       // 最低休息時間（時間）
};

/**
 * バリデーションエラーメッセージ
 */
export const VALIDATION_MESSAGES = {
  INVALID_MAX_HOURS: 'max_hours_per_week must be >= 0',
  INVALID_BREAK_MINUTES: 'break_minutes must be >= 0',
  INVALID_TENANT_ID: 'tenant_id is required',
  INVALID_STORE_ID: 'store_id is required',
  INVALID_STAFF_ID: 'staff_id is required',
  INVALID_STATUS: 'Invalid status value',
};

export default VALIDATION_RULES;
