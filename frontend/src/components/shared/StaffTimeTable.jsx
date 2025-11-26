import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { isHoliday, getHolidayName } from '../../utils/holidays'
import { getDaysInMonth, getDayOfWeek } from '../../utils/dateUtils'
import { Check, X, Trash2, Plus } from 'lucide-react'
import TimeInput from './TimeInput'

/**
 * スタッフ別タイムテーブル（インライン編集対応）
 * 縦軸: 日付、横軸: スタッフ
 * 各セルに勤務時間を表示、クリックで編集可能
 */
const StaffTimeTable = ({
  year,
  month,
  shiftData,
  staffMap,
  storesMap,
  storeName,
  onCellClick,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  readonly = false,
}) => {
  const [editingCell, setEditingCell] = useState(null) // { date, staffId }
  const [editForm, setEditForm] = useState({ start_time: '', end_time: '', break_minutes: 60 })
  const headerScrollRef = useRef(null)
  const bodyScrollRef = useRef(null)

  // ヘッダーとボディのスクロールを同期
  const handleHeaderScroll = e => {
    if (bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = e.target.scrollLeft
    }
  }

  const handleBodyScroll = e => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.target.scrollLeft
    }
  }

  // デバッグ: 受け取ったstaffMapの内容を確認
  console.log('=== StaffTimeTable受け取ったstaffMap ===')
  console.log('staffMap件数:', Object.keys(staffMap).length)
  console.log('staffMapの最初の2件:', Object.entries(staffMap).slice(0, 2))

  // 月の日数を計算（JST対応）
  const daysInMonth = getDaysInMonth(year, month)
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // 時刻をHH:MM形式にフォーマット
  const formatTime = time => {
    if (!time) return ''
    return time.substring(0, 5)
  }

  // 店舗IDから店舗コードを取得
  const getStoreCode = storeId => {
    if (!storesMap || !storeId) return ''
    const store = storesMap[storeId]
    return store ? store.store_code : ''
  }

  // 日付とスタッフIDからシフトを検索
  const getShiftForDateAndStaff = (date, staffId) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    return shiftData.find(
      shift =>
        shift.shift_date &&
        shift.shift_date.startsWith(dateStr) &&
        parseInt(shift.staff_id) === parseInt(staffId)
    )
  }

  // 勤務時間を計算
  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    return Math.abs((endH * 60 + endM - startH * 60 - startM) / 60)
  }

  // スタッフごとの月間合計を計算
  const getStaffMonthlyTotal = staffId => {
    let totalDays = 0
    let totalHours = 0
    dates.forEach(date => {
      const shift = getShiftForDateAndStaff(date, staffId)
      if (shift) {
        totalDays++
        totalHours += calculateHours(shift.start_time, shift.end_time)
      }
    })
    return { totalDays, totalHours }
  }

  // スタッフリストを取得
  const allStaff = Object.entries(staffMap).map(([id, info]) => ({
    staff_id: parseInt(id),
    ...info,
  }))

  console.log('StaffTimeTable - allStaff[0]:', allStaff[0])
  console.log(
    'StaffTimeTable - allStaff[0]のis_active:',
    allStaff[0]?.is_active,
    'typeof:',
    typeof allStaff[0]?.is_active
  )

  const staffList = allStaff
    .filter(staff => {
      console.log(
        `スタッフ ${staff.name || staff.staff_id}: is_active=${staff.is_active} (型: ${typeof staff.is_active})`
      )
      // is_activeがundefinedの場合は一旦全員表示
      return staff.is_active !== false
    })
    .sort((a, b) => a.staff_id - b.staff_id)

  console.log('StaffTimeTable - フィルタ後のstaffList件数:', staffList.length)

  // 時間帯による色分け
  const getTimeSlotColor = startTime => {
    if (!startTime) return 'bg-gray-100'
    const hour = parseInt(startTime.split(':')[0])
    if (hour < 9) return 'bg-blue-50 border-blue-200'
    if (hour < 12) return 'bg-green-50 border-green-200'
    return 'bg-orange-50 border-orange-200'
  }

  // 日付ごとの合計を計算
  const getDailyTotal = date => {
    let staffCount = 0
    let totalHours = 0
    staffList.forEach(staff => {
      const shift = getShiftForDateAndStaff(date, staff.staff_id)
      if (shift) {
        staffCount++
        totalHours += calculateHours(shift.start_time, shift.end_time)
      }
    })
    return { staffCount, totalHours }
  }

  // 曜日を取得（JST対応）
  const getWeekday = date => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const dayOfWeek = getDayOfWeek(year, month, date)
    return weekdays[dayOfWeek]
  }

  // 曜日の色（JST対応）
  const getWeekdayColor = date => {
    const dayOfWeek = getDayOfWeek(year, month, date)
    if (dayOfWeek === 0) return 'text-red-600'
    if (dayOfWeek === 6) return 'text-blue-600'
    return 'text-gray-700'
  }

  // セルクリック処理
  const handleCellClick = (date, staffId, shift) => {
    // readonly モードの場合は編集せず、onCellClickのみ呼ぶ
    if (readonly) {
      if (onCellClick) {
        onCellClick(date, staffId, shift)
      }
      return
    }

    // 既存のシフトがある場合はその値で、ない場合はデフォルト値で初期化
    if (shift) {
      setEditForm({
        start_time: formatTime(shift.start_time),
        end_time: formatTime(shift.end_time),
        break_minutes: shift.break_minutes || 60,
      })
    } else {
      setEditForm({
        start_time: '09:00',
        end_time: '18:00',
        break_minutes: 60,
      })
    }
    setEditingCell({ date, staffId, shift })
  }

  // 編集キャンセル
  const handleCancel = () => {
    setEditingCell(null)
    setEditForm({ start_time: '', end_time: '', break_minutes: 60 })
  }

  // 保存処理
  const handleSave = () => {
    console.log('=== StaffTimeTable handleSave called ===')
    console.log('editingCell:', editingCell)
    console.log('editForm:', editForm)
    console.log('onUpdateShift:', typeof onUpdateShift)
    console.log('onAddShift:', typeof onAddShift)

    if (!editForm.start_time || !editForm.end_time) {
      alert('開始時間と終了時間を入力してください')
      return
    }

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(editingCell.date).padStart(2, '0')}`

    if (editingCell.shift) {
      // 既存シフトの更新
      console.log('既存シフトを更新:', editingCell.shift.shift_id)
      const updates = {
        start_time: editForm.start_time, // VARCHAR(5)形式: "09:00", "25:00"
        end_time: editForm.end_time,
        break_minutes: parseInt(editForm.break_minutes),
      }
      console.log('更新内容:', updates)
      onUpdateShift && onUpdateShift(editingCell.shift.shift_id, updates)
    } else {
      // 新規シフトの追加
      console.log('新規シフトを追加')
      const newShift = {
        staff_id: editingCell.staffId,
        shift_date: dateStr,
        start_time: editForm.start_time, // VARCHAR(5)形式: "09:00", "25:00"
        end_time: editForm.end_time,
        break_minutes: parseInt(editForm.break_minutes),
      }
      console.log('新規シフト:', newShift)
      onAddShift && onAddShift(newShift)
    }

    handleCancel()
  }

  // 削除処理
  const handleDelete = () => {
    if (!editingCell.shift) return
    if (confirm('このシフトを削除しますか？')) {
      onDeleteShift && onDeleteShift(editingCell.shift.shift_id)
      handleCancel()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200">
      {/* 店舗名ヘッダー */}
      <div className="px-2 py-0.5 bg-blue-50 border-b border-blue-200 flex-shrink-0">
        <h3 className="text-[0.65rem] font-semibold text-blue-900">
          店舗: {storeName || '全店舗'}
        </h3>
      </div>

      {/* テーブルヘッダー（固定） */}
      <div
        ref={headerScrollRef}
        onScroll={handleHeaderScroll}
        className="overflow-x-auto flex-shrink-0 border-b-2 border-gray-300"
      >
        <table className="w-full border-collapse text-[0.6rem]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '80px' }} />
            <col style={{ width: '60px' }} />
            {staffList.map(staff => (
              <col key={staff.staff_id} style={{ width: '70px' }} />
            ))}
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-0 py-0.5 text-center font-semibold text-gray-700 border-b border-r-2 border-gray-300">
                日付
              </th>
              <th className="px-0 py-0.5 text-center font-semibold text-gray-700 border-b border-r-2 border-gray-300 bg-gray-100">
                日別
              </th>
              {staffList.map(staff => (
                <th
                  key={staff.staff_id}
                  className="px-0 py-0.5 text-center font-semibold text-gray-700 border-b border-r border-gray-200"
                >
                  <div className="text-[0.55rem] leading-tight">{staff.name}</div>
                  <div className="text-[0.45rem] text-gray-500 font-normal leading-tight">
                    {staff.role_name}
                  </div>
                </th>
              ))}
            </tr>
            {/* 月間合計行 */}
            <tr className="bg-gray-100 font-semibold">
              <td className="px-0 py-0.5 border-r-2 border-gray-300 text-center text-gray-700">
                月合計
              </td>
              <td className="px-0 py-0.5 border-r-2 border-gray-300 text-center bg-gray-100"></td>
              {staffList.map(staff => {
                const { totalDays, totalHours } = getStaffMonthlyTotal(staff.staff_id)
                return (
                  <td
                    key={staff.staff_id}
                    className="px-0.5 py-0.5 border-r border-gray-200 text-center"
                  >
                    <div className="text-gray-800 text-[0.5rem] leading-tight">
                      {totalDays}日 {totalHours.toFixed(1)}h
                    </div>
                  </td>
                )
              })}
            </tr>
          </thead>
        </table>
      </div>

      {/* テーブルボディ（スクロール可能） */}
      <div
        ref={bodyScrollRef}
        onScroll={handleBodyScroll}
        className="overflow-x-auto overflow-y-auto flex-1"
      >
        <table className="w-full border-collapse text-[0.6rem]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '80px' }} />
            <col style={{ width: '60px' }} />
            {staffList.map(staff => (
              <col key={staff.staff_id} style={{ width: '70px' }} />
            ))}
          </colgroup>
          <tbody>
            {dates.map((date, index) => {
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
              const holiday = isHoliday(year, month, date)
              const holidayName = getHolidayName(year, month, date)
              const weekday = getWeekday(date)
              const dailyTotal = getDailyTotal(date)
              const rowBgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-25'

              return (
                <tr key={date} className={rowBgColor}>
                  {/* 日付セル */}
                  <td className="px-1 py-0.5 border-r-2 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-0.5">
                      <span
                        className={`font-bold text-[0.85rem] leading-tight ${getWeekdayColor(date)}`}
                      >
                        {date}({weekday})
                      </span>
                      {holiday && (
                        <span className="text-[0.5rem] text-red-600 font-medium leading-tight">
                          {holidayName}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 日別合計セル */}
                  <td className="px-1 py-0.5 border-r-2 border-b border-gray-200 text-center bg-gray-50">
                    <div className="font-semibold text-gray-800 text-[0.5rem] leading-tight">
                      {dailyTotal.staffCount}名 {dailyTotal.totalHours.toFixed(1)}h
                    </div>
                  </td>

                  {/* スタッフごとのシフトセル */}
                  {staffList.map(staff => {
                    const shift = getShiftForDateAndStaff(date, staff.staff_id)
                    const hours = shift ? calculateHours(shift.start_time, shift.end_time) : 0
                    const isEditing =
                      editingCell?.date === date && editingCell?.staffId === staff.staff_id

                    return (
                      <td
                        key={staff.staff_id}
                        className="px-0.5 py-0.5 border-r border-b border-gray-200"
                      >
                        {isEditing ? (
                          // 編集モード（24時超過対応）
                          <div className="p-1 bg-yellow-50 border border-yellow-300 rounded space-y-0.5">
                            <TimeInput
                              value={editForm.start_time}
                              onChange={val =>
                                setEditForm({ ...editForm, start_time: val })
                              }
                              label="開始"
                              compact
                              minHour={5}
                              maxHour={28}
                              minuteStep={30}
                            />
                            <TimeInput
                              value={editForm.end_time}
                              onChange={val => setEditForm({ ...editForm, end_time: val })}
                              label="終了"
                              compact
                              minHour={5}
                              maxHour={28}
                              minuteStep={30}
                            />
                            <input
                              type="number"
                              value={editForm.break_minutes}
                              onChange={e =>
                                setEditForm({ ...editForm, break_minutes: e.target.value })
                              }
                              placeholder="休憩(分)"
                              className="w-full text-[0.6rem] px-0.5 py-0.5 border rounded"
                            />
                            <div className="flex gap-0.5">
                              <button
                                onClick={handleSave}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-[0.5rem] px-1 py-0.5 rounded flex items-center justify-center"
                              >
                                <Check className="w-2.5 h-2.5" />
                              </button>
                              {shift && (
                                <button
                                  onClick={handleDelete}
                                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[0.5rem] px-1 py-0.5 rounded flex items-center justify-center"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                              <button
                                onClick={handleCancel}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-[0.5rem] px-1 py-0.5 rounded flex items-center justify-center"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        ) : shift ? (
                          // 既存シフト表示
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`px-0.5 py-0.5 rounded border cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all ${getTimeSlotColor(shift.start_time)} ${
                              shift.modified_flag ? 'ring-1 ring-yellow-400' : ''
                            }`}
                            onClick={() => handleCellClick(date, staff.staff_id, shift)}
                          >
                            <div className="font-semibold text-gray-800 text-[0.5rem] leading-tight">
                              {staff.store_id &&
                              shift.store_id &&
                              parseInt(staff.store_id) !== parseInt(shift.store_id)
                                ? `${getStoreCode(shift.store_id)} `
                                : ''}
                              {formatTime(shift.start_time)}-{formatTime(shift.end_time)}
                            </div>
                            <div className="text-[0.45rem] text-gray-600 leading-tight">
                              {hours.toFixed(1)}h
                            </div>
                          </motion.div>
                        ) : (
                          // 空セル（追加可能）
                          <div
                            className="text-center py-1 cursor-pointer hover:bg-blue-50 hover:border-blue-300 border border-transparent rounded transition-all group"
                            onClick={() => handleCellClick(date, staff.staff_id, null)}
                          >
                            <Plus className="w-3 h-3 mx-auto text-gray-300 group-hover:text-blue-500" />
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StaffTimeTable
