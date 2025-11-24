/**
 * シフト生成に必要なインプットデータを収集するユーティリティ
 */

import Papa from 'papaparse'
import DEFAULT_CONFIG from '../config/defaults.js'
import { SHIFT_PREFERENCE_STATUS, PRIORITY } from '../config/constants'

/**
 * CSVファイルを読み込む共通関数
 */
const loadCSV = async path => {
  try {
    const response = await fetch(path)
    const csvText = await response.text()

    return await new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: result => resolve(result.data),
        error: error => reject(error),
      })
    })
  } catch (error) {
    console.error(`CSVファイル読み込みエラー: ${path}`, error)
    return []
  }
}

/**
 * 収集した制約データから優先順位を分析
 * @param {Object} inputs - collectAllInputsで収集したデータ
 * @returns {Object} 優先順位別に分類された要件リスト
 */
export const analyzeRequirementPriorities = inputs => {
  const requirements = {
    CRITICAL: [],
    HIGH: [],
    MEDIUM: [],
    LOW: [],
  }

  // 1. 法的要件から分析
  if (inputs.legalRequirements) {
    // 労働基準法の制約
    inputs.legalRequirements.data.laborLawConstraints.forEach(law => {
      if (law.penaltyLevel === 'critical') {
        requirements.CRITICAL.push({
          source: '労働基準法',
          id: law.id,
          name: law.description,
          complianceRate: '100%',
          description: law.reference,
          consequence: '法令違反・罰則対象',
        })
      } else if (law.penaltyLevel === 'high') {
        requirements.HIGH.push({
          source: '労働基準法',
          id: law.id,
          name: law.description,
          complianceRate: '80%以上推奨',
          description: law.reference,
        })
      }
    })

    // バリデーションルール（ERROR = CRITICAL）
    inputs.legalRequirements.data.validationRules.forEach(rule => {
      requirements.CRITICAL.push({
        source: 'バリデーションルール',
        id: rule.id,
        name: rule.description,
        complianceRate: '100%',
        description: `${rule.category}の必須チェック`,
        consequence: '自動ブロック・却下',
      })
    })

    // 労務管理ルール
    inputs.legalRequirements.data.laborManagementRules.forEach(rule => {
      const priority = rule.priority?.toUpperCase()
      if (priority === 'HIGH') {
        requirements.HIGH.push({
          source: '労務管理ルール',
          id: rule.id,
          name: rule.description,
          complianceRate: '80%以上推奨',
          description: rule.category,
        })
      } else if (priority === 'MEDIUM') {
        requirements.MEDIUM.push({
          source: '労務管理ルール',
          id: rule.id,
          name: rule.description,
          complianceRate: '70%以上推奨',
          description: rule.category,
        })
      } else if (priority === 'LOW') {
        requirements.LOW.push({
          source: '労務管理ルール',
          id: rule.id,
          name: rule.description,
          complianceRate: '参考値',
          description: rule.category,
        })
      }
    })
  }

  // 2. 店舗制約から分析
  if (inputs.storeConstraints) {
    inputs.storeConstraints.data.constraints.forEach(constraint => {
      const priority = constraint.priority?.toLowerCase()
      if (priority === 'high') {
        requirements.HIGH.push({
          source: '店舗制約',
          id: constraint.id,
          name: constraint.description,
          complianceRate: '90%以上推奨',
          description: constraint.constraint_type,
        })
      } else if (priority === 'medium') {
        requirements.MEDIUM.push({
          source: '店舗制約',
          id: constraint.id,
          name: constraint.description,
          complianceRate: '70%以上推奨',
          description: constraint.constraint_type,
        })
      }
    })
  }

  // 3. スタッフ情報から分析（希望反映など）
  if (inputs.staffData) {
    requirements.MEDIUM.push({
      source: 'スタッフ希望',
      id: 'STAFF_PREF',
      name: 'スタッフの希望シフト反映',
      complianceRate: '70%以上推奨',
      description: 'スタッフ満足度向上のため希望を可能な限り反映',
    })
  }

  return {
    byLevel: requirements,
    summary: {
      totalRequirements:
        requirements.CRITICAL.length +
        requirements.HIGH.length +
        requirements.MEDIUM.length +
        requirements.LOW.length,
      criticalCount: requirements.CRITICAL.length,
      highCount: requirements.HIGH.length,
      mediumCount: requirements.MEDIUM.length,
      lowCount: requirements.LOW.length,
    },
  }
}

