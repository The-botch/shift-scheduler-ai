import { useState, useMemo } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Table, LayoutGrid } from 'lucide-react'
import StaffTimeTable from './StaffTimeTable'
import ShiftCalendar from './ShiftCalendar'

/**
 * シフト表示・編集コンポーネント
 * カレンダー表示とスタッフ別テーブル表示を切り替え可能
 *
 * @param {Object} props
 * @param {number} props.year - 年
 * @param {number} props.month - 月
 * @param {Array} props.shiftData - シフトデータ
 * @param {Object} props.staffMap - スタッフマップ（全スタッフ）
 * @param {Object} props.storesMap - 店舗マップ（店舗ID -> 店舗情報）
 * @param {number|string} props.storeId - 店舗ID（フィルタ用）
 * @param {string} props.storeName - 店舗名
 * @param {boolean} props.readonly - 読み取り専用モード（編集・削除不可）
 * @param {Function} props.onAddShift - シフト追加ハンドラー
 * @param {Function} props.onUpdateShift - シフト更新ハンドラー
 * @param {Function} props.onDeleteShift - シフト削除ハンドラー
 * @param {Function} props.onCellClick - セルクリックハンドラー
 * @param {Function} props.onDayClick - 日付クリックハンドラー
 */
const ShiftViewEditor = ({
  year,
  month,
  shiftData,
  staffMap,
  storesMap,
  storeId,
  storeName,
  readonly = false,
  onAddShift,
  onUpdateShift,
  onDeleteShift,
  onCellClick,
  onDayClick,
}) => {
  const [viewMode, setViewMode] = useState('staff') // 'staff' | 'calendar'

  // スタッフマップをフィルタリング: 在籍中 かつ (選択された店舗のスタッフ または その店舗でシフトがあるスタッフ)
  const filteredStaffMap = useMemo(() => {
    // 選択された店舗でシフトがあるスタッフIDを取得
    const staffIdsWithShiftsInStore = new Set()
    if (storeId && shiftData) {
      shiftData.forEach(shift => {
        if (parseInt(shift.store_id) === parseInt(storeId)) {
          staffIdsWithShiftsInStore.add(parseInt(shift.staff_id))
        }
      })
    }

    return Object.fromEntries(
      Object.entries(staffMap).filter(([id, info]) => {
        // 在籍中のスタッフのみ
        const isActive = info.is_active !== false

        // 店舗IDが指定されていない場合は全員表示
        if (!storeId) return isActive

        // その店舗に所属している、または、その店舗でシフトがある
        const belongsToStore = parseInt(info.store_id) === parseInt(storeId)
        const hasShiftInStore = staffIdsWithShiftsInStore.has(parseInt(id))

        return isActive && (belongsToStore || hasShiftInStore)
      })
    )
  }, [staffMap, storeId, shiftData])

  // シフトデータをフィルタリング: 選択された店舗のシフトのみ
  const filteredShiftData = useMemo(() => {
    if (!storeId || !shiftData) return shiftData

    return shiftData.filter(shift => {
      return parseInt(shift.store_id) === parseInt(storeId)
    })
  }, [shiftData, storeId])

  return (
    <div className="flex flex-col h-full">
      {/* 表示切り替えボタン */}
      <div className="flex gap-2 mb-2 px-2">
        <Button
          variant={viewMode === 'staff' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('staff')}
        >
          <Table className="h-4 w-4 mr-1" />
          スタッフ別
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('calendar')}
        >
          <LayoutGrid className="h-4 w-4 mr-1" />
          カレンダー
        </Button>
      </div>

      {/* 表示エリア */}
      <Card className="flex-1 overflow-hidden border-0 shadow-lg">
        <CardContent className="h-full p-2">
          {viewMode === 'staff' ? (
            <StaffTimeTable
              year={year}
              month={month}
              shiftData={filteredShiftData}
              staffMap={filteredStaffMap}
              storesMap={storesMap}
              storeName={storeName}
              readonly={readonly}
              onAddShift={readonly ? undefined : onAddShift}
              onUpdateShift={readonly ? undefined : onUpdateShift}
              onDeleteShift={readonly ? undefined : onDeleteShift}
              onCellClick={onCellClick}
            />
          ) : (
            <ShiftCalendar
              year={year}
              month={month}
              shiftData={filteredShiftData}
              staffMap={filteredStaffMap}
              onDayClick={onDayClick}
              storeName={storeName}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ShiftViewEditor
