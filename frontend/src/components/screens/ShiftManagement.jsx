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

      // 店舗リストを抽出してグローバル状態に保存
      const stores = Array.from(
        new Map(
          summary
            .filter(s => s.store_id && s.store_name)
            .map(s => [s.store_id, { store_id: s.store_id, store_name: s.store_name }])
        ).values()
      ).sort((a, b) => a.store_name.localeCompare(b.store_name))

      // データがない年でも、既存の店舗リストを保持する
      if (stores.length > 0) {
        setAvailableStores(stores)
      } else if (availableStores.length === 0) {
        // 初回ロードで店舗がない場合のみ、デフォルト店舗を設定
        setAvailableStores([{ store_id: 1, store_name: '渋谷店' }])
      }

      // 表示する月（1月から12月まで全て）
      const monthsToShow = Array.from({ length: 12 }, (_, i) => i + 1) // [1, 2, 3, ..., 12]

      // 店舗フィルタを適用
      // データがない年でも既存の店舗リストを使用
      const storesToUse = stores.length > 0 ? stores : availableStores
      const filteredStores = selectedStore === 'all'
        ? storesToUse
        : storesToUse.filter(s => s.store_id === parseInt(selectedStore))

      // マトリックスデータ構造を生成: 店舗×月
      const matrixData = filteredStores.map(store => {
        const months = monthsToShow.map(month => {
          const monthData = summary.find(
            s => parseInt(s.store_id) === store.store_id && parseInt(s.month) === month
          )

          // ステータス判定
          let status = 'not_started'
          if (monthData) {
            // データが存在する場合、APIから返されたstatusを使用
            if (monthData.status) {
              status = monthData.status.toLowerCase()
            } else {
              // statusがない場合はcompletedとする
              status = 'completed'
            }
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

  const handleViewHistory = (shift) => {
    setViewingShift(shift)
    setViewMode('detail')
  }

  const handleViewRecruitmentStatus = (shift) => {
    // Monitoring画面の履歴タブに遷移して、その月の希望提出状況を表示
    if (onMonitoring) {
      onMonitoring(shift)
    }
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
      return { label: '締切', color: 'text-red-600' }
    } else if (targetDate.getTime() === currentDate.getTime()) {
      return { label: '募集中', color: 'text-green-600 font-semibold' }
    } else {
      return { label: '未開始', color: 'text-blue-500' }
    }
  }

  const getActionButton = shift => {
    const isCreating = creatingShift === shift.month

    // 該当月(現在の月)より前の月はアクションボタンを表示しない
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const targetDate = new Date(shift.year, shift.month - 1, 1)
    const currentDate = new Date(currentYear, currentMonth - 1, 1)

    if (targetDate < currentDate) {
      return null
    }

    // ステータスに応じてアクションを表示
    switch (shift.status) {
      case 'second_plan_approved':
        return (
          <button
            className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
            onClick={() => handleEditShift(shift)}
          >
            編集
          </button>
        )
      case 'first_plan_approved':
        return (
          <div className="flex gap-2 text-xs">
            <button
              className="text-indigo-600 hover:text-indigo-800 hover:underline"
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
            className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
            onClick={() => handleEditShift(shift)}
          >
            編集
          </button>
        )
      default:
        return (
          <button
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
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
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <table className="w-full border-collapse text-xs table-fixed">
                  <colgroup>
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '80px' }} />
                    {shifts[0]?.months.map((_, idx) => (
                      <col key={idx} />
                    ))}
                  </colgroup>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b-2 border-r border-gray-200 whitespace-nowrap">
                        店舗
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b-2 border-r border-gray-200 bg-gray-100 whitespace-nowrap">

                      </th>
                      {shifts[0]?.months.map(monthData => (
                        <th key={monthData.month} className="px-3 py-2 text-center font-semibold text-gray-700 border-b-2 border-gray-200">
                          {monthData.month}月
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((storeData, storeIndex) => {
                      const isEven = storeIndex % 2 === 0
                      const bgClass = isEven ? 'bg-white' : 'bg-gray-25'

                      return (
                        <>
                          {/* 1行目: 作成状況 */}
                          <tr key={`${storeData.storeId}-status`} className={`${bgClass} border-b border-gray-100`}>
                            <td rowSpan="3" className="px-2 py-3 font-medium text-gray-900 border-r border-gray-200 text-xs align-middle">
                              {storeData.storeName}
                            </td>
                            <td className="px-2 py-2 text-xs text-gray-600 border-r border-gray-200 bg-gray-50">
                              作成状況
                            </td>
                            {storeData.months.map(monthData => {
                              const statusInfo = getStatusInfo(monthData.status)
                              return (
                                <td key={`${storeData.storeId}-${monthData.month}-status`} className="px-2 py-2">
                                  <button
                                    onClick={() => handleViewHistory(monthData)}
                                    className={`w-full px-2 py-1 rounded text-center font-medium text-[10px] whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity ${
                                      statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                      statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                      statusInfo.color === 'cyan' ? 'bg-cyan-100 text-cyan-800' :
                                      statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {statusInfo.label}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>

                          {/* 2行目: 募集状況 */}
                          <tr key={`${storeData.storeId}-recruitment`} className={`${bgClass} border-b border-gray-100`}>
                            <td className="px-2 py-2 text-xs text-gray-600 border-r border-gray-200 bg-gray-50">
                              募集状況
                            </td>
                            {storeData.months.map(monthData => {
                              const recruitmentStatus = getRecruitmentStatus(monthData.year, monthData.month)
                              return (
                                <td key={`${storeData.storeId}-${monthData.month}-recruitment`} className="px-2 py-2">
                                  <button
                                    onClick={() => handleViewRecruitmentStatus(monthData)}
                                    className={`w-full text-center font-medium text-[10px] whitespace-nowrap cursor-pointer hover:underline transition-all ${recruitmentStatus.color}`}
                                  >
                                    {recruitmentStatus.label}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>

                          {/* 3行目: アクション */}
                          <tr key={`${storeData.storeId}-action`} className={`${bgClass} border-b-2 border-gray-200`}>
                            <td className="px-2 py-2 text-xs text-gray-600 border-r border-gray-200 bg-gray-50">
                              アクション
                            </td>
                            {storeData.months.map(monthData => (
                              <td key={`${storeData.storeId}-${monthData.month}-action`} className="px-2 py-2">
                                <div className="flex justify-center items-center min-h-[24px]">
                                  {getActionButton(monthData)}
                                </div>
                              </td>
                            ))}
                          </tr>
                        </>
                      )
                    })}
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
