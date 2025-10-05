import express from 'express'
import { saveCSV } from '../services/fileService.js'

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

export default router
