import express from 'express'
import { verifyLineToken } from '../middleware/verifyLineToken.js'
import db from '../config/database.js'

const router = express.Router()
const pool = db.getPool()

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
      `SELECT s.staff_id, s.store_id
       FROM hr.staff_line_accounts sla
       JOIN hr.staff s ON sla.staff_id = s.staff_id
       WHERE sla.line_user_id = $1 AND sla.is_active = true`,
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
      `SELECT s.staff_id, s.store_id
       FROM hr.staff_line_accounts sla
       JOIN hr.staff s ON sla.staff_id = s.staff_id
       WHERE sla.line_user_id = $1 AND sla.is_active = true`,
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
        st.store_name,
        s.employment_type
       FROM hr.staff_line_accounts sla
       JOIN hr.staff s ON sla.staff_id = s.staff_id
       LEFT JOIN core.stores st ON s.store_id = st.store_id
       WHERE sla.line_user_id = $1 AND sla.is_active = true`,
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

/**
 * LINE連携状態をチェックするエンドポイント
 * GET /api/liff/check-link
 */
router.get('/check-link', verifyLineToken, async (req, res) => {
  const client = await pool.connect()

  try {
    const lineUserId = req.lineUser.userId

    // LINE User IDが連携されているかチェック
    const linkResult = await client.query(
      `SELECT
        sla.staff_line_id,
        sla.staff_id,
        sla.display_name,
        sla.linked_at,
        s.name as staff_name,
        s.store_id,
        st.store_name,
        s.employment_type
       FROM hr.staff_line_accounts sla
       JOIN hr.staff s ON sla.staff_id = s.staff_id
       JOIN core.stores st ON s.store_id = st.store_id
       WHERE sla.line_user_id = $1 AND sla.is_active = true`,
      [lineUserId]
    )

    if (linkResult.rows.length === 0) {
      return res.json({
        success: true,
        linked: false,
        message: 'LINE連携が未完了です'
      })
    }

    res.json({
      success: true,
      linked: true,
      data: linkResult.rows[0]
    })
  } catch (error) {
    console.error('LINE連携チェックエラー:', error)

    res.status(500).json({
      success: false,
      error: '連携状態の確認中にエラーが発生しました'
    })
  } finally {
    client.release()
  }
})
  /**
   * シフト希望入力期限設定を取得するエンドポイント
   * GET /api/liff/deadline-settings?tenant_id=3
   */
  router.get('/deadline-settings', async (req, res) => {
    const client = await pool.connect()

    try {
      const { tenant_id } = req.query

      // バリデーション
      if (!tenant_id) {
        return res.status(400).json({
          success: false,
          error: 'tenant_idの指定が必要です'
        })
      }

      // 期限設定を取得
      const settingsResult = await client.query(
        `SELECT
          employment_type,
          deadline_day,
          deadline_time,
          is_enabled,
          description
         FROM core.shift_deadline_settings
         WHERE tenant_id = $1
         ORDER BY employment_type`,
        [tenant_id]
      )

      res.json({
        success: true,
        data: settingsResult.rows
      })
    } catch (error) {
      console.error('期限設定取得エラー:', error)

      res.status(500).json({
        success: false,
        error: '期限設定の取得中にエラーが発生しました'
      })
    } finally {
      client.release()
    }
  })
/**
 * 新規スタッフ登録（LINE User ID紐づけ）
 * POST /api/liff/register-staff
 *
 * リクエストボディ:
 * {
 *   tenant_id: 3,
 *   store_id: 1,
 *   name: "山田太郎",
 *   staff_code: "STAFF001",
 *   employment_type: "PART_TIME",
 *   email: "yamada@example.com",
 *   phone_number: "090-1234-5678"
 * }
 */
router.post('/register-staff', verifyLineToken, async (req, res) => {
  const client = await pool.connect()

  try {
    const {
      tenant_id,
      store_id,
      role_id,
      name,
      staff_code,
      employment_type,
      email,
      phone_number
    } = req.body

    const lineUserId = req.lineUser.userId
    const displayName = req.lineUser.displayName

    // バリデーション
    if (!tenant_id || !store_id || !role_id || !name || !staff_code || !employment_type) {
      return res.status(400).json({
        success: false,
        error: '必須項目が入力されていません（tenant_id, store_id, role_id, name, staff_code, employment_type）'
      })
    }

    // 既に連携済みかチェック
    const existingLink = await client.query(
      'SELECT staff_line_id FROM hr.staff_line_accounts WHERE line_user_id = $1',
      [lineUserId]
    )

    if (existingLink.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'このLINEアカウントは既に連携されています'
      })
    }

    // スタッフコードの重複チェック
    const existingStaff = await client.query(
      'SELECT staff_id FROM hr.staff WHERE tenant_id = $1 AND staff_code = $2',
      [tenant_id, staff_code]
    )

    if (existingStaff.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'このスタッフコードは既に使用されています'
      })
    }

    // トランザクション開始
    await client.query('BEGIN')

    // 1. hr.staffテーブルにスタッフを登録
    const staffResult = await client.query(
      `INSERT INTO hr.staff (
        tenant_id,
        store_id,
        role_id,
        staff_code,
        name,
        email,
        phone_number,
        employment_type,
        hire_date,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING staff_id`,
      [tenant_id, store_id, role_id, staff_code, name, email, phone_number, employment_type]
    )

    const staffId = staffResult.rows[0].staff_id

    // 2. hr.staff_line_accountsテーブルにLINE連携を登録
    await client.query(
      `INSERT INTO hr.staff_line_accounts (
        tenant_id,
        staff_id,
        line_user_id,
        display_name,
        linked_at,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [tenant_id, staffId, lineUserId, displayName]
    )

    // コミット
    await client.query('COMMIT')

    res.json({
      success: true,
      message: 'スタッフ登録とLINE連携が完了しました',
      data: {
        staff_id: staffId,
        name,
        staff_code,
        line_user_id: lineUserId
      }
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('スタッフ登録エラー:', error)

    res.status(500).json({
      success: false,
      error: 'スタッフ登録中にエラーが発生しました'
    })
  } finally {
    client.release()
  }
})

export default router
