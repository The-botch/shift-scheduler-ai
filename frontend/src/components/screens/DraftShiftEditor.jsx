import { useState, useEffect } from 'react'
import { MESSAGES } from '../../constants/messages'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { ArrowLeft, CheckCircle, Loader2, Save } from 'lucide-react'
import ShiftCalendar from '../shared/ShiftCalendar'
import ShiftTimeline from '../shared/ShiftTimeline'
import { ShiftRepository } from '../../infrastructure/repositories/ShiftRepository'
import { MasterRepository } from '../../infrastructure/repositories/MasterRepository'

const shiftRepository = new ShiftRepository()
const masterRepository = new MasterRepository()

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

/**
 * 下書きシフト編集画面
 * - 既存の下書きシフトをカレンダー表示
 * - 日付クリックで詳細表示・編集
 * - 第1案承認ボタン
 * - 第2案作成ボタン（第1案承認済みの場合のみ）
 */
const DraftShiftEditor = ({ selectedShift, onBack, onApprove, onCreateSecondPlan }) => {
  const [loading, setLoading] = useState(true)
  const [calendarData, setCalendarData] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayShifts, setDayShifts] = useState([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // ローカルで保持する変更
  const [modifiedShifts, setModifiedShifts] = useState({}) // { shiftId: { start_time, end_time, ... } }
  const [deletedShiftIds, setDeletedShiftIds] = useState(new Set())

  const year = selectedShift?.year || new Date().getFullYear()
  const month = selectedShift?.month || new Date().getMonth() + 1
  const planId = selectedShift?.planId || selectedShift?.plan_id

  useEffect(() => {
    if (planId) {
      loadShiftData()
    }
  }, [planId])

  const loadShiftData = async () => {
    try {
      setLoading(true)

      // APIから並行読み込み
      const [shiftsResult, staffResult, rolesResult] = await Promise.all([
        shiftRepository.getShifts({ planId }),
        masterRepository.getStaff(),
        masterRepository.getRoles(),
      ])

      // 役職IDから役職名へのマッピング
      const rolesMap = {}
      rolesResult.forEach(role => {
        rolesMap[role.role_id] = role.role_name
      })

      // スタッフIDから名前・役職へのマッピング
      const staffMap = {}
      staffResult.forEach(staff => {
        staffMap[staff.staff_id] = {
          name: staff.name,
          role_id: staff.role_id,
          role_name: rolesMap[staff.role_id] || 'スタッフ',
        }
      })

      // 日付別にグループ化
      const shiftsByDate = {}
      shiftsResult.forEach(shift => {
        const date = new Date(shift.shift_date)
        const day = date.getDate()

        if (!shiftsByDate[day]) {
          shiftsByDate[day] = []
        }

        const staffInfo = staffMap[shift.staff_id] || { name: '不明', role_name: 'スタッフ' }
        shiftsByDate[day].push({
          ...shift,
          staff_name: staffInfo.name,
          role: staffInfo.role_name,
          modified_flag: false,
        })
      })

      // 月の情報を計算
      const date = new Date(year, month - 1, 1)
      const daysInMonth = new Date(year, month, 0).getDate()
      const firstDay = date.getDay()

      setCalendarData({
        daysInMonth,
        firstDay,
        shiftsByDate,
        year,
        month,
      })

      setLoading(false)
    } catch (err) {
      console.error('データ読み込みエラー:', err)
      setLoading(false)
      alert(MESSAGES.ERROR.SHIFT_DATA_LOAD_FAILED)
    }
  }

  const handleDayClick = day => {
    setSelectedDay(day)
    setDayShifts(calendarData.shiftsByDate[day] || [])
  }

  const closeDayView = () => {
    setSelectedDay(null)
    setDayShifts([])
  }

  const handleApprove = async () => {
    const isAlreadyApproved = selectedShift?.status === 'first_plan_approved'

    if (hasUnsavedChanges) {
      if (!confirm(isAlreadyApproved ? '変更を保存しますか？' : '未保存の変更をバックエンドに保存して承認します。よろしいですか？')) {
        return
      }
    } else if (!isAlreadyApproved) {
      if (!confirm('第1案を承認しますか？承認後は第2案の作成に進めます。')) {
        return
      }
    } else {
      // 承認済みで変更なしの場合は何もしない
      alert(MESSAGES.SUCCESS.NO_CHANGES)
      return
    }

    try {
      // 1. すべての変更をバックエンドに送信
      const updatePromises = []

      // 修正されたシフトを更新
      for (const [shiftId, updates] of Object.entries(modifiedShifts)) {
        updatePromises.push(shiftRepository.updateShift(Number(shiftId), updates))
      }

      // 削除されたシフトを削除
      for (const shiftId of deletedShiftIds) {
        updatePromises.push(shiftRepository.deleteShift(shiftId))
      }

      // すべての変更を並行実行
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises)
      }

      // 2. プランのステータスを更新（承認済みでない場合のみ）
      if (!isAlreadyApproved) {
        await shiftRepository.updatePlanStatus(planId, 'FIRST_PLAN_APPROVED')
      }

      // 3. ローカルステートをリセット
      setModifiedShifts({})
      setDeletedShiftIds(new Set())
      setHasUnsavedChanges(false)

      // 4. 承認処理を実行（UIを戻る）
      alert(isAlreadyApproved ? MESSAGES.SUCCESS.SAVED : MESSAGES.SUCCESS.APPROVE_FIRST_PLAN)
      onApprove()
    } catch (error) {
      console.error('承認処理エラー:', error)
      alert(MESSAGES.ERROR.SAVE_APPROVE_FAILED)
    }
  }

  // シフト更新ハンドラー（ローカルステートのみ更新）
  const handleUpdateShift = (shiftId, updates) => {
    setHasUnsavedChanges(true)

    // ローカルの変更を保持
    setModifiedShifts(prev => ({
      ...prev,
      [shiftId]: {
        ...prev[shiftId],
        ...updates,
      },
    }))

    // UIを即座に更新
    setCalendarData(prev => {
      const updatedShiftsByDate = { ...prev.shiftsByDate }

      // すべての日付のシフトを更新
      Object.keys(updatedShiftsByDate).forEach(day => {
        updatedShiftsByDate[day] = updatedShiftsByDate[day].map(shift => {
          if (shift.shift_id === shiftId) {
            return {
              ...shift,
              ...updates,
              modified_flag: true,
            }
          }
          return shift
        })
      })

      return {
        ...prev,
        shiftsByDate: updatedShiftsByDate,
      }
    })

    // 現在表示中の日のシフトも更新
    if (selectedDay) {
      setDayShifts(prev =>
        prev.map(shift =>
          shift.shift_id === shiftId
            ? { ...shift, ...updates, modified_flag: true }
            : shift
        )
      )
    }
  }

  // シフト削除ハンドラー（ローカルステートのみ更新）
  const handleDeleteShift = (shiftId) => {
    setHasUnsavedChanges(true)

    // ローカルの削除リストに追加
    setDeletedShiftIds(prev => new Set([...prev, shiftId]))

    // UIから削除
    setCalendarData(prev => {
      const updatedShiftsByDate = { ...prev.shiftsByDate }

      // すべての日付のシフトから削除
      Object.keys(updatedShiftsByDate).forEach(day => {
        updatedShiftsByDate[day] = updatedShiftsByDate[day].filter(
          shift => shift.shift_id !== shiftId
        )
      })

      return {
        ...prev,
        shiftsByDate: updatedShiftsByDate,
      }
    })

    // 現在表示中の日のシフトも削除
    if (selectedDay) {
      const updatedShifts = dayShifts.filter(s => s.shift_id !== shiftId)
      setDayShifts(updatedShifts)

      // その日のシフトがなくなったら閉じる
      if (updatedShifts.length === 0) {
        closeDayView()
      }
    }
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
          <p className="text-lg text-gray-600">データを読み込んでいます...</p>
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            シフト管理に戻る
          </Button>
          <div className="flex gap-2">
            {selectedShift?.status === 'first_plan_approved' ? (
              <>
                <Button onClick={handleApprove} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  変更を保存
                </Button>
                {onCreateSecondPlan && (
                  <Button onClick={() => onCreateSecondPlan(selectedShift)} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    第2案を作成
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                第1案を承認
              </Button>
            )}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          {year}年{month}月のシフト（{selectedShift?.status === 'first_plan_approved' ? '第1案承認済み' : '下書き'}）
        </h1>
        <p className="text-gray-600 mt-2">日付をクリックして詳細を確認・編集できます</p>
      </div>

      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          {calendarData && (
            <ShiftCalendar
              year={year}
              month={month}
              calendarData={calendarData}
              onDayClick={handleDayClick}
            />
          )}
        </CardContent>
      </Card>

      {/* タイムライン表示 */}
      <AnimatePresence>
        {selectedDay && (
          <ShiftTimeline
            date={selectedDay}
            year={year}
            month={month}
            shifts={dayShifts}
            onClose={closeDayView}
            editable={true}
            onUpdate={handleUpdateShift}
            onDelete={handleDeleteShift}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default DraftShiftEditor
