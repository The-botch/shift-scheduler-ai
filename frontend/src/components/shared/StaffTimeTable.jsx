import { motion } from 'framer-motion'
import { isHoliday, getHolidayName } from '../../utils/holidays'

/**
 * スタッフ別タイムテーブル
 * 縦軸: 日付、横軸: スタッフ
 * 各セルに勤務時間を表示
 */
const StaffTimeTable = ({ year, month, shiftData, staffMap, storeName, onCellClick }) => {
  // 月の日数を計算
  const daysInMonth = new Date(year, month, 0).getDate()
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // 時刻をHH:MM形式にフォーマット
  const formatTime = (time) => {
    if (!time) return ''
    // HH:MM:SS形式の場合、HH:MMだけを取得
    return time.substring(0, 5)
  }

  // 日付とスタッフIDからシフトを検索
  const getShiftForDateAndStaff = (date, staffId) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    return shiftData.find(
      shift =>
        shift.shift_date.startsWith(dateStr) &&
        parseInt(shift.staff_id) === parseInt(staffId)
    )
  }

  // 勤務時間を計算
  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    return Math.abs((endH * 60 + endM - startH * 60 - startM) / 60)
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

  // スタッフリストを取得（staff_idでソート）
  // 該当月にシフトが1つもないスタッフは除外
  const staffList = Object.entries(staffMap)
    .map(([id, info]) => ({ staff_id: parseInt(id), ...info }))
    .filter(staff => {
      // このスタッフが該当月に1つ以上のシフトを持つかチェック
      const { totalDays } = getStaffMonthlyTotal(staff.staff_id)
      return totalDays > 0
    })
    .sort((a, b) => a.staff_id - b.staff_id)

  // 時間帯による色分け
  const getTimeSlotColor = startTime => {
    if (!startTime) return 'bg-gray-100'
    const hour = parseInt(startTime.split(':')[0])
    if (hour < 9) return 'bg-blue-50 border-blue-200' // 早番
    if (hour < 12) return 'bg-green-50 border-green-200' // 中番
    return 'bg-orange-50 border-orange-200' // 遅番
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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200">
      {/* 店舗名ヘッダー */}
      <div className="px-2 py-0.5 bg-blue-50 border-b border-blue-200 flex-shrink-0">
        <h3 className="text-[0.65rem] font-semibold text-blue-900">店舗: {storeName || '全店舗'}</h3>
      </div>

      {/* テーブルヘッダー（固定） */}
      <div className="overflow-x-auto flex-shrink-0 border-b-2 border-gray-300">
        <table className="w-full border-collapse text-[0.6rem]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '30px' }} />
            <col style={{ width: '15px' }} />
            {staffList.map(staff => (
              <col key={staff.staff_id} style={{ width: '38px' }} />
            ))}
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-0 py-0.5 text-center font-semibold text-gray-700 border-b border-r-2 border-gray-300">
                日付
              </th>
              <th className="px-0 py-0.5 text-center font-semibold text-gray-700 border-b border-r-2 border-gray-300 bg-gray-100">
                日別
              </th>
              {staffList.map(staff => (
                <th
                  key={staff.staff_id}
                  className="px-0 py-0.5 text-center font-semibold text-gray-700 border-b border-r border-gray-200"
                >
                  <div className="text-[0.55rem] leading-tight">{staff.name}</div>
                  <div className="text-[0.45rem] text-gray-500 font-normal leading-tight">{staff.role_name}</div>
                </th>
              ))}
            </tr>
            {/* 月間合計行 */}
            <tr className="bg-gray-100 font-semibold">
              <td className="px-0 py-0.5 border-r-2 border-gray-300 text-center text-gray-700">月合計</td>
              <td className="px-0 py-0.5 border-r-2 border-gray-300 text-center bg-gray-100"></td>
              {staffList.map(staff => {
                const { totalDays, totalHours } = getStaffMonthlyTotal(staff.staff_id)
                return (
                  <td
                    key={staff.staff_id}
                    className="px-0.5 py-0.5 border-r border-gray-200 text-center"
                  >
                    <div className="text-gray-800 text-[0.5rem] leading-tight">{totalDays}日 {totalHours.toFixed(1)}h</div>
                  </td>
                )
              })}
            </tr>
          </thead>
        </table>
      </div>

      {/* テーブルボディ（スクロール可能） */}
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full border-collapse text-[0.6rem]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '30px' }} />
            <col style={{ width: '15px' }} />
            {staffList.map(staff => (
              <col key={staff.staff_id} style={{ width: '38px' }} />
            ))}
          </colgroup>
          <tbody>
          {dates.map((date, index) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
            const holiday = isHoliday(year, month, date)
            const holidayName = getHolidayName(year, month, date)
            const weekday = getWeekday(date)
            const dailyTotal = getDailyTotal(date)
            const isWeekend = weekday === '日' || weekday === '土'
            const rowBgColor = holiday || isWeekend ? 'bg-red-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-25'

            return (
              <tr key={date} className={rowBgColor}>
                {/* 日付セル */}
                <td className="px-1 py-0.5 border-r-2 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-0.5">
                    <span className={`font-bold text-[0.85rem] leading-tight ${getWeekdayColor(date)}`}>
                      {date}({weekday})
                    </span>
                    {holiday && (
                      <span className="text-[0.5rem] text-red-600 font-medium leading-tight">{holidayName}</span>
                    )}
                  </div>
                </td>

                {/* 日別合計セル */}
                <td className="px-1 py-0.5 border-r-2 border-b border-gray-200 text-center bg-gray-50">
                  <div className="font-semibold text-gray-800 text-[0.5rem] leading-tight">{dailyTotal.staffCount}名 {dailyTotal.totalHours.toFixed(1)}h</div>
                </td>

                {/* スタッフごとのシフトセル */}
                {staffList.map(staff => {
                  const shift = getShiftForDateAndStaff(date, staff.staff_id)
                  const hours = shift ? calculateHours(shift.start_time, shift.end_time) : 0

                  return (
                    <td
                      key={staff.staff_id}
                      className="px-0.5 py-0.5 border-r border-b border-gray-200 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => onCellClick && onCellClick(date, staff.staff_id, shift)}
                    >
                      {shift ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`px-0.5 py-0.5 rounded border ${getTimeSlotColor(shift.start_time)} ${
                            shift.modified_flag ? 'ring-1 ring-yellow-400' : ''
                          }`}
                        >
                          <div className="font-semibold text-gray-800 text-[0.5rem] leading-tight">
                            {formatTime(shift.start_time)}-{formatTime(shift.end_time)}
                          </div>
                          <div className="text-[0.45rem] text-gray-600 leading-tight">{hours.toFixed(1)}h</div>
                        </motion.div>
                      ) : (
                        <div className="text-gray-400 text-[0.45rem] leading-tight">休</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StaffTimeTable
