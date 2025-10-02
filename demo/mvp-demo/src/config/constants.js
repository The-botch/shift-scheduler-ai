// システム基本定数
export const SYSTEM = {
  STORE_ID: 1,
  STORE_NAME: 'カフェ○○',
  DEFAULT_YEAR: 2024,
  DEFAULT_MONTH: 10,
  BUSINESS_HOURS: {
    OPEN: '09:00',
    CLOSE: '22:00'
  }
}

// 曜日
export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
export const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// シフト関連定数
export const SHIFT = {
  DEFAULT_BREAK_MINUTES: 60,
  MAX_CONSECUTIVE_DAYS: 6,
  MIN_HOURS_PER_WEEK: 10,
  MAX_HOURS_PER_WEEK: 40,
  OVERTIME_THRESHOLD_HOURS: 8
}

// スキルレベル
export const SKILL_LEVELS = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  COMPETENT: 3,
  ADVANCED: 4,
  EXPERT: 5
}

// ステータス
export const SHIFT_STATUS = {
  DRAFT: 'draft',
  FIRST_PLAN_APPROVED: 'first_plan_approved',
  COMPLETED: 'completed'
}

export const IMPORT_STATUS = {
  NOT_IMPORTED: 'not_imported',
  IMPORTING: 'importing',
  IMPORTED: 'imported',
  ERROR: 'error'
}

// LocalStorage キー
export const STORAGE_KEYS = {
  MONTH_STATUS: 'month_status',
  ACTUAL_DATA_STATUS: 'actual_data_status',
  APPROVED_FIRST_PLAN: (year, month) => `approved_first_plan_${year}_${month}`,
  APPROVED_SECOND_PLAN: (year, month) => `approved_second_plan_${year}_${month}`,
  USER_PREFERENCES: 'user_preferences'
}

// IndexedDB 設定
export const INDEXED_DB = {
  DB_NAME: 'shift_management',
  VERSION: 1,
  STORES: {
    ACTUAL_SHIFTS: 'actual_shifts',
    PAYROLL: 'payroll'
  }
}

// 雇用形態
export const EMPLOYMENT_TYPES = {
  MONTHLY: 'monthly',
  HOURLY: 'hourly',
  CONTRACT: 'contract'
}

// バリデーション
export const VALIDATION = {
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_FILE_TYPES: ['.csv'],
  MIN_STAFF_COUNT: 1,
  MAX_STAFF_COUNT: 100
}
