import { openai } from '../openaiService.js'

/**
 * OpenAI API呼び出しサービス
 * リトライ機能付きでAIシフト生成を実行
 */
class OpenAIClientService {
  /**
   * OpenAI API呼び出し (リトライ付き)
   * @param {Object} prompt - {system, user}
   * @param {Object} options - 設定オプション
   * @returns {Promise<string>} AI応答 (JSON文字列)
   */
  async generateShifts(prompt, options = {}) {
    const {
      maxRetries = 3,
      temperature = 0.7,
      model = 'gpt-4-turbo-preview'
    } = options

    console.log(`[OpenAIClient] AI生成開始: model=${model}, temperature=${temperature}`)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[OpenAIClient] 試行 ${attempt}/${maxRetries}...`)

        const response = await openai.chat.completions.create({
          model,
          temperature,
          response_format: { type: 'json_object' }, // JSON強制
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
          ]
        })

        const content = response.choices[0].message.content
        console.log(`[OpenAIClient] AI生成成功 (${attempt}回目)`)

        return content

      } catch (error) {
        console.error(`[OpenAIClient] エラー (試行 ${attempt}/${maxRetries}):`, error.message)

        if (attempt === maxRetries) {
          throw new Error(`AI生成に失敗しました (${maxRetries}回試行): ${error.message}`)
        }

        // 指数バックオフ (1秒、2秒、4秒)
        const waitTime = Math.pow(2, attempt - 1) * 1000
        console.log(`[OpenAIClient] ${waitTime}ms待機してリトライします...`)
        await this.sleep(waitTime)
      }
    }
  }

  /**
   * スリープ
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export default OpenAIClientService
