/**
 * OpenAI ChatGPT-4 API クライアント
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * ChatGPT-4にメッセージを送信
 * @param {string} prompt - ユーザーのプロンプト
 * @param {Object} options - オプション設定
 * @returns {Promise<Object>} API応答
 */
export const sendToChatGPT = async (prompt, options = {}) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'OpenAI APIキーが設定されていません。\n' +
      '.envファイルにVITE_OPENAI_API_KEY=your_api_keyを設定してください。'
    )
  }

  const {
    model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4',
    maxTokens = parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS) || 2000,
    temperature = 0.7,
    systemMessage = 'あなたはシフト管理システムの専門家AIアシスタントです。'
  } = options

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `OpenAI API Error: ${response.status} - ${errorData.error?.message || response.statusText}`
      )
    }

    const data = await response.json()

    return {
      success: true,
      message: data.choices[0]?.message?.content || '',
      usage: data.usage,
      model: data.model,
      rawResponse: data
    }
  } catch (error) {
    console.error('ChatGPT API Error:', error)
    return {
      success: false,
      error: error.message,
      message: `エラーが発生しました: ${error.message}`
    }
  }
}

/**
 * シフト生成用のプロンプトを構築
 * @param {Object} params - シフト生成パラメータ
 * @returns {string} 構築されたプロンプト
 */
export const buildShiftGenerationPrompt = (params) => {
  const {
    month,
    year,
    staffCount,
    constraints = [],
    preferences = [],
    budgetLimit
  } = params

  let prompt = `${year}年${month}月のシフトスケジュールを作成してください。\n\n`

  prompt += `## 基本情報\n`
  prompt += `- 対象期間: ${year}年${month}月\n`
  prompt += `- スタッフ数: ${staffCount}名\n`

  if (budgetLimit) {
    prompt += `- 人件費予算: ${budgetLimit}円以内\n`
  }

  prompt += `\n## ハード制約（必ず守る）\n`
  prompt += `1. 18歳未満のスタッフは深夜勤務（22:00-05:00）禁止\n`
  prompt += `2. 1日の労働時間上限: 8時間\n`
  prompt += `3. 週間労働時間上限: 40時間\n`
  prompt += `4. 6時間超の勤務には45分以上の休憩、8時間超には60分以上の休憩\n`
  prompt += `5. 勤務間インターバル: 11時間以上\n`
  prompt += `6. 連続勤務日数: 最大6日まで\n`

  if (constraints.length > 0) {
    prompt += `7. 追加制約:\n`
    constraints.forEach((c, i) => {
      prompt += `   ${i + 1}. ${c}\n`
    })
  }

  prompt += `\n## ソフト制約（できるだけ満たす）\n`
  prompt += `1. スタッフの希望シフトを70%以上反映\n`
  prompt += `2. 土日勤務の偏りを最小化\n`
  prompt += `3. 総労働時間の公平性を保つ\n`

  if (preferences.length > 0) {
    prompt += `4. スタッフの希望:\n`
    preferences.forEach((p, i) => {
      prompt += `   ${i + 1}. ${p}\n`
    })
  }

  prompt += `\n## 出力形式\n`
  prompt += `CSVフォーマットで以下の列を含めてください:\n`
  prompt += `shift_id, staff_id, shift_date, start_time, end_time, break_minutes, total_hours\n`

  return prompt
}

/**
 * バリデーション結果の分析を依頼
 * @param {Object} validationResult - バリデーション結果
 * @returns {Promise<Object>} 分析結果
 */
export const analyzeValidationResult = async (validationResult) => {
  const prompt = `
以下のシフトバリデーション結果を分析し、改善提案をしてください。

## バリデーション結果
- 総合判定: ${validationResult.isValid ? '合格' : '不合格'}
- エラー件数: ${validationResult.errorCount}
- 警告件数: ${validationResult.warningCount}

### エラー一覧
${validationResult.errors.map((e, i) => `${i + 1}. [${e.rule_id}] ${e.message}`).join('\n')}

### 警告一覧
${validationResult.warnings.map((w, i) => `${i + 1}. [${w.rule_id}] ${w.message}`).join('\n')}

## 依頼内容
1. 主な問題点の要約
2. 優先的に対応すべき項目
3. 具体的な改善案
4. リスク評価

簡潔に日本語で回答してください。
`

  return await sendToChatGPT(prompt, {
    systemMessage: 'あなたはシフト管理の専門家です。バリデーション結果を分析し、実用的な改善提案を行ってください。'
  })
}
