import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
import { BACKEND_API_URL } from '../../config/api'

const AppHeader = () => {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [backendEnv, setBackendEnv] = useState(null)
  const [dbEnv, setDbEnv] = useState(null)
  const { tenantId, tenantName, changeTenant, availableTenants, loading } = useTenant()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // バックエンドとDB環境情報を取得
  useEffect(() => {
    const fetchHealthInfo = async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/api/health`)
        const data = await response.json()

        if (data.success) {
          setBackendEnv(data.backend.environment)
          setDbEnv(data.database.environment)
        }
      } catch (error) {
        console.error('Failed to fetch health info:', error)
        setBackendEnv('ERROR')
        setDbEnv('ERROR')
      }
    }

    fetchHealthInfo()
  }, [])

  const handleTenantChange = e => {
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
    // 環境変数で明示的に指定されている場合はそれを優先
    const envVar = import.meta.env.VITE_ENV
    const hostname = window.location.hostname

    // デバッグログ
    console.log('🔍 Environment Detection:')
    console.log('  VITE_ENV:', envVar)
    console.log('  hostname:', hostname)
    console.log('  import.meta.env:', import.meta.env)

    if (envVar) {
      const envMap = {
        local: { name: 'LOCAL', label: 'ローカル', color: 'blue' },
        stg: { name: 'STG', label: 'ステージング', color: 'yellow' },
        prd: { name: 'PRD', label: '本番', color: 'green' },
      }
      const result = envMap[envVar.toLowerCase()] || envMap.local
      console.log('  → Determined by VITE_ENV:', result.name)
      return result
    }

    // ホスト名から自動判定
    console.log('  → Determining by hostname...')

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('  → Result: LOCAL')
      return { name: 'LOCAL', label: 'ローカル', color: 'blue' }
    } else if (
      hostname.includes('shift-scheduler-ai-stg.vercel.app') ||
      hostname.includes('staging-shift-scheduler-ai.vercel.app')
    ) {
      // ステージング環境
      console.log('  → Result: STG (matched staging hostname)')
      return { name: 'STG', label: 'ステージング', color: 'yellow' }
    } else if (
      hostname.includes('vercel.app') &&
      !hostname.includes('shift-scheduler-ai.vercel.app')
    ) {
      // プレビューデプロイ（xxxxx-username.vercel.app）
      console.log('  → Result: DEV (preview deploy)')
      return { name: 'DEV', label: '開発', color: 'amber' }
    } else {
      // 本番ドメイン
      console.log('  → Result: PRD (default fallback)')
      return { name: 'PRD', label: '本番', color: 'green' }
    }
  }

  const environment = getEnvironment()

  const formatDate = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const weekday = weekdays[date.getDay()]
    return `${year}年${month}月${day}日（${weekday}）${hours}:${minutes}`
  }

  const menuItems = [
    { label: 'LINE', icon: MessageSquare, path: '/shift/line' },
    { label: 'スタッフ管理', icon: Users, path: '/staff' },
    { label: '店舗管理', icon: Store, path: '/store' },
    { label: '予実管理', icon: TrendingUp, path: '/budget-actual' },
    { label: 'マスター管理', icon: Database, path: '/master' },
  ]

  const handleMenuItemClick = path => {
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 左側：ロゴ/ホームボタン */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => {
                window.location.href = '/'
              }}
              className="app-logo"
            >
              <BarChart3 className="h-6 w-6 text-slate-700" />
              <span className="font-bold text-base md:text-lg text-slate-900 hidden sm:inline">
                Shift Scheduler
              </span>
            </button>
            <div className="text-xs text-slate-500 items-center gap-1 hidden sm:flex whitespace-nowrap">
              <CalendarIcon className="h-3 w-3 flex-shrink-0" />
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
          </div>

          {/* 中央：デスクトップナビゲーション */}
          <nav className="hidden lg:flex items-center gap-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMenuItemClick(item.path)}
                  className="text-slate-700"
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {item.label}
                </Button>
              )
            })}
          </nav>

          {/* 右側：環境表示インジケーター */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                environment.color === 'green'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : environment.color === 'amber'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full flex-shrink-0 ${
                  environment.color === 'green'
                    ? 'bg-green-500'
                    : environment.color === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                }`}
              />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="font-semibold">{environment.name}</span>
                  {!loading && tenantId && (
                    <span className="text-[10px] opacity-70">(ID:{tenantId})</span>
                  )}
                </div>
                <div className="text-[10px] opacity-60 hidden md:block whitespace-nowrap">
                  <span title="Frontend">FE:{environment.name}</span>
                  {backendEnv && (
                    <>
                      <span className="mx-1">→</span>
                      <span title="Backend">BE:{backendEnv}</span>
                    </>
                  )}
                  {dbEnv && (
                    <>
                      <span className="mx-1">→</span>
                      <span title="Database">DB:{dbEnv}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

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
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-4 space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={index}
                  onClick={() => handleMenuItemClick(item.path)}
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
