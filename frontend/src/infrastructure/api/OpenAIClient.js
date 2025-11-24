/**
 * OpenAI APIクライアント（インフラ層）
 */
import { BACKEND_API_URL } from '../../config/api'
import { postJSON } from '../../utils/http'

export class OpenAIClient {
  constructor(backendUrl = BACKEND_API_URL) {
    this.backendUrl = backendUrl
  }

  /**
   * ChatGPT APIを呼び出す
   */
  async sendChatCompletion(messages, options = {}) {
    const { model = 'gpt-4', maxTokens = 2000, temperature = 0.7 } = options

    return postJSON(`${this.backendUrl}/api/openai/chat/completions`, {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    })
  }

  /**
   * Vector Storeを作成
   */
  async createVectorStore(name) {
    return postJSON(`${this.backendUrl}/api/openai/vector_stores`, {
      name,
    })
  }

  /**
   * ファイルをアップロード
   */
  async uploadFile(filePath) {
    return postJSON(`${this.backendUrl}/api/openai/files`, {
      filePath,
    })
  }

  /**
   * Assistantを作成
   */
  async createAssistant(config) {
    return postJSON(`${this.backendUrl}/api/openai/assistants`, config)
  }
}
