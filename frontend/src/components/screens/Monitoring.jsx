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
  Store,
  LayoutGrid,
  Table,
} from 'lucide-react'
import ShiftTimeline from '../shared/ShiftTimeline'
import StaffTimeTable from '../shared/StaffTimeTable'
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
  initialMonth, // ShiftManagementから渡される月情報 { year, month }
  initialStoreId, // 店舗IDを受け取る
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
  const [storeList, setStoreList] = useState([])
  const [selectedStoreId, setSelectedStoreId] = useState(initialStoreId || null)
  const [viewMode, setViewMode] = useState('staff') // 'staff' | 'calendar'
  const [calendarShiftData, setCalendarShiftData] = useState([]) // カレンダー表示用のシフトデータ

  const currentDate = useMemo(() => new Date(), [])
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  // 履歴表示用の年月
  const [historyYear, setHistoryYear] = useState(initialMonth?.year || currentYear)
  const [historyMonth, setHistoryMonth] = useState(initialMonth?.month || null) // null = 全月表示

  // initialMonthが渡された場合は年月を設定
  useEffect(() => {
    if (initialMonth) {
      setHistoryYear(initialMonth.year)
      setHistoryMonth(initialMonth.month)
    }
  }, [initialMonth])

  // initialStoreIdが渡された場合は店舗を設定
  useEffect(() => {
    if (initialStoreId) {
      setSelectedStoreId(initialStoreId)
    }
  }, [initialStoreId])

  useEffect(() => {
    loadStoreList()
  }, [tenantId])

  useEffect(() => {
    loadAvailabilityData()
  }, [historyYear, historyMonth, selectedStoreId, tenantId])

  const loadStoreList = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/master/stores?tenant_id=${tenantId}`)
      const result = await response.json()

      if (result.success) {
        setStoreList(result.data)
      }
    } catch (error) {
      console.error('店舗リスト読み込みエラー:', error)
    }
  }

  const loadAvailabilityData = async () => {
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

      // 選択した年月のデータを取得
      const preferencesUrl = historyMonth
        ? `${apiUrl}/api/shifts/preferences?tenant_id=${tenantId}&year=${historyYear}&month=${historyMonth}`
        : `${apiUrl}/api/shifts/preferences?tenant_id=${tenantId}&year=${historyYear}`

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

      // スタッフを店舗でフィルタリング
      const filteredStaffData = selectedStoreId
        ? staffData.filter(staff => parseInt(staff.store_id) === parseInt(selectedStoreId))
        : staffData

      // スタッフごとに集計
      const staffMap = {}
      filteredStaffData.forEach(staff => {
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

      // StaffTimeTable用のシフトデータを準備（希望データをシフトとして表示）
      const calendarShifts = []
      availData.forEach(req => {
        if (req.submitted_at && req.preferred_days) {
          // preferred_daysをパース
          const preferredDays = req.preferred_days.split(',')
          preferredDays.forEach(dateStr => {
            const date = new Date(dateStr.trim())
            if (!isNaN(date.getTime()) && date.getFullYear() === historyYear && date.getMonth() + 1 === historyMonth) {
              const staffInfo = staffMapping[req.staff_id]
              if (staffInfo && (!selectedStoreId || parseInt(staffInfo.store_id) === parseInt(selectedStoreId))) {
                calendarShifts.push({
                  shift_date: dateStr.trim(),
                  staff_id: req.staff_id,
                  staff_name: staffInfo.name,
                  start_time: '09:00', // 希望シフトは時刻未定なので仮の値
                  end_time: '18:00',
                  role: rolesMapping[staffInfo.role_id] || 'スタッフ',
                  is_preference: true,
                })
              }
            }
          })
        }

        // ng_daysもパース（休み希望として表示）
        if (req.submitted_at && req.ng_days) {
          const ngDays = req.ng_days.split(',')
          ngDays.forEach(dateStr => {
            const date = new Date(dateStr.trim())
            if (!isNaN(date.getTime()) && date.getFullYear() === historyYear && date.getMonth() + 1 === historyMonth) {
              const staffInfo = staffMapping[req.staff_id]
              if (staffInfo && (!selectedStoreId || parseInt(staffInfo.store_id) === parseInt(selectedStoreId))) {
                calendarShifts.push({
                  shift_date: dateStr.trim(),
                  staff_id: req.staff_id,
                  staff_name: staffInfo.name,
                  start_time: '00:00', // NG日は休みとして表示
                  end_time: '00:00',
                  role: rolesMapping[staffInfo.role_id] || 'スタッフ',
                  is_ng_day: true,
                })
              }
            }
          })
        }
      })

      setCalendarShiftData(calendarShifts)
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const submittedCount = staffStatus.filter(s => s.submitted).length
  const totalCount = staffStatus.length
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
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="app-container pt-8"
    >
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            シフト希望提出状況
          </h1>
          <p className="text-lg text-gray-600">スタッフのシフト希望提出状況を確認</p>
        </div>

        {/* 年月選択 */}
        {(
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
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 月フィルター */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <Button
                  key={month}
                  variant={historyMonth === month ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryMonth(month)}
                >
                  {month}月
                </Button>
              ))}
            </div>

            {/* 店舗フィルター */}
            {storeList.length > 0 && (
              <div className="flex items-center justify-center gap-3 mb-8">
                <Store className="h-4 w-4 text-gray-600" />
                <select
                  value={selectedStoreId || ''}
                  onChange={(e) => setSelectedStoreId(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">すべての店舗</option>
                  {storeList.map(store => (
                    <option key={store.store_id} value={store.store_id}>
                      {store.store_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {/* 提出状況サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-900">提出率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{submissionRate}%</div>
              <p className="text-xs text-blue-700 mt-2">
                {submittedCount}/{totalCount}名が提出済み
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                提出済み
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{submittedCount}名</div>
              <p className="text-xs text-green-700 mt-2">シフト希望を提出済み</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                未提出
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">{totalCount - submittedCount}名</div>
              <p className="text-xs text-red-700 mt-2">まだ提出していない</p>
            </CardContent>
          </Card>
        </div>

        {/* ビュー切り替えボタン */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={viewMode === 'staff' ? 'default' : 'outline'}
            onClick={() => setViewMode('staff')}
            className={viewMode === 'staff' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            スタッフ別表示
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            className={viewMode === 'calendar' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            <Table className="h-4 w-4 mr-2" />
            カレンダー表示
          </Button>
        </div>

        {viewMode === 'calendar' ? (
          /* カレンダー表示 */
          <Card className="shadow-lg border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                シフト希望カレンダー
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calendarShiftData.length > 0 ? (
                <StaffTimeTable
                  year={historyYear}
                  month={historyMonth}
                  shiftData={calendarShiftData}
                  staffMap={Object.fromEntries(
                    Object.entries(staffMap).filter(([id, info]) => {
                      return !selectedStoreId || parseInt(info.store_id) === parseInt(selectedStoreId)
                    })
                  )}
                  onCellClick={(date, staffId, shift) => {
                    // 日付クリック時の処理（必要に応じて実装）
                    if (shift) {
                      handleDayClick(date)
                    }
                  }}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>提出されたシフト希望がありません</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* スタッフ一覧 */
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  スタッフ提出状況
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffStatus.map(staff => (
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
        )}

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
  )
}

export default Monitoring
