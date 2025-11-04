import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  Calendar,
  Plus,
  Edit3,
  Eye,
  Check,
  Clock,
  Store,
} from 'lucide-react'
import { ShiftRepository } from '../../infrastructure/repositories/ShiftRepository'
import History from './History'

const shiftRepository = new ShiftRepository()

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
}

const ShiftManagement = ({
  onNext,
  onPrev,
  onCreateShift,
  onCreateSecondPlan,
  onFirstPlan,
  shiftStatus,
  onHome,
  onShiftManagement,
  onLineMessages,
  onMonitoring,
  onStaffManagement,
  onStoreManagement,
  onConstraintManagement,
  onBudgetActualManagement,
  selectedStore,
  setSelectedStore,
  availableStores,
  setAvailableStores,
}) => {
  const [shifts, setShifts] = useState([]) // マトリックスデータ: { storeId, storeName, months: [{month, status, ...}] }
  const [loading, setLoading] = useState(true)
  const [creatingShift, setCreatingShift] = useState(null) // 作成中の月を追跡
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()) // 年度選択
  const [viewMode, setViewMode] = useState('matrix') // 'matrix' or 'detail'
  const [viewingShift, setViewingShift] = useState(null) // 閲覧中のシフト情報

  // 常に現在年を使用
  const currentYear = new Date().getFullYear()

  // APIからシフトサマリーを取得
  // 初回マウント時にも読み込み
  useEffect(() => {
    loadShiftSummary()
  }, [])

  // 店舗選択・年度選択が変更されたときに再読み込み
  useEffect(() => {
    loadShiftSummary()
  }, [selectedStore, selectedYear])

  const loadShiftSummary = async () => {
    try {
      setLoading(true)
      const summary = await shiftRepository.getSummary({ year: selectedYear })
      console.log('[ShiftManagement] サマリー取得:', summary)

      // 店舗リストを抽出してグローバル状態に保存
      const stores = Array.from(
        new Map(
          summary
            .filter(s => s.store_id && s.store_name)
            .map(s => [s.store_id, { store_id: s.store_id, store_name: s.store_name }])
        ).values()
      ).sort((a, b) => a.store_name.localeCompare(b.store_name))
      setAvailableStores(stores)

      // 表示する月（1月から12月まで全て）
      const monthsToShow = Array.from({ length: 12 }, (_, i) => i + 1) // [1, 2, 3, ..., 12]

      // 店舗フィルタを適用
      const filteredStores = selectedStore === 'all'
        ? stores
        : stores.filter(s => s.store_id === parseInt(selectedStore))

      // マトリックスデータ構造を生成: 店舗×月
      const matrixData = filteredStores.map(store => {
        const months = monthsToShow.map(month => {
          const monthData = summary.find(
            s => parseInt(s.store_id) === store.store_id && parseInt(s.month) === month
          )

          // ステータス判定
          let status = 'not_started'
          if (monthData && monthData.status) {
            status = monthData.status.toLowerCase()
          } else if (monthData) {
            status = 'completed'
          }

          // 過去月は自動的にcompleted扱い
          const targetDate = new Date(currentYear, month - 1, 1)
          const todayDate = new Date()
          const currentMonthDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)

          if (targetDate < currentMonthDate && monthData) {
            status = 'completed'
          }

          return {
            month,
            year: selectedYear,
            storeId: store.store_id,
            storeName: store.store_name,
            planId: monthData ? monthData.plan_id : null,
            status,
            createdAt: monthData ? new Date().toISOString().split('T')[0] : null,
            staff: monthData ? parseInt(monthData.staff_count) : 0,
            totalHours: monthData ? parseFloat(monthData.total_hours) || 0 : 0,
          }
        })

        return {
          storeId: store.store_id,
          storeName: store.store_name,
          months
        }
      })

      console.log('[ShiftManagement] マトリックスデータ:', matrixData)
      setShifts(matrixData)
    } catch (error) {
      console.error('シフトサマリー取得エラー:', error)
      setShifts([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = status => {
    const statusMap = {
      second_plan_approved: { label: '確定', color: 'green' },
      first_plan_approved: { label: '第1案承認', color: 'cyan' },
      draft: { label: '下書き', color: 'yellow' },
      not_started: { label: '未作成', color: 'gray' },
    }
    return statusMap[status] || statusMap.not_started
  }

  const handleViewShift = shift => {
    // 確定済みシフトの閲覧
    console.log('シフト閲覧:', shift)
    setViewingShift({
      year: shift.year,
      month: shift.month,
      storeId: shift.storeId
    })
    setViewMode('detail')
  }

  const handleBackToMatrix = () => {
    setViewingShift(null)
    setViewMode('matrix')
  }

  const handleEditShift = async shift => {
    // 作成中の場合は何もしない
    if (creatingShift === shift.month) {
      return
    }

    // 未作成の場合はファーストプラン画面に遷移
    if (shift.status === 'not_started') {
      if (onFirstPlan) {
        onFirstPlan(shift)
      }
      return
    }

    // それ以外の場合は第2案作成画面に遷移
    try {
      if (onCreateShift) {
        await onCreateShift(shift)
      }
    } finally {
      // データを再読み込み
      await loadShiftSummary()
    }
  }

  const getRecruitmentStatus = (year, month) => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const targetDate = new Date(year, month - 1, 1)
    const currentDate = new Date(currentYear, currentMonth - 1, 1)

    if (targetDate < currentDate) {
      return { label: '締切', color: 'text-gray-500' }
    } else if (targetDate.getTime() === currentDate.getTime()) {
      return { label: '募集中', color: 'text-orange-600' }
    } else {
      return { label: '未開始', color: 'text-gray-400' }
    }
  }

  const getActionButton = shift => {
    const isCreating = creatingShift === shift.month

    // 過去月かどうかを判定
    const targetDate = new Date(shift.year, shift.month - 1, 1)
    const currentDate = new Date()
    const currentMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const isPastMonth = targetDate < currentMonthDate

    // 過去月は閲覧のみ
    if (isPastMonth) {
      return (
        <button
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          onClick={() => handleViewShift(shift)}
        >
          閲覧
        </button>
      )
    }

    // 現在月・未来月はステータスに応じて編集可能
    switch (shift.status) {
      case 'second_plan_approved':
        return (
          <button
            className="text-xs text-green-600 hover:text-green-800 hover:underline"
            onClick={() => handleEditShift(shift)}
          >
            編集
          </button>
        )
      case 'first_plan_approved':
        return (
          <div className="flex gap-2 text-xs">
            <button
              className="text-green-600 hover:text-green-800 hover:underline"
              onClick={() => handleEditShift(shift)}
            >
              編集
            </button>
            <span className="text-gray-300">|</span>
            <button
              className="text-purple-600 hover:text-purple-800 hover:underline"
              onClick={() => onCreateSecondPlan && onCreateSecondPlan(shift)}
            >
              第2案作成
            </button>
          </div>
        )
      case 'draft':
        return (
          <button
            className="text-xs text-yellow-600 hover:text-yellow-800 hover:underline"
            onClick={() => handleEditShift(shift)}
          >
            編集続行
          </button>
        )
      default:
        return (
          <button
            className="text-xs text-green-600 hover:text-green-800 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
            onClick={() => handleEditShift(shift)}
            disabled={isCreating}
          >
            {isCreating ? '作成中...' : '新規作成'}
          </button>
        )
    }
  }

  // 詳細表示モードの場合はHistoryコンポーネントを表示
  if (viewMode === 'detail' && viewingShift) {
    return (
      <History
        initialMonth={viewingShift}
        onPrev={handleBackToMatrix}
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
        availableStores={availableStores}
        hideStoreSelector={true}
        {...{
          onHome,
          onShiftManagement,
          onLineMessages,
          onMonitoring,
          onStaffManagement,
          onStoreManagement,
          onConstraintManagement,
          onBudgetActualManagement,
          onFirstPlan,
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-8">
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="app-container"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            シフト管理
          </h1>
          <p className="text-lg text-gray-600">月別シフトの作成・編集</p>
        </div>

        <div>
            {/* フィルター */}
            <div className="mb-4 flex items-center gap-4 bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                    <option key={year} value={year}>{year}年</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-gray-600" />
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全店舗</option>
                  {availableStores.map(store => (
                    <option key={store.store_id} value={store.store_id}>
                      {store.store_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* マトリックステーブル */}
            {loading ? (
              <div className="text-center py-12">
                <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-gray-400" />
                <p className="text-gray-600">読み込み中...</p>
              </div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">シフトデータがありません</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200 sticky left-0 bg-gray-50 z-10">
                        店舗
                      </th>
                      {shifts[0]?.months.map(monthData => (
                        <th key={monthData.month} className="px-2 py-2 text-center font-semibold text-gray-700 border-b border-gray-200 min-w-[100px]">
                          {monthData.month}月
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((storeData, storeIndex) => (
                      <tr key={storeData.storeId} className={`hover:bg-gray-50 ${storeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-3 py-2 font-medium text-gray-900 border-b border-gray-100 sticky left-0 bg-inherit z-10">
                          {storeData.storeName}
                        </td>
                        {storeData.months.map(monthData => {
                          const statusInfo = getStatusInfo(monthData.status)
                          const recruitmentStatus = getRecruitmentStatus(monthData.year, monthData.month)

                          return (
                            <td key={`${storeData.storeId}-${monthData.month}`} className="px-2 py-2 border-b border-gray-100">
                              <div className="space-y-1">
                                {/* ステータス */}
                                <div className={`px-2 py-0.5 rounded text-center font-medium ${
                                  statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                  statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                  statusInfo.color === 'cyan' ? 'bg-cyan-100 text-cyan-800' :
                                  statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {statusInfo.label}
                                </div>

                                {/* 募集状況 */}
                                <div className={`text-center font-medium ${recruitmentStatus.color}`}>
                                  {recruitmentStatus.label}
                                </div>

                                {/* シフト情報 */}
                                {monthData.status !== 'not_started' && (
                                  <div className="text-gray-600 text-center">
                                    <div>{monthData.staff}名 / {monthData.totalHours}h</div>
                                  </div>
                                )}

                                {/* アクション */}
                                <div className="flex justify-center pt-1">
                                  {getActionButton(monthData)}
                                </div>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </motion.div>
    </div>
  )
}

export default ShiftManagement
