import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ROLE_COLORS, getRoleColor } from '../../config/colors'
import { isHoliday, getHolidayName, loadHolidays } from '../../utils/holidays'

const ShiftTimeline = ({
  date,
  shifts,
  onClose,
  year,
  month,
  editable = false,
  onUpdate,
  onDelete,
  storeName,
  storesMap = {},
  onShiftClick,
}) => {
  // 時刻をHH:MM形式にフォーマット
  const formatTime = time => {
    if (!time) return ''
    return time.substring(0, 5)
  }

  // 祝日データを事前に読み込む
  useEffect(() => {
    loadHolidays()
  }, [])

  // 祝日判定
  const isDayHoliday = isHoliday(year, month, date)
  const holidayName = getHolidayName(year, month, date)
  const [selectedShift, setSelectedShift] = useState(null)
  // 時間範囲（5:00 - 翌4:00）
  const startHour = 5
  const endHour = 28 // 翌日4:00を28:00として扱う
  const hours = []
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h)
  }

  // 時間表示用のラベル
  const getHourLabel = hour => {
    if (hour < 24) {
      return `${hour}:00`
    } else {
      return `${hour - 24}:00` // 24時以降は0時、1時...として表示
    }
  }

  // ★変更: 時間を分に変換（深夜営業対応、VARCHAR(5)形式 "25:00" 対応）
  const timeToMinutes = timeStr => {
    if (!timeStr) return 0
    const [hour, minute] = timeStr.split(':').map(Number)
    // 新DB形式では "25:00" のような形式がそのまま保存されている
    // 旧形式（0-6時）との互換性も維持
    let actualHour = hour
    if (hour >= 0 && hour < 7) {
      // 旧形式: 0-6時は翌日として扱う（24-30時として計算）
      actualHour = hour + 24
    }
    // 新形式: 24以上の時間はそのまま使用
    return actualHour * 60 + minute
  }

  // 分を時間位置（%）に変換
  const minutesToPosition = minutes => {
    const startMinutes = startHour * 60
    const endMinutes = endHour * 60
    const totalMinutes = endMinutes - startMinutes
    return ((minutes - startMinutes) / totalMinutes) * 100
  }

  // シフトブロックのスタイル計算
  const getShiftStyle = shift => {
    const startMinutes = timeToMinutes(shift.start_time)
    const endMinutes = timeToMinutes(shift.end_time)
    const duration = endMinutes - startMinutes

    return {
      top: `${minutesToPosition(startMinutes)}%`,
      height: `${(duration / ((endHour - startHour) * 60)) * 100}%`,
    }
  }

  // 重なりを検出して列を計算
  const calculateOverlaps = () => {
    const sorted = [...shifts].sort(
      (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    )

    const columns = []

    sorted.forEach(shift => {
      const shiftStart = timeToMinutes(shift.start_time)
      const shiftEnd = timeToMinutes(shift.end_time)

      // 既存の列で空いているものを探す
      let placed = false
      for (let col = 0; col < columns.length; col++) {
        const column = columns[col]
        const hasOverlap = column.some(s => {
          const sStart = timeToMinutes(s.start_time)
          const sEnd = timeToMinutes(s.end_time)
          return !(shiftEnd <= sStart || shiftStart >= sEnd)
        })

        if (!hasOverlap) {
          column.push(shift)
          shift._column = col
          placed = true
          break
        }
      }

      // 新しい列を作成
      if (!placed) {
        columns.push([shift])
        shift._column = columns.length - 1
      }
    })

    return { columns: columns.length, shifts: sorted }
  }

  const { columns, shifts: processedShifts } = calculateOverlaps()

  // 時間帯ごとのスタッフ数を計算（30分刻み）
  const calculateStaffCountByTime = () => {
    const intervals = []
    // 5:00から28:00まで30分刻み
    for (let h = startHour; h < endHour; h++) {
      intervals.push({ hour: h, minute: 0, count: 0 })
      intervals.push({ hour: h, minute: 30, count: 0 })
    }

    // 各30分区間で何人が勤務しているかカウント
    intervals.forEach(interval => {
      const intervalMinutes = interval.hour * 60 + interval.minute
      shifts.forEach(shift => {
        const shiftStart = timeToMinutes(shift.start_time)
        const shiftEnd = timeToMinutes(shift.end_time)
        // その時刻がシフトの範囲内にあればカウント
        if (intervalMinutes >= shiftStart && intervalMinutes < shiftEnd) {
          interval.count++
        }
      })
    })

    return intervals
  }

  const staffCountByTime = calculateStaffCountByTime()
  const maxStaffCount = Math.max(...staffCountByTime.map(i => i.count), 1)

  // 位置（%）を分に変換
  const positionToMinutes = position => {
    const startMinutes = startHour * 60
    const endMinutes = endHour * 60
    const totalMinutes = endMinutes - startMinutes
    return startMinutes + (position / 100) * totalMinutes
  }

  // 分を時間文字列に変換（例: 570 -> "09:30"）
  const minutesToTimeString = minutes => {
    let hour = Math.floor(minutes / 60)
    const minute = Math.floor(minutes % 60)

    // 24時以降は0時に戻す（例: 27:30 -> 03:30）
    if (hour >= 24) {
      hour = hour - 24
    }

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  // ドラッグ終了時の処理
  const handleDragEnd = (shift, event, info) => {
    if (!editable || !onUpdate) return

    const container = event.target.closest('.shift-container')
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const containerHeight = containerRect.height

    // ドラッグ後の位置を計算
    const currentTop = parseFloat(shift._currentTop || getShiftStyle(shift).top)
    const deltaY = info.offset.y
    const newTopPercent = currentTop + (deltaY / containerHeight) * 100

    // パーセントを分に変換
    const newStartMinutes = positionToMinutes(Math.max(0, Math.min(100, newTopPercent)))

    // 元の勤務時間を計算
    const originalStartMinutes = timeToMinutes(shift.start_time)
    const originalEndMinutes = timeToMinutes(shift.end_time)
    const duration = originalEndMinutes - originalStartMinutes

    // 新しい終了時間を計算
    const newEndMinutes = newStartMinutes + duration

    // 30分単位に丸める
    const roundedStartMinutes = Math.round(newStartMinutes / 30) * 30
    const roundedEndMinutes = Math.round(newEndMinutes / 30) * 30

    // 時間文字列に変換
    const newStartTime = minutesToTimeString(roundedStartMinutes)
    const newEndTime = minutesToTimeString(roundedEndMinutes)

    // 更新を実行
    if (newStartTime !== shift.start_time || newEndTime !== shift.end_time) {
      onUpdate(shift.shift_id, {
        start_time: newStartTime,
        end_time: newEndTime,
      })
    }

    // 選択解除
    shift._currentTop = null
  }

  // 削除ハンドラー
  const handleDelete = shift => {
    if (!editable || !onDelete) return

    if (
      confirm(
        `${shift.staff_name}のシフト（${shift.start_time}-${shift.end_time}）を削除しますか？`
      )
    ) {
      onDelete(shift.shift_id)
    }
  }

  // 凡例用の役職リスト（コンフィグから生成）
  const roleLegend = Object.keys(ROLE_COLORS).map(roleName => ({
    name: roleName,
    color: ROLE_COLORS[roleName].bg,
  }))

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col mx-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="border-b bg-gray-50 px-2 py-1 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold leading-tight">
                {storeName && <span className="text-blue-900">店舗: {storeName} · </span>}
                {year}年{month}月{date}日のシフト詳細
              </h2>
              {isDayHoliday && (
                <div className="text-[0.5rem] text-red-600 font-medium mt-0.5 leading-tight">
                  {holidayName}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[0.5rem] text-gray-600 leading-tight">
              {shifts.length}名のスタッフが勤務 ·{' '}
              {columns > 1 ? `最大${columns}名の重なり` : '重なりなし'} ·{' '}
              <span className="text-blue-700 font-medium">最大同時勤務: {maxStaffCount}名</span>
            </p>
            {/* 凡例 */}
            <div className="flex items-center gap-1.5">
              <span className="text-[0.45rem] text-gray-500 font-medium leading-tight">役職:</span>
              {roleLegend.map(role => (
                <div key={role.name} className="flex items-center gap-0.5">
                  <div className={`w-2 h-2 rounded ${role.color}`}></div>
                  <span className="text-[0.45rem] text-gray-700 leading-tight">{role.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* スクロール可能なコンテンツエリア */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex" style={{ height: '920px', paddingTop: '4px' }}>
            {/* 時間軸（左側） */}
            <div className="w-12 flex-shrink-0 border-r bg-gray-50">
              {hours.map((hour, index) => (
                <div key={hour} className="relative h-[40px] border-b border-gray-200">
                  <div className="absolute -top-1.5 left-1 text-[0.45rem] leading-tight font-bold text-gray-700">
                    {getHourLabel(hour)}
                  </div>
                  {/* 30分の表示とライン */}
                  <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-gray-300">
                    <div className="absolute -top-1.5 left-1 text-[0.4rem] leading-tight font-medium text-gray-500">
                      {hour < 24 ? `${hour}:30` : `${hour - 24}:30`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* スタッフ数表示列 */}
            <div className="w-16 flex-shrink-0 border-r bg-blue-50 relative">
              {staffCountByTime.map((interval, index) => {
                const barWidth = (interval.count / maxStaffCount) * 100
                return (
                  <div
                    key={index}
                    className="absolute h-[20px] w-full flex items-center"
                    style={{ top: `${index * 20}px` }}
                  >
                    {/* 棒グラフ */}
                    <div
                      className="h-full bg-blue-400 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                    {/* 人数表示 */}
                    {interval.count > 0 && (
                      <div className="absolute right-1 text-[0.5rem] font-bold text-blue-900 leading-tight">
                        {interval.count}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* シフトブロック（右側） */}
            <div className="flex-1 relative">
              {/* 時間グリッド背景 */}
              {hours.map(hour => (
                <div key={`grid-${hour}`} className="h-[40px] border-b border-gray-200 relative">
                  {/* 30分線 */}
                  <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-gray-300" />
                </div>
              ))}

              {/* シフトブロック */}
              <div className="absolute inset-0 shift-container">
                {processedShifts.map((shift, index) => {
                  const style = getShiftStyle(shift)
                  // 最大幅を600pxに制限し、人数に応じて幅を調整
                  const maxWidth = Math.min(600, window.innerWidth * 0.6)
                  const columnWidth = maxWidth / columns
                  const left = shift._column * columnWidth

                  return (
                    <motion.div
                      key={shift.shift_id || index}
                      drag={editable ? 'y' : false}
                      dragConstraints={{ top: 0, bottom: 0 }}
                      dragElastic={0}
                      dragMomentum={false}
                      onDragEnd={(event, info) => handleDragEnd(shift, event, info)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`absolute rounded-lg shadow-md border-2 overflow-hidden ${
                        editable ? 'hover:shadow-lg' : ''
                      } ${shift.modified_flag ? 'border-yellow-400' : 'border-white'} ${getRoleColor(shift.role).bg}`}
                      style={{
                        top: style.top,
                        height: style.height,
                        left: `${left}px`,
                        width: `${columnWidth - 4}px`,
                        minHeight: '30px',
                        cursor:
                          editable && onShiftClick ? 'pointer' : editable ? 'move' : 'default',
                      }}
                      whileHover={editable ? { scale: 1.02 } : {}}
                      whileDrag={{ scale: 1.05, zIndex: 50 }}
                      onClick={() => {
                        if (editable && onShiftClick) {
                          onShiftClick(shift)
                        }
                      }}
                    >
                      <div className="px-1 py-0.5 h-full text-white relative">
                        <div className="font-bold text-[0.5rem] leading-tight mb-0.5 truncate">
                          {shift.staff_name}
                        </div>
                        {shift.store_id && storesMap[shift.store_id] && (
                          <div className="text-[0.4rem] leading-tight opacity-90 bg-white bg-opacity-20 px-0.5 py-0.5 rounded inline-block mb-0.5">
                            🏪 {storesMap[shift.store_id].store_name}
                          </div>
                        )}
                        <div className="text-[0.45rem] leading-tight opacity-90">{shift.role}</div>
                        <div className="text-[0.45rem] leading-tight mt-0.5 font-medium">
                          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </div>
                        <div className="text-[0.45rem] leading-tight mt-0.5">
                          {shift.actual_hours || shift.planned_hours}h
                        </div>
                        {shift.modified_flag && (
                          <div className="text-[0.4rem] leading-tight mt-0.5 bg-yellow-400 text-yellow-900 px-0.5 py-0.5 rounded inline-block">
                            ⚠️ 変更
                          </div>
                        )}
                        {editable && onDelete && (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleDelete(shift)
                            }}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 hover:bg-red-600 rounded opacity-0 hover:opacity-100 transition-opacity"
                            title="削除"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default ShiftTimeline
