/**
 * Sidebar.jsx
 * シフトダッシュボード用サイドバーコンポーネント
 *
 * 機能:
 * - 年月選択（全月クリック可能）
 * - 対象月のハイライト
 * - ナビゲーションリンク（スタッフ管理、マスター管理）
 */

import { getMonthList } from '../hooks/useTargetMonth'

// アイコンコンポーネント
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
)

/**
 * 月アイテムコンポーネント
 */
const MonthItem = ({ status, label, statusLabel, isSelected, onClick }) => {
  const isTarget = status === 'target'

  // スタイルを決定
  const baseClasses = 'flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors'
  let styleClasses = ''

  if (isSelected && isTarget) {
    // 対象月で選択中
    styleClasses = 'bg-green-600 text-white shadow-lg'
  } else if (isSelected) {
    // 対象月以外で選択中
    styleClasses = 'bg-slate-600 text-white'
  } else if (isTarget) {
    // 対象月だが未選択
    styleClasses = 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
  } else {
    // その他
    styleClasses = 'text-slate-300 hover:bg-slate-700'
  }

  // バッジのスタイル
  const badgeClasses =
    status === 'target'
      ? 'bg-green-500 text-white'
      : status === 'past'
        ? 'bg-slate-600 text-slate-300'
        : 'bg-slate-600 text-slate-300'

  return (
    <button onClick={onClick} className={`${baseClasses} ${styleClasses} w-full text-left`}>
      <CalendarIcon />
      <span className={isTarget && isSelected ? 'font-bold' : ''}>{label}</span>
      <span className={`ml-auto text-xs px-2 py-0.5 rounded ${badgeClasses}`}>{statusLabel}</span>
    </button>
  )
}

/**
 * サイドバーコンポーネント
 * @param {Object} props
 * @param {number} props.selectedYear - 選択中の年
 * @param {number} props.selectedMonth - 選択中の月
 * @param {Function} props.onMonthSelect - 月選択時のコールバック (year, month) => void
 * @param {Function} props.onStaffManagement - スタッフ管理クリック時のコールバック
 * @param {Function} props.onMasterManagement - マスター管理クリック時のコールバック
 * @param {string} props.currentPath - 現在のパス（アクティブ表示用）
 */
const Sidebar = ({
  selectedYear,
  selectedMonth,
  onMonthSelect,
  onStaffManagement,
  onMasterManagement,
  currentPath = '/',
}) => {
  const monthList = getMonthList(2, 2)

  const isDashboardActive = currentPath === '/' || currentPath === '/dashboard'

  return (
    <div className="w-72 bg-slate-800 text-white flex-shrink-0 flex flex-col h-full">
      {/* ヘッダー */}
      <div className="p-4 border-b border-slate-700">
        <span className="font-bold text-lg">シフト管理</span>
      </div>

      {/* ナビゲーション */}
      <nav className="p-3 flex-1 overflow-y-auto">
        {/* ダッシュボードリンク */}
        <button
          onClick={() => onMonthSelect && onMonthSelect(selectedYear, selectedMonth)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 w-full text-left transition-colors ${
            isDashboardActive ? 'bg-slate-700' : 'hover:bg-slate-700'
          }`}
        >
          <HomeIcon />
          <span>ダッシュボード</span>
        </button>

        {/* 年月選択セクション */}
        <div className="mt-4 mb-2 px-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            年月選択
          </span>
        </div>

        {/* 月リスト */}
        {monthList.map(item => (
          <MonthItem
            key={`${item.year}-${item.month}`}
            year={item.year}
            month={item.month}
            status={item.status}
            label={item.label}
            statusLabel={item.statusLabel}
            isSelected={selectedYear === item.year && selectedMonth === item.month}
            onClick={() => onMonthSelect && onMonthSelect(item.year, item.month)}
          />
        ))}

        {/* マスターセクション */}
        <div className="mt-6 mb-2 px-4">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            マスター
          </span>
        </div>

        {/* スタッフ管理 */}
        <button
          onClick={onStaffManagement}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 mb-1 w-full text-left transition-colors"
        >
          <UsersIcon />
          <span>スタッフ管理</span>
        </button>

        {/* マスター管理 */}
        <button
          onClick={onMasterManagement}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 mb-1 w-full text-left transition-colors"
        >
          <SettingsIcon />
          <span>マスター管理</span>
        </button>
      </nav>
    </div>
  )
}

export default Sidebar
