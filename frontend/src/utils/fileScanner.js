/**
 * シフト関連CSVファイルを動的にスキャンする
 */

/**
 * public/dataディレクトリ内のシフト関連CSVファイルを取得
 * @returns {Promise<Array>} ファイル情報の配列
 */
export const getShiftCsvFiles = async () => {
  const files = []

  // Viteのglobインポート機能でCSVファイルをスキャン
  const csvModules = import.meta.glob('/public/data/**/*.csv', { eager: false, as: 'url' })

  for (const path in csvModules) {
    // public/からの相対パスに変換
    const publicPath = path.replace('/public', '')

    // ファイル名を抽出
    const fileName = path.split('/').pop()

    // シフト関連のファイルのみフィルタ
    if (
      fileName.includes('shift') ||
      path.includes('transactions') ||
      path.includes('history')
    ) {
      // カテゴリを判定
      let category = 'その他'

      if (path.includes('/transactions/')) {
        category = 'transactions'
      } else if (path.includes('/history/')) {
        category = 'history'
      } else if (path.includes('/master/')) {
        category = 'master'
      }

      files.push({
        path: publicPath,
        fileName,
        category,
        fullPath: path
      })
    }
  }

  // カテゴリとファイル名でソート
  files.sort((a, b) => {
    if (a.category !== b.category) {
      const categoryOrder = ['transactions', 'history', 'master', 'その他']
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
    }
    return a.fileName.localeCompare(b.fileName)
  })

  return files
}

/**
 * CSVファイルからシフトデータを読み込んで標準形式に変換
 * @param {string} filePath - CSVファイルのパス
 * @param {Object} Papa - PapaParseインスタンス
 * @returns {Promise<Array>} 標準化されたシフトデータ
 */
export const loadAndConvertShiftData = async (filePath, Papa) => {
  const response = await fetch(filePath)
  const csvText = await response.text()

  const result = await new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: resolve
    })
  })

  // ファイル形式を自動検出して変換
  return autoConvertShiftData(result.data, filePath)
}

/**
 * CSVデータを自動検出して標準形式に変換
 * @param {Array} data - パース済みCSVデータ
 * @param {string} filePath - ファイルパス（形式判定用）
 * @returns {Array} 標準化されたシフトデータ
 */
const autoConvertShiftData = (data, filePath) => {
  if (data.length === 0) return []

  const firstRow = data[0]
  const shifts = []

  // フィールドの存在チェック
  const hasShiftDate = 'shift_date' in firstRow
  const hasDate = 'date' in firstRow
  const hasYear = 'year' in firstRow
  const hasTotalHours = 'total_hours' in firstRow
  const hasActualHours = 'actual_hours' in firstRow

  for (const row of data) {
    try {
      let shiftDate = ''
      let totalHours = 0
      let breakMinutes = 60 // デフォルト値

      // 日付フィールドの変換
      if (hasShiftDate) {
        // shift_date フィールドがある場合（transactions/shift.csv）
        shiftDate = row.shift_date
      } else if (hasYear && 'month' in firstRow && hasDate) {
        // year, month, date フィールドがある場合（history/shift_history_2023-2024.csv）
        const year = row.year
        const month = String(row.month).padStart(2, '0')
        const date = String(row.date).padStart(2, '0')
        shiftDate = `${year}-${month}-${date}`
      } else if (hasDate && filePath.includes('shift_second_plan')) {
        // dateのみで年月が固定の場合（shift_second_plan.csv）
        const year = 2024
        const month = 10
        const date = String(row.date).padStart(2, '0')
        shiftDate = `${year}-${String(month).padStart(2, '0')}-${date}`
      } else if (hasDate && filePath.includes('shift_october_2024')) {
        // 2024年10月固定
        const date = String(row.date).padStart(2, '0')
        shiftDate = `2024-10-${date}`
      } else {
        // 日付フィールドが見つからない場合はスキップ
        continue
      }

      // 労働時間の変換
      if (hasTotalHours) {
        totalHours = parseFloat(row.total_hours) || 0
      } else if (hasActualHours) {
        totalHours = parseFloat(row.actual_hours) || 0
      } else if (row.start_time && row.end_time) {
        // start_time/end_timeから計算
        totalHours = calculateHours(row.start_time, row.end_time, breakMinutes)
      }

      // 休憩時間
      if (row.break_minutes) {
        breakMinutes = parseInt(row.break_minutes) || 60
      }

      shifts.push({
        shift_id: row.shift_id || `GEN_${Math.random().toString(36).substr(2, 9)}`,
        staff_id: row.staff_id,
        shift_date: shiftDate,
        start_time: row.start_time,
        end_time: row.end_time,
        break_minutes: breakMinutes,
        total_hours: totalHours
      })
    } catch (error) {
      console.warn('行の変換に失敗:', row, error)
    }
  }

  return shifts
}

/**
 * 時間計算ヘルパー
 */
const calculateHours = (startTime, endTime, breakMinutes) => {
  if (!startTime || !endTime) return 0

  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  const totalMinutes = endMinutes - startMinutes - breakMinutes
  return Math.max(0, totalMinutes / 60)
}
