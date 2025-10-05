import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import csvRoutes from './csv.js'
import * as fileService from '../services/fileService.js'

describe('CSV Routes', () => {
  let app

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api', csvRoutes)
  })

  describe('POST /api/save-csv', () => {
    it('should save CSV file successfully', async () => {
      const mockResult = {
        success: true,
        message: 'File saved successfully',
        filepath: '/data/generated/test.csv',
      }

      vi.spyOn(fileService, 'saveCSV').mockResolvedValue(mockResult)

      const response = await request(app)
        .post('/api/save-csv')
        .send({
          filename: 'test.csv',
          content: 'name,date\nJohn,2024-01-01',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResult)
      expect(fileService.saveCSV).toHaveBeenCalledWith(
        'test.csv',
        'name,date\nJohn,2024-01-01'
      )
    })

    it('should return 400 when filename is missing', async () => {
      const response = await request(app)
        .post('/api/save-csv')
        .send({
          content: 'name,date\nJohn,2024-01-01',
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toBe('filename and content are required')
    })

    it('should return 400 when content is missing', async () => {
      const response = await request(app)
        .post('/api/save-csv')
        .send({
          filename: 'test.csv',
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return 500 when saveCSV throws error', async () => {
      vi.spyOn(fileService, 'saveCSV').mockRejectedValue(
        new Error('File system error')
      )

      const response = await request(app)
        .post('/api/save-csv')
        .send({
          filename: 'test.csv',
          content: 'name,date\nJohn,2024-01-01',
        })

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toBe('File system error')
    })
  })
})
