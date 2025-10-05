import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

// OpenAI API設定
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY
const OPENAI_API_BASE = 'https://api.openai.com/v1'
const ASSISTANTS_BETA_HEADER = 'assistants=v2'

// OpenAI SDK初期化
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
})

// OpenAI APIヘッダー
export function getOpenAIHeaders(includeContentType = true) {
  const headers = {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'OpenAI-Beta': ASSISTANTS_BETA_HEADER
  }
  if (includeContentType) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

export { OPENAI_API_BASE }
