import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import AppHeader from '../components/shared/AppHeader'
import ChatBot from '../components/shared/ChatBot'
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
  Download,
  Copy,
  Check,
  FileEdit,
  Loader2,
  Settings,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
} from 'lucide-react'
import Papa from 'papaparse'
import { validateShifts } from '../utils/shiftValidator'
import { getShiftCsvFiles, loadAndConvertShiftData } from '../utils/fileScanner'
import { sendToChatGPT, buildShiftGenerationPrompt } from '../utils/openaiClient'
import {
  collectAllInputs,
  formatInputsForPrompt,
  INPUT_CATEGORIES,
} from '../utils/shiftInputCollector'
import { setupVectorStore, generateShiftWithAssistant } from '../utils/assistantClient'
import { getApiUrl, API_ENDPOINTS } from '../config/api'
import { generateTimestamp } from '../utils/dateUtils'
import { useTenant } from '../contexts/TenantContext'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
}

const DevTools = ({
  targetYear: propTargetYear,
  targetMonth: propTargetMonth,
  onHome,
  onShiftManagement,
  onLineMessages,
  onMonitoring,
  onStaffManagement,
  onStoreManagement,
  onConstraintManagement,
  onBudgetActualManagement,
}) => {
  const { tenantId } = useTenant()
  // eslint-disable-next-line no-unused-vars
  const [validationResult, setValidationResult] = useState(null)
  // eslint-disable-next-line no-unused-vars
  const [validationLoading, setValidationLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState('')
  // eslint-disable-next-line no-unused-vars
  const [availableFiles, setAvailableFiles] = useState([])
  // eslint-disable-next-line no-unused-vars
  const [filesLoading, setFilesLoading] = useState(true)
  const [aiResponse, setAiResponse] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedValidation, setCopiedValidation] = useState(false)
  const [conversationLog, setConversationLog] = useState([])
  const LOG_THRESHOLD = 100 // ログが100件溜まったら.log出力してローテーション
  const [currentLogFile, setCurrentLogFile] = useState(1) // 現在のログファイル番号
  const [validationLog, setValidationLog] = useState([])
  const [currentValidationLogFile, setCurrentValidationLogFile] = useState(1)
  const [inputData, setInputData] = useState(null)
  const [inputLoading, setInputLoading] = useState(false)
  const [showInputDetails, setShowInputDetails] = useState(false)
  const [enabledCategories, setEnabledCategories] = useState(() => {
    const initial = {}
    Object.values(INPUT_CATEGORIES).forEach(cat => {
      initial[cat.id] = cat.defaultEnabled
    })
    return initial
  })
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [isPromptEditable, setIsPromptEditable] = useState(false)
  const [targetYear, setTargetYear] = useState(propTargetYear || new Date().getFullYear())
  const [targetMonth, setTargetMonth] = useState(propTargetMonth || new Date().getMonth() + 1)
  const [vectorStoreId, setVectorStoreId] = useState(localStorage.getItem('vectorStoreId'))
  const [assistantId, setAssistantId] = useState(localStorage.getItem('assistantId'))
  const [setupProgress, setSetupProgress] = useState({ message: '', current: 0, total: 0 })
  const [isSettingUp, setIsSettingUp] = useState(false)
  const useAssistantsAPI = true // 常にAssistants APIを使用
  const [showLogs, setShowLogs] = useState(false) // 初期状態：折りたたみ
  const [showValidationLogs, setShowValidationLogs] = useState(false) // 初期状態：折りたたみ
  const [generatedShiftValidation, setGeneratedShiftValidation] = useState(null)
  const [importedShiftData, setImportedShiftData] = useState(null)
  const [importedFileName, setImportedFileName] = useState('')
  const [showDevSettings, setShowDevSettings] = useState(false)
  const [showDataCollectionStatus, setShowDataCollectionStatus] = useState(false)

  // CSVファイル一覧を読み込み + localStorageから設定を復元
  useEffect(() => {
    loadAvailableFiles()
    loadLogsFromIndexedDB()
    loadValidationLogsFromIndexedDB()

    // localStorageからAssistant設定を復元
    const savedVectorStoreId = localStorage.getItem('vectorStoreId')
    const savedAssistantId = localStorage.getItem('assistantId')

    if (savedVectorStoreId && savedVectorStoreId !== vectorStoreId) {
      setVectorStoreId(savedVectorStoreId)
      console.log('✅ Vector Store IDを復元しました:', savedVectorStoreId)
    }

    if (savedAssistantId && savedAssistantId !== assistantId) {
      setAssistantId(savedAssistantId)
      console.log('✅ Assistant IDを復元しました:', savedAssistantId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // IndexedDBからログを読み込む
  const loadLogsFromIndexedDB = async () => {
    try {
      const db = await openLogDB()
      const tx = db.transaction('logs', 'readonly')
      const store = tx.objectStore('logs')

      const request = store.getAll()
      const allLogs = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      if (allLogs && allLogs.length > 0) {
        setConversationLog(allLogs)
        // 最新のログファイル番号を取得
        const fileNum = parseInt(localStorage.getItem('currentLogFileNumber') || '1')
        setCurrentLogFile(fileNum)
        console.log(`✅ IndexedDBから${allLogs.length}件のログを読み込みました`)
      }
    } catch (error) {
      console.error('IndexedDBからのログ読み込みエラー:', error)
    }
  }

  // IndexedDBからバリデーションログを読み込む
  const loadValidationLogsFromIndexedDB = async () => {
    try {
      const db = await openLogDB()
      const tx = db.transaction('validationLogs', 'readonly')
      const store = tx.objectStore('validationLogs')

      const request = store.getAll()
      const allLogs = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      if (allLogs && allLogs.length > 0) {
        setValidationLog(allLogs)
        // 最新のログファイル番号を取得
        const fileNum = parseInt(localStorage.getItem('currentValidationLogFileNumber') || '1')
        setCurrentValidationLogFile(fileNum)
        console.log(`✅ IndexedDBから${allLogs.length}件のバリデーションログを読み込みました`)
      }
    } catch (error) {
      console.error('IndexedDBからのバリデーションログ読み込みエラー:', error)
    }
  }

  // IndexedDBを開く
  const openLogDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ShiftSchedulerLogs', 2) // バージョンを2に更新

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = event => {
        const db = event.target.result

        // 対話ログ用のobjectStore
        if (!db.objectStoreNames.contains('logs')) {
          const objectStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true })
          objectStore.createIndex('timestamp', 'timestamp', { unique: false })
          objectStore.createIndex('logId', 'logId', { unique: true })
        }

        // バリデーションログ用のobjectStore
        if (!db.objectStoreNames.contains('validationLogs')) {
          const validationStore = db.createObjectStore('validationLogs', {
            keyPath: 'id',
            autoIncrement: true,
          })
          validationStore.createIndex('timestamp', 'timestamp', { unique: false })
          validationStore.createIndex('conversationLogId', 'conversationLogId', { unique: false })
        }
      }
    })
  }

  // ログをIndexedDBに保存
  const saveLogToIndexedDB = async logEntry => {
    try {
      const db = await openLogDB()
      const tx = db.transaction('logs', 'readwrite')
      const store = tx.objectStore('logs')

      const request = store.add(logEntry)
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('IndexedDBへのログ保存エラー:', error)
    }
  }

  // IndexedDBのログをクリア
  const clearLogsFromIndexedDB = async () => {
    try {
      const db = await openLogDB()
      const tx = db.transaction('logs', 'readwrite')
      const store = tx.objectStore('logs')

      const request = store.clear()
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      console.log('✅ IndexedDBのログをクリアしました')
    } catch (error) {
      console.error('IndexedDBのログクリアエラー:', error)
    }
  }

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
  // eslint-disable-next-line no-unused-vars
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
        errors: [
          {
            rule_id: 'SYSTEM_ERROR',
            message: error.message,
            category: 'システム',
          },
        ],
        warnings: [],
      })
    } finally {
      setValidationLoading(false)
    }
  }

  // AI対話（ChatGPT-4）
  // eslint-disable-next-line no-unused-vars
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
        await addToConversationLog(userInput, result.message, 'chat')
      } else {
        const errorMessage = `エラー: ${result.error}\n\n${result.message}`
        setAiResponse(errorMessage)
        // エラーもログに記録
        await addToConversationLog(userInput, errorMessage, 'chat')
      }
    } catch (error) {
      const errorMessage = `エラー: ${error.message}`
      setAiResponse(errorMessage)
      await addToConversationLog(aiPrompt, errorMessage, 'chat')
    } finally {
      setAiLoading(false)
    }
  }

  // インプットデータを収集
  const loadInputData = async () => {
    try {
      setInputLoading(true)
      const data = await collectAllInputs(targetYear, targetMonth, enabledCategories)
      setInputData(data)
      console.log('インプットデータ収集完了:', data)
    } catch (error) {
      console.error('インプットデータ収集エラー:', error)
      setInputData(null)
    } finally {
      setInputLoading(false)
    }
  }

  // カテゴリートグルの変更
  const toggleCategory = categoryId => {
    const category = INPUT_CATEGORIES[categoryId]
    if (category.required) return // 必須カテゴリーは変更不可

    setEnabledCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
    // トグル変更時はインプットデータをクリア（再収集を促す）
    setInputData(null)
  }

  // プロンプトを生成して表示
  const buildAndShowPrompt = async () => {
    try {
      setInputLoading(true)

      // Assistants API用の短いプロンプト
      if (useAssistantsAPI) {
        // インプットデータを収集してファイルリストを取得
        let data = inputData
        if (!data) {
          data = await collectAllInputs(targetYear, targetMonth, enabledCategories)
          setInputData(data)
        }

        // 収集したファイルリストを抽出し、Vector Storeのファイル名形式に変換
        const fileList = []
        Object.entries(data.inputs).forEach(([_key, value]) => {
          if (value.files && value.files.length > 0) {
            value.files.forEach(file => {
              // ファイルパスからファイル名を抽出し、.csv → .json に変換
              const fileName = file.split('/').pop()
              const txtFileName = fileName.replace(/\.csv$/, '.json')
              fileList.push({ original: fileName, uploaded: txtFileName })
            })
          }
        })

        const constraintsArray = aiPrompt
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.trim())

        // 対象月の日数を計算
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate()

        const shortPrompt = `${targetYear}年${targetMonth}月のシフトを生成してください。

【ステップ1: 過去のシフトフォーマットを確認】
まず、shift_history_2023-2024.jsonを読み込んで、以下を確認してください：
- CSVのカラム構成（列名、順序）
- 各カラムのデータ型と形式
- shift_idのフォーマット（例: SH001、SHIFT001など）
- 日付・時刻のフォーマット

【ステップ2: マスターデータから実際の値を取得】
以下のファイルを読み込んで、実際に存在する値を取得してください：

1. staff.json から：
   - is_active=TRUEの全スタッフを候補として取得（通常10人程度）
   - 実際のstaff_id（数値: 1, 2, 3, ...）
   - staff_name、role、hourly_rate、min_hours_per_week、max_hours_per_weekなど全情報

2. stores.json から：
   - store_id
   - regular_holiday（定休日）
   - 営業時間

3. その他必要なマスターデータ

【ステップ3: シフト生成ルール】
- フォーマットは過去のシフト（shift_history_2023-2024.json）と完全に同一にする
- 全ての値はマスターデータに実際に存在する値のみを使用する
- staff.jsonから取得した全スタッフを候補として、バランス良くシフトに配置する
- 各スタッフの希望労働時間（min_hours_per_week, max_hours_per_week）を考慮する
- staff_idは必ず数値（1, 2, 3など）を使用（STF001などの文字列は禁止）
- staff_nameはstaff.jsonに記載されている正確な名前を使用
- 定休日にはシフトを作成しない
- 対象期間: ${targetYear}年${targetMonth}月の全営業日（最大${daysInMonth}日間）
- 省略（...）は絶対に使用せず、全てのシフトを出力する
- 各営業日には、営業に必要な人数を確保する

【必須: Vector Store内のファイル一覧】
Vector Storeには以下のCSVファイルが.txt形式で保存されています：
${fileList.map(f => `- ${f.uploaded} (元: ${f.original})`).join('\n')}

上記の全ファイルを必ず検索・読み込み、その内容に基づいてシフトを生成してください。
ファイルを読まずに推測や想像で応答することは禁止です。

【追加制約】
${constraintsArray.length > 0 ? constraintsArray.join('\n') : 'なし'}

【出力方法】
1. Pythonでシフトデータを生成し、CSVファイル（shift_${targetYear}_${String(targetMonth).padStart(2, '0')}.csv）として保存してください
2. サマリー情報をJSON形式で返してください

重要: CSVファイルには全営業日分の全シフトが含まれており、省略は一切ありません。
優先順位（CRITICAL > HIGH > MEDIUM > LOW）に従ってシフトを作成してください。`

        setGeneratedPrompt(shortPrompt)
        setShowPromptEditor(true)
        setIsPromptEditable(false)
        setInputLoading(false)
        return
      }

      // Chat Completions API用の長いプロンプト
      // インプットデータを収集（まだ無い場合）
      let data = inputData
      if (!data) {
        data = await collectAllInputs(targetYear, targetMonth, enabledCategories)
        setInputData(data)
      }

      // パラメータを解析
      const constraintsArray = aiPrompt
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.trim())

      // インプットデータをプロンプトに含める
      let prompt = ''
      if (data) {
        prompt += formatInputsForPrompt(data) + '\n\n'
      }

      // 基本プロンプトを構築
      prompt += buildShiftGenerationPrompt({
        year: targetYear,
        month: targetMonth,
        staffCount: data ? data.inputs.staffData.summary.totalStaff : 5,
        budgetLimit: 1000000,
        constraints: constraintsArray,
        preferences: [],
      })

      setGeneratedPrompt(prompt)
      setShowPromptEditor(true)
      setIsPromptEditable(false)
    } catch (error) {
      console.error('プロンプト生成エラー:', error)
      setGeneratedPrompt(`エラー: ${error.message}`)
    } finally {
      setInputLoading(false)
    }
  }

  // Vector Storeセットアップ
  const handleSetupVectorStore = async () => {
    try {
      setIsSettingUp(true)
      setSetupProgress({ message: 'セットアップ開始...', current: 0, total: 11 })

      const vsId = await setupVectorStore(tenantId, null, (message, current, total) => {
        setSetupProgress({ message, current, total })
      })

      setVectorStoreId(vsId)
      localStorage.setItem('vectorStoreId', vsId)
      setSetupProgress({ message: 'セットアップ完了！', current: 11, total: 11 })

      setTimeout(() => {
        setSetupProgress({ message: '', current: 0, total: 0 })
      }, 3000)
    } catch (error) {
      console.error('Vector Storeセットアップエラー:', error)
      setSetupProgress({ message: `エラー: ${error.message}`, current: 0, total: 0 })
    } finally {
      setIsSettingUp(false)
    }
  }

  // Assistant IDとVector Store IDをリセット
  const resetAssistantSetup = () => {
    if (
      window.confirm(
        'AssistantとVector Storeの設定をリセットしますか？\n次回セットアップ時に新しいAssistantが作成されます。'
      )
    ) {
      localStorage.removeItem('assistantId')
      localStorage.removeItem('vectorStoreId')
      setAssistantId('')
      setVectorStoreId('')
      console.log('✅ AssistantとVector Storeの設定をリセットしました')
    }
  }

  // シフト生成（ChatGPT-4 + インプットデータ または Assistants API）
  const executeShiftGeneration = async () => {
    try {
      setAiLoading(true)
      setAiResponse('シフトを生成中...')
      setGeneratedShiftValidation(null) // 前回のバリデーション結果をクリア

      const userInput = `シフト生成: ${targetYear}年${targetMonth}月\n追加制約:\n${aiPrompt}`

      // Assistants APIを使用する場合
      if (useAssistantsAPI) {
        if (!vectorStoreId) {
          setAiResponse('⚠️ 先にVector Storeをセットアップしてください。')
          setAiLoading(false)
          return
        }

        // 編集されたプロンプトまたは動的生成プロンプトを使用
        let finalPrompt = generatedPrompt

        // プロンプトが未生成の場合は動的に生成
        if (!finalPrompt || !showPromptEditor) {
          // インプットデータを収集してファイルリストを取得
          let data = inputData
          if (!data) {
            data = await collectAllInputs(targetYear, targetMonth, enabledCategories)
            setInputData(data)
          }

          // 収集したファイルリストを抽出し、Vector Storeのファイル名形式に変換
          const fileList = []
          Object.entries(data.inputs).forEach(([_key, value]) => {
            if (value.files && value.files.length > 0) {
              value.files.forEach(file => {
                // ファイルパスからファイル名を抽出し、.csv → .json に変換
                const fileName = file.split('/').pop()
                const txtFileName = fileName.replace(/\.csv$/, '.json')
                fileList.push({ original: fileName, uploaded: txtFileName })
              })
            }
          })

          const constraintsArray = aiPrompt
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.trim())

          const daysInMonth = new Date(targetYear, targetMonth, 0).getDate()

          finalPrompt = `${targetYear}年${targetMonth}月のシフトを生成してください。

【ステップ1: 過去のシフトフォーマットを確認】
まず、shift_history_2023-2024.jsonを読み込んで、以下を確認してください：
- CSVのカラム構成（列名、順序）
- 各カラムのデータ型と形式
- shift_idのフォーマット（例: SH001、SHIFT001など）
- 日付・時刻のフォーマット

【ステップ2: マスターデータから実際の値を取得】
以下のファイルを読み込んで、実際に存在する値を取得してください：

1. staff.json から：
   - is_active=TRUEの全スタッフを候補として取得（通常10人程度）
   - 実際のstaff_id（数値: 1, 2, 3, ...）
   - staff_name、role、hourly_rate、min_hours_per_week、max_hours_per_weekなど全情報

2. stores.json から：
   - store_id
   - regular_holiday（定休日）
   - 営業時間

3. その他必要なマスターデータ

【ステップ3: シフト生成ルール】
- フォーマットは過去のシフト（shift_history_2023-2024.json）と完全に同一にする
- 全ての値はマスターデータに実際に存在する値のみを使用する
- staff.jsonから取得した全スタッフを候補として、バランス良くシフトに配置する
- 各スタッフの希望労働時間（min_hours_per_week, max_hours_per_week）を考慮する
- staff_idは必ず数値（1, 2, 3など）を使用（STF001などの文字列は禁止）
- staff_nameはstaff.jsonに記載されている正確な名前を使用
- 定休日にはシフトを作成しない
- 対象期間: ${targetYear}年${targetMonth}月の全営業日（最大${daysInMonth}日間）
- 省略（...）は絶対に使用せず、全てのシフトを出力する
- 各営業日には、営業に必要な人数を確保する

【必須: Vector Store内のファイル一覧】
Vector Storeには以下のCSVファイルが.txt形式で保存されています：
${fileList.map(f => `- ${f.uploaded} (元: ${f.original})`).join('\n')}

上記の全ファイルを必ず検索・読み込み、その内容に基づいてシフトを生成してください。
ファイルを読まずに推測や想像で応答することは禁止です。

【追加制約】
${constraintsArray.length > 0 ? constraintsArray.join('\n') : 'なし'}

【出力方法】
1. Pythonでシフトデータを生成し、CSVファイル（shift_${targetYear}_${String(targetMonth).padStart(2, '0')}.csv）として保存してください
2. サマリー情報をJSON形式で返してください

重要: CSVファイルには全営業日分の全シフトが含まれており、省略は一切ありません。
優先順位（CRITICAL > HIGH > MEDIUM > LOW）に従ってシフトを作成してください。`.trim()
        }

        const result = await generateShiftWithAssistant({
          year: targetYear,
          month: targetMonth,
          vectorStoreId,
          assistantId,
          customPrompt: finalPrompt,
          onProgress: msg => setAiResponse(`生成中... ${msg}`),
        })

        if (result.assistantId && !assistantId) {
          setAssistantId(result.assistantId)
          localStorage.setItem('assistantId', result.assistantId)
        }

        if (result.success) {
          try {
            // Code Interpreterで生成されたCSVファイルをチェック
            if (result.csvContent) {
              // CSVファイルが生成された場合（新しいCode Interpreter方式）
              console.log('Code InterpreterによるCSVファイルを検出しました')

              // CSVデータをパース
              const parsedCsv = Papa.parse(result.csvContent, {
                header: true,
                skipEmptyLines: true,
              })

              const actualShiftCount = parsedCsv.data.length

              // CSVファイルをサーバーに保存（タイムスタンプ付き）
              const timestamp = generateTimestamp()
              const filename = `shift_${targetYear}${String(targetMonth).padStart(2, '0')}_${timestamp}.csv`
              try {
                const saveResponse = await fetch(getApiUrl(API_ENDPOINTS.SAVE_CSV), {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    filename,
                    content: result.csvContent,
                  }),
                })

                if (saveResponse.ok) {
                  const saveResult = await saveResponse.json()
                  console.log(`✅ CSVファイルを保存しました: ${saveResult.filepath}`)
                } else {
                  console.error('CSVファイル保存失敗:', await saveResponse.text())
                }
              } catch (saveError) {
                console.error('CSVファイル保存エラー:', saveError)
              }

              // バリデーション用にshift_dateフィールドを追加（year, month, dateから生成）
              const shiftsWithDate = parsedCsv.data.map(shift => ({
                ...shift,
                shift_date: `${shift.year}-${String(shift.month).padStart(2, '0')}-${String(shift.date).padStart(2, '0')}`,
              }))

              // バリデーション実行
              let validationResult = null
              try {
                validationResult = await validateShifts(shiftsWithDate)
              } catch (validationError) {
                console.error('バリデーションエラー:', validationError)
              }

              // サマリー情報を取得（パースされたJSON または 生成）
              // AIのJSONは { "summary": {...}, "notes": "..." } 形式なので summary.summary でアクセス
              const summary = result.summary?.summary || {
                year: targetYear,
                month: targetMonth,
                totalShifts: actualShiftCount,
                totalStaff: 'N/A',
                totalWorkHours: 'N/A',
                estimatedCost: 'N/A',
                constraintsViolations: 'N/A',
              }
              const notes = result.summary?.notes || null

              // AIの生の応答を作成
              let response = `📅 AI応答 (Assistants API - Code Interpreter)\n\n`
              response += `## サマリー\n`
              response += `- 対象: ${summary.year}年${summary.month}月\n`
              response += `- 実際のシフト数: ${actualShiftCount}件\n`
              response += `- AIが報告したシフト数: ${summary.totalShifts}件\n`
              response += `- スタッフ数: ${summary.totalStaff}名\n`
              response += `- 総労働時間: ${summary.totalWorkHours}時間\n`
              response += `- 予想人件費: ${summary.estimatedCost}円\n`
              response += `- AIが報告した制約違反: ${summary.constraintsViolations}件\n\n`

              if (notes) {
                response += `## 備考\n${notes}\n\n`
              }

              if (result.citations && result.citations.length > 0) {
                response += `## 参照データ\n`
                result.citations.forEach((citation, idx) => {
                  response += `${idx + 1}. ${citation.text || 'データ参照'}\n`
                })
                response += `\n`
              }

              response += `## AI応答メッセージ\n${result.message}\n\n`

              response += `## 生成されたシフトCSVデータ (${actualShiftCount}件)\n`
              response += `\`\`\`csv\n${result.csvContent}\n\`\`\`\n\n`
              response += `💾 CSVデータをコピーしてファイルとして保存できます。`

              setAiResponse(response)

              // バリデーション結果を別途保存
              setGeneratedShiftValidation(validationResult)

              // ログには生のJSON応答を保存（バリデーション結果も一緒に）
              await addToConversationLog(
                userInput,
                `Code Interpreter応答:\n${result.message}\n\nCSVシフト数: ${actualShiftCount}件`,
                'generate',
                validationResult
              )
            } else {
              // 従来のJSON形式の場合（後方互換性のため残す）
              console.warn('CSVファイルが見つかりませんでした。従来のJSON形式を試みます。')

              let jsonResponse = result.message.trim()
              jsonResponse = jsonResponse.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '')

              const shiftData = JSON.parse(jsonResponse)

              // CSVデータをパースしてバリデーション実行
              let validationResult = null
              try {
                const parsedCsv = Papa.parse(shiftData.shifts_csv, {
                  header: true,
                  skipEmptyLines: true,
                })

                if (parsedCsv.data && parsedCsv.data.length > 0) {
                  validationResult = await validateShifts(parsedCsv.data)
                }
              } catch (validationError) {
                console.error('バリデーションエラー:', validationError)
              }

              // AIの生の応答を作成（バリデーション結果は含めない）
              let response = `📅 AI応答 (Assistants API)\n\n`
              response += `## サマリー\n`
              response += `- 対象: ${shiftData.summary.year}年${shiftData.summary.month}月\n`
              response += `- シフト数: ${shiftData.summary.totalShifts}件\n`
              response += `- スタッフ数: ${shiftData.summary.totalStaff}名\n`
              response += `- 総労働時間: ${shiftData.summary.totalWorkHours}時間\n`
              response += `- 予想人件費: ${shiftData.summary.estimatedCost}円\n`
              response += `- AIが報告した制約違反: ${shiftData.summary.constraintsViolations}件\n\n`

              if (shiftData.notes) {
                response += `## 備考\n${shiftData.notes}\n\n`
              }

              if (result.citations && result.citations.length > 0) {
                response += `## 参照データ\n`
                result.citations.forEach((citation, idx) => {
                  response += `${idx + 1}. ${citation.text || 'データ参照'}\n`
                })
                response += `\n`
              }

              response += `## シフトCSVデータ\n`
              response += `\`\`\`csv\n${shiftData.shifts_csv}\n\`\`\`\n\n`
              response += `💾 CSVデータをコピーしてファイルとして保存できます。`

              setAiResponse(response)

              // バリデーション結果を別途保存
              setGeneratedShiftValidation(validationResult)

              // ログには生のJSON応答を保存（バリデーション結果も一緒に）
              await addToConversationLog(
                userInput,
                `JSON応答:\n${jsonResponse}`,
                'generate',
                validationResult
              )
            }
          } catch (parseError) {
            console.error('Parse error:', parseError)
            const response = `⚠️ 応答の処理中にエラーが発生しました。\n\nエラー: ${parseError.message}\n\n生の応答:\n${result.message}`
            setAiResponse(response)
            await addToConversationLog(userInput, result.message, 'generate')
          }
        } else {
          setAiResponse(`エラー: ${result.error}`)
          await addToConversationLog(userInput, result.error, 'generate')
        }

        setAiLoading(false)
        setShowPromptEditor(false)
        return
      }

      // 従来のChat Completions API（長いプロンプト）
      const result = await sendToChatGPT(generatedPrompt, {
        maxTokens: 8000,
        temperature: 0.3,
        systemMessage:
          'あなたはシフト管理の専門家です。提供されたインプットデータを分析し、ハード制約を最優先し、ソフト制約を可能な限り満たすシフトを生成してください。必ず指定されたJSON形式で応答してください。重要: shifts_csvフィールドには対象月の全営業日分・全スタッフのシフトを1件も省略せず完全に出力してください。定休日は除き、営業日のみシフトを作成してください。"..."などの省略記号は絶対に使用しないでください。',
      })

      if (result.success) {
        try {
          // JSONをパース
          let jsonResponse = result.message.trim()

          // マークダウンのコードブロックを削除（念のため）
          jsonResponse = jsonResponse.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '')

          const shiftData = JSON.parse(jsonResponse)

          // CSVデータをパースしてバリデーション実行
          let validationResult = null
          try {
            const parsedCsv = Papa.parse(shiftData.shifts_csv, {
              header: true,
              skipEmptyLines: true,
            })

            if (parsedCsv.data && parsedCsv.data.length > 0) {
              validationResult = await validateShifts(parsedCsv.data)
            }
          } catch (validationError) {
            console.error('バリデーションエラー:', validationError)
          }

          // AIの生の応答を作成（バリデーション結果は含めない）
          let response = `📅 AI応答 (Chat Completions API)\n\n`
          response += `## サマリー\n`
          response += `- 対象: ${shiftData.summary.year}年${shiftData.summary.month}月\n`
          response += `- シフト数: ${shiftData.summary.totalShifts}件\n`
          response += `- スタッフ数: ${shiftData.summary.totalStaff}名\n`
          response += `- 総労働時間: ${shiftData.summary.totalWorkHours}時間\n`
          response += `- 予想人件費: ${shiftData.summary.estimatedCost}円\n`
          response += `- AIが報告した制約違反: ${shiftData.summary.constraintsViolations}件\n\n`

          if (shiftData.notes) {
            response += `## 備考\n${shiftData.notes}\n\n`
          }

          response += `## シフトCSVデータ\n`
          response += `\`\`\`csv\n${shiftData.shifts_csv}\n\`\`\`\n\n`
          response += `💾 CSVデータをコピーしてファイルとして保存できます。`

          setAiResponse(response)

          // バリデーション結果を別途保存
          setGeneratedShiftValidation(validationResult)

          // ログには生のJSON応答を保存（バリデーション結果も一緒に）
          await addToConversationLog(
            `${userInput}\n\n--- 送信したプロンプト ---\n${generatedPrompt}`,
            `JSON応答:\n${jsonResponse}`,
            'generate',
            validationResult
          )
        } catch (parseError) {
          // JSONパースに失敗した場合は生のレスポンスを表示
          console.error('JSON parse error:', parseError)
          const response = `⚠️ JSON形式での応答を期待していましたが、パースに失敗しました。\n\n生の応答:\n${result.message}\n\n💡 プロンプトを調整してもう一度試してください。`
          setAiResponse(response)
          await addToConversationLog(userInput, result.message, 'generate')
        }
      } else {
        const errorMessage = `エラー: ${result.error}`
        setAiResponse(errorMessage)
        await addToConversationLog(userInput, errorMessage, 'generate')
      }
    } catch (error) {
      const errorMessage = `エラー: ${error.message}`
      setAiResponse(errorMessage)
      await addToConversationLog(`シフト生成: ${aiPrompt}`, errorMessage, 'generate')
    } finally {
      setAiLoading(false)
      setShowPromptEditor(false)
    }
  }

  // 対話ログを.log形式で出力
  const exportLogsToFile = (logs, fileNumber) => {
    const filename = `conversation_log_${fileNumber}.log`

    // .log形式でシンプルに出力
    let logContent = `=== AI Conversation Log #${fileNumber} ===\n`
    logContent += `Generated: ${new Date().toISOString()}\n`
    logContent += `Total Entries: ${logs.length}\n`
    logContent += `${'='.repeat(80)}\n\n`

    // ログエントリを追加
    logs.forEach((log, index) => {
      logContent += `[Entry #${index + 1}] ${log.timestamp}\n`
      logContent += `Mode: ${log.mode === 'chat' ? 'AI対話' : 'シフト生成'}\n`
      logContent += `${'─'.repeat(80)}\n`
      logContent += `[User Input]\n${log.userInput}\n\n`
      logContent += `[AI Response] (${log.responseLength} chars)\n${log.aiResponse}\n`
      logContent += `${'='.repeat(80)}\n\n`
    })

    // ダウンロード
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log(`✅ ${filename} をダウンロードしました (${logs.length}件)`)
  }

  // ログを追加し、閾値を超えたら.log出力してローテーション
  const addToConversationLog = async (userInput, aiResponse, mode, validationResult = null) => {
    const logId = `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const logEntry = {
      logId, // ユニークID
      timestamp: new Date().toISOString(),
      mode,
      userInput,
      aiResponse,
      responseLength: aiResponse.length,
    }

    // IndexedDBに即座に保存
    await saveLogToIndexedDB(logEntry)

    const updatedLog = [...conversationLog, logEntry]
    setConversationLog(updatedLog)

    // バリデーション結果がある場合は保存
    if (validationResult && mode === 'generate') {
      await addToValidationLog(logId, validationResult)
    }

    // ログが閾値を超えたら自動的に.log出力してローテーション
    if (updatedLog.length >= LOG_THRESHOLD) {
      exportLogsToFile(updatedLog, currentLogFile)

      // IndexedDBをクリアして次のファイル番号に進む
      await clearLogsFromIndexedDB()
      setConversationLog([])

      const nextFileNum = currentLogFile + 1
      setCurrentLogFile(nextFileNum)
      localStorage.setItem('currentLogFileNumber', nextFileNum.toString())

      console.log(
        `📝 ログファイル #${currentLogFile} をダウンロードしました。次は #${nextFileNum} に保存されます。`
      )
    }
  }

  // バリデーションログを追加
  const addToValidationLog = async (conversationLogId, validationResult) => {
    const validationEntry = {
      conversationLogId,
      timestamp: new Date().toISOString(),
      isValid: validationResult.isValid,
      errorCount: validationResult.errorCount,
      warningCount: validationResult.warningCount,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
    }

    // IndexedDBに保存
    await saveValidationToIndexedDB(validationEntry)

    const updatedValidationLog = [...validationLog, validationEntry]
    setValidationLog(updatedValidationLog)

    // 100件でローテーション
    if (updatedValidationLog.length >= LOG_THRESHOLD) {
      exportValidationLogsToFile(updatedValidationLog, currentValidationLogFile)
      await clearValidationLogsFromIndexedDB()
      setValidationLog([])

      const nextFileNum = currentValidationLogFile + 1
      setCurrentValidationLogFile(nextFileNum)
      localStorage.setItem('currentValidationLogFileNumber', nextFileNum.toString())

      console.log(
        `📋 バリデーションログファイル #${currentValidationLogFile} をダウンロードしました。次は #${nextFileNum} に保存されます。`
      )
    }
  }

  // バリデーションログをIndexedDBに保存
  const saveValidationToIndexedDB = async validationEntry => {
    try {
      const db = await openLogDB()
      const tx = db.transaction('validationLogs', 'readwrite')
      const store = tx.objectStore('validationLogs')

      const request = store.add(validationEntry)
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('バリデーションログのIndexedDB保存エラー:', error)
    }
  }

  // バリデーションログをクリア
  const clearValidationLogsFromIndexedDB = async () => {
    try {
      const db = await openLogDB()
      const tx = db.transaction('validationLogs', 'readwrite')
      const store = tx.objectStore('validationLogs')

      const request = store.clear()
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('バリデーションログのクリアエラー:', error)
    }
  }

  // バリデーションログをファイル出力
  const exportValidationLogsToFile = (logs, fileNumber) => {
    const filename = `validation_log_${fileNumber}.log`

    let logContent = `=== Shift Validation Log #${fileNumber} ===\n`
    logContent += `Generated: ${new Date().toISOString()}\n`
    logContent += `Total Entries: ${logs.length}\n`
    logContent += `${'='.repeat(80)}\n\n`

    logs.forEach((log, index) => {
      logContent += `[Entry #${index + 1}] ${log.timestamp}\n`
      logContent += `Conversation Log ID: ${log.conversationLogId}\n`
      logContent += `総合判定: ${log.isValid ? '✓ 合格' : '✗ 不合格'}\n`
      logContent += `エラー: ${log.errorCount}件 | 警告: ${log.warningCount}件\n`
      logContent += `${'─'.repeat(80)}\n`

      if (log.errors.length > 0) {
        logContent += `\n【エラー詳細】\n`
        log.errors.forEach((error, idx) => {
          logContent += `  ${idx + 1}. [${error.rule_id}] ${error.message}\n`
          if (error.category) logContent += `     カテゴリ: ${error.category}\n`
          if (error.details) logContent += `     詳細: ${error.details}\n`
        })
      }

      if (log.warnings.length > 0) {
        logContent += `\n【警告詳細】\n`
        log.warnings.forEach((warning, idx) => {
          logContent += `  ${idx + 1}. [${warning.rule_id}] ${warning.message}\n`
          if (warning.category) logContent += `     カテゴリ: ${warning.category}\n`
          if (warning.details) logContent += `     詳細: ${warning.details}\n`
        })
      }

      logContent += `\n${'='.repeat(80)}\n\n`
    })

    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log(`✅ ${filename} をダウンロードしました (${logs.length}件)`)
  }

  // 手動でログを.log出力
  const downloadLogsManually = () => {
    if (conversationLog.length === 0) return
    exportLogsToFile(conversationLog, currentLogFile)

    // ダウンロード後もログは保持（手動の場合はクリアしない）
    console.log(
      `📥 手動ダウンロード: conversation_log_${currentLogFile}.log (${conversationLog.length}件)`
    )
  }

  // 手動でバリデーションログを.log出力
  const downloadValidationLogsManually = () => {
    if (validationLog.length === 0) return
    exportValidationLogsToFile(validationLog, currentValidationLogFile)

    // ダウンロード後もログは保持（手動の場合はクリアしない）
    console.log(
      `📥 手動ダウンロード: validation_log_${currentValidationLogFile}.log (${validationLog.length}件)`
    )
  }

  // AI応答をクリップボードにコピー
  const copyAiResponse = async () => {
    try {
      await navigator.clipboard.writeText(aiResponse)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('コピーに失敗:', error)
    }
  }

  // バリデーション結果をクリップボードにコピー
  const copyValidationResult = async () => {
    if (!generatedShiftValidation) return

    try {
      let text = `=== シフトバリデーション結果 ===\n\n`
      text += `総合判定: ${generatedShiftValidation.isValid ? '✓ 合格' : '✗ 不合格'}\n`
      text += `エラー件数: ${generatedShiftValidation.errorCount}件\n`
      text += `警告件数: ${generatedShiftValidation.warningCount}件\n\n`

      if (generatedShiftValidation.errors.length > 0) {
        text += `【エラー詳細】\n`
        generatedShiftValidation.errors.forEach((error, idx) => {
          text += `${idx + 1}. [${error.rule_id}] ${error.message}\n`
          if (error.category) text += `   カテゴリ: ${error.category}\n`
          if (error.details) text += `   詳細: ${error.details}\n`
        })
        text += `\n`
      }

      if (generatedShiftValidation.warnings.length > 0) {
        text += `【警告詳細】\n`
        generatedShiftValidation.warnings.forEach((warning, idx) => {
          text += `${idx + 1}. [${warning.rule_id}] ${warning.message}\n`
          if (warning.category) text += `   カテゴリ: ${warning.category}\n`
          if (warning.details) text += `   詳細: ${warning.details}\n`
        })
      }

      await navigator.clipboard.writeText(text)
      setCopiedValidation(true)
      setTimeout(() => setCopiedValidation(false), 2000)
    } catch (error) {
      console.error('コピーに失敗:', error)
    }
  }

  // バリデーション結果を元に改善プロンプトを生成
  const generateImprovementPrompt = async () => {
    if (!generatedShiftValidation) return

    setInputLoading(true)

    try {
      // インプットデータを収集してファイルリストを取得
      let data = inputData
      if (!data) {
        data = await collectAllInputs(targetYear, targetMonth, enabledCategories)
        setInputData(data)
      }

      // 収集したファイルリストを抽出し、Vector Storeのファイル名形式に変換
      const fileList = []
      Object.entries(data.inputs).forEach(([_key, value]) => {
        if (value.files && value.files.length > 0) {
          value.files.forEach(file => {
            const fileName = file.split('/').pop()
            const txtFileName = fileName.replace(/\.csv$/, '.json')
            fileList.push({ original: fileName, uploaded: txtFileName })
          })
        }
      })

      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate()

      // バリデーション結果を元にしたプロンプトを生成
      let improvementPrompt = `${targetYear}年${targetMonth}月のシフトを再生成してください。

【前回のバリデーション結果】
- 総合判定: ${generatedShiftValidation.isValid ? '✓ 合格' : '✗ 不合格'}
- エラー件数: ${generatedShiftValidation.errorCount}件
- 警告件数: ${generatedShiftValidation.warningCount}件

`

      // エラー詳細を追加
      if (generatedShiftValidation.errors.length > 0) {
        improvementPrompt += `【解消すべきエラー】\n`
        generatedShiftValidation.errors.forEach((error, idx) => {
          improvementPrompt += `${idx + 1}. [${error.rule_id}] ${error.message}\n`
          if (error.details) improvementPrompt += `   詳細: ${error.details}\n`
        })
        improvementPrompt += `\n`
      }

      // 警告詳細を追加
      if (generatedShiftValidation.warnings.length > 0) {
        improvementPrompt += `【改善すべき警告】\n`
        generatedShiftValidation.warnings.slice(0, 10).forEach((warning, idx) => {
          improvementPrompt += `${idx + 1}. [${warning.rule_id}] ${warning.message}\n`
          if (warning.details) improvementPrompt += `   詳細: ${warning.details}\n`
        })
        if (generatedShiftValidation.warnings.length > 10) {
          improvementPrompt += `...他 ${generatedShiftValidation.warnings.length - 10} 件\n`
        }
        improvementPrompt += `\n`
      }

      improvementPrompt += `【ステップ1: 過去のシフトフォーマットを確認】
まず、shift_history_2023-2024.jsonを読み込んで、以下を確認してください：
- CSVのカラム構成（列名、順序）
- 各カラムのデータ型と形式
- shift_idのフォーマット（例: SH001、SHIFT001など）
- 日付・時刻のフォーマット

【ステップ2: マスターデータから実際の値を取得】
以下のファイルを読み込んで、実際に存在する値を取得してください：

1. staff.json から：
   - is_active=TRUEの全スタッフを候補として取得（通常10人程度）
   - 実際のstaff_id（数値: 1, 2, 3, ...）
   - staff_name、role、hourly_rate、min_hours_per_week、max_hours_per_weekなど全情報

2. stores.json から：
   - store_id
   - regular_holiday（定休日）
   - 営業時間

3. その他必要なマスターデータ

【ステップ3: シフト生成ルール】
- フォーマットは過去のシフト（shift_history_2023-2024.json）と完全に同一にする
- 全ての値はマスターデータに実際に存在する値のみを使用する
- staff.jsonから取得した全スタッフを候補として、バランス良くシフトに配置する
- 各スタッフの希望労働時間（min_hours_per_week, max_hours_per_week）を考慮する
- staff_idは必ず数値（1, 2, 3など）を使用（STF001などの文字列は禁止）
- staff_nameはstaff.jsonに記載されている正確な名前を使用
- 定休日にはシフトを作成しない
- 対象期間: ${targetYear}年${targetMonth}月の全営業日（最大${daysInMonth}日間）
- 省略（...）は絶対に使用せず、全てのシフトを出力する
- 各営業日には、営業に必要な人数を確保する

【必須: Vector Store内のファイル一覧】
Vector Storeには以下のCSVファイルが.txt形式で保存されています：
${fileList.map(f => `- ${f.uploaded} (元: ${f.original})`).join('\n')}

上記の全ファイルを必ず検索・読み込み、その内容に基づいてシフトを生成してください。
ファイルを読まずに推測や想像で応答することは禁止です。

【重要: 上記のエラー・警告を必ず解消してください】
特にエラーは全て解消する必要があります。警告もできる限り解消してください。

【出力方法】
1. Pythonでシフトデータを生成し、CSVファイル（shift_${targetYear}_${String(targetMonth).padStart(2, '0')}.csv）として保存してください
2. サマリー情報をJSON形式で返してください

重要: CSVファイルには全営業日分の全シフトが含まれており、省略は一切ありません。
優先順位（CRITICAL > HIGH > MEDIUM > LOW）に従ってシフトを作成してください。`

      setGeneratedPrompt(improvementPrompt)
      setShowPromptEditor(true)
      setIsPromptEditable(true) // 編集可能にする
      setInputLoading(false)
    } catch (error) {
      console.error('改善プロンプト生成エラー:', error)
      setInputLoading(false)
    }
  }

  // CSVファイルインポート処理
  // eslint-disable-next-line no-unused-vars
  const handleImportCSV = event => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      const csvContent = e.target.result

      // CSVをパース
      const parsedCsv = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
      })

      if (parsedCsv.data && parsedCsv.data.length > 0) {
        setImportedShiftData(parsedCsv.data)
        setImportedFileName(file.name)
        console.log(`✅ CSVファイルをインポートしました: ${file.name} (${parsedCsv.data.length}件)`)

        // インポートしたデータをAI応答として表示
        let response = `📥 CSVインポート\n\n`
        response += `ファイル名: ${file.name}\n`
        response += `シフト数: ${parsedCsv.data.length}件\n\n`
        response += `## インポートしたシフトCSVデータ\n`
        response += `\`\`\`csv\n${csvContent}\n\`\`\`\n\n`
        response += `💡 このデータを元に第1案を作成できます。`

        setAiResponse(response)
        setGeneratedShiftValidation(null) // バリデーション結果をクリア
      } else {
        console.error('CSVファイルのパースに失敗しました')
      }
    }

    reader.readAsText(file)
  }

  // インポートしたデータを第1案として使用
  // eslint-disable-next-line no-unused-vars
  const useImportedDataAsFirstDraft = async () => {
    if (!importedShiftData) return

    try {
      // shift_dateフィールドを追加（year, month, dateから生成）
      const shiftsWithDate = importedShiftData.map(shift => ({
        ...shift,
        shift_date: `${shift.year}-${String(shift.month).padStart(2, '0')}-${String(shift.date).padStart(2, '0')}`,
      }))

      // バリデーション実行
      const validationResult = await validateShifts(shiftsWithDate)
      setGeneratedShiftValidation(validationResult)

      // CSVコンテンツを再構築
      const csvContent = Papa.unparse(importedShiftData)

      // AI応答を更新
      let response = `📥 インポートデータを第1案として設定\n\n`
      response += `ファイル名: ${importedFileName}\n`
      response += `シフト数: ${importedShiftData.length}件\n\n`
      response += `## シフトCSVデータ\n`
      response += `\`\`\`csv\n${csvContent}\n\`\`\`\n\n`
      response += `✅ バリデーションを実行しました。`

      setAiResponse(response)

      // ログに保存
      await addToConversationLog(
        `CSVインポート: ${importedFileName}`,
        `インポートしたシフトデータ (${importedShiftData.length}件)`,
        'generate',
        validationResult
      )

      console.log('✅ インポートデータを第1案として設定しました')
    } catch (error) {
      console.error('第1案設定エラー:', error)
    }
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
        title="シフト作成"
        onHome={onHome}
        onShiftManagement={onShiftManagement}
        onLineMessages={onLineMessages}
        onMonitoring={onMonitoring}
        onStaffManagement={onStaffManagement}
        onStoreManagement={onStoreManagement}
        onConstraintManagement={onConstraintManagement}
        onBudgetActualManagement={onBudgetActualManagement}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            AIシフト生成
          </h1>
          <p className="text-sm text-gray-600 mt-1">制約を入力してシフト表を自動生成</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：シフト生成操作エリア */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* 設定トグルボタン */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setShowDevSettings(!showDevSettings)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      設定
                      {showDevSettings ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* 開発者設定エリア（折りたたみ可能） */}
                  {showDevSettings && (
                    <div className="space-y-4 border-t pt-4">
                      {/* Vector Store管理 */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-gray-800 mb-3">Vector Store管理</h4>
                        <div className="space-y-2">
                          {vectorStoreId ? (
                            <div className="bg-green-100 p-3 rounded border border-green-300">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="font-semibold text-green-800">
                                  セットアップ済み
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 font-mono">
                                Vector Store ID: {vectorStoreId.substring(0, 20)}...
                              </div>
                              {assistantId && (
                                <div className="text-xs text-gray-600 font-mono">
                                  Assistant ID: {assistantId.substring(0, 20)}...
                                </div>
                              )}
                              <Button
                                onClick={resetAssistantSetup}
                                size="sm"
                                variant="outline"
                                className="mt-2 h-6 text-xs text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                リセット
                              </Button>
                            </div>
                          ) : (
                            <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
                              <p className="text-sm text-yellow-800 mb-2">
                                ⚠️ Vector
                                Storeが未セットアップです。初回のみセットアップが必要です（10件のCSVファイルをアップロード）。
                              </p>
                              <Button
                                onClick={handleSetupVectorStore}
                                disabled={isSettingUp}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 h-8"
                              >
                                {isSettingUp ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    セットアップ中...
                                  </>
                                ) : (
                                  <>
                                    <Database className="h-3 w-3 mr-1" />
                                    Vector Storeをセットアップ
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          {/* セットアップ進捗 */}
                          {setupProgress.message && (
                            <div className="bg-blue-50 p-2 rounded border border-blue-200">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-800">{setupProgress.message}</span>
                                <span className="text-blue-600 font-semibold">
                                  {setupProgress.current}/{setupProgress.total}
                                </span>
                              </div>
                              {setupProgress.total > 0 && (
                                <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{
                                      width: `${(setupProgress.current / setupProgress.total) * 100}%`,
                                    }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 対象期間入力 */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-800 mb-3">対象期間</h4>
                        <div className="flex gap-3 items-center">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">年</label>
                            <input
                              type="number"
                              min="2020"
                              max="2030"
                              value={targetYear}
                              onChange={e => {
                                setTargetYear(parseInt(e.target.value))
                                setInputData(null) // 期間変更時はデータクリア
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">月</label>
                            <input
                              type="number"
                              min="1"
                              max="12"
                              value={targetMonth}
                              onChange={e => {
                                setTargetMonth(parseInt(e.target.value))
                                setInputData(null) // 期間変更時はデータクリア
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">&nbsp;</label>
                            <div className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold text-gray-700">
                              {targetYear}年{targetMonth}月
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* カテゴリートグル */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Database className="h-4 w-4 text-indigo-600" />
                          インプットデータ分類
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.values(INPUT_CATEGORIES).map(category => (
                            <label
                              key={category.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                enabledCategories[category.id]
                                  ? 'bg-white border-indigo-400 shadow-sm'
                                  : 'bg-gray-50 border-gray-200'
                              } ${category.required ? 'opacity-75' : 'hover:border-indigo-300'}`}
                            >
                              <input
                                type="checkbox"
                                checked={enabledCategories[category.id]}
                                onChange={() => toggleCategory(category.id)}
                                disabled={category.required}
                                className="mt-1 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-gray-800">
                                    {category.name}
                                  </span>
                                  {category.required && (
                                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                      必須
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* インプットデータ収集状況 - メインエリア */}
                  <div>
                    <div
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setShowDataCollectionStatus(!showDataCollectionStatus)}
                    >
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Database className="h-4 w-4 text-green-600" />
                        データ収集状況 ({targetYear}年{targetMonth}月)
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={e => {
                            e.stopPropagation()
                            loadInputData()
                          }}
                          disabled={inputLoading}
                          size="sm"
                          variant="ghost"
                          className="h-7 hover:bg-green-100"
                        >
                          {inputLoading ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1" />
                              収集実行
                            </>
                          )}
                        </Button>
                        {showDataCollectionStatus ? (
                          <ChevronUp className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                    </div>

                    {showDataCollectionStatus && (
                      <div className="mt-3 bg-white p-4 rounded-lg border border-gray-200">
                        <div className="space-y-2">
                          {/* カテゴリー別の収集状況 */}
                          <div className="grid grid-cols-1 gap-2">
                            {Object.values(INPUT_CATEGORIES).map(category => {
                              const isEnabled = enabledCategories[category.id]
                              const isCollected =
                                inputData?.inputs?.[
                                  category.id === 'legal'
                                    ? 'legalRequirements'
                                    : category.id === 'store'
                                      ? 'storeConstraints'
                                      : category.id === 'history'
                                        ? 'historicalShifts'
                                        : category.id === 'sales'
                                          ? 'salesForecast'
                                          : category.id === 'staff'
                                            ? 'staffData'
                                            : category.id === 'calendar'
                                              ? 'japaneseEvents'
                                              : 'weatherData'
                                ]

                              return (
                                <div
                                  key={category.id}
                                  className={`flex items-center justify-between p-2 rounded text-xs ${
                                    isCollected
                                      ? 'bg-green-100 border border-green-300'
                                      : isEnabled
                                        ? 'bg-white border border-gray-200'
                                        : 'bg-gray-50 border border-gray-200 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-800">
                                      {category.name}
                                    </span>
                                    {isEnabled ? (
                                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                        収集対象
                                      </span>
                                    ) : (
                                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                                        無効
                                      </span>
                                    )}
                                  </div>
                                  {isCollected ? (
                                    <span className="flex items-center gap-1 text-green-700 font-semibold">
                                      <CheckCircle2 className="h-4 w-4" />
                                      収集済み
                                    </span>
                                  ) : isEnabled ? (
                                    <span className="text-gray-500">未収集</span>
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>

                          {inputData && (
                            <>
                              <div className="border-t border-gray-300 pt-2 mt-2">
                                <Button
                                  onClick={() => setShowInputDetails(!showInputDetails)}
                                  size="sm"
                                  variant="ghost"
                                  className="w-full h-6 text-xs"
                                >
                                  {showInputDetails ? '詳細を閉じる ▲' : '収集データの詳細を表示 ▼'}
                                </Button>
                              </div>
                              {showInputDetails && (
                                <div className="bg-white p-3 rounded text-xs max-h-96 overflow-y-auto border border-gray-300">
                                  {/* 参照ファイル一覧 */}
                                  <div className="mb-4">
                                    <h5 className="font-semibold text-gray-800 mb-2">
                                      📂 参照したCSVファイル
                                    </h5>
                                    {Object.entries(inputData.inputs).map(
                                      ([key, value]) =>
                                        value.files &&
                                        value.files.length > 0 && (
                                          <div
                                            key={key}
                                            className="mb-3 pl-2 border-l-2 border-blue-300"
                                          >
                                            <div className="font-semibold text-blue-700 mb-1">
                                              {value.source}
                                            </div>
                                            <ul className="list-disc list-inside text-gray-600 space-y-1">
                                              {value.files.map((file, idx) => (
                                                <li key={idx} className="font-mono text-xs">
                                                  {file}
                                                </li>
                                              ))}
                                            </ul>
                                            {/* データ件数の詳細 */}
                                            {value.summary && (
                                              <div className="mt-1 text-gray-500 text-xs">
                                                {Object.entries(value.summary).map(
                                                  ([sumKey, sumValue]) =>
                                                    sumKey.endsWith('Count') && (
                                                      <span key={sumKey} className="mr-3">
                                                        {sumKey.replace('Count', '')}: {sumValue}件
                                                      </span>
                                                    )
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )
                                    )}
                                  </div>

                                  {/* プロンプトプレビュー */}
                                  <div className="border-t border-gray-200 pt-3">
                                    <h5 className="font-semibold text-gray-800 mb-2">
                                      📝 生成されるプロンプト（プレビュー）
                                    </h5>
                                    <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-2 rounded">
                                      {formatInputsForPrompt(inputData).substring(0, 2000)}...
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {!inputData && (
                            <div className="text-xs text-gray-600 text-center py-3 bg-gray-50 rounded">
                              💡 「収集実行」ボタンでデータを読み込みます
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 追加制約・希望入力エリア */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-300">
                    <label className="block text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <FileEdit className="h-5 w-5 text-blue-600" />
                      追加の制約・希望を入力
                    </label>
                    <textarea
                      className="w-full p-3 border-2 border-blue-200 rounded-md resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      rows="5"
                      placeholder="例:\n• 週末は必ず2名以上配置してください\n• 田中さんは火曜日休み希望です\n• 水曜日は営業時間を延長します"
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      💡 特別な制約やスタッフの希望を自由に記入してください（1行1項目推奨）
                    </p>
                  </div>

                  {/* アクションボタンエリア */}
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <div className="flex gap-2">
                      <Button
                        onClick={buildAndShowPrompt}
                        disabled={inputLoading || (useAssistantsAPI && !vectorStoreId)}
                        size="default"
                        variant={showPromptEditor ? 'outline' : 'default'}
                        className={
                          showPromptEditor
                            ? 'flex-1'
                            : 'flex-1 bg-green-600 hover:bg-green-700 h-11'
                        }
                      >
                        {inputLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <FileText className="h-5 w-5 mr-2" />
                            {showPromptEditor ? 'プロンプトを再生成' : 'プロンプトを生成'}
                          </>
                        )}
                      </Button>

                      {showPromptEditor && (
                        <>
                          <Button
                            onClick={() => setIsPromptEditable(!isPromptEditable)}
                            size="default"
                            variant="outline"
                            className="flex-1 h-11"
                          >
                            <Code2 className="h-5 w-5 mr-1" />
                            {isPromptEditable ? '編集中' : '編集'}
                          </Button>
                          <Button
                            onClick={executeShiftGeneration}
                            disabled={aiLoading}
                            size="default"
                            className="flex-1 bg-purple-600 hover:bg-purple-700 h-11"
                          >
                            {aiLoading ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                生成中...
                              </>
                            ) : (
                              <>
                                <Play className="h-5 w-5 mr-2" />
                                シフトを生成
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                    {!showPromptEditor && (
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        ① まずプロンプトを生成 → ② 内容を確認・編集 → ③ AIにシフト生成を依頼
                      </p>
                    )}
                  </div>

                  {/* プロンプトエディター */}
                  {showPromptEditor && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border-2 border-yellow-400 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-yellow-600" />
                          生成されたプロンプト
                        </h4>
                        <Button
                          onClick={() => {
                            setShowPromptEditor(false)
                            setIsPromptEditable(false)
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs hover:bg-yellow-100"
                        >
                          ✕ 閉じる
                        </Button>
                      </div>
                      <textarea
                        className={`w-full p-3 border-2 rounded-md text-sm font-mono resize-none transition-all ${
                          isPromptEditable
                            ? 'border-yellow-500 bg-white shadow-inner'
                            : 'border-gray-300 bg-gray-50'
                        }`}
                        rows="10"
                        value={generatedPrompt}
                        onChange={e => setGeneratedPrompt(e.target.value)}
                        readOnly={!isPromptEditable}
                      />
                      <div className="mt-2 p-2 bg-white rounded border border-yellow-300">
                        <p className="text-xs text-gray-700">
                          {isPromptEditable
                            ? '✏️ 編集モード：内容を自由に変更できます。完了したら「シフトを生成」ボタンを押してください。'
                            : '👁️ 閲覧モード：「編集」ボタンを押すと内容を変更できます。'}
                        </p>
                      </div>
                    </div>
                  )}

                  {aiResponse && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-300 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2 text-base">
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                          AI生成結果
                        </h4>
                        <Button
                          onClick={copyAiResponse}
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs hover:bg-purple-100"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 mr-1 text-green-600" />
                              コピー済み
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              コピー
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="bg-white p-4 rounded border border-purple-200 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                          {aiResponse}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* バリデーション結果 */}
                  {generatedShiftValidation && (
                    <div
                      className={`p-4 rounded-lg border-2 shadow-md ${
                        generatedShiftValidation.isValid
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400'
                          : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2 text-base">
                          {generatedShiftValidation.isValid ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          )}
                          検証結果
                        </h4>
                        <div className="flex gap-2">
                          {(generatedShiftValidation.errorCount > 0 ||
                            generatedShiftValidation.warningCount > 0) && (
                            <Button
                              onClick={generateImprovementPrompt}
                              size="sm"
                              variant="default"
                              className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={inputLoading}
                            >
                              {inputLoading ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  生成中...
                                </>
                              ) : (
                                <>
                                  <FileEdit className="h-3 w-3 mr-1" />
                                  改善プロンプトを生成
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            onClick={copyValidationResult}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                          >
                            {copiedValidation ? (
                              <>
                                <Check className="h-3 w-3 mr-1 text-green-600" />
                                コピー済み
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" />
                                コピー
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div
                        className={`p-3 rounded ${generatedShiftValidation.isValid ? 'bg-green-50' : 'bg-red-50'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`font-bold ${generatedShiftValidation.isValid ? 'text-green-800' : 'text-red-800'}`}
                          >
                            {generatedShiftValidation.isValid
                              ? '✓ 全ての制約をクリア'
                              : '✗ 制約違反あり'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span>エラー: {generatedShiftValidation.errorCount}件</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span>警告: {generatedShiftValidation.warningCount}件</span>
                          </div>
                        </div>
                      </div>

                      {generatedShiftValidation.errors.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-semibold text-red-700 mb-2">エラー詳細:</h5>
                          <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {generatedShiftValidation.errors.map((error, idx) => (
                              <li
                                key={idx}
                                className="text-sm bg-white p-2 rounded border-l-4 border-red-500"
                              >
                                <span className="font-mono text-xs bg-red-200 px-2 py-1 rounded">
                                  {error.rule_id}
                                </span>
                                <p className="mt-1">{error.message}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {generatedShiftValidation.warnings.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-semibold text-orange-700 mb-2">警告一覧:</h5>
                          <ul className="space-y-2 max-h-40 overflow-y-auto">
                            {generatedShiftValidation.warnings.slice(0, 5).map((warning, idx) => (
                              <li
                                key={idx}
                                className="text-sm bg-white p-2 rounded border-l-4 border-orange-500"
                              >
                                <span className="font-mono text-xs bg-orange-200 px-2 py-1 rounded">
                                  {warning.rule_id}
                                </span>
                                <p className="mt-1">{warning.message}</p>
                              </li>
                            ))}
                            {generatedShiftValidation.warnings.length > 5 && (
                              <li className="text-sm text-gray-500">
                                ...他 {generatedShiftValidation.warnings.length - 5} 件
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
          </div>

          {/* 右側：プレビュー＆ログエリア */}
          <div className="lg:col-span-1 space-y-6">
            {/* シフトプレビュー */}
            {aiResponse && (
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-purple-600" />
                    シフトプレビュー
                  </h3>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-center mb-3">
                      <div className="text-lg font-bold text-gray-800">
                        {targetYear}年{targetMonth}月
                      </div>
                    </div>
                    {/* カレンダー表示 */}
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['日', '月', '火', '水', '木', '金', '土'].map((day, idx) => (
                          <div
                            key={day}
                            className={`text-center text-xs font-semibold py-1 ${
                              idx === 0
                                ? 'text-red-600'
                                : idx === 6
                                  ? 'text-blue-600'
                                  : 'text-gray-600'
                            }`}
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from(
                          { length: new Date(targetYear, targetMonth, 0).getDate() },
                          (_, i) => {
                            const date = i + 1
                            const dayOfWeek = new Date(targetYear, targetMonth - 1, date).getDay()
                            return (
                              <div
                                key={date}
                                className={`text-center text-xs p-1 rounded ${
                                  dayOfWeek === 0
                                    ? 'bg-red-50 text-red-700'
                                    : dayOfWeek === 6
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-gray-50 text-gray-700'
                                }`}
                                style={{
                                  gridColumnStart:
                                    i === 0
                                      ? new Date(targetYear, targetMonth - 1, 1).getDay() + 1
                                      : 'auto',
                                }}
                              >
                                {date}
                              </div>
                            )
                          }
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-600 text-center">
                      💡 生成されたシフトを確認できます
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ログエリア */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Database className="h-5 w-5 text-gray-600" />
                  ログ
                </h3>
                <div className="space-y-4">
                  {/* 対話ログ管理 */}
                  <div>
                    <div
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setShowLogs(!showLogs)}
                    >
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        対話ログ ({conversationLog.length})
                      </h4>
                      <div className="flex items-center gap-2">
                        {conversationLog.length > 0 && (
                          <Button
                            onClick={e => {
                              e.stopPropagation()
                              downloadLogsManually()
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs hover:bg-blue-100"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            保存
                          </Button>
                        )}
                        {showLogs ? (
                          <ChevronUp className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                    </div>

                    {/* ログ一覧表示（折りたたみ） */}
                    {showLogs && conversationLog.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {conversationLog
                          .slice()
                          .reverse()
                          .map((log, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-xs"
                            >
                              <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                                <span className="font-semibold text-blue-700 text-xs">
                                  #{conversationLog.length - idx}
                                </span>
                                <div className="text-right">
                                  <div className="text-gray-700 text-[10px] font-medium">
                                    {new Date(log.timestamp).toLocaleDateString('ja-JP', {
                                      month: '2-digit',
                                      day: '2-digit',
                                    })}
                                  </div>
                                  <div className="text-gray-500 text-[10px]">
                                    {new Date(log.timestamp).toLocaleTimeString('ja-JP', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-[10px] text-gray-500 mb-1">入力</div>
                                  <div className="bg-blue-50 p-2 rounded text-[11px] text-gray-700 max-h-20 overflow-y-auto">
                                    {log.userInput.length > 200
                                      ? log.userInput.substring(0, 200) + '...'
                                      : log.userInput}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-gray-500 mb-1">
                                    応答 ({log.responseLength}文字)
                                  </div>
                                  <div className="bg-green-50 p-2 rounded text-[11px] text-gray-700 max-h-20 overflow-y-auto">
                                    {log.aiResponse.length > 200
                                      ? log.aiResponse.substring(0, 200) + '...'
                                      : log.aiResponse}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* バリデーションログ管理セクション */}
                  <div>
                    <div
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setShowValidationLogs(!showValidationLogs)}
                    >
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600" />
                        検証ログ ({validationLog.length})
                      </h4>
                      <div className="flex items-center gap-2">
                        {validationLog.length > 0 && (
                          <Button
                            onClick={e => {
                              e.stopPropagation()
                              downloadValidationLogsManually()
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs hover:bg-purple-100"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            保存
                          </Button>
                        )}
                        {showValidationLogs ? (
                          <ChevronUp className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                    </div>

                    {/* バリデーションログ一覧表示（折りたたみ） */}
                    {showValidationLogs && validationLog.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {validationLog
                          .slice()
                          .reverse()
                          .map((log, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-xs"
                            >
                              <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                                <span className="font-semibold text-purple-700 text-xs">
                                  #{validationLog.length - idx}
                                </span>
                                <div className="text-right">
                                  <div className="text-gray-700 text-[10px] font-medium">
                                    {new Date(log.timestamp).toLocaleDateString('ja-JP', {
                                      month: '2-digit',
                                      day: '2-digit',
                                    })}
                                  </div>
                                  <div className="text-gray-500 text-[10px]">
                                    {new Date(log.timestamp).toLocaleTimeString('ja-JP', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div
                                  className={`p-2 rounded-lg ${log.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span
                                      className={`font-semibold text-xs ${log.isValid ? 'text-green-700' : 'text-red-700'}`}
                                    >
                                      {log.isValid ? '✓ 合格' : '✗ 不合格'}
                                    </span>
                                    <div className="text-[10px] text-gray-600">
                                      エラー: {log.errorCount} / 警告: {log.warningCount}
                                    </div>
                                  </div>
                                </div>
                                {log.errors.length > 0 && (
                                  <div>
                                    <div className="text-[10px] text-red-700 font-semibold mb-1">
                                      エラー詳細:
                                    </div>
                                    <div className="space-y-1 max-h-24 overflow-y-auto">
                                      {log.errors.slice(0, 2).map((error, idx) => (
                                        <div
                                          key={idx}
                                          className="text-[10px] bg-red-50 p-1.5 rounded text-red-800"
                                        >
                                          {error.message}
                                        </div>
                                      ))}
                                      {log.errors.length > 2 && (
                                        <div className="text-[10px] text-gray-500 text-center">
                                          +{log.errors.length - 2}件
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {log.warnings.length > 0 && (
                                  <div>
                                    <div className="text-[10px] text-orange-700 font-semibold mb-1">
                                      警告:
                                    </div>
                                    <div className="space-y-1 max-h-16 overflow-y-auto">
                                      {log.warnings.slice(0, 1).map((warning, idx) => (
                                        <div
                                          key={idx}
                                          className="text-[10px] bg-orange-50 p-1.5 rounded text-orange-800"
                                        >
                                          {warning.message}
                                        </div>
                                      ))}
                                      {log.warnings.length > 1 && (
                                        <div className="text-[10px] text-gray-500 text-center">
                                          +{log.warnings.length - 1}件
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI対話チャットボット */}
      <ChatBot assistantId={assistantId} />
    </motion.div>
  )
}

export default DevTools
