import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  ChevronLeft,
  ArrowRight,
  Check,
  X,
  Calendar,
  MessageSquare,
  Copy,
  Edit3,
} from 'lucide-react'
import AppHeader from '../shared/AppHeader'
import { DEMO_PARAMS, getCurrentYearMonth, getNextMonthYearMonth } from '../../config/defaults'
import { SHIFT_PREFERENCE_STATUS } from '../../config/constants'

/**
 * 提出期限を計算する
 * ルール: 次月分のシフト希望は当月の15日まで
 * @param {number} targetYear - 対象年
 * @param {number} targetMonth - 対象月
 * @returns {Object} { year, month, day, dayOfWeek, formatted }
 */
const calculateDeadline = (targetYear, targetMonth) => {
  // 対象月の前月の15日が提出期限
  const deadlineMonth = targetMonth === 1 ? 12 : targetMonth - 1
  const deadlineYear = targetMonth === 1 ? targetYear - 1 : targetYear
  const deadlineDay = 15

  // 曜日を取得
  const deadlineDate = new Date(deadlineYear, deadlineMonth - 1, deadlineDay)
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  const dayOfWeek = weekdays[deadlineDate.getDay()]

  return {
    year: deadlineYear,
    month: deadlineMonth,
    day: deadlineDay,
    dayOfWeek,
    formatted: `${deadlineMonth}月${deadlineDay}日(${dayOfWeek}) 23:59まで`,
  }
}

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

