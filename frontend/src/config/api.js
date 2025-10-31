/**
 * API設定
 */

// バックエンドAPIのベースURL
export const BACKEND_API_URL =
  import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001'

// フロントエンドのベースURL
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'

// APIエンドポイント
export const API_ENDPOINTS = {
  // OpenAI API Proxy
  CHAT_COMPLETIONS: '/api/openai/chat/completions',
  VECTOR_STORES: '/api/openai/vector_stores',
  FILES: '/api/openai/files',
  ASSISTANTS: '/api/openai/assistants',
  THREADS: '/api/openai/threads',

  // CSV操作
  SAVE_CSV: '/api/save-csv',
  LOAD_CSV: '/api/load-csv',

  // Analytics API
  ANALYTICS_PAYROLL: '/api/analytics/payroll',
  ANALYTICS_SALES_ACTUAL: '/api/analytics/sales-actual',
  ANALYTICS_SALES_FORECAST: '/api/analytics/sales-forecast',
  ANALYTICS_DASHBOARD_METRICS: '/api/analytics/dashboard-metrics',

  // Shift API
  SHIFTS: '/api/shifts',
  SHIFTS_PLANS: '/api/shifts/plans',
  SHIFTS_SUMMARY: '/api/shifts/summary',

  // Master Data API
  MASTER_STAFF: '/api/master/staff',
  MASTER_ROLES: '/api/master/roles',
  MASTER_SKILLS: '/api/master/skills',
  MASTER_STORES: '/api/master/stores',
  MASTER_SHIFT_PATTERNS: '/api/master/shift-patterns',
  MASTER_COMMUTE_ALLOWANCE: '/api/master/commute-allowance',
  MASTER_INSURANCE_RATES: '/api/master/insurance-rates',
  MASTER_TAX_BRACKETS: '/api/master/tax-brackets',
  MASTER_STAFF_SKILLS: '/api/master/staff-skills',
  MASTER_STAFF_CERTIFICATIONS: '/api/master/staff-certifications',
  MASTER_LABOR_LAW_CONSTRAINTS: '/api/master/labor-law-constraints',
  MASTER_STORE_CONSTRAINTS: '/api/master/store-constraints',
  MASTER_EMPLOYMENT_TYPES: '/api/master/employment-types',
  MASTER_LABOR_MANAGEMENT_RULES: '/api/master/labor-management-rules',
  MASTER_SHIFT_VALIDATION_RULES: '/api/master/shift-validation-rules',
}

// 完全なAPIエンドポイントURLを取得
export const getApiUrl = endpoint => {
  return `${BACKEND_API_URL}${endpoint}`
}
