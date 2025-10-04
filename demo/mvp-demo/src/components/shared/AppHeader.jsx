import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import {
  BarChart3,
  CalendarIcon,
  FolderOpen,
  MessageSquare,
  ClipboardList,
  Users,
  Store,
  Shield,
  TrendingUp,
  Code2
} from 'lucide-react'

const AppHeader = ({
  onHome,
  onShiftManagement,
  onLineMessages,
  onMonitoring,
  onStaffManagement,
  onStoreManagement,
  onConstraintManagement,
  onBudgetActualManagement,
  onDevTools
}) => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const weekday = weekdays[date.getDay()]
    return `${year}年${month}月${day}日（${weekday}）`
  }

  return (
    <header className="app-header">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 左側：ロゴ/ホームボタン */}
          <div className="flex items-center gap-4">
            <button
              onClick={onHome}
              className="app-logo"
            >
              <BarChart3 className="h-6 w-6 text-slate-700" />
              <span className="font-bold text-lg text-slate-900">Shift Scheduler</span>
            </button>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {formatDate(currentTime)}
            </div>
          </div>

          {/* 右側：ナビゲーションメニュー */}
          <nav className="flex items-center gap-2">
            {onShiftManagement && (
              <Button variant="ghost" size="sm" onClick={onShiftManagement} className="text-slate-700">
                <FolderOpen className="h-4 w-4 mr-1.5" />
                シフト管理
              </Button>
            )}
            {onLineMessages && (
              <Button variant="ghost" size="sm" onClick={onLineMessages} className="text-slate-700">
                <MessageSquare className="h-4 w-4 mr-1.5" />
                メッセージ
              </Button>
            )}
            {onMonitoring && (
              <Button variant="ghost" size="sm" onClick={onMonitoring} className="text-slate-700">
                <ClipboardList className="h-4 w-4 mr-1.5" />
                シフト希望
              </Button>
            )}
            {onStaffManagement && (
              <Button variant="ghost" size="sm" onClick={onStaffManagement} className="text-slate-700">
                <Users className="h-4 w-4 mr-1.5" />
                スタッフ
              </Button>
            )}
            {onStoreManagement && (
              <Button variant="ghost" size="sm" onClick={onStoreManagement} className="text-slate-700">
                <Store className="h-4 w-4 mr-1.5" />
                店舗
              </Button>
            )}
            {onConstraintManagement && (
              <Button variant="ghost" size="sm" onClick={onConstraintManagement} className="text-slate-700">
                <Shield className="h-4 w-4 mr-1.5" />
                制約
              </Button>
            )}
            {onBudgetActualManagement && (
              <Button variant="ghost" size="sm" onClick={onBudgetActualManagement} className="text-slate-700">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                予実管理
              </Button>
            )}
            {onDevTools && (
              <Button variant="ghost" size="sm" onClick={onDevTools} className="text-slate-700 border border-dashed border-slate-300">
                <Code2 className="h-4 w-4 mr-1.5" />
                開発ツール
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
