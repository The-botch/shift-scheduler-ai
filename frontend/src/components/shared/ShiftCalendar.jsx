import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { isHoliday, getHolidayName, loadHolidays } from '../../utils/holidays'

/**
 * シフトカレンダー表示用の共通コンポーネント
 * History, DraftShiftEditor, SecondPlanEditorで使用
 */
const ShiftCalendar = ({ year, month, calendarData, onDayClick }) => {
  const { daysInMonth, firstDay, shiftsByDate } = calendarData
  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  // 祝日データを事前に読み込む
  useEffect(() => {
    loadHolidays()
  }, [])

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
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="p-1 text-center text-xs font-bold bg-blue-50 rounded">
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            // 空セル
            return <div key={`empty-${index}`} style={{ minHeight: '80px', maxHeight: '120px' }} />
          }

          const dayShifts = shiftsByDate[day] || []
          const dayOfWeek = (firstDay + day - 1) % 7
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
          const isDayHoliday = isHoliday(year, month, day)
          const holidayName = getHolidayName(year, month, day)
          const hasModified = dayShifts.some(s => s.modified_flag)

          return (
            <motion.div
              key={day}
              className={`p-1 border rounded cursor-pointer hover:shadow-md transition-shadow ${
                hasModified
                  ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100'
                  : isDayHoliday || isWeekend
                    ? 'bg-red-50 border-red-200 hover:bg-red-100'
                    : 'border-gray-200 hover:bg-gray-50'
              }`}
              style={{ minHeight: '80px', maxHeight: '120px' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => dayShifts.length > 0 && onDayClick(day)}
            >
              <div className="flex items-center justify-between mb-0.5">
                <div
                  className={`text-xs font-bold ${
                    hasModified ? 'text-yellow-700' : isDayHoliday || isWeekend ? 'text-red-600' : 'text-gray-700'
                  }`}
                >
                  {day}
                </div>
                {isDayHoliday && (
                  <div className="text-[0.5rem] text-red-600 font-medium leading-tight">
                    {holidayName}
                  </div>
                )}
              </div>
              {dayShifts.slice(0, 2).map((shift, idx) => (
                <motion.div
                  key={shift.shift_id}
                  className={`text-xs p-0.5 rounded mb-0.5 ${
                    shift.modified_flag
                      ? 'bg-yellow-200 border border-yellow-400'
                      : 'bg-green-100 border border-green-300'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 + idx * 0.05 }}
                >
                  <div
                    className={`font-medium text-xs leading-tight ${
                      shift.modified_flag ? 'text-yellow-900' : 'text-green-800'
                    }`}
                  >
                    {shift.staff_name}
                  </div>
                  <div
                    className={`text-xs ${
                      shift.modified_flag ? 'text-yellow-700' : 'text-green-700'
                    }`}
                  >
                    {shift.start_time}-{shift.end_time}
                  </div>
                </motion.div>
              ))}
              {dayShifts.length > 2 && (
                <div className="text-xs text-gray-500">+{dayShifts.length - 2}</div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 bg-green-100 border border-green-300 rounded mr-1.5"></div>
          <span>配置済み</span>
        </div>
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 bg-yellow-200 border border-yellow-400 rounded mr-1.5"></div>
          <span>修正あり</span>
        </div>
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 bg-red-50 border border-red-200 rounded mr-1.5"></div>
          <span>土日・祝日</span>
        </div>
      </div>
    </div>
  )
}

export default ShiftCalendar
