import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOG_FILE = path.join(__dirname, '../server.log')

/**
 * ログ出力ヘルパー関数
 * @param {string} message - ログメッセージ
 */
export function appendLog(message) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${message}\n`
  fs.appendFileSync(LOG_FILE, logEntry, 'utf-8')
  console.log(message)
}
