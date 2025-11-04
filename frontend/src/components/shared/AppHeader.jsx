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
  Code2,
  Building2,
  Database,
} from 'lucide-react'
import { useTenant } from '../../contexts/TenantContext'

const AppHeader = ({
  onHome,
  onShiftManagement,
  onLineMessages,
  onMonitoring,
  onStaffManagement,
  onStoreManagement,
  onConstraintManagement,
  onBudgetActualManagement,
  onMasterDataManagement,
  onTenantSettings,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const { tenantId, tenantName, changeTenant, availableTenants, loading } = useTenant()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleTenantChange = (e) => {
    const selectedTenantId = parseInt(e.target.value)
    const selectedTenant = availableTenants.find(t => t.tenant_id === selectedTenantId)
    if (selectedTenant) {
      changeTenant(selectedTenant.tenant_id, selectedTenant.tenant_code)
      // ページをリロードして全データを再取得
      window.location.reload()
    }
  }

  const formatDate = date => {
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
            {/* テナント切り替え */}
            {!loading && availableTenants.length > 0 && (
              <div className="flex items-center gap-2 ml-4 px-3 py-1.5 bg-slate-50 rounded-md border border-slate-200">
                <Building2 className="h-4 w-4 text-slate-600" />
                <select
                  value={tenantId}
                  onChange={handleTenantChange}
                  className="text-xs font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer"
                >
                  {availableTenants.map(tenant => (
                    <option key={tenant.tenant_id} value={tenant.tenant_id}>
                      {tenant.tenant_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 右側：ナビゲーションメニュー */}
          <nav className="flex items-center gap-2">
            {onLineMessages && (
              <Button variant="ghost" size="sm" onClick={onLineMessages} className="text-slate-700">
                <MessageSquare className="h-4 w-4 mr-1.5" />
                LINE
              </Button>
            )}
            {onStaffManagement && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onStaffManagement}
                className="text-slate-700"
              >
                <Users className="h-4 w-4 mr-1.5" />
                スタッフ管理
              </Button>
            )}
            {onStoreManagement && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onStoreManagement}
                className="text-slate-700"
              >
                <Store className="h-4 w-4 mr-1.5" />
                店舗管理
              </Button>
            )}
            {onBudgetActualManagement && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBudgetActualManagement}
                className="text-slate-700"
              >
                <TrendingUp className="h-4 w-4 mr-1.5" />
                予実管理
              </Button>
            )}
            {onMasterDataManagement && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMasterDataManagement}
                className="text-slate-700"
              >
                <Database className="h-4 w-4 mr-1.5" />
                マスター管理
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