/**
 * 1. 法的要件データを取得
 * @returns {Promise<Object>} 法的要件の情報
 */
export const collectLegalRequirements = async () => {
  const files = [
    '/data/master/labor_law_constraints.csv',
    '/data/master/labor_management_rules.csv',
    '/data/master/shift_validation_rules.csv',
  ]

  const [laborLawConstraints, laborManagementRules, validationRules] = await Promise.all([
    loadCSV(files[0]),
    loadCSV(files[1]),
    loadCSV(files[2]),
  ])

  return {
    source: '法的要件',
    usage: 'ハード制約として必ず遵守',
    files: files,
    data: {
      laborLawConstraints: laborLawConstraints.map(rule => ({
        id: rule.law_code,
        category: rule.category,
        description: rule.description,
        penaltyLevel: rule.penalty_level,
        reference: rule.legal_reference,
      })),
      laborManagementRules: laborManagementRules.map(rule => ({
        id: rule.rule_id,
        category: rule.category,
        description: rule.description,
        priority: rule.priority,
      })),
      validationRules: validationRules
        .filter(r => r.check_level === 'ERROR')
        .map(rule => ({
          id: rule.validation_id,
          category: rule.check_category,
          description: rule.description,
        })),
    },
    summary: {
      totalConstraints:
        laborLawConstraints.length +
        laborManagementRules.length +
        validationRules.filter(r => r.check_level === 'ERROR').length,
      criticalCount: laborLawConstraints.filter(r => r.penalty_level === 'critical').length,
      laborLawCount: laborLawConstraints.length,
      laborManagementCount: laborManagementRules.length,
      validationRulesCount: validationRules.filter(r => r.check_level === 'ERROR').length,
    },
  }
}

/**
 * 2. 店舗制約情報を取得
 * @returns {Promise<Object>} 店舗制約の情報
 */
export const collectStoreConstraints = async () => {
  const files = ['/data/master/stores.csv', '/data/master/store_constraints.csv']

  const [stores, storeConstraints] = await Promise.all([loadCSV(files[0]), loadCSV(files[1])])

  return {
    source: '店舗制約情報',
    usage: '営業時間、必要人員数、配置ルールの決定',
    files: files,
    data: {
      stores: stores.map(store => ({
        id: store.store_id,
        name: store.store_name,
        openTime: store.open_time,
        closeTime: store.close_time,
        address: store.address,
      })),
      constraints: storeConstraints.map(c => ({
        id: c.constraint_id,
        storeId: c.store_id,
        type: c.constraint_type,
        value: c.constraint_value,
        description: c.description,
        priority: c.priority,
      })),
    },
    summary: {
      totalStores: stores.length,
      totalConstraints: storeConstraints.length,
      storesCount: stores.length,
      constraintsCount: storeConstraints.length,
    },
  }
}

/**
 * 3. 過去のシフト実績を取得
 * @param {number} months - 過去何ヶ月分取得するか
 * @returns {Promise<Object>} 過去実績の情報
 */
