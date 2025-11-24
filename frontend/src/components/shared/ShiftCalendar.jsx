import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { isHoliday, getHolidayName, loadHolidays } from '../../utils/holidays'

/**
 * シフトカレンダー表示用の共通コンポーネント
 * History, DraftShiftEditor, SecondPlanEditorで使用
 */
const ShiftCalendar = ({ year, month, calendarData, onDayClick, storeName }) => {
  // 祝日データを事前に読み込む
  useEffect(() => {
    loadHolidays()
  }, [])

  // calendarDataがnullの場合は空の状態を表示
  if (!calendarData) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div className="text-gray-500 text-center">
          <p className="text-lg mb-2">カレンダーデータがありません</p>
          <p className="text-sm">スタッフ別表示をご利用ください</p>
        </div>
      </div>
    )
  }

  const { daysInMonth, firstDay, shiftsByDate } = calendarData
  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  // 時刻をHH:MM形式にフォーマット
  const formatTime = time => {
    if (!time) return ''
    return time.substring(0, 5)
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 店舗名ヘッダー */}
      <div className="px-2 md:px-3 py-1 bg-blue-50 border-b border-blue-200 rounded-t-lg mb-1 flex-shrink-0">
        <h3 className="text-base md:text-lg font-semibold text-blue-900">
          店舗: {storeName || '全店舗'}
        </h3>
      </div>
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 flex-shrink-0">
        {weekDays.map(day => (
          <div
            key={day}
            className="p-2 md:p-3 text-center text-sm md:text-base font-bold bg-blue-50 rounded"
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 overflow-y-auto flex-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            // 空セル
            return <div key={`empty-${index}`} className="min-h-[60px] md:min-h-[80px]" />
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
              className={`p-2 md:p-3 border rounded cursor-pointer hover:shadow-md transition-shadow ${
                hasModified
                  ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100'
                  : isDayHoliday || isWeekend
                    ? 'bg-red-50 border-red-200 hover:bg-red-100'
                    : 'border-gray-200 hover:bg-gray-50'
              }`}
              style={{ minHeight: '120px' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => dayShifts.length > 0 && onDayClick(day)}
            >
              <div className="flex items-center justify-between mb-0.5">
                <div
                  className={`text-sm md:text-base leading-tight font-bold ${
                    hasModified
                      ? 'text-yellow-700'
                      : isDayHoliday || isWeekend
                        ? 'text-red-600'
                        : 'text-gray-700'
                  }`}
                >
                  {day}
                </div>
                {isDayHoliday && (
                  <div className="text-[0.5rem] md:text-xs text-red-600 font-medium leading-tight">
                    {holidayName}
                  </div>
                )}
              </div>
              {dayShifts.slice(0, 2).map((shift, idx) => (
                <motion.div
                  key={shift.shift_id}
                  className={`text-xs md:text-sm px-1 py-0.5 rounded mb-0.5 ${
                    shift.modified_flag
                      ? 'bg-yellow-200 border border-yellow-400'
                      : 'bg-green-100 border border-green-300'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 + idx * 0.05 }}
                >
                  <div
                    className={`font-medium text-xs md:text-sm leading-tight ${
                      shift.modified_flag ? 'text-yellow-900' : 'text-green-800'
                    }`}
                  >
                    {shift.staff_name}
                  </div>
                  <div
                    className={`text-xs md:text-sm leading-tight ${
                      shift.modified_flag ? 'text-yellow-700' : 'text-green-700'
                    }`}
                  >
                    {formatTime(shift.start_time)}-{formatTime(shift.end_time)}
                  </div>
                </motion.div>
              ))}
              {dayShifts.length > 2 && (
                <div className="text-xs md:text-sm leading-tight text-gray-500">
                  +{dayShifts.length - 2}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default ShiftCalendar
