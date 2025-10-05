import Papa from 'papaparse'

/**
 * CSVエクスポート共通関数
 * @param {Array} data - エクスポートするデータ配列
 * @param {string} filename - ダウンロードするファイル名
 */
export const exportCSV = (data, filename) => {
  try {
    const csv = Papa.unparse(data)
    const bom = '\uFEFF' // BOM for Excel compatibility
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
    return { success: true }
  } catch (error) {
    console.error('CSV export error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * CSVインポート共通関数
 * @param {File} file - インポートするCSVファイル
 * @param {Function} onSuccess - 成功時のコールバック関数
 * @param {Function} onError - エラー時のコールバック関数
 * @param {Function} validator - データバリデーション関数（オプション）
 */
export const importCSV = (file, onSuccess, onError, validator = null) => {
  if (!file) {
    onError('ファイルが選択されていません')
    return
  }

  if (!file.name.endsWith('.csv')) {
    onError('CSVファイルを選択してください')
    return
  }

  const reader = new FileReader()

  reader.onload = e => {
    try {
      const text = e.target.result
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: result => {
          if (result.errors.length > 0) {
            const errorMsg = result.errors.map(err => err.message).join('\n')
            onError(`CSVパースエラー:\n${errorMsg}`)
            return
          }

          // カスタムバリデーション
          if (validator) {
            const validationResult = validator(result.data)
            if (!validationResult.valid) {
              onError(validationResult.message)
              return
            }
          }

          onSuccess(result.data)
        },
        error: error => {
          onError(`CSVファイル読み込みエラー: ${error.message}`)
        },
      })
    } catch (error) {
      onError(`予期しないエラー: ${error.message}`)
    }
  }

  reader.onerror = () => {
    onError('ファイルの読み込みに失敗しました')
  }

  reader.readAsText(file, 'UTF-8')
}

/**
 * スタッフCSVバリデーション
 */
export const validateStaffCSV = data => {
  const requiredFields = ['staff_id', 'name', 'role_id', 'employment_type']

  if (data.length === 0) {
    return { valid: false, message: 'CSVファイルが空です' }
  }

  const firstRow = data[0]
  const missingFields = requiredFields.filter(field => !(field in firstRow))

  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `必須フィールドが不足しています: ${missingFields.join(', ')}`,
    }
  }

  // 重複IDチェック
  const ids = data.map(row => row.staff_id)
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
  if (duplicates.length > 0) {
    return {
      valid: false,
      message: `重複したstaff_idが存在します: ${[...new Set(duplicates)].join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * 店舗CSVバリデーション
 */
export const validateStoreCSV = data => {
  const requiredFields = ['store_id', 'store_name', 'store_code']

  if (data.length === 0) {
    return { valid: false, message: 'CSVファイルが空です' }
  }

  const firstRow = data[0]
  const missingFields = requiredFields.filter(field => !(field in firstRow))

  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `必須フィールドが不足しています: ${missingFields.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * 制約CSVバリデーション
 */
export const validateConstraintCSV = data => {
  const requiredFields = ['constraint_id', 'constraint_name', 'constraint_type']

  if (data.length === 0) {
    return { valid: false, message: 'CSVファイルが空です' }
  }

  const firstRow = data[0]
  const missingFields = requiredFields.filter(field => !(field in firstRow))

  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `必須フィールドが不足しています: ${missingFields.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * ファイル名生成ヘルパー
 */
export const generateFilename = (prefix, extension = 'csv') => {
  const date = new Date().toISOString().split('T')[0]
  return `${prefix}_${date}.${extension}`
}
