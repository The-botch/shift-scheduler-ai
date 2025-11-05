import { useState, useEffect, useRef } from 'react'
import { MESSAGES } from '../../constants/messages'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  RefreshCw,
  Zap,
  Calendar as CalendarIcon,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  Send,
  Users,
  Clock,
  Eye,
  GitCompare,
  ArrowLeft,
  ChevronLeft,
  Minimize2,
  GripVertical,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import ShiftTimeline from '../shared/ShiftTimeline'
import ShiftViewEditor from '../shared/ShiftViewEditor'
import { ShiftRepository } from '../../infrastructure/repositories/ShiftRepository'
import { MasterRepository } from '../../infrastructure/repositories/MasterRepository'
import { isHoliday, getHolidayName, loadHolidays } from '../../utils/holidays'

const shiftRepository = new ShiftRepository()
const masterRepository = new MasterRepository()

// 祝日データを事前に読み込む
loadHolidays()

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

const SecondPlan = ({
  onNext,
  onPrev,
  onMarkUnsaved,
  onMarkSaved,
  selectedShift,
  onHome,
  onShiftManagement,
  onLineMessages,
  onMonitoring,
  onStaffManagement,
  onStoreManagement,
  onConstraintManagement,
  onBudgetActualManagement,
}) => {
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
  const [loading, setLoading] = useState(true)
  const [preferences, setPreferences] = useState([]) // 希望シフト

  // CSVデータ格納用state
  const [csvShifts, setCsvShifts] = useState([])
  const [csvIssues, setCsvIssues] = useState([])
  const [csvSolutions, setCsvSolutions] = useState([])
  const [staffMap, setStaffMap] = useState({})
  const [rolesMap, setRolesMap] = useState({})
  const [firstPlanData, setFirstPlanData] = useState([])

  // 問題のある日付を定義
  const problematicDates = new Set([]) // 問題のある日付
  const [problemDates, setProblemDates] = useState(new Set([]))

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

  // バックエンドAPIから取得したシフトデータをカレンダー表示用にフォーマット
  const formatShiftsForCalendar = (shifts, staffMapping, year, month) => {
    // 日付ごとにグループ化
    const shiftsByDate = {}

    shifts.forEach(shift => {
      // shift_dateから日付を抽出（例: "2025-11-15" → 15）
      const shiftDate = shift.shift_date || shift.date
      if (!shiftDate) return

      const dateObj = new Date(shiftDate)
      const day = dateObj.getDate()

      if (!shiftsByDate[day]) {
        shiftsByDate[day] = []
      }

      // スタッフ情報を取得
      const staffInfo = staffMapping[shift.staff_id] || {
        name: `スタッフ${shift.staff_id}`,
        role_name: 'スタッフ'
      }

      // 時刻をフォーマット（"09:00:00" → "9-18"）
      const startTime = shift.start_time ? shift.start_time.substring(0, 5).replace(':00', '') : ''
      const endTime = shift.end_time ? shift.end_time.substring(0, 5).replace(':00', '') : ''
      const timeStr = `${startTime}-${endTime}`

      shiftsByDate[day].push({
        name: staffInfo.name,
        time: timeStr,
        skill: shift.skill_level || staffInfo.skill_level || 1,
        role: staffInfo.role_name,
        preferred: shift.is_preferred || false,
        changed: shift.is_modified || false
      })
    })

    // カレンダー表示用の配列に変換
    const daysInMonth = new Date(year, month, 0).getDate()
    const formattedData = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = new Date(year, month - 1, day).getDay()
      formattedData.push({
        date: day,
        day: ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek],
        shifts: shiftsByDate[day] || []
      })
    }

    return formattedData
  }

  // マウント時に第1案と希望シフトを読み込み
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      // selectedShiftから年月とplan_idを取得
      const year = selectedShift?.year || new Date().getFullYear()
      const month = selectedShift?.month || new Date().getMonth() + 1
      const planId = selectedShift?.planId

      if (!planId) {
        console.error('plan_idが指定されていません')
        setLoading(false)
        return
      }

      console.log(`第1案と希望シフトを読み込み中: ${year}年${month}月, plan_id=${planId}`)

      // スタッフマスタを取得（先に取得してマッピング用に使用）
      const staffData = await masterRepository.getStaff()
      console.log('SecondPlan - 取得したスタッフ数:', staffData.length)
      console.log('SecondPlan - サンプル:', staffData.slice(0, 2))

      const staffMapping = {}
      const storeId = selectedShift?.storeId || selectedShift?.store_id

      staffData.forEach(s => {
        staffMapping[s.staff_id] = s
      })
      console.log('SecondPlan - staffMapping作成:', Object.keys(staffMapping).length, '件')
      console.log('SecondPlan - サンプルstaffMapping:', staffMapping[Object.keys(staffMapping)[0]])
      setStaffMap(staffMapping)

      // 第1案のシフトデータを取得
      const firstPlanShifts = await shiftRepository.getShifts({ planId })
      console.log(`第1案シフト取得: ${firstPlanShifts.length}件`, firstPlanShifts.slice(0, 3))

      // バックエンドのデータをカレンダー表示用にフォーマット
      const formattedData = formatShiftsForCalendar(firstPlanShifts, staffMapping, year, month)
      console.log(`フォーマット後のデータ: ${formattedData.length}日分`, formattedData.slice(0, 3))

      setFirstPlanData(formattedData)
      setShiftData(formattedData) // 初期表示は第1案（希望反映版として表示）
      setCsvShifts(firstPlanShifts) // 元データも保存（詳細表示用）

      // 希望シフトを取得
      const preferencesData = await shiftRepository.getPreferences({
        year,
        month
      })
      console.log(`希望シフト取得: ${preferencesData.length}件`)

      setPreferences(preferencesData)

      // 第1案と希望シフトを突合してアラートを判定
      checkPreferenceConflicts(firstPlanShifts, preferencesData, staffMapping, year, month)

      setLoading(false)
      setGenerated(true)
    } catch (error) {
      console.error('初期データ読み込みエラー:', error)
      setLoading(false)
      alert(MESSAGES.ERROR.LOAD_FAILED)
    }
  }

  // 希望シフトとの突合チェック
  const checkPreferenceConflicts = (shifts, prefs, staffMapping, year, month) => {
    console.log('=== 希望シフト突合開始 ===')
    console.log('第1案シフト数:', shifts.length)
    console.log('希望シフト数:', prefs.length)

    const conflicts = []
    const daysInMonth = new Date(year, month, 0).getDate()

    // スタッフごとの希望日をマップに変換
    const staffPreferencesMap = {}
    prefs.forEach(pref => {
      if (!staffPreferencesMap[pref.staff_id]) {
        staffPreferencesMap[pref.staff_id] = {
          preferredDays: new Set(),
          ngDays: new Set()
        }
      }

      // preferred_daysをパース（カンマ区切り）
      if (pref.preferred_days) {
        const days = pref.preferred_days.split(',').map(d => d.trim())
        days.forEach(day => {
          staffPreferencesMap[pref.staff_id].preferredDays.add(day)
        })
      }

      // ng_daysをパース
      if (pref.ng_days) {
        const days = pref.ng_days.split(',').map(d => d.trim())
        days.forEach(day => {
          staffPreferencesMap[pref.staff_id].ngDays.add(day)
        })
      }
    })

    console.log('スタッフごとの希望日マップ:', staffPreferencesMap)

    // 日付ごとにチェック
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      // その日のシフト
      const dayShifts = shifts.filter(s => s.shift_date && s.shift_date.startsWith(dateStr))

      // スタッフごとにチェック
      dayShifts.forEach(shift => {
        const staffPref = staffPreferencesMap[shift.staff_id]
        const staffName = staffMapping[shift.staff_id]?.name || `スタッフID: ${shift.staff_id}`

        if (staffPref) {
          // NGの日に配置されている場合
          if (staffPref.ngDays.has(dateStr)) {
            conflicts.push({
              date: day,
              staffId: shift.staff_id,
              staffName: staffName,
              type: 'NG_DAY',
              message: 'NG希望の日に配置'
            })
          }
          // 希望日が設定されているのに、希望日以外に配置されている場合
          else if (staffPref.preferredDays.size > 0 && !staffPref.preferredDays.has(dateStr)) {
            conflicts.push({
              date: day,
              staffId: shift.staff_id,
              staffName: staffName,
              type: 'NOT_PREFERRED',
              message: '希望日以外に配置'
            })
          }
        }
      })
    }

    console.log('不一致件数:', conflicts.length)
    if (conflicts.length > 0) {
      console.log('不一致詳細:', conflicts.slice(0, 10)) // 最初の10件のみ表示
    }

    // アラートがある場合は問題のある日付として記録
    if (conflicts.length > 0) {
      const problemDatesSet = new Set(conflicts.map(c => c.date))
      setProblemDates(problemDatesSet)

      const ngCount = conflicts.filter(c => c.type === 'NG_DAY').length
      const notPreferredCount = conflicts.filter(c => c.type === 'NOT_PREFERRED').length

      // メッセージに追加
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          type: 'system',
          content: `⚠️ 希望との不一致が${conflicts.length}件あります\n・NG日に配置: ${ngCount}件\n・希望日以外に配置: ${notPreferredCount}件\n問題のある日付: ${Array.from(problemDatesSet).sort((a,b) => a-b).join('日, ')}日`,
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } else {
      console.log('全てのシフトが希望通りに配置されています')
      setMessages(prev => [
        ...prev,
        {
          id: prev.length + 1,
          type: 'system',
          content: '✅ 全てのシフトが希望通りに配置されています。',
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        }
      ])
    }
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
      // シフト希望提出状況を確認（APIから取得）
      const [staffResult, preferencesResult] = await Promise.all([
        masterRepository.getStaff(),
        shiftRepository.getShifts({ planId: 4 }), // 仮のplan_id、実際には出勤可否APIが必要
      ])

      const activeStaff = staffResult.filter(s => s.is_active)
      const totalStaffCount = activeStaff.length

      // 提出済みのスタッフIDを抽出（submitted_atがあるスタッフ）
      const submittedStaffIds = new Set(
        preferencesResult.filter(req => req.submitted_at).map(req => req.staff_id)
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

      // マスターデータとシフトデータをAPIから読み込み
      const [rolesData, shiftsData] = await Promise.all([
        masterRepository.getRoles(),
        shiftRepository.getShifts({ planId: 4 }), // plan_id=4のシフトデータ
      ])

      // issues と solutions は将来実装予定のAPIから取得
      const issuesData = []
      const solutionsData = []

      // staffDataは既に読み込み済み
      const staffData = staffResult
      console.log('generateSecondPlan - staffData件数:', staffData.length)
      console.log('generateSecondPlan - staffDataサンプル:', staffData.slice(0, 2))

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
          is_active: staff.is_active,
          store_id: staff.store_id,
        }
      })
      console.log('generateSecondPlan - newStaffMap件数:', Object.keys(newStaffMap).length)
      console.log('generateSecondPlan - newStaffMapサンプル:', newStaffMap[Object.keys(newStaffMap)[0]])

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
          const firstPlanResult = await csvRepository.loadCSV('data/transactions/shift.csv')

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
              day: ['日', '月', '火', '水', '木', '金', '土'][new Date(2024, 10 - 1, date).getDay()],
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
      alert(MESSAGES.ERROR.SECOND_PLAN_LOAD_FAILED)
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
        const date = new Date(2024, 10 - 1, change.date)
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

  const sendMessage = async (messageText = null) => {
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

    try {
      // ChatGPT APIを呼び出す
      const systemPrompt = `あなたはシフト管理アシスタントです。現在、第2案を作成中です。

現在のシフト情報:
- 年月: ${selectedShift?.year}年${selectedShift?.month}月
- 問題: ${csvIssues.map(i => `${i.date}日: ${i.description}`).join(', ')}

ユーザーの質問に答え、必要に応じてシフトの修正を提案してください。
修正を提案する場合は、以下のJSON形式で提案を含めてください:

{
  "message": "修正の説明",
  "changes": [
    {
      "date": 15,
      "action": "modify",
      "shift_id": 123,
      "start_time": "09:00",
      "end_time": "18:00"
    }
  ]
}`

      const response = await fetch('http://localhost:3001/api/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-5).map(m => ({
              role: m.type === 'user' ? 'user' : 'assistant',
              content: m.content
            })),
            { role: 'user', content: currentInput }
          ],
          temperature: 0.7,
        }),
      })

      const data = await response.json()
      let aiContent = data.choices[0].message.content

      // JSON形式の修正提案を解析
      let suggestedChanges = null
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          if (parsed.changes) {
            suggestedChanges = parsed.changes
            // JSONコードブロックを表示から除去
            aiContent = aiContent.replace(/```json\n[\s\S]*?\n```/, '').trim()
          }
        } catch (e) {
          console.error('JSON解析エラー:', e)
        }
      }

      const aiResponse = {
        id: messages.length + 2,
        type: 'assistant',
        content: aiContent,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        suggestedChanges: suggestedChanges,
      }

      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
      scrollToBottom()
    } catch (error) {
      console.error('ChatGPT API呼び出しエラー:', error)
      const aiResponse = {
        id: messages.length + 2,
        type: 'assistant',
        content: `エラーが発生しました: ${error.message}\n\n申し訳ございませんが、再度お試しください。`,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
      scrollToBottom()
    }
  }

  const handleDayClick = date => {
    // selectedShiftから年月を取得
    const year = selectedShift?.year || new Date().getFullYear()
    const month = selectedShift?.month || new Date().getMonth() + 1
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`

    // CSVデータから該当日のシフトを取得
    const dayShiftsData = csvShifts.filter(s => {
      // s.dateが数値の場合と文字列の場合の両方に対応
      if (typeof s.date === 'number') {
        return s.date === date
      } else if (typeof s.shift_date === 'string') {
        return s.shift_date.startsWith(dateStr)
      }
      return s.date === date
    })

    // ShiftTimelineコンポーネント用のフォーマットに変換
    const formattedShifts = dayShiftsData.map(shift => {
      const staffInfo = staffMap[shift.staff_id] || { name: '不明', role_name: 'スタッフ' }
      return {
        shift_id: shift.shift_id,
        staff_id: shift.staff_id,
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

  // シフト更新ハンドラー
  const handleUpdateShift = async (shiftId, updates) => {
    try {
      // バックエンドAPIでシフトを更新
      await shiftRepository.updateShift(shiftId, updates)

      // ローカルステートを更新
      setCsvShifts(prev =>
        prev.map(shift =>
          shift.shift_id === shiftId
            ? { ...shift, ...updates, is_modified: true }
            : shift
        )
      )

      // 表示中の日のシフトも更新
      if (selectedDate) {
        setDayShifts(prev =>
          prev.map(shift =>
            shift.shift_id === shiftId
              ? { ...shift, ...updates, modified_flag: true }
              : shift
          )
        )
      }

      // カレンダー表示も更新
      await loadInitialData()
    } catch (error) {
      console.error('シフト更新エラー:', error)
      alert(MESSAGES.ERROR.SHIFT_UPDATE_FAILED)
    }
  }

  // シフト削除ハンドラー
  const handleDeleteShift = async (shiftId) => {
    try {
      // バックエンドAPIでシフトを削除
      await shiftRepository.deleteShift(shiftId)

      // ローカルステートから削除
      setCsvShifts(prev => prev.filter(shift => shift.shift_id !== shiftId))

      // 表示中の日のシフトからも削除
      if (selectedDate) {
        const updatedShifts = dayShifts.filter(s => s.shift_id !== shiftId)
        setDayShifts(updatedShifts)

        // その日のシフトがなくなったら閉じる
        if (updatedShifts.length === 0) {
          closeDayView()
        }
      }

      // カレンダー表示も更新
      await loadInitialData()
    } catch (error) {
      console.error('シフト削除エラー:', error)
      alert(MESSAGES.ERROR.SHIFT_DELETE_FAILED)
    }
  }

  // AI提案の修正を適用するハンドラー
  const handleApplySuggestedChanges = async (changes) => {
    try {
      let successCount = 0
      let errorCount = 0

      for (const change of changes) {
        try {
          if (change.action === 'modify' && change.shift_id) {
            const updates = {}
            if (change.start_time) updates.start_time = change.start_time
            if (change.end_time) updates.end_time = change.end_time
            if (change.staff_id) updates.staff_id = change.staff_id

            await handleUpdateShift(change.shift_id, updates)
            successCount++
          }
        } catch (error) {
          console.error('シフト修正エラー:', change, error)
          errorCount++
        }
      }

      if (errorCount > 0) {
        alert(MESSAGES.SUCCESS.AI_MODIFICATION_APPLIED_WITH_ERRORS(successCount, errorCount))
      } else {
        alert(MESSAGES.SUCCESS.AI_MODIFICATION_APPLIED(successCount))
      }
    } catch (error) {
      console.error('AI提案適用エラー:', error)
      alert(MESSAGES.ERROR.AI_MODIFICATION_FAILED)
    }
  }

  const handleApprove = async () => {
    try {
      // selectedShiftからplan_idを取得
      const planId = selectedShift?.plan_id || selectedShift?.planId

      if (!planId) {
        alert(MESSAGES.ERROR.NO_PLAN_ID)
        console.error('selectedShift:', selectedShift)
        return
      }

      // ステータスをSECOND_PLAN_APPROVEDに更新
      await shiftRepository.updatePlanStatus(planId, 'SECOND_PLAN_APPROVED')

      console.log('第2案を承認しました。plan_id:', planId)
      alert(MESSAGES.SUCCESS.APPROVE_SECOND_PLAN)

      // 親コンポーネントの承認処理を呼び出し（シフト管理画面に戻る）
      if (onNext) {
        onNext()
      }
    } catch (error) {
      console.error('第2案承認エラー:', error)
      alert(MESSAGES.ERROR.SHIFT_APPROVE_FAILED)
    }
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="fixed inset-0 flex flex-col"
      style={{ top: '64px' }}
    >
      {/* ヘッダー - 固定 */}
      <div className="mb-2 flex items-center justify-between flex-shrink-0 px-8 pt-4">
        <div className="flex items-center gap-4">
          <Button onClick={onPrev} variant="outline" size="sm">
            <ChevronLeft className="mr-1 h-4 w-4" />
            戻る
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              希望取り込み後修正
              <span className="text-sm font-normal text-gray-600 ml-3">
                {selectedShift?.store_name ? `${selectedShift.store_name} · ` : ''}
                スタッフ希望を反映したシフト
              </span>
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          {/* 表示切り替えボタン */}
          {generated && (
            <>
              <Button
                variant={viewMode === 'second' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('second')}
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                希望反映版
              </Button>
              <Button
                variant={viewMode === 'first' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('first')}
              >
                <Eye className="h-4 w-4 mr-1" />
                元のシフト
              </Button>
              <Button
                variant={viewMode === 'compare' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('compare')}
              >
                <GitCompare className="h-4 w-4 mr-1" />
                比較
              </Button>
            </>
          )}
          <Button
            onClick={handleApprove}
            size="sm"
            className="bg-gradient-to-r from-green-600 to-green-700"
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            承認
          </Button>
        </div>
      </div>

      {!generated ? (
        <Card className="shadow-lg border-0 flex-1 flex flex-col overflow-hidden mx-8 mb-4">
          <CardContent className="flex-1 overflow-hidden p-12 text-center flex items-center justify-center">
            {(generating || loading) ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Zap className="h-12 w-12 text-blue-600" />
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold mb-4">第1案と希望シフトを読み込み中...</h3>
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-200 rounded-full h-2 mb-4">
                    <motion.div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3 }}
                    />
                  </div>
                  <p className="text-gray-600">第1案データと希望シフトを読み込んでいます...</p>
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
        <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-4">
          {/* カレンダー表示を横いっぱいに */}
          {viewMode === 'second' && (
            <div style={{ height: 'calc(100vh - 160px)' }} className="flex flex-col">
              <div className="mb-2 px-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                  <span className="font-semibold">第2案（希望反映版）</span>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    改善版
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden px-4">
                <ShiftViewEditor
                  year={selectedShift?.year || new Date().getFullYear()}
                  month={selectedShift?.month || new Date().getMonth() + 1}
                  shiftData={csvShifts}
                  staffMap={staffMap}
                  calendarData={null}
                  storeId={selectedShift?.storeId || selectedShift?.store_id}
                  storeName={selectedShift?.store_name}
                  readonly={false}
                  onCellClick={(date, staffId, shift) => {
                    if (shift) {
                      handleDayClick(date)
                    }
                  }}
                  onDayClick={handleDayClick}
                />
              </div>
            </div>
          )}

          {viewMode === 'first' && (
            <div style={{ height: 'calc(100vh - 160px)' }} className="flex flex-col">
              <div className="mb-2 px-4 flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="font-semibold">第1案（AI自動生成）</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('second')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  第2案に戻る
                </Button>
              </div>
              <div className="flex-1 overflow-hidden px-4">
                <ShiftViewEditor
                  year={selectedShift?.year || new Date().getFullYear()}
                  month={selectedShift?.month || new Date().getMonth() + 1}
                  shiftData={firstPlanData}
                  staffMap={staffMap}
                  calendarData={null}
                  storeId={selectedShift?.storeId || selectedShift?.store_id}
                  storeName={selectedShift?.store_name}
                  readonly={true}
                  onCellClick={(date, staffId, shift) => {
                    if (shift) {
                      handleDayClick(date)
                    }
                  }}
                  onDayClick={handleDayClick}
                />
              </div>
            </div>
          )}

          {viewMode === 'compare' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 160px)' }}>
              {/* 第1案 */}
              <div className="flex flex-col">
                <div className="mb-2 px-4">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="font-semibold">第1案（AI自動生成）</span>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden px-4">
                  <ShiftViewEditor
                    year={selectedShift?.year || new Date().getFullYear()}
                    month={selectedShift?.month || new Date().getMonth() + 1}
                    shiftData={firstPlanData}
                    staffMap={staffMap}
                    calendarData={null}
                    storeId={selectedShift?.storeId || selectedShift?.store_id}
                    storeName={selectedShift?.store_name}
                    readonly={true}
                    onCellClick={(date, staffId, shift) => {
                      if (shift) {
                        handleDayClick(date)
                      }
                    }}
                    onDayClick={handleDayClick}
                  />
                </div>
              </div>

              {/* 第2案 */}
              <div className="flex flex-col ring-2 ring-green-200 rounded-lg">
                <div className="mb-2 px-4 pt-2">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                    <span className="font-semibold">第2案（希望反映版）</span>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      改善版
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden px-4">
                  <ShiftViewEditor
                    year={selectedShift?.year || new Date().getFullYear()}
                    month={selectedShift?.month || new Date().getMonth() + 1}
                    shiftData={csvShifts}
                    staffMap={staffMap}
                    calendarData={null}
                    storeId={selectedShift?.storeId || selectedShift?.store_id}
                    storeName={selectedShift?.store_name}
                    readonly={false}
                    onCellClick={(date, staffId, shift) => {
                      if (shift) {
                        handleDayClick(date)
                      }
                    }}
                    onDayClick={handleDayClick}
                  />
                </div>
              </div>
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
                          {message.type === 'assistant' && message.suggestedChanges && (
                            <button
                              onClick={() => handleApplySuggestedChanges(message.suggestedChanges)}
                              className="mt-2 w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              修正する
                            </button>
                          )}
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


          {/* ShiftTimelineコンポーネント */}
          <AnimatePresence>
            {selectedDate && (
              <ShiftTimeline
                date={selectedDate}
                year={selectedShift?.year || new Date().getFullYear()}
                month={selectedShift?.month || new Date().getMonth() + 1}
                shifts={dayShifts}
                onClose={closeDayView}
                editable={true}
                onUpdate={handleUpdateShift}
                onDelete={handleDeleteShift}
                storeName={selectedShift?.store_name}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

export default SecondPlan
