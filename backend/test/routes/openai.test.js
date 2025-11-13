import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import openaiRoutes from '../../src/routes/openai.js'

// globalのfetchをモック
global.fetch = vi.fn()

describe('OpenAI Routes', () => {
  let app

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/openai', openaiRoutes)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/openai/chat/completions', () => {
    it('should proxy chat completions request', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        choices: [{ message: { content: 'Hello!' } }],
      }

      global.fetch.mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      })

      const response = await request(app)
        .post('/api/openai/chat/completions')
        .send({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Hello' }],
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
        })
      )
    })

    it('should handle API errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'))

      const response = await request(app)
        .post('/api/openai/chat/completions')
        .send({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Hello' }],
        })

      expect(response.status).toBe(500)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/openai/vector_stores', () => {
    it('should create vector store', async () => {
      const mockResponse = {
        id: 'vs_123',
        name: 'Test Store',
      }

      global.fetch.mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      })

      const response = await request(app)
        .post('/api/openai/vector_stores')
        .send({
          name: 'Test Store',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResponse)
    })
  })

  describe('POST /api/openai/assistants', () => {
    it('should create assistant', async () => {
      const mockResponse = {
        id: 'asst_123',
        name: 'Test Assistant',
      }

      global.fetch.mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      })

      const response = await request(app)
        .post('/api/openai/assistants')
        .send({
          name: 'Test Assistant',
          model: 'gpt-4',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResponse)
    })
  })

  describe('POST /api/openai/threads', () => {
    it('should create thread', async () => {
      const mockResponse = {
        id: 'thread_123',
      }

      global.fetch.mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      })

      const response = await request(app).post('/api/openai/threads').send({})

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResponse)
    })
  })

  describe('POST /api/openai/threads/:threadId/messages', () => {
    it('should add message to thread', async () => {
      const mockResponse = {
        id: 'msg_123',
        content: 'Test message',
      }

      global.fetch.mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      })

      const response = await request(app)
        .post('/api/openai/threads/thread_123/messages')
        .send({
          role: 'user',
          content: 'Test message',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResponse)
    })
  })

  describe('POST /api/openai/threads/:threadId/runs', () => {
    it('should create run', async () => {
      const mockResponse = {
        id: 'run_123',
        status: 'queued',
      }

      global.fetch.mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      })

      const response = await request(app)
        .post('/api/openai/threads/thread_123/runs')
        .send({
          assistant_id: 'asst_123',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResponse)
    })
  })

  describe('GET /api/openai/threads/:threadId/runs/:runId', () => {
    it('should get run status', async () => {
      const mockResponse = {
        id: 'run_123',
        status: 'completed',
      }

      global.fetch.mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      })

      const response = await request(app).get(
        '/api/openai/threads/thread_123/runs/run_123'
      )

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResponse)
    })
  })

  describe('GET /api/openai/threads/:threadId/messages', () => {
    it('should get thread messages', async () => {
      const mockResponse = {
        data: [
          { id: 'msg_1', content: 'Message 1' },
          { id: 'msg_2', content: 'Message 2' },
        ],
      }

      global.fetch.mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      })

      const response = await request(app).get(
        '/api/openai/threads/thread_123/messages'
      )

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockResponse)
    })
  })

  describe('GET /api/openai/files/:fileId/content', () => {
    it('should download file content', async () => {
      const mockContent = 'File content'

      global.fetch.mockResolvedValue({
        status: 200,
        text: async () => mockContent,
      })

      const response = await request(app).get('/api/openai/files/file_123/content')

      expect(response.status).toBe(200)
      expect(response.text).toBe(mockContent)
    })
  })
})
