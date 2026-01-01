/**
 * useTargetMonth.js
 * 対象月判定ロジック・募集状況判定Hook
 *
 * 対象月ロジック:
 * - 25日以前: 来月が対象月
 * - 26日以降: 再来月が対象月
 *
 * 募集状況ロジック:
 * - 締切日 = 対象月の前月の指定日
 * - now < 締切日 → 募集中（recruiting）
 * - 締切日 <= now < 対象月末 → 締切済（closed）
 * - now >= 対象月末 → 募集終了（finished）
 */

import { useMemo } from 'react'

/**
 * 対象月を計算
 * @param {Date} date - 基準日（デフォルト: 現在日時）
 * @returns {{ year: number, month: number }}
 */
export const getTargetMonth = (date = new Date()) => {
  const currentDay = date.getDate()
  const currentMonth = date.getMonth() + 1
  const currentYear = date.getFullYear()

  if (currentDay <= 25) {
    // 25日以前: 来月が対象月
    return {
      year: currentMonth === 12 ? currentYear + 1 : currentYear,
      month: currentMonth === 12 ? 1 : currentMonth + 1,
    }
  } else {
    // 26日以降: 再来月が対象月
    const targetMonth = currentMonth + 2
    return {
      year: targetMonth > 12 ? currentYear + 1 : currentYear,
      month: targetMonth > 12 ? targetMonth - 12 : targetMonth,
    }
  }
}

/**
 * 月のステータスを判定
 * @param {number} year - 対象年
 * @param {number} month - 対象月
 * @param {Date} baseDate - 基準日（デフォルト: 現在日時）
 * @returns {'target' | 'past' | 'future'}
 */
export const getMonthStatus = (year, month, baseDate = new Date()) => {
  const target = getTargetMonth(baseDate)

  // 同じ年月なら対象月
  if (target.year === year && target.month === month) {
    return 'target'
  }

  // 対象月より前なら過去
  const targetDate = new Date(target.year, target.month - 1, 1)
  const checkDate = new Date(year, month - 1, 1)

  if (checkDate < targetDate) {
    return 'past'
  }

  return 'future'
}

/**
 * 表示用の年月リストを生成（対象月の前後を含む）
 * @param {number} pastCount - 過去何ヶ月分を含めるか（デフォルト: 2）
 * @param {number} futureCount - 未来何ヶ月分を含めるか（デフォルト: 2）
 * @param {Date} baseDate - 基準日（デフォルト: 現在日時）
 * @returns {Array<{ year: number, month: number, status: string, label: string }>}
 */
export const getMonthList = (pastCount = 2, futureCount = 2, baseDate = new Date()) => {
  const target = getTargetMonth(baseDate)
  const result = []

  // 過去月を追加
  for (let i = pastCount; i >= 1; i--) {
    const date = new Date(target.year, target.month - 1 - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    result.push({
      year,
      month,
      status: 'past',
      label: `${year}年${month}月`,
      statusLabel: '確定済',
    })
  }

  // 対象月を追加
  result.push({
    year: target.year,
    month: target.month,
    status: 'target',
    label: `${target.year}年${target.month}月`,
    statusLabel: '対象月',
  })

  // 未来月を追加
  for (let i = 1; i <= futureCount; i++) {
    const date = new Date(target.year, target.month - 1 + i, 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    result.push({
      year,
      month,
      status: 'future',
      label: `${year}年${month}月`,
      statusLabel: '未開放',
    })
  }

  return result
}

/**
 * 募集状況を判定
 * @param {number} year - 対象年
 * @param {number} month - 対象月
 * @param {Date} baseDate - 基準日（デフォルト: 現在日時）
 * @returns {{
 *   status: 'recruiting' | 'closed' | 'finished',
 *   statusLabel: string,
 *   deadline: string,
 *   deadlineDate: Date,
 *   color: string,
 *   bgColor: string,
 *   borderColor: string
 * }}
 */
export const getRecruitmentStatus = (year, month, baseDate = new Date()) => {
  // 締切日 = 対象月の前月20日
  const deadlineDate = new Date(year, month - 2, 20)
  // 対象月末
  const monthEndDate = new Date(year, month, 0, 23, 59, 59)

  const now = baseDate

  if (now < deadlineDate) {
    // 募集中
    const deadlineMonth = deadlineDate.getMonth() + 1
    const deadlineDay = deadlineDate.getDate()
    return {
      status: 'recruiting',
      statusLabel: '募集中',
      deadline: `締切: ${deadlineMonth}月${deadlineDay}日`,
      deadlineDate,
      color: 'green',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-300',
    }
  } else if (now < monthEndDate) {
    // 締切済（変更可能期間）
    return {
      status: 'closed',
      statusLabel: '締切済',
      deadline: '変更可能',
      deadlineDate,
      color: 'orange',
      bgColor: 'from-orange-50 to-orange-100',
      borderColor: 'border-orange-300',
    }
  } else {
    // 募集終了
    return {
      status: 'finished',
      statusLabel: '募集終了',
      deadline: '確定済み',
      deadlineDate,
      color: 'gray',
      bgColor: 'from-slate-50 to-slate-100',
      borderColor: 'border-slate-300',
    }
  }
}

/**
 * 対象月関連のカスタムフック
 * @returns {{
 *   targetMonth: { year: number, month: number },
 *   monthList: Array,
 *   isTargetMonth: (year: number, month: number) => boolean,
 *   getMonthStatus: (year: number, month: number) => string,
 *   getRecruitmentStatus: (year: number, month: number) => object
 * }}
 */
export const useTargetMonth = () => {
  const targetMonth = useMemo(() => getTargetMonth(), [])
  const monthList = useMemo(() => getMonthList(), [])

  const isTargetMonth = (year, month) => {
    return targetMonth.year === year && targetMonth.month === month
  }

  return {
    targetMonth,
    monthList,
    isTargetMonth,
    getMonthStatus: (year, month) => getMonthStatus(year, month),
    getRecruitmentStatus: (year, month) => getRecruitmentStatus(year, month),
  }
}

export default useTargetMonth
