import express from 'express'
import db from '../config/database.js'

const router = express.Router()

// テナント一覧取得
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        tenant_id,
        tenant_code,
        tenant_name,
        contract_plan,
        contract_start_date,
        contract_end_date,
        is_active
      FROM core.tenants
      WHERE is_active = true
      ORDER BY tenant_id
    `)

    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('テナント一覧取得エラー:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// 特定のテナント情報取得
router.get('/:tenant_id', async (req, res) => {
  try {
    const { tenant_id } = req.params

    const result = await db.query(
      `
      SELECT
        tenant_id,
        tenant_code,
        tenant_name,
        contract_plan,
        contract_start_date,
        contract_end_date,
        is_active
      FROM core.tenants
      WHERE tenant_id = $1
    `,
      [tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'テナントが見つかりません',
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('テナント情報取得エラー:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

export default router
