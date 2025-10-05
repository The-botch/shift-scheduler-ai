/**
 * OpenAI Assistants API v2 クライアント（バックエンド経由）
 * File Search（Vector Store）を使って固定データを参照
 */

const BACKEND_API_URL = 'http://localhost:3001'

/**
 * Vector Storeを作成（初回のみ）
 * @param {string} storeId - 店舗ID
 * @returns {Promise<Object>} Vector Store情報
 */
export const createVectorStore = async storeId => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/openai/vector_stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `shift-scheduler-${storeId}`,
        metadata: {
          storeId,
          type: 'master_data',
          createdAt: new Date().toISOString(),
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Vector Store作成失敗: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Vector Store作成エラー:', error)
    throw error
  }
}

/**
 * ファイルをOpenAIにアップロード
 * @param {string} filePath - CSVファイルのパス
 * @returns {Promise<Object>} アップロードされたファイル情報
 */
export const uploadFile = async filePath => {
  try {
    // バックエンド経由でファイルをアップロード
    const response = await fetch(`${BACKEND_API_URL}/api/openai/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
    })

    if (!response.ok) {
      throw new Error(`ファイルアップロード失敗: ${filePath}`)
    }

    return await response.json()
  } catch (error) {
    console.error('ファイルアップロードエラー:', error)
    throw error
  }
}

/**
 * Vector Storeにファイルを追加
 * @param {string} vectorStoreId - Vector Store ID
 * @param {string} fileId - アップロード済みファイルID
 * @returns {Promise<Object>} 追加結果
 */
export const addFileToVectorStore = async (vectorStoreId, fileId) => {
  try {
    const response = await fetch(
      `${BACKEND_API_URL}/api/openai/vector_stores/${vectorStoreId}/files`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_id: fileId }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        `Vector Storeへのファイル追加失敗: ${error.error?.message || response.statusText}`
      )
    }

    return await response.json()
  } catch (error) {
    console.error('Vector Storeへのファイル追加エラー:', error)
    throw error
  }
}

/**
 * Vector Storeに固定マスターデータをセットアップ
 * @param {string} storeId - 店舗ID
 * @param {Function} onProgress - 進捗コールバック(message, current, total)
 * @returns {Promise<string>} Vector Store ID
 */
export const setupVectorStore = async (storeId, onProgress) => {
  try {
    // 固定CSVファイル一覧
    const files = [
      '/data/master/labor_law_constraints.csv',
      '/data/master/labor_management_rules.csv',
      '/data/master/shift_validation_rules.csv',
      '/data/master/stores.csv',
      '/data/master/store_constraints.csv',
      '/data/master/staff.csv',
      '/data/master/staff_skills.csv',
      '/data/master/staff_certifications.csv',
      '/data/history/shift_history_2023-2024.csv',
      '/data/history/shift_monthly_summary.csv',
    ]

    const total = files.length + 1 // +1 for Vector Store creation

    // 1. Vector Store作成
    onProgress?.('Vector Storeを作成中...', 1, total)
    const vectorStore = await createVectorStore(storeId)

    // 2. ファイルを順次アップロード＆追加
    for (let i = 0; i < files.length; i++) {
      const filePath = files[i]
      const fileName = filePath.split('/').pop()

      onProgress?.(`${fileName}をアップロード中...`, i + 2, total)

      const uploadedFile = await uploadFile(filePath)
      await addFileToVectorStore(vectorStore.id, uploadedFile.id)
    }

    onProgress?.('セットアップ完了！', total, total)

    return vectorStore.id
  } catch (error) {
    console.error('Vector Storeセットアップエラー:', error)
    throw error
  }
}

/**
 * Assistantを作成または取得
 * @param {string} vectorStoreId - Vector Store ID
 * @returns {Promise<Object>} Assistant情報
 */
export const createAssistant = async vectorStoreId => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/openai/assistants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Shift Scheduler Assistant',
        instructions: `あなたはシフト管理の専門家です。以下の手順でシフトデータを生成してください。

【重要: この指示に厳密に従ってください】
1. File Searchツールで必要なデータを取得
2. Code Interpreterツールでシフト生成PythonコードをSILENTLYに実行（説明不要）
3. CSVファイルを生成・添付
4. 最後にJSONサマリーを出力

---

【ステップ1: File SearchでJSONデータと制約を取得】
file_searchツールで以下のJSONファイルを検索：
- "staff.json" → スタッフ情報（staff_id, name, is_active, min_hours_per_week, max_hours_per_week）
- "stores.json" → 店舗情報（定休日）
- "shift_history_2023-2024.json" → 過去のシフトフォーマット
- "shift_validation_rules.json" → バリデーションルール（**必ず読んで遵守**）
- "labor_law_constraints.json" → 労働基準法の制約（**必ず遵守**）
- "labor_management_rules.json" → 労務管理ルール（**必ず遵守**）

**重要: すべてのデータはJSON形式で提供されています。制約情報を全て読み、シフト生成時に厳守してください。制約違反は絶対に避けてください。**

【ステップ2: Code Interpreterで制約を守りながらシフトを生成】
以下のPythonコードを実行（**説明は不要、コード実行のみ**）：

import pandas as pd
import calendar
from datetime import datetime

# 1. データ読み込み（File Searchで取得した情報を使用）
# 2. 対象月の営業日を計算（定休日除外）
# 3. 全営業日×全アクティブスタッフのシフトを生成
# 4. 以下18カラムのCSVを作成：
#    shift_id, year, month, date, day_of_week, staff_id, staff_name,
#    start_time, end_time, break_minutes, actual_hours, role,
#    hourly_rate, daily_wage, status, modified_flag, modified_by, notes
# 5. ファイル保存: shift_YYYY_MM.csv

【必ず守るべき制約】
- **制約ファイルに記載された全てのルールを厳守する**（労働基準法、バリデーションルール、労務管理ルール）
- is_active=TRUEの全スタッフをバランス良く配置（10名全員を使う）
- 同じスタッフが連続で何日も勤務しないようにローテーションを組む
- 各営業日のシフトメンバーを多様化する（毎日同じメンバーにしない）
- staff_idは数値のみ（文字列禁止）
- 省略（...）禁止、全件出力
- 定休日除外
- min/max労働時間を考慮
- 営業日は漏れなく全てカバーする

【ステップ3: 出力形式】
**プロセス説明は不要です。以下のみ出力してください：**

1. CSVファイルを添付
2. 以下のJSON形式でサマリーを出力：

\`\`\`json
{
  "summary": {
    "year": 2024,
    "month": 11,
    "totalShifts": 150,
    "totalStaff": 8,
    "totalWorkHours": 1200.0,
    "estimatedCost": 800000,
    "constraintsViolations": 0
  },
  "notes": "シフト生成の注意点"
}
\`\`\`

**繰り返し: ステップバイステップの説明は不要です。CSVファイルとJSONサマリーのみ出力してください。**`,
        model: 'gpt-4o',
        tools: [{ type: 'file_search' }, { type: 'code_interpreter' }],
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId],
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Assistant作成失敗: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Assistant作成エラー:', error)
    throw error
  }
}

