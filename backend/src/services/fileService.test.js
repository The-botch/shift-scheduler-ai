import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { saveCSV, convertCSVToJSON, deleteTempFile } from './fileService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('fileService', () => {
  const testDir = path.join(__dirname, '../test-output')
  const tempDir = path.join(__dirname, '../temp')

  beforeEach(() => {
    // テスト用ディレクトリを作成
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true })
    }
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
  })

  afterEach(() => {
    // テスト後のクリーンアップ
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('saveCSV', () => {
    it('should save CSV file successfully', async () => {
      const filename = 'test-shift.csv'
      const content = 'name,date,shift\nJohn,2024-01-01,Morning'

      const result = await saveCSV(filename, content)

      expect(result.success).toBe(true)
      expect(result.message).toBe('File saved successfully')
      expect(result.filepath).toContain(filename)
    })

    it('should create directory if it does not exist', async () => {
      const filename = 'test.csv'
      const content = 'test,data\n1,2'

      const result = await saveCSV(filename, content)

      expect(result.success).toBe(true)
      expect(result.filepath).toContain('test.csv')
    })

    it('should handle empty content', async () => {
      const filename = 'empty.csv'
      const content = ''

      const result = await saveCSV(filename, content)

      expect(result.success).toBe(true)
    })
  })

  describe('convertCSVToJSON', () => {
    it('should convert CSV to JSON successfully', () => {
      // テスト用CSVファイルを作成
      const testCSVPath = 'data/test-staff.csv'
      const frontendPublicPath = path.join(__dirname, '../../../frontend/public')
      const fullPath = path.join(frontendPublicPath, testCSVPath)
      const csvContent = 'name,age,role\nAlice,25,Manager\nBob,30,Staff'

      // ディレクトリを作成（frontend/publicも含む）
      const dir = path.dirname(fullPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(fullPath, csvContent, 'utf-8')

      const result = convertCSVToJSON(testCSVPath)

      expect(result.jsonFileName).toBe('test-staff.json')
      expect(result.tempFilePath).toContain('test-staff.json')
      expect(fs.existsSync(result.tempFilePath)).toBe(true)

      // JSONファイルの内容を確認
      const jsonContent = JSON.parse(fs.readFileSync(result.tempFilePath, 'utf-8'))
      expect(jsonContent).toHaveLength(2)
      expect(jsonContent[0]).toEqual({ name: 'Alice', age: 25, role: 'Manager' })

      // クリーンアップ
      fs.unlinkSync(fullPath)
      fs.unlinkSync(result.tempFilePath)
      // frontend/publicディレクトリは削除しない（システムディレクトリのため）
      if (fs.existsSync(path.join(frontendPublicPath, 'data'))) {
        fs.rmSync(path.join(frontendPublicPath, 'data'), { recursive: true, force: true })
      }
    })

    it('should throw error for non-existent file', () => {
      expect(() => {
        convertCSVToJSON('data/non-existent.csv')
      }).toThrow()
    })

    it('should handle CSV with headers only', () => {
      const testCSVPath = 'data/headers-only.csv'
      const frontendPublicPath = path.join(__dirname, '../../../frontend/public')
      const fullPath = path.join(frontendPublicPath, testCSVPath)
      const csvContent = 'name,age,role'

      const dir = path.dirname(fullPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(fullPath, csvContent, 'utf-8')

      const result = convertCSVToJSON(testCSVPath)
      const jsonContent = JSON.parse(fs.readFileSync(result.tempFilePath, 'utf-8'))

      expect(jsonContent).toHaveLength(0)

      // クリーンアップ
      fs.unlinkSync(fullPath)
      fs.unlinkSync(result.tempFilePath)
      if (fs.existsSync(path.join(frontendPublicPath, 'data'))) {
        fs.rmSync(path.join(frontendPublicPath, 'data'), { recursive: true, force: true })
      }
    })
  })

  describe('deleteTempFile', () => {
    it('should delete existing file', () => {
      const testFile = path.join(tempDir, 'test-delete.txt')
      fs.writeFileSync(testFile, 'test content', 'utf-8')

      expect(fs.existsSync(testFile)).toBe(true)

      deleteTempFile(testFile)

      expect(fs.existsSync(testFile)).toBe(false)
    })

    it('should not throw error for non-existent file', () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.txt')

      expect(() => {
        deleteTempFile(nonExistentFile)
      }).not.toThrow()
    })

    it('should handle multiple deletions', () => {
      const testFile1 = path.join(tempDir, 'test1.txt')
      const testFile2 = path.join(tempDir, 'test2.txt')

      fs.writeFileSync(testFile1, 'test1', 'utf-8')
      fs.writeFileSync(testFile2, 'test2', 'utf-8')

      deleteTempFile(testFile1)
      deleteTempFile(testFile2)

      expect(fs.existsSync(testFile1)).toBe(false)
      expect(fs.existsSync(testFile2)).toBe(false)
    })
  })
})
