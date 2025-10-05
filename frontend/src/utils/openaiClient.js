/**
 * OpenAI ChatGPT-4 API クライアント（バックエンド経由）
 */

import { BACKEND_API_URL } from '../config/api'

/**
 * ChatGPT-4にメッセージを送信（バックエンド経由）
 * @param {string} prompt - ユーザーのプロンプト
 * @param {Object} options - オプション設定
 * @returns {Promise<Object>} API応答
 */
export const sendToChatGPT = async (prompt, options = {}) => {
  const {
    model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4',
    maxTokens = parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS) || 2000,
    temperature = 0.7,
    systemMessage = 'あなたはシフト管理システムの専門家AIアシスタントです。',
  } = options

  try {
    const response = await fetch(`${BACKEND_API_URL}/api/openai/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
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
      rawResponse: data,
    }
  } catch (error) {
    console.error('ChatGPT API Error:', error)
    return {
      success: false,
      error: error.message,
      message: `エラーが発生しました: ${error.message}`,
    }
  }
}

/**
 * シフト生成用の追加プロンプトを構築
 * （基本的なインプットデータはformatInputsForPromptから取得）
 * @param {Object} params - シフト生成パラメータ
 * @returns {string} 構築されたプロンプト
 */
export const buildShiftGenerationPrompt = params => {
  const { month, year, staffCount, constraints = [], preferences = [], budgetLimit } = params

  let prompt = `\n---\n\n## 追加の制約・要望\n\n`

  if (constraints.length > 0) {
    prompt += `### 追加制約\n`
    constraints.forEach((c, i) => {
      prompt += `${i + 1}. ${c}\n`
    })
    prompt += `\n`
  }

  if (preferences.length > 0) {
    prompt += `### スタッフからの個別希望\n`
    preferences.forEach((p, i) => {
      prompt += `${i + 1}. ${p}\n`
    })
    prompt += `\n`
  }

  prompt += `\n## 出力形式\n`
  prompt += `必ず以下のJSON形式で出力してください。他のテキストは一切含めないでください。\n\n`
  prompt += `{\n`
  prompt += `  "summary": {\n`
  prompt += `    "year": ${year},\n`
  prompt += `    "month": ${month},\n`
  prompt += `    "totalShifts": "生成したシフトの総数",\n`
  prompt += `    "totalStaff": "スタッフ数",\n`
  prompt += `    "totalWorkHours": "総労働時間",\n`
  prompt += `    "estimatedCost": "予想人件費",\n`
  prompt += `    "constraintsViolations": "制約違反の数（0を目指す）"\n`
  prompt += `  },\n`
  prompt += `  "shifts_csv": "shift_id,staff_id,staff_name,shift_date,start_time,end_time,break_minutes,total_hours\\nSFT001,STF001,田中太郎,2024-11-01,09:00,18:00,60,8.0\\n...",\n`
  prompt += `  "notes": "シフト作成時の注意点や考慮事項"\n`
  prompt += `}\n\n`
  prompt += `shifts_csvフィールドには以下の列を含むCSV形式の文字列を設定してください:\n`
  prompt += `shift_id, staff_id, staff_name, shift_date, start_time, end_time, break_minutes, total_hours\n\n`
  prompt += `重要: 応答は有効なJSONのみとし、説明文やマークダウンのコードブロック記号（\`\`\`）は含めないでください。\n\n`
  prompt += `【シフトデータの完全性について】\n`
  prompt += `- shifts_csvフィールドには${month}月の全営業日分の全シフトを含めてください（定休日は除く）\n`
  prompt += `- "..."や省略記号は絶対に使用せず、1件1件のシフトを完全に出力してください\n`
  prompt += `- 全スタッフの全シフトを省略なく出力してください（例：営業日25日×スタッフ5人なら最低125件程度）\n`
  prompt += `- 文字数制限を気にせず、全データを出力してください\n`
  prompt += `- 店舗の定休日情報を参照し、営業日のみシフトを生成してください\n`

  return prompt
}

/**
 * バリデーション結果の分析を依頼
 * @param {Object} validationResult - バリデーション結果
 * @returns {Promise<Object>} 分析結果
 */
export const analyzeValidationResult = async validationResult => {
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
    systemMessage:
      'あなたはシフト管理の専門家です。バリデーション結果を分析し、実用的な改善提案を行ってください。',
  })
}
