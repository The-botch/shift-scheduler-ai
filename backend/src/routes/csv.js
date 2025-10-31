import express from 'express'
import { saveCSV, loadCSV } from '../services/fileService.js'

const router = express.Router()

// CSVファイル保存エンドポイント
router.post('/save-csv', async (req, res) => {
  try {
    const { filename, content } = req.body

    if (!filename || !content) {
      return res.status(400).json({ error: 'filename and content are required' })
    }

    const result = await saveCSV(filename, content)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// CSVファイル読み込みエンドポイント
router.get('/load-csv', async (req, res) => {
  try {
    const { path } = req.query

    if (!path) {
      return res.status(400).json({ error: 'path parameter is required' })
    }

    const data = loadCSV(path)
    res.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('CSV読み込みエラー:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
