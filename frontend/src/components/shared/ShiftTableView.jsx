import React, { useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { ROLE_COLORS, getRoleColor } from '../../config/colors'
import { isHoliday, getHolidayName, loadHolidays } from '../../utils/holidays'

/**
 * 表形式のシフトカレンダービュー（転置版）
 * - 縦軸: スタッフ（店舗ごとにグループ化）
 * - 横軸: 稼働店舗 | スタッフ名 | 役職 | 時間帯（30分刻み）
 * - セルの値: colspanで横に結合したシフトバー
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

  // 時間範囲（7:00 - 翌6:30 = 30:30）
  const START_HOUR = 7
  const END_HOUR = 31
  const TIME_SLOTS = [] // ['07:00', '07:30', '08:00', ...]

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
          store_id: storeId,
        })
      }
    })

    return staffByStore
  }

  const staffByStore = groupStaffByStore()
  const storeIds = Object.keys(staffByStore).sort()

  // 全スタッフのリスト（店舗順）
  const allStaff = []
  storeIds.forEach((storeId) => {
    allStaff.push(...staffByStore[storeId])
  })

  // 各店舗の最初のスタッフかどうかを判定する関数（rowspan用）
  const isFirstStaffInStore = (staff) => {
    return staffByStore[staff.store_id][0].staff_id === staff.staff_id
  }

  // 各時間帯の勤務人数を計算（全店舗）
  const getStaffCountAtTime = (timeSlot) => {
    const slotMinutes = timeToMinutes(timeSlot)

    return shifts.filter((shift) => {
      const startMinutes = timeToMinutes(shift.start_time)
      const endMinutes = timeToMinutes(shift.end_time)

      // その時刻がシフトの範囲内にあればカウント
      return slotMinutes >= startMinutes && slotMinutes < endMinutes
    }).length
  }

  // 各時間帯の店舗別勤務人数を計算
  const getStoreStaffCountAtTime = (timeSlot, storeId) => {
    const slotMinutes = timeToMinutes(timeSlot)

    return shifts.filter((shift) => {
      if (shift.store_id !== parseInt(storeId)) return false

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

  // シフトの長さ（30分単位の数）を計算 → colSpanに使用
  const getShiftColSpan = (shift) => {
    const startMinutes = timeToMinutes(shift.start_time)
    const endMinutes = timeToMinutes(shift.end_time)
    const durationMinutes = endMinutes - startMinutes
    return Math.ceil(durationMinutes / 30)
  }

  // 指定時刻が既存シフトの途中かチェック（colspanでスキップすべきか）
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

  return (
    <div className="w-full h-full flex flex-col p-2">
      <div className="bg-white w-full h-full flex flex-col">
        {/* ヘッダー */}
        <div className="border-b bg-gray-50 px-4 py-2 flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold">
              {year}年{month}月{date}日 {storeName && `- ${storeName}`}
            </h2>
            {isDayHoliday && (
              <div className="text-[0.6rem] text-red-600 font-medium">{holidayName}</div>
            )}
          </div>
        </div>

        {/* スクロール可能なテーブルエリア */}
        <div className="flex-1 overflow-auto">
          <table className="border-collapse text-[0.55rem]">
            <thead className="sticky top-0 z-10">
              {/* 時刻ヘッダー行 */}
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-1 py-0.5 bg-gray-100 sticky left-0 z-20" style={{ minWidth: '100px' }}>
                  稼働店舗
                </th>
                <th className="border border-gray-300 px-1 py-0.5 bg-gray-100 sticky z-20" style={{ minWidth: '80px', left: '100px' }}>
                  スタッフ名
                </th>
                <th className="border border-gray-300 px-1 py-0.5 bg-gray-100 sticky z-20" style={{ minWidth: '60px', left: '180px' }}>
                  役職
                </th>
                {TIME_SLOTS.map((timeSlot) => (
                  <th
                    key={timeSlot}
                    className="border border-gray-300 px-0.5 py-0.5 bg-blue-100 text-[0.55rem] font-semibold"
                    style={{ minWidth: '32px' }}
                  >
                    <div className="writing-mode-vertical text-center">{timeSlot}</div>
                  </th>
                ))}
              </tr>
              {/* 勤務人数サマリー行 */}
              <tr className="bg-yellow-50">
                <th className="border border-gray-300 px-1 py-0.5 bg-yellow-100 sticky left-0 z-20 text-[0.55rem]" colSpan="3">
                  勤務人数 Σ
                </th>
                {TIME_SLOTS.map((timeSlot) => (
                  <td
                    key={timeSlot}
                    className="border border-gray-300 px-0.5 py-0.5 text-center font-semibold text-[0.55rem]"
                  >
                    {getStaffCountAtTime(timeSlot)}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {storeIds.map((storeId, storeIndex) => {
                const storeStaff = staffByStore[storeId]
                const storeRows = []

                // 店舗合計行を先頭に追加
                storeRows.push(
                  <tr key={`store-sum-${storeId}`} className="bg-blue-50 border-b-2 border-blue-300">
                    <td colSpan="3" className="border border-gray-300 px-1 py-0.5 sticky left-0 z-10 bg-blue-50 font-bold text-[0.55rem] text-center">
                      {storesMap[storeId]?.store_name || `店舗${storeId}`} 合計 Σ
                    </td>
                    {TIME_SLOTS.map((timeSlot) => (
                      <td
                        key={timeSlot}
                        className="border border-gray-300 px-0.5 py-0.5 text-center font-semibold bg-blue-50 text-[0.55rem]"
                      >
                        {getStoreStaffCountAtTime(timeSlot, storeId)}
                      </td>
                    ))}
                  </tr>
                )

                // 各スタッフの行を追加
                storeStaff.forEach((staff, staffIndex) => {
                  const rowBgClass = staffIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'

                  storeRows.push(
                    <tr key={`${staff.store_id}-${staff.staff_id}`} className={rowBgClass}>
                    {/* 店舗名（rowspan） */}
                    {isFirstStaffInStore(staff) && (
                      <td
                        rowSpan={staffByStore[staff.store_id].length}
                        className="border border-gray-300 px-2 py-1 sticky left-0 z-10 bg-blue-100 font-bold text-sm align-top"
                      >
                        {storesMap[staff.store_id]?.store_name || `店舗${staff.store_id}`}
                      </td>
                    )}

                    {/* スタッフ名 */}
                    <td className={`border border-gray-300 px-1 py-1 sticky z-10 ${rowBgClass} font-medium text-[0.55rem]`} style={{ left: '100px' }}>
                      {staff.staff_name}
                    </td>

                    {/* 役職 */}
                    <td className={`border border-gray-300 px-1 py-1 sticky z-10 ${rowBgClass} text-[0.5rem] text-gray-600`} style={{ left: '180px' }}>
                      {staff.role}
                    </td>

                    {/* 各タイムスロット */}
                    {TIME_SLOTS.map((timeSlot) => {
                      // このタイムスロットが既存シフトの途中ならスキップ
                      if (isTimeSlotOccupied(timeSlot, staff.staff_id, staff.store_id)) {
                        return null
                      }

                      // このタイムスロットで開始するシフトがあるか確認
                      const shift = getShiftStartingAt(timeSlot, staff.staff_id, staff.store_id)

                      if (shift) {
                        const colSpan = getShiftColSpan(shift)
                        const roleColor = getRoleColor(shift.role)

                        return (
                          <td
                            key={`${staff.staff_id}-${timeSlot}`}
                            className={`border border-gray-300 px-0.5 py-1 ${roleColor.bg} text-white text-center ${editable && onShiftClick ? 'cursor-pointer hover:opacity-90' : ''} transition-opacity`}
                            colSpan={colSpan}
                            onClick={(e) => {
                              console.log('🖱️ Shift cell clicked:', { shift, editable, hasOnShiftClick: !!onShiftClick })
                              if (editable && onShiftClick) {
                                console.log('✅ Calling onShiftClick')
                                onShiftClick({
                                  mode: 'edit',
                                  shift: shift,
                                  date: date,
                                  event: e
                                })
                              } else {
                                console.log('❌ Click ignored - editable:', editable, 'onShiftClick:', !!onShiftClick)
                              }
                            }}
                          >
                            <div className="flex flex-row items-center justify-center gap-1">
                              <div className="font-semibold text-[0.5rem] whitespace-nowrap">
                                {formatTime(shift.start_time)}-{formatTime(shift.end_time)}
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
                          className="border border-gray-300 px-0.5 py-1"
                        ></td>
                      )
                    })}
                  </tr>
                  )
                })

                return storeRows
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ShiftTableView