export const collectHistoricalShifts = async (months = 3) => {
  const files = [
    '/data/history/shift_history_2023-2024.csv',
    '/data/history/shift_monthly_summary.csv',
    '/data/history/staff_monthly_performance.csv',
  ]

  const [shiftHistory, monthlySummary, performanceData] = await Promise.all([
    loadCSV(files[0]),
    loadCSV(files[1]),
    loadCSV(files[2]),
  ])

  // 直近N ヶ月のデータをフィルタ
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - months)

  const recentHistory = shiftHistory.filter(shift => {
    const shiftDate = new Date(`${shift.year}-${shift.month}-01`)
    return shiftDate >= cutoffDate
  })

  return {
    source: '過去のシフト実績',
    usage: 'スタッフの勤務傾向、繁忙パターンの分析',
    files: files,
    data: {
      recentShifts: recentHistory.slice(0, 100), // 最新100件
      monthlySummary: monthlySummary.slice(-months),
      staffPerformance: performanceData,
    },
    summary: {
      periodMonths: months,
      totalShiftRecords: recentHistory.length,
      avgDailyStaff:
        monthlySummary.length > 0
          ? (
              monthlySummary.reduce((sum, m) => sum + parseFloat(m.avg_daily_staff || 0), 0) /
              monthlySummary.length
            ).toFixed(1)
          : 0,
      shiftsCount: shiftHistory.length,
      monthlySummariesCount: monthlySummary.length,
      staffPerformanceCount: performanceData.length,
    },
  }
}

/**
 * 4. 売上予測データを取得
 * @param {number} year - 対象年
 * @param {number} month - 対象月
 * @returns {Promise<Object>} 売上予測の情報
 */
export const collectSalesForecast = async (year, month) => {
  const files = [
    '/data/forecast/sales_forecast_2024.csv',
    '/data/actual/sales_actual_2024.csv',
    '/data/transactions/demand_forecasts.csv',
  ]

  const [forecast, actual, demandForecasts] = await Promise.all([
    loadCSV(files[0]),
    loadCSV(files[1]),
    loadCSV(files[2]),
  ])

  // 対象月のデータをフィルタ
  const targetForecast = forecast.filter(
    f => parseInt(f.year) === year && parseInt(f.month) === month
  )

  const targetDemand = demandForecasts.filter(
    d => d.forecast_date && d.forecast_date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
  )

  return {
    source: '売上予測',
    usage: '必要人員数の算出、繁忙時間帯の特定',
    files: files,
    data: {
      monthlyForecast: targetForecast,
      demandForecasts: targetDemand,
      previousActual: actual.filter(
        a => parseInt(a.year) === year && parseInt(a.month) === month - 1
      ),
    },
    summary: {
      targetMonth: `${year}年${month}月`,
      forecastedSales: targetForecast.reduce(
        (sum, f) => sum + parseFloat(f.forecasted_sales || 0),
        0
      ),
      forecastedTraffic: targetForecast.reduce(
        (sum, f) => sum + parseFloat(f.forecasted_traffic || 0),
        0
      ),
      peakDays: targetDemand.filter(d => d.demand_level === 'high').length,
      forecastRecordsCount: forecast.length,
      actualRecordsCount: actual.length,
      demandForecastsCount: demandForecasts.length,
    },
  }
}

/**
 * 5. スタッフ情報とシフト希望を取得
 * @param {number} year - 対象年
 * @param {number} month - 対象月
 * @returns {Promise<Object>} スタッフ情報
 */
