import { describe, it, expect, beforeAll } from 'vitest'
import { openai, getOpenAIHeaders, OPENAI_API_BASE } from './openaiService.js'

describe('openaiService', () => {
  describe('openai client', () => {
    it('should export openai client instance', () => {
      expect(openai).toBeDefined()
      expect(openai.apiKey).toBeDefined()
    })

    it('should have apiKey configured', () => {
      expect(openai.apiKey).toBeTruthy()
      expect(typeof openai.apiKey).toBe('string')
    })
  })

  describe('getOpenAIHeaders', () => {
    it('should return headers with Content-Type by default', () => {
      const headers = getOpenAIHeaders()

      expect(headers).toHaveProperty('Authorization')
      expect(headers).toHaveProperty('OpenAI-Beta')
      expect(headers).toHaveProperty('Content-Type')
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['OpenAI-Beta']).toBe('assistants=v2')
    })

    it('should return headers without Content-Type when specified', () => {
      const headers = getOpenAIHeaders(false)

      expect(headers).toHaveProperty('Authorization')
      expect(headers).toHaveProperty('OpenAI-Beta')
      expect(headers).not.toHaveProperty('Content-Type')
    })

    it('should include Bearer token in Authorization', () => {
      const headers = getOpenAIHeaders()

      expect(headers.Authorization).toMatch(/^Bearer /)
    })

    it('should have correct beta header for assistants v2', () => {
      const headers = getOpenAIHeaders()

      expect(headers['OpenAI-Beta']).toBe('assistants=v2')
    })
  })

  describe('OPENAI_API_BASE', () => {
    it('should export correct API base URL', () => {
      expect(OPENAI_API_BASE).toBe('https://api.openai.com/v1')
    })
  })
})
