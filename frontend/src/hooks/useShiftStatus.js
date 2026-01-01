/**
 * useShiftStatus.js
 * シフト状態取得Hook
 *
 * 指定された年月のシフトステータスを取得
 * - 募集状況（第一案存在 + DB締切日ベース）
 * - 第一案ステータス
 * - 第二案ステータス
 * - 提出率
 */

import { useState, useEffect, useCallback } from 'react'
import { ShiftRepository } from '../infrastructure/repositories/ShiftRepository'
import { MasterRepository } from '../infrastructure/repositories/MasterRepository'

const shiftRepository = new ShiftRepository()
const masterRepository = new MasterRepository()

/**
 * 募集ステータスを計算する共通関数
 * @param {boolean} firstPlanExists - 第一案が存在するか
 * @param {boolean} firstPlanApproved - 第一案が承認済みか
 * @param {number} year - 対象年
 * @param {number} month - 対象月
 * @param {number} deadlineDay - 締切日（DBから取得）
 * @returns {object} 募集ステータス情報
 */
export const calculateRecruitmentStatus = (
  firstPlanExists,
  firstPlanApproved,
  year,
  month,
  deadlineDay = 17
) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // 締め切り日を計算（対象月の前月のdeadlineDay日）
  const deadlineDate = new Date(year, month - 2, deadlineDay)

  // 対象月の翌月1日（対象月が完全に終わる日）
  const nextMonthStart = new Date(year, month, 1)

  // 第一案がない、または第一案が承認されていない場合 → 募集未開始
  if (!firstPlanExists || !firstPlanApproved) {
    return {
      status: 'not_started',
      statusLabel: '募集未開始',
      deadline: '第一案承認待ち',
      deadlineDate,
      color: 'slate',
      bgColor: 'from-slate-50 to-slate-100',
      borderColor: 'border-slate-300',
    }
  }

  // 第一案が承認済みで、締め切り前 → 募集中
  if (now < deadlineDate) {
    return {
      status: 'recruiting',
      statusLabel: '募集中',
      deadline: `締切: ${deadlineDate.getMonth() + 1}/${deadlineDate.getDate()}`,
      deadlineDate,
      color: 'green',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
    }
  }

  // 第一案があり、締め切り後だが対象月内または対象月前（変更可能）
  if (now >= deadlineDate && now < nextMonthStart) {
    return {
      status: 'closed',
      statusLabel: '締切済',
      deadline: '変更可能',
      deadlineDate,
      color: 'orange',
      bgColor: 'from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
    }
  }

  // 対象月が完全に過去（募集終了）
  return {
    status: 'finished',
    statusLabel: '募集終了',
    deadline: '確定済み',
    deadlineDate,
    color: 'gray',
    bgColor: 'from-gray-50 to-gray-100',
    borderColor: 'border-gray-300',
  }
}

/**
 * シフトステータス取得Hook
 * @param {number} year - 対象年
 * @param {number} month - 対象月
 * @param {string} tenantId - テナントID（オプション）
 * @returns {{
 *   loading: boolean,
 *   error: Error | null,
 *   recruitmentStatus: object,
 *   firstPlanStatus: object,
 *   secondPlanStatus: object,
 *   submissionStats: object,
 *   refetch: () => Promise<void>
 * }}
 */