export const collectStaffData = async (year, month) => {
  const files = [
    '/data/master/staff.csv',
    '/data/master/staff_skills.csv',
    '/data/master/staff_certifications.csv',
    '/data/transactions/availability_requests.csv',
  ]

  // CSVファイルは staff, skills, certifications のみ読み込み
  const [staff, skills, certifications, availability] = await Promise.all([
    loadCSV(files[0]),
    loadCSV(files[1]),
    loadCSV(files[2]),
    loadCSV(files[3]),
  ])

  // シフト希望はAPIから取得
  let preferences = []
  let preferencesSource = 'API (shift_preferences)'

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const url = `${apiUrl}/api/shifts/preferences?tenant_id=${DEFAULT_CONFIG.TENANT_ID}&year=${year}&month=${month}`

    const response = await fetch(url)
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        // APIレスポンスをCSV互換形式に変換
        preferences = result.data.flatMap(pref => {
          const prefs = []

          // preferred_days を展開
          if (pref.preferred_days) {
            const dates = pref.preferred_days.split(',').map(d => d.trim())
            dates.forEach(date => {
              prefs.push({
                staffId: pref.staff_id,
                date: date,
                shift: 'preferred', // APIにはシフトパターン情報がないため固定値
                priority:
                  pref.status === SHIFT_PREFERENCE_STATUS.APPROVED
                    ? PRIORITY.HIGH
                    : PRIORITY.MEDIUM,
              })
            })
          }

          // ng_days を展開
          if (pref.ng_days) {
            const dates = pref.ng_days.split(',').map(d => d.trim())
            dates.forEach(date => {
              prefs.push({
                staffId: pref.staff_id,
                date: date,
                shift: 'off',
                priority: 'high',
              })
            })
          }

          return prefs
        })
      }
    } else {
      console.warn('シフト希望API呼び出し失敗、CSVフォールバックを試行')
      // フォールバック: CSVから読み込み
      const csvPrefs = await loadCSV(
        `/data/transactions/shift_preferences_${year}_${String(month).padStart(2, '0')}.csv`
      )
      preferences = csvPrefs.map(p => ({
        staffId: p.staff_id,
        date: p.preferred_date,
        shift: p.preferred_shift,
        priority: p.priority,
      }))
      preferencesSource = 'CSV (fallback)'
    }
  } catch (error) {
    console.error('シフト希望取得エラー:', error)
    // エラー時はCSVフォールバック
    try {
      const csvPrefs = await loadCSV(
        `/data/transactions/shift_preferences_${year}_${String(month).padStart(2, '0')}.csv`
      )
      preferences = csvPrefs.map(p => ({
        staffId: p.staff_id,
        date: p.preferred_date,
        shift: p.preferred_shift,
        priority: p.priority,
      }))
      preferencesSource = 'CSV (fallback)'
    } catch (csvError) {
      console.error('CSVフォールバックも失敗:', csvError)
      preferences = []
      preferencesSource = 'None (error)'
    }
  }

  return {
    source: 'スタッフ情報・シフト希望',
    usage: 'シフト配置の最適化、希望反映率の向上',
    files: files,
    preferencesSource: preferencesSource,
    data: {
      staff: staff.map(s => ({
        id: s.staff_id,
        name: s.name,
        hourlyWage: parseFloat(s.hourly_wage),
        maxHoursPerWeek: parseInt(s.max_hours_per_week),
        employmentType: s.employment_type,
        availableShifts: s.available_shifts,
      })),
      skills: skills,
      certifications: certifications,
      preferences: preferences,
      availability: availability,
    },
    summary: {
      totalStaff: staff.length,
      totalPreferences: preferences.length,
      preferenceCoverage:
        preferences.length > 0
          ? `${((preferences.filter(p => p.priority === 'high').length / preferences.length) * 100).toFixed(1)}% が高優先度`
          : '0%',
      staffCount: staff.length,
      skillsCount: skills.length,
      certificationsCount: certifications.length,
      preferencesCount: preferences.length,
      availabilityCount: availability.length,
    },
  }
}

/**
 * 6. 日本のイベント・祝日データを取得
 * @param {number} year - 対象年
 * @param {number} month - 対象月
 * @returns {Promise<Object>} イベント情報
 */
export const collectJapaneseEvents = async (year, month) => {
  // バックエンドAPIから祝日データを取得
  let monthHolidays = []
  let dataSource = 'Backend API'

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/holidays/${year}/${month}`)

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data && result.data.holidays) {
        monthHolidays = result.data.holidays
        dataSource = '内閣府公式CSV (via Backend API)'
      }
    } else {
      console.warn(
        `祝日API呼び出し失敗 (${response.status}): バックエンドから祝日データを取得できませんでした`
      )
    }
  } catch (error) {
    console.error('祝日データ取得エラー:', error)
    dataSource = 'None (API error)'
  }

  return {
    source: '日本のイベント・祝日',
    usage: '繁忙日予測、必要人員の増員判断',
    files: [], // APIから取得のためファイル参照なし
    dataSource: dataSource,
    data: {
      holidays: monthHolidays.map(h => ({
        date: `${year}-${String(month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
        name: h.name,
        impact: 'high', // 祝日は高影響
      })),
      seasonalEvents: getSeasonalEvents(month),
    },
    summary: {
      holidayCount: monthHolidays.length,
      expectedHighDemandDays: monthHolidays.length + getSeasonalEvents(month).length,
      seasonalEventsCount: getSeasonalEvents(month).length,
    },
  }
}

