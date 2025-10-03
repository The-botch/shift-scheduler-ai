import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  Calendar,
  Plus,
  Edit3,
  Eye,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  History as HistoryIcon
} from 'lucide-react'
import History from './History'
import AppHeader from '../shared/AppHeader'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}

const ShiftManagement = ({
  onNext,
  onPrev,
  onCreateShift,
  shiftStatus,
  onHome,
  onShiftManagement,
  onLineMessages,
  onMonitoring,
  onStaffManagement,
  onStoreManagement,
  onConstraintManagement,
  onBudgetActualManagement
}) => {
  const [selectedYear, setSelectedYear] = useState(2024)
  const [activeTab, setActiveTab] = useState('management') // 'management' or 'history'
  const [initialHistoryMonth, setInitialHistoryMonth] = useState(null)

  // デモ用のシフトデータ（propsからのステータスを反映）
  const shifts = [
    {
      month: 10,
      status: shiftStatus?.[10] || 'not_started',
      createdAt: (shiftStatus?.[10] === 'first_plan_approved' || shiftStatus?.[10] === 'completed') ? '2024-09-15' : null,
      staff: (shiftStatus?.[10] === 'first_plan_approved' || shiftStatus?.[10] === 'completed') ? 12 : 0,
      totalHours: (shiftStatus?.[10] === 'first_plan_approved' || shiftStatus?.[10] === 'completed') ? 460 : 0
    },
    { month: 11, status: 'draft', createdAt: null, staff: 0, totalHours: 0 },
    { month: 12, status: 'not_started', createdAt: null, staff: 0, totalHours: 0 }
  ]

  const getStatusInfo = (status) => {
    const statusMap = {
      completed: { label: '承認済み・確定', color: 'green', icon: Check },
      first_plan_approved: { label: '第1案仮承認済み', color: 'blue', icon: Check },
      in_progress: { label: '作成中', color: 'blue', icon: Clock },
      draft: { label: '下書き', color: 'yellow', icon: Edit3 },
      not_started: { label: '未作成', color: 'gray', icon: Plus }
    }
    return statusMap[status] || statusMap.not_started
  }

  const handleViewShift = (shift) => {
    // 履歴タブに切り替えて、該当月の詳細を開く
    setInitialHistoryMonth({ year: 2024, month: shift.month })
    setActiveTab('history')
  }

  const handleEditShift = (shift) => {
    // 第2案作成画面に遷移
    onCreateShift()
  }

  const getActionButton = (shift) => {
    switch (shift.status) {
      case 'completed':
        return (
          <div className="space-y-2">
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleViewShift(shift)}>
              <Eye className="h-4 w-4 mr-2" />
              閲覧
            </Button>
            <Button size="sm" variant="outline" className="w-full" onClick={() => handleEditShift(shift)}>
              <Edit3 className="h-4 w-4 mr-2" />
              修正
            </Button>
          </div>
        )
      case 'first_plan_approved':
        return (
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={onCreateShift}>
            <Edit3 className="h-4 w-4 mr-2" />
            第2案作成へ
          </Button>
        )
      case 'in_progress':
        return (
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={onCreateShift}>
            <Edit3 className="h-4 w-4 mr-2" />
            編集を続ける
          </Button>
        )
      case 'draft':
        return (
          <Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-700" onClick={onCreateShift}>
            <Edit3 className="h-4 w-4 mr-2" />
            下書きを開く
          </Button>
        )
      default:
        return (
          <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={onCreateShift}>
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        onHome={onHome}
        onShiftManagement={onShiftManagement}
        onLineMessages={onLineMessages}
        onMonitoring={onMonitoring}
        onStaffManagement={onStaffManagement}
        onStoreManagement={onStoreManagement}
        onConstraintManagement={onConstraintManagement}
        onBudgetActualManagement={onBudgetActualManagement}
      />

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
        <History initialMonth={initialHistoryMonth} />
      ) : (
        <div>

      {/* 年選択 */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedYear(selectedYear - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-2xl font-bold">{selectedYear}年</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedYear(selectedYear + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* シフト一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {shifts.map((shift) => {
          const statusInfo = getStatusInfo(shift.status)
          const StatusIcon = statusInfo.icon

          return (
            <motion.div
              key={shift.month}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shift.month * 0.1 }}
            >
              <Card className={`shadow-lg border-2 hover:shadow-xl transition-shadow ${
                shift.status === 'completed' ? 'border-green-500' :
                shift.status === 'first_plan_approved' || shift.status === 'in_progress' ? 'border-blue-500' : 'border-gray-200'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{shift.month}月</CardTitle>
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* ステータスバッジ */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-${statusInfo.color}-50 border border-${statusInfo.color}-200`}>
                    <StatusIcon className={`h-4 w-4 text-${statusInfo.color}-600`} />
                    <span className={`text-sm font-medium text-${statusInfo.color}-800`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* シフト情報 */}
                  {shift.status !== 'not_started' && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">スタッフ数</span>
                        <span className="font-bold">{shift.staff}名</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">総労働時間</span>
                        <span className="font-bold">{shift.totalHours}h</span>
                      </div>
                      {shift.createdAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">作成日</span>
                          <span className="font-bold text-xs">{shift.createdAt}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {shift.status === 'not_started' && (
                    <div className="py-6 text-center text-gray-400">
                      <Plus className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">未作成</p>
                    </div>
                  )}

                  {/* アクションボタン */}
                  <div className="pt-2">
                    {getActionButton(shift)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

        </div>
      )}
      </motion.div>
    </div>
  )
}

export default ShiftManagement
