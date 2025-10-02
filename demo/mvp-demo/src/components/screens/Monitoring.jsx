import { useState, useEffect } from 'react'
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
  ArrowRight,
  Loader2,
  X,
  Calendar
} from 'lucide-react'
import Papa from 'papaparse'
import ShiftTimeline from '../shared/ShiftTimeline'
import { AnimatePresence } from 'framer-motion'

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

const Monitoring = ({ onNext, onPrev }) => {
  const [staffStatus, setStaffStatus] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [availabilityRequests, setAvailabilityRequests] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [staffMap, setStaffMap] = useState({})
  const [rolesMap, setRolesMap] = useState({})
  const [shiftPatternsMap, setShiftPatternsMap] = useState({})

  useEffect(() => {
    loadAvailabilityData()
  }, [])

  const loadAvailabilityData = async () => {
    setLoading(true)
    try {
      // staff.csvを読み込み
      const staffResponse = await fetch('/data/master/staff.csv')
      const staffText = await staffResponse.text()
      const staffParsed = Papa.parse(staffText, { header: true, skipEmptyLines: true })

      // 役職マスターデータを読み込み
      const rolesResponse = await fetch('/data/master/roles.csv')
      const rolesText = await rolesResponse.text()
      const rolesResult = await new Promise((resolve) => {
        Papa.parse(rolesText, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: resolve
        })
      })

      // スタッフマップと役職マップを作成
      const staffMapping = {}
      staffParsed.data.forEach(staff => {
        staffMapping[staff.staff_id] = staff
      })
      setStaffMap(staffMapping)

      const rolesMapping = {}
      rolesResult.data.forEach(role => {
        rolesMapping[role.role_id] = role.role_name
      })
      setRolesMap(rolesMapping)

      // シフトパターンマスターデータを読み込み
      const patternsResponse = await fetch('/data/master/shift_patterns.csv')
      const patternsText = await patternsResponse.text()
      const patternsResult = await new Promise((resolve) => {
        Papa.parse(patternsText, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: resolve
        })
      })

      const patternsMapping = {}
      patternsResult.data.forEach(pattern => {
        patternsMapping[pattern.pattern_code] = {
          name: pattern.pattern_name,
          start_time: pattern.start_time,
          end_time: pattern.end_time,
          break_minutes: parseInt(pattern.break_minutes || 0)
        }
      })
      setShiftPatternsMap(patternsMapping)

      // availability_requests.csvを読み込み
      const availResponse = await fetch('/data/transactions/availability_requests.csv')
      const availText = await availResponse.text()
      const availParsed = Papa.parse(availText, { header: true, skipEmptyLines: true })

      // スタッフごとに集計
      const staffMap = {}
      staffParsed.data.forEach(staff => {
        staffMap[staff.staff_id] = {
          id: parseInt(staff.staff_id),
          name: staff.name,
          submitted: false,
          submittedAt: null,
          lastReminder: null
        }
      })

      // 提出状況を集計（submitted_atがあるstaff_idのみを提出済みとする）
      const submittedStaffIds = new Set()
      availParsed.data.forEach(req => {
        if (req.submitted_at && req.submitted_at.trim()) {
          submittedStaffIds.add(req.staff_id)

          if (staffMap[req.staff_id]) {
            const date = new Date(req.submitted_at)
            const formatted = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
            if (!staffMap[req.staff_id].submittedAt || new Date(req.submitted_at) > new Date(staffMap[req.staff_id].submittedAt)) {
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

      setStaffStatus(Object.values(staffMap))
      setAvailabilityRequests(availParsed.data)
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const submittedCount = staffStatus.filter(s => s.submitted).length
  const totalCount = staffStatus.length
  const submissionRate = Math.round((submittedCount / totalCount) * 100)

  const sendReminder = (staffId) => {
    setStaffStatus(prev => prev.map(staff =>
      staff.id === staffId
        ? { ...staff, lastReminder: new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
        : staff
    ))
  }

  const handleStaffClick = (staff) => {
    if (staff.submitted) {
      setSelectedStaff(staff)
    }
  }

  const closeModal = () => {
    setSelectedStaff(null)
  }

  const getStaffRequests = (staffId) => {
    return availabilityRequests.filter(req => req.staff_id === String(staffId))
      .sort((a, b) => new Date(a.request_date) - new Date(b.request_date))
  }

  // カレンダー表示用のデータ準備
  const getCalendarData = (staffId) => {
    const requests = getStaffRequests(staffId)
    const requestMap = {}

    requests.forEach(req => {
      const date = new Date(req.request_date)
      const day = date.getDate()
      requestMap[day] = req
    })

    // 2024年10月のカレンダー情報
    const year = 2024
    const month = 10
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDay = new Date(year, month - 1, 1).getDay()

    return { requestMap, daysInMonth, firstDay }
  }

  const handleDayClick = (day) => {
    setSelectedDay(day)
  }

  const closeDayView = () => {
    setSelectedDay(null)
  }

  // ShiftTimeline用のデータを準備
  const getDayShifts = (day) => {
    if (!selectedStaff) return []

    const req = getStaffRequests(selectedStaff.id).find(r => {
      const date = new Date(r.request_date)
      return date.getDate() === day
    })

    if (!req || req.availability !== 'available' || !req.preferred_pattern) return []

    const staff = staffMap[selectedStaff.id]
    const roleName = staff ? rolesMap[staff.role_id] : '一般スタッフ'
    const pattern = shiftPatternsMap[req.preferred_pattern]

    if (!pattern) return []

    return [{
      shift_id: req.request_id,
      staff_name: selectedStaff.name,
      role: roleName,
      start_time: pattern.start_time,
      end_time: pattern.end_time,
      actual_hours: calculateHours(pattern.start_time, pattern.end_time),
      planned_hours: calculateHours(pattern.start_time, pattern.end_time),
      modified_flag: false
    }]
  }

  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    return ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60
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
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          希望回収モニタリング
        </h1>
        <p className="text-lg text-gray-600">スタッフの希望提出状況を監視</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">提出率</p>
                <p className="text-3xl font-bold text-blue-600">{submissionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">提出済み</p>
                <p className="text-3xl font-bold text-green-600">{submittedCount}名</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">未提出</p>
                <p className="text-3xl font-bold text-red-600">{totalCount - submittedCount}名</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* スタッフ一覧 */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-purple-600" />
            スタッフ提出状況
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
                  <div className={`w-3 h-3 rounded-full ${
                    staff.submitted ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className={`font-medium ${staff.submitted ? 'text-blue-600' : ''}`}>
                      {staff.name}
                      {staff.submitted && <span className="text-xs ml-2 text-gray-500">(クリックで詳細)</span>}
                    </p>
                    <p className="text-sm text-gray-600">
                      {staff.submitted
                        ? `提出済み: ${staff.submittedAt}`
                        : `最終催促: ${staff.lastReminder}`
                      }
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => sendReminder(staff.id)}
                      >
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

      {/* 一括操作 */}
      <Card className="shadow-lg border-0 mt-8">
        <CardHeader>
          <CardTitle>一括操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button variant="outline" className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              未提出者に一括催促
            </Button>
            <Button variant="outline" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              締切延長通知
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 希望シフト詳細モーダル */}
      {selectedStaff && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="border-b bg-gray-50 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedStaff.name}の希望シフト</h2>
                  <p className="text-sm text-gray-600 mt-1">提出日時: {selectedStaff.submittedAt}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const { requestMap, daysInMonth, firstDay } = getCalendarData(selectedStaff.id)
                const weekDays = ['日', '月', '火', '水', '木', '金', '土']

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

                return (
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      2024年10月の希望シフト
                    </h3>

                    {/* 曜日ヘッダー */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {weekDays.map(day => (
                        <div key={day} className="p-2 text-center text-sm font-bold bg-gray-100 rounded">
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

                        const req = requestMap[day]
                        const dayOfWeek = (firstDay + day - 1) % 7
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                        const isAvailable = req?.availability === 'available'
                        const hasRequest = !!req

                        return (
                          <motion.div
                            key={day}
                            className={`p-2 border-2 rounded-lg min-h-[100px] ${
                              !hasRequest
                                ? 'bg-gray-50 border-gray-200'
                                : isAvailable
                                ? 'bg-green-50 border-green-300 cursor-pointer hover:bg-green-100'
                                : 'bg-red-50 border-red-300'
                            } ${isWeekend && !hasRequest ? 'bg-blue-50' : ''}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.01 }}
                            onClick={() => isAvailable && handleDayClick(day)}
                          >
                            <div className={`text-sm font-bold mb-1 ${
                              isWeekend ? 'text-blue-600' : 'text-gray-700'
                            }`}>
                              {day}
                            </div>
                            {hasRequest && (
                              <div className="space-y-1">
                                {isAvailable ? (
                                  <>
                                    <div className="text-xs font-bold text-green-700">
                                      ◯ {shiftPatternsMap[req.preferred_pattern]?.name || '出勤可'}
                                    </div>
                                    <div className="text-xs text-green-600">
                                      {shiftPatternsMap[req.preferred_pattern]?.start_time}-{shiftPatternsMap[req.preferred_pattern]?.end_time}
                                    </div>
                                    {req.comments && (
                                      <div className="text-xs text-gray-700 bg-white bg-opacity-50 p-1 rounded">
                                        {req.comments}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-xs font-bold text-red-700">
                                    ✕ 出勤不可
                                  </div>
                                )}
                              </div>
                            )}
                            {!hasRequest && (
                              <div className="text-xs text-gray-400">未提出</div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* 凡例 */}
                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
                        <span>出勤可能</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-50 border-2 border-red-300 rounded"></div>
                        <span>出勤不可</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded"></div>
                        <span>未提出</span>
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
            year={2024}
            month={10}
            shifts={getDayShifts(selectedDay)}
            onClose={closeDayView}
          />
        )}
      </AnimatePresence>

    </motion.div>
  )
}

export default Monitoring
