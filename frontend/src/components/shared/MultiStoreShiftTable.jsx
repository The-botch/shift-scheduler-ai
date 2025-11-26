import React, { useRef } from 'react'
import { isHoliday, getHolidayName } from '../../utils/holidays'
import { getDaysInMonth, getDayOfWeek, isoToJSTDateString } from '../../utils/dateUtils'

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
  hopeShifts = [], // 希望シフトデータ
  onCellClick, // セルクリック時のコールバック（全セル対応）
  preferences = [], // 希望シフトのpreferredDays/ngDays情報
  onShiftClick, // シフト追加・編集用のコールバック
  showPreferenceColoring = true, // 希望シフトベースの色分けを表示するか（第一案ではfalse）
}) => {
  const headerScrollRef = useRef(null)
  const bodyScrollRef = useRef(null)

  // ヘッダーとボディのスクロールを同期
  const handleHeaderScroll = e => {
    if (bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = e.target.scrollLeft
    }
  }

  const handleBodyScroll = e => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.target.scrollLeft
    }
  }

  // 月の日数を計算（JST対応）
  const daysInMonth = getDaysInMonth(year, month)
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // 時刻をHH:MM形式にフォーマット
  const formatTime = time => {
    if (!time) return ''
    return time.substring(0, 5)
  }

  // 店舗IDから店舗コードを取得
  const getStoreCode = storeId => {
    if (!storesMap || !storeId) return ''
    const store = storesMap[storeId]
    return store ? store.store_code : ''
  }

  // 店舗IDから店舗名を取得
  const getStoreName = storeId => {
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
      if (
        shift &&
        selectedStores &&
        selectedStores.size > 0 &&
        selectedStores.has(parseInt(shift.store_id))
      ) {
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
          staff: staffInStore,
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
      if (
        shift &&
        parseInt(shift.store_id) === parseInt(storeId) &&
        selectedStores &&
        selectedStores.size > 0 &&
        selectedStores.has(parseInt(shift.store_id))
      ) {
        staffCount++
        totalHours += calculateHours(shift.start_time, shift.end_time)
      }
    })

    return { staffCount, totalHours }
  }

  // 日付の全体サマリーを計算（選択された全店舗の合計）
  const getOverallDailySummary = date => {
    let staffCount = 0
    let totalHours = 0

    allStaff.forEach(staff => {
      const shift = getShiftForDateAndStaff(date, staff.staff_id)
      // シフトがあればカウント（チェックボックスの選択状態に関係なく全店舗の合計を表示）
      if (shift) {
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
        // シフトがあればカウント（チェックボックスの選択状態に関係なく全店舗の合計を表示）
        if (shift) {
          totalDays++
          totalHours += calculateHours(shift.start_time, shift.end_time)
        }
      })
    })

    return { totalDays, totalHours }
  }

  // 店舗の月間合計を計算
  const getStoreMonthlyTotal = storeId => {
    let totalDays = 0
    let totalHours = 0

    dates.forEach(date => {
      // 全スタッフをチェック（所属に関係なく、その店舗で勤務している人をカウント）
      allStaff.forEach(staff => {
        const shift = getShiftForDateAndStaff(date, staff.staff_id)
        // シフトがあり、その店舗のシフトで、選択されている場合のみカウント
        if (
          shift &&
          parseInt(shift.store_id) === parseInt(storeId) &&
          selectedStores &&
          selectedStores.size > 0 &&
          selectedStores.has(parseInt(shift.store_id))
        ) {
          totalDays++
          totalHours += calculateHours(shift.start_time, shift.end_time)
        }
      })
    })

    return { totalDays, totalHours }
  }

  // 特定の日付とスタッフに対してconflictを取得
  const getConflict = (date, staffId) => {
    return conflicts.find(c => {
      const dateMatch = c.date === date
      const staffMatch = parseInt(c.staffId) === parseInt(staffId)
      return dateMatch && staffMatch
    })
  }

  // 特定の日付とスタッフに対してhopeShiftを取得
  const getHopeShift = (date, staffId) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    return hopeShifts.find(
      hope =>
        hope.shift_date &&
        hope.shift_date.startsWith(dateStr) &&
        parseInt(hope.staff_id) === parseInt(staffId)
    )
  }

  // ★変更: 新API形式（1日1レコード）でのスタッフ希望シフト情報取得
  // 指定した日付のスタッフの希望情報を取得（JSTで正しくパース）
  const getStaffPreferenceForDate = (date, staffId) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    return preferences.find(pref => {
      const prefDate = isoToJSTDateString(pref.preference_date)
      return parseInt(pref.staff_id) === parseInt(staffId) && prefDate === dateStr
    })
  }

  // その日が勤務希望日かチェック（is_ng=false）
  const isPreferredDay = (date, staffId) => {
    const pref = getStaffPreferenceForDate(date, staffId)
    return pref && !pref.is_ng
  }

  // その日がNG日かチェック（is_ng=true）
  const isNgDay = (date, staffId) => {
    const pref = getStaffPreferenceForDate(date, staffId)
    return pref && pref.is_ng
  }

  // セルの背景色を決定（希望シフトとの関係で判定）
  const getCellBackgroundColor = (date, staffId) => {
    // 希望シフトベースの色分けが無効の場合（第一案）
    if (!showPreferenceColoring) {
      return 'bg-white'
    }

    // NGの日は薄グレー
    if (isNgDay(date, staffId)) {
      return 'bg-gray-100'
    }
    // 希望日は薄緑
    if (isPreferredDay(date, staffId)) {
      return 'bg-green-50'
    }
    // 希望登録なし
    return 'bg-white'
  }

  // シフトカードの色分け（雇用形態別ロジック）
  const getShiftCardColor = (date, staffId) => {
    // 希望シフトベースの色分けが無効の場合（第一案）
    if (!showPreferenceColoring) {
      return 'bg-gray-100 border border-gray-300'
    }

    const staff = staffMap[staffId]
    const employmentType = staff?.employment_type || ''
    const isNg = isNgDay(date, staffId)
    const isPreferred = isPreferredDay(date, staffId)

    // 【PART_TIMEの場合】アルバイト・パートは希望日のみ勤務可能
    if (employmentType === 'PART_TIME') {
      if (isPreferred) {
        // 希望日に配置 → 緑色（OK）
        return 'bg-green-100 border border-green-400'
      } else {
        // 希望日以外に配置 → 赤色（要修正）
        return 'bg-red-200 border border-red-500'
      }
    }

    // 【FULL_TIMEの場合】正社員はNG日以外なら勤務可能
    if (isNg) {
      // NG日に配置 → 赤色（要修正）
      return 'bg-red-200 border border-red-500'
    } else {
      // NG日以外に配置 → 緑色（OK）
      return 'bg-green-100 border border-green-400'
    }
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
              <th
                rowSpan={2}
                className="px-0 py-0.5 text-center font-semibold text-gray-700 border-b border-r-2 border-gray-300 sticky left-0 z-20 bg-gray-50"
              >
                <div className="text-[0.6rem] font-bold">
                  {year}年{month}月
                </div>
              </th>
              <th
                rowSpan={2}
                className="px-0 py-0.5 text-center font-semibold text-gray-700 border-b border-r-2 border-gray-400 bg-blue-100 sticky left-[80px] z-20"
              >
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
                      <div className="text-[0.45rem] text-gray-500 font-normal leading-tight">
                        {staff.role_name}
                      </div>
                    </th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
            {/* 月間合計行 */}
            <tr className="bg-gray-100 font-semibold">
              <td className="px-0 py-0.5 border-r-2 border-gray-300 text-center text-gray-700 sticky left-0 z-20 bg-gray-100">
                月合計
              </td>
              {(() => {
                const overallMonthly = getOverallMonthlyTotal()
                return (
                  <td className="px-0.5 py-0.5 border-r-2 border-gray-400 text-center bg-blue-100 sticky left-[80px] z-20">
                    <div className="text-gray-800 text-[0.5rem] leading-tight">
                      {overallMonthly.totalDays}名
                    </div>
                    <div className="text-gray-800 text-[0.5rem] leading-tight">
                      {overallMonthly.totalHours.toFixed(1)}h
                    </div>
                  </td>
                )
              })()}
              {storeGroups.map(group => {
                const storeMonthly = getStoreMonthlyTotal(group.storeId)
                return (
                  <React.Fragment key={group.storeId}>
                    <td className="px-0.5 py-0.5 border-r border-gray-300 text-center bg-gray-100">
                      <div className="text-gray-800 text-[0.5rem] leading-tight">
                        {storeMonthly.totalDays}名
                      </div>
                      <div className="text-gray-800 text-[0.5rem] leading-tight">
                        {storeMonthly.totalHours.toFixed(1)}h
                      </div>
                    </td>
                    {group.staff.map(staff => {
                      const { totalDays, totalHours } = getStaffMonthlyTotal(staff.staff_id)
                      return (
                        <td
                          key={staff.staff_id}
                          className="px-0.5 py-0.5 border-r border-gray-200 text-center"
                        >
                          <div className="text-gray-800 text-[0.5rem] leading-tight">
                            {totalHours.toFixed(1)}h
                          </div>
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
                  <td className="px-1 py-0.5 border-r-2 border-b border-gray-200 bg-gray-50 sticky left-0 z-20">
                    <div className="flex items-center gap-0.5">
                      <span
                        className={`font-bold text-[0.85rem] leading-tight ${getWeekdayColor(date)}`}
                      >
                        {date}({weekday})
                      </span>
                      {holiday && (
                        <span className="text-[0.5rem] text-red-600 font-medium leading-tight">
                          {holidayName}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 全体サマリーセル */}
                  <td
                    className="px-1 py-0.5 border-r-2 border-b border-gray-400 text-center bg-blue-50 cursor-pointer hover:bg-blue-100 sticky left-[80px] z-20"
                    onClick={() => onDayClick && onDayClick(date)}
                  >
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
                        <td
                          className="px-1 py-0.5 border-r border-b border-gray-300 text-center bg-gray-50 cursor-pointer hover:bg-gray-100"
                          onClick={() => onDayClick && onDayClick(date, group.storeId)}
                        >
                          <div className="font-semibold text-gray-800 text-[0.5rem] leading-tight">
                            {storeSummary.staffCount}名 {storeSummary.totalHours.toFixed(1)}h
                          </div>
                        </td>

                        {/* スタッフごとのシフトセル */}
                        {group.staff.map(staff => {
                          const shift = getShiftForDateAndStaff(date, staff.staff_id)
                          const hours = shift ? calculateHours(shift.start_time, shift.end_time) : 0
                          const conflict = getConflict(date, staff.staff_id)
                          const hopeShift = getHopeShift(date, staff.staff_id)
                          const cellBgColor = getCellBackgroundColor(date, staff.staff_id)

                          // シフトがあり、かつそのシフトの店舗が選択されている場合のみ表示
                          const shouldShowShift =
                            shift &&
                            selectedStores &&
                            selectedStores.size > 0 &&
                            selectedStores.has(parseInt(shift.store_id))

                          // セルクリックハンドラ
                          const handleCellClick = e => {
                            // 新しいonShiftClickがある場合はそれを優先
                            if (onShiftClick) {
                              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`

                              if (shouldShowShift && shift) {
                                // 既存シフトがある → 編集モード
                                onShiftClick({
                                  mode: 'edit',
                                  shift: {
                                    ...shift,
                                    date: dateStr,
                                    staff_name: staff.name,
                                    store_name: getStoreName(shift.store_id),
                                  },
                                  date: dateStr,
                                  staffId: staff.staff_id,
                                  storeId: shift.store_id,
                                  event: e,
                                })
                              } else {
                                // 空セル → 新規追加モード
                                // 選択されている店舗から最初のものを使用（複数店舗選択時）
                                const storeId =
                                  staff.store_id ||
                                  (selectedStores && selectedStores.size > 0
                                    ? Array.from(selectedStores)[0]
                                    : null)

                                if (storeId) {
                                  onShiftClick({
                                    mode: 'add',
                                    shift: {
                                      date: dateStr,
                                      staff_id: staff.staff_id,
                                      store_id: storeId,
                                      staff_name: staff.name,
                                      store_name: getStoreName(storeId),
                                    },
                                    date: dateStr,
                                    staffId: staff.staff_id,
                                    storeId: storeId,
                                    event: e,
                                  })
                                }
                              }
                            } else if (onCellClick) {
                              // 従来のonCellClickコールバック
                              onCellClick({
                                date,
                                staffId: staff.staff_id,
                                shift: shouldShowShift ? shift : null,
                                hopeShift,
                                conflict,
                                staff,
                              })
                            }
                          }

                          return (
                            <td
                              key={staff.staff_id}
                              className={`px-0.5 py-0.5 border-r border-b border-gray-200 ${cellBgColor} ${onCellClick ? 'cursor-pointer hover:opacity-80' : ''}`}
                              onClick={handleCellClick}
                            >
                              {shouldShowShift ? (
                                // シフト表示（読み取り専用）
                                <div
                                  className={`px-0.5 py-0.5 rounded ${getShiftCardColor(date, staff.staff_id)} relative`}
                                >
                                  {shift.modified_flag && (
                                    <div className="absolute top-0 right-0 text-xs bg-yellow-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[0.5rem] leading-none">
                                      !
                                    </div>
                                  )}
                                  <div className="font-semibold text-gray-800 text-[0.5rem] leading-tight">
                                    {staff.store_id &&
                                    shift.store_id &&
                                    parseInt(staff.store_id) !== parseInt(shift.store_id)
                                      ? `${getStoreCode(shift.store_id)} `
                                      : ''}
                                    {formatTime(shift.start_time)}-{formatTime(shift.end_time)}
                                  </div>
                                  <div className="text-[0.45rem] text-gray-600 leading-tight">
                                    {hours.toFixed(1)}h
                                  </div>
                                </div>
                              ) : (
                                // 空セル
                                <div
                                  className={`py-1 flex items-center justify-center ${onShiftClick ? 'group' : ''}`}
                                >
                                  {onShiftClick && (
                                    <div className="text-gray-300 group-hover:text-gray-500 transition-colors text-lg font-light">
                                      +
                                    </div>
                                  )}
                                </div>
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
