import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { 
  RefreshCw, 
  Zap,
  Calendar as CalendarIcon,
  CheckCircle,
  TrendingUp,
  ChevronLeft,
  ArrowRight,
  MessageSquare,
  Send,
  X,
  AlertTriangle,
  Users,
  Clock,
  Eye,
  GitCompare,
  ArrowLeft,
  Minimize2,
  Maximize2,
  GripVertical
} from 'lucide-react'

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

const SecondPlan = ({ onNext, onPrev, onMarkUnsaved, onMarkSaved }) => {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [comparison, setComparison] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [viewMode, setViewMode] = useState('second') // 'second', 'first', 'compare'
  const [messages, setMessages] = useState([
    { id: 1, type: 'system', content: '第2案が生成されました。自然言語で修正指示をお聞かせください。', time: '14:30' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)
  const [shiftData, setShiftData] = useState([])
  const [changedDates, setChangedDates] = useState(new Set())
  const [pendingChange, setPendingChange] = useState(null)
  // 問題のある日付を定義
  const problematicDates = new Set([3, 8, 15, 22, 28]) // 問題のある日付
  const [problemDates, setProblemDates] = useState(new Set([3, 8, 15, 22, 28]))

  // 解決済み問題を管理
  const [resolvedProblems, setResolvedProblems] = useState(new Set())

  // チャットボット最小化状態
  const [isChatMinimized, setIsChatMinimized] = useState(false)

  // チャットボット位置とサイズ
  const [chatPosition, setChatPosition] = useState({ x: window.innerWidth - 336, y: window.innerHeight - 520 })
  const [chatSize, setChatSize] = useState({ width: 320, height: 500 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const chatRef = useRef(null)
  
  // 日付が問題があるかどうかを判定する関数（解決済みは除外）
  const isProblematicDate = (date) => {
    return problematicDates.has(date) && !resolvedProblems.has(date)
  }

  // チャット自動スクロール関数
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  // ドラッグハンドラー
  const handleDragStart = (e) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y
    })
  }

  const handleDrag = (e) => {
    if (isDragging) {
      setChatPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // リサイズハンドラー
  const handleResizeStart = (e) => {
    e.stopPropagation()
    setIsResizing(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleResize = (e) => {
    if (isResizing) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      setChatSize({
        width: Math.max(280, chatSize.width + deltaX),
        height: Math.max(300, chatSize.height + deltaY)
      })
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
  }

  // マウスイベントリスナー
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag)
      window.addEventListener('mouseup', handleDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleDrag)
        window.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDragging, dragStart, chatPosition])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleResize)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, dragStart, chatSize])

  const generateSecondPlan = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      setComparison({
        first: { satisfaction: 72, coverage: 85, cost: 52000 },
        second: { satisfaction: 89, coverage: 92, cost: 48000 }
      })
      // リアルなデモデータ（30日分）
      const demoData = []
      for (let i = 1; i <= 30; i++) {
        const isProblem = problemDates.has(i)
        const shifts = []
        
        if (isProblem) {
          // 問題のある日のパターン
          if (i === 3) {
            shifts.push({ name: '中村', time: '9-13', skill: 2, preferred: true, changed: false })
            shifts.push({ name: '伊藤', time: '13-17', skill: 2, preferred: true, changed: false })
          } else if (i === 8) {
            shifts.push({ name: '山田', time: '9-13', skill: 3, preferred: true, changed: false })
          } else if (i === 15) {
            shifts.push({ name: '佐藤', time: '9-17', skill: 5, preferred: true, changed: false })
          } else if (i === 22) {
            shifts.push({ name: '山田', time: '9-13', skill: 2, preferred: true, changed: false })
            shifts.push({ name: '中村', time: '13-17', skill: 2, preferred: true, changed: false })
          } else if (i === 28) {
            shifts.push({ name: '田中', time: '9-21', skill: 4, preferred: true, changed: false })
          }
        } else {
          // 問題のない日のパターン
          const patterns = [
            [{ name: '田中', time: '9-17', skill: 4, preferred: true, changed: false }],
            [{ name: '佐藤', time: '9-17', skill: 5, preferred: true, changed: false }, { name: '山田', time: '17-21', skill: 3, preferred: true, changed: false }],
            [{ name: '鈴木', time: '9-17', skill: 4, preferred: true, changed: false }],
            [{ name: '高橋', time: '9-15', skill: 4, preferred: true, changed: false }, { name: '田中', time: '15-21', skill: 4, preferred: true, changed: false }],
            [{ name: '佐藤', time: '10-18', skill: 5, preferred: true, changed: false }]
          ]
          shifts.push(...patterns[i % patterns.length])
        }
        
        demoData.push({ date: i, shifts })
      }
      setShiftData(demoData)
    }, 3000)
  }

  // 拡張されたデモパターン（事前影響分析付き）
  const demoPatterns = {
    '田中さんの月曜日を休みにしてください': {
      analysis: {
        changes: '田中さん: 1日 13-21時 → 削除',
        impacts: [
          '1日夜勤(13-21時)が1名不足になります',
          '佐藤さんを1日13-21時に自動配置を提案',
          '佐藤さんの週間勤務: 32時間 → 37時間',
          '全体人件費: -¥3,000の削減'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 1, action: 'remove', staff: '田中' }],
      response: '✅ 変更を実行しました\n• 田中さんの1日のシフトを削除\n• 佐藤さんを1日13-21時に自動配置\n• 人件費¥3,000削減'
    },
    '9月5日の午前に佐藤さんを追加してください': {
      analysis: {
        changes: '佐藤さん: 5日 9-13時に追加配置',
        impacts: [
          '5日午前(9-13時)の人員不足が解消されます',
          'スキル不足問題も同時に解決',
          '佐藤さんの週間勤務: 32時間 → 36時間',
          '全体充足率: 85% → 92%に向上'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 5, action: 'add', staff: '佐藤', time: '9-13', skill: 5 }],
      response: '✅ 変更を実行しました\n• 佐藤さんを5日9-13時に追加配置\n• 人員不足とスキル不足を同時解消\n• 充足率92%に向上'
    },
    '12日午後の山田さんを鈴木さんに変更してください': {
      analysis: {
        changes: '12日午後: 山田さん → 鈴木さんに変更',
        impacts: [
          'スキルレベル: ★☆☆ → ★★★に向上',
          '12日午後のスキル不足問題が解消',
          '山田さんの週間勤務: 35時間 → 31時間',
          '鈴木さんの週間勤務: 30時間 → 34時間'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 12, action: 'modify', staff: '山田', newStaff: '鈴木', time: '13-17', skill: 4 }],
      response: '✅ 変更を実行しました\n• 12日午後を山田さんから鈴木さんに変更\n• スキルレベルが★★★に向上\n• スキル不足問題を解消'
    },
    '田中さんの18日を午前シフトに変更してください': {
      analysis: {
        changes: '田中さん: 18日 17-21時 → 9-13時に変更',
        impacts: [
          '18日夜勤(17-21時)が1名不足になります',
          '佐藤さんを18日17-21時に自動配置を提案',
          '田中さんの希望適合度: 72% → 89%に向上',
          '全体人件費: -¥2,000の削減'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 18, action: 'modify', staff: '田中', time: '9-13', skill: 4 }],
      response: '✅ 変更を実行しました\n• 田中さんの18日を午前シフトに変更\n• 佐藤さんを18日夜勤に自動配置\n• 希望適合度89%に向上'
    },
    '25日午後の高橋さんと山田さんを外してください': {
      analysis: {
        changes: '25日午後: 高橋さんと山田さんを削除',
        impacts: [
          '25日午後の人員過多(4名→2名)が解消',
          '適正人数に調整されます',
          '高橋さんの週間勤務: 34時間 → 30時間',
          '山田さんの週間勤務: 33時間 → 29時間',
          '人件費削減: ¥8,000'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [
        { date: 25, action: 'remove', staff: '高橋' },
        { date: 25, action: 'remove', staff: '山田' }
      ],
      response: '✅ 変更を実行しました\n• 25日午後の高橋さんと山田さんを削除\n• 人員過多を解消(4名→2名)\n• 人件費¥8,000削減'
    },
    '3日の問題を解決してください': {
      analysis: {
        changes: '3日: スキルレベルの高いスタッフに変更',
        impacts: [
          '中村さん（★★）→ 高橋さん（★★★★）に変更',
          'サービス品質が大幅に向上',
          '高橋さんの週間勤務: 30時間 → 34時間',
          'スキル不足問題が完全に解消'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 3, action: 'modify', staff: '中村', newStaff: '高橋', time: '9-13', skill: 4 }],
      response: '✅ 変更を実行しました\n• 3日のスキル不足問題を解決\n• 中村さん→高橋さんに変更\n• サービス品質が向上'
    },
    '8日の問題を解決してください': {
      analysis: {
        changes: '8日: 佐藤さんを追加配置',
        impacts: [
          '人員不足(1名→2名)が解消',
          '業務の安定性が向上',
          '佐藤さんの週間勤務: 32時間 → 36時間',
          '充足率: 85% → 88%に向上'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 8, action: 'add', staff: '佐藤', time: '9-13', skill: 5 }],
      response: '✅ 変更を実行しました\n• 8日の人員不足問題を解決\n• 佐藤さんを追加配置\n• 業務の安定性が向上'
    },
    '15日の問題を解決してください': {
      analysis: {
        changes: '15日: 佐藤さんを休みに、鈴木さんを配置',
        impacts: [
          '佐藤さんの連続勤務問題が解消',
          '労働基準法の遵守',
          '鈴木さんの週間勤務: 30時間 → 34時間',
          'スタッフの健康管理が改善'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 15, action: 'modify', staff: '佐藤', newStaff: '鈴木', time: '9-17', skill: 4 }],
      response: '✅ 変更を実行しました\n• 15日の連続勤務問題を解決\n• 佐藤さん→鈴木さんに変更\n• 労働基準法を遵守'
    },
    '22日の問題を解決してください': {
      analysis: {
        changes: '22日: 高橋さんを追加配置',
        impacts: [
          'ベテランスタッフの配置により安定性向上',
          'トラブル対応力が強化',
          '高橋さんの週間勤務: 30時間 → 34時間',
          'サービス品質が向上'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 22, action: 'add', staff: '高橋', time: '13-17', skill: 4 }],
      response: '✅ 変更を実行しました\n• 22日のベテラン不在問題を解決\n• 高橋さんを追加配置\n• トラブル対応力が強化'
    },
    '28日の問題を解決してください': {
      analysis: {
        changes: '28日: 田中さんの勤務時間を短縮し、佐藤さんと分担',
        impacts: [
          '田中さんの過重労働(12時間→8時間)が解消',
          '佐藤さんが4時間分を補完',
          '田中さんの週間勤務: 42時間 → 38時間',
          '労働時間の適正化'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [
        { date: 28, action: 'modify', staff: '田中', time: '9-17', skill: 4 },
        { date: 28, action: 'add', staff: '佐藤', time: '17-21', skill: 5 }
      ],
      response: '✅ 変更を実行しました\n• 28日の過重労働問題を解決\n• 田中さんの勤務時間を短縮\n• 佐藤さんと分担して適正化'
    }
  }

  const applyShiftChanges = (changes) => {
    // 変更があったことをマーク
    if (onMarkUnsaved) {
      onMarkUnsaved()
    }

    setShiftData(prevData => {
      const newData = [...prevData]
      const newChangedDates = new Set(changedDates)
      const newProblemDates = new Set(problemDates)
      const newResolvedProblems = new Set(resolvedProblems)

      changes.forEach(change => {
        const dayIndex = newData.findIndex(d => d.date === change.date)
        if (dayIndex !== -1) {
          newChangedDates.add(change.date)
          // すべての変更アクションで問題を解決済みとマーク
          newProblemDates.delete(change.date)
          newResolvedProblems.add(change.date)

          if (change.action === 'remove') {
            newData[dayIndex].shifts = newData[dayIndex].shifts.filter(s => s.name !== change.staff)
          } else if (change.action === 'add') {
            newData[dayIndex].shifts.push({
              name: change.staff,
              time: change.time,
              skill: change.skill,
              preferred: true,
              changed: true
            })
          } else if (change.action === 'modify') {
            const shiftIndex = newData[dayIndex].shifts.findIndex(s => s.name === change.staff)
            if (shiftIndex !== -1) {
              if (change.newStaff) {
                // スタッフ変更
                newData[dayIndex].shifts[shiftIndex] = {
                  name: change.newStaff,
                  time: change.time,
                  skill: change.skill,
                  preferred: true,
                  changed: true
                }
              } else {
                // 時間変更
                newData[dayIndex].shifts[shiftIndex] = {
                  ...newData[dayIndex].shifts[shiftIndex],
                  time: change.time,
                  preferred: true,
                  changed: true
                }
              }
            }
          }
        }
      })

      // 状態更新
      setChangedDates(newChangedDates)
      setProblemDates(newProblemDates)
      setResolvedProblems(newResolvedProblems)

      return newData
    })
  }

  const sendMessage = (messageText = null) => {
    const textToSend = messageText || inputValue
    if (!textToSend.trim()) return

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      content: textToSend,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newMessage])
    const currentInput = textToSend
    setInputValue('')
    setIsTyping(true)
    scrollToBottom()

    // 承認待ち状態の処理
    if (pendingChange && (currentInput.toLowerCase().includes('ok') || currentInput.includes('はい') || currentInput.includes('実行'))) {
      setTimeout(() => {
        applyShiftChanges(pendingChange.changes)
        const aiResponse = {
          id: messages.length + 2,
          type: 'assistant',
          content: pendingChange.response,
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, aiResponse])
        setIsTyping(false)
        setPendingChange(null)
        scrollToBottom()
      }, 1500)
      return
    }

    // デモパターンをチェック
    const pattern = demoPatterns[currentInput]
    
    setTimeout(() => {
      if (pattern) {
        // 影響分析を表示
        const analysisContent = `📋 変更予定:\n• ${pattern.analysis.changes}\n\n⚠️ 影響分析:\n${pattern.analysis.impacts.map(impact => `• ${impact}`).join('\n')}\n\n${pattern.analysis.question}`
        
        const aiResponse = {
          id: messages.length + 2,
          type: 'assistant',
          content: analysisContent,
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, aiResponse])
        setPendingChange(pattern)
        scrollToBottom()
      } else {
        const aiResponse = {
          id: messages.length + 2,
          type: 'assistant',
          content: '申し訳ございませんが、その指示は認識できませんでした。以下の例を参考にしてください：\n\n• 田中さんの月曜日を休みにしてください\n• 9月5日の午前に佐藤さんを追加してください\n• 12日午後の山田さんを鈴木さんに変更してください',
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, aiResponse])
        scrollToBottom()
      }
      setIsTyping(false)
    }, 2000)
  }

  const getDateDetails = (date) => {
    const dayData = shiftData.find(d => d.date === date)
    if (!dayData) return null

    return {
      date,
      shifts: dayData.shifts,
      required: { morning: 2, afternoon: 2, evening: 1 },
      assigned: { 
        morning: dayData.shifts.filter(s => s.time.includes('9') || s.time.includes('10')).length,
        afternoon: dayData.shifts.filter(s => s.time.includes('13') || s.time.includes('15')).length,
        evening: dayData.shifts.filter(s => s.time.includes('17') || s.time.includes('21')).length
      },
      issues: [
        ...(dayData.shifts.filter(s => !s.preferred).length > 0 ? ['希望外時間帯あり'] : []),
        ...(dayData.shifts.filter(s => s.skill < 3).length > 2 ? ['スキル不足'] : [])
      ]
    }
  }

  const renderCalendar = (isFirstPlan = false) => {
    const data = isFirstPlan ? getFirstPlanData() : shiftData

    return (
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 30 }, (_, i) => {
          const date = i + 1
          const dayData = data.find(d => d.date === date) || { date, shifts: [] }
          const isProblem = !isFirstPlan && isProblematicDate(date)
          const isChanged = !isFirstPlan && changedDates.has(date)
          
          return (
            <motion.div
              key={i}
              className={`p-1 border border-gray-100 rounded min-h-[80px] cursor-pointer transition-colors ${
                isProblem ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100' :
                'hover:border-green-300 hover:bg-green-50'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => !isFirstPlan && setSelectedDate(date)}
            >
              <div className={`text-xs font-bold mb-1 ${isProblem ? 'text-yellow-700' : 'text-gray-700'}`}>
                {date}
                {isProblem && <AlertTriangle className="h-3 w-3 inline ml-1 text-yellow-600" />}
              </div>
              {dayData.shifts.map((shift, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`text-xs p-1 rounded mb-1 ${
                    shift.preferred || shift.changed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <div className="font-medium flex items-center">
                    {shift.name}
                    {(shift.preferred || shift.changed) && <CheckCircle className="h-2 w-2 ml-1 text-green-600" />}
                  </div>
                  <div className="text-xs opacity-80">{shift.time}</div>
                </motion.div>
              ))}
            </motion.div>
          )
        })}
      </div>
    )
  }

  const getFirstPlanData = () => {
    // 第1案のデータ（希望を考慮しない自動生成）
    const firstPlanData = []
    for (let i = 1; i <= 30; i++) {
      const shifts = []
      const patterns = [
        [{ name: '田中', time: '9-17', skill: 4, preferred: false }],
        [{ name: '佐藤', time: '13-21', skill: 5, preferred: true }, { name: '山田', time: '9-15', skill: 3, preferred: false }],
        [{ name: '鈴木', time: '10-18', skill: 4, preferred: true }],
        [{ name: '田中', time: '9-17', skill: 4, preferred: false }, { name: '佐藤', time: '17-21', skill: 5, preferred: false }],
        [{ name: '山田', time: '9-15', skill: 3, preferred: true }, { name: '高橋', time: '15-21', skill: 4, preferred: false }]
      ]
      shifts.push(...patterns[i % patterns.length])
      firstPlanData.push({ date: i, shifts })
    }
    return firstPlanData
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="container mx-auto px-4 py-8"
    >
      {/* ナビゲーション */}
      <div className="flex justify-end items-center mb-8">
        <Button onClick={onNext} size="sm" className="bg-gradient-to-r from-green-600 to-green-700">
          <CheckCircle className="mr-2 h-4 w-4" />
          第2案を承認
        </Button>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            第2案（希望反映）
          </h1>
          <p className="text-lg text-gray-600">スタッフ希望を反映した最適化シフト</p>
        </div>

        {/* 表示切り替えボタン */}
        {generated && (
          <div className="flex gap-4">
            <Button
              variant={viewMode === 'second' ? 'default' : 'outline'}
              onClick={() => setViewMode('second')}
              className="flex items-center"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              第2案のみ表示
            </Button>
            <Button
              variant={viewMode === 'first' ? 'default' : 'outline'}
              onClick={() => setViewMode('first')}
              className="flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              第1案を見る
            </Button>
            <Button
              variant={viewMode === 'compare' ? 'default' : 'outline'}
              onClick={() => setViewMode('compare')}
              className="flex items-center"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              第1案と比較
            </Button>
          </div>
        )}
      </div>

      {!generated ? (
        <Card className="shadow-lg border-0">
          <CardContent className="p-12 text-center">
            {generating ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="h-12 w-12 text-blue-600" />
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold mb-4">希望を反映した第2案を生成中...</h3>
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-200 rounded-full h-2 mb-4">
                    <motion.div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3 }}
                    />
                  </div>
                  <p className="text-gray-600">スタッフ希望を分析し、最適化を実行中...</p>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RefreshCw className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">希望反映シフトを生成</h3>
                <p className="text-gray-600 mb-8">
                  収集したスタッフ希望を基に、満足度を向上させた第2案を生成します
                </p>
                <Button 
                  onClick={generateSecondPlan}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  第2案を生成
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* カレンダーと問題一覧を横並び */}
          {viewMode === 'second' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左側: カレンダー */}
              <Card className="shadow-lg border-0 ring-2 ring-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                    第2案（希望反映版）
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">改善版</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                      <div key={day} className="p-2 text-center text-xs font-bold bg-green-50 rounded">
                        {day}
                      </div>
                    ))}
                  </div>
                  {renderCalendar(false)}

                  {/* 凡例 */}
                  <div className="mt-4 flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
                      <span>希望時間帯</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-2"></div>
                      <span>希望外時間帯</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-50 border border-yellow-300 rounded mr-2"></div>
                      <span>問題のある日</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 右側: 検出された問題一覧 */}
              {generated && (
                <Card className="shadow-lg border-0 border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="flex items-center text-yellow-700">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      検出された問題一覧
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {/* 3日の問題 */}
                      {isProblematicDate(3) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-yellow-800 mb-2">📅 3日（火）- スキル不足</h4>
                              <p className="text-sm text-yellow-700 mb-3">
                                中村さん（★★）と伊藤さん（★★）の低スキル配置により、サービス品質に影響する可能性があります。
                              </p>
                              <div className="text-xs text-yellow-600">
                                💡 改善案: 高橋さん（★★★★）または鈴木さん（★★★★★）を配置
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => sendMessage('3日の問題を解決してください')}
                              className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              解決
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* 8日の問題 */}
                      {isProblematicDate(8) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-yellow-800 mb-2">📅 8日（日）- 人員不足</h4>
                              <p className="text-sm text-yellow-700 mb-3">
                                1名のみの配置で業務に支障をきたす可能性があります。最低2名の配置が必要です。
                              </p>
                              <div className="text-xs text-yellow-600">
                                💡 改善案: 佐藤さんまたは田中さんを追加配置
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => sendMessage('8日の問題を解決してください')}
                              className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              解決
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* 15日の問題 */}
                      {isProblematicDate(15) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-yellow-800 mb-2">📅 15日（日）- 連続勤務問題</h4>
                              <p className="text-sm text-yellow-700 mb-3">
                                佐藤さんが5日目の連続勤務となり、労働基準法上の問題があります。
                              </p>
                              <div className="text-xs text-yellow-600">
                                💡 改善案: 佐藤さんを休みにして、他のスタッフを配置
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => sendMessage('15日の問題を解決してください')}
                              className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              解決
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* 22日の問題 */}
                      {isProblematicDate(22) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-yellow-800 mb-2">📅 22日（日）- ベテラン不在</h4>
                              <p className="text-sm text-yellow-700 mb-3">
                                スキルレベル★★★以下のスタッフのみで、トラブル対応に不安があります。
                              </p>
                              <div className="text-xs text-yellow-600">
                                💡 改善案: 高橋さん（★★★★）または鈴木さん（★★★★★）を配置
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => sendMessage('22日の問題を解決してください')}
                              className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              解決
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* 28日の問題 */}
                      {isProblematicDate(28) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-yellow-800 mb-2">📅 28日（土）- 過重労働</h4>
                              <p className="text-sm text-yellow-700 mb-3">
                                田中さんが12時間勤務となり、労働時間が過重です。
                              </p>
                              <div className="text-xs text-yellow-600">
                                💡 改善案: 勤務時間を短縮するか、他のスタッフと分担
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => sendMessage('28日の問題を解決してください')}
                              className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              解決
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* 総合評価 */}
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">📊 総合評価</h4>
                        <div className="text-sm text-blue-700">
                          {resolvedProblems.size === 0 && (
                            <>
                              <p>🔍 <strong>5つの問題</strong>が検出されました</p>
                              <p>💡 AI修正アシスタントで問題を解決すると、満足度が<strong>17%向上</strong>し、充足率が<strong>7%改善</strong>される見込みです</p>
                            </>
                          )}
                          {resolvedProblems.size > 0 && resolvedProblems.size < 5 && (
                            <>
                              <p>✅ <strong>{resolvedProblems.size}つ解決済み</strong>、残り<strong>{5 - resolvedProblems.size}つ</strong></p>
                              <p>📈 現在の改善効果: 満足度<strong>+{Math.round(resolvedProblems.size * 3.4)}%</strong>、充足率<strong>+{Math.round(resolvedProblems.size * 1.4)}%</strong></p>
                            </>
                          )}
                          {resolvedProblems.size === 5 && (
                            <>
                              <p>🎉 <strong>すべての問題が解決されました！</strong></p>
                              <p>📈 最終改善効果: 満足度<strong>+17%</strong>、充足率<strong>+7%</strong>達成</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {viewMode === 'first' && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  第1案（AI自動生成）
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('second')}
                    className="ml-auto"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    第2案に戻る
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                    <div key={day} className="p-2 text-center text-xs font-bold bg-blue-50 rounded">
                      {day}
                    </div>
                  ))}
                </div>
                {renderCalendar(true)}
              </CardContent>
            </Card>
          )}

          {viewMode === 'compare' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* 第1案 */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                    第1案（AI自動生成）
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                      <div key={day} className="p-2 text-center text-xs font-bold bg-blue-50 rounded">
                        {day}
                      </div>
                    ))}
                  </div>
                  {renderCalendar(true)}
                </CardContent>
              </Card>

              {/* 第2案 */}
              <Card className="shadow-lg border-0 ring-2 ring-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                    第2案（希望反映版）
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">改善版</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                      <div key={day} className="p-2 text-center text-xs font-bold bg-green-50 rounded">
                        {day}
                      </div>
                    ))}
                  </div>
                  {renderCalendar(false)}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 右下固定チャットボット */}
          {generated && (
            isChatMinimized ? (
              // 最小化状態
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed bottom-4 right-4 z-50"
              >
                <Button
                  onClick={() => setIsChatMinimized(false)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 shadow-2xl flex items-center justify-center"
                >
                  <MessageSquare className="h-6 w-6" />
                </Button>
              </motion.div>
            ) : (
              // 展開状態
              <motion.div
                ref={chatRef}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200"
                style={{
                  left: `${chatPosition.x}px`,
                  top: `${chatPosition.y}px`,
                  width: `${chatSize.width}px`,
                  height: `${chatSize.height}px`,
                  cursor: isDragging ? 'move' : 'default'
                }}
              >
                <div
                  className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg cursor-move"
                  onMouseDown={handleDragStart}
                >
                  <div className="flex items-center">
                    <GripVertical className="h-4 w-4 mr-2 opacity-70" />
                    <MessageSquare className="h-5 w-5 mr-2" />
                    <span className="font-medium">AI修正アシスタント</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatMinimized(true)}
                    className="text-white hover:bg-blue-700 h-8 w-8 p-0"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-col" style={{ height: `${chatSize.height - 60}px` }}>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(message => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <div>{message.content}</div>
                          <div className={`text-xs mt-1 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.time}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-gray-100 px-3 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    {pendingChange ? (
                      // 承認待ち状態の時はOKボタンを表示
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => sendMessage('OK')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          ✓ OK（変更を実行）
                        </Button>
                        <Button
                          onClick={() => {
                            setPendingChange(null)
                            const cancelMessage = {
                              id: messages.length + 1,
                              type: 'assistant',
                              content: '変更をキャンセルしました。',
                              time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                            }
                            setMessages(prev => [...prev, cancelMessage])
                          }}
                          variant="outline"
                          className="border-gray-300"
                        >
                          キャンセル
                        </Button>
                      </div>
                    ) : (
                      // 通常状態
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="修正指示を入力..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <Button onClick={sendMessage} size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {/* リサイズハンドル */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
                  onMouseDown={handleResizeStart}
                  style={{
                    background: 'linear-gradient(135deg, transparent 50%, #cbd5e1 50%)',
                    borderBottomRightRadius: '0.5rem'
                  }}
                />
              </motion.div>
            )
          )}

        {/* 旧チャット機能（削除予定） */}
        {false && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                AI修正アシスタント
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-48 overflow-y-auto p-4 bg-gray-50 rounded-lg mb-4 space-y-3">
                  {messages.map(message => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}>
                        <div>{message.content}</div>
                        <div className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.time}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="修正指示を入力してください..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button onClick={sendMessage} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">💡 修正例</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• 田中さんの月曜日を休みにしてください</div>
                    <div>• 9月5日の午前に佐藤さんを追加してください</div>
                    <div>• 12日午後の山田さんを鈴木さんに変更してください</div>
                    <div>• 田中さんの18日を午前シフトに変更してください</div>
                    <div>• 25日午後の高橋さんと山田さんを外してください</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 日付詳細ポップアップ */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={() => setSelectedDate(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">
                      {selectedDate}日の詳細配置状況
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDate(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {(() => {
                    const details = getDateDetails(selectedDate)
                    if (!details) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <p>この日はシフトが設定されていません</p>
                        </div>
                      )
                    }

                    return (
                      <div>
                        {/* 時間軸テーブル */}
                        <div className="overflow-y-auto max-h-[60vh]">
                          <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="border border-gray-300 px-3 py-2 text-left">時間帯</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">AI配置スタッフ</th>
                                <th className="border border-gray-300 px-2 py-2">必要</th>
                                <th className="border border-gray-300 px-2 py-2">現在</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">状況</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const timeSlots = [];
                                for (let hour = 5; hour < 20; hour++) {
                                  for (let minute = 0; minute < 60; minute += 30) {
                                    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                    const endMinute = minute + 30;
                                    const endHour = endMinute >= 60 ? hour + 1 : hour;
                                    const endTime = `${endHour.toString().padStart(2, '0')}:${(endMinute % 60).toString().padStart(2, '0')}`;
                                    
                                    // リアルなサンプルデータ生成
                                    let assigned = [];
                                    let required = 0;
                                    let status = '✅';
                                    let statusColor = 'text-green-600';
                                    
                                    if (problemDates.has(selectedDate)) {
                                      // 問題のある日のパターン
                                      if (selectedDate === 5 && hour >= 9 && hour < 13) {
                                        assigned = ['山田★☆☆'];
                                        required = 3;
                                        status = '⚠️2名不足(スキル不足)';
                                        statusColor = 'text-red-600';
                                      } else if (selectedDate === 12 && hour >= 13 && hour < 17) {
                                        assigned = ['田中★★★', '山田★☆☆'];
                                        required = 2;
                                        status = '⚠️スキル不足';
                                        statusColor = 'text-yellow-600';
                                      } else if (selectedDate === 18 && hour >= 17 && hour < 21) {
                                        assigned = ['田中★★★'];
                                        required = 2;
                                        status = '⚠️希望外配置';
                                        statusColor = 'text-yellow-600';
                                      } else if (selectedDate === 25 && hour >= 13 && hour < 17) {
                                        assigned = ['田中★★★', '佐藤★★☆', '鈴木★★★', '山田★☆☆'];
                                        required = 2;
                                        status = '🔴2名超過';
                                        statusColor = 'text-red-600';
                                      } else if (selectedDate === 28 && hour >= 9 && hour < 13) {
                                        assigned = ['高橋★★☆'];
                                        required = 3;
                                        status = '⚠️2名不足';
                                        statusColor = 'text-red-600';
                                      }
                                    } else {
                                      // 問題のない日のパターン
                                      if (hour >= 9 && hour < 13) {
                                        assigned = ['田中★★★', '佐藤★★☆'];
                                        required = 2;
                                        status = '✅';
                                        statusColor = 'text-green-600';
                                      } else if (hour >= 13 && hour < 17) {
                                        assigned = ['鈴木★★★', '高橋★★☆'];
                                        required = 2;
                                        status = '✅';
                                        statusColor = 'text-green-600';
                                      } else if (hour >= 17 && hour < 21) {
                                        assigned = ['山田★☆☆'];
                                        required = 1;
                                        status = '✅';
                                        statusColor = 'text-green-600';
                                      }
                                    }
                                    
                                    timeSlots.push({
                                      time: `${startTime}-${endTime}`,
                                      assigned,
                                      required,
                                      current: assigned.length,
                                      status,
                                      statusColor
                                    });
                                  }
                                }
                                
                                return timeSlots.map((slot, index) => (
                                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                    <td className="border border-gray-300 px-3 py-2 font-mono text-xs">
                                      {slot.time}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      {slot.assigned.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {slot.assigned.map((staff, i) => (
                                            <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                              {staff}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 text-center">
                                      {slot.required}
                                    </td>
                                    <td className="border border-gray-300 px-2 py-2 text-center">
                                      {slot.current}
                                    </td>
                                    <td className={`border border-gray-300 px-3 py-2 ${slot.statusColor}`}>
                                      {slot.status}
                                    </td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded">
                          <h4 className="font-medium text-blue-800 mb-2">💡 改善提案</h4>
                          <div className="text-sm text-blue-700">
                            {problemDates.has(selectedDate) ? (
                              selectedDate === 5 ? '• 09:00-13:00: ベテラン2名追加（佐藤さんと鈴木さん推奨）' :
                              selectedDate === 12 ? '• 13:00-17:00: 山田さんを鈴木さんに変更（スキルレベル向上）' :
                              selectedDate === 18 ? '• 田中さんを午前シフトに変更、夜勤に佐藤さんを配置' :
                              selectedDate === 25 ? '• 13:00-17:00: 高橋さんと山田さんを他の時間帯に移動' :
                              selectedDate === 28 ? '• 09:00-13:00: 田中さんと佐藤さんを追加配置' :
                              '• 特に問題はありません'
                            ) : (
                              '• 適正な配置です。問題ありません。'
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

export default SecondPlan
