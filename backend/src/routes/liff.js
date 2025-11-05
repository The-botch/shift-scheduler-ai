import express from 'express'
import { verifyLineToken } from '../middleware/verifyLineToken.js'
import pool from '../config/database.js'

const router = express.Router()

/**
 * スタッフのシフト希望を登録するエンドポイント
 * POST /api/liff/shift-request
 *
 * リクエストボディ:
 * {
 *   shift_dates: [
 *     { date: "2025-11-01", start_time: "09:00", end_time: "18:00" },
 *     { date: "2025-11-02", start_time: "09:00", end_time: "18:00" }
 *   ]
 * }
 */
router.post('/shift-request', verifyLineToken, async (req, res) => {
  const client = await pool.connect()

  try {
    const { shift_dates } = req.body
    const lineUserId = req.lineUser.userId

    // バリデーション
    if (!shift_dates || !Array.isArray(shift_dates) || shift_dates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'シフト日付データが不正です'
      })
    }

    // LINE User IDからスタッフ情報を取得
    const staffResult = await client.query(
      'SELECT staff_id, store_id FROM hr.staff WHERE line_user_id = $1',
      [lineUserId]
    )

    if (staffResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'スタッフ情報が見つかりません。管理者にお問い合わせください。'
      })
    }

    const { staff_id, store_id } = staffResult.rows[0]

    // トランザクション開始
    await client.query('BEGIN')

    const insertedShifts = []

    // 各日付のシフト希望を登録
    for (const shiftData of shift_dates) {
      const { date, start_time, end_time } = shiftData

      // バリデーション
      if (!date || !start_time || !end_time) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          success: false,
          error: '日付または時間が不正です'
        })
      }

      // 既存のシフト希望をチェック（同じ日付・スタッフの希望がある場合は上書き）
      const existingShift = await client.query(
        `SELECT shift_id FROM ops.shifts
         WHERE staff_id = $1
         AND date = $2
         AND status = 'requested'`,
        [staff_id, date]
      )

      if (existingShift.rows.length > 0) {
        // 既存の希望を更新
        await client.query(
          `UPDATE ops.shifts
           SET start_time = $1, end_time = $2, updated_at = CURRENT_TIMESTAMP
           WHERE shift_id = $3`,
          [start_time, end_time, existingShift.rows[0].shift_id]
        )

        insertedShifts.push({
          shift_id: existingShift.rows[0].shift_id,
          date,
          start_time,
          end_time,
          action: 'updated'
        })
      } else {
        // 新規希望を登録
        const insertResult = await client.query(
          `INSERT INTO ops.shifts
           (staff_id, store_id, date, start_time, end_time, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'requested', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING shift_id`,
          [staff_id, store_id, date, start_time, end_time]
        )

        insertedShifts.push({
          shift_id: insertResult.rows[0].shift_id,
          date,
          start_time,
          end_time,
          action: 'created'
        })
      }
    }

    // コミット
    await client.query('COMMIT')

    res.json({
      success: true,
      message: `${shift_dates.length}日分のシフト希望を登録しました`,
      data: {
        staff_id,
        store_id,
        shifts: insertedShifts
      }
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('シフト希望登録エラー:', error)

    res.status(500).json({
      success: false,
      error: 'シフト希望の登録中にエラーが発生しました'
    })
  } finally {
    client.release()
  }
})

/**
 * スタッフの登録済みシフト希望を取得するエンドポイント
 * GET /api/liff/shift-request?year=2025&month=11
 */
router.get('/shift-request', verifyLineToken, async (req, res) => {
  const client = await pool.connect()

  try {
    const { year, month } = req.query
    const lineUserId = req.lineUser.userId

    // バリデーション
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: '年月の指定が必要です'
      })
    }

    // LINE User IDからスタッフ情報を取得
    const staffResult = await client.query(
      'SELECT staff_id, store_id FROM hr.staff WHERE line_user_id = $1',
      [lineUserId]
    )

    if (staffResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'スタッフ情報が見つかりません'
      })
    }

    const { staff_id, store_id } = staffResult.rows[0]

    // 指定月のシフト希望を取得
    const shiftsResult = await client.query(
      `SELECT
        shift_id,
        date,
        start_time,
        end_time,
        status,
        created_at,
        updated_at
       FROM ops.shifts
       WHERE staff_id = $1
       AND EXTRACT(YEAR FROM date) = $2
       AND EXTRACT(MONTH FROM date) = $3
       ORDER BY date ASC`,
      [staff_id, year, month]
    )

    res.json({
      success: true,
      data: {
        staff_id,
        store_id,
        year: parseInt(year),
        month: parseInt(month),
        shifts: shiftsResult.rows
      }
    })
  } catch (error) {
    console.error('シフト希望取得エラー:', error)

    res.status(500).json({
      success: false,
      error: 'シフト希望の取得中にエラーが発生しました'
    })
  } finally {
    client.release()
  }
})

/**
 * スタッフ情報を取得するエンドポイント
 * GET /api/liff/staff-info
 */
router.get('/staff-info', verifyLineToken, async (req, res) => {
  const client = await pool.connect()

  try {
    const lineUserId = req.lineUser.userId

    // LINE User IDからスタッフ情報を取得
    const staffResult = await client.query(
      `SELECT
        s.staff_id,
        s.name,
        s.store_id,
        st.name as store_name,
        s.weekly_hours_limit,
        s.monthly_hours_limit,
        s.health_insurance,
        s.employment_insurance
       FROM hr.staff s
       LEFT JOIN core.stores st ON s.store_id = st.store_id
       WHERE s.line_user_id = $1`,
      [lineUserId]
    )

    if (staffResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'スタッフ情報が見つかりません'
      })
    }

    res.json({
      success: true,
      data: staffResult.rows[0]
    })
  } catch (error) {
    console.error('スタッフ情報取得エラー:', error)

    res.status(500).json({
      success: false,
      error: 'スタッフ情報の取得中にエラーが発生しました'
    })
  } finally {
    client.release()
  }
})

export default router