/**
 * 季節イベントを取得
 */
const getSeasonalEvents = month => {
  const events = {
    1: [{ name: '初売り', period: '1/1-1/3', impact: 'very_high' }],
    2: [{ name: 'バレンタインデー', period: '2/10-2/14', impact: 'high' }],
    3: [
      { name: 'ホワイトデー', period: '3/10-3/14', impact: 'medium' },
      { name: '春休み', period: '3/20-3/31', impact: 'high' },
    ],
    4: [
      { name: '新学期', period: '4/1-4/10', impact: 'medium' },
      { name: 'GW前半', period: '4/27-4/30', impact: 'high' },
    ],
    5: [{ name: 'ゴールデンウィーク', period: '5/1-5/6', impact: 'very_high' }],
    6: [{ name: '梅雨シーズン', period: '6/10-6/30', impact: 'low' }],
    7: [{ name: '夏休み開始', period: '7/20-7/31', impact: 'high' }],
    8: [{ name: 'お盆休み', period: '8/11-8/16', impact: 'very_high' }],
    9: [{ name: 'シルバーウィーク', period: '9/14-9/23', impact: 'high' }],
    10: [{ name: 'ハロウィン', period: '10/25-10/31', impact: 'medium' }],
    11: [{ name: 'ブラックフライデー', period: '11/23-11/25', impact: 'high' }],
    12: [
      { name: 'クリスマス', period: '12/20-12/25', impact: 'very_high' },
      { name: '年末商戦', period: '12/26-12/31', impact: 'very_high' },
    ],
  }
  return events[month] || []
}

/**
 * インプットデータカテゴリの定義
 */
export const INPUT_CATEGORIES = {
  legal: {
    id: 'legal',
    name: '法的要件',
    description: '労働基準法、労務管理ルール（ハード制約）',
    required: true,
    defaultEnabled: true,
  },
  store: {
    id: 'store',
    name: '店舗制約',
    description: '営業時間、必要人員数、配置ルール',
    required: true,
    defaultEnabled: true,
  },
  history: {
    id: 'history',
    name: '過去実績',
    description: '過去3ヶ月のシフト履歴・勤務傾向',
    required: false,
    defaultEnabled: true,
  },
  sales: {
    id: 'sales',
    name: '売上予測',
    description: '月次売上予測・需要予測・繁忙時間帯',
    required: false,
    defaultEnabled: true,
  },
  staff: {
    id: 'staff',
    name: 'スタッフ情報',
    description: 'スタッフマスタ・スキル・シフト希望',
    required: true,
    defaultEnabled: true,
  },
  calendar: {
    id: 'calendar',
    name: 'カレンダー',
    description: '祝日・季節イベント（GW、お盆など）',
    required: false,
    defaultEnabled: true,
  },
  weather: {
    id: 'weather',
    name: '天気',
    description: '過去1年分の天気・気温データ',
    required: false,
    defaultEnabled: false,
  },
}

/**
 * 天気データを取得
 * @param {number} year - 対象年
 * @param {number} month - 対象月
 * @returns {Promise<Object>} 天気情報
 */
export const collectWeatherData = async (year, month) => {
  const files = ['/data/history/weather_history_2023-2024.csv']
  const weatherHistory = await loadCSV(files[0])

  // 対象月のデータをフィルタ
  const targetMonthData = weatherHistory.filter(
    w => parseInt(w.year) === year && parseInt(w.month) === month
  )

  // 過去同月のデータ（前年）
  const lastYearData = weatherHistory.filter(
    w => parseInt(w.year) === year - 1 && parseInt(w.month) === month
  )

  return {
    source: '天気',
    usage: '天候による来客予測、悪天候時の人員調整',
    files: files,
    data: {
      currentMonth: targetMonthData,
      lastYearSameMonth: lastYearData,
    },
    summary: {
      targetMonth: `${year}年${month}月`,
      rainyDays: targetMonthData.filter(
        d => d.weather_condition?.includes('雨') || d.weather_condition?.includes('雪')
      ).length,
      avgTemperature:
        targetMonthData.length > 0
          ? (
              targetMonthData.reduce((sum, d) => sum + parseFloat(d.temperature_avg || 0), 0) /
              targetMonthData.length
            ).toFixed(1)
          : 0,
      totalWeatherRecords: weatherHistory.length,
      currentMonthRecords: targetMonthData.length,
      lastYearRecords: lastYearData.length,
    },
  }
}

