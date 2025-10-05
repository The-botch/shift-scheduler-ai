import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import { appendLog } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * CSVファイルを保存
 * @param {string} filename - ファイル名
 * @param {string} content - CSVコンテンツ
 * @returns {Object} 保存結果
 */
export async function saveCSV(filename, content) {
  const generatedDir = path.join(__dirname, '../../../frontend/public', 'data', 'generated')

  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true })
  }

  const filepath = path.join(generatedDir, filename)
  fs.writeFileSync(filepath, content, 'utf-8')

  appendLog(`✅ CSVファイルを保存しました: ${filepath}`)

  return {
    success: true,
    message: 'File saved successfully',
    filepath: `/data/generated/${filename}`
  }
}

/**
 * CSVをJSONに変換してアップロード用の一時ファイルを作成
 * @param {string} filePath - CSVファイルパス
 * @returns {Object} { tempFilePath, jsonFileName }
 */
export function convertCSVToJSON(filePath) {
  const fullPath = path.join(__dirname, '../../../frontend/public', filePath)

  appendLog(`ファイルアップロード試行: ${fullPath}`)

  if (!fs.existsSync(fullPath)) {
    throw new Error(`ファイルが見つかりません: ${fullPath}`)
  }

  const originalFileName = filePath.split('/').pop()
  const jsonFileName = originalFileName.replace(/\.csv$/, '.json')

  // CSVを読み込んでPapaparseでJSONに変換
  const csvContent = fs.readFileSync(fullPath, 'utf-8')
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true
  })

  const jsonData = parseResult.data

  // 一時的にJSON拡張子のファイルを作成
  const tempDir = path.join(__dirname, '../temp')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const tempFilePath = path.join(tempDir, jsonFileName)
  fs.writeFileSync(tempFilePath, JSON.stringify(jsonData, null, 2), 'utf-8')

  return { tempFilePath, jsonFileName }
}

/**
 * 一時ファイルを削除
 * @param {string} filePath - ファイルパス
 */
export function deleteTempFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}
