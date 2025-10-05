import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import Papa from 'papaparse'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

// OpenAI API設定
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY
const OPENAI_API_BASE = 'https://api.openai.com/v1'
const ASSISTANTS_BETA_HEADER = 'assistants=v2'

// OpenAI SDK初期化
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
})

// ログファイルパス
const LOG_FILE = path.join(__dirname, 'server.log')

// ログ出力ヘルパー関数
function appendLog(message) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${message}\n`
  fs.appendFileSync(LOG_FILE, logEntry, 'utf-8')
  console.log(message)
}

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// CSVファイル保存エンドポイント
app.post('/api/save-csv', (req, res) => {
  try {
    const { filename, content } = req.body

    if (!filename || !content) {
      return res.status(400).json({ error: 'filename and content are required' })
    }

    const generatedDir = path.join(__dirname, '../../frontend/public', 'data', 'generated')

    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true })
    }

    const filepath = path.join(generatedDir, filename)
    fs.writeFileSync(filepath, content, 'utf-8')

    appendLog(`✅ CSVファイルを保存しました: ${filepath}`)

    res.json({
      success: true,
      message: 'File saved successfully',
      filepath: `/data/generated/${filename}`
    })
  } catch (error) {
    appendLog(`❌ CSVファイル保存エラー: ${error.message}`)
    res.status(500).json({ error: error.message })
  }
})

// ========================================
// OpenAI API Proxy Endpoints
// ========================================

// Helper: OpenAI APIヘッダー
const getOpenAIHeaders = (includeContentType = true) => {
  const headers = {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'OpenAI-Beta': ASSISTANTS_BETA_HEADER
  }
  if (includeContentType) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

// 1. ChatGPT API (Chat Completions)
app.post('/api/openai/chat/completions', async (req, res) => {
  try {
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: getOpenAIHeaders(),
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('ChatGPT API Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 2. Vector Store作成
app.post('/api/openai/vector_stores', async (req, res) => {
  try {
    const response = await fetch(`${OPENAI_API_BASE}/vector_stores`, {
      method: 'POST',
      headers: getOpenAIHeaders(),
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Vector Store作成エラー:', error)
    res.status(500).json({ error: error.message })
  }
})

// 3. ファイルアップロード（OpenAI SDK使用、CSV→JSON変換）
app.post('/api/openai/files', async (req, res) => {
  try {
    const { filePath } = req.body

    // CSVファイルをローカルファイルシステムから読み込む
    const fullPath = path.join(__dirname, '../../frontend/public', filePath)

    appendLog(`ファイルアップロード試行: ${fullPath}`)

    if (!fs.existsSync(fullPath)) {
      throw new Error(`ファイルが見つかりません: ${fullPath}`)
    }

    const originalFileName = filePath.split('/').pop()
    const jsonFileName = originalFileName.replace(/\.csv$/, '.json')

    // CSVを読み込んでPapaparseでJSONに変換
    const csvContent = fs.readFileSync(fullPath, 'utf-8')
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    })

    const jsonData = parseResult.data

    // 一時的にJSON拡張子のファイルを作成
    const tempDir = path.join(__dirname, 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const tempFilePath = path.join(tempDir, jsonFileName)
    fs.writeFileSync(tempFilePath, JSON.stringify(jsonData, null, 2), 'utf-8')

    try {
      // OpenAI SDKを使ってファイルアップロード（.json拡張子で）
      const file = await openai.files.create({
        file: fs.createReadStream(tempFilePath),
        purpose: 'assistants'
      })

      appendLog(`✅ ファイルアップロード成功: ${jsonFileName} → ${file.id}`)

      res.json(file)
    } finally {
      // 一時ファイルを削除
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
    }
  } catch (error) {
    appendLog(`❌ ファイルアップロードエラー: ${error.message}`)
    res.status(500).json({ error: error.message })
  }
})

// 4. Vector StoreにFile追加
app.post('/api/openai/vector_stores/:vectorStoreId/files', async (req, res) => {
  try {
    const { vectorStoreId } = req.params
    const response = await fetch(`${OPENAI_API_BASE}/vector_stores/${vectorStoreId}/files`, {
      method: 'POST',
      headers: getOpenAIHeaders(),
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Vector StoreへのFile追加エラー:', error)
    res.status(500).json({ error: error.message })
  }
})

// 5. Assistant作成
app.post('/api/openai/assistants', async (req, res) => {
  try {
    const response = await fetch(`${OPENAI_API_BASE}/assistants`, {
      method: 'POST',
      headers: getOpenAIHeaders(),
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Assistant作成エラー:', error)
    res.status(500).json({ error: error.message })
  }
})

// 6. Thread作成
app.post('/api/openai/threads', async (req, res) => {
  try {
    const response = await fetch(`${OPENAI_API_BASE}/threads`, {
      method: 'POST',
      headers: getOpenAIHeaders(),
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Thread作成エラー:', error)
    res.status(500).json({ error: error.message })
  }
})

// 7. Message追加
app.post('/api/openai/threads/:threadId/messages', async (req, res) => {
  try {
    const { threadId } = req.params
    const response = await fetch(`${OPENAI_API_BASE}/threads/${threadId}/messages`, {
      method: 'POST',
      headers: getOpenAIHeaders(),
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Message追加エラー:', error)
    res.status(500).json({ error: error.message })
  }
})

// 8. Run実行
app.post('/api/openai/threads/:threadId/runs', async (req, res) => {
  try {
    const { threadId } = req.params
    const response = await fetch(`${OPENAI_API_BASE}/threads/${threadId}/runs`, {
      method: 'POST',
      headers: getOpenAIHeaders(),
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Run実行エラー:', error)
    res.status(500).json({ error: error.message })
  }
})

// 9. Run状態取得
app.get('/api/openai/threads/:threadId/runs/:runId', async (req, res) => {
  try {
    const { threadId, runId } = req.params
    const response = await fetch(`${OPENAI_API_BASE}/threads/${threadId}/runs/${runId}`, {
      method: 'GET',
      headers: getOpenAIHeaders()
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Run状態取得エラー:', error)
    res.status(500).json({ error: error.message })
  }
})

// 10. Message一覧取得
app.get('/api/openai/threads/:threadId/messages', async (req, res) => {
  try {
    const { threadId } = req.params
    const response = await fetch(`${OPENAI_API_BASE}/threads/${threadId}/messages`, {
      method: 'GET',
      headers: getOpenAIHeaders()
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Message一覧取得エラー:', error)
    res.status(500).json({ error: error.message })
  }
})

// 11. Fileダウンロード
app.get('/api/openai/files/:fileId/content', async (req, res) => {
  try {
    const { fileId } = req.params
    const response = await fetch(`${OPENAI_API_BASE}/files/${fileId}/content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': ASSISTANTS_BETA_HEADER
      }
    })
    const content = await response.text()
    res.status(response.status).send(content)
  } catch (error) {
    console.error('Fileダウンロードエラー:', error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  const startupMsg = `🚀 Backend server running on http://localhost:${PORT}`
  const proxyMsg = `📡 OpenAI API Proxy enabled`

  console.log(startupMsg)
  console.log(proxyMsg)

  appendLog(startupMsg)
  appendLog(proxyMsg)
  appendLog('=====================================')
})