/**
 * すべてのインプットデータを収集
 * @param {number} year - 対象年
 * @param {number} month - 対象月
 * @param {Object} enabledCategories - 有効化されたカテゴリ { legal: true, store: true, ... }
 * @returns {Promise<Object>} 全インプットデータ
 */
export const collectAllInputs = async (year, month, enabledCategories = {}) => {
  console.log(`シフト生成インプットデータ収集開始: ${year}年${month}月`)

  const startTime = Date.now()

  // デフォルトで全て有効
  const enabled = {
    legal: enabledCategories.legal !== false,
    store: enabledCategories.store !== false,
    history: enabledCategories.history !== false,
    sales: enabledCategories.sales !== false,
    staff: enabledCategories.staff !== false,
    calendar: enabledCategories.calendar !== false,
    weather: enabledCategories.weather === true,
  }

  const promises = []
  const inputKeys = []

  if (enabled.legal) {
    promises.push(collectLegalRequirements())
    inputKeys.push('legalRequirements')
  }
  if (enabled.store) {
    promises.push(collectStoreConstraints())
    inputKeys.push('storeConstraints')
  }
  if (enabled.history) {
    promises.push(collectHistoricalShifts(3))
    inputKeys.push('historicalShifts')
  }
  if (enabled.sales) {
    promises.push(collectSalesForecast(year, month))
    inputKeys.push('salesForecast')
  }
  if (enabled.staff) {
    promises.push(collectStaffData(year, month))
    inputKeys.push('staffData')
  }
  if (enabled.calendar) {
    promises.push(collectJapaneseEvents(year, month))
    inputKeys.push('japaneseEvents')
  }
  if (enabled.weather) {
    promises.push(collectWeatherData(year, month))
    inputKeys.push('weatherData')
  }

  const results = await Promise.all(promises)

  const inputs = {}
  results.forEach((result, index) => {
    inputs[inputKeys[index]] = result
  })

  const collectionTime = Date.now() - startTime

  // 収集したデータから優先順位を分析（一度だけ実行）
  const priorities = analyzeRequirementPriorities(inputs)

  return {
    metadata: {
      collectionTimestamp: new Date().toISOString(),
      targetPeriod: `${year}年${month}月`,
      collectionTimeMs: collectionTime,
      dataVersion: '1.0.0',
      enabledCategories: enabled,
    },
    inputs,
    priorities, // 優先順位分析結果を保存
    summary: {
      totalDataSources: Object.keys(inputs).length,
      enabledCategories: Object.entries(enabled)
        .filter(([_k, v]) => v)
        .map(([k]) => INPUT_CATEGORIES[k].name),
      readyForGeneration: true,
      warnings: [],
      prioritiesAnalyzed: {
        critical: priorities.summary.criticalCount,
        high: priorities.summary.highCount,
        medium: priorities.summary.mediumCount,
        low: priorities.summary.lowCount,
      },
    },
  }
}

/**
 * インプットデータをテキスト形式で整形（GPTプロンプト用）
 */
