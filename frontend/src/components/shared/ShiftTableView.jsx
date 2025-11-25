import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { ROLE_COLORS, getRoleColor } from '../../config/colors'
import { isHoliday, getHolidayName, loadHolidays } from '../../utils/holidays'

/**
 * 表形式のシフトカレンダービュー
 * - 縦軸: 時間帯（30分刻み）
 * - 横軸: 時刻 | 全店舗Σ | 各店舗（店舗Σ + スタッフ列...）
 * - セルの値: rowspanで縦に結合したシフトバー
 */
const ShiftTableView = ({
  date,
  shifts,
  onClose,
  year,
  month,
  editable = false,
  onUpdate,
  onDelete,
  onShiftClick,
  storesMap = {},
  storeName, // 個別店舗の場合の店舗名
}) => {
  // 祝日データを事前に読み込む
  useEffect(() => {
    loadHolidays()
  }, [])

  // 祝日判定
  const isDayHoliday = isHoliday(year, month, date)
  const holidayName = getHolidayName(year, month, date)

  // 時間範囲（5:00 - 翌4:00 = 28:00）
  const START_HOUR = 5
  const END_HOUR = 28
  const TIME_SLOTS = [] // ['05:00', '05:30', '06:00', ...]

  for (let h = START_HOUR; h <= END_HOUR; h++) {
    if (h <= END_HOUR - 1) {
      TIME_SLOTS.push(`${String(h < 24 ? h : h - 24).padStart(2, '0')}:00`)
    }
    if (h < END_HOUR) {
      TIME_SLOTS.push(`${String(h < 24 ? h : h - 24).padStart(2, '0')}:30`)
    }
  }

  // 時間を分に変換（深夜営業対応）
  const timeToMinutes = (timeStr) => {
    const [hour, minute] = timeStr.split(':').map(Number)
    // 0-6時は翌日として扱う（24-30時として計算）
    let actualHour = hour
    if (hour >= 0 && hour < 7) {
      actualHour = hour + 24
    }
    return actualHour * 60 + minute
  }

  // スタッフをstore_idでグループ化
  const groupStaffByStore = () => {
    const staffByStore = {}

    shifts.forEach((shift) => {
      const storeId = shift.store_id
      if (!staffByStore[storeId]) {
        staffByStore[storeId] = []
      }
      // 同じスタッフが既に登録されていなければ追加
      if (!staffByStore[storeId].find(s => s.staff_id === shift.staff_id)) {
        staffByStore[storeId].push({
          staff_id: shift.staff_id,
          staff_name: shift.staff_name,
          role: shift.role,
        })
      }
    })

    return staffByStore
  }

  const staffByStore = groupStaffByStore()
  const storeIds = Object.keys(staffByStore).sort()
  const showAllStoresColumn = !storeName && storeIds.length > 1

  // 各時間帯の勤務人数を計算
  const getStaffCountAtTime = (timeSlot, storeId = null) => {
    const slotMinutes = timeToMinutes(timeSlot)

    return shifts.filter((shift) => {
      if (storeId && shift.store_id !== parseInt(storeId)) return false

      const startMinutes = timeToMinutes(shift.start_time)
      const endMinutes = timeToMinutes(shift.end_time)

      // その時刻がシフトの範囲内にあればカウント
      return slotMinutes >= startMinutes && slotMinutes < endMinutes
    }).length
  }

  // 時刻をHH:MM形式にフォーマット
  const formatTime = (time) => {
    if (!time) return ''
    return time.substring(0, 5)
  }

  // 指定時刻にシフトが開始するかチェック
  const getShiftStartingAt = (timeSlot, staffId, storeId) => {
    return shifts.find((shift) => {
      return (
        shift.staff_id === staffId &&
        shift.store_id === parseInt(storeId) &&
        formatTime(shift.start_time) === timeSlot
      )
    })
  }

  // シフトの長さ（30分単位の数）を計算
  const getShiftRowSpan = (shift) => {
    const startMinutes = timeToMinutes(shift.start_time)
    const endMinutes = timeToMinutes(shift.end_time)
    const durationMinutes = endMinutes - startMinutes
    return Math.ceil(durationMinutes / 30)
  }

  // 指定時刻が既存シフトの途中かチェック（rowspanでスキップすべきか）
  const isTimeSlotOccupied = (timeSlot, staffId, storeId) => {
    const slotMinutes = timeToMinutes(timeSlot)

    return shifts.some((shift) => {
      if (shift.staff_id !== staffId || shift.store_id !== parseInt(storeId)) {
        return false
      }

      const startMinutes = timeToMinutes(shift.start_time)
      const endMinutes = timeToMinutes(shift.end_time)

      // シフト開始時刻と一致する場合は占有されていない（新しいセルを描画）
      if (slotMinutes === startMinutes) {
        return false
      }

      // シフトの範囲内にある場合は占有されている
      return slotMinutes > startMinutes && slotMinutes < endMinutes
    })
  }

  // シフト削除ハンドラー
  const handleDelete = (shift) => {
    if (!editable || !onDelete) return

    if (confirm(`${shift.staff_name}のシフト（${shift.start_time}-${shift.end_time}）を削除しますか？`)) {
      onDelete(shift.shift_id)
    }
  }

  // 凡例用の役職リスト
  const roleLegend = Object.keys(ROLE_COLORS).map((roleName) => ({
    name: roleName,
    color: ROLE_COLORS[roleName].bg,
  }))

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-2" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="border-b bg-gray-50 px-2 py-1 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">
                {year}年{month}月{date}日 {storeName && `- ${storeName}`}
              </h2>
              {isDayHoliday && (
                <div className="text-[0.6rem] text-red-600 font-medium">{holidayName}</div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[0.6rem] text-gray-600">{shifts.length}名勤務</p>
            {/* 凡例 */}
            <div className="flex items-center gap-1">
              <span className="text-[0.55rem] text-gray-500 font-medium">役職:</span>
              {roleLegend.map((role) => (
                <div key={role.name} className="flex items-center gap-0.5">
                  <div className={`w-2 h-2 rounded ${role.color}`}></div>
                  <span className="text-[0.55rem] text-gray-700">{role.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* スクロール可能なテーブルエリア */}
        <div className="flex-1 overflow-auto">
          <table className="border-collapse text-[0.55rem]">
            <thead className="sticky top-0 z-10">
              {/* 店舗行 */}
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-0.5 py-0.5 bg-gray-100 w-10" rowSpan="2">
                  時刻
                </th>
                {showAllStoresColumn && (
                  <th className="border border-gray-300 px-0.5 py-0.5 bg-yellow-100 w-6" rowSpan="2">
                    Σ
                  </th>
                )}
                {storeIds.map((storeId) => {
                  const staffCount = staffByStore[storeId].length
                  const storeName = storesMap[storeId]?.store_name || `店舗${storeId}`
                  return (
                    <th
                      key={storeId}
                      className="border border-gray-300 px-0.5 py-0.5 bg-blue-100 text-[0.6rem]"
                      colSpan={staffCount + 1}
                    >
                      {storeName}
                    </th>
                  )
                })}
              </tr>
              {/* スタッフ名行 */}
              <tr className="bg-gray-100">
                {storeIds.map((storeId) => {
                  const staffList = staffByStore[storeId]
                  return (
                    <React.Fragment key={`staff-${storeId}`}>
                      <th className="border border-gray-300 px-0.5 py-0.5 bg-blue-50 font-semibold w-6">Σ</th>
                      {staffList.map((staff) => (
                        <th key={staff.staff_id} className="border border-gray-300 px-0.5 py-0.5 w-12 max-w-12">
                          <div className="font-medium text-[0.55rem] truncate" title={staff.staff_name}>{staff.staff_name}</div>
                          <div className="text-[0.45rem] text-gray-600 truncate">{staff.role}</div>
                        </th>
                      ))}
                    </React.Fragment>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((timeSlot, index) => (
                <tr key={timeSlot} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {/* 時刻セル */}
                  <td className="border border-gray-300 px-0.5 py-0.5 bg-gray-50 font-semibold text-center text-[0.55rem]">
                    {timeSlot}
                  </td>

                  {/* 全店舗合計Σセル */}
                  {showAllStoresColumn && (
                    <td className="border border-gray-300 px-0.5 py-0.5 text-center font-semibold bg-yellow-50 text-[0.55rem]">
                      {getStaffCountAtTime(timeSlot)}
                    </td>
                  )}

                  {/* 各店舗のセル */}
                  {storeIds.map((storeId) => {
                    const staffList = staffByStore[storeId]
                    return (
                      <React.Fragment key={`cells-${storeId}-${timeSlot}`}>
                        {/* 店舗合計Σセル */}
                        <td className="border border-gray-300 px-0.5 py-0.5 text-center font-semibold bg-blue-50 text-[0.55rem]">
                          {getStaffCountAtTime(timeSlot, storeId)}
                        </td>

                        {/* 各スタッフのセル */}
                        {staffList.map((staff) => {
                          // このタイムスロットが既存シフトの途中ならスキップ
                          if (isTimeSlotOccupied(timeSlot, staff.staff_id, storeId)) {
                            return null
                          }

                          // このタイムスロットで開始するシフトがあるか確認
                          const shift = getShiftStartingAt(timeSlot, staff.staff_id, storeId)

                          if (shift) {
                            const rowSpan = getShiftRowSpan(shift)
                            const roleColor = getRoleColor(shift.role)

                            return (
                              <td
                                key={`${staff.staff_id}-${timeSlot}`}
                                className={`border border-gray-300 px-0.5 py-0.5 ${roleColor.bg} text-white text-center cursor-pointer hover:opacity-90 transition-opacity max-w-12`}
                                rowSpan={rowSpan}
                                onClick={() => {
                                  if (editable && onShiftClick) {
                                    onShiftClick(shift)
                                  }
                                }}
                              >
                                <div className="flex flex-col items-center justify-center h-full gap-0.5">
                                  <div className="font-semibold text-[0.5rem]">
                                    {formatTime(shift.start_time)}<br/>{formatTime(shift.end_time)}
                                  </div>
                                  {shift.modified_flag && (
                                    <div className="text-[0.45rem] bg-yellow-400 text-yellow-900 px-0.5 rounded">
                                      ⚠️
                                    </div>
                                  )}
                                  {editable && onDelete && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(shift)
                                      }}
                                      className="p-0.5 bg-red-500 hover:bg-red-600 rounded text-white opacity-0 hover:opacity-100 transition-opacity"
                                      title="削除"
                                    >
                                      <Trash2 className="h-2 w-2" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )
                          }

                          // シフトがない場合は空セル
                          return (
                            <td
                              key={`${staff.staff_id}-${timeSlot}`}
                              className="border border-gray-300 px-0.5 py-0.5"
                            ></td>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default ShiftTableView
