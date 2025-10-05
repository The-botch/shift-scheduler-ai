import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ROLE_COLORS, getRoleColor } from '../../config/colors'

const ShiftTimeline = ({ date, shifts, onClose, year, month }) => {
  // 時間範囲（7:00 - 翌3:00）
  const startHour = 7
  const endHour = 27 // 翌日3:00を27:00として扱う
  const hours = []
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h)
  }

  // 時間表示用のラベル
  const getHourLabel = (hour) => {
    if (hour < 24) {
      return `${hour}:00`
    } else {
      return `${hour - 24}:00` // 24時以降は0時、1時...として表示
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

  // 分を時間位置（%）に変換
  const minutesToPosition = (minutes) => {
    const startMinutes = startHour * 60
    const endMinutes = endHour * 60
    const totalMinutes = endMinutes - startMinutes
    return ((minutes - startMinutes) / totalMinutes) * 100
  }

  // シフトブロックのスタイル計算
  const getShiftStyle = (shift) => {
    const startMinutes = timeToMinutes(shift.start_time)
    const endMinutes = timeToMinutes(shift.end_time)
    const duration = endMinutes - startMinutes

    return {
      top: `${minutesToPosition(startMinutes)}%`,
      height: `${(duration / ((endHour - startHour) * 60)) * 100}%`
    }
  }

  // 重なりを検出して列を計算
  const calculateOverlaps = () => {
    const sorted = [...shifts].sort((a, b) =>
      timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
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

  // 凡例用の役職リスト（コンフィグから生成）
  const roleLegend = Object.keys(ROLE_COLORS).map(roleName => ({
    name: roleName,
    color: ROLE_COLORS[roleName].bg
  }))

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
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
              {shifts.length}名のスタッフが勤務 · {columns > 1 ? `最大${columns}名の重なり` : '重なりなし'}
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
                <div
                  key={hour}
                  className="relative h-[60px] border-b border-gray-200"
                >
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
              {hours.map((hour) => (
                <div
                  key={`grid-${hour}`}
                  className="h-[60px] border-b border-gray-200"
                />
              ))}

              {/* シフトブロック */}
              <div className="absolute inset-0">
                {processedShifts.map((shift, index) => {
                  const style = getShiftStyle(shift)
                  const columnWidth = 100 / columns
                  const left = shift._column * columnWidth

                  return (
                    <motion.div
                      key={shift.shift_id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`absolute rounded-lg shadow-md border-2 border-white overflow-hidden ${getRoleColor(shift.role).bg}`}
                      style={{
                        top: style.top,
                        height: style.height,
                        left: `${left}%`,
                        width: `${columnWidth - 1}%`,
                        minHeight: '40px'
                      }}
                    >
                      <div className="p-2 h-full text-white">
                        <div className="font-bold text-sm mb-0.5 truncate">
                          {shift.staff_name}
                        </div>
                        <div className="text-xs opacity-90">
                          {shift.role}
                        </div>
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