export const useShiftStatus = (year, month, tenantId = null) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deadlineDay, setDeadlineDay] = useState(17)
  const [firstPlanExists, setFirstPlanExists] = useState(false)

  // 募集状況
  const [recruitmentStatus, setRecruitmentStatus] = useState({
    status: 'not_started',
    statusLabel: '募集未開始',
    deadline: '',
    deadlineDate: null,
    color: 'slate',
    bgColor: 'from-slate-50 to-slate-100',
    borderColor: 'border-slate-300',
  })

  // 第一案ステータス
  const [firstPlanStatus, setFirstPlanStatus] = useState({
    status: 'not_started',
    planId: null,
    updatedAt: null,
  })

  // 第二案ステータス
  const [secondPlanStatus, setSecondPlanStatus] = useState({
    status: 'unavailable',
    planId: null,
    updatedAt: null,
  })

  // 提出統計
  const [submissionStats, setSubmissionStats] = useState({
    submittedCount: 0,
    totalCount: 0,
    submissionRate: 0,
  })

  const fetchData = useCallback(async () => {
    if (!year || !month) return

    setLoading(true)
    setError(null)
    setFirstPlanExists(false)

    try {
      // 並列でAPI呼び出し
      const [plans, deadlineSettings, preferences, staff] = await Promise.all([
        shiftRepository.getPlans({ tenantId, year, month }),
        shiftRepository.getDeadlineSettings(tenantId),
        shiftRepository.getPreferences({
          dateFrom: `${year}-${String(month).padStart(2, '0')}-01`,
          dateTo: `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`,
        }),
        masterRepository.getStaff(),
      ])

      // 締切日設定を取得
      let currentDeadlineDay = 17
      if (deadlineSettings && deadlineSettings.length > 0) {
        const partTimeSetting = deadlineSettings.find(s => s.employment_type === 'PART_TIME')
        const setting = partTimeSetting || deadlineSettings[0]
        currentDeadlineDay = setting.deadline_day || 17
      }
      setDeadlineDay(currentDeadlineDay)

      // 第一案の存在確認と承認状況
      const firstPlan = plans.find(p => p.plan_type === 'FIRST')
      const hasFirstPlan = !!firstPlan
      const isFirstPlanApproved = firstPlan?.status?.toUpperCase() === 'APPROVED'
      setFirstPlanExists(hasFirstPlan)

      // 募集状況を計算
      const newRecruitmentStatus = calculateRecruitmentStatus(
        hasFirstPlan,
        isFirstPlanApproved,
        year,
        month,
        currentDeadlineDay
      )
      setRecruitmentStatus(newRecruitmentStatus)

      // 提出率を計算（アルバイトのみ、かつ在籍者のみを対象とする）
      const isPartTimeStaff = s => s.employment_type === 'PART_TIME' || s.employment_type === 'PART'
      const isActiveStaff = s => s.is_active === true

      const partTimeStaff = staff.filter(s => isPartTimeStaff(s) && isActiveStaff(s))
      const partTimeStaffIds = new Set(partTimeStaff.map(s => s.staff_id))

      const submittedStaffIds = new Set(
        preferences.filter(p => partTimeStaffIds.has(p.staff_id)).map(p => p.staff_id)
      )
      const submittedCount = submittedStaffIds.size
      const totalCount = partTimeStaff.length
      const submissionRate = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0

      setSubmissionStats({
        submittedCount,
        totalCount,
        submissionRate,
      })

      // 第一案ステータスを判定
      if (!firstPlan) {
        setFirstPlanStatus({
          status: 'not_started',
          planId: null,
          updatedAt: null,
        })
      } else if (firstPlan.status?.toUpperCase() === 'APPROVED') {
        setFirstPlanStatus({
          status: 'approved',
          planId: firstPlan.plan_id,
          updatedAt: firstPlan.updated_at,
        })
      } else {
        setFirstPlanStatus({
          status: 'draft',
          planId: firstPlan.plan_id,
          updatedAt: firstPlan.updated_at,
        })
      }

      // 第二案ステータスを判定
      const isFirstApproved = firstPlan?.status?.toUpperCase() === 'APPROVED'
      const secondPlan = plans.find(p => p.plan_type === 'SECOND')

      if (secondPlan) {
        if (secondPlan.status?.toUpperCase() === 'APPROVED') {
          setSecondPlanStatus({
            status: 'approved',
            planId: secondPlan.plan_id,
            updatedAt: secondPlan.updated_at,
          })
        } else {
          setSecondPlanStatus({
            status: 'draft',
            planId: secondPlan.plan_id,
            updatedAt: secondPlan.updated_at,
          })
        }
      } else if (!isFirstApproved) {
        setSecondPlanStatus({
          status: 'unavailable',
          planId: null,
          updatedAt: null,
        })
      } else {
        setSecondPlanStatus({
          status: 'not_started',
          planId: null,
          updatedAt: null,
        })
      }
    } catch (err) {
      console.error('シフトステータス取得エラー:', err)
      setError(err)
      setFirstPlanExists(false)
      // エラー時は募集未開始状態にリセット
      setRecruitmentStatus({
        status: 'not_started',
        statusLabel: '募集未開始',
        deadline: '第一案作成待ち',
        deadlineDate: null,
        color: 'slate',
        bgColor: 'from-slate-50 to-slate-100',
        borderColor: 'border-slate-300',
      })
    } finally {
      setLoading(false)
    }
  }, [year, month, tenantId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    loading,
    error,
    recruitmentStatus,
    firstPlanStatus,
    secondPlanStatus,
    submissionStats,
    firstPlanExists,
    deadlineDay,
    refetch: fetchData,
  }
}

export default useShiftStatus
