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
  BookOpen,
  Menu,
  X,
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
  onDataImpactDocumentation,
  onTenantSettings,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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

  // 環境判定
  const getEnvironment = () => {
    const hostname = window.location.hostname

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return { name: 'LOCAL', label: 'ローカル', color: 'blue' }
    } else if (hostname.includes('vercel.app') && !hostname.includes('shift-scheduler-ai.vercel.app')) {
      // プレビューデプロイ（xxxxx-username.vercel.app）
      return { name: 'DEV', label: '開発', color: 'amber' }
    } else {
      // 本番ドメイン
      return { name: 'PRD', label: '本番', color: 'green' }
    }
  }

  const environment = getEnvironment()

  const formatDate = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const weekday = weekdays[date.getDay()]
    return `${year}年${month}月${day}日（${weekday}）`
  }

  const menuItems = [
    { label: 'LINE', icon: MessageSquare, onClick: onLineMessages, show: !!onLineMessages },
    { label: 'スタッフ管理', icon: Users, onClick: onStaffManagement, show: !!onStaffManagement },
    { label: '店舗管理', icon: Store, onClick: onStoreManagement, show: !!onStoreManagement },
    { label: '予実管理', icon: TrendingUp, onClick: onBudgetActualManagement, show: !!onBudgetActualManagement },
    { label: 'マスター管理', icon: Database, onClick: onMasterDataManagement, show: !!onMasterDataManagement },
  ].filter(item => item.show)

  const handleMenuItemClick = (onClick) => {
    onClick()
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="app-header">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 左側：ロゴ/ホームボタン */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={onHome}
              className="app-logo"
            >
              <BarChart3 className="h-6 w-6 text-slate-700" />
              <span className="font-bold text-base md:text-lg text-slate-900 hidden sm:inline">Shift Scheduler</span>
            </button>
            <div className="text-xs text-slate-500 items-center gap-1 hidden sm:flex">
              <CalendarIcon className="h-3 w-3" />
              {formatDate(currentTime)}
            </div>
            {/* テナント切り替え */}
            {!loading && availableTenants.length > 0 && (
              <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 bg-slate-50 rounded-md border border-slate-200">
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
            {/* 環境表示インジケーター */}
            <div className={`flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-md text-xs font-medium ${
              environment.color === 'green'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : environment.color === 'amber'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              <div className={`h-2 w-2 rounded-full ${
                environment.color === 'green'
                  ? 'bg-green-500'
                  : environment.color === 'amber'
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`} />
              <span className="font-semibold">{environment.name}</span>
              <span className="hidden sm:inline opacity-70">
                ({environment.label})
              </span>
              {!loading && tenantId && (
                <span className="text-[10px] opacity-70">
                  ID:{tenantId}
                </span>
              )}
            </div>
          </div>

          {/* デスクトップナビゲーション */}
          <nav className="hidden lg:flex items-center gap-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={item.onClick}
                  className="text-slate-700"
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {item.label}
                </Button>
              )
            })}
          </nav>

          {/* モバイルハンバーガーメニュー */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="メニュー"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-slate-700" />
            ) : (
              <Menu className="h-6 w-6 text-slate-700" />
            )}
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-4 space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={index}
                  onClick={() => handleMenuItemClick(item.onClick)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </header>
  )
}

export default AppHeader