/**
 * Threadを作成
 * @returns {Promise<Object>} Thread情報
 */
export const createThread = async () => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/openai/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Thread作成失敗: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Thread作成エラー:', error)
    throw error
  }
}

/**
 * Threadにメッセージを追加
 * @param {string} threadId - Thread ID
 * @param {string} content - メッセージ内容
 * @returns {Promise<Object>} メッセージ情報
 */
export const addMessage = async (threadId, content) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/openai/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'user',
        content,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`メッセージ追加失敗: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('メッセージ追加エラー:', error)
    throw error
  }
}

/**
 * Runを実行
 * @param {string} threadId - Thread ID
 * @param {string} assistantId - Assistant ID
 * @returns {Promise<Object>} Run情報
 */
export const createRun = async (threadId, assistantId) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/openai/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        max_completion_tokens: 16000, // 最大16000トークンまで出力可能
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Run実行失敗: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Run実行エラー:', error)
    throw error
  }
}

/**
 * Runの状態を取得
 * @param {string} threadId - Thread ID
 * @param {string} runId - Run ID
 * @returns {Promise<Object>} Run状態
 */
export const getRunStatus = async (threadId, runId) => {
  try {
    const response = await fetch(
      `${BACKEND_API_URL}/api/openai/threads/${threadId}/runs/${runId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Run状態取得失敗: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Run状態取得エラー:', error)
    throw error
  }
}

/**
 * Threadのメッセージ一覧を取得
 * @param {string} threadId - Thread ID
 * @returns {Promise<Object>} メッセージ一覧
 */
export const getMessages = async threadId => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/openai/threads/${threadId}/messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`メッセージ取得失敗: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('メッセージ取得エラー:', error)
    throw error
  }
}

/**
 * ファイルの内容を取得
 * @param {string} fileId - ファイルID
 * @returns {Promise<string>} ファイルの内容（テキスト）
 */
export const downloadFile = async fileId => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/openai/files/${fileId}/content`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`ファイルダウンロード失敗: ${error.error?.message || response.statusText}`)
    }

    return await response.text()
  } catch (error) {
    console.error('ファイルダウンロードエラー:', error)
    throw error
  }
}

