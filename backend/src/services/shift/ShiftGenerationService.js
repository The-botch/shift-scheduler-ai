import MasterDataCollectorService from './MasterDataCollectorService.js'
import PromptBuilderService from './PromptBuilderService.js'
import OpenAIClientService from './OpenAIClientService.js'
import ResponseParserService from './ResponseParserService.js'
import ConstraintValidationService from './ConstraintValidationService.js'

/**
 * シフト生成オーケストレーションサービス
 * 全サービスを統合してAIシフト生成を実行
 */
class ShiftGenerationService {
  constructor() {
    this.dataCollector = new MasterDataCollectorService()
    this.promptBuilder = new PromptBuilderService()
    this.aiClient = new OpenAIClientService()
    this.responseParser = new ResponseParserService()
    this.constraintValidator = new ConstraintValidationService()
  }

  /**
   * AIシフト生成のメインフロー
   * @param {number} tenantId - テナントID
   * @param {number} storeId - 店舗ID
   * @param {number} year - 対象年
   * @param {number} month - 対象月
   * @param {Object} options - 生成オプション
   * @returns {Promise<Object>} { shifts, validation, metadata }
   */
  async generateShifts(tenantId, storeId, year, month, options = {}) {
    const startTime = Date.now()

    try {
      // フェーズ1: マスターデータ収集
      const masterData = await this.dataCollector.collectMasterData(
        tenantId,
        storeId,
        year,
        month
      )

      // データ存在チェック
      this.validateMasterData(masterData)

      // フェーズ2: プロンプト生成
      const prompt = this.promptBuilder.buildPrompt(masterData)

      // フェーズ3: AI生成
      const aiResponse = await this.aiClient.generateShifts(prompt, {
        maxRetries: options.maxRetries || 3,
        temperature: options.temperature || 0.7,
        model: options.model || 'gpt-4-turbo-preview'
      })

      // フェーズ4: 応答パース
      const parsed = await this.responseParser.parseAndValidate(aiResponse, masterData)

      // フェーズ5: 制約検証
      const validation = await this.constraintValidator.validateShifts(
        parsed.shifts,
        masterData
      )

      const elapsed = Date.now() - startTime

      return {
        shifts: parsed.shifts,
        validation: {
          summary: validation.summary,
          violations: validation.violations
        },
        metadata: {
          generated_at: new Date().toISOString(),
          elapsed_ms: elapsed,
          tenant_id: tenantId,
          store_id: storeId,
          year,
          month,
          model: options.model || 'gpt-4-turbo-preview',
          staff_count: masterData.staff.length,
          pattern_count: masterData.shiftPatterns.length,
          parse_errors: parsed.errors.length
        }
      }

    } catch (error) {
      console.error('[ShiftGeneration] AI自動生成エラー:', error)

      throw {
        success: false,
        error: error.message,
        phase: this.detectPhase(error),
        elapsed_ms: Date.now() - startTime
      }
    }
  }

  /**
   * マスターデータの妥当性チェック
   */
  validateMasterData(masterData) {
    const errors = []

    if (!masterData.staff || masterData.staff.length === 0) {
      errors.push('スタッフが登録されていません')
    }

    if (!masterData.shiftPatterns || masterData.shiftPatterns.length === 0) {
      errors.push('シフトパターンが登録されていません')
    }

    if (!masterData.storeInfo) {
      errors.push('店舗情報が取得できませんでした')
    }

    if (errors.length > 0) {
      throw new Error(`マスターデータが不足しています: ${errors.join(', ')}`)
    }
  }

  /**
   * エラーが発生したフェーズを検出
   */
  detectPhase(error) {
    const message = error.message || ''

    if (message.includes('データ収集') || message.includes('マスターデータ')) {
      return 'data_collection'
    }
    if (message.includes('プロンプト')) {
      return 'prompt_building'
    }
    if (message.includes('AI生成') || message.includes('API')) {
      return 'ai_generation'
    }
    if (message.includes('パース') || message.includes('JSON')) {
      return 'response_parsing'
    }
    if (message.includes('制約') || message.includes('検証')) {
      return 'constraint_validation'
    }

    return 'unknown'
  }
}

export default ShiftGenerationService
