import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  Sparkles,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  Loader2,
  Calendar as CalendarIcon,
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  GripVertical,
  AlertTriangle
} from 'lucide-react'
import Papa from 'papaparse'
import ShiftTimeline from '../shared/ShiftTimeline'

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

const FirstPlan = ({ onNext, onPrev, onApprove, onMarkUnsaved, onMarkSaved }) => {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [shiftData, setShiftData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalShifts: 0,
    totalHours: 0,
    staffCount: 0
  })

  // チャット機能関連の状態変数
  const [messages, setMessages] = useState([
    { id: 1, type: 'system', content: '第1案が生成されました。この案で問題なければ次のステップへ進んでください。修正が必要な場合は、自然言語で指示をお願いします。', time: '14:30' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [pendingChange, setPendingChange] = useState(null)
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const [chatPosition, setChatPosition] = useState({ x: window.innerWidth - 336, y: window.innerHeight - 520 })
  const [chatSize, setChatSize] = useState({ width: 320, height: 500 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const chatEndRef = useRef(null)
  const [changedDates, setChangedDates] = useState(new Set())

  // タイムライン表示用
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayShifts, setDayShifts] = useState([])

  // CSVからデータを読み込む
  useEffect(() => {
    loadShiftData()
  }, [])


  const loadShiftData = async () => {
    try {
      setLoading(true)

      // shift.csvを読み込み
      const shiftsResponse = await fetch('/data/transactions/shift.csv')

      if (!shiftsResponse.ok) {
        throw new Error('CSVファイルが見つかりません')
      }

      const shiftsText = await shiftsResponse.text()

      const shiftsResult = await new Promise((resolve, reject) => {
        Papa.parse(shiftsText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        })
      })

      // staff.csvを読み込み
      const staffResponse = await fetch('/data/master/staff.csv')
      const staffText = await staffResponse.text()

      const staffResult = await new Promise((resolve, reject) => {
        Papa.parse(staffText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        })
      })

      // roles.csvを読み込み
      const rolesResponse = await fetch('/data/master/roles.csv')
      const rolesText = await rolesResponse.text()

      const rolesResult = await new Promise((resolve, reject) => {
        Papa.parse(rolesText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        })
      })

      // 役職IDから役職名へのマッピング
      const rolesMap = {}
      rolesResult.data.forEach(role => {
        rolesMap[role.role_id] = role.role_name
      })

      // スタッフIDから名前・役職へのマッピング
      const staffMap = {}
      staffResult.data.forEach(staff => {
        staffMap[staff.staff_id] = {
          name: staff.name,
          role_id: staff.role_id,
          role_name: rolesMap[staff.role_id] || 'スタッフ'
        }
      })

      // 日付別にグループ化
      const groupedByDate = {}
      shiftsResult.data.forEach(shift => {
        const date = shift.shift_date
        if (!groupedByDate[date]) {
          groupedByDate[date] = []
        }
        const staffInfo = staffMap[shift.staff_id] || { name: '不明', role_name: 'スタッフ' }
        groupedByDate[date].push({
          name: staffInfo.name,
          role: staffInfo.role_name,
          time: `${shift.start_time?.substring(0,5)}-${shift.end_time?.substring(0,5)}`,
          skill: shift.skill_level || 3,
          hours: shift.total_hours || 0
        })
      })

      // 日付順にソート
      const sortedDates = Object.keys(groupedByDate).sort()

      // 1日から連番で格納
      const formattedData = sortedDates.map((date, index) => ({
        date: index + 1,
        fullDate: date,
        shifts: groupedByDate[date]
      }))

      console.log('CSVから読み込んだデータ:', formattedData.length, '日分')
      console.log('スタッフ数:', Object.keys(staffMap).length)

      // CSVデータを使用
      console.log(`CSVデータを使用します (${formattedData.length}日分)`)
      setShiftData(formattedData)

      // 統計情報を計算
      const totalShifts = shiftsResult.data.length
      const totalHours = shiftsResult.data.reduce((sum, s) => sum + (s.total_hours || 0), 0)
      const staffCount = Object.keys(staffMap).length

      setStats({ totalShifts, totalHours, staffCount })

      setLoading(false)

    } catch (err) {
      console.error('データ読み込みエラー:', err)
      setShiftData([])
      setStats({ totalShifts: 0, totalHours: 0, staffCount: 0 })
      setLoading(false)
      alert('シフトデータの読み込みに失敗しました。CSVファイルを確認してください。')
    }
  }

  const generateFirstPlan = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
    }, 3000)
  }

  const handleApprove = () => {
    // 承認時に履歴データとして保存
    const approvedData = {
      month: 10,
      year: 2024,
      status: 'first_plan_approved',
      approvedAt: new Date().toISOString(),
      shifts: shiftData,
      stats: stats
    }

    // LocalStorageに保存
    localStorage.setItem('approved_first_plan_2024_10', JSON.stringify(approvedData))
    console.log('第1案を仮承認しました。履歴に保存されました。')

    // 親コンポーネントの承認処理を呼び出し
    if (onApprove) {
      onApprove()
    }
  }

  // タイムライン表示用の関数
  const handleDayClick = (dayData) => {
    // FirstPlanのデータ形式をShiftTimeline用に変換
    const formattedShifts = dayData.shifts.map((shift, index) => {
      const [startTime, endTime] = shift.time.split('-')
      return {
        shift_id: `shift-${dayData.date}-${index}`,
        staff_name: shift.name,
        start_time: startTime,
        end_time: endTime,
        role: shift.role || 'スタッフ',
        planned_hours: shift.hours,
        modified_flag: shift.changed || false
      }
    })
    setDayShifts(formattedShifts)
    setSelectedDay(dayData.date)
  }

  const closeDayView = () => {
    setSelectedDay(null)
    setDayShifts([])
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

  // デモパターン（第1案用に調整）
  const demoPatterns = {
    '5日の田中さんを佐藤さんに変更してください': {
      analysis: {
        changes: '5日: 田中さん → 佐藤さんに変更',
        impacts: [
          'スキルレベル: ★★★★ → ★★★★★に向上',
          '田中さんの週間勤務: 32時間 → 28時間',
          '佐藤さんの週間勤務: 32時間 → 36時間',
          'サービス品質が向上'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 5, action: 'modify', staff: '田中', newStaff: '佐藤', time: '9-17', skill: 5 }],
      response: '✅ 変更を実行しました\n• 5日の田中さんを佐藤さんに変更\n• スキルレベルが★★★★★に向上\n• サービス品質が改善'
    },
    '10日に山田さんを追加してください': {
      analysis: {
        changes: '10日: 山田さんを追加配置',
        impacts: [
          '10日の人員不足が解消されます',
          '山田さんの週間勤務: 30時間 → 34時間',
          '充足率: 85% → 88%に向上',
          '業務の安定性が向上'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 10, action: 'add', staff: '山田', time: '13-17', skill: 3 }],
      response: '✅ 変更を実行しました\n• 10日に山田さんを追加配置\n• 人員不足を解消\n• 充足率88%に向上'
    },
    '15日の鈴木さんを削除してください': {
      analysis: {
        changes: '15日: 鈴木さんを削除',
        impacts: [
          '15日の人員過多(3名→2名)が解消',
          '鈴木さんの週間勤務: 34時間 → 30時間',
          '人件費削減: ¥4,000',
          '適正人員配置に調整'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 15, action: 'remove', staff: '鈴木' }],
      response: '✅ 変更を実行しました\n• 15日の鈴木さんを削除\n• 人員過多を解消(3名→2名)\n• 人件費¥4,000削減'
    },
    '20日の高橋さんを午前シフトに変更してください': {
      analysis: {
        changes: '20日: 高橋さんの時間帯を9-13時に変更',
        impacts: [
          '午前の人員不足が解消',
          '高橋さんの希望適合度: 65% → 82%に向上',
          '午後は佐藤さんを自動配置',
          '全体満足度が向上'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 20, action: 'modify', staff: '高橋', time: '9-13', skill: 4 }],
      response: '✅ 変更を実行しました\n• 20日の高橋さんを午前シフトに変更\n• 希望適合度82%に向上\n• 午前の人員不足を解消'
    },
    '25日の午後スタッフを1名減らしてください': {
      analysis: {
        changes: '25日午後: 伊藤さんを削除',
        impacts: [
          '25日午後の人員過多が解消',
          '伊藤さんの週間勤務: 33時間 → 29時間',
          '人件費削減: ¥3,200',
          '適正人員に調整'
        ],
        question: 'この変更を実行しますか？「OK」と入力してください。'
      },
      changes: [{ date: 25, action: 'remove', staff: '伊藤' }],
      response: '✅ 変更を実行しました\n• 25日午後の伊藤さんを削除\n• 人員過多を解消\n• 人件費¥3,200削減'
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

      changes.forEach(change => {
        const dayIndex = newData.findIndex(d => d.date === change.date)
        if (dayIndex !== -1) {
          newChangedDates.add(change.date)

          if (change.action === 'remove') {
            newData[dayIndex].shifts = newData[dayIndex].shifts.filter(s => s.name !== change.staff)
          } else if (change.action === 'add') {
            newData[dayIndex].shifts.push({
              name: change.staff,
              time: change.time,
              skill: change.skill,
              hours: 4,
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
                  hours: 4,
                  changed: true
                }
              } else {
                // 時間変更
                newData[dayIndex].shifts[shiftIndex] = {
                  ...newData[dayIndex].shifts[shiftIndex],
                  time: change.time,
                  changed: true
                }
              }
            }
          }
        }
      })

      setChangedDates(newChangedDates)
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
          content: '申し訳ございませんが、その指示は認識できませんでした。以下の例を参考にしてください：\n\n• 5日の田中さんを佐藤さんに変更してください\n• 10日に山田さんを追加してください\n• 15日の鈴木さんを削除してください\n• 20日の高橋さんを午前シフトに変更してください',
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, aiResponse])
        scrollToBottom()
      }
      setIsTyping(false)
    }, 2000)
  }

  if (loading) {
    return (
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="container mx-auto px-4 py-8"
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg text-gray-600">データを準備しています...</p>
        </div>
      </motion.div>
    )
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
        <Button onClick={handleApprove} size="sm" disabled={!generated} className="bg-gradient-to-r from-green-600 to-green-700">
          <CheckCircle className="mr-2 h-4 w-4" />
          シフトを承認・確定
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          第1案生成（AI自動）
        </h1>
        <p className="text-lg text-gray-600">
          2024年10月シフト - {shiftData.length}日分のシフトを自動生成
        </p>
      </div>

      {!generated ? (
        <Card className="shadow-lg border-0">
          <CardContent className="p-12 text-center">
            {generating ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-12 w-12 text-purple-600" />
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold mb-4">AIがシフトを生成中...</h3>
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-200 rounded-full h-2 mb-4">
                    <motion.div
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3 }}
                    />
                  </div>
                  <p className="text-gray-600">制約条件を考慮し、最適なシフトを計算中...</p>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-12 w-12 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">AI自動シフト生成</h3>
                <p className="text-gray-600 mb-8">
                  スタッフ情報と制約条件から、最適なシフトを自動生成します
                  <br />
                  読み込み完了: {shiftData.length}日分、{stats.staffCount}名のスタッフ
                </p>
                <Button 
                  onClick={generateFirstPlan}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  自動生成を開始
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 2カラムレイアウト */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側：カレンダー */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  10月のシフト（{shiftData.length}日分）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                    <div key={day} className="p-1 text-center text-xs font-bold bg-blue-50 rounded">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {/* 2024年10月1日は火曜日なので、空白セルを2つ追加（日曜・月曜） */}
                  {[0, 1].map(i => (
                    <div key={`empty-${i}`} className="p-1"></div>
                  ))}
                  {shiftData.map((dayData, index) => {
                    // 2024年10月1日は火曜日、日曜始まりのカレンダーなので+2
                    const dayOfWeekIndex = (dayData.date - 1 + 2) % 7
                    const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6 // 日曜(0)と土曜(6)
                    const isChanged = changedDates.has(dayData.date)

                    return (
                      <motion.div
                        key={index}
                        className={`p-1 border rounded min-h-[60px] cursor-pointer hover:shadow-md transition-shadow ${
                          isChanged ? 'bg-green-50 border-green-400 hover:bg-green-100' :
                          isWeekend ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.01 }}
                        onClick={() => handleDayClick(dayData)}
                      >
                        <div className={`text-xs font-bold mb-0.5 ${
                          isChanged ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          {dayData.date}
                          {isChanged && <CheckCircle className="h-2.5 w-2.5 inline ml-1 text-green-600" />}
                        </div>
                        {dayData.shifts.slice(0, 2).map((shift, idx) => (
                          <motion.div
                            key={idx}
                            className={`text-xs p-0.5 rounded mb-0.5 ${
                              shift.changed
                                ? 'bg-green-200 border border-green-400'
                                : 'bg-green-100 border border-green-300'
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.01 + idx * 0.05 }}
                          >
                            <div className="font-medium text-green-800 text-xs leading-tight">{shift.name}</div>
                          </motion.div>
                        ))}
                        {dayData.shifts.length > 2 && (
                          <div className="text-xs text-gray-500">+{dayData.shifts.length - 2}</div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs">
                  <div className="flex items-center">
                    <div className="w-2.5 h-2.5 bg-green-100 border border-green-300 rounded mr-1.5"></div>
                    <span>配置済み</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2.5 h-2.5 bg-green-200 border border-green-400 rounded mr-1.5"></div>
                    <span>修正済み</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2.5 h-2.5 bg-blue-50 border border-blue-200 rounded mr-1.5"></div>
                    <span>土日</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 右側：統計情報 */}
            <div className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>生成結果サマリー</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">総シフト数</span>
                    <span className="text-2xl font-bold text-blue-600">{stats.totalShifts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">総労働時間</span>
                    <span className="text-2xl font-bold text-green-600">{stats.totalHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">カバレッジ</span>
                    <span className="text-2xl font-bold text-purple-600">94.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">制約違反</span>
                    <span className="text-2xl font-bold text-green-600">0件</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    法令遵守チェック
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      労働基準法第32条（法定労働時間）
                    </div>
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      労働基準法第34条（休憩時間）
                    </div>
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      労働基準法第35条（法定休日）
                    </div>
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      労働基準法第61条（年少者保護）
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 修正例のカード */}
              <Card className="shadow-lg border-0 bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-800">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    AI修正アシスタント
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-700 mb-3">
                    右下のチャットボットで自然言語による修正が可能です
                  </p>
                  <div className="text-xs text-blue-600 space-y-1">
                    <div>• 5日の田中さんを佐藤さんに変更してください</div>
                    <div>• 10日に山田さんを追加してください</div>
                    <div>• 15日の鈴木さんを削除してください</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ドラッグ可能なチャットウィンドウ */}
          {isChatMinimized ? (
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
          )}
        </div>
      )}

      {/* タイムライン表示 */}
      <AnimatePresence>
        {selectedDay && (
          <ShiftTimeline
            date={selectedDay}
            year={2024}
            month={10}
            shifts={dayShifts}
            onClose={closeDayView}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default FirstPlan