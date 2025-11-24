import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Calendar, Plus, Edit3, Eye, Check, Clock, Store, Upload, Copy, X } from 'lucide-react'
import { ShiftRepository } from '../../../infrastructure/repositories/ShiftRepository'
import { MasterRepository } from '../../../infrastructure/repositories/MasterRepository'
import FirstPlanEditor from './FirstPlanEditor'

const shiftRepository = new ShiftRepository()
const masterRepository = new MasterRepository()

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

const ShiftManagement = () => {
  const navigate = useNavigate()
  const [shifts, setShifts] = useState([]) // マトリックスデータ: { storeId, storeName, months: [{month, status, ...}] }
  const [summary, setSummary] = useState([]) // サマリーデータ
  const [loading, setLoading] = useState(true)
  const [creatingShift, setCreatingShift] = useState(null) // 作成中の月を追跡
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()) // 年度選択
  const [viewMode, setViewMode] = useState('matrix') // 'matrix' or 'detail'
  const [viewingShift, setViewingShift] = useState(null) // 閲覧中のシフト情報
  const [showCreateModal, setShowCreateModal] = useState(false) // 新規作成モーダル表示
  const [modalShift, setModalShift] = useState(null) // モーダルで選択されたシフト
  const [isCopying, setIsCopying] = useState(false) // コピー中の状態
  const [selectedStore, setSelectedStore] = useState('all') // 店舗フィルター
  const [availableStores, setAvailableStores] = useState([]) // 利用可能な店舗リスト

  // 常に現在年を使用
  const currentYear = new Date().getFullYear()

  // ナビゲーション関数（props由来の関数を置き換え）
  const onFirstPlan = shift => {
    navigate('/shift/draft-editor', { state: { shift } })
  }

  const onCreateSecondPlan = shift => {
    // 第二案は全店舗対象なので、年月とplanIdのみを渡す（storeIdを除外）
    const secondPlanData = {
      year: shift.year,
      month: shift.month,
      planId: shift.planId,
    }
    navigate('/shift/second-plan', { state: { shift: secondPlanData } })
  }

  const onMonitoring = shift => {
    navigate('/shift/monitoring', { state: { shift } })
  }

  const onLineMessages = () => {
    navigate('/shift/line')
  }

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
      const summaryData = await shiftRepository.getSummary({ year: selectedYear })
      setSummary(summaryData)

      // デバッグ: 11月のデータを確認
      const novemberData = summaryData.filter(s => parseInt(s.month) === 11)
      console.log('11月のサマリーデータ:', novemberData)

      // 店舗リストを抽出してグローバル状態に保存
      const stores = Array.from(
        new Map(
          summaryData
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
      const filteredStores =
        selectedStore === 'all'
          ? storesToUse
          : storesToUse.filter(s => s.store_id === parseInt(selectedStore))

      // マトリックスデータ構造を生成: 店舗×月
      const matrixData = filteredStores.map(store => {
        const months = monthsToShow.map(month => {
          // その月のすべてのプランを取得
          const monthPlans = summaryData.filter(
            s => parseInt(s.store_id) === store.store_id && parseInt(s.month) === month
          )

          // 第2案を優先、なければ第1案、なければnull
          const monthData =
            monthPlans.find(p => p.plan_type === 'SECOND') ||
            monthPlans.find(p => p.plan_type === 'FIRST') ||
            null

          // ステータス判定
          let status = 'not_started'
          if (monthData) {
            // データが存在する場合、APIから返されたstatusを使用（大文字で統一）
            if (monthData.status) {
              status = monthData.status.toUpperCase()
            } else {
              // statusがない場合はcompletedとする
              status = 'COMPLETED'
            }
          }

          return {
            month,
            year: selectedYear,
            storeId: store.store_id,
            store_name: store.store_name,
            planId: monthData ? monthData.plan_id : null,
            planType: monthData && monthData.plan_type ? monthData.plan_type.toUpperCase() : null,
            status,
            createdAt: monthData ? new Date().toISOString().split('T')[0] : null,
            staff: monthData ? parseInt(monthData.staff_count) : 0,
            totalHours: monthData ? parseFloat(monthData.total_hours) || 0 : 0,
          }
        })

        return {
          storeId: store.store_id,
          store_name: store.store_name,
          months,
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

  const getStatusInfo = (planType, status) => {
    // 未作成の場合
    if (!status || status === 'not_started') {
      return { label: '未作成', color: 'gray' }
    }

    // ステータスを大文字に正規化
    const normalizedStatus = status?.toUpperCase()

    // plan_typeがnullまたは空の場合、statusから推測（デフォルトで第1案として扱う）
    if (!planType) {
      if (normalizedStatus === 'DRAFT') return { label: '第1案作成中', color: 'yellow' }
      if (normalizedStatus === 'APPROVED') return { label: '第1案承認済み', color: 'cyan' }
    }

    // 第1案
    if (planType === 'FIRST') {
      if (normalizedStatus === 'DRAFT') return { label: '第1案作成中', color: 'yellow' }
      if (normalizedStatus === 'APPROVED') return { label: '第1案承認済み', color: 'cyan' }
    }

    // 第2案
    if (planType === 'SECOND') {
      if (normalizedStatus === 'DRAFT') return { label: '第2案作成中', color: 'yellow' }
      if (normalizedStatus === 'APPROVED') return { label: '第2案承認済み', color: 'green' }
    }

    console.warn(
      '不明なステータス:',
      'planType=',
      planType,
      'status=',
      status,
      'normalizedStatus=',
      normalizedStatus
    )
    return { label: '不明', color: 'gray' }
  }

  const handleViewShift = shift => {
    // 確定済みシフトの閲覧
    setViewingShift({
      year: shift.year,
      month: shift.month,
      storeId: shift.storeId,
    })
    setViewMode('detail')
  }

  const handleBackToMatrix = () => {
    setViewingShift(null)
    setViewMode('matrix')
  }

  const handleViewHistory = (shift, planType = 'SECOND') => {
    setViewingShift({ ...shift, planType })
    setViewMode('multistore')
  }

  const handleViewDraft = (shift, planType = 'FIRST') => {
    setViewingShift({ ...shift, planType })
    setViewMode('draft')
  }

  const handleDraftApprove = async () => {
    // 承認後にシフトサマリーを再読み込みしてマトリックス画面に戻る
    await loadShiftSummary()
    handleBackToMatrix()
  }

  const handleViewRecruitmentStatus = shift => {
    // Monitoring画面の履歴タブに遷移して、その月の希望提出状況を表示
    // 店舗IDも一緒に渡す
    if (onMonitoring) {
      onMonitoring(shift) // shift オブジェクトには storeId が含まれている
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

    // 第2案の編集の場合
    if (shift.planType === 'SECOND') {
      if (onCreateSecondPlan) {
        onCreateSecondPlan(shift)
      }
      return
    }

    // それ以外の場合（第1案）は第2案作成画面に遷移
    // データを再読み込み
    await loadShiftSummary()
  }

  // 新規作成ボタンクリック時にモーダルを開く
  const handleOpenCreateModal = (shift, isBatchCreate = false) => {
    setModalShift({ ...shift, isBatchCreate })
    setShowCreateModal(true)
  }

  // モーダルを閉じる
  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setModalShift(null)
  }

  // 前月からコピー
  const handleCopyFromPrevious = async () => {
    if (!modalShift) return

    try {
      // ローディング開始
      setIsCopying(true)

      // 全店舗一括作成の場合
      if (modalShift.isBatchCreate) {
        // 新しいAPI: DB書き込みなしでデータ取得のみ
        const result = await shiftRepository.fetchPreviousDataAllStores({
          target_year: modalShift.year,
          target_month: modalShift.month,
        })

        if (result.success) {
          // モーダルを閉じる
          setShowCreateModal(false)
          setIsCopying(false)
          setModalShift(null)

          // FirstPlanEditorにデータを渡して遷移
          setViewMode('draft')
          setViewingShift({
            year: modalShift.year,
            month: modalShift.month,
            planType: 'FIRST',
            status: 'unsaved', // DBに未保存
            initialData: result.data, // 取得したシフトデータ
          })
        }
      } else {
        // 個別店舗の場合
        const result = await shiftRepository.copyFromPreviousMonth({
          store_id: modalShift.storeId,
          target_year: modalShift.year,
          target_month: modalShift.month,
          created_by: 1, // TODO: 実際のユーザーIDに置き換え
        })

        // 成功したらシフト編集画面に直接遷移
        if (result.success && onFirstPlan) {
          // データ再読み込み後に遷移
          await loadShiftSummary()

          // モーダルを閉じる
          setShowCreateModal(false)
          setIsCopying(false)
          setModalShift(null)

          // plan_idを設定し、status='draft'で遷移（直接編集画面へ）
          onFirstPlan({
            ...modalShift,
            planId: result.data.plan_id,
            status: 'draft', // コピー後は下書き状態なので、直接編集画面に遷移
          })
        }
      }
    } catch (error) {
      console.error('前月からのコピーエラー:', error)
      setIsCopying(false)
      alert(`エラー: ${error.message || 'シフトのコピーに失敗しました'}`)
    }
  }

  // CSVアップロード（TODO: 実装）
  const handleUploadCSV = () => {
    setShowCreateModal(false)
    // TODO: CSV アップロード機能を実装
    alert('CSV アップロード機能は未実装です')
    setModalShift(null)
  }

  const getRecruitmentStatus = (year, month) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0) // 時刻をリセットして日付のみで比較

    // 締め切り日を計算（対象月の前月20日）
    const deadlineDate = new Date(year, month - 2, 20) // 前月の20日

    // 対象月の翌月1日（対象月が完全に終わる日）
    const nextMonthStart = new Date(year, month, 1)

    // 締め切り前（募集中）
    if (now < deadlineDate) {
      return { label: '募集中', color: 'text-green-600 font-semibold' }
    }

    // 締め切り後だが対象月内または対象月前（変更可能）
    if (now >= deadlineDate && now < nextMonthStart) {
      return { label: '締切済', color: 'text-orange-600' }
    }

    // 対象月が完全に過去（募集終了）
    return { label: '募集終了', color: 'text-gray-600' }
  }

  const getActionButton = shift => {
    const isCreating = creatingShift === shift.month

    // 該当月(現在の月)より前の月は「閲覧」ボタンを表示
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const targetDate = new Date(shift.year, shift.month - 1, 1)
    const currentDate = new Date(currentYear, currentMonth - 1, 1)

    if (targetDate < currentDate) {
      // 過去月：第2案閲覧のみ
      return (
        <button
          className="text-xs text-gray-600 hover:text-gray-800 hover:underline"
          onClick={() => handleViewHistory(shift, 'SECOND')}
        >
          第2案閲覧
        </button>
      )
    }

    // ステータスとplan_typeに応じてアクションを表示
    // 第2案が存在する場合（下書きまたは承認済み）
    if (shift.planType === 'SECOND' && (shift.status === 'DRAFT' || shift.status === 'APPROVED')) {
      return (
        <button
          className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
          onClick={() => handleEditShift(shift)}
        >
          第2案編集
        </button>
      )
    }

    // 第1案承認済み → 第2案作成のみ表示
    if (shift.status === 'APPROVED' && shift.planType === 'FIRST') {
      return (
        <button
          className="text-xs text-purple-600 hover:text-purple-800 hover:underline"
          onClick={() => onCreateSecondPlan && onCreateSecondPlan(shift)}
        >
          第2案作成
        </button>
      )
    }

    // その他の場合（第1案の新規作成、第1案の編集）は非表示
    return null
  }

  // FirstPlanEditor表示モード（一括編集・一括作成・閲覧）
  if (viewMode === 'draft' && viewingShift) {
    // 月の判定
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const targetDate = new Date(viewingShift.year, viewingShift.month - 1, 1)
    const currentDate = new Date(currentYear, currentMonth - 1, 1)
    const isCurrentOrPastMonth = targetDate <= currentDate

    // その月の第1案が承認済みかチェック
    const firstPlansInMonth = summary.filter(
      s => parseInt(s.month) === viewingShift.month && s.plan_type === 'FIRST'
    )
    const allApproved =
      firstPlansInMonth.length > 0 &&
      firstPlansInMonth.every(p => p.status && p.status.toUpperCase() === 'APPROVED')

    // (過去月 OR 当月) かつ 承認済み → 閲覧モード
    const isViewMode = isCurrentOrPastMonth && allApproved

    return (
      <FirstPlanEditor
        selectedShift={viewingShift}
        mode={isViewMode ? 'view' : 'edit'}
        onBack={handleBackToMatrix}
        onApprove={handleDraftApprove}
      />
    )
  }

  // 閲覧モード（detail/multistore統合）→ FirstPlanEditor（閲覧モード）
  // 常に全店舗のデータを取得・表示。storeIdがあればそのstoreIdだけチェック、なければ全店舗チェック
  if ((viewMode === 'detail' || viewMode === 'multistore') && viewingShift) {
    return <FirstPlanEditor selectedShift={viewingShift} mode="view" onBack={handleBackToMatrix} />
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
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
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-gray-600" />
              <select
                value={selectedStore}
                onChange={e => setSelectedStore(e.target.value)}
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
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap">
                      店舗
                    </th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-r border-gray-200 bg-gray-100 whitespace-nowrap"></th>
                    {shifts[0]?.months.map(monthData => (
                      <th
                        key={monthData.month}
                        className="px-3 py-2 text-center font-semibold text-gray-700 border-b border-gray-200"
                      >
                        {monthData.month}月
                      </th>
                    ))}
                  </tr>
                  {/* 全店舗一括作成ボタン行 */}
                  <tr className="bg-blue-50">
                    <th
                      colSpan="2"
                      className="px-2 py-2 text-left font-semibold text-gray-700 border-b-2 border-r border-gray-200 text-xs"
                    >
                      全店舗
                    </th>
                    {shifts[0]?.months.map(monthData => {
                      // 月の判定
                      const now = new Date()
                      const currentYear = now.getFullYear()
                      const currentMonth = now.getMonth() + 1
                      const targetDate = new Date(monthData.year, monthData.month - 1, 1)
                      const currentDate = new Date(currentYear, currentMonth - 1, 1)
                      const isCurrentOrPastMonth = targetDate <= currentDate

                      // その月の全店舗の作成状況を確認（第1案の存在をサマリーから直接確認）
                      const firstPlansInMonth = summary.filter(
                        s => parseInt(s.month) === monthData.month && s.plan_type === 'FIRST'
                      )
                      // 全店舗（shifts配列の長さ）で第1案が作成済みかチェック
                      const allCreated = firstPlansInMonth.length === shifts.length
                      const someCreated = firstPlansInMonth.length > 0

                      // 承認済みかどうかをチェック（全ての第1案がAPPROVED状態）
                      const allApproved =
                        allCreated &&
                        firstPlansInMonth.every(
                          p => p.status && p.status.toUpperCase() === 'APPROVED'
                        )

                      // (過去月 OR 当月) AND 承認済み → 閲覧モード
                      const isViewOnly = isCurrentOrPastMonth && allApproved

                      return (
                        <th
                          key={`batch-${monthData.month}`}
                          className="px-2 py-2 text-center border-b-2 border-gray-200"
                        >
                          {isViewOnly ? (
                            // (過去月 OR 当月) かつ 承認済み：第1案閲覧ボタン
                            <button
                              onClick={() =>
                                handleViewDraft(
                                  { year: monthData.year, month: monthData.month },
                                  'FIRST'
                                )
                              }
                              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:underline"
                            >
                              第1案閲覧
                            </button>
                          ) : allCreated ? (
                            // 全店舗作成済み（未承認 OR 未来月）：一括編集ボタン
                            <button
                              onClick={() => {
                                // 全店舗のシフトを開く（DraftShiftEditor画面へ）
                                handleViewDraft(
                                  { year: monthData.year, month: monthData.month },
                                  'FIRST'
                                )
                              }}
                              className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors whitespace-nowrap"
                            >
                              一括編集
                            </button>
                          ) : (
                            // 未作成または一部作成済み：モーダルを開く
                            <button
                              onClick={() =>
                                handleOpenCreateModal(
                                  { year: monthData.year, month: monthData.month },
                                  true
                                )
                              }
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                            >
                              {someCreated ? '残り一括作成' : '全店舗一括作成'}
                            </button>
                          )}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((storeData, storeIndex) => {
                    const isEven = storeIndex % 2 === 0
                    const bgClass = isEven ? 'bg-white' : 'bg-gray-25'

                    return (
                      <React.Fragment key={`store-${storeData.storeId}`}>
                        {/* 1行目: 作成状況 */}
                        <tr
                          key={`${storeData.storeId}-status`}
                          className={`${bgClass} border-b border-gray-100`}
                        >
                          <td
                            rowSpan="3"
                            className="px-2 py-3 font-medium text-gray-900 border-r border-gray-200 text-xs align-middle"
                          >
                            {storeData.store_name}
                          </td>
                          <td className="px-2 py-2 text-xs text-gray-600 border-r border-gray-200 bg-gray-50">
                            作成状況
                          </td>
                          {storeData.months.map(monthData => {
                            const statusInfo = getStatusInfo(monthData.planType, monthData.status)
                            return (
                              <td
                                key={`${storeData.storeId}-${monthData.month}-status`}
                                className="px-2 py-2"
                              >
                                <div
                                  className={`w-full px-2 py-1 rounded text-center font-medium text-[10px] whitespace-nowrap ${
                                    statusInfo.color === 'green'
                                      ? 'bg-green-100 text-green-800'
                                      : statusInfo.color === 'blue'
                                        ? 'bg-blue-100 text-blue-800'
                                        : statusInfo.color === 'cyan'
                                          ? 'bg-cyan-100 text-cyan-800'
                                          : statusInfo.color === 'yellow'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {statusInfo.label}
                                </div>
                              </td>
                            )
                          })}
                        </tr>

                        {/* 2行目: 募集状況 */}
                        <tr
                          key={`${storeData.storeId}-recruitment`}
                          className={`${bgClass} border-b border-gray-100`}
                        >
                          <td className="px-2 py-2 text-xs text-gray-600 border-r border-gray-200 bg-gray-50">
                            募集状況
                          </td>
                          {storeData.months.map(monthData => {
                            const recruitmentStatus = getRecruitmentStatus(
                              monthData.year,
                              monthData.month
                            )
                            return (
                              <td
                                key={`${storeData.storeId}-${monthData.month}-recruitment`}
                                className="px-2 py-2"
                              >
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
                        <tr
                          key={`${storeData.storeId}-action`}
                          className={`${bgClass} border-b-2 border-gray-200`}
                        >
                          <td className="px-2 py-2 text-xs text-gray-600 border-r border-gray-200 bg-gray-50">
                            アクション
                          </td>
                          {storeData.months.map(monthData => (
                            <td
                              key={`${storeData.storeId}-${monthData.month}-action`}
                              className="px-2 py-2"
                            >
                              <div className="flex justify-center items-center min-h-[24px]">
                                {getActionButton({
                                  ...monthData,
                                  storeId: storeData.storeId,
                                  storeName: storeData.storeName,
                                })}
                              </div>
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* 新規作成モーダル */}
      {showCreateModal && modalShift && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCloseCreateModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {modalShift.year}年{modalShift.month}月の
                {modalShift.isBatchCreate ? '全店舗一括' : ''}シフト作成
              </h2>
              <button
                onClick={handleCloseCreateModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* コンテンツ */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">シフトの作成方法を選択してください</p>

              <div className="space-y-3">
                {/* 前月からコピー */}
                <button
                  onClick={handleCopyFromPrevious}
                  disabled={isCopying}
                  className="w-full flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    {isCopying ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    ) : (
                      <Copy className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-800">
                      {isCopying ? 'コピー中...' : '前月からコピー'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isCopying
                        ? 'シフトデータをコピーしています'
                        : `${modalShift.month === 1 ? `${modalShift.year - 1}年12月` : `${modalShift.year}年${modalShift.month - 1}月`}のシフトを曜日ベースでコピー`}
                    </div>
                  </div>
                </button>

                {/* CSVアップロード */}
                <button
                  onClick={handleUploadCSV}
                  disabled={isCopying}
                  className="w-full flex items-center gap-3 p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Upload className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-800">CSVアップロード</div>
                    <div className="text-xs text-gray-500">
                      シフトデータをCSVファイルから読み込む
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* フッター */}
            <div className="border-t px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                onClick={handleCloseCreateModal}
                disabled={isCopying}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ShiftManagement
