import express from 'express'
import { query } from '../config/database.js'
import { openai } from '../services/openaiService.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

const router = express.Router()

/**
 * DBから最新データを取得してVector Storeにアップロード
 */
router.post('/setup', async (req, res) => {
  try {
    const { tenantId, storeId } = req.body

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantIdが必要です' })
    }

    const tempFiles = []

    try {
      // 1. Vector Store作成
      const vectorStore = await openai.vectorStores.create({
        name: `Shift Data - Tenant ${tenantId} - Store ${storeId || 'All'}`,
      })

      // 2. 各マスターデータをDBから取得してJSONファイルに変換
      const dataQueries = [
        {
          name: 'labor_law_constraints',
          query: `SELECT * FROM ops.labor_law_constraints WHERE tenant_id = $1`,
          params: [tenantId],
        },
        {
          name: 'labor_management_rules',
          query: `SELECT * FROM ops.labor_management_rules WHERE tenant_id = $1`,
          params: [tenantId],
        },
        {
          name: 'shift_validation_rules',
          query: `SELECT * FROM ops.shift_validation_rules WHERE tenant_id = $1`,
          params: [tenantId],
        },
        {
          name: 'stores',
          query: `SELECT * FROM core.stores WHERE tenant_id = $1`,
          params: [tenantId],
        },
        {
          name: 'store_constraints',
          query: `SELECT * FROM ops.store_constraints WHERE tenant_id = $1`,
          params: [tenantId],
        },
        {
          name: 'staff',
          query: `SELECT * FROM hr.staff WHERE tenant_id = $1`,
          params: [tenantId],
        },
        {
          name: 'staff_skills',
          query: `SELECT * FROM hr.staff_skills WHERE tenant_id = $1`,
          params: [tenantId],
        },
        {
          name: 'staff_certifications',
          query: `SELECT * FROM hr.staff_certifications WHERE tenant_id = $1`,
          params: [tenantId],
        },
        {
          name: 'shift_patterns',
          query: `SELECT * FROM core.shift_patterns WHERE tenant_id = $1`,
          params: [tenantId],
        },
        {
          name: 'shift_preferences',
          query: `SELECT * FROM ops.shift_preferences WHERE tenant_id = $1`,
          params: [tenantId],
        },
        {
          name: 'shift_history',
          query: `SELECT * FROM ops.shifts WHERE tenant_id = $1 ORDER BY shift_date DESC LIMIT 1000`,
          params: [tenantId],
        },
      ]

      const fileIds = []

      // 3. 各データをJSON形式でファイルに書き出してアップロード
      for (const { name, query: sql, params } of dataQueries) {
        const result = await query(sql, params)

        // JSONファイルとして一時保存
        const tempFilePath = path.join(os.tmpdir(), `${name}_${Date.now()}.json`)
        fs.writeFileSync(tempFilePath, JSON.stringify(result.rows, null, 2))
        tempFiles.push(tempFilePath)

        // OpenAIにアップロード
        const file = await openai.files.create({
          file: fs.createReadStream(tempFilePath),
          purpose: 'assistants',
        })

        fileIds.push(file.id)

        // Vector Storeにファイルを追加
        await openai.vectorStores.files.create(vectorStore.id, {
          file_id: file.id,
        })

        console.log(`✅ ${name}.json をVector Storeに追加しました (${result.rows.length}件)`)
      }

      res.json({
        success: true,
        vectorStoreId: vectorStore.id,
        filesUploaded: fileIds.length,
      })
    } finally {
      // 一時ファイルを削除
      tempFiles.forEach(file => {
        try {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file)
          }
        } catch (error) {
          console.error(`一時ファイル削除エラー: ${file}`, error)
        }
      })
    }
  } catch (error) {
    console.error('Vector Storeセットアップエラー:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
