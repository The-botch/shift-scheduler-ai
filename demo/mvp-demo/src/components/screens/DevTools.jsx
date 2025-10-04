import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import AppHeader from '../shared/AppHeader'
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Code2,
  MessageSquare,
  Play,
  FileText,
  Database,
  RefreshCw,
  Download
} from 'lucide-react'
import Papa from 'papaparse'
import { validateShifts } from '../../utils/shiftValidator'
import { getShiftCsvFiles, loadAndConvertShiftData } from '../../utils/fileScanner'
import { sendToChatGPT, buildShiftGenerationPrompt } from '../../utils/openaiClient'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}

const DevTools = ({
  onHome,
  onShiftManagement,
  onLineMessages,
  onMonitoring,
  onStaffManagement,
  onStoreManagement,
  onConstraintManagement,
  onBudgetActualManagement
}) => {
  const [validationResult, setValidationResult] = useState(null)
  const [validationLoading, setValidationLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState('')
  const [availableFiles, setAvailableFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(true)
  const [aiResponse, setAiResponse] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMode, setAiMode] = useState('chat') // 'chat' or 'generate'
  const [conversationLog, setConversationLog] = useState([])
  const LOG_THRESHOLD = 100 // ログが100件溜まったらCSV出力

  // CSVファイル一覧を読み込み
  useEffect(() => {
    loadAvailableFiles()
  }, [])

  const loadAvailableFiles = async () => {
    try {
      setFilesLoading(true)
      const files = await getShiftCsvFiles()
      setAvailableFiles(files)

      // デフォルトで最初のファイルを選択
      if (files.length > 0 && !selectedFile) {
        setSelectedFile(files[0].path)
      }
    } catch (error) {
      console.error('ファイル一覧の取得に失敗:', error)
    } finally {
      setFilesLoading(false)
    }
  }

  // バリデーション実行
  const runValidation = async () => {
    try {
      setValidationLoading(true)
      setValidationResult(null)

      if (!selectedFile) {
        throw new Error('CSVファイルが選択されていません')
      }

      console.log('バリデーション対象:', selectedFile)
      const shifts = await loadAndConvertShiftData(selectedFile, Papa)
      console.log('読み込んだシフト:', shifts.length, '件')

      const result = await validateShifts(shifts)
      console.log('バリデーション結果:', result)

      setValidationResult(result)
    } catch (error) {
      console.error('バリデーションエラー:', error)
      setValidationResult({
        isValid: false,
        errorCount: 1,
        warningCount: 0,
        errors: [{
          rule_id: 'SYSTEM_ERROR',
          message: error.message,
          category: 'システム'
        }],
        warnings: []
      })
    } finally {
      setValidationLoading(false)
    }
  }

  // AI対話（ChatGPT-4）
  const sendToAI = async () => {
    try {
      setAiLoading(true)
      setAiResponse('')

      if (!aiPrompt.trim()) {
        throw new Error('プロンプトを入力してください')
      }

      const userInput = aiPrompt
      const result = await sendToChatGPT(aiPrompt)

      if (result.success) {
        setAiResponse(result.message)
        // ログに記録
        addToConversationLog(userInput, result.message, 'chat')
      } else {
        const errorMessage = `エラー: ${result.error}\n\n${result.message}`
        setAiResponse(errorMessage)
        // エラーもログに記録
        addToConversationLog(userInput, errorMessage, 'chat')
      }
    } catch (error) {
      const errorMessage = `エラー: ${error.message}`
      setAiResponse(errorMessage)
      addToConversationLog(aiPrompt, errorMessage, 'chat')
    } finally {
      setAiLoading(false)
    }
  }

  // シフト生成（ChatGPT-4）
  const generateShift = async () => {
    try {
      setAiLoading(true)
      setAiResponse('シフトを生成中...')

      // パラメータを解析
      const constraintsArray = aiPrompt.split('\n')
        .filter(line => line.trim())
        .map(line => line.trim())

      const userInput = `シフト生成: 2024年11月, スタッフ5名, 予算100万円\n追加制約:\n${aiPrompt}`

      // プロンプトを構築
      const prompt = buildShiftGenerationPrompt({
        year: 2024,
        month: 11,
        staffCount: 5,
        budgetLimit: 1000000,
        constraints: constraintsArray,
        preferences: []
      })

      const result = await sendToChatGPT(prompt, {
        maxTokens: 3000,
        systemMessage: 'あなたはシフト管理の専門家です。ハード制約を最優先し、ソフト制約を可能な限り満たすシフトを生成してください。'
      })

      if (result.success) {
        const response = `📅 生成されたシフト\n\n${result.message}\n\n💡 このシフトをバリデーションチェックにかけて制約違反がないか確認してください。`
        setAiResponse(response)
        // ログに記録
        addToConversationLog(userInput, result.message, 'generate')
      } else {
        const errorMessage = `エラー: ${result.error}`
        setAiResponse(errorMessage)
        addToConversationLog(userInput, errorMessage, 'generate')
      }
    } catch (error) {
      const errorMessage = `エラー: ${error.message}`
      setAiResponse(errorMessage)
      addToConversationLog(`シフト生成: ${aiPrompt}`, errorMessage, 'generate')
    } finally {
      setAiLoading(false)
    }
  }

  // 対話ログをCSV形式で出力
  const exportLogsToCSV = (logs) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `ai_conversation_log_${timestamp}.csv`

    // CSVヘッダー
    let csvContent = 'timestamp,mode,user_input,ai_response,response_length\n'

    // ログデータを追加
    logs.forEach(log => {
      const escapedInput = `"${log.userInput.replace(/"/g, '""')}"`
      const escapedResponse = `"${log.aiResponse.replace(/"/g, '""')}"`
      csvContent += `${log.timestamp},${log.mode},${escapedInput},${escapedResponse},${log.responseLength}\n`
    })

    // BOMを追加してExcelで文字化けしないようにする
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })

    // ダウンロードリンクを作成
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ログを追加し、閾値を超えたらCSV出力
  const addToConversationLog = (userInput, aiResponse, mode) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      mode,
      userInput,
      aiResponse,
      responseLength: aiResponse.length
    }

    const updatedLog = [...conversationLog, logEntry]
    setConversationLog(updatedLog)

    // ログが閾値を超えたら自動的にCSV出力してクリア
    if (updatedLog.length >= LOG_THRESHOLD) {
      exportLogsToCSV(updatedLog)
      setConversationLog([]) // ログをクリア
      console.log(`${LOG_THRESHOLD}件のログをCSVに出力しました`)
    }
  }

  // 手動でログをCSV出力
  const downloadLogsManually = () => {
    if (conversationLog.length === 0) return
    exportLogsToCSV(conversationLog)
    setConversationLog([]) // ログをクリア
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50"
    >
      <AppHeader
        title="開発者ツール"
        onHome={onHome}
        onShiftManagement={onShiftManagement}
        onLineMessages={onLineMessages}
        onMonitoring={onMonitoring}
        onStaffManagement={onStaffManagement}
        onStoreManagement={onStoreManagement}
        onConstraintManagement={onConstraintManagement}
        onBudgetActualManagement={onBudgetActualManagement}
        onDevTools={() => {}}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🛠️ 開発者ツール</h1>
          <p className="text-gray-600">バリデーションチェック・AI対話・API動作確認</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* バリデーションツール */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                シフトバリデーションチェック
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    検証対象CSVファイル
                  </label>
                  <Button
                    onClick={loadAvailableFiles}
                    disabled={filesLoading}
                    variant="ghost"
                    size="sm"
                    className="h-6"
                  >
                    <RefreshCw className={`h-3 w-3 ${filesLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                {filesLoading ? (
                  <div className="text-sm text-gray-500">ファイルを検索中...</div>
                ) : (
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                  >
                    {availableFiles.length === 0 && (
                      <option value="">ファイルが見つかりません</option>
                    )}
                    {availableFiles.map((file, idx) => (
                      <option key={idx} value={file.path}>
                        [{file.category}] {file.fileName}
                      </option>
                    ))}
                  </select>
                )}

                {selectedFile && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    📄 {selectedFile}
                  </div>
                )}

                <Button
                  onClick={runValidation}
                  disabled={validationLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {validationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      検証中...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      バリデーション実行
                    </>
                  )}
                </Button>

                {validationResult && (
                  <div className="mt-4 space-y-3">
                    <div className={`p-4 rounded-lg ${validationResult.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {validationResult.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`font-bold ${validationResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                          {validationResult.isValid ? '✓ 全ての制約をクリア' : '✗ 制約違反あり'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span>エラー: {validationResult.errorCount}件</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span>警告: {validationResult.warningCount}件</span>
                        </div>
                      </div>
                    </div>

                    {validationResult.errors.length > 0 && (
                      <div className="max-h-60 overflow-y-auto">
                        <h4 className="font-semibold text-red-700 mb-2">エラー一覧:</h4>
                        <ul className="space-y-2">
                          {validationResult.errors.slice(0, 5).map((error, idx) => (
                            <li key={idx} className="text-sm bg-red-50 p-2 rounded border-l-4 border-red-500">
                              <span className="font-mono text-xs bg-red-200 px-2 py-1 rounded">{error.rule_id}</span>
                              <p className="mt-1">{error.message}</p>
                            </li>
                          ))}
                          {validationResult.errors.length > 5 && (
                            <li className="text-sm text-gray-500">
                              ...他 {validationResult.errors.length - 5} 件
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {validationResult.warnings.length > 0 && (
                      <div className="max-h-60 overflow-y-auto">
                        <h4 className="font-semibold text-orange-700 mb-2">警告一覧:</h4>
                        <ul className="space-y-2">
                          {validationResult.warnings.slice(0, 3).map((warning, idx) => (
                            <li key={idx} className="text-sm bg-orange-50 p-2 rounded border-l-4 border-orange-500">
                              <span className="font-mono text-xs bg-orange-200 px-2 py-1 rounded">{warning.rule_id}</span>
                              <p className="mt-1">{warning.message}</p>
                            </li>
                          ))}
                          {validationResult.warnings.length > 3 && (
                            <li className="text-sm text-gray-500">
                              ...他 {validationResult.warnings.length - 3} 件
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI対話ツール */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI対話・シフト生成（GPT-4連携）
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* モード切り替え */}
                <div className="flex gap-2 mb-2">
                  <Button
                    onClick={() => setAiMode('chat')}
                    variant={aiMode === 'chat' ? 'default' : 'outline'}
                    size="sm"
                    className={aiMode === 'chat' ? 'bg-purple-600' : ''}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    AI対話
                  </Button>
                  <Button
                    onClick={() => setAiMode('generate')}
                    variant={aiMode === 'generate' ? 'default' : 'outline'}
                    size="sm"
                    className={aiMode === 'generate' ? 'bg-purple-600' : ''}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    シフト生成
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {aiMode === 'chat' ? 'プロンプト入力' : '追加制約・希望（1行1項目）'}
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md resize-none"
                    rows="4"
                    placeholder={aiMode === 'chat'
                      ? "例: 2024年10月のシフトを分析してください。"
                      : "例:\n週末は必ず2名以上配置\n田中さんは火曜日休み希望\n水曜日は営業時間を延長"}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  {aiMode === 'chat' ? (
                    <Button
                      onClick={sendToAI}
                      disabled={aiLoading || !aiPrompt.trim()}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {aiLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          送信中...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          AIに送信
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={generateShift}
                      disabled={aiLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {aiLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          生成中...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          シフトを生成（GPT-4）
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {aiResponse && (
                  <div className="mt-4 bg-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Code2 className="h-4 w-4" />
                        AI応答
                      </h4>
                    </div>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {aiResponse}
                    </pre>
                  </div>
                )}

                {/* ログ管理セクション */}
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-green-800">
                      📝 <strong>対話ログ:</strong> {conversationLog.length}件 / {LOG_THRESHOLD}件
                      {conversationLog.length > 0 && ` (${LOG_THRESHOLD}件で自動保存)`}
                    </p>
                    {conversationLog.length > 0 && (
                      <Button
                        onClick={downloadLogsManually}
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        手動保存
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-xs text-blue-800">
                    💡 <strong>設定方法:</strong> .envファイルにVITE_OPENAI_API_KEY=your_api_keyを設定してください。
                    <br />
                    <strong>AI対話モード:</strong> GPT-4で自由に質問や分析ができます。
                    <br />
                    <strong>シフト生成モード:</strong> GPT-4で2024年11月のシフトを自動生成します（スタッフ5名、予算100万円）。
                    <br />
                    <strong>ログ機能:</strong> すべての対話履歴を自動記録し、{LOG_THRESHOLD}件溜まると自動的にCSVファイルに保存されます。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* クイックリンク */}
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              テストページへのリンク
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/tests/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-gray-800">テストメニュー</h4>
                  <p className="text-sm text-gray-600">全テストページ一覧</p>
                </div>
              </a>

              <a
                href="/tests/validation/test-validator.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-gray-800">基本バリデーションテスト</h4>
                  <p className="text-sm text-gray-600">詳細な検証結果を表示</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

export default DevTools
