import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  Users,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
  X,
  Calendar,
  History as HistoryIcon,
} from 'lucide-react'
import AppHeader from '../shared/AppHeader'
import ShiftTimeline from '../shared/ShiftTimeline'
import { AnimatePresence } from 'framer-motion'
import { useTenant } from '../../contexts/TenantContext'

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

const Monitoring = ({
  onNext,
  onPrev,
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
  const [staffStatus, setStaffStatus] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [availabilityRequests, setAvailabilityRequests] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [staffMap, setStaffMap] = useState({})
  const [rolesMap, setRolesMap] = useState({})
  const [shiftPatternsMap, setShiftPatternsMap] = useState({})
  const [activeTab, setActiveTab] = useState('management') // 'management' or 'history'
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0) // 管理タブで選択中の月のインデックス

  // 管理タブ用（今月 + 次の3ヶ月 = 合計4ヶ月）
  const currentDate = useMemo(() => new Date(), [])
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  // 今月から4ヶ月分の年月を計算
  const managementMonths = useMemo(() => {
    const months = []
    for (let i = 0; i < 4; i++) {
      const targetDate = new Date(currentYear, currentMonth - 1 + i, 1)
      months.push({
        year: targetDate.getFullYear(),
        month: targetDate.getMonth() + 1
      })
    }
    return months
  }, [currentYear, currentMonth])

  // 履歴タブ用（全年月）
  const [historyYear, setHistoryYear] = useState(currentYear)
  const [historyMonth, setHistoryMonth] = useState(null) // null = 全月表示

  useEffect(() => {
    loadAvailabilityData()
  }, [activeTab, historyYear, historyMonth, tenantId])

  const loadAvailabilityData = async () => {
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

      // タブに応じてAPIパラメータを決定
      let preferencesUrl
      if (activeTab === 'management') {
        // 管理タブ：当月と次月のみ
        // 2つの月のデータを取得するため、年月フィルタなしで取得して後でフィルタ
        // テナント全体のデータを取得（store_idフィルタなし）
        preferencesUrl = `${apiUrl}/api/shifts/preferences?tenant_id=${tenantId}`
      } else {
        // 履歴タブ：選択した年月
        // テナント全体のデータを取得（store_idフィルタなし）
        preferencesUrl = historyMonth
          ? `${apiUrl}/api/shifts/preferences?tenant_id=${tenantId}&year=${historyYear}&month=${historyMonth}`
          : `${apiUrl}/api/shifts/preferences?tenant_id=${tenantId}&year=${historyYear}`
      }

      const [staffResponse, rolesResponse, patternsResponse, preferencesResponse] = await Promise.all([
        fetch(`${apiUrl}/api/master/staff?tenant_id=${tenantId}`),
        fetch(`${apiUrl}/api/master/roles?tenant_id=${tenantId}`),
        fetch(`${apiUrl}/api/master/shift-patterns?tenant_id=${tenantId}`),
        fetch(preferencesUrl),
      ])

      const staffResult = await staffResponse.json()
      const rolesResult = await rolesResponse.json()
      const patternsResult = await patternsResponse.json()
      const preferencesResult = await preferencesResponse.json()

      const staffData = staffResult.success ? staffResult.data : []
      const rolesData = rolesResult.success ? rolesResult.data : []
      const patternsData = patternsResult.success ? patternsResult.data : []
      let availData = preferencesResult.success ? preferencesResult.data : []

      // 管理タブの場合、今月から4ヶ月先までにフィルタ
      if (activeTab === 'management') {
        availData = availData.filter(item => {
          const itemYear = parseInt(item.year)
          const itemMonth = parseInt(item.month)
          return managementMonths.some(m => m.year === itemYear && m.month === itemMonth)
        })
      }

      // 履歴タブの場合、今月より前のデータのみにフィルタ
      if (activeTab === 'history') {
        availData = availData.filter(item => {
          const itemYear = parseInt(item.year)
          const itemMonth = parseInt(item.month)
          const itemDate = new Date(itemYear, itemMonth - 1, 1)
          const currentDate = new Date(currentYear, currentMonth - 1, 1)
          return itemDate < currentDate
        })
      }

      // スタッフマップと役職マップを作成
      const staffMapping = {}
      staffData.forEach(staff => {
        staffMapping[staff.staff_id] = staff
      })
      setStaffMap(staffMapping)

      const rolesMapping = {}
      rolesData.forEach(role => {
        rolesMapping[role.role_id] = role.role_name
      })
      setRolesMap(rolesMapping)

      const patternsMapping = {}
      patternsData.forEach(pattern => {
        patternsMapping[pattern.pattern_code] = {
          name: pattern.pattern_name,
          start_time: pattern.start_time,
          end_time: pattern.end_time,
          break_minutes: parseInt(pattern.break_minutes || 0),
        }
      })
      setShiftPatternsMap(patternsMapping)

      // スタッフごとに集計
      const staffMap = {}
      staffData.forEach(staff => {
        staffMap[staff.staff_id] = {
          id: parseInt(staff.staff_id),
          name: staff.name,
          submitted: false,
          submittedAt: null,
          lastReminder: null,
        }
      })

      // 提出状況を集計（submitted_atがあるstaff_idのみを提出済みとする）
      const submittedStaffIds = new Set()
      availData.forEach(req => {
        if (req.submitted_at) {
          submittedStaffIds.add(req.staff_id.toString())

          if (staffMap[req.staff_id]) {
            const date = new Date(req.submitted_at)
            const formatted = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
            if (
              !staffMap[req.staff_id].submittedAt ||
              new Date(req.submitted_at) > new Date(staffMap[req.staff_id].submittedAt)
            ) {
              staffMap[req.staff_id].submittedAt = formatted
            }
          }
        }
      })

      // 提出済みフラグを設定
      Object.keys(staffMap).forEach(staffId => {
        if (submittedStaffIds.has(staffId)) {
          staffMap[staffId].submitted = true
        }
      })

      const staffStatusArray = Object.values(staffMap)
      console.log('Staff Status:', staffStatusArray)
      console.log('Availability Requests:', availData)
      setStaffStatus(staffStatusArray)
      setAvailabilityRequests(availData)
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 管理タブで選択中の月の情報を取得
  const selectedMonthData = activeTab === 'management' && managementMonths[selectedMonthIndex]
    ? managementMonths[selectedMonthIndex]
    : null

  // 選択中の月でフィルタしたスタッフステータスを計算
  const filteredStaffStatus = useMemo(() => {
    if (activeTab !== 'management' || !selectedMonthData) {
      return staffStatus
    }

    // 選択された月のデータのみを使用
    const selectedMonthRequests = availabilityRequests.filter(
      req => parseInt(req.year) === selectedMonthData.year && parseInt(req.month) === selectedMonthData.month
    )

    // スタッフごとに提出状況を再計算
    return staffStatus.map(staff => {
      const staffRequest = selectedMonthRequests.find(req => req.staff_id === staff.id && req.submitted_at)
      if (staffRequest) {
        const date = new Date(staffRequest.submitted_at)
        const formatted = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
        return {
          ...staff,
          submitted: true,
          submittedAt: formatted
        }
      }
      return {
        ...staff,
        submitted: false,
        submittedAt: null
      }
    })
  }, [activeTab, selectedMonthData, staffStatus, availabilityRequests])

  const submittedCount = filteredStaffStatus.filter(s => s.submitted).length
  const totalCount = filteredStaffStatus.length
  const submissionRate = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0

  const sendReminder = staffId => {
    setStaffStatus(prev =>
      prev.map(staff =>
        staff.id === staffId
          ? {
              ...staff,
              lastReminder: new Date().toLocaleString('ja-JP', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : staff
      )
    )
  }

  const handleStaffClick = staff => {
    console.log('Clicked staff:', staff)
    if (staff.submitted) {
      console.log('Staff is submitted, showing modal')
      setSelectedStaff(staff)
    } else {
      console.log('Staff not submitted, ignoring click')
    }
  }

  const closeModal = () => {
    setSelectedStaff(null)
    setSelectedDay(null)
  }

  const handleDayClick = day => {
    setSelectedDay(day)
  }

  const closeDayView = () => {
    setSelectedDay(null)
  }

  const getStaffRequests = staffId => {
    return availabilityRequests.filter(req => req.staff_id === staffId)
  }

  // ShiftTimeline用のデータを準備（その日のスタッフの希望を表示）
  const getDayShifts = (day, staffId) => {
    const requests = getStaffRequests(staffId)
    const latestRequest = requests.length > 0 ? requests[requests.length - 1] : null

    if (!latestRequest || !latestRequest.preferred_days) {
      return []
    }

    // その日が希望日に含まれているかチェック
    const preferredDays = latestRequest.preferred_days.split(',')
    const year = latestRequest.year
    const month = latestRequest.month
    const targetDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    const isPreferred = preferredDays.some(dateStr => dateStr.trim() === targetDate)

    if (!isPreferred) {
      return []
    }

    const staff = staffMap[staffId]
    const roleName = staff ? rolesMap[staff.role_id] : '一般スタッフ'

    // 希望シフトを表示用に変換（時間帯は未定なので仮の値）
    return [
      {
        shift_id: `pref-${latestRequest.preference_id}-${day}`,
        staff_name: selectedStaff.name,
        role: roleName,
        start_time: '09:00',  // 仮の値
        end_time: '18:00',    // 仮の値
        actual_hours: 8,
        planned_hours: 8,
        modified_flag: false,
        is_preference: true,  // 希望シフトであることを示すフラグ
      },
    ]
  }

  // カレンダー表示用のデータ準備
  const getCalendarData = staffId => {
    const requests = getStaffRequests(staffId)

    // 最新のリクエストを取得
    const latestRequest = requests.length > 0 ? requests[requests.length - 1] : null

    if (!latestRequest) {
      return { preferredDaysSet: new Set(), daysInMonth: 31, firstDay: 0, year: 2024, month: 10, latestRequest: null }
    }

    const preferredDaysSet = new Set()
    const year = latestRequest.year
    const month = latestRequest.month

    // preferred_daysフィールドから日付を抽出（アルバイトの勤務希望日）
    if (latestRequest.preferred_days) {
      const days = latestRequest.preferred_days.split(',')
      days.forEach(dateStr => {
        const date = new Date(dateStr.trim())
        if (!isNaN(date.getTime())) {
          preferredDaysSet.add(date.getDate())
        }
      })
    }

    // ng_daysフィールドから日付を抽出（正社員の休み希望日）
    if (latestRequest.ng_days) {
      const days = latestRequest.ng_days.split(',')
      days.forEach(dateStr => {
        const date = new Date(dateStr.trim())
        if (!isNaN(date.getTime())) {
          preferredDaysSet.add(date.getDate())
        }
      })
    }

    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDay = new Date(year, month - 1, 1).getDay()

    return { preferredDaysSet, daysInMonth, firstDay, year, month, latestRequest }
  }


  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    return (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            シフト希望管理
          </h1>
          <p className="text-lg text-gray-600">スタッフの希望提出状況を管理</p>
        </div>

        {/* タブメニュー */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('management')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'management'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              シフト希望管理
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              シフト希望履歴
            </div>
          </button>
        </div>

        {/* 履歴タブの年月選択 */}
        {activeTab === 'history' && (
          <>
            {/* 年選択 */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <Button variant="outline" size="sm" onClick={() => setHistoryYear(historyYear - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-2xl font-bold">{historyYear}年</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryYear(historyYear + 1)}
                disabled={historyYear >= currentYear}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 月フィルター */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              <Button
                variant={historyMonth === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHistoryMonth(null)}
              >
                全月
              </Button>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                // 今年で今月以降の月は無効化
                const isDisabled = historyYear === currentYear && month >= currentMonth

                return (
                  <Button
                    key={month}
                    variant={historyMonth === month ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHistoryMonth(month)}
                    disabled={isDisabled}
                    className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {month}月
                  </Button>
                )
              })}
            </div>
          </>
        )}

        {/* 管理タブ：月別スクロールカード */}
        {activeTab === 'management' && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">対象月を選択</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {managementMonths.map((monthData, index) => {
                // この月のデータがあるスタッフ数を計算
                const monthStaffCount = availabilityRequests.filter(
                  req => parseInt(req.year) === monthData.year && parseInt(req.month) === monthData.month && req.submitted_at
                ).length
                const totalStaff = staffStatus.length
                const monthRate = totalStaff > 0 ? Math.round((monthStaffCount / totalStaff) * 100) : 0
                const isSelected = selectedMonthIndex === index

                return (
                  <Card
                    key={`${monthData.year}-${monthData.month}`}
                    className={`shadow-lg border-2 min-w-[250px] flex-shrink-0 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-400'
                        : 'border-blue-300 hover:border-blue-500 hover:shadow-xl'
                    }`}
                    onClick={() => setSelectedMonthIndex(index)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className={`h-5 w-5 ${isSelected ? 'text-blue-700' : 'text-blue-600'}`} />
                        {monthData.year}年{monthData.month}月
                        {isSelected && (
                          <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-1 rounded">選択中</span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">提出率</span>
                          <span className={`text-2xl font-bold ${isSelected ? 'text-blue-700' : 'text-blue-600'}`}>
                            {monthRate}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">提出済み</span>
                          <span className="text-lg font-bold text-green-600">{monthStaffCount}名</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">未提出</span>
                          <span className="text-lg font-bold text-red-600">{totalStaff - monthStaffCount}名</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* スタッフ一覧 */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                スタッフ提出状況
              </div>
              {activeTab === 'management' && selectedMonthData && (
                <span className="text-sm font-normal text-gray-600">
                  {selectedMonthData.year}年{selectedMonthData.month}月
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStaffStatus.map(staff => (
                <motion.div
                  key={staff.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    staff.submitted ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => handleStaffClick(staff)}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        staff.submitted ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <p className={`font-medium ${staff.submitted ? 'text-blue-600' : ''}`}>
                        {staff.name}
                        {staff.submitted && (
                          <span className="text-xs ml-2 text-gray-500">(クリックで詳細)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {staff.submitted
                          ? `提出済み: ${staff.submittedAt}`
                          : `最終催促: ${staff.lastReminder}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {staff.submitted ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">完了</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm">未提出</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => sendReminder(staff.id)}>
                          <Send className="h-4 w-4 mr-1" />
                          催促
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 希望シフト詳細モーダル */}
        {selectedStaff && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* ヘッダー */}
              <div className="border-b bg-gray-50 px-6 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedStaff.name}の希望シフト</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      提出日時: {selectedStaff.submittedAt}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={closeModal}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* コンテンツ */}
              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  const { preferredDaysSet, daysInMonth, firstDay, year, month, latestRequest } = getCalendarData(selectedStaff.id)
                  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

                  if (!latestRequest) {
                    return (
                      <div className="text-center text-gray-500 py-8">
                        このスタッフのシフト希望はまだ登録されていません。
                      </div>
                    )
                  }

                  // カレンダーグリッド用の配列を作成
                  const calendarDays = []
                  // 月初の空セル
                  for (let i = 0; i < firstDay; i++) {
                    calendarDays.push(null)
                  }
                  // 日付セル
                  for (let day = 1; day <= daysInMonth; day++) {
                    calendarDays.push(day)
                  }

                  // スタッフの雇用形態を確認
                  // selectedStaff.idは数値、staffMapのキーは文字列なので変換が必要
                  const staffKey = selectedStaff.id.toString()
                  const currentStaff = staffMap[staffKey]

                  if (!currentStaff) {
                    console.error('Staff not found in staffMap:', selectedStaff.id, 'staffMap keys:', Object.keys(staffMap))
                  }

                  const isPartTimeStaff = currentStaff?.employment_type === 'PART_TIME' || currentStaff?.employment_type === 'PART'
                  const hasNgDays = latestRequest.ng_days && latestRequest.ng_days.length > 0
                  const hasPreferredDays = latestRequest.preferred_days && latestRequest.preferred_days.length > 0

                  return (
                    <div>
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        {year}年{month}月の{isPartTimeStaff ? 'シフト希望' : '休み希望'}
                      </h3>

                      {/* 追加情報 */}
                      {latestRequest.notes && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="text-sm font-bold text-yellow-800 mb-1">備考</div>
                          <div className="text-sm text-yellow-700">{latestRequest.notes}</div>
                        </div>
                      )}

                      {latestRequest.max_hours_per_week && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                          <div className="text-sm">
                            <span className="font-bold text-blue-800">週最大勤務時間: </span>
                            <span className="text-blue-700">{latestRequest.max_hours_per_week}時間</span>
                          </div>
                        </div>
                      )}

                      {/* 曜日ヘッダー */}
                      <div className="grid grid-cols-7 gap-2 mb-2">
                        {weekDays.map(day => (
                          <div
                            key={day}
                            className="p-2 text-center text-sm font-bold bg-gray-100 rounded"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* カレンダーグリッド */}
                      <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day, index) => {
                          if (!day) {
                            // 空セル
                            return <div key={`empty-${index}`} className="min-h-[100px]" />
                          }

                          const dayOfWeek = (firstDay + day - 1) % 7
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                          const isPreferred = preferredDaysSet.has(day)

                          return (
                            <motion.div
                              key={day}
                              className={`p-2 border-2 rounded-lg min-h-[100px] ${
                                isPreferred
                                  ? isPartTimeStaff
                                    ? 'bg-green-50 border-green-300 cursor-pointer hover:bg-green-100'
                                    : 'bg-red-50 border-red-300 cursor-pointer hover:bg-red-100'
                                  : 'bg-gray-50 border-gray-200'
                              } ${isWeekend && !isPreferred ? 'bg-blue-50' : ''}`}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.01 }}
                              onClick={() => isPreferred && handleDayClick(day)}
                            >
                              <div
                                className={`text-sm font-bold mb-1 ${
                                  isWeekend ? 'text-blue-600' : 'text-gray-700'
                                }`}
                              >
                                {day}
                              </div>
                              {isPreferred && (
                                <div className="space-y-1">
                                  <div className={`text-xs font-bold ${isPartTimeStaff ? 'text-green-700' : 'text-red-700'}`}>
                                    {isPartTimeStaff ? '◯ 出勤希望' : '✕ 休み希望'}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* 凡例 */}
                      <div className="mt-4 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 border-2 rounded ${isPartTimeStaff ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}></div>
                          <span>{isPartTimeStaff ? '出勤希望' : '休み希望'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded"></div>
                          <span>希望なし</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </motion.div>
          </div>
        )}

        {/* ShiftTimeline詳細表示 */}
        <AnimatePresence>
          {selectedDay && selectedStaff && (
            <ShiftTimeline
              date={selectedDay}
              year={getCalendarData(selectedStaff.id).year}
              month={getCalendarData(selectedStaff.id).month}
              shifts={getDayShifts(selectedDay, selectedStaff.id)}
              onClose={closeDayView}
            />
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  )
}

export default Monitoring
