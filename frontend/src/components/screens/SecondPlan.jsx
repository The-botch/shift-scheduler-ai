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
  GripVertical,
} from 'lucide-react'
import Papa from 'papaparse'
import ShiftTimeline from '../shared/ShiftTimeline'

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

const SecondPlan = ({ onNext, onPrev, onMarkUnsaved, onMarkSaved }) => {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [comparison, setComparison] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [dayShifts, setDayShifts] = useState([])
  const [viewMode, setViewMode] = useState('second') // 'second', 'first', 'compare'
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: '第2案が生成されました。自然言語で修正指示をお聞かせください。',
      time: '14:30',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)
  const [shiftData, setShiftData] = useState([])
  const [changedDates, setChangedDates] = useState(new Set())
  const [pendingChange, setPendingChange] = useState(null)

  // CSVデータ格納用state
  const [csvShifts, setCsvShifts] = useState([])
  const [csvIssues, setCsvIssues] = useState([])
  const [csvSolutions, setCsvSolutions] = useState([])
  const [staffMap, setStaffMap] = useState({})
  const [rolesMap, setRolesMap] = useState({})
  const [firstPlanData, setFirstPlanData] = useState([])

  // 問題のある日付を定義
  const problematicDates = new Set([3, 8, 15, 22, 28]) // 問題のある日付
  const [problemDates, setProblemDates] = useState(new Set([3, 8, 15, 22, 28]))

  // 解決済み問題を管理
  const [resolvedProblems, setResolvedProblems] = useState(new Set())

  // チャットボット最小化状態
  const [isChatMinimized, setIsChatMinimized] = useState(false)

  // チャットボット位置とサイズ
  const [chatPosition, setChatPosition] = useState({
    x: window.innerWidth - 336,
    y: window.innerHeight - 520,
  })
  const [chatSize, setChatSize] = useState({ width: 320, height: 500 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const chatRef = useRef(null)

  // 日付が問題があるかどうかを判定する関数（解決済みは除外）
  const isProblematicDate = date => {
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
  const handleDragStart = e => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y,
    })
  }

  const handleDrag = e => {
    if (isDragging) {
      setChatPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // リサイズハンドラー
  const handleResizeStart = e => {
    e.stopPropagation()
    setIsResizing(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleResize = e => {
    if (isResizing) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      setChatSize({
        width: Math.max(280, chatSize.width + deltaX),
        height: Math.max(300, chatSize.height + deltaY),
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

  const generateSecondPlan = async () => {
    try {
      // シフト希望提出状況を確認
      const staffRes = await fetch('/data/master/staff.csv')
      const staffText = await staffRes.text()
      const staffResult = await new Promise(resolve => {
        Papa.parse(staffText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve,
        })
      })
      const activeStaff = staffResult.data.filter(s => s.is_active)
      const totalStaffCount = activeStaff.length

      const preferencesRes = await fetch('/data/transactions/availability_requests.csv')
      const preferencesText = await preferencesRes.text()
      const preferencesResult = await new Promise(resolve => {
        Papa.parse(preferencesText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve,
        })
      })

      // 提出済みのスタッフIDを抽出（submitted_atがあるスタッフ）
      const submittedStaffIds = new Set(
        preferencesResult.data.filter(req => req.submitted_at).map(req => req.staff_id)
      )
      const submittedCount = submittedStaffIds.size

      // 全員提出していない場合は確認アラート
      if (submittedCount < totalStaffCount) {
        const unsubmittedCount = totalStaffCount - submittedCount
        const unsubmittedStaff = activeStaff
          .filter(staff => !submittedStaffIds.has(staff.staff_id))
          .map(s => s.name)
          .join('、')

        const confirmMessage = `⚠️ シフト希望の提出が完了していません\n\n提出済み: ${submittedCount}名 / 全${totalStaffCount}名\n未提出: ${unsubmittedCount}名（${unsubmittedStaff}）\n\nシフト希望が未提出のスタッフがいますが、第2案を作成しますか？\n※未提出のスタッフは自動配置されます`

        if (!window.confirm(confirmMessage)) {
          return // キャンセルされた場合は中止
        }
      }

      setGenerating(true)

      // マスターデータ読み込み
      const [rolesRes, shiftsRes, issuesRes, solutionsRes] = await Promise.all([
        fetch('/data/master/roles.csv'),
        fetch('/data/transactions/shift_second_plan.csv'),
        fetch('/data/transactions/shift_second_plan_issues.csv'),
        fetch('/data/transactions/shift_second_plan_solutions.csv'),
      ])

      const [rolesText, shiftsText, issuesText, solutionsText] = await Promise.all([
        rolesRes.text(),
        shiftsRes.text(),
        issuesRes.text(),
        solutionsRes.text(),
      ])

      // CSV解析
      const parseCSV = text =>
        new Promise(resolve => {
          Papa.parse(text, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: result => resolve(result.data),
          })
        })

      const [rolesData, shiftsData, issuesData, solutionsData] = await Promise.all([
        parseCSV(rolesText),
        parseCSV(shiftsText),
        parseCSV(issuesText),
        parseCSV(solutionsText),
      ])

      // staffDataは既に読み込み済み
      const staffData = staffResult.data

      // スタッフマップとロールマップを作成
      const newRolesMap = {}
      rolesData.forEach(role => {
        newRolesMap[role.role_id] = role.role_name
      })

      const newStaffMap = {}
      staffData.forEach(staff => {
        newStaffMap[staff.staff_id] = {
          name: staff.name,
          role_id: staff.role_id,
          role_name: newRolesMap[staff.role_id] || 'スタッフ',
          skill_level: staff.skill_level,
        }
      })

      setRolesMap(newRolesMap)
      setStaffMap(newStaffMap)
      setCsvShifts(shiftsData)
      setCsvIssues(issuesData)
      setCsvSolutions(solutionsData)

      // シフトデータを日付ごとにグループ化
      const groupedByDate = {}
      shiftsData.forEach(shift => {
        if (!groupedByDate[shift.date]) {
          groupedByDate[shift.date] = []
        }
        const staffInfo = newStaffMap[shift.staff_id] || { name: '不明', skill_level: 1 }
        groupedByDate[shift.date].push({
          name: staffInfo.name,
          time: `${shift.start_time.replace(':00', '')}-${shift.end_time.replace(':00', '')}`,
          skill: shift.skill_level || staffInfo.skill_level,
          preferred: shift.is_preferred,
          changed: false,
        })
      })

      // 日付順にソート
      const formattedData = Object.keys(groupedByDate)
        .map(date => parseInt(date))
        .sort((a, b) => a - b)
        .map(date => ({
          date,
          shifts: groupedByDate[date],
        }))

      // 問題のある日付を抽出
      const problemDatesSet = new Set(issuesData.map(issue => issue.date))
      setProblemDates(problemDatesSet)

      // 第1案データを読み込み（localStorageまたはCSV）
      const approvedFirstPlan = localStorage.getItem('approved_first_plan_2024_10')
      if (approvedFirstPlan) {
        const firstPlanApprovedData = JSON.parse(approvedFirstPlan)
        setFirstPlanData(firstPlanApprovedData.shifts)
      } else {
        // 第1案がlocalStorageにない場合は、shift.csvから読み込む
        try {
          const firstPlanRes = await fetch('/data/transactions/shift.csv')
          const firstPlanText = await firstPlanRes.text()
          const firstPlanResult = await parseCSV(firstPlanText)

          // 第1案データを日付ごとにグループ化
          const firstPlanGrouped = {}
          firstPlanResult.forEach(shift => {
            if (!firstPlanGrouped[shift.date]) {
              firstPlanGrouped[shift.date] = []
            }
            const staffInfo = newStaffMap[shift.staff_id] || {
              name: '不明',
              skill_level: 1,
              role_name: 'スタッフ',
            }
            firstPlanGrouped[shift.date].push({
              name: staffInfo.name,
              time: `${shift.start_time.replace(':00', '')}-${shift.end_time.replace(':00', '')}`,
              skill: shift.skill_level || staffInfo.skill_level,
              role: staffInfo.role_name,
              preferred: shift.is_preferred,
              changed: false,
            })
          })

          const firstPlanFormatted = Object.keys(firstPlanGrouped)
            .map(date => parseInt(date))
            .sort((a, b) => a - b)
            .map(date => ({
              date,
              day: ['日', '月', '火', '水', '木', '金', '土'][new Date(2024, 9, date).getDay()],
              shifts: firstPlanGrouped[date],
            }))

          setFirstPlanData(firstPlanFormatted)
        } catch (err) {
          console.error('第1案データ読み込みエラー:', err)
          setFirstPlanData([])
        }
      }

      setShiftData(formattedData)
      setGenerated(true)
      setComparison({
        first: { satisfaction: 72, coverage: 85, cost: 52000 },
        second: { satisfaction: 89, coverage: 92, cost: 48000 },
      })
    } catch (err) {
      console.error('第2案データ読み込みエラー:', err)
      alert('第2案データの読み込みに失敗しました。CSVファイルを確認してください。')
    } finally {
      setGenerating(false)
    }
  }

  const applyShiftChanges = changes => {
    // 変更があったことをマーク
    if (onMarkUnsaved) {
      onMarkUnsaved()
    }

    // スタッフ名からstaff_idを逆引きするマップを作成
    const nameToIdMap = {}
    Object.entries(staffMap).forEach(([id, info]) => {
      nameToIdMap[info.name] = parseInt(id)
    })

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
              changed: true,
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
                  changed: true,
                }
              } else {
                // 時間変更
                newData[dayIndex].shifts[shiftIndex] = {
                  ...newData[dayIndex].shifts[shiftIndex],
                  time: change.time,
                  preferred: true,
                  changed: true,
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

    // csvShiftsも更新
    setCsvShifts(prevCsvShifts => {
      const newCsvShifts = [...prevCsvShifts]
      const dayOfWeekMap = ['日', '月', '火', '水', '木', '金', '土']

      changes.forEach(change => {
        const date = new Date(2024, 9, change.date)
        const dayOfWeek = dayOfWeekMap[date.getDay()]

        if (change.action === 'remove') {
          // 削除
          const staffId = nameToIdMap[change.staff]
          const removeIndex = newCsvShifts.findIndex(
            s => s.date === change.date && s.staff_id === staffId
          )
          if (removeIndex !== -1) {
            newCsvShifts.splice(removeIndex, 1)
          }
        } else if (change.action === 'add') {
          // 追加
          const staffId = nameToIdMap[change.staff]
          const [startHour, endHour] = change.time.split('-')
          const newShift = {
            shift_id: `SP2_NEW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: change.date,
            day_of_week: dayOfWeek,
            staff_id: staffId,
            staff_name: change.staff,
            start_time: `${startHour.padStart(2, '0')}:00`,
            end_time: `${endHour.padStart(2, '0')}:00`,
            skill_level: change.skill,
            is_preferred: 'TRUE',
            is_modified: 'TRUE',
            has_issue: 'FALSE',
            issue_type: '',
          }
          newCsvShifts.push(newShift)
        } else if (change.action === 'modify') {
          // 変更
          const oldStaffId = nameToIdMap[change.staff]
          const modifyIndex = newCsvShifts.findIndex(
            s => s.date === change.date && s.staff_id === oldStaffId
          )
          if (modifyIndex !== -1) {
            const [startHour, endHour] = change.time.split('-')
            if (change.newStaff) {
              // スタッフ変更
              const newStaffId = nameToIdMap[change.newStaff]
              newCsvShifts[modifyIndex] = {
                ...newCsvShifts[modifyIndex],
                staff_id: newStaffId,
                staff_name: change.newStaff,
                start_time: `${startHour.padStart(2, '0')}:00`,
                end_time: `${endHour.padStart(2, '0')}:00`,
                skill_level: change.skill,
                is_modified: 'TRUE',
                has_issue: 'FALSE',
                issue_type: '',
              }
            } else {
              // 時間変更
              newCsvShifts[modifyIndex] = {
                ...newCsvShifts[modifyIndex],
                start_time: `${startHour.padStart(2, '0')}:00`,
                end_time: `${endHour.padStart(2, '0')}:00`,
                is_modified: 'TRUE',
                has_issue: 'FALSE',
                issue_type: '',
              }
            }
          }
        }
      })

      return newCsvShifts
    })
  }

  const sendMessage = (messageText = null) => {
    const textToSend = messageText || inputValue
    if (!textToSend.trim()) return

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      content: textToSend,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, newMessage])
    const currentInput = textToSend
    setInputValue('')
    setIsTyping(true)
    scrollToBottom()

    // 承認待ち状態の処理
    if (
      pendingChange &&
      (currentInput.toLowerCase().includes('ok') ||
        currentInput.includes('はい') ||
        currentInput.includes('実行'))
    ) {
      setTimeout(() => {
        applyShiftChanges(pendingChange.changes)
        const aiResponse = {
          id: messages.length + 2,
          type: 'assistant',
          content: pendingChange.response,
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, aiResponse])
        setIsTyping(false)
        setPendingChange(null)
        scrollToBottom()
      }, 1500)
      return
    }

    // CSVソリューションから解決策を検索
    setTimeout(() => {
      // "X日の問題を解決してください" パターンをマッチ
      const dateMatch = currentInput.match(/(\d+)日の問題を解決/)

      if (dateMatch) {
        const targetDate = parseInt(dateMatch[1])
        const issue = csvIssues.find(i => i.date === targetDate)
        const solutions = csvSolutions.filter(s => s.date === targetDate)

        if (issue && solutions.length > 0) {
          // 解決策を構築
          const changes = solutions
            .map(sol => {
              if (sol.action_type === 'add') {
                return {
                  date: sol.date,
                  action: 'add',
                  staff: sol.staff_to,
                  time: sol.time_slot.replace(':00', ''),
                  skill: sol.skill_level_to,
                }
              } else if (sol.action_type === 'modify') {
                return {
                  date: sol.date,
                  action: 'modify',
                  staff: sol.staff_from,
                  newStaff: sol.staff_to,
                  time: sol.time_slot.replace(':00', ''),
                  skill: sol.skill_level_to,
                }
              }
              return null
            })
            .filter(c => c !== null)

          const analysisContent = `📋 変更予定:\n• ${issue.description}\n\n⚠️ 影響分析:\n${solutions.map(s => `• ${s.expected_improvement}`).join('\n')}\n${solutions.map(s => `• ${s.implementation_note}`).join('\n')}\n\nこの変更を実行しますか？「OK」と入力してください。`

          const responseContent = `✅ 変更を実行しました\n• ${issue.date}日の${issue.issue_type}問題を解決\n${solutions.map(s => `• ${s.expected_improvement}`).join('\n')}`

          const aiResponse = {
            id: messages.length + 2,
            type: 'assistant',
            content: analysisContent,
            time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          }

          setMessages(prev => [...prev, aiResponse])
          setPendingChange({
            changes,
            response: responseContent,
          })
          scrollToBottom()
        } else {
          const aiResponse = {
            id: messages.length + 2,
            type: 'assistant',
            content: `${targetDate}日の問題に対する解決策が見つかりませんでした。`,
            time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          }
          setMessages(prev => [...prev, aiResponse])
          scrollToBottom()
        }
      } else {
        const aiResponse = {
          id: messages.length + 2,
          type: 'assistant',
          content:
            '申し訳ございませんが、その指示は認識できませんでした。\n\n問題を解決するには「X日の問題を解決してください」と入力してください。',
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, aiResponse])
        scrollToBottom()
      }
      setIsTyping(false)
    }, 2000)
  }

  const handleDayClick = date => {
    // CSVデータから該当日のシフトを取得
    const dayShiftsData = csvShifts.filter(s => s.date === date)

    // ShiftTimelineコンポーネント用のフォーマットに変換
    const formattedShifts = dayShiftsData.map(shift => {
      const staffInfo = staffMap[shift.staff_id] || { name: '不明', role_name: 'スタッフ' }
      return {
        shift_id: shift.shift_id,
        staff_name: staffInfo.name,
        role: staffInfo.role_name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        skill_level: shift.skill_level,
        modified_flag: shift.is_modified,
      }
    })

    setDayShifts(formattedShifts)
    setSelectedDate(date)
  }

  const closeDayView = () => {
    setSelectedDate(null)
    setDayShifts([])
  }

  const handleApprove = () => {
    // 承認時に履歴データとして保存
    const approvedData = {
      month: 10,
      year: 2024,
      status: 'second_plan_approved',
      approvedAt: new Date().toISOString(),
      shifts: shiftData,
      csvShifts: csvShifts,
      stats: {
        totalShifts: csvShifts.length,
        totalHours: csvShifts.reduce((sum, s) => {
          const start = parseInt(s.start_time.split(':')[0])
          const end = parseInt(s.end_time.split(':')[0])
          return sum + (end - start)
        }, 0),
        staffCount: new Set(csvShifts.map(s => s.staff_id)).size,
        resolvedIssues: resolvedProblems.size,
        totalIssues: csvIssues.length,
      },
    }

    // LocalStorageに保存
    localStorage.setItem('approved_second_plan_2024_10', JSON.stringify(approvedData))
    console.log('第2案を承認しました。履歴に保存されました。')

    // 親コンポーネントの承認処理を呼び出し
    if (onNext) {
      onNext()
    }
  }

  const renderCalendar = (isFirstPlan = false) => {
    const data = isFirstPlan ? firstPlanData : shiftData

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
                isProblem
                  ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100'
                  : 'hover:border-green-300 hover:bg-green-50'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => !isFirstPlan && handleDayClick(date)}
            >
              <div
                className={`text-xs font-bold mb-1 ${isProblem ? 'text-yellow-700' : 'text-gray-700'}`}
              >
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
                    {(shift.preferred || shift.changed) && (
                      <CheckCircle className="h-2 w-2 ml-1 text-green-600" />
                    )}
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
      <div className="flex justify-between items-center mb-8">
        <Button onClick={onPrev} variant="outline" size="sm">
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button
          onClick={handleApprove}
          size="sm"
          className="bg-gradient-to-r from-green-600 to-green-700"
        >
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
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
                      animate={{ width: '100%' }}
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
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      改善版
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                      <div
                        key={day}
                        className="p-2 text-center text-xs font-bold bg-green-50 rounded"
                      >
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
                      {/* CSVから問題を動的に表示 */}
                      {csvIssues
                        .filter(issue => isProblematicDate(issue.date))
                        .map((issue, index) => {
                          const issueTypeLabels = {
                            skill_shortage: 'スキル不足',
                            understaffed: '人員不足',
                            consecutive_days: '連続勤務問題',
                            no_veteran: 'ベテラン不在',
                            overwork: '過重労働',
                          }

                          return (
                            <motion.div
                              key={issue.issue_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-yellow-800 mb-2">
                                    📅 {issue.date}日（{issue.day_of_week}）-{' '}
                                    {issueTypeLabels[issue.issue_type]}
                                  </h4>
                                  <p className="text-sm text-yellow-700 mb-3">
                                    {issue.description}
                                  </p>
                                  <div className="text-xs text-yellow-600">
                                    💡 改善案: {issue.recommendation}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    sendMessage(`${issue.date}日の問題を解決してください`)
                                  }
                                  className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                  解決
                                </Button>
                              </div>
                            </motion.div>
                          )
                        })}

                      {/* 総合評価 */}
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">📊 総合評価</h4>
                        <div className="text-sm text-blue-700">
                          {resolvedProblems.size === 0 && (
                            <>
                              <p>
                                🔍 <strong>{csvIssues.length}つの問題</strong>が検出されました
                              </p>
                              <p>
                                💡 AI修正アシスタントで問題を解決すると、満足度が
                                <strong>17%向上</strong>し、充足率が<strong>7%改善</strong>
                                される見込みです
                              </p>
                            </>
                          )}
                          {resolvedProblems.size > 0 &&
                            resolvedProblems.size < csvIssues.length && (
                              <>
                                <p>
                                  ✅ <strong>{resolvedProblems.size}つ解決済み</strong>、残り
                                  <strong>{csvIssues.length - resolvedProblems.size}つ</strong>
                                </p>
                                <p>
                                  📈 現在の改善効果: 満足度
                                  <strong>+{Math.round(resolvedProblems.size * 3.4)}%</strong>
                                  、充足率
                                  <strong>+{Math.round(resolvedProblems.size * 1.4)}%</strong>
                                </p>
                              </>
                            )}
                          {resolvedProblems.size === csvIssues.length && csvIssues.length > 0 && (
                            <>
                              <p>
                                🎉 <strong>すべての問題が解決されました！</strong>
                              </p>
                              <p>
                                📈 最終改善効果: 満足度<strong>+17%</strong>、充足率
                                <strong>+7%</strong>達成
                              </p>
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
                      <div
                        key={day}
                        className="p-2 text-center text-xs font-bold bg-blue-50 rounded"
                      >
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
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      改善版
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                      <div
                        key={day}
                        className="p-2 text-center text-xs font-bold bg-green-50 rounded"
                      >
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
          {generated &&
            (isChatMinimized ? (
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
                  cursor: isDragging ? 'move' : 'default',
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
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <div>{message.content}</div>
                          <div
                            className={`text-xs mt-1 ${
                              message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
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
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.1s' }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            ></div>
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
                              time: new Date().toLocaleTimeString('ja-JP', {
                                hour: '2-digit',
                                minute: '2-digit',
                              }),
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
                          onChange={e => setInputValue(e.target.value)}
                          placeholder="修正指示を入力..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={e => e.key === 'Enter' && sendMessage()}
                        />
                        <Button
                          onClick={sendMessage}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
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
                    borderBottomRightRadius: '0.5rem',
                  }}
                />
              </motion.div>
            ))}

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
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
                        <div>{message.content}</div>
                        <div
                          className={`text-xs mt-1 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
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
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.1s' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          ></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
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

          {/* ShiftTimelineコンポーネント */}
          <AnimatePresence>
            {selectedDate && (
              <ShiftTimeline
                date={selectedDate}
                year={2024}
                month={10}
                shifts={dayShifts}
                onClose={closeDayView}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

export default SecondPlan
