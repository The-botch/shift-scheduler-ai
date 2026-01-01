/**
 * ShiftDashboard.jsx
 * 新しいトップ画面コンポーネント
 *
 * 構成:
 * - Sidebar（左）: 年月選択 + ナビゲーション
 * - メインエリア（右）: 3カード（募集状況、第一案、第二案）
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTargetMonth } from '../../../hooks/useTargetMonth'
import { useShiftStatus } from '../../../hooks/useShiftStatus'
import { BACKEND_API_URL } from '../../../config/api'
import { ShiftRepository } from '../../../infrastructure/repositories/ShiftRepository'
import Sidebar from '../../Sidebar'
import ShiftStatusCards from '../../ShiftStatusCards'

const shiftRepository = new ShiftRepository()

/**
 * ローディングスピナー
 */
const Spinner = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

/**
 * シフトダッシュボードコンポーネント
 * @param {Object} props
 * @param {Function} props.onStaffManagement - スタッフ管理画面への遷移コールバック（App.jsxから渡される）
 */
const ShiftDashboard = ({ onStaffManagement }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { targetMonth } = useTargetMonth()

  // 遷移元からの年月情報を取得（ある場合はそれを使用）
  const stateYear = location.state?.year
  const stateMonth = location.state?.month

  // 選択中の年月（遷移元からの年月があればそれを優先）
  const [selectedYear, setSelectedYear] = useState(
    stateYear ? parseInt(stateYear) : targetMonth.year
  )
  const [selectedMonth, setSelectedMonth] = useState(
    stateMonth ? parseInt(stateMonth) : targetMonth.month
  )

  // 環境情報
  const [backendEnv, setBackendEnv] = useState(null)
  const [dbEnv, setDbEnv] = useState(null)

  // シフトステータス取得
  const {
    loading,
    recruitmentStatus,
    firstPlanStatus,
    secondPlanStatus,
    submissionStats,
    refetch,
  } = useShiftStatus(selectedYear, selectedMonth)

  // recruitmentStatusにsubmissionStatsをマージ
  const recruitmentStatusWithStats = {
    ...recruitmentStatus,
    ...submissionStats,
  }

  // ページに戻ってきた時にデータをリフレッシュ
  useEffect(() => {
    refetch()
  }, [location.key])

  // 環境情報を取得
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
      }
    }
    fetchHealthInfo()
  }, [])

  // 環境判定
  const getEnvironment = () => {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return { name: 'LOCAL', color: 'blue' }
    } else if (hostname.includes('stg') || hostname.includes('staging')) {
      return { name: 'STG', color: 'yellow' }
    } else {
      return { name: 'PRD', color: 'green' }
    }
  }

  const environment = getEnvironment()

  /**
   * 月選択ハンドラ
   */
  const handleMonthSelect = (year, month) => {
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  /**
   * 募集状況カードクリック → Monitoring へ遷移
   */
  const handleRecruitmentClick = () => {
    navigate('/shift/monitoring', {
      state: {
        shift: { year: selectedYear, month: selectedMonth },
      },
    })
  }

  /**
   * 第一案カードクリック → FirstPlanEditor へ遷移（旧画面と同じ動作）
   */
  const handleFirstPlanClick = async () => {
    const status =
      firstPlanStatus.status === 'approved'
        ? 'APPROVED'
        : firstPlanStatus.status === 'draft'
          ? 'DRAFT'
          : 'not_started'

    // プランが存在しない場合は前月データを取得してから遷移
    if (status === 'not_started' && !firstPlanStatus.planId) {
      try {
        const result = await shiftRepository.fetchPreviousDataAllStores({
          target_year: selectedYear,
          target_month: selectedMonth,
        })

        if (result.success && result.data?.stores) {
          const shift = {
            year: selectedYear,
            month: selectedMonth,
            planId: null,
            planType: 'FIRST',
            status: 'unsaved', // FirstPlanEditorのhandleApproveで正しく処理されるようにする
            initialData: {
              stores: result.data.stores,
            },
          }
          navigate('/shift/draft-editor', { state: { shift } })
        } else {
          alert('前月のデータが見つかりませんでした。')
        }
      } catch (error) {
        console.error('前月データ取得エラー:', error)
        alert('前月データの取得に失敗しました。')
      }
      return
    }

    // 既存のプランがある場合は通常遷移
    const shift = {
      year: selectedYear,
      month: selectedMonth,
      planId: firstPlanStatus.planId,
      planType: 'FIRST',
      status,
    }

    navigate('/shift/draft-editor', { state: { shift } })
  }

  /**
   * 第二案カードクリック → SecondPlanEditor へ遷移
   */
  const handleSecondPlanClick = () => {
    if (secondPlanStatus.status === 'unavailable') return

    navigate('/shift/second-plan', {
      state: {
        shift: {
          year: selectedYear,
          month: selectedMonth,
          planId: secondPlanStatus.planId,
          planType: 'SECOND',
          status:
            secondPlanStatus.status === 'approved'
              ? 'APPROVED'
              : secondPlanStatus.status === 'draft'
                ? 'DRAFT'
                : 'not_started',
        },
      },
    })
  }

  /**
   * スタッフ管理クリック
   */
  const handleStaffManagement = () => {
    if (onStaffManagement) {
      onStaffManagement()
    } else {
      navigate('/staff')
    }
  }

  return (
    <div className="flex h-screen">
      {/* サイドバー */}
      <Sidebar
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onMonthSelect={handleMonthSelect}
        onStaffManagement={handleStaffManagement}
        onMasterManagement={() => navigate('/master')}
        currentPath="/"
      />

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* ヘッダー */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {selectedYear}年{selectedMonth}月 シフト管理
              </h1>
              <p className="text-slate-600 text-sm">対象月のシフト作成・管理</p>
            </div>
            {/* 環境表示 */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium ${
                environment.color === 'green'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : environment.color === 'yellow'
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  environment.color === 'green'
                    ? 'bg-green-500'
                    : environment.color === 'yellow'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                }`}
              />
              <span className="font-semibold">{environment.name}</span>
              {backendEnv && (
                <span className="text-[10px] opacity-70 ml-1">
                  FE:{environment.name} → BE:{backendEnv}
                  {dbEnv && ` → DB:${dbEnv}`}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* カードエリア */}
        <div className="flex-1 p-6 overflow-auto flex items-center justify-center">
          {loading ? (
            <Spinner />
          ) : (
            <ShiftStatusCards
              recruitmentStatus={recruitmentStatusWithStats}
              firstPlanStatus={firstPlanStatus}
              secondPlanStatus={secondPlanStatus}
              onRecruitmentClick={handleRecruitmentClick}
              onFirstPlanClick={handleFirstPlanClick}
              onSecondPlanClick={handleSecondPlanClick}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default ShiftDashboard