/**
 * Assistants APIでシフト生成（メイン関数）
 * @param {Object} params - パラメータ
 * @param {number} params.year - 対象年
 * @param {number} params.month - 対象月
 * @param {string} params.vectorStoreId - Vector Store ID
 * @param {string} params.assistantId - Assistant ID（オプション）
 * @param {Array<string>} params.additionalConstraints - 追加制約
 * @param {string} params.customPrompt - カスタムプロンプト（オプション、指定された場合はadditionalConstraintsを無視）
 * @param {Function} params.onProgress - 進捗コールバック
 * @returns {Promise<Object>} 生成結果
 */
export const generateShiftWithAssistant = async params => {
  const {
    year,
    month,
    vectorStoreId,
    assistantId: existingAssistantId,
    additionalConstraints = [],
    customPrompt,
    onProgress,
  } = params

  try {
    // 1. Assistant作成または再利用
    onProgress?.('Assistantを準備中...')
    const assistant = existingAssistantId
      ? { id: existingAssistantId }
      : await createAssistant(vectorStoreId)

    // 2. Thread作成
    onProgress?.('会話を開始中...')
    const thread = await createThread()

    // 3. プロンプトを作成（customPromptが必須）
    const prompt = customPrompt
    if (!prompt) {
      throw new Error(
        'customPromptが指定されていません。プロンプトは呼び出し側で生成してください。'
      )
    }

    // 4. メッセージ追加
    onProgress?.('プロンプト送信中...')
    await addMessage(thread.id, prompt)

    // 5. Run実行
    onProgress?.('AI推論中...')
    const run = await createRun(thread.id, assistant.id)

    // 6. Run完了待ち（ポーリング）
    let runStatus = run
    let pollCount = 0
    const maxPolls = 300 // 最大300秒（5分）待機

    while (
      runStatus.status !== 'completed' &&
      runStatus.status !== 'failed' &&
      pollCount < maxPolls
    ) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await getRunStatus(thread.id, run.id)
      pollCount++
      onProgress?.(`AI推論中... (${pollCount}秒)`)
    }

    if (runStatus.status === 'failed') {
      throw new Error(`Run失敗: ${runStatus.last_error?.message || '不明なエラー'}`)
    }

    if (pollCount >= maxPolls) {
      throw new Error('タイムアウト: AI応答が300秒（5分）以内に完了しませんでした')
    }

    // 7. 応答取得
    onProgress?.('応答を取得中...')
    const messages = await getMessages(thread.id)
    const assistantMessage = messages.data[0]

    // 8. Code Interpreterで生成されたファイルを抽出
    let csvContent = null
    const textContent = assistantMessage.content.find(c => c.type === 'text')
    const textValue = textContent?.text?.value || ''

    // Code Interpreterで生成されたファイルをチェック
    if (assistantMessage.attachments && assistantMessage.attachments.length > 0) {
      onProgress?.('生成されたCSVファイルをダウンロード中...')

      for (const attachment of assistantMessage.attachments) {
        if (attachment.tools && attachment.tools.some(t => t.type === 'code_interpreter')) {
          // CSVファイルをダウンロード
          const fileId = attachment.file_id
          csvContent = await downloadFile(fileId)
          console.log(`CSVファイル (${fileId}) をダウンロードしました`)
          break // 最初のCSVファイルのみ取得
        }
      }
    }

    // 9. テキスト応答からJSON部分を抽出（サマリー情報）
    let summaryJson = null
    try {
      // 複数のパターンでJSONブロックを抽出
      let jsonMatch = null

      // パターン1: ```json ... ``` 形式
      jsonMatch = textValue.match(/```json\s*([\s\S]*?)\s*```/)

      // パターン2: ``` ... ``` 形式（jsonキーワードなし）
      if (!jsonMatch) {
        jsonMatch = textValue.match(/```\s*(\{[\s\S]*?\})\s*```/)
      }

      // パターン3: { ... } 形式（最後のJSON）
      if (!jsonMatch) {
        const matches = textValue.match(/\{[\s\S]*?\}/g)
        if (matches && matches.length > 0) {
          jsonMatch = [null, matches[matches.length - 1]] // 最後のJSONを使用
        }
      }

      if (jsonMatch && jsonMatch[1]) {
        summaryJson = JSON.parse(jsonMatch[1].trim())
        console.log('✅ JSONサマリーを抽出しました:', summaryJson)
      } else {
        console.warn('⚠️ JSON形式のサマリーが見つかりませんでした')
      }
    } catch (error) {
      console.warn('⚠️ サマリーJSONのパースに失敗:', error.message)
      console.log('応答テキスト（先頭500文字）:', textValue.substring(0, 500))
    }

    return {
      success: true,
      message: textValue,
      csvContent, // 生成されたCSVファイルの内容
      summary: summaryJson, // パースされたサマリー情報
      citations: textContent?.text?.annotations || [],
      assistantId: assistant.id,
      threadId: thread.id,
    }
  } catch (error) {
    console.error('シフト生成エラー:', error)
    return {
      success: false,
      error: error.message,
      message: `エラーが発生しました: ${error.message}`,
    }
  }
}
