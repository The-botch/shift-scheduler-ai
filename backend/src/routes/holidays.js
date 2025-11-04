/**
 * 祝日API
 * 日本の祝日データを提供
 */

import express from 'express'

const router = express.Router()

// 祝日データのキャッシュ（メモリ内）
let holidaysCache = {}
let cacheTimestamp = 0
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24時間

/**
 * 内閣府の祝日CSVをフェッチして解析
 * https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv
 */
async function fetchHolidaysFromGovernment() {
  try {
    const response = await fetch('https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv')

    if (!response.ok) {
      throw new Error(`Failed to fetch holidays: ${response.status}`)
    }

    // Shift-JISでエンコードされたCSVをデコード
    const arrayBuffer = await response.arrayBuffer()
    const decoder = new TextDecoder('shift-jis')
    const csvText = decoder.decode(arrayBuffer)
    const lines = csvText.split('\n').slice(1) // ヘッダー行をスキップ

    const holidays = {}

    lines.forEach(line => {
      if (!line.trim()) return

      const [dateStr, name] = line.split(',')
      if (!dateStr || !name) return

      // 日付をパース (YYYY/MM/DD形式)
      const [year, month, day] = dateStr.split('/').map(Number)

      if (!year || !month || !day) return

      // 年ごとに整理
      if (!holidays[year]) {
        holidays[year] = {}
      }
      if (!holidays[year][month]) {
        holidays[year][month] = []
      }

      holidays[year][month].push({
        day,
        name: name.trim().replace(/"/g, '') // ダブルクォートを削除
      })
    })

    return holidays
  } catch (error) {
    console.error('祝日データ取得エラー:', error)
    throw error
  }
}

/**
 * 祝日データを取得（キャッシュ付き）
 */
async function getHolidays() {
  const now = Date.now()

  // キャッシュが有効な場合はキャッシュを返す
  if (cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION) && Object.keys(holidaysCache).length > 0) {
    return holidaysCache
  }

  // キャッシュが無効な場合は新たに取得
  try {
    holidaysCache = await fetchHolidaysFromGovernment()
    cacheTimestamp = now
    return holidaysCache
  } catch (error) {
    // エラー時はフォールバック（最低限の祝日）
    console.error('祝日データ取得失敗、フォールバックデータを使用')
    return getFallbackHolidays()
  }
}

/**
 * フォールバックの祝日データ（政府APIが利用できない場合）
 */
function getFallbackHolidays() {
  return {
    2024: {
      1: [{ day: 1, name: '元日' }, { day: 8, name: '成人の日' }],
      2: [{ day: 11, name: '建国記念の日' }, { day: 12, name: '振替休日' }, { day: 23, name: '天皇誕生日' }],
      3: [{ day: 20, name: '春分の日' }],
      4: [{ day: 29, name: '昭和の日' }],
      5: [{ day: 3, name: '憲法記念日' }, { day: 4, name: 'みどりの日' }, { day: 5, name: 'こどもの日' }, { day: 6, name: '振替休日' }],
      7: [{ day: 15, name: '海の日' }],
      8: [{ day: 11, name: '山の日' }, { day: 12, name: '振替休日' }],
      9: [{ day: 16, name: '敬老の日' }, { day: 22, name: '秋分の日' }, { day: 23, name: '振替休日' }],
      10: [{ day: 14, name: 'スポーツの日' }],
      11: [{ day: 3, name: '文化の日' }, { day: 4, name: '振替休日' }, { day: 23, name: '勤労感謝の日' }]
    },
    2025: {
      1: [{ day: 1, name: '元日' }, { day: 13, name: '成人の日' }],
      2: [{ day: 11, name: '建国記念の日' }, { day: 23, name: '天皇誕生日' }, { day: 24, name: '振替休日' }],
      3: [{ day: 20, name: '春分の日' }],
      4: [{ day: 29, name: '昭和の日' }],
      5: [{ day: 3, name: '憲法記念日' }, { day: 4, name: 'みどりの日' }, { day: 5, name: 'こどもの日' }, { day: 6, name: '振替休日' }],
      7: [{ day: 21, name: '海の日' }],
      8: [{ day: 11, name: '山の日' }],
      9: [{ day: 15, name: '敬老の日' }, { day: 23, name: '秋分の日' }],
      10: [{ day: 13, name: 'スポーツの日' }],
      11: [{ day: 3, name: '文化の日' }, { day: 23, name: '勤労感謝の日' }, { day: 24, name: '振替休日' }]
    }
  }
}

/**
 * GET /api/holidays
 * すべての祝日データを取得
 */
router.get('/', async (req, res) => {
  try {
    const holidays = await getHolidays()
    res.json({ success: true, data: holidays })
  } catch (error) {
    console.error('祝日取得エラー:', error)
    res.status(500).json({
      success: false,
      error: '祝日データの取得に失敗しました'
    })
  }
})

/**
 * GET /api/holidays/:year
 * 指定年の祝日データを取得
 */
router.get('/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year)

    if (isNaN(year) || year < 1900 || year > 2100) {
      return res.status(400).json({
        success: false,
        error: '無効な年が指定されました'
      })
    }

    const holidays = await getHolidays()
    const yearHolidays = holidays[year] || {}

    res.json({
      success: true,
      data: {
        year,
        holidays: yearHolidays
      }
    })
  } catch (error) {
    console.error('祝日取得エラー:', error)
    res.status(500).json({
      success: false,
      error: '祝日データの取得に失敗しました'
    })
  }
})

/**
 * GET /api/holidays/:year/:month
 * 指定年月の祝日データを取得
 */
router.get('/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year)
    const month = parseInt(req.params.month)

    if (isNaN(year) || year < 1900 || year > 2100) {
      return res.status(400).json({
        success: false,
        error: '無効な年が指定されました'
      })
    }

    if (isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        error: '無効な月が指定されました'
      })
    }

    const holidays = await getHolidays()
    const monthHolidays = holidays[year]?.[month] || []

    res.json({
      success: true,
      data: {
        year,
        month,
        holidays: monthHolidays
      }
    })
  } catch (error) {
    console.error('祝日取得エラー:', error)
    res.status(500).json({
      success: false,
      error: '祝日データの取得に失敗しました'
    })
  }
})

export default router
