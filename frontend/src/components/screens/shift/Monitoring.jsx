import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Calendar,
  Store,
  Home,
} from 'lucide-react'
import ShiftTimeline from '../../shared/ShiftTimeline'
import { AnimatePresence } from 'framer-motion'
import { useTenant } from '../../../contexts/TenantContext'
import { isoToJSTDateString, isoToJSTDateParts } from '../../../utils/dateUtils'
import { ShiftRepository } from '../../../infrastructure/repositories/ShiftRepository'
import { useShiftStatus } from '../../../hooks/useShiftStatus'

const shiftRepository = new ShiftRepository()

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

const Monitoring = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { tenantId } = useTenant()

  // React Routerから渡されたstateを取得
  const shift = location.state?.shift

  // ダッシュボードへ遷移（年月情報を保持）
  const handleDashboard = () => {
    navigate('/', {
      state: {
        year: shift?.year,
        month: shift?.month,
      },
    })
  }

  // shiftオブジェクトから年月と店舗IDを抽出
  const initialMonth =
    shift?.year && shift?.month
      ? {
          year: parseInt(shift.year),
          month: parseInt(shift.month),
        }
      : null
  // store_id と storeId の両方に対応
  const initialStoreId = shift?.store_id
    ? parseInt(shift.store_id)
    : shift?.storeId
      ? parseInt(shift.storeId)
      : null

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
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('PART_TIME') // 'all' | 'PART_TIME' | 'FULL_TIME' | etc. - デフォルトアルバイト
  const [viewMode, setViewMode] = useState('staff') // 'staff' | 'calendar'
  const [calendarShiftData, setCalendarShiftData] = useState([]) // カレンダー表示用のシフトデータ
  const [monthlyComments, setMonthlyComments] = useState([]) // 月次コメント

  const currentDate = useMemo(() => new Date(), [])
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  // コメントをMapに変換（O(1)検索用）
  const commentsMap = useMemo(() => {
    const map = new Map()
    monthlyComments.forEach(item => {
      map.set(item.staff_id, item.comment)
    })
    return map
  }, [monthlyComments])

  // 履歴表示用の年月
  const [historyYear, setHistoryYear] = useState(initialMonth?.year || currentYear)
  const [historyMonth, setHistoryMonth] = useState(initialMonth?.month || null) // null = 全月表示

  // 募集ステータス用フック
  const { recruitmentStatus } = useShiftStatus(historyYear, historyMonth, tenantId)

  // initialMonthを適用したかどうかを追跡
  const isInitializedRef = useRef(false)

  // initialMonthが渡された場合は年月を設定（一度だけ）
  useEffect(() => {
    if (initialMonth && !isInitializedRef.current) {
      setHistoryYear(initialMonth.year)
      setHistoryMonth(initialMonth.month)
      isInitializedRef.current = true
    }
  }, [initialMonth])

  // initialStoreIdを適用したかどうかを追跡
  const isStoreInitializedRef = useRef(false)

  // initialStoreIdが渡された場合は店舗を設定（一度だけ）
  useEffect(() => {
    if (initialStoreId && !isStoreInitializedRef.current) {
      setSelectedStoreId(initialStoreId)
      isStoreInitializedRef.current = true
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

      // ★変更: 新API形式（date_from, date_to）に対応
      // 選択した年月のデータを取得
      let dateFrom, dateTo
      if (historyMonth) {
        dateFrom = `${historyYear}-${String(historyMonth).padStart(2, '0')}-01`
        const lastDay = new Date(historyYear, historyMonth, 0).getDate()
        dateTo = `${historyYear}-${String(historyMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      } else {
        // 年のみ指定の場合は1年分
        dateFrom = `${historyYear}-01-01`
        dateTo = `${historyYear}-12-31`
      }
      const preferencesUrl = `${apiUrl}/api/shifts/preferences?tenant_id=${tenantId}&date_from=${dateFrom}&date_to=${dateTo}`

      const [staffResponse, rolesResponse, patternsResponse, preferencesResponse] =
        await Promise.all([
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

      // 月次コメント取得（月が指定されている場合のみ）
      if (historyMonth) {
        try {
          const comments = await shiftRepository.getMonthlyComments({
            year: historyYear,
            month: historyMonth,
            storeId: selectedStoreId,
          })
          setMonthlyComments(comments)
        } catch (error) {
          console.error('月次コメント取得エラー:', error)
          setMonthlyComments([])
        }
      } else {
        setMonthlyComments([])
      }

      // スタッフを店舗でフィルタリング
      const filteredStaffData = selectedStoreId
        ? staffData.filter(staff => {
            const match = parseInt(staff.store_id) === parseInt(selectedStoreId)
            return match
          })
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
          is_active: staff.is_active,
          store_id: staff.store_id,
          employment_type: staff.employment_type,
        }
      })

      // ★変更: 新API形式（1日1レコード）での提出状況集計
      // created_atまたはupdated_atを提出日時として使用
      const submittedStaffIds = new Set()
      availData.forEach(req => {
        // 1日1レコード形式なので、レコードがあれば提出済み
        const submittedAt = req.updated_at || req.created_at
        if (submittedAt) {
          submittedStaffIds.add(req.staff_id.toString())

          if (staffMap[req.staff_id]) {
            const date = new Date(submittedAt)
            const formatted = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
            if (
              !staffMap[req.staff_id].submittedAt ||
              new Date(submittedAt) > new Date(staffMap[req.staff_id].rawSubmittedAt || 0)
            ) {
              staffMap[req.staff_id].submittedAt = formatted
              staffMap[req.staff_id].rawSubmittedAt = submittedAt
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
      setStaffStatus(staffStatusArray)
      setAvailabilityRequests(availData)

      // ★変更: 新API形式（1日1レコード）でのカレンダーシフトデータ準備
      const calendarShifts = []
      availData.forEach(req => {
        // preference_dateからJSTの日付を取得
        const {
          year: prefYear,
          month: prefMonth,
          day: prefDay,
        } = isoToJSTDateParts(req.preference_date)
        const dateStr = isoToJSTDateString(req.preference_date)

        if (
          prefYear > 0 &&
          prefYear === historyYear &&
          (!historyMonth || prefMonth === historyMonth)
        ) {
          const staffInfo = staffMapping[req.staff_id]
          if (
            staffInfo &&
            (!selectedStoreId || parseInt(staffInfo.store_id) === parseInt(selectedStoreId))
          ) {
            if (req.is_ng) {
              // NG日（休み希望）
              calendarShifts.push({
                shift_date: dateStr,
                staff_id: req.staff_id,
                staff_name: staffInfo.name,
                start_time: '00:00',
                end_time: '00:00',
                role: rolesMapping[staffInfo.role_id] || 'スタッフ',
                is_ng_day: true,
              })
            } else {
              // 勤務希望日
              calendarShifts.push({
                shift_date: dateStr,
                staff_id: req.staff_id,
                staff_name: staffInfo.name,
                start_time: req.start_time || '09:00',
                end_time: req.end_time || '18:00',
                role: rolesMapping[staffInfo.role_id] || 'スタッフ',
                is_preference: true,
              })
            }
          }
        }
      })

      setCalendarShiftData(calendarShifts)
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // アルバイト（PART_TIME）かどうかを判定するヘルパー関数
  const isPartTimeStaff = staff =>
    staff.employment_type === 'PART_TIME' || staff.employment_type === 'PART'

  // 雇用形態の表示名を取得
  const getEmploymentTypeLabel = employmentType => {
    switch (employmentType) {
      case 'PART_TIME':
      case 'PART':
        return 'アルバイト'
      case 'FULL_TIME':
      case 'REGULAR':
        return '正社員'
      case 'CONTRACT':
        return '契約社員'
      default:
        return employmentType || '不明'
    }
  }

  // 集計はアルバイトかつ在籍者のみを対象とする
  const activePartTimeStaff = staffStatus.filter(s => isPartTimeStaff(s) && s.is_active !== false)
  const submittedCount = activePartTimeStaff.filter(s => s.submitted).length
  const totalCount = activePartTimeStaff.length
  const submissionRate = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0

  // 契約タイプでフィルタリングしたスタッフ一覧（退会者は除外）
  const filteredStaffStatus = useMemo(() => {
    // まず退会者を除外
    const activeStaff = staffStatus.filter(staff => staff.is_active !== false)

    if (selectedEmploymentType === 'all') {
      return activeStaff
    }
    return activeStaff.filter(staff => {
      // PART と PART_TIME を同一視
      if (selectedEmploymentType === 'PART_TIME') {
        return staff.employment_type === 'PART_TIME' || staff.employment_type === 'PART'
      }
      // FULL_TIME と REGULAR を同一視
      if (selectedEmploymentType === 'FULL_TIME') {
        return staff.employment_type === 'FULL_TIME' || staff.employment_type === 'REGULAR'
      }
      return staff.employment_type === selectedEmploymentType
    })
  }, [staffStatus, selectedEmploymentType])

  const handleStaffClick = staff => {
    setSelectedStaff(staff)
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

  // ★変更: 新API形式（1日1レコード）でのShiftTimeline用データ準備
  const getDayShifts = (day, staffId) => {
    // availabilityRequestsから該当スタッフ・該当日のデータを検索
    const targetDate = `${historyYear}-${String(historyMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    const preference = availabilityRequests.find(req => {
      // UTCの日付文字列をJST日付として正しく取得
      const jstDate = isoToJSTDateString(req.preference_date)
      return parseInt(req.staff_id) === parseInt(staffId) && jstDate === targetDate
    })

    if (!preference) {
      return []
    }

    // NG日の場合は空配列を返す（シフトバーを表示しない）
    if (preference.is_ng) {
      return []
    }

    const staff = staffMap[staffId]
    const roleName = staff ? rolesMap[staff.role_id] : '一般スタッフ'

    // 出勤希望シフトを表示用に変換（時間指定がある場合のみ）
    if (!preference.start_time || !preference.end_time) {
      return []
    }

    return [
      {
        shift_id: `pref-${preference.preference_id}-${day}`,
        staff_name: staff?.name || 'スタッフ',
        role: roleName,
        start_time: preference.start_time,
        end_time: preference.end_time,
        modified_flag: false,
        is_preference: true,
        is_ng_day: false,
      },
    ]
  }

  // ★変更: 新API形式（1日1レコード）でのカレンダー表示用データ準備
  const getCalendarData = staffId => {
    // スタッフの全希望をフィルタ
    const staffPreferences = availabilityRequests.filter(
      req => parseInt(req.staff_id) === parseInt(staffId)
    )

    const preferredDaysSet = new Set()
    const ngDaysSet = new Set()

    // 各レコードからpreference_dateを抽出（JSTで正しく解釈）
    staffPreferences.forEach(pref => {
      const { year: prefYear, month: prefMonth, day } = isoToJSTDateParts(pref.preference_date)

      if (day > 0) {
        // 現在表示中の年月と一致する場合のみ追加
        if (prefYear === historyYear && prefMonth === historyMonth) {
          if (pref.is_ng) {
            ngDaysSet.add(day)
          } else {
            preferredDaysSet.add(day)
          }
        }
      }
    })

    const year = historyYear
    const month = historyMonth
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDay = new Date(year, month - 1, 1).getDay()

    return {
      preferredDaysSet,
      ngDaysSet,
      daysInMonth,
      firstDay,
      year,
      month,
      preferences: staffPreferences,
    }
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
      className="h-screen flex flex-col pt-16 overflow-hidden"
    >
      {/* ヘッダーエリア */}
      <div className="flex-shrink-0 px-8 py-4 mb-4 bg-white border-b border-gray-200">
        {/* 1行目: ダッシュボードボタン + タイトル */}
        <div className="flex items-center gap-4 mb-3">
          <Button variant="outline" size="sm" onClick={handleDashboard}>
            <Home className="h-4 w-4 mr-1" />
            ダッシュボード
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">シフト希望提出状況</h1>
            <p className="text-base text-gray-600 mt-1">
              スタッフのシフト希望提出状況を確認できます
            </p>
          </div>
        </div>

        {/* 2行目: 対象年月・店舗 */}
        <div className="flex items-center gap-6 mb-2">
          {/* 年月選択 */}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setHistoryYear(historyYear - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-2xl font-bold text-gray-900">{historyYear}年</div>
              <Button variant="outline" size="sm" onClick={() => setHistoryYear(historyYear + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <Button
                  key={month}
                  variant={historyMonth === month ? 'default' : 'outline'}
                  size="sm"
                  className={
                    historyMonth === month
                      ? 'bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1.5 font-semibold'
                      : 'text-sm px-3 py-1.5'
                  }
                  onClick={() => {
                    setHistoryMonth(month)
                  }}
                >
                  {month}月
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 3行目: 店舗選択 + 契約タイプフィルター */}
        <div className="flex items-center gap-6">
          {storeList.length > 0 && (
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-purple-600" />
              <label className="text-base font-semibold text-gray-700">対象店舗:</label>
              <select
                value={selectedStoreId || ''}
                onChange={e => {
                  const newStoreId = e.target.value ? parseInt(e.target.value) : null
                  setSelectedStoreId(newStoreId)
                }}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg text-base font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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

          {/* 契約タイプフィルター */}
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            <label className="text-base font-semibold text-gray-700">契約タイプ:</label>
            <select
              value={selectedEmploymentType}
              onChange={e => setSelectedEmploymentType(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="PART_TIME">アルバイト</option>
              <option value="FULL_TIME">正社員</option>
              <option value="CONTRACT">契約社員</option>
            </select>
          </div>
        </div>
      </div>

      {/* 提出状況サマリー - 固定 */}
      <div className="flex-shrink-0 px-8 mb-4">
        <div className="flex gap-4">
          {/* 募集状況カード */}
          <div
            className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-br rounded-xl border-2 shadow-sm ${recruitmentStatus.bgColor} ${recruitmentStatus.borderColor}`}
          >
            <Clock
              className={`h-6 w-6 ${
                recruitmentStatus.color === 'green'
                  ? 'text-green-600'
                  : recruitmentStatus.color === 'orange'
                    ? 'text-orange-600'
                    : recruitmentStatus.color === 'slate'
                      ? 'text-slate-500'
                      : 'text-gray-600'
              }`}
            />
            <div>
              <div
                className={`text-xs font-semibold mb-0.5 ${
                  recruitmentStatus.color === 'green'
                    ? 'text-green-700'
                    : recruitmentStatus.color === 'orange'
                      ? 'text-orange-700'
                      : recruitmentStatus.color === 'slate'
                        ? 'text-slate-600'
                        : 'text-gray-700'
                }`}
              >
                シフト募集状況
              </div>
              <div
                className={`text-xl font-bold ${
                  recruitmentStatus.color === 'green'
                    ? 'text-green-600'
                    : recruitmentStatus.color === 'orange'
                      ? 'text-orange-600'
                      : recruitmentStatus.color === 'slate'
                        ? 'text-slate-500'
                        : 'text-gray-600'
                }`}
              >
                {recruitmentStatus.statusLabel}
              </div>
              <div
                className={`text-xs mt-0.5 ${
                  recruitmentStatus.color === 'green'
                    ? 'text-green-600'
                    : recruitmentStatus.color === 'orange'
                      ? 'text-orange-600'
                      : recruitmentStatus.color === 'slate'
                        ? 'text-slate-500'
                        : 'text-gray-600'
                }`}
              >
                {historyMonth
                  ? `${historyYear}年${historyMonth}月分 - ${recruitmentStatus.deadline}`
                  : `${historyYear}年分`}
              </div>
            </div>
          </div>

          {/* 提出率カード */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 shadow-sm">
            <div>
              <div className="text-xs text-blue-700 font-semibold mb-0.5">提出率</div>
              <div className="text-2xl font-bold text-blue-600">{submissionRate}%</div>
            </div>
            <div className="text-sm text-blue-600 font-medium">
              {submittedCount}/{totalCount}名
            </div>
          </div>

          {/* 提出済みカード */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 shadow-sm">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <div className="text-xs text-green-700 font-semibold mb-0.5">提出済み</div>
              <div className="text-2xl font-bold text-green-600">{submittedCount}名</div>
            </div>
          </div>

          {/* 未提出カード */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200 shadow-sm">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <div className="text-xs text-red-700 font-semibold mb-0.5">未提出</div>
              <div className="text-2xl font-bold text-red-600">{totalCount - submittedCount}名</div>
            </div>
          </div>
        </div>
      </div>

      {/* スタッフ一覧 - スクロール可能 */}
      <Card className="shadow-lg border-0 flex-1 flex flex-col overflow-hidden mx-8 mb-4">
        <CardHeader className="flex-shrink-0 py-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-purple-600" />
              スタッフ提出状況
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-1">
            {filteredStaffStatus.map(staff => (
              <motion.div
                key={staff.id}
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  staff.submitted
                    ? 'bg-green-50 hover:bg-green-100 border-l-4 border-green-500'
                    : 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500'
                }`}
                whileHover={{ scale: 1.005 }}
                onClick={() => handleStaffClick(staff)}
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <p
                      className={`text-sm font-medium ${staff.submitted ? 'text-green-800' : 'text-red-800'}`}
                    >
                      {staff.name}
                      <span className="text-xs ml-2 px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                        {getEmploymentTypeLabel(staff.employment_type)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  {staff.submitted ? (
                    <div className="flex items-center text-green-700 text-xs">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      <span>{staff.submittedAt}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-700 text-xs font-medium">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      <span>未提出</span>
                    </div>
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
            className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="border-b bg-gray-50 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedStaff.name}の希望シフト
                    <span
                      className={`text-sm ml-3 px-2 py-1 rounded ${
                        isPartTimeStaff(selectedStaff)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {getEmploymentTypeLabel(selectedStaff.employment_type)}
                    </span>
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedStaff.submittedAt
                      ? `提出日時: ${selectedStaff.submittedAt}`
                      : '未提出'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={closeModal}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* コメント欄（一番上に配置） */}
              <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💬</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-800 mb-1">スタッフからのコメント:</p>
                    {commentsMap.has(selectedStaff.id) ? (
                      <p className="text-sm text-amber-900 whitespace-pre-wrap">
                        {commentsMap.get(selectedStaff.id)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">コメントはありません</p>
                    )}
                  </div>
                </div>
              </div>

              {(() => {
                const {
                  preferredDaysSet,
                  ngDaysSet,
                  daysInMonth,
                  firstDay,
                  year,
                  month,
                  preferences,
                } = getCalendarData(selectedStaff.id)
                const weekDays = ['日', '月', '火', '水', '木', '金', '土']

                // 希望データが全くない場合
                if (preferredDaysSet.size === 0 && ngDaysSet.size === 0) {
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
                  console.error(
                    'Staff not found in staffMap:',
                    selectedStaff.id,
                    'staffMap keys:',
                    Object.keys(staffMap)
                  )
                }

                const isPartTimeStaff =
                  currentStaff?.employment_type === 'PART_TIME' ||
                  currentStaff?.employment_type === 'PART'
                const hasNgDays = ngDaysSet.size > 0
                const hasPreferredDays = preferredDaysSet.size > 0

                return (
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      {year}年{month}月のシフト希望
                    </h3>

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
                        const isNg = ngDaysSet.has(day)
                        const hasData = isPreferred || isNg

                        return (
                          <motion.div
                            key={day}
                            className={`p-2 border-2 rounded-lg min-h-[100px] ${
                              isNg
                                ? 'bg-red-50 border-red-300 cursor-pointer hover:bg-red-100'
                                : isPreferred
                                  ? 'bg-green-50 border-green-300 cursor-pointer hover:bg-green-100'
                                  : 'bg-gray-50 border-gray-200'
                            } ${isWeekend && !hasData ? 'bg-blue-50' : ''}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.01 }}
                            onClick={() => hasData && handleDayClick(day)}
                          >
                            <div
                              className={`text-sm font-bold mb-1 ${
                                isWeekend ? 'text-blue-600' : 'text-gray-700'
                              }`}
                            >
                              {day}
                            </div>
                            {isNg && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-red-700">✕ NG</div>
                              </div>
                            )}
                            {isPreferred && (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-green-700">◯ 出勤希望</div>
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* 凡例 */}
                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 rounded bg-green-50 border-green-300"></div>
                        <span>出勤希望</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 rounded bg-red-50 border-red-300"></div>
                        <span>NG</span>
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
