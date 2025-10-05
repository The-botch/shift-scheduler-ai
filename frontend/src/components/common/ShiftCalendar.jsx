import { motion } from 'framer-motion'
import { Star, CheckCircle } from 'lucide-react'

const ShiftCalendar = ({
  shiftData,
  changedDates = new Set(),
  showPreferred = false,
  className = '',
}) => {
  return (
    <div className={className}>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['日', '月', '火', '水', '木', '金', '土'].map(day => (
          <div
            key={day}
            className="p-2 text-center font-bold bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-sm"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {shiftData.map((dayData, index) => (
          <motion.div
            key={dayData.date}
            className={`p-3 border-2 rounded-lg min-h-[120px] transition-all duration-500 ${
              changedDates.has(dayData.date)
                ? 'border-orange-300 bg-orange-50 shadow-lg'
                : 'border-gray-100 bg-white hover:border-blue-200'
            }`}
            animate={
              changedDates.has(dayData.date) ? { scale: [1, 1.05, 1] } : {}
            }
            transition={{ duration: 0.5 }}
          >
            <div className="text-sm font-bold mb-2 text-gray-700 flex items-center justify-between">
              {dayData.date}
              {changedDates.has(dayData.date) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 bg-orange-500 rounded-full"
                />
              )}
            </div>
            {dayData.shifts.map((shift, idx) => (
              <motion.div
                key={idx}
                initial={shift.changed ? { scale: 0, opacity: 0 } : {}}
                animate={shift.changed ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className={`text-xs p-2 rounded mb-1 transition-all ${
                  shift.changed
                    ? 'bg-orange-100 text-orange-800 border border-orange-200 shadow-md'
                    : showPreferred
                      ? shift.preferred
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : shift.skill >= 4
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                }`}
              >
                <div className="font-medium flex items-center">
                  {shift.name}
                  {shift.changed && <Star className="h-3 w-3 ml-1 text-orange-600" />}
                  {showPreferred && shift.preferred && (
                    <CheckCircle className="h-3 w-3 ml-1 text-green-600" />
                  )}
                </div>
                <div className="text-xs opacity-80">{shift.time}</div>
              </motion.div>
            ))}
            {dayData.shifts.length === 0 && (
              <div className="text-xs text-gray-400 italic">休業日</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ShiftCalendar
