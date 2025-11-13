import React, { useRef } from 'react'
import { isHoliday, getHolidayName } from '../../utils/holidays'
import { getDaysInMonth, getDayOfWeek } from '../../utils/dateUtils'

/**
 * マルチストアシフトテーブル（読み取り専用）
 * 縦軸: 日付、横軸: 店舗別グループ化されたスタッフ
 * 各セルに勤務時間を表示（応援勤務の場合は店舗コードも表示）
 */
const MultiStoreShiftTable = ({
  year,
  month,
  shiftData,
  staffMap,
  storesMap,
  selectedStores, // 選択された店舗IDのSet
  onDayClick,
  conflicts = [], // 希望シフトとの不一致情報
  onConflictClick, // conflictセルがクリックされたときのコールバック
}) => {
  const headerScrollRef = useRef(null)
  const bodyScrollRef = useRef(null)

  // ヘッダーとボディのスクロールを同期
  const handleHeaderScroll = (e) => {
    if (bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = e.target.scrollLeft
    }
  }

  const handleBodyScroll = (e) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.target.scrollLeft
    }
  }

  // 月の日数を計算（JST対応）
  const daysInMonth = getDaysInMonth(year, month)
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // 時刻をHH:MM形式にフォーマット
  const formatTime = (time) => {
    if (!time) return ''
    return time.substring(0, 5)
  }

  // 店舗IDから店舗コードを取得
  const getStoreCode = (storeId) => {
    if (!storesMap || !storeId) return ''
    const store = storesMap[storeId]
    return store ? store.store_code : ''
  }

  // 店舗IDから店舗名を取得
  const getStoreName = (storeId) => {
    if (!storesMap || !storeId) return ''
    const store = storesMap[storeId]
    return store ? store.store_name : ''
  }

  // 日付とスタッフIDからシフトを検索
  const getShiftForDateAndStaff = (date, staffId) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    return shiftData.find(
      shift =>
        shift.shift_date &&
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

  // スタッフごとの月間合計を計算（選択された店舗のシフトのみ）
  const getStaffMonthlyTotal = staffId => {
    let totalDays = 0
    let totalHours = 0
    dates.forEach(date => {
      const shift = getShiftForDateAndStaff(date, staffId)
      // シフトがあり、かつそのシフトの店舗が選択されている場合のみカウント
      if (shift && selectedStores && selectedStores.size > 0 && selectedStores.has(parseInt(shift.store_id))) {
        totalDays++
        totalHours += calculateHours(shift.start_time, shift.end_time)
      }
    })
    return { totalDays, totalHours }
  }

  // スタッフリストを取得（全スタッフを常に表示）
  const allStaff = Object.entries(staffMap)
    .map(([id, info]) => ({ staff_id: parseInt(id), ...info }))
    .filter(staff => staff.is_active !== false) // 在籍中のスタッフのみ
    .sort((a, b) => a.staff_id - b.staff_id)

  // 店舗ごとにスタッフをグループ化（全店舗・全スタッフ）
  const storeGroups = []
  const storeIdSet = new Set(allStaff.map(s => s.store_id))

  // 店舗IDでソート（店舗名順）
  const sortedStoreIds = Array.from(storeIdSet).sort((a, b) => {
    const nameA = getStoreName(a) || ''
    const nameB = getStoreName(b) || ''
    return nameA.localeCompare(nameB, 'ja')
  })

  sortedStoreIds.forEach(storeId => {
    // 選択されている店舗のみ表示
    if (selectedStores && selectedStores.has(parseInt(storeId))) {
      const staffInStore = allStaff.filter(s => parseInt(s.store_id) === parseInt(storeId))
      if (staffInStore.length > 0) {
        storeGroups.push({
          storeId,
          storeName: getStoreName(storeId),
          staff: staffInStore
        })
      }
    }
  })

  // 日付と店舗IDから、その店舗の日別サマリーを計算
  const getStoreDailySummary = (date, storeId) => {
    let staffCount = 0
    let totalHours = 0

    // 全スタッフをチェック（所属に関係なく、その店舗で勤務している人をカウント）
    allStaff.forEach(staff => {
      const shift = getShiftForDateAndStaff(date, staff.staff_id)
      // シフトがあり、その店舗のシフトで、選択されている場合のみカウント
      if (shift && parseInt(shift.store_id) === parseInt(storeId) &&
          selectedStores && selectedStores.size > 0 && selectedStores.has(parseInt(shift.store_id))) {
        staffCount++
        totalHours += calculateHours(shift.start_time, shift.end_time)
      }
    })

    return { staffCount, totalHours }
  }

  // 日付の全体サマリーを計算（選択された全店舗の合計）
  const getOverallDailySummary = (date) => {
    let staffCount = 0
    let totalHours = 0

    allStaff.forEach(staff => {
      const shift = getShiftForDateAndStaff(date, staff.staff_id)
      // シフトがあり、かつそのシフトの店舗が選択されている場合のみカウント
      if (shift && selectedStores && selectedStores.size > 0 && selectedStores.has(parseInt(shift.store_id))) {
        staffCount++
        totalHours += calculateHours(shift.start_time, shift.end_time)
      }
    })

    return { staffCount, totalHours }
  }

  // 全体の月間合計を計算
  const getOverallMonthlyTotal = () => {
    let totalDays = 0
    let totalHours = 0

    dates.forEach(date => {
      allStaff.forEach(staff => {
        const shift = getShiftForDateAndStaff(date, staff.staff_id)
        // シフトがあり、かつそのシフトの店舗が選択されている場合のみカウント
        if (shift && selectedStores && selectedStores.size > 0 && selectedStores.has(parseInt(shift.store_id))) {
          totalDays++
          totalHours += calculateHours(shift.start_time, shift.end_time)
        }
      })
    })

    return { totalDays, totalHours }
  }

  // 店舗の月間合計を計算
  const getStoreMonthlyTotal = (storeId) => {
    let totalDays = 0
    let totalHours = 0

    dates.forEach(date => {
      // 全スタッフをチェック（所属に関係なく、その店舗で勤務している人をカウント）
      allStaff.forEach(staff => {
        const shift = getShiftForDateAndStaff(date, staff.staff_id)
        // シフトがあり、その店舗のシフトで、選択されている場合のみカウント
        if (shift && parseInt(shift.store_id) === parseInt(storeId) &&
            selectedStores && selectedStores.size > 0 && selectedStores.has(parseInt(shift.store_id))) {
          totalDays++
          totalHours += calculateHours(shift.start_time, shift.end_time)
        }
      })
    })

    return { totalDays, totalHours }
  }

  // 特定の日付とスタッフに対してconflictを取得
  const getConflict = (date, staffId) => {
    const conflict = conflicts.find(c => {
      const dateMatch = c.date === date
      const staffMatch = parseInt(c.staffId) === parseInt(staffId)
      if (dateMatch && !staffMatch && date === 29) {
        console.log('29日のconflict staffId不一致:', { conflictStaffId: c.staffId, tableStaffId: staffId, conflict: c })
      }
      return dateMatch && staffMatch
    })
    if (date === 29 && conflict) {
      console.log('29日のconflict見つかった:', { date, staffId, conflict })
    }
    return conflict
  }

  // 時間帯による色分け（conflictがある場合は赤色を優先）
  const getTimeSlotColor = (startTime, date, staffId) => {
    if (getConflict(date, staffId)) {
      return 'bg-red-100 border-red-400'
    }
    if (!startTime) return 'bg-gray-100'
    const hour = parseInt(startTime.split(':')[0])
    if (hour < 9) return 'bg-blue-50 border-blue-200'
    if (hour < 12) return 'bg-green-50 border-green-200'
    return 'bg-orange-50 border-orange-200'
  }

  // 曜日を取得（JST対応）
  const getWeekday = date => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const dayOfWeek = getDayOfWeek(year, month, date)
    return weekdays[dayOfWeek]
  }

  // 曜日の色（JST対応）
  const getWeekdayColor = date => {
    const dayOfWeek = getDayOfWeek(year, month, date)
    if (dayOfWeek === 0) return 'text-red-600'
    if (dayOfWeek === 6) return 'text-blue-600'
    return 'text-gray-700'
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200">
      {/* テーブルヘッダー（固定） */}
      <div
        ref={headerScrollRef}
        onScroll={handleHeaderScroll}
        className="overflow-x-auto flex-shrink-0 border-b-2 border-gray-300"
      >
        <table className="w-full border-collapse text-[0.6rem]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '80px' }} />
            <col style={{ width: '60px' }} />
            {storeGroups.map(group => (
              <React.Fragment key={group.storeId}>
                <col style={{ width: '60px' }} />
                {group.staff.map(staff => (
                  <col key={staff.staff_id} style={{ width: '70px' }} />
                ))}
              </React.Fragment>
            ))}
          </colgroup>
          <thead className="bg-gray-50">
            {/* 1行目: 店舗名 */}
            <tr>
              <th rowSpan={2} className="px-0 py-0.5 text-center font-semibold text-gray-700 border-b border-r-2 border-gray-300">
                日付
              </th>
              <th rowSpan={2} className="px-0 py-0.5 text-center font-semibold text-gray-700 border-b border-r-2 border-gray-400 bg-blue-100">
                <div className="text-[0.65rem] leading-tight">📊全体</div>
              </th>
              {storeGroups.map(group => (
                <th
                  key={group.storeId}
                  colSpan={1 + group.staff.length}
                  className="px-1 py-0.5 text-center font-bold text-gray-800 border-b border-r-2 border-gray-400 bg-blue-50"
                >
                  <div className="text-[0.65rem] leading-tight">🏪{group.storeName}</div>
                </th>
              ))}
            </tr>
            {/* 2行目: サマリー + スタッフ名 */}
            <tr>
              {storeGroups.map(group => (
                <React.Fragment key={group.storeId}>
                  <th className="px-0 py-0.5 text-center font-semibold text-gray-700 border-b border-r border-gray-300 bg-gray-100">
                    <div className="text-[0.5rem] leading-tight">Σ{group.storeName}</div>
                  </th>
                  {group.staff.map(staff => (
                    <th
                      key={staff.staff_id}
                      className="px-0 py-0.5 text-center font-semibold text-gray-700 border-b border-r border-gray-200"
                    >
                      <div className="text-[0.55rem] leading-tight">{staff.name}</div>
                      <div className="text-[0.45rem] text-gray-500 font-normal leading-tight">{staff.role_name}</div>
                    </th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
            {/* 月間合計行 */}
            <tr className="bg-gray-100 font-semibold">
              <td className="px-0 py-0.5 border-r-2 border-gray-300 text-center text-gray-700">月合計</td>
              {(() => {
                const overallMonthly = getOverallMonthlyTotal()
                return (
                  <td className="px-0.5 py-0.5 border-r-2 border-gray-400 text-center bg-blue-100">
                    <div className="text-gray-800 text-[0.5rem] leading-tight">{overallMonthly.totalDays}名</div>
                    <div className="text-gray-800 text-[0.5rem] leading-tight">{overallMonthly.totalHours.toFixed(1)}h</div>
                  </td>
                )
              })()}
              {storeGroups.map(group => {
                const storeMonthly = getStoreMonthlyTotal(group.storeId)
                return (
                  <React.Fragment key={group.storeId}>
                    <td className="px-0.5 py-0.5 border-r border-gray-300 text-center bg-gray-100">
                      <div className="text-gray-800 text-[0.5rem] leading-tight">{storeMonthly.totalDays}名</div>
                      <div className="text-gray-800 text-[0.5rem] leading-tight">{storeMonthly.totalHours.toFixed(1)}h</div>
                    </td>
                    {group.staff.map(staff => {
                      const { totalDays, totalHours } = getStaffMonthlyTotal(staff.staff_id)
                      return (
                        <td
                          key={staff.staff_id}
                          className="px-0.5 py-0.5 border-r border-gray-200 text-center"
                        >
                          <div className="text-gray-800 text-[0.5rem] leading-tight">{totalHours.toFixed(1)}h</div>
                        </td>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </tr>
          </thead>
        </table>
      </div>

      {/* テーブルボディ（スクロール可能） */}
      <div
        ref={bodyScrollRef}
        onScroll={handleBodyScroll}
        className="overflow-x-auto overflow-y-auto flex-1"
      >
        <table className="w-full border-collapse text-[0.6rem]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '80px' }} />
            <col style={{ width: '60px' }} />
            {storeGroups.map(group => (
              <React.Fragment key={group.storeId}>
                <col style={{ width: '60px' }} />
                {group.staff.map(staff => (
                  <col key={staff.staff_id} style={{ width: '70px' }} />
                ))}
              </React.Fragment>
            ))}
          </colgroup>
          <tbody>
          {dates.map((date, index) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
            const holiday = isHoliday(year, month, date)
            const holidayName = getHolidayName(year, month, date)
            const weekday = getWeekday(date)
            const overallSummary = getOverallDailySummary(date)
            const rowBgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-25'

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

                {/* 全体サマリーセル */}
                <td className="px-1 py-0.5 border-r-2 border-b border-gray-400 text-center bg-blue-50 cursor-pointer hover:bg-blue-100">
                  <div className="font-semibold text-gray-800 text-[0.5rem] leading-tight">
                    {overallSummary.staffCount}名 {overallSummary.totalHours.toFixed(1)}h
                  </div>
                </td>

                {/* 店舗ごとのグループ */}
                {storeGroups.map(group => {
                  const storeSummary = getStoreDailySummary(date, group.storeId)
                  return (
                    <React.Fragment key={group.storeId}>
                      {/* 店舗の日別サマリーセル */}
                      <td className="px-1 py-0.5 border-r border-b border-gray-300 text-center bg-gray-50 cursor-pointer hover:bg-gray-100">
                        <div className="font-semibold text-gray-800 text-[0.5rem] leading-tight">
                          {storeSummary.staffCount}名 {storeSummary.totalHours.toFixed(1)}h
                        </div>
                      </td>

                      {/* スタッフごとのシフトセル */}
                      {group.staff.map(staff => {
                        const shift = getShiftForDateAndStaff(date, staff.staff_id)
                        const hours = shift ? calculateHours(shift.start_time, shift.end_time) : 0
                        const conflict = getConflict(date, staff.staff_id)

                        // シフトがあり、かつそのシフトの店舗が選択されている場合のみ表示
                        const shouldShowShift = shift &&
                          selectedStores &&
                          selectedStores.size > 0 &&
                          selectedStores.has(parseInt(shift.store_id))

                        return (
                          <td
                            key={staff.staff_id}
                            className="px-0.5 py-0.5 border-r border-b border-gray-200"
                          >
                            {shouldShowShift ? (
                              // シフト表示（読み取り専用）
                              <div
                                className={`px-0.5 py-0.5 rounded border ${getTimeSlotColor(shift.start_time, date, staff.staff_id)} ${
                                  shift.modified_flag ? 'ring-1 ring-yellow-400' : ''
                                } ${conflict ? 'cursor-pointer hover:opacity-80' : ''}`}
                                onClick={() => {
                                  if (conflict && onConflictClick) {
                                    onConflictClick({ ...conflict, shift, staff })
                                  }
                                }}
                              >
                                <div className="font-semibold text-gray-800 text-[0.5rem] leading-tight">
                                  {staff.store_id && shift.store_id && parseInt(staff.store_id) !== parseInt(shift.store_id)
                                    ? `${getStoreCode(shift.store_id)} `
                                    : ''}
                                  {formatTime(shift.start_time)}-{formatTime(shift.end_time)}
                                </div>
                                <div className="text-[0.45rem] text-gray-600 leading-tight">{hours.toFixed(1)}h</div>
                              </div>
                            ) : (
                              // 空セル
                              <div className="py-1"></div>
                            )}
                          </td>
                        )
                      })}
                    </React.Fragment>
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

export default MultiStoreShiftTable