// 日付詳細入力モーダルコンポーネント
const DetailInputModal = ({ date, shiftPatterns, onSave, onCancel, existing, year, month }) => {
  const [selectedPatterns, setSelectedPatterns] = useState(existing?.patterns || [])
  const [comment, setComment] = useState(existing?.comment || '')

  const togglePattern = patternCode => {
    if (selectedPatterns.includes(patternCode)) {
      setSelectedPatterns(selectedPatterns.filter(p => p !== patternCode))
    } else {
      setSelectedPatterns([...selectedPatterns, patternCode])
    }
  }

  const handleSave = () => {
    if (selectedPatterns.length > 0) {
      onSave(date, selectedPatterns, comment)
    }
  }

  const handleDelete = () => {
    onSave(date, null, '')
  }

  const getDayOfWeek = date => {
    const day = new Date(year, month - 1, date).getDay()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    return weekdays[day]
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-lg border-2 border-gray-300 shadow-lg p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800">
            {month}月{date}日 ({getDayOfWeek(date)})
          </h3>
          <p className="text-xs text-gray-600">シフト希望を入力してください</p>
        </div>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* シフトパターン選択 */}
      <div className="mb-3">
        <label className="text-xs font-bold text-gray-700 mb-1.5 block">
          希望シフト（複数選択可）
        </label>
        <div className="space-y-1.5">
          {shiftPatterns.map(pattern => (
            <label
              key={pattern.pattern_code}
              className={`
                flex items-center p-2 rounded-lg border-2 cursor-pointer transition-all
                ${
                  selectedPatterns.includes(pattern.pattern_code)
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <input
                type="checkbox"
                checked={selectedPatterns.includes(pattern.pattern_code)}
                onChange={() => togglePattern(pattern.pattern_code)}
                className="mr-2"
              />
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-800">{pattern.pattern_name}</div>
                <div className="text-xs text-gray-600">
                  {pattern.start_time} - {pattern.end_time}
                  {pattern.break_minutes > 0 && ` (休憩${pattern.break_minutes}分)`}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* コメント入力 */}
      <div className="mb-3">
        <label className="text-xs font-bold text-gray-700 mb-1.5 block">コメント (任意)</label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="特記事項があれば入力してください"
          className="w-full text-xs p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          rows={2}
        />
      </div>

      {/* ボタン */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="outline" className="flex-1 text-xs" size="sm">
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedPatterns.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
            size="sm"
          >
            <Check className="mr-1 h-3 w-3" />
            保存 ({selectedPatterns.length})
          </Button>
        </div>
        {existing && (
          <Button
            onClick={handleDelete}
            variant="outline"
            className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            size="sm"
          >
            <X className="mr-1 h-3 w-3" />
            この日の希望を削除
          </Button>
        )}
      </div>
    </motion.div>
  )
}

const LineShiftInput = ({
  onNext,
  onPrev,
  shiftStatus,
  onHome,
  onShiftManagement,
  onLineMessages,
  onMonitoring,
  onStaffManagement,
  onStoreManagement,
  onConstraintManagement,
  onBudgetActualManagement,
}) => {
  const [datePreferences, setDatePreferences] = useState({}) // { date: { patterns: ['EARLY', 'MID'], comment: '' } }
  const [showLineMessage, setShowLineMessage] = useState(true)
  const [showLiffApp, setShowLiffApp] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null) // 詳細入力中の日付
  const [shiftPatterns, setShiftPatterns] = useState([])
  const [showWeeklyPattern, setShowWeeklyPattern] = useState(false)
  const [weeklyPattern, setWeeklyPattern] = useState({}) // { 0: ['EARLY'], 1: ['MID'], ... }
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false)
  const [preferencesError, setPreferencesError] = useState(null)

  // スタッフ選択と年月選択
  const [staffList, setStaffList] = useState([])
  const [selectedStaffId, setSelectedStaffId] = useState(DEMO_PARAMS.staff_id)
  const nextMonthYearMonth = getNextMonthYearMonth()
  const [selectedYear, setSelectedYear] = useState(nextMonthYearMonth.year)
  const [selectedMonth, setSelectedMonth] = useState(nextMonthYearMonth.month)
  const [existingPreferenceId, setExistingPreferenceId] = useState(null)

  // デモ用の日付データ
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1)

  useEffect(() => {
    loadShiftPatterns()
    loadStaffList()
  }, [])

  useEffect(() => {
    if (selectedStaffId) {
      loadShiftPreferences()
    }
  }, [selectedStaffId, selectedYear, selectedMonth])

  const loadStaffList = async () => {
    try {
      const { tenant_id } = DEMO_PARAMS
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/master/staff?tenant_id=${tenant_id}`)
      const result = await response.json()
      if (result.success) {
        setStaffList(result.data.filter(s => s.is_active))
      }
    } catch (error) {
      console.error('スタッフリスト読み込みエラー:', error)
    }
  }

  const loadShiftPatterns = async () => {
    try {
      const { tenant_id, store_id } = DEMO_PARAMS
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/master/shift-patterns?tenant_id=${tenant_id}&store_id=${store_id}`)
      const result = await response.json()
      if (result.success) {
        setShiftPatterns(result.data)
      }
    } catch (error) {
      console.error('シフトパターン読み込みエラー:', error)
    }
  }

  /**
   * APIからシフト希望を読み込む
   */
  const loadShiftPreferences = async () => {
    setIsLoadingPreferences(true)
    setPreferencesError(null)
    setExistingPreferenceId(null) // リセット

    try {
      const { tenant_id, store_id } = DEMO_PARAMS
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

      const url = `${apiUrl}/api/shifts/preferences?tenant_id=${tenant_id}&store_id=${store_id}&staff_id=${selectedStaffId}&year=${selectedYear}&month=${selectedMonth}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        console.log('既存のシフト希望を読み込みました:', result.data)
        // APIレスポンスをローカルステート形式に変換
        const prefs = {}
        const firstPreference = result.data[0]

        // 既存のpreference_idを保存（更新時に使用）
        if (firstPreference.preference_id) {
          console.log('既存のpreference_idを保存:', firstPreference.preference_id)
          setExistingPreferenceId(firstPreference.preference_id)
        }

        result.data.forEach(preference => {
          // preferred_days: "2024-11-01,2024-11-03,2024-11-05"
          if (preference.preferred_days) {
            const dates = preference.preferred_days.split(',').map(d => d.trim())
            dates.forEach(dateStr => {
              const day = parseInt(dateStr.split('-')[2]) // "2024-11-05" → 5
              if (!isNaN(day) && day >= 1 && day <= 31) {
                prefs[day] = {
                  patterns: [], // パターン情報はAPIに保存していないためデフォルト
                  comment: preference.notes || '',
                }
              }
            })
          }

          // ng_days も同様に処理（表示のみ）
          if (preference.ng_days) {
            const ngDates = preference.ng_days.split(',').map(d => d.trim())
            // NG日は別途処理する場合はここで対応
          }
        })

        console.log('変換後のprefs:', prefs)
        setDatePreferences(prefs)

        // 既に希望が提出されている場合
        if (result.data.some(p => p.status === SHIFT_PREFERENCE_STATUS.PENDING || p.status === SHIFT_PREFERENCE_STATUS.APPROVED)) {
          console.log('既に提出済みです')
          setIsSubmitted(true)
        }
      } else {
        // データが存在しない場合は空のまま
        console.log('シフト希望データがまだ登録されていません')
      }
    } catch (error) {
      console.error('シフト希望読み込みエラー:', error)
      setPreferencesError(error.message)
      // エラーでも画面は表示する（新規入力として扱う）
    } finally {
      setIsLoadingPreferences(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const { tenant_id, store_id } = DEMO_PARAMS
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

      // 選択された日付を配列化
      const preferredDays = Object.keys(datePreferences)
        .map(day => {
          const dayNum = parseInt(day)
          return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        })
        .join(',')

      const requestBody = {
        tenant_id,
        store_id,
        staff_id: selectedStaffId,
        year: selectedYear,
        month: selectedMonth,
        preferred_days: preferredDays,
        ng_days: '',
        notes: '',
        status: SHIFT_PREFERENCE_STATUS.PENDING,
      }

      const isUpdate = !!existingPreferenceId
      const url = isUpdate
        ? `${apiUrl}/api/shifts/preferences/${existingPreferenceId}?tenant_id=${tenant_id}`
        : `${apiUrl}/api/shifts/preferences`

      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (result.success) {
        setIsSubmitted(true)
        setShowLiffApp(false)
        setShowLineMessage(true)
        alert('シフト希望を登録しました！')
      } else {
        throw new Error(result.error || '登録に失敗しました')
      }
    } catch (error) {
      console.error('シフト希望登録エラー:', error)
      alert(`シフト希望の登録に失敗しました。\n${error.message}`)
    }
  }

  const toggleDate = date => {
    // どちらの場合も詳細入力画面を表示（編集または新規入力）
    setSelectedDate(date)
  }

  const saveDatePreference = (date, patterns, comment) => {
    if (patterns === null) {
      // 削除の場合
      const newPrefs = { ...datePreferences }
      delete newPrefs[date]
      setDatePreferences(newPrefs)
    } else {
      // 保存の場合
      setDatePreferences({
        ...datePreferences,
        [date]: { patterns, comment },
      })
    }
    setSelectedDate(null)
  }

  const applyWeeklyPattern = () => {
    const newPrefs = { ...datePreferences }
    daysInMonth.forEach(date => {
      const dayOfWeek = new Date(selectedYear, selectedMonth - 1, date).getDay()
      if (weeklyPattern[dayOfWeek]) {
        newPrefs[date] = {
          patterns: [weeklyPattern[dayOfWeek]], // 配列として設定
          comment: '',
        }
      }
    })
    setDatePreferences(newPrefs)
    setShowWeeklyPattern(false)
  }

  const selectedDatesCount = Object.keys(datePreferences).length

  const getDayOfWeek = date => {
    const day = new Date(selectedYear, selectedMonth - 1, date).getDay()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    return weekdays[day]
  }

  const isWeekend = date => {
    const day = new Date(selectedYear, selectedMonth - 1, date).getDay()
    return day === 0 || day === 6
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        onHome={onHome}
        onShiftManagement={onShiftManagement}
        onLineMessages={onLineMessages}
        onMonitoring={onMonitoring}
        onStaffManagement={onStaffManagement}
        onStoreManagement={onStoreManagement}
        onConstraintManagement={onConstraintManagement}
        onBudgetActualManagement={onBudgetActualManagement}
      />

      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="app-container"
      >
        {/* スタッフのスマホ画面風デモ */}
        <div className="flex justify-center">
          <div className="w-full max-w-[380px]">
            <Card className="shadow-2xl border-4 border-gray-800 rounded-[2rem] overflow-hidden bg-white">
              {/* スマホのステータスバー */}
              <div className="bg-black text-white px-4 py-1.5 flex items-center justify-between text-xs">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-2.5 border border-white rounded-sm"></div>
                  <div className="w-3 h-2.5 border border-white rounded-sm"></div>
                  <div className="w-3 h-2.5 border border-white rounded-sm"></div>
                </div>
              </div>

              {showLineMessage ? (
                /* LINEトーク画面 */
                <div className="bg-[#7CB4D3] h-[600px] p-3 overflow-y-auto">
                  {/* LINEヘッダー */}
                  <div className="bg-white rounded-t-lg px-3 py-2 flex items-center gap-2 border-b">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">カフェ○○ 店舗公式</p>
                      <p className="text-xs text-gray-500">営業時間 9:00-22:00</p>
                    </div>
                  </div>

                  {/* トークエリア */}
                  <div className="bg-white px-3 py-4 space-y-3">
                    {/* 店舗からのメッセージ */}
                    <div className="flex items-start gap-1.5">
                      <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
                          <p className="text-xs text-gray-800 mb-2">
                            お疲れ様です！
                            <br />
                            <span className="font-bold">{selectedMonth}月分のシフト希望</span>
                            の提出をお願いします。
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            📅 提出期限: {calculateDeadline(selectedYear, selectedMonth).formatted}
                            <br />
                            ⚠️ シフトが確定するまで、何度でも変更可能です
                          </p>
                          <div className="mt-2 p-2 bg-green-50 border-2 border-green-600 rounded-lg">
                            <p className="text-xs text-green-800 font-bold mb-1.5">
                              👇 こちらから入力してください
                            </p>
                            <Button
                              onClick={() => {
                                setShowLineMessage(false)
                                setShowLiffApp(true)
                              }}
                              className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1.5"
                            >
                              シフト希望を入力する
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 ml-1">14:30</p>
                      </div>
                    </div>

                    {/* 注意事項メッセージ */}
                    <div className="flex items-start gap-1.5">
                      <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
                          <p className="text-xs text-gray-700">
                            💡 <span className="font-bold">入力のポイント</span>
                            <br />
                            ・勤務できる日を全て選択してください
                            <br />
                            ・確定前なら何度でも修正できます
                            <br />
                            ・質問があればこのトークで連絡してください
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 ml-1">14:31</p>
                      </div>
                    </div>

                    {/* 送信完了メッセージ */}
                    {isSubmitted && (
                      <>
                        {/* ユーザーからの送信メッセージ */}
                        <div className="flex items-end justify-end gap-1.5">
                          <div className="flex-1 flex flex-col items-end">
                            <div className="bg-green-500 text-white rounded-lg p-2 shadow-sm max-w-[80%]">
                              <p className="text-xs">送信しました！</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 mr-1">14:35</p>
                          </div>
                        </div>

                        {/* システム自動返信 */}
                        <div className="flex items-start gap-1.5">
                          <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="bg-green-50 border-2 border-green-600 rounded-lg p-2.5 shadow-sm">
                              <p className="text-xs font-bold text-green-800 mb-1">
                                ✅ シフト希望を受け付けました
                              </p>
                              <p className="text-xs text-green-700">
                                {staffList.find(s => s.staff_id === selectedStaffId)?.name || 'スタッフ'}さんが{selectedMonth}月のシフト希望を送信しました。
                                <br />
                                <span className="font-bold">選択日数: {selectedDatesCount}日</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1.5">
                                シフトが確定するまで、いつでも変更可能です。
                                <br />
                                変更する場合は、もう一度上のボタンから入力してください。
                              </p>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 ml-1">14:35</p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* シフト承認完了メッセージ */}
                    {shiftStatus?.[selectedMonth] === 'completed' && (
                      <div className="flex items-start gap-1.5">
                        <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-2.5 shadow-sm">
                            <p className="text-xs font-bold text-blue-800 mb-1">
                              📅 {selectedMonth}月のシフトが確定しました
                            </p>
                            <p className="text-xs text-blue-700 mb-2">
                              お疲れ様です！
                              <br />
                              {selectedMonth}月のシフトが承認され、確定しました。
                            </p>
                            <div className="mt-2 p-2 bg-white border border-blue-300 rounded-lg">
                              <p className="text-xs text-blue-800 font-bold mb-1.5">
                                👇 シフトを確認する
                              </p>
                              <Button
                                size="sm"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5"
                              >
                                {selectedMonth}月のシフトを見る
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 ml-1">16:20</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* LINE入力エリア */}
                  <div className="bg-white rounded-b-lg px-3 py-2 flex items-center gap-2 border-t">
                    <input
                      type="text"
                      placeholder="メッセージを入力"
                      className="flex-1 px-2.5 py-1.5 bg-gray-100 rounded-full text-xs"
                      disabled
                    />
                    <Button size="sm" className="rounded-full text-xs px-3 py-1" disabled>
                      送信
                    </Button>
                  </div>
                </div>
              ) : showLiffApp ? (
                /* LIFF入力画面 */
                <div className="bg-white h-[600px] overflow-y-auto">
                  {/* LIFFヘッダー */}
                  <div className="bg-green-600 text-white px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <span className="font-bold text-sm">シフト希望入力</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowLiffApp(false)
                        setShowLineMessage(true)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-3 bg-gray-50 h-[calc(100%-48px)] overflow-y-auto">
                    {/* 新規/更新ステータス表示 */}
                    {!isLoadingPreferences && (
                      <div className={`mb-3 p-2 rounded-lg border-2 ${existingPreferenceId ? 'bg-blue-50 border-blue-300' : 'bg-green-50 border-green-300'}`}>
                        <p className={`text-xs font-bold ${existingPreferenceId ? 'text-blue-800' : 'text-green-800'}`}>
                          {existingPreferenceId ? '📝 更新モード' : '✨ 新規登録モード'}
                        </p>
                        <p className={`text-xs ${existingPreferenceId ? 'text-blue-600' : 'text-green-600'} mt-0.5`}>
                          {existingPreferenceId
                            ? '既存のシフト希望が読み込まれました。変更して更新できます。'
                            : 'このスタッフ・年月のシフト希望はまだ登録されていません。'}
                        </p>
                      </div>
                    )}

                    {/* スタッフ選択と年月選択 */}
                    <div className="mb-3 space-y-2">
                      <div>
                        <label className="text-xs font-bold text-gray-700 mb-1 block">
                          スタッフ選択
                        </label>
                        <select
                          value={selectedStaffId}
                          onChange={(e) => setSelectedStaffId(parseInt(e.target.value))}
                          className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5"
                        >
                          {staffList.map(staff => (
                            <option key={staff.staff_id} value={staff.staff_id}>
                              {staff.name} ({staff.staff_code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">
                            対象年
                          </label>
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5"
                          >
                            {[2024, 2025, 2026].map(year => (
                              <option key={year} value={year}>{year}年</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">
                            対象月
                          </label>
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={month} value={month}>{month}月</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* ローディング表示 */}
                    {isLoadingPreferences && (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                        <p className="text-xs text-gray-600 mt-2">シフト希望を読み込み中...</p>
                      </div>
                    )}

                    {/* エラー表示 */}
                    {preferencesError && !isLoadingPreferences && (
                      <div className="mb-2 p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          ⚠️ シフト希望の読み込みに失敗しました
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">{preferencesError}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          新規入力として続行できます
                        </p>
                      </div>
                    )}

                    {/* 繰り返しパターン設定ボタン */}
                    {!selectedDate && !showWeeklyPattern && !isLoadingPreferences && (
                      <Button
                        onClick={() => setShowWeeklyPattern(true)}
                        variant="outline"
                        className="w-full mb-2 text-xs"
                        size="sm"
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        曜日ごとのパターンを設定
                      </Button>
                    )}

                    {/* 曜日パターン設定UI */}
                    {showWeeklyPattern && (
                      <div className="mb-3 p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-gray-800">曜日ごとのパターン</h4>
                          <button
                            onClick={() => setShowWeeklyPattern(false)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          月全体に繰り返しパターンを設定できます
                        </p>
                        {['日', '月', '火', '水', '木', '金', '土'].map((day, idx) => (
                          <div key={idx} className="flex items-center gap-1 mb-1">
                            <span
                              className={`text-xs font-medium w-6 ${idx === 0 || idx === 6 ? 'text-blue-600' : 'text-gray-700'}`}
                            >
                              {day}
                            </span>
                            <select
                              value={weeklyPattern[idx] || ''}
                              onChange={e =>
                                setWeeklyPattern({ ...weeklyPattern, [idx]: e.target.value })
                              }
                              className="flex-1 text-xs p-1 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                              <option value="">なし</option>
                              {shiftPatterns.map(p => (
                                <option key={p.pattern_code} value={p.pattern_code}>
                                  {p.pattern_name} ({p.start_time}-{p.end_time})
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                        <Button
                          onClick={applyWeeklyPattern}
                          className="w-full mt-2 text-xs bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          カレンダーに適用
                        </Button>
                      </div>
                    )}

                    {/* カレンダー選択UI */}
                    {!selectedDate && !isLoadingPreferences && (
                      <>
                        <div className="mb-2">
                          <h3 className="text-sm font-bold text-gray-800 mb-0.5">
                            {selectedYear}年{selectedMonth}月のシフト希望
                          </h3>
                          <p className="text-xs text-gray-600">日付をタップして希望を入力</p>
                        </div>

                        <div className="grid grid-cols-7 gap-0.5 mb-2">
                          {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                            <div
                              key={day}
                              className="text-center text-xs font-bold text-gray-500 py-1"
                            >
                              {day}
                            </div>
                          ))}

                          {daysInMonth.map(date => {
                            const pref = datePreferences[date]
                            const weekend = isWeekend(date)
                            const patterns =
                              pref?.patterns
                                ?.map(code => shiftPatterns.find(p => p.pattern_code === code))
                                .filter(Boolean) || []

                            return (
                              <button
                                key={date}
                                onClick={() => toggleDate(date)}
                                className={`
                                min-h-[50px] rounded text-xs transition-all p-0.5 relative
                                ${
                                  pref
                                    ? 'bg-green-600 text-white shadow-md'
                                    : weekend
                                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                      : 'bg-white text-gray-700 hover:bg-gray-100'
                                }
                              `}
                              >
                                <div className="font-bold mb-0.5">{date}</div>
                                {pref && patterns.length > 0 && (
                                  <>
                                    <div className="text-[9px] leading-tight">
                                      {patterns.map(p => p.pattern_name).join('/')}
                                    </div>
                                    {pref.comment && (
                                      <div className="absolute top-0.5 right-0.5">
                                        <MessageSquare className="h-2.5 w-2.5" />
                                      </div>
                                    )}
                                  </>
                                )}
                              </button>
                            )
                          })}
                        </div>

                        <div className="mb-2 p-2 bg-white rounded border">
                          <p className="text-xs text-gray-600">
                            選択:{' '}
                            <span className="font-bold text-green-600">{selectedDatesCount}日</span>
                          </p>
                        </div>

                        <Button
                          onClick={handleSubmit}
                          disabled={selectedDatesCount === 0}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2"
                        >
                          <Check className="mr-2 h-3.5 w-3.5" />
                          送信する ({selectedDatesCount}日)
                        </Button>
                      </>
                    )}

                    {/* 日付詳細入力モーダル */}
                    {selectedDate && (
                      <DetailInputModal
                        date={selectedDate}
                        shiftPatterns={shiftPatterns}
                        onSave={saveDatePreference}
                        onCancel={() => setSelectedDate(null)}
                        existing={datePreferences[selectedDate]}
                        year={selectedYear}
                        month={selectedMonth}
                      />
                    )}
                  </div>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LineShiftInput
