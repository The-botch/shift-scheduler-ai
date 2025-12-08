/**
 * useShiftStatus.js
 * シフト状態取得Hook
 *
 * 指定された年月のシフトステータスを取得
 * - 募集状況（提出率含む）
 * - 第一案ステータス
 * - 第二案ステータス
 */

import { useState, useEffect, useCallback } from 'react'
import { ShiftRepository } from '../infrastructure/repositories/ShiftRepository'
import { MasterRepository } from '../infrastructure/repositories/MasterRepository'
import { getRecruitmentStatus } from './useTargetMonth'

const shiftRepository = new ShiftRepository()
const masterRepository = new MasterRepository()

/**
 * シフトステータス取得Hook
 * @param {number} year - 対象年
 * @param {number} month - 対象月
 * @returns {{
 *   loading: boolean,
 *   error: Error | null,
 *   recruitmentStatus: object,
 *   firstPlanStatus: object,
 *   secondPlanStatus: object,
 *   refetch: () => Promise<void>
 * }}
 */
export const useShiftStatus = (year, month) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 募集状況
  const [recruitmentStatus, setRecruitmentStatus] = useState({
    status: 'recruiting',
    statusLabel: '募集中',
    deadline: '',
    submittedCount: 0,
    totalCount: 0,
    submissionRate: 0,
    color: 'green',
    bgColor: 'from-green-50 to-green-100',
    borderColor: 'border-green-300',
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

  const fetchData = useCallback(async () => {
    if (!year || !month) return

    setLoading(true)
    setError(null)

    try {
      // 並列でAPI呼び出し
      const [summary, preferences, staff] = await Promise.all([
        shiftRepository.getSummary({ year, month }),
        shiftRepository.getPreferences({
          dateFrom: `${year}-${String(month).padStart(2, '0')}-01`,
          dateTo: `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`,
        }),
        masterRepository.getStaff(),
      ])

      // 募集状況を計算
      const baseRecruitmentStatus = getRecruitmentStatus(year, month)
      const submittedStaffIds = new Set(preferences.map(p => p.staff_id))
      const submittedCount = submittedStaffIds.size
      const totalCount = staff.length
      const submissionRate = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0

      setRecruitmentStatus({
        ...baseRecruitmentStatus,
        submittedCount,
        totalCount,
        submissionRate,
      })

      // 第一案ステータスを判定
      const firstPlan = summary.find(p => p.plan_type === 'FIRST')
      if (!firstPlan) {
        setFirstPlanStatus({
          status: 'not_started',
          planId: null,
          updatedAt: null,
        })
      } else if (firstPlan.status.toUpperCase() === 'APPROVED') {
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
      const secondPlan = summary.find(p => p.plan_type === 'SECOND')

      // 既存のSECOND planがある場合は、そのステータスを表示
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
        // SECOND planがなく、FIRST planも承認されていない場合は作成不可
        setSecondPlanStatus({
          status: 'unavailable',
          planId: null,
          updatedAt: null,
        })
      } else {
        // SECOND planがなく、FIRST planが承認されている場合は作成可能
        setSecondPlanStatus({
          status: 'not_started',
          planId: null,
          updatedAt: null,
        })
      }
    } catch (err) {
      console.error('シフトステータス取得エラー:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    loading,
    error,
    recruitmentStatus,
    firstPlanStatus,
    secondPlanStatus,
    refetch: fetchData,
  }
}

export default useShiftStatus
