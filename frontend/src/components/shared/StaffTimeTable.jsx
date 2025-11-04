import { motion } from 'framer-motion'
import { isHoliday, getHolidayName } from '../../utils/holidays'

/**
 * スタッフ別タイムテーブル
 * 縦軸: 日付、横軸: スタッフ
 * 各セルに勤務時間を表示
 */
const StaffTimeTable = ({ year, month, shiftData, staffMap, onCellClick }) => {
  // 月の日数を計算
  const daysInMonth = new Date(year, month, 0).getDate()
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // スタッフリストを取得（staff_idでソート）
  const staffList = Object.entries(staffMap)
    .map(([id, info]) => ({ staff_id: parseInt(id), ...info }))
    .sort((a, b) => a.staff_id - b.staff_id)

  // 日付とスタッフIDからシフトを検索
  const getShiftForDateAndStaff = (date, staffId) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    return shiftData.find(
      shift =>
        shift.shift_date.startsWith(dateStr) &&
        parseInt(shift.staff_id) === parseInt(staffId)
    )
  }

  // 時間帯による色分け
  const getTimeSlotColor = startTime => {
    if (!startTime) return 'bg-gray-100'
    const hour = parseInt(startTime.split(':')[0])
    if (hour < 9) return 'bg-blue-50 border-blue-200' // 早番
    if (hour < 12) return 'bg-green-50 border-green-200' // 中番
    return 'bg-orange-50 border-orange-200' // 遅番
  }

  // 勤務時間を計算
  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    return (endH * 60 + endM - startH * 60 - startM) / 60
  }

  // スタッフごとの月間合計を計算
  const getStaffMonthlyTotal = staffId => {
    let totalDays = 0
    let totalHours = 0
    dates.forEach(date => {
      const shift = getShiftForDateAndStaff(date, staffId)
      if (shift) {
        totalDays++
        totalHours += calculateHours(shift.start_time, shift.end_time)
      }
    })
    return { totalDays, totalHours }
  }

  // 日付ごとの合計を計算
  const getDailyTotal = date => {
    let staffCount = 0
    let totalHours = 0
    staffList.forEach(staff => {
      const shift = getShiftForDateAndStaff(date, staff.staff_id)
      if (shift) {
        staffCount++
        totalHours += calculateHours(shift.start_time, shift.end_time)
      }
    })
    return { staffCount, totalHours }
  }

  // 曜日を取得
  const getWeekday = date => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const d = new Date(year, month - 1, date)
    return weekdays[d.getDay()]
  }

  // 曜日の色
  const getWeekdayColor = date => {
    const d = new Date(year, month - 1, date)
    const day = d.getDay()
    if (day === 0) return 'text-red-600' // 日曜
    if (day === 6) return 'text-blue-600' // 土曜
    return 'text-gray-700'
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
        <table className="w-full border-collapse text-xs">
        <colgroup>
          <col style={{ width: '80px' }} />
          {staffList.map(staff => (
            <col key={staff.staff_id} style={{ minWidth: '100px' }} />
          ))}
          <col style={{ width: '100px' }} />
        </colgroup>

        {/* ヘッダー: スタッフ名 */}
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b-2 border-r-2 border-gray-300">
              日付
            </th>
            {staffList.map(staff => (
              <th
                key={staff.staff_id}
                className="px-2 py-3 text-center font-semibold text-gray-700 border-b-2 border-r border-gray-200"
              >
                <div className="text-sm">{staff.name}</div>
                <div className="text-xs text-gray-500 font-normal">{staff.role_name}</div>
              </th>
            ))}
            <th className="px-3 py-3 text-center font-semibold text-gray-700 border-b-2 border-gray-300 bg-gray-100">
              合計
            </th>
          </tr>
        </thead>

        {/* ボディ: 日付ごとの行 */}
        <tbody>
          {dates.map((date, index) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
            const holiday = isHoliday(dateStr)
            const holidayName = getHolidayName(dateStr)
            const weekday = getWeekday(date)
            const dailyTotal = getDailyTotal(date)
            const isWeekend = weekday === '日' || weekday === '土'
            const rowBgColor = holiday || isWeekend ? 'bg-red-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-25'

            return (
              <tr key={date} className={rowBgColor}>
                {/* 日付セル */}
                <td className="px-3 py-2 border-r-2 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${getWeekdayColor(date)}`}>
                      {date}({weekday})
                    </span>
                    {holiday && (
                      <span className="text-xs text-red-600 font-medium">{holidayName}</span>
                    )}
                  </div>
                </td>

                {/* スタッフごとのシフトセル */}
                {staffList.map(staff => {
                  const shift = getShiftForDateAndStaff(date, staff.staff_id)
                  const hours = shift ? calculateHours(shift.start_time, shift.end_time) : 0

                  return (
                    <td
                      key={staff.staff_id}
                      className="px-2 py-2 border-r border-b border-gray-200 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => onCellClick && onCellClick(date, staff.staff_id, shift)}
                    >
                      {shift ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`p-1.5 rounded border ${getTimeSlotColor(shift.start_time)} ${
                            shift.modified_flag ? 'ring-2 ring-yellow-400' : ''
                          }`}
                        >
                          <div className="font-semibold text-gray-800">
                            {shift.start_time}-{shift.end_time}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">{hours.toFixed(1)}h</div>
                        </motion.div>
                      ) : (
                        <div className="text-gray-400 text-xs py-3">休</div>
                      )}
                    </td>
                  )
                })}

                {/* 日別合計セル */}
                <td className="px-3 py-2 border-b border-gray-300 text-center bg-gray-50">
                  <div className="font-semibold text-gray-800">{dailyTotal.staffCount}名</div>
                  <div className="text-xs text-gray-600">{dailyTotal.totalHours.toFixed(1)}h</div>
                </td>
              </tr>
            )
          })}

          {/* 月間合計行 */}
          <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
            <td className="px-3 py-3 border-r-2 border-gray-300 text-gray-700">合計</td>
            {staffList.map(staff => {
              const { totalDays, totalHours } = getStaffMonthlyTotal(staff.staff_id)
              return (
                <td
                  key={staff.staff_id}
                  className="px-2 py-3 border-r border-gray-200 text-center"
                >
                  <div className="text-gray-800">{totalDays}日</div>
                  <div className="text-xs text-gray-600">{totalHours.toFixed(1)}h</div>
                </td>
              )
            })}
            <td className="px-3 py-3 border-gray-300 text-center bg-gray-100"></td>
          </tr>
        </tbody>
      </table>
      </div>

      {/* 凡例 */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-4 text-xs flex-wrap">
        <span className="font-semibold text-gray-700">時間帯:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
          <span className="text-gray-600">早番(&lt;9:00)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
          <span className="text-gray-600">中番(9:00-12:00)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-orange-50 border border-orange-200 rounded"></div>
          <span className="text-gray-600">遅番(12:00~)</span>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
          <span className="text-gray-600">変更あり</span>
        </div>
      </div>
    </div>
  )
}

export default StaffTimeTable
