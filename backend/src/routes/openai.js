import express from 'express'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { openai, getOpenAIHeaders, OPENAI_API_BASE } from '../services/openaiService.js'
import { convertCSVToJSON, deleteTempFile } from '../services/fileService.js'
import { appendLog } from '../utils/logger.js'
import { query } from '../config/database.js'

const router = express.Router()

// 1. ChatGPT API (Chat Completions)
router.post('/chat/completions', async (req, res) => {
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
router.post('/vector_stores', async (req, res) => {
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
router.post('/files', async (req, res) => {
  try {
    const { filePath } = req.body
    const { tempFilePath, jsonFileName } = convertCSVToJSON(filePath)

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
      deleteTempFile(tempFilePath)
    }
  } catch (error) {
    appendLog(`❌ ファイルアップロードエラー: ${error.message}`)
    res.status(500).json({ error: error.message })
  }
})

// 4. Vector StoreにFile追加
router.post('/vector_stores/:vectorStoreId/files', async (req, res) => {
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
router.post('/assistants', async (req, res) => {
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
router.post('/threads', async (req, res) => {
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
router.post('/threads/:threadId/messages', async (req, res) => {
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
router.post('/threads/:threadId/runs', async (req, res) => {
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
router.get('/threads/:threadId/runs/:runId', async (req, res) => {
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
router.get('/threads/:threadId/messages', async (req, res) => {
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
router.get('/files/:fileId/content', async (req, res) => {
  try {
    const { fileId } = req.params
    const response = await fetch(`${OPENAI_API_BASE}/files/${fileId}/content`, {
      method: 'GET',
      headers: getOpenAIHeaders()
    })
    const content = await response.text()
    res.status(response.status).send(content)
  } catch (error) {
    console.error('Fileダウンロードエラー:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
