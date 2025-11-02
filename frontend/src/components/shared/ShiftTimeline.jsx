import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ROLE_COLORS, getRoleColor } from '../../config/colors'

const ShiftTimeline = ({ date, shifts, onClose, year, month, editable = false, onUpdate, onDelete }) => {
  const [selectedShift, setSelectedShift] = useState(null)
  // 時間範囲（7:00 - 翌3:00）
  const startHour = 7
  const endHour = 27 // 翌日3:00を27:00として扱う
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

  // 時間を分に変換（深夜営業対応）
  const timeToMinutes = timeStr => {
    const [hour, minute] = timeStr.split(':').map(Number)
    // 0-6時は翌日として扱う（24-30時として計算）
    let actualHour = hour
    if (hour >= 0 && hour < 7) {
      actualHour = hour + 24
    }
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

    // 15分単位に丸める
    const roundedStartMinutes = Math.round(newStartMinutes / 15) * 15
    const roundedEndMinutes = Math.round(newEndMinutes / 15) * 15

    // 時間文字列に変換
    const newStartTime = minutesToTimeString(roundedStartMinutes)
    const newEndTime = minutesToTimeString(roundedEndMinutes)

    // 更新を実行
    if (newStartTime !== shift.start_time || newEndTime !== shift.end_time) {
      onUpdate(shift.shift_id, {
        start_time: newStartTime,
        end_time: newEndTime
      })
    }

    // 選択解除
    shift._currentTop = null
  }

  // 削除ハンドラー
  const handleDelete = (shift) => {
    if (!editable || !onDelete) return

    if (confirm(`${shift.staff_name}のシフト（${shift.start_time}-${shift.end_time}）を削除しますか？`)) {
      onDelete(shift.shift_id)
    }
  }

  // 凡例用の役職リスト（コンフィグから生成）
  const roleLegend = Object.keys(ROLE_COLORS).map(roleName => ({
    name: roleName,
    color: ROLE_COLORS[roleName].bg,
  }))

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="border-b bg-gray-50 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {year}年{month}月{date}日のシフト詳細
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-600">
              {shifts.length}名のスタッフが勤務 ·{' '}
              {columns > 1 ? `最大${columns}名の重なり` : '重なりなし'}
            </p>
            {/* 凡例 */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">役職:</span>
              {roleLegend.map(role => (
                <div key={role.name} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded ${role.color}`}></div>
                  <span className="text-xs text-gray-700">{role.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* スクロール可能なコンテンツエリア */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex" style={{ height: '1260px' }}>
            {/* 時間軸（左側） */}
            <div className="w-20 flex-shrink-0 border-r bg-gray-50">
              {hours.map((hour, index) => (
                <div key={hour} className="relative h-[60px] border-b border-gray-200">
                  <div className="absolute -top-2 left-2 text-xs font-medium text-gray-600">
                    {getHourLabel(hour)}
                  </div>
                  {/* 30分の補助線 */}
                  <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-gray-300" />
                </div>
              ))}
            </div>

            {/* シフトブロック（右側） */}
            <div className="flex-1 relative">
              {/* 時間グリッド背景 */}
              {hours.map(hour => (
                <div key={`grid-${hour}`} className="h-[60px] border-b border-gray-200" />
              ))}

              {/* シフトブロック */}
              <div className="absolute inset-0 shift-container">
                {processedShifts.map((shift, index) => {
                  const style = getShiftStyle(shift)
                  const columnWidth = 100 / columns
                  const left = shift._column * columnWidth

                  return (
                    <motion.div
                      key={shift.shift_id || index}
                      drag={editable ? "y" : false}
                      dragConstraints={{ top: 0, bottom: 0 }}
                      dragElastic={0}
                      dragMomentum={false}
                      onDragEnd={(event, info) => handleDragEnd(shift, event, info)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`absolute rounded-lg shadow-md border-2 overflow-hidden ${
                        editable ? 'cursor-move hover:shadow-lg' : ''
                      } ${shift.modified_flag ? 'border-yellow-400' : 'border-white'} ${getRoleColor(shift.role).bg}`}
                      style={{
                        top: style.top,
                        height: style.height,
                        left: `${left}%`,
                        width: `${columnWidth - 1}%`,
                        minHeight: '40px',
                      }}
                      whileHover={editable ? { scale: 1.02 } : {}}
                      whileDrag={{ scale: 1.05, zIndex: 50 }}
                    >
                      <div className="p-2 h-full text-white relative">
                        <div className="font-bold text-sm mb-0.5 truncate">{shift.staff_name}</div>
                        <div className="text-xs opacity-90">{shift.role}</div>
                        <div className="text-xs mt-1 font-medium">
                          {shift.start_time} - {shift.end_time}
                        </div>
                        <div className="text-xs mt-0.5">
                          {shift.actual_hours || shift.planned_hours}h
                        </div>
                        {shift.modified_flag && (
                          <div className="text-xs mt-1 bg-yellow-400 text-yellow-900 px-1 py-0.5 rounded inline-block">
                            ⚠️ 変更
                          </div>
                        )}
                        {editable && onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(shift)
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded opacity-0 hover:opacity-100 transition-opacity"
                            title="削除"
                          >
                            <Trash2 className="h-3 w-3" />
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
}

export default ShiftTimeline
