import express from 'express'

const router = express.Router()

// OpenAI クライアントはcontrollerから注入される
let openai = null
let config = null

export function initializeRoutes(openaiClient, appConfig) {
  openai = openaiClient
  config = appConfig
}

// ChatGPT API (Chat Completions)
router.post('/chat/completions', async (req, res) => {
  try {
    const response = await fetch(`${config.OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: config.getOpenAIHeaders(),
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Vector Store作成
router.post('/vector_stores', async (req, res) => {
  try {
    const { name } = req.body
    const vectorStore = await openai.beta.vectorStores.create({ name })
    res.json(vectorStore)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ファイルアップロード
router.post('/files', async (req, res) => {
  try {
    const { filePath } = req.body
    const file = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: 'assistants'
    })
    res.json(file)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Assistant作成
router.post('/assistants', async (req, res) => {
  try {
    const assistant = await openai.beta.assistants.create(req.body)
    res.json(assistant)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
