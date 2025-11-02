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
  History as HistoryIcon,
  Store,
} from 'lucide-react'
import History from './History'
import { ShiftRepository } from '../../infrastructure/repositories/ShiftRepository'

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
  const [activeTab, setActiveTab] = useState('management') // 'management' or 'history'
  const [initialHistoryMonth, setInitialHistoryMonth] = useState(null)
  const [shifts, setShifts] = useState([]) // マトリックスデータ: { storeId, storeName, months: [{month, status, ...}] }
  const [loading, setLoading] = useState(true)
  const [creatingShift, setCreatingShift] = useState(null) // 作成中の月を追跡

  // 常に現在年を使用
  const currentYear = new Date().getFullYear()

  // APIからシフトサマリーを取得
  // activeTabが'management'に変わった時も再読み込み
  useEffect(() => {
    if (activeTab === 'management') {
      loadShiftSummary()
    }
  }, [activeTab])

  // 初回マウント時にも読み込み
  useEffect(() => {
    loadShiftSummary()
  }, [])

  // 店舗選択が変更されたときに再読み込み
  useEffect(() => {
    if (activeTab === 'management') {
      loadShiftSummary()
    }
  }, [selectedStore])

  const loadShiftSummary = async () => {
    try {
      setLoading(true)
      const summary = await shiftRepository.getSummary({ year: currentYear })

      // 店舗リストを抽出してグローバル状態に保存
      const stores = Array.from(
        new Map(
          summary
            .filter(s => s.store_id && s.store_name)
            .map(s => [s.store_id, { store_id: s.store_id, store_name: s.store_name }])
        ).values()
      ).sort((a, b) => a.store_name.localeCompare(b.store_name))
      setAvailableStores(stores)

      // 表示する月（現在月と次月）
      const now = new Date()
      const currentMonth = now.getMonth() + 1 // 1-12
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const monthsToShow = [currentMonth, nextMonth]

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
            year: currentYear,
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
      completed: { label: '承認済み・確定', color: 'green', icon: Check },
      second_plan_approved: { label: '第2案承認済み', color: 'blue', icon: Check },
      first_plan_approved: { label: '第1案承認済み', color: 'blue', icon: Check },
      draft: { label: '下書き', color: 'yellow', icon: Edit3 },
      not_started: { label: '未作成', color: 'gray', icon: Plus },
    }
    return statusMap[status] || statusMap.not_started
  }

  const handleViewShift = shift => {
    // 履歴タブに切り替えて、該当月の詳細を開く
    setInitialHistoryMonth({ year: currentYear, month: shift.month })
    setActiveTab('history')
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

  const getActionButton = shift => {
    switch (shift.status) {
      case 'completed':
        return (
          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => handleViewShift(shift)}
          >
            <Eye className="h-4 w-4 mr-2" />
            閲覧
          </Button>
        )
      case 'second_plan_approved':
        return (
          <div className="space-y-2">
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => handleViewShift(shift)}
            >
              <Eye className="h-4 w-4 mr-2" />
              閲覧
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => handleEditShift(shift)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              修正
            </Button>
          </div>
        )
      case 'first_plan_approved':
        return (
          <div className="space-y-2">
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => handleViewShift(shift)}
            >
              <Eye className="h-4 w-4 mr-2" />
              閲覧
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => handleEditShift(shift)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              修正
            </Button>
            <Button
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700 mt-2"
              onClick={() => onCreateSecondPlan && onCreateSecondPlan(shift)}
            >
              <Plus className="h-4 w-4 mr-2" />
              第2案作成へ
            </Button>
          </div>
        )
      case 'in_progress':
        return (
          <Button
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => handleEditShift(shift)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            編集を続ける
          </Button>
        )
      case 'draft':
        return (
          <Button
            size="sm"
            className="w-full bg-yellow-600 hover:bg-yellow-700"
            onClick={() => handleEditShift(shift)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            下書きを開く
          </Button>
        )
      default:
        const isCreating = creatingShift === shift.month
        return (
          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => handleEditShift(shift)}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                作成中...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                新規作成
              </>
            )}
          </Button>
        )
    }
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
          <p className="text-lg text-gray-600">月別シフトの作成・編集・閲覧</p>
        </div>

        {/* タブメニュー */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('management')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'management'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              シフト管理
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              シフト作成履歴
            </div>
          </button>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'history' ? (
          <History initialMonth={initialHistoryMonth} selectedStore={selectedStore} setSelectedStore={setSelectedStore} availableStores={availableStores} />
        ) : (
          <div>
            {/* 店舗フィルター */}
            <div className="mb-6 flex items-center gap-4">
              <Store className="h-5 w-5 text-gray-600" />
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全店舗</option>
                {availableStores.map(store => (
                  <option key={store.store_id} value={store.store_id}>
                    {store.store_name}
                  </option>
                ))}
              </select>
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700 border-b-2 border-gray-300">
                        店舗
                      </th>
                      {shifts[0]?.months.map(monthData => (
                        <th key={monthData.month} className="px-6 py-4 text-center font-semibold text-gray-700 border-b-2 border-gray-300">
                          {monthData.month}月
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((storeData, storeIndex) => (
                      <tr key={storeData.storeId} className={storeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 font-medium text-gray-900 border-b border-gray-200">
                          {storeData.storeName}
                        </td>
                        {storeData.months.map(monthData => {
                          const statusInfo = getStatusInfo(monthData.status)
                          const StatusIcon = statusInfo.icon

                          return (
                            <td key={`${storeData.storeId}-${monthData.month}`} className="px-4 py-4 border-b border-gray-200">
                              <div className="space-y-2">
                                {/* ステータスバッジ */}
                                <div className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                  statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                  statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                  statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  <StatusIcon className="h-3 w-3" />
                                  <span>{statusInfo.label}</span>
                                </div>

                                {/* シフト情報 */}
                                {monthData.status !== 'not_started' && (
                                  <div className="text-xs text-gray-600 text-center">
                                    <div>{monthData.staff}名</div>
                                    <div>{monthData.totalHours}h</div>
                                  </div>
                                )}

                                {/* アクションボタン */}
                                <div className="flex justify-center">
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
        )}
      </motion.div>
    </div>
  )
}

export default ShiftManagement
