// データファイルパス設定

// マスターデータ
export const MASTER_DATA_PATHS = {
  STAFF: '/data/master/staff.csv',
  ROLES: '/data/master/roles.csv',
  SHIFT_PATTERNS: '/data/master/shift_patterns.csv',
  EMPLOYMENT_TYPES: '/data/master/employment_types.csv',
  COMMUTE_ALLOWANCE: '/data/master/commute_allowance.csv',
  INSURANCE_RATES: '/data/master/insurance_rates.csv',
  TAX_BRACKETS: '/data/master/tax_brackets.csv',
}

// トランザクションデータ
export const TRANSACTION_DATA_PATHS = {
  SHIFT_PLANS: '/data/transactions/shift_plans.csv',
  AVAILABILITY_REQUESTS: '/data/transactions/availability_requests.csv',
  SHIFT_PREFERENCES: '/data/transactions/shift_preferences_2024_10.csv',
  SHIFT_SECOND_PLAN: '/data/transactions/shift_second_plan.csv',
  SHIFT_SECOND_PLAN_ISSUES: '/data/transactions/shift_second_plan_issues.csv',
  SHIFT_SECOND_PLAN_SOLUTIONS: '/data/transactions/shift_second_plan_solutions.csv',
}

// 履歴データ
export const HISTORY_DATA_PATHS = {
  SHIFT_HISTORY: '/data/history/shift_history_2023-2024.csv',
  SHIFT_OCTOBER_2024: '/data/history/shift_october_2024.csv',
  SHIFT_MONTHLY_SUMMARY: '/data/history/shift_monthly_summary.csv',
}

// 実績データ
export const ACTUAL_DATA_PATHS = {
  WORK_HOURS_2024: '/data/actual/work_hours_2024.csv',
  PAYROLL_2024: '/data/actual/payroll_2024.csv',
}

// ヘルパー関数
export const getShiftHistoryPath = (year, month) => {
  return `/data/history/shift_${year}_${String(month).padStart(2, '0')}.csv`
}

export const getWorkHoursPath = year => {
  return `/data/actual/work_hours_${year}.csv`
}

export const getPayrollPath = year => {
  return `/data/actual/payroll_${year}.csv`
}

// 全パスをまとめたオブジェクト
export const ALL_PATHS = {
  ...MASTER_DATA_PATHS,
  ...TRANSACTION_DATA_PATHS,
  ...HISTORY_DATA_PATHS,
  ...ACTUAL_DATA_PATHS,
}
