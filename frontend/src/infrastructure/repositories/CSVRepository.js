/**
 * CSVデータリポジトリ（インフラ層）
 */
import Papa from 'papaparse'

export class CSVRepository {
  /**
   * CSVファイルを読み込む
   */
  async loadCSV(path) {
    try {
      const response = await fetch(path)
      const csvText = await response.text()

      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: result => resolve(result.data),
          error: error => reject(error),
        })
      })
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
