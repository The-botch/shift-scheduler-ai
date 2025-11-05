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
 * @param {Object} props.calendarData - カレンダー用データ
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
  calendarData,
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

  // スタッフマップをフィルタリング: 在籍中 かつ 選択された店舗のスタッフのみ
  const filteredStaffMap = useMemo(() => {
    return Object.fromEntries(
      Object.entries(staffMap).filter(([id, info]) => {
        // 在籍中のスタッフのみ
        const isActive = info.is_active !== false

        // 店舗IDが指定されている場合は、その店舗のスタッフのみ
        const matchesStore = !storeId || parseInt(info.store_id) === parseInt(storeId)

        return isActive && matchesStore
      })
    )
  }, [staffMap, storeId])

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
              shiftData={shiftData}
              staffMap={filteredStaffMap}
              storeName={storeName}
              readonly={readonly}
              onAddShift={readonly ? undefined : onAddShift}
              onUpdateShift={readonly ? undefined : onUpdateShift}
              onDeleteShift={readonly ? undefined : onDeleteShift}
              onCellClick={onCellClick}
            />
          ) : (
            calendarData && (
              <ShiftCalendar
                year={year}
                month={month}
                calendarData={calendarData}
                onDayClick={readonly ? undefined : onDayClick}
              />
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ShiftViewEditor