export const formatInputsForPrompt = inputs => {
  let prompt = `# シフト生成指示\n\n`
  prompt += `収集したインプットデータをもとに、${inputs.metadata.targetPeriod}のシフトスケジュールを作成してください。\n`
  prompt += `シフトを検討する際は、各要件の重要度に従って優先順位をつけてシフトを検討してください。\n\n`

  // 0. 保存済みの優先順位を使用（簡潔な表形式）
  const priorities = inputs.priorities
  prompt += `## 要件の優先順位（${priorities.summary.totalRequirements}件）\n\n`

  prompt += `| 優先度 | 遵守率 | 要件数 | 説明 |\n`
  prompt += `|--------|--------|--------|------|\n`
  prompt += `| CRITICAL | 100% | ${priorities.summary.criticalCount}件 | 法令違反・営業許可に関わる絶対遵守事項。1件でも違反不可 |\n`
  prompt += `| HIGH | 80-90% | ${priorities.summary.highCount}件 | 健康管理・安全・サービス品質に関わる重要要件 |\n`
  prompt += `| MEDIUM | 70% | ${priorities.summary.mediumCount}件 | スタッフ満足度・業務品質・公平性 |\n`
  prompt += `| LOW | 参考値 | ${priorities.summary.lowCount}件 | 最適化の参考（他要件優先） |\n\n`

  // CRITICALのみ詳細を記載（絶対遵守のため）
  if (priorities.summary.criticalCount > 0) {
    prompt += `### CRITICAL要件（必須遵守）:\n`
    priorities.byLevel.CRITICAL.forEach((req, idx) => {
      prompt += `${idx + 1}. ${req.name} [${req.source}]\n`
    })
    prompt += `\n`
  }

  prompt += `---\n\n`

  // 1. 法的要件データの詳細
  if (inputs.inputs.legalRequirements) {
    prompt += `## 1. 法的要件データ詳細\n`
    prompt += `参照ファイル: ${inputs.inputs.legalRequirements.files.join(', ')}\n\n`

    prompt += `### 労働基準法の制約（${inputs.inputs.legalRequirements.summary.laborLawCount}件）\n`
    inputs.inputs.legalRequirements.data.laborLawConstraints.forEach(c => {
      prompt += `- [${c.id}] ${c.description}\n`
      prompt += `  罰則レベル: ${c.penaltyLevel}, 根拠: ${c.reference}\n`
    })

    prompt += `\n### 労務管理ルール（${inputs.inputs.legalRequirements.summary.laborManagementCount}件）\n`
    inputs.inputs.legalRequirements.data.laborManagementRules.forEach(r => {
      prompt += `- [${r.id}] ${r.description}\n`
      prompt += `  優先度: ${r.priority}, カテゴリ: ${r.category}\n`
    })
    prompt += `\n`
  }

  // 2. 店舗制約データの詳細
  if (inputs.inputs.storeConstraints) {
    prompt += `## 2. 店舗制約データ詳細\n`
    prompt += `参照ファイル: ${inputs.inputs.storeConstraints.files.join(', ')}\n\n`

    prompt += `### 店舗情報（${inputs.inputs.storeConstraints.summary.storesCount}店舗）\n`
    inputs.inputs.storeConstraints.data.stores.forEach(s => {
      prompt += `- [${s.id}] ${s.name}\n`
      prompt += `  営業時間: ${s.openTime}-${s.closeTime}, 住所: ${s.address}\n`
    })

    prompt += `\n### 店舗制約（${inputs.inputs.storeConstraints.summary.constraintsCount}件）\n`
    inputs.inputs.storeConstraints.data.constraints.forEach(c => {
      prompt += `- [${c.id}] ${c.description}\n`
      prompt += `  タイプ: ${c.type}, 優先度: ${c.priority}\n`
      prompt += `  制約値: ${c.value}\n`
    })
    prompt += `\n`
  }

  // 3. 過去実績データの詳細
  if (inputs.inputs.historicalShifts) {
    prompt += `## 3. 過去のシフト実績データ\n`
    prompt += `参照ファイル: ${inputs.inputs.historicalShifts.files.join(', ')}\n`
    prompt += `- 期間: 過去${inputs.inputs.historicalShifts.summary.periodMonths}ヶ月分\n`
    prompt += `- 総シフト記録: ${inputs.inputs.historicalShifts.summary.totalShiftRecords}件\n`
    prompt += `- 平均日次スタッフ数: ${inputs.inputs.historicalShifts.summary.avgDailyStaff}名\n\n`
  }

  // 4. 売上予測データの詳細
  if (inputs.inputs.salesForecast) {
    prompt += `## 4. 売上予測データ\n`
    prompt += `参照ファイル: ${inputs.inputs.salesForecast.files.join(', ')}\n`
    prompt += `- 対象月: ${inputs.inputs.salesForecast.summary.targetMonth}\n`
    prompt += `- 予測売上: ${inputs.inputs.salesForecast.summary.forecastedSales.toLocaleString()}円\n`
    prompt += `- 予測来客数: ${inputs.inputs.salesForecast.summary.forecastedTraffic.toLocaleString()}人\n`
    prompt += `- 繁忙日数: ${inputs.inputs.salesForecast.summary.peakDays}日\n\n`
  }

  // 5. スタッフ情報データの詳細
  if (inputs.inputs.staffData) {
    prompt += `## 5. スタッフ情報データ\n`
    prompt += `参照ファイル: ${inputs.inputs.staffData.files.join(', ')}\n\n`

    prompt += `### スタッフ一覧（${inputs.inputs.staffData.summary.staffCount}名）\n`
    inputs.inputs.staffData.data.staff.forEach(s => {
      prompt += `- [${s.id}] ${s.name}\n`
      prompt += `  時給: ${s.hourlyWage}円, 週最大: ${s.maxHoursPerWeek}時間, 雇用形態: ${s.employmentType}\n`
    })

    prompt += `\n### シフト希望（${inputs.inputs.staffData.summary.preferencesCount}件）\n`
    prompt += `- 総希望数: ${inputs.inputs.staffData.summary.totalPreferences}件\n`
    prompt += `- 優先度分布: ${inputs.inputs.staffData.summary.preferenceCoverage}\n`
    // サンプルとして最初の5件を表示
    inputs.inputs.staffData.data.preferences.slice(0, 5).forEach(p => {
      prompt += `  - スタッフ${p.staffId}: ${p.date} ${p.shift} (優先度: ${p.priority})\n`
    })
    if (inputs.inputs.staffData.data.preferences.length > 5) {
      prompt += `  ... 他 ${inputs.inputs.staffData.data.preferences.length - 5}件\n`
    }
    prompt += `\n`
  }

  // 6. カレンダーデータ
  if (inputs.inputs.japaneseEvents) {
    prompt += `## 6. カレンダーデータ（イベント・祝日）\n`
    prompt += `データソース: ${inputs.inputs.japaneseEvents.dataSource || 'Backend API'}\n`
    prompt += `- 祝日数: ${inputs.inputs.japaneseEvents.summary.holidayCount}日\n`
    prompt += `- 季節イベント: ${inputs.inputs.japaneseEvents.summary.seasonalEventsCount}件\n`
    prompt += `- 高需要予想日数: ${inputs.inputs.japaneseEvents.summary.expectedHighDemandDays}日\n\n`

    if (inputs.inputs.japaneseEvents.data.holidays.length > 0) {
      prompt += `### 対象月の祝日:\n`
      inputs.inputs.japaneseEvents.data.holidays.forEach(h => {
        prompt += `  - ${h.date}: ${h.name} (影響度: ${h.impact})\n`
      })
    }

    if (inputs.inputs.japaneseEvents.data.seasonalEvents.length > 0) {
      prompt += `\n### 季節イベント:\n`
      inputs.inputs.japaneseEvents.data.seasonalEvents.forEach(e => {
        prompt += `  - ${e.name} (${e.period}): 影響度 ${e.impact}\n`
      })
    }
    prompt += `\n`
  }

  // 7. 天気データ
  if (inputs.inputs.weatherData) {
    prompt += `## 7. 天気データ\n`
    prompt += `参照ファイル: ${inputs.inputs.weatherData.files.join(', ')}\n`
    prompt += `- 対象月: ${inputs.inputs.weatherData.summary.targetMonth}\n`
    prompt += `- 雨/雪予想日数: ${inputs.inputs.weatherData.summary.rainyDays}日\n`
    prompt += `- 平均気温: ${inputs.inputs.weatherData.summary.avgTemperature}℃\n`
    prompt += `- 収集レコード数: 対象月${inputs.inputs.weatherData.summary.currentMonthRecords}件, 前年同月${inputs.inputs.weatherData.summary.lastYearRecords}件\n\n`
  }

  return prompt
}
