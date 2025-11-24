import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { isHoliday, getHolidayName } from '../../utils/holidays'

const MobileShiftCalendar = ({ year, month, selectedDates = [], onDateToggle }) => {
  const [currentMonth, setCurrentMonth] = useState(month)
  const [currentYear, setCurrentYear] = useState(year)

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()
  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleDateClick = date => {
    if (onDateToggle) {
      onDateToggle(currentYear, currentMonth, date)
    }
  }

  const isSelected = date => {
    return selectedDates.some(
      d => d.year === currentYear && d.month === currentMonth && d.date === date
    )
  }

  // カレンダーグリッド用の配列を作成
  const calendarDays = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <Card className="p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={prevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold">
          {currentYear}年{currentMonth}月
        </h2>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs font-bold py-1 ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : ''
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const selected = isSelected(day)
          const dayOfWeek = (firstDay + day - 1) % 7
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
          const isDayHoliday = isHoliday(currentYear, currentMonth, day)
          const holidayName = getHolidayName(currentYear, currentMonth, day)

          return (
            <motion.button
              key={day}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square rounded-lg border-2 text-sm font-medium
                transition-all relative
                ${
                  selected
                    ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
                    : 'bg-white border-gray-200 hover:bg-gray-50 active:bg-gray-100'
                }
                ${isWeekend && !selected ? 'text-gray-400' : ''}
                ${isDayHoliday && !selected ? 'bg-red-50 text-red-600' : ''}
              `}
              title={holidayName || ''}
            >
              {day}
              {isDayHoliday && !selected && (
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="h-1 bg-red-400 rounded-b-md"></div>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* 選択数表示 */}
      {selectedDates.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">{selectedDates.length}日選択中</div>
      )}
    </Card>
  )
}

export default MobileShiftCalendar
