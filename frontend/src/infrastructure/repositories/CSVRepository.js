/**
 * CSVデータリポジトリ（インフラ層）
 */
import Papa from 'papaparse'
import { BACKEND_API_URL, API_ENDPOINTS } from '../../config/api'

export class CSVRepository {
  /**
   * CSVファイルを読み込む（バックエンドAPI経由）
   */
  async loadCSV(path) {
    try {
      // pathが'/'で始まる場合は削除
      const cleanPath = path.startsWith('/') ? path.substring(1) : path

      // バックエンドAPIを呼び出し
      const url = `${BACKEND_API_URL}${API_ENDPOINTS.LOAD_CSV}?path=${encodeURIComponent(cleanPath)}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'CSV読み込みに失敗しました')
      }

      return result.data
    } catch (error) {
      throw new Error(`CSVファイル読み込みエラー: ${path} - ${error.message}`)
    }
  }

  /**
   * 複数のCSVファイルを並行読み込み
   */
  async loadMultipleCSV(paths) {
    return Promise.all(paths.map(path => this.loadCSV(path)))
  }

  /**
   * CSVデータをパース（文字列から）
   */
  parseCSVString(csvString, options = {}) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        ...options,
        complete: result => resolve(result.data),
        error: error => reject(error),
      })
    })
  }
}
