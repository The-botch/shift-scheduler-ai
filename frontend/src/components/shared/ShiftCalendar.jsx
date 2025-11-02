import { motion } from 'framer-motion'

/**
 * シフトカレンダー表示用の共通コンポーネント
 * History, DraftShiftEditor, SecondPlanEditorで使用
 */
const ShiftCalendar = ({ year, month, calendarData, onDayClick }) => {
  const { daysInMonth, firstDay, shiftsByDate } = calendarData
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
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="p-1 text-center text-xs font-bold bg-primary-50 rounded">
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            // 空セル
            return <div key={`empty-${index}`} className="min-h-[60px]" />
          }

          const dayShifts = shiftsByDate[day] || []
          const dayOfWeek = (firstDay + day - 1) % 7
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
          const hasModified = dayShifts.some(s => s.modified_flag)

          return (
            <motion.div
              key={day}
              className={`p-1 border rounded min-h-[60px] cursor-pointer hover:shadow-md transition-shadow ${
                hasModified
                  ? 'bg-warning-50 border-warning-300 hover:bg-warning-100'
                  : isWeekend
                    ? 'bg-primary-50 border-primary-200 hover:bg-primary-100'
                    : 'border-neutral-200 hover:bg-neutral-50'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => dayShifts.length > 0 && onDayClick(day)}
            >
              <div
                className={`text-xs font-bold mb-0.5 ${
                  hasModified ? 'text-warning-700' : 'text-neutral-700'
                }`}
              >
                {day}
              </div>
              {dayShifts.slice(0, 2).map((shift, idx) => (
                <motion.div
                  key={shift.shift_id}
                  className={`text-xs p-0.5 rounded mb-0.5 ${
                    shift.modified_flag
                      ? 'bg-warning-200 border border-warning-400'
                      : 'bg-success-100 border border-success-300'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 + idx * 0.05 }}
                >
                  <div
                    className={`font-medium text-xs leading-tight ${
                      shift.modified_flag ? 'text-warning-900' : 'text-success-800'
                    }`}
                  >
                    {shift.staff_name}
                  </div>
                  <div
                    className={`text-xs ${
                      shift.modified_flag ? 'text-warning-700' : 'text-success-700'
                    }`}
                  >
                    {shift.start_time}-{shift.end_time}
                  </div>
                </motion.div>
              ))}
              {dayShifts.length > 2 && (
                <div className="text-xs text-neutral-500">+{dayShifts.length - 2}</div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary-50 border border-primary-200 rounded"></div>
          <span>土日</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-warning-50 border border-warning-300 rounded"></div>
          <span>変更あり</span>
        </div>
      </div>
    </div>
  )
}

export default ShiftCalendar
