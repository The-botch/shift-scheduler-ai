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
  
  // CSV保存
  SAVE_CSV: '/api/save-csv',
}

// 完全なAPIエンドポイントURLを取得
export const getApiUrl = endpoint => {
  return `${BACKEND_API_URL}${endpoint}`
}
