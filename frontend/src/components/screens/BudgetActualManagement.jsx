import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  Database,
  Download,
  TrendingUp,
  ArrowLeft,
  Users,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Papa from 'papaparse'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import {
  saveActualShifts,
  savePayroll,
  saveSalesActual,
  getActualShifts,
  getPayroll,
  getSalesActual,
  getCount,
  clearStore,
} from '../../utils/indexedDB'
import { INDEXED_DB, STORAGE_KEYS } from '../../config'
import { PAGE_VARIANTS, PAGE_TRANSITION } from '../../config/display'
import AppHeader from '../shared/AppHeader'

const BudgetActualManagement = ({
  onHome,
  onShiftManagement,
  onLineMessages,
  onMonitoring,
  onStaffManagement,
  onStoreManagement,
  onConstraintManagement,
  onBudgetActualManagement,
}) => {
  const [workHoursFile, setWorkHoursFile] = useState(null)
  const [payrollFile, setPayrollFile] = useState(null)
  const [salesActualFile, setSalesActualFile] = useState(null)
  const [forecastFile, setForecastFile] = useState(null)
  const [workHoursPreview, setWorkHoursPreview] = useState([])
  const [payrollPreview, setPayrollPreview] = useState([])
  const [salesActualPreview, setSalesActualPreview] = useState([])
  const [forecastPreview, setForecastPreview] = useState([])
  const [workHoursData, setWorkHoursData] = useState([])
  const [payrollData, setPayrollData] = useState([])
  const [salesActualData, setSalesActualData] = useState([])
  const [forecastData, setForecastData] = useState([])
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState({
    workHours: { status: 'idle', message: '' },
    payroll: { status: 'idle', message: '' },
    salesActual: { status: 'idle', message: '' },
    forecast: { status: 'idle', message: '' },
  })
  const [monthlyStatus, setMonthlyStatus] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [diffAnalysis, setDiffAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(2024)
  const [monthlyPL, setMonthlyPL] = useState([])

  // IndexedDB内のデータ件数を取得
  useEffect(() => {
    loadImportStatus()
  }, [selectedYear])

  const loadImportStatus = async () => {
    try {
      const workHoursCount = await getCount(INDEXED_DB.STORES.ACTUAL_SHIFTS)
      const payrollCount = await getCount(INDEXED_DB.STORES.PAYROLL)
      const salesActualCount = await getCount(INDEXED_DB.STORES.SALES_ACTUAL)

      // LocalStorageから売上予測データを取得
      const forecastDataStr = localStorage.getItem('sales_forecast_data')
      const forecastData = forecastDataStr ? JSON.parse(forecastDataStr) : []

      // 月ごとのステータスとPLデータを生成
      const months = []
      const plData = []

      for (let month = 1; month <= 12; month++) {
        const monthWorkHours = await getActualShifts(selectedYear, month)
        const monthPayroll = await getPayroll(selectedYear, month)
        const monthSalesActual = await getSalesActual(selectedYear, month)
        const monthForecast = forecastData.filter(f => f.year === selectedYear && f.month === month)

        months.push({
          month,
          year: selectedYear,
          workHoursCount: monthWorkHours.length,
          payrollCount: monthPayroll.length,
          salesActualCount: monthSalesActual.length,
          forecastCount: monthForecast.length,
          hasWorkHours: monthWorkHours.length > 0,
          hasPayroll: monthPayroll.length > 0,
          hasSalesActual: monthSalesActual.length > 0,
          hasForecast: monthForecast.length > 0,
        })

        // PL計算
        const salesForecast =
          monthForecast.length > 0 ? parseInt(monthForecast[0].forecasted_sales || 0) : 0
        const salesActual =
          monthSalesActual.length > 0 ? parseInt(monthSalesActual[0].actual_sales || 0) : 0

        const laborCostForecast =
          monthForecast.length > 0 ? parseInt(monthForecast[0].required_labor_cost || 0) : 0
        const laborCostActual = monthPayroll.reduce(
          (sum, p) => sum + parseInt(p.gross_salary || 0),
          0
        )

        const commuteForecast = monthForecast.length > 0 ? monthPayroll.length * 8000 : 0 // 仮の値
        const commuteActual = monthPayroll.reduce(
          (sum, p) => sum + parseInt(p.commute_allowance || 0),
          0
        )

        const profitForecast = salesForecast - laborCostForecast - commuteForecast
        const profitActual = salesActual - laborCostActual - commuteActual

        const profitRateForecast = salesForecast > 0 ? (profitForecast / salesForecast) * 100 : 0
        const profitRateActual = salesActual > 0 ? (profitActual / salesActual) * 100 : 0

        const laborRateForecast = salesForecast > 0 ? (laborCostForecast / salesForecast) * 100 : 0
        const laborRateActual = salesActual > 0 ? (laborCostActual / salesActual) * 100 : 0

        const commuteRateForecast = salesForecast > 0 ? (commuteForecast / salesForecast) * 100 : 0
        const commuteRateActual = salesActual > 0 ? (commuteActual / salesActual) * 100 : 0

        plData.push({
          month,
          year: selectedYear,
          salesForecast,
          salesActual,
          salesDiff: salesActual - salesForecast,
          salesDiffPercent:
            salesForecast > 0 ? ((salesActual - salesForecast) / salesForecast) * 100 : 0,
          laborCostForecast,
          laborCostActual,
          laborCostDiff: laborCostActual - laborCostForecast,
          laborCostDiffPercent:
            laborCostForecast > 0
              ? ((laborCostActual - laborCostForecast) / laborCostForecast) * 100
              : 0,
          laborRateForecast,
          laborRateActual,
          laborRateDiff: laborRateActual - laborRateForecast,
          commuteForecast,
          commuteActual,
          commuteDiff: commuteActual - commuteForecast,
          commuteDiffPercent:
            commuteForecast > 0 ? ((commuteActual - commuteForecast) / commuteForecast) * 100 : 0,
          commuteRateForecast,
          commuteRateActual,
          commuteRateDiff: commuteRateActual - commuteRateForecast,
          profitForecast,
          profitActual,
          profitDiff: profitActual - profitForecast,
          profitDiffPercent:
            profitForecast !== 0
              ? ((profitActual - profitForecast) / Math.abs(profitForecast)) * 100
              : 0,
          profitRateForecast,
          profitRateActual,
          profitRateDiff: profitRateActual - profitRateForecast,
          hasData:
            monthForecast.length > 0 || monthSalesActual.length > 0 || monthPayroll.length > 0,
        })
      }

      setMonthlyStatus(months)
      setMonthlyPL(plData)
    } catch (error) {
      console.error('ステータス読み込みエラー:', error)
    }
  }

  // ファイル選択処理
  const handleFileSelect = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    if (type === 'workHours') {
      setWorkHoursFile(file)
      parseCSV(file, 'workHours')
    } else if (type === 'payroll') {
      setPayrollFile(file)
      parseCSV(file, 'payroll')
    } else if (type === 'salesActual') {
      setSalesActualFile(file)
      parseCSV(file, 'salesActual')
    } else if (type === 'forecast') {
      setForecastFile(file)
      parseCSV(file, 'forecast')
    }
  }

  // CSV解析
  const parseCSV = (file, type) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: result => {
        if (type === 'workHours') {
          setWorkHoursData(result.data)
          setWorkHoursPreview(result.data.slice(0, 5))
        } else if (type === 'payroll') {
          setPayrollData(result.data)
          setPayrollPreview(result.data.slice(0, 5))
        } else if (type === 'salesActual') {
          setSalesActualData(result.data)
          setSalesActualPreview(result.data.slice(0, 5))
        } else if (type === 'forecast') {
          setForecastData(result.data)
          setForecastPreview(result.data.slice(0, 5))
        }
      },
      error: error => {
        console.error('CSV解析エラー:', error)
        const statusKey =
          type === 'workHours'
            ? 'workHours'
            : type === 'payroll'
              ? 'payroll'
              : type === 'salesActual'
                ? 'salesActual'
                : 'forecast'
        setImportStatus(prev => ({
          ...prev,
          [statusKey]: { status: 'error', message: 'CSV解析に失敗しました' },
        }))
      },
    })
  }

  // サンプルデータをロード（publicフォルダのCSVファイルを直接読み込み）
  const loadSampleData = async () => {
    try {
      setImporting(true)

      // 現在の月（デモでは2024年10月として固定）
      const currentYear = 2024
      const currentMonth = 10

      // 労働時間実績CSVをロード
      const workHoursResponse = await fetch('/data/actual/work_hours_2024.csv')
      const workHoursText = await workHoursResponse.text()

      Papa.parse(workHoursText, {
        header: true,
        skipEmptyLines: true,
        complete: result => {
          // 現在月以前のデータのみをフィルタ
          const filteredData = result.data.filter(row => {
            const year = parseInt(row.year)
            const month = parseInt(row.month)
            return year < currentYear || (year === currentYear && month <= currentMonth)
          })
          setWorkHoursData(filteredData)
          setWorkHoursPreview(filteredData.slice(0, 5))
          setWorkHoursFile({ name: 'work_hours_2024.csv (サンプル)' })
        },
      })

      // 給与明細CSVをロード
      const payrollResponse = await fetch('/data/actual/payroll_2024.csv')
      const payrollText = await payrollResponse.text()

      Papa.parse(payrollText, {
        header: true,
        skipEmptyLines: true,
        complete: result => {
          // 現在月以前のデータのみをフィルタ
          const filteredData = result.data.filter(row => {
            const year = parseInt(row.year)
            const month = parseInt(row.month)
            return year < currentYear || (year === currentYear && month <= currentMonth)
          })
          setPayrollData(filteredData)
          setPayrollPreview(filteredData.slice(0, 5))
          setPayrollFile({ name: 'payroll_2024.csv (サンプル)' })
        },
      })

      // 売上実績CSVをロード
      const salesActualResponse = await fetch('/data/actual/sales_actual_2024.csv')
      const salesActualText = await salesActualResponse.text()

      Papa.parse(salesActualText, {
        header: true,
        skipEmptyLines: true,
        complete: result => {
          // 現在月以前のデータのみをフィルタ
          const filteredData = result.data.filter(row => {
            const year = parseInt(row.year)
            const month = parseInt(row.month)
            return year < currentYear || (year === currentYear && month <= currentMonth)
          })
          setSalesActualData(filteredData)
          setSalesActualPreview(filteredData.slice(0, 5))
          setSalesActualFile({ name: 'sales_actual_2024.csv (サンプル)' })
        },
      })

      // 売上予測CSVをロード
      const forecastResponse = await fetch('/data/forecast/sales_forecast_2024.csv')
      const forecastText = await forecastResponse.text()

      Papa.parse(forecastText, {
        header: true,
        skipEmptyLines: true,
        complete: result => {
          setForecastData(result.data)
          setForecastPreview(result.data.slice(0, 5))
          setForecastFile({ name: 'sales_forecast_2024.csv (サンプル)' })
        },
      })

      setImportStatus({
        workHours: { status: 'idle', message: '' },
        payroll: { status: 'idle', message: '' },
        salesActual: { status: 'idle', message: '' },
        forecast: { status: 'idle', message: '' },
      })
    } catch (error) {
      console.error('サンプルデータロードエラー:', error)
      alert('サンプルデータの読み込みに失敗しました')
    } finally {
      setImporting(false)
    }
  }

  // 労働時間実績のインポート
  const importWorkHours = async () => {
    if (!workHoursData.length) {
      setImportStatus(prev => ({
        ...prev,
        workHours: { status: 'error', message: 'データがありません' },
      }))
      return
    }

    // 現在の月チェック（デモでは2024年10月として固定）
    const currentYear = 2024
    const currentMonth = 10

    // 未来のデータが含まれていないかチェック
    const futureData = workHoursData.filter(row => {
      const year = parseInt(row.year)
      const month = parseInt(row.month)
      return year > currentYear || (year === currentYear && month > currentMonth)
    })

    if (futureData.length > 0) {
      alert(
        `未来のデータは登録できません。${currentYear}年${currentMonth}月以降のデータ（${futureData.length}件）が含まれています。`
      )
      setImportStatus(prev => ({
        ...prev,
        workHours: { status: 'error', message: '未来のデータが含まれています' },
      }))
      return
    }

    setImporting(true)
    setImportStatus(prev => ({
      ...prev,
      workHours: { status: 'loading', message: 'インポート中...' },
    }))

    try {
      // データの変換と検証
      const formattedData = workHoursData.map(row => ({
        shift_id: row.shift_id,
        year: parseInt(row.year),
        month: parseInt(row.month),
        date: parseInt(row.date),
        staff_id: row.staff_id,
        staff_name: row.staff_name,
        scheduled_start: row.scheduled_start,
        scheduled_end: row.scheduled_end,
        actual_start: row.actual_start,
        actual_end: row.actual_end,
        scheduled_hours: parseFloat(row.scheduled_hours),
        actual_hours: parseFloat(row.actual_hours),
        break_minutes: parseInt(row.break_minutes),
        overtime_minutes: parseInt(row.overtime_minutes),
        is_late: row.is_late === 'TRUE',
        is_early_leave: row.is_early_leave === 'TRUE',
        notes: row.notes || '',
      }))

      const result = await saveActualShifts(formattedData)

      setImportStatus(prev => ({
        ...prev,
        workHours: {
          status: 'success',
          message: `${formattedData.length}件のデータをインポートしました`,
        },
      }))

      // ステータスを更新
      await loadImportStatus()
    } catch (error) {
      console.error('インポートエラー:', error)
      setImportStatus(prev => ({
        ...prev,
        workHours: { status: 'error', message: `エラー: ${error.message}` },
      }))
    } finally {
      setImporting(false)
    }
  }

  // 給与明細のインポート
  const importPayroll = async () => {
    if (!payrollData.length) {
      setImportStatus(prev => ({
        ...prev,
        payroll: { status: 'error', message: 'データがありません' },
      }))
      return
    }

    // 現在の月チェック（デモでは2024年10月として固定）
    const currentYear = 2024
    const currentMonth = 10

    // 未来のデータが含まれていないかチェック
    const futureData = payrollData.filter(row => {
      const year = parseInt(row.year)
      const month = parseInt(row.month)
      return year > currentYear || (year === currentYear && month > currentMonth)
    })

    if (futureData.length > 0) {
      alert(
        `未来のデータは登録できません。${currentYear}年${currentMonth}月以降のデータ（${futureData.length}件）が含まれています。`
      )
      setImportStatus(prev => ({
        ...prev,
        payroll: { status: 'error', message: '未来のデータが含まれています' },
      }))
      return
    }

    setImporting(true)
    setImportStatus(prev => ({
      ...prev,
      payroll: { status: 'loading', message: 'インポート中...' },
    }))

    try {
      // データの変換と検証
      const formattedData = payrollData.map(row => ({
        payroll_id: row.payroll_id,
        year: parseInt(row.year),
        month: parseInt(row.month),
        staff_id: row.staff_id,
        staff_name: row.staff_name,
        work_days: parseInt(row.work_days),
        work_hours: parseFloat(row.work_hours),
        base_salary: parseInt(row.base_salary),
        overtime_pay: parseInt(row.overtime_pay),
        commute_allowance: parseInt(row.commute_allowance),
        other_allowances: parseInt(row.other_allowances || 0),
        gross_salary: parseInt(row.gross_salary),
        health_insurance: parseInt(row.health_insurance),
        pension_insurance: parseInt(row.pension_insurance),
        employment_insurance: parseInt(row.employment_insurance),
        income_tax: parseInt(row.income_tax),
        resident_tax: parseInt(row.resident_tax),
        total_deduction: parseInt(row.total_deduction),
        net_salary: parseInt(row.net_salary),
        payment_date: row.payment_date,
        payment_status: row.payment_status,
      }))

      const result = await savePayroll(formattedData)

      setImportStatus(prev => ({
        ...prev,
        payroll: {
          status: 'success',
          message: `${formattedData.length}件のデータをインポートしました`,
        },
      }))

      // ステータスを更新
      await loadImportStatus()
    } catch (error) {
      console.error('インポートエラー:', error)
      setImportStatus(prev => ({
        ...prev,
        payroll: { status: 'error', message: `エラー: ${error.message}` },
      }))
    } finally {
      setImporting(false)
    }
  }

  // 売上実績のインポート
  const importSalesActual = async () => {
    if (!salesActualData.length) {
      setImportStatus(prev => ({
        ...prev,
        salesActual: { status: 'error', message: 'データがありません' },
      }))
      return
    }

    // 現在の月チェック（デモでは2024年10月として固定）
    const currentYear = 2024
    const currentMonth = 10

    // 未来のデータが含まれていないかチェック
    const futureData = salesActualData.filter(row => {
      const year = parseInt(row.year)
      const month = parseInt(row.month)
      return year > currentYear || (year === currentYear && month > currentMonth)
    })

    if (futureData.length > 0) {
      alert(
        `未来のデータは登録できません。${currentYear}年${currentMonth}月以降のデータ（${futureData.length}件）が含まれています。`
      )
      setImportStatus(prev => ({
        ...prev,
        salesActual: { status: 'error', message: '未来のデータが含まれています' },
      }))
      return
    }

    setImporting(true)
    setImportStatus(prev => ({
      ...prev,
      salesActual: { status: 'loading', message: 'インポート中...' },
    }))

    try {
      // データの変換と検証
      const formattedData = salesActualData.map(row => ({
        actual_id: row.actual_id,
        year: parseInt(row.year),
        month: parseInt(row.month),
        store_id: parseInt(row.store_id),
        actual_sales: parseInt(row.actual_sales),
        daily_average: parseInt(row.daily_average),
        notes: row.notes || '',
      }))

      const result = await saveSalesActual(formattedData)

      setImportStatus(prev => ({
        ...prev,
        salesActual: {
          status: 'success',
          message: `${formattedData.length}件のデータをインポートしました`,
        },
      }))

      // ステータスを更新
      await loadImportStatus()
    } catch (error) {
      console.error('インポートエラー:', error)
      setImportStatus(prev => ({
        ...prev,
        salesActual: { status: 'error', message: `エラー: ${error.message}` },
      }))
    } finally {
      setImporting(false)
    }
  }

  // 売上予測のインポート
  const importForecast = async () => {
    if (!forecastData.length) {
      setImportStatus(prev => ({
        ...prev,
        forecast: { status: 'error', message: 'データがありません' },
      }))
      return
    }

    setImporting(true)
    setImportStatus(prev => ({
      ...prev,
      forecast: { status: 'loading', message: 'インポート中...' },
    }))

    try {
      // データの変換と検証
      const formattedData = forecastData.map(row => ({
        forecast_id: row.forecast_id,
        year: parseInt(row.year),
        month: parseInt(row.month),
        store_id: parseInt(row.store_id),
        forecasted_sales: parseInt(row.forecasted_sales),
        required_labor_cost: parseInt(row.required_labor_cost),
        required_hours: parseInt(row.required_hours),
        notes: row.notes || '',
      }))

      // LocalStorageに保存
      localStorage.setItem('sales_forecast_data', JSON.stringify(formattedData))

      setImportStatus(prev => ({
        ...prev,
        forecast: {
          status: 'success',
          message: `${formattedData.length}件のデータをインポートしました`,
        },
      }))

      // ステータスを更新
      await loadImportStatus()
    } catch (error) {
      console.error('インポートエラー:', error)
      setImportStatus(prev => ({
        ...prev,
        forecast: { status: 'error', message: `エラー: ${error.message}` },
      }))
    } finally {
      setImporting(false)
    }
  }

  // データクリア
  const clearAllData = async () => {
    if (!confirm('全てのインポートデータを削除しますか？この操作は取り消せません。')) {
      return
    }

    try {
      await clearStore(INDEXED_DB.STORES.ACTUAL_SHIFTS)
      await clearStore(INDEXED_DB.STORES.PAYROLL)
      await clearStore(INDEXED_DB.STORES.SALES_ACTUAL)
      localStorage.removeItem('sales_forecast_data')
      await loadImportStatus()
      setImportStatus({
        workHours: { status: 'idle', message: '' },
        payroll: { status: 'idle', message: '' },
        salesActual: { status: 'idle', message: '' },
        forecast: { status: 'idle', message: '' },
      })
      alert('データを削除しました')
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const getStatusIcon = status => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'loading':
        return (
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )
      default:
        return null
    }
  }

  // 月をクリックして予実差分を分析
  const handleMonthClick = async monthData => {
    if (
      !monthData.hasForecast ||
      !monthData.hasWorkHours ||
      !monthData.hasPayroll ||
      !monthData.hasSalesActual
    ) {
      alert('予実分析には、売上予測・労働時間実績・給与明細・売上実績の全てのデータが必要です。')
      return
    }

    setLoading(true)
    setSelectedMonth(monthData)

    try {
      // 実績データを取得
      const actualShifts = await getActualShifts(monthData.year, monthData.month)
      const actualPayroll = await getPayroll(monthData.year, monthData.month)

      // 実績データが本当に存在するか確認
      if (actualShifts.length === 0) {
        alert('労働時間実績データがありません。')
        setSelectedMonth(null)
        setLoading(false)
        return
      }

      if (actualPayroll.length === 0) {
        alert('給与明細データがありません。')
        setSelectedMonth(null)
        setLoading(false)
        return
      }

      // 予定シフトデータを取得（Historyから）
      const plannedShifts = await loadPlannedShifts(monthData.year, monthData.month)

      // 予定データが存在するか確認
      if (plannedShifts.length === 0) {
        alert('予定シフトデータがありません。この月のシフト作成履歴が見つかりませんでした。')
        setSelectedMonth(null)
        setLoading(false)
        return
      }

      // 売上実績データを取得
      const actualSales = await getSalesActual(monthData.year, monthData.month)

      // 売上予測データを取得
      const salesForecast = await loadSalesForecast(monthData.year, monthData.month)

      // 差分を分析
      const analysis = analyzeDifference(
        plannedShifts,
        actualShifts,
        actualPayroll,
        salesForecast,
        actualSales
      )
      setDiffAnalysis(analysis)
    } catch (error) {
      console.error('差分分析エラー:', error)
      alert('差分分析に失敗しました')
      setSelectedMonth(null)
    } finally {
      setLoading(false)
    }
  }

  // 予定シフトデータを読み込み
  const loadPlannedShifts = async (year, month) => {
    try {
      // shift_history_2023-2024.csvから読み込み
      const response = await fetch('/data/history/shift_history_2023-2024.csv')
      const text = await response.text()

      const result = await new Promise(resolve => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve,
        })
      })

      // 該当月のデータをフィルタ
      return result.data.filter(shift => shift.year === year && shift.month === month)
    } catch (error) {
      console.error('予定シフト読み込みエラー:', error)
      return []
    }
  }

  // 売上予測データを読み込み
  const loadSalesForecast = async (year, month) => {
    try {
      const response = await fetch('/data/forecast/sales_forecast_2024.csv')
      const text = await response.text()

      const result = await new Promise(resolve => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: resolve,
        })
      })

      // 該当月のデータをフィルタ
      return result.data.filter(f => parseInt(f.year) === year && parseInt(f.month) === month)
    } catch (error) {
      console.error('売上予測読み込みエラー:', error)
      return []
    }
  }

  // 予実差分を分析
  const analyzeDifference = (
    plannedShifts,
    actualShifts,
    actualPayroll,
    salesForecast,
    actualSales
  ) => {
    const analysis = {
      summary: {
        plannedShifts: plannedShifts.length,
        actualShifts: actualShifts.length,
        shiftCountDiff: actualShifts.length - plannedShifts.length,
        plannedHours: 0,
        actualHours: 0,
        hoursDiff: 0,
        plannedCost: 0,
        actualCost: 0,
        costDiff: 0,
        forecastSales:
          salesForecast.length > 0 ? parseInt(salesForecast[0].forecasted_sales || 0) : 0,
        actualSalesTotal: actualSales.length > 0 ? parseInt(actualSales[0].actual_sales || 0) : 0,
        salesDiff: 0,
        plannedProfit: 0,
        actualProfit: 0,
        profitDiff: 0,
      },
      staffAnalysis: {},
      dateAnalysis: {},
    }

    // 予定データを集計
    plannedShifts.forEach(shift => {
      analysis.summary.plannedHours += parseFloat(shift.actual_hours || 0)
      analysis.summary.plannedCost += parseFloat(shift.daily_wage || 0)
    })

    // 実績データを集計
    actualShifts.forEach(shift => {
      analysis.summary.actualHours += parseFloat(shift.actual_hours || 0)

      // スタッフ別分析
      if (!analysis.staffAnalysis[shift.staff_id]) {
        analysis.staffAnalysis[shift.staff_id] = {
          staff_name: shift.staff_name,
          plannedDays: 0,
          actualDays: 0,
          plannedHours: 0,
          actualHours: 0,
          hoursDiff: 0,
          differences: [],
        }
      }
      analysis.staffAnalysis[shift.staff_id].actualDays += 1
      analysis.staffAnalysis[shift.staff_id].actualHours += parseFloat(shift.actual_hours || 0)
    })

    // 給与データから実際のコストを計算
    actualPayroll.forEach(payroll => {
      analysis.summary.actualCost += parseInt(payroll.gross_salary || 0)

      if (analysis.staffAnalysis[payroll.staff_id]) {
        analysis.staffAnalysis[payroll.staff_id].actualCost = parseInt(payroll.gross_salary || 0)
      }
    })

    // 予定データをスタッフ別に集計
    plannedShifts.forEach(shift => {
      if (!analysis.staffAnalysis[shift.staff_id]) {
        analysis.staffAnalysis[shift.staff_id] = {
          staff_name: shift.staff_name,
          plannedDays: 0,
          actualDays: 0,
          plannedHours: 0,
          actualHours: 0,
          hoursDiff: 0,
          differences: [],
        }
      }
      analysis.staffAnalysis[shift.staff_id].plannedDays += 1
      analysis.staffAnalysis[shift.staff_id].plannedHours += parseFloat(shift.actual_hours || 0)
      analysis.staffAnalysis[shift.staff_id].plannedCost =
        (analysis.staffAnalysis[shift.staff_id].plannedCost || 0) +
        parseFloat(shift.daily_wage || 0)
    })

    // 差分を計算
    analysis.summary.hoursDiff = analysis.summary.actualHours - analysis.summary.plannedHours
    analysis.summary.costDiff = analysis.summary.actualCost - analysis.summary.plannedCost

    // 売上と利益の差分を計算
    analysis.summary.salesDiff = analysis.summary.actualSalesTotal - analysis.summary.forecastSales
    analysis.summary.plannedProfit = analysis.summary.forecastSales - analysis.summary.plannedCost
    analysis.summary.actualProfit = analysis.summary.actualSalesTotal - analysis.summary.actualCost
    analysis.summary.profitDiff = analysis.summary.actualProfit - analysis.summary.plannedProfit

    Object.values(analysis.staffAnalysis).forEach(staff => {
      staff.hoursDiff = staff.actualHours - staff.plannedHours
      staff.costDiff = (staff.actualCost || 0) - (staff.plannedCost || 0)
    })

    return analysis
  }

  const backToList = () => {
    setSelectedMonth(null)
    setDiffAnalysis(null)
  }

  // 差分分析画面
  if (selectedMonth && diffAnalysis) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader
          onHome={onHome}
          onShiftManagement={onShiftManagement}
          onLineMessages={onLineMessages}
          onMonitoring={onMonitoring}
          onStaffManagement={onStaffManagement}
          onStoreManagement={onStoreManagement}
          onConstraintManagement={onConstraintManagement}
          onBudgetActualManagement={onBudgetActualManagement}
        />

        <motion.div
          variants={PAGE_VARIANTS}
          initial="initial"
          animate="in"
          exit="out"
          transition={PAGE_TRANSITION}
          className="app-container"
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {/* ヘッダー */}
            <div>
              <Button variant="outline" onClick={backToList} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                一覧に戻る
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedMonth.year}年{selectedMonth.month}月 予実差分分析
              </h1>
              <p className="text-gray-600 mt-1">予定シフトと実績データの差分を分析します</p>
            </div>

            {/* サマリー */}
            <Card className="border-2 border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  差分サマリー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">シフト数</p>
                    <p className="text-sm">
                      予定: <span className="font-bold">{diffAnalysis.summary.plannedShifts}</span>
                    </p>
                    <p className="text-sm">
                      実績: <span className="font-bold">{diffAnalysis.summary.actualShifts}</span>
                    </p>
                    <p
                      className={`text-sm font-bold mt-2 ${diffAnalysis.summary.shiftCountDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      差分: {diffAnalysis.summary.shiftCountDiff > 0 ? '+' : ''}
                      {diffAnalysis.summary.shiftCountDiff}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">総労働時間</p>
                    <p className="text-sm">
                      予定:{' '}
                      <span className="font-bold">
                        {diffAnalysis.summary.plannedHours.toFixed(1)}h
                      </span>
                    </p>
                    <p className="text-sm">
                      実績:{' '}
                      <span className="font-bold">
                        {diffAnalysis.summary.actualHours.toFixed(1)}h
                      </span>
                    </p>
                    <p
                      className={`text-sm font-bold mt-2 ${diffAnalysis.summary.hoursDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      差分: {diffAnalysis.summary.hoursDiff > 0 ? '+' : ''}
                      {diffAnalysis.summary.hoursDiff.toFixed(1)}h
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">人件費</p>
                    <p className="text-sm">
                      予定:{' '}
                      <span className="font-bold">
                        ¥{diffAnalysis.summary.plannedCost.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-sm">
                      実績:{' '}
                      <span className="font-bold">
                        ¥{diffAnalysis.summary.actualCost.toLocaleString()}
                      </span>
                    </p>
                    <p
                      className={`text-sm font-bold mt-2 ${diffAnalysis.summary.costDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      差分: {diffAnalysis.summary.costDiff > 0 ? '+' : ''}¥
                      {diffAnalysis.summary.costDiff.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">売上</p>
                    <p className="text-sm">
                      予測:{' '}
                      <span className="font-bold">
                        ¥{diffAnalysis.summary.forecastSales.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-sm">
                      実績:{' '}
                      <span className="font-bold">
                        ¥{diffAnalysis.summary.actualSalesTotal.toLocaleString()}
                      </span>
                    </p>
                    <p
                      className={`text-sm font-bold mt-2 ${diffAnalysis.summary.salesDiff > 0 ? 'text-green-600' : diffAnalysis.summary.salesDiff < 0 ? 'text-red-600' : 'text-gray-600'}`}
                    >
                      差分: {diffAnalysis.summary.salesDiff > 0 ? '+' : ''}¥
                      {diffAnalysis.summary.salesDiff.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">利益</p>
                    <p className="text-sm">
                      予定:{' '}
                      <span className="font-bold">
                        ¥{diffAnalysis.summary.plannedProfit.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-sm">
                      実績:{' '}
                      <span className="font-bold">
                        ¥{diffAnalysis.summary.actualProfit.toLocaleString()}
                      </span>
                    </p>
                    <p
                      className={`text-sm font-bold mt-2 ${diffAnalysis.summary.profitDiff > 0 ? 'text-green-600' : diffAnalysis.summary.profitDiff < 0 ? 'text-red-600' : 'text-gray-600'}`}
                    >
                      差分: {diffAnalysis.summary.profitDiff > 0 ? '+' : ''}¥
                      {diffAnalysis.summary.profitDiff.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* スタッフ別分析 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  スタッフ別分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.values(diffAnalysis.staffAnalysis).map((staff, index) => (
                    <motion.div
                      key={staff.staff_name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={`border-2 ${Math.abs(staff.hoursDiff) > 3 ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}
                      >
                        <CardContent className="p-4">
                          <h4 className="font-bold text-md mb-3">{staff.staff_name}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">予定勤務:</span>
                              <span className="font-medium">
                                {staff.plannedDays}日 / {staff.plannedHours.toFixed(1)}h
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">実績勤務:</span>
                              <span className="font-medium">
                                {staff.actualDays}日 / {staff.actualHours.toFixed(1)}h
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-gray-600">時間差分:</span>
                              <span
                                className={`font-bold ${staff.hoursDiff > 0 ? 'text-green-600' : staff.hoursDiff < 0 ? 'text-red-600' : 'text-gray-600'}`}
                              >
                                {staff.hoursDiff > 0 ? '+' : ''}
                                {staff.hoursDiff.toFixed(1)}h
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">費用差分:</span>
                              <span
                                className={`font-bold ${staff.costDiff > 0 ? 'text-red-600' : staff.costDiff < 0 ? 'text-green-600' : 'text-gray-600'}`}
                              >
                                {staff.costDiff > 0 ? '+' : ''}¥
                                {(staff.costDiff || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    )
  }

  // 通常のインポート画面
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        onHome={onHome}
        onShiftManagement={onShiftManagement}
        onLineMessages={onLineMessages}
        onMonitoring={onMonitoring}
        onStaffManagement={onStaffManagement}
        onStoreManagement={onStoreManagement}
        onConstraintManagement={onConstraintManagement}
        onBudgetActualManagement={onBudgetActualManagement}
      />

      <motion.div
        variants={PAGE_VARIANTS}
        initial="initial"
        animate="in"
        exit="out"
        transition={PAGE_TRANSITION}
        className="app-container"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* ヘッダー */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">予実管理</h1>
              <p className="text-gray-600 mt-1">売上予測・実績データを管理します</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadSampleData}
                disabled={importing}
                className="text-blue-600 border-blue-600"
              >
                <Download className="h-4 w-4 mr-2" />
                サンプルデータをロード
              </Button>
              <Button
                variant="outline"
                onClick={clearAllData}
                className="text-red-600 border-red-600"
              >
                <Database className="h-4 w-4 mr-2" />
                データクリア
              </Button>
            </div>
          </div>

          {/* 年選択 */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-2xl font-bold">{selectedYear}年</div>
            <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* インポートセクション */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* 労働時間実績 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  労働時間実績
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSVファイルを選択
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={e => handleFileSelect(e, 'workHours')}
                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  />
                </div>

                {workHoursFile && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">{workHoursFile.name}</p>
                    <p className="text-xs text-blue-700 mt-1">{workHoursData.length}件のレコード</p>
                  </div>
                )}

                {workHoursPreview.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b">
                      <p className="text-xs font-medium text-gray-700">プレビュー（最初の5件）</p>
                    </div>
                    <div className="overflow-x-auto max-h-48">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-2 py-1 text-left">スタッフ名</th>
                            <th className="px-2 py-1 text-left">日付</th>
                            <th className="px-2 py-1 text-left">実働時間</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workHoursPreview.map((row, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-2 py-1">{row.staff_name}</td>
                              <td className="px-2 py-1">
                                {row.month}/{row.date}
                              </td>
                              <td className="px-2 py-1">{row.actual_hours}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <Button
                  onClick={importWorkHours}
                  disabled={!workHoursData.length || importing}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  インポート
                </Button>

                {importStatus.workHours.status !== 'idle' && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(importStatus.workHours.status)}
                    <span className="text-sm">{importStatus.workHours.message}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 給与明細 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  給与明細
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSVファイルを選択
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={e => handleFileSelect(e, 'payroll')}
                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100"
                  />
                </div>

                {payrollFile && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-900">{payrollFile.name}</p>
                    <p className="text-xs text-green-700 mt-1">{payrollData.length}件のレコード</p>
                  </div>
                )}

                {payrollPreview.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b">
                      <p className="text-xs font-medium text-gray-700">プレビュー（最初の5件）</p>
                    </div>
                    <div className="overflow-x-auto max-h-48">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-2 py-1 text-left">スタッフ名</th>
                            <th className="px-2 py-1 text-left">年月</th>
                            <th className="px-2 py-1 text-right">支給額</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payrollPreview.map((row, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-2 py-1">{row.staff_name}</td>
                              <td className="px-2 py-1">
                                {row.year}/{row.month}
                              </td>
                              <td className="px-2 py-1 text-right">
                                ¥{parseInt(row.net_salary).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <Button
                  onClick={importPayroll}
                  disabled={!payrollData.length || importing}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  インポート
                </Button>

                {importStatus.payroll.status !== 'idle' && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(importStatus.payroll.status)}
                    <span className="text-sm">{importStatus.payroll.message}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 売上実績 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  売上実績
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSVファイルを選択
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={e => handleFileSelect(e, 'salesActual')}
                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-purple-50 file:text-purple-700
                    hover:file:bg-purple-100"
                  />
                </div>

                {salesActualFile && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">{salesActualFile.name}</p>
                    <p className="text-xs text-purple-700 mt-1">
                      {salesActualData.length}件のレコード
                    </p>
                  </div>
                )}

                {salesActualPreview.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b">
                      <p className="text-xs font-medium text-gray-700">プレビュー（最初の5件）</p>
                    </div>
                    <div className="overflow-x-auto max-h-48">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-2 py-1 text-left">年月</th>
                            <th className="px-2 py-1 text-right">売上</th>
                            <th className="px-2 py-1 text-left">備考</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesActualPreview.map((row, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-2 py-1">
                                {row.year}/{row.month}
                              </td>
                              <td className="px-2 py-1 text-right">
                                ¥{parseInt(row.actual_sales).toLocaleString()}
                              </td>
                              <td className="px-2 py-1 text-xs text-gray-600">{row.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <Button
                  onClick={importSalesActual}
                  disabled={!salesActualData.length || importing}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  インポート
                </Button>

                {importStatus.salesActual.status !== 'idle' && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(importStatus.salesActual.status)}
                    <span className="text-sm">{importStatus.salesActual.message}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 売上予測 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  売上予測
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSVファイルを選択
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={e => handleFileSelect(e, 'forecast')}
                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-orange-50 file:text-orange-700
                    hover:file:bg-orange-100"
                  />
                </div>

                {forecastFile && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-orange-900">{forecastFile.name}</p>
                    <p className="text-xs text-orange-700 mt-1">
                      {forecastData.length}件のレコード
                    </p>
                  </div>
                )}

                {forecastPreview.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b">
                      <p className="text-xs font-medium text-gray-700">プレビュー（最初の5件）</p>
                    </div>
                    <div className="overflow-x-auto max-h-48">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-2 py-1 text-left">年月</th>
                            <th className="px-2 py-1 text-right">売上予測</th>
                            <th className="px-2 py-1 text-right">人件費</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forecastPreview.map((row, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-2 py-1">
                                {row.year}/{row.month}
                              </td>
                              <td className="px-2 py-1 text-right">
                                ¥{parseInt(row.forecasted_sales).toLocaleString()}
                              </td>
                              <td className="px-2 py-1 text-right">
                                ¥{parseInt(row.required_labor_cost).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <Button
                  onClick={importForecast}
                  disabled={!forecastData.length || importing}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  インポート
                </Button>

                {importStatus.forecast.status !== 'idle' && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(importStatus.forecast.status)}
                    <span className="text-sm">{importStatus.forecast.message}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 月別PL表 */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6" />
                <CardTitle className="text-xl">月別損益計算書（{selectedYear}年）</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="sticky left-0 bg-white px-4 py-3 text-left font-bold border-r-2 border-gray-300 min-w-[120px]">
                        項目
                      </th>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                        <th
                          key={month}
                          className="px-3 py-3 text-center font-semibold border-r border-gray-200 min-w-[100px]"
                        >
                          {month}月
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center font-bold bg-blue-50 border-l-2 border-gray-300 min-w-[120px]">
                        年間合計
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 売上 */}
                    <tr className="border-b-2 border-gray-300 hover:bg-gray-50">
                      <td className="sticky left-0 bg-white px-4 py-2 font-medium border-r-2 border-gray-300">
                        売上
                      </td>
                      {monthlyPL.map(pl => {
                        const hasActual = pl.salesActual > 0
                        const displayValue = hasActual ? pl.salesActual : pl.salesForecast
                        const diff = pl.salesActual - pl.salesForecast
                        const bgColor = !hasActual
                          ? 'bg-gray-50'
                          : diff > 0
                            ? 'bg-green-50'
                            : diff < 0
                              ? 'bg-red-50'
                              : 'bg-white'

                        return (
                          <td
                            key={pl.month}
                            className={`px-3 py-2 text-right border-r border-gray-100 ${bgColor} relative group ${hasActual ? 'cursor-help' : ''}`}
                          >
                            {displayValue > 0 ? (
                              <>
                                <span className={!hasActual ? 'text-gray-500' : ''}>
                                  {!hasActual && '(予) '}¥{displayValue.toLocaleString()}
                                </span>
                                {hasActual && (
                                  <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                                    予測: ¥{pl.salesForecast.toLocaleString()}
                                    <br />
                                    差分: {diff >= 0 ? '+' : ''}¥{diff.toLocaleString()} (
                                    {pl.salesDiffPercent >= 0 ? '+' : ''}
                                    {pl.salesDiffPercent.toFixed(1)}%)
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                )}
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-right font-bold bg-blue-50 border-l-2 border-gray-300">
                        ¥
                        {monthlyPL
                          .reduce(
                            (sum, pl) =>
                              sum + (pl.salesActual > 0 ? pl.salesActual : pl.salesForecast),
                            0
                          )
                          .toLocaleString()}
                      </td>
                    </tr>

                    {/* 人件費 */}
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="sticky left-0 bg-white px-4 py-2 font-medium border-r-2 border-gray-300">
                        人件費
                      </td>
                      {monthlyPL.map(pl => {
                        const hasActual = pl.laborCostActual > 0
                        const displayValue = hasActual ? pl.laborCostActual : pl.laborCostForecast
                        const diff = pl.laborCostActual - pl.laborCostForecast
                        const bgColor = !hasActual
                          ? 'bg-gray-50'
                          : diff > 0
                            ? 'bg-red-50'
                            : diff < 0
                              ? 'bg-green-50'
                              : 'bg-white'

                        return (
                          <td
                            key={pl.month}
                            className={`px-3 py-2 text-right border-r border-gray-100 ${bgColor} relative group ${hasActual ? 'cursor-help' : ''}`}
                          >
                            {displayValue > 0 ? (
                              <>
                                <span className={!hasActual ? 'text-gray-500' : ''}>
                                  {!hasActual && '(予) '}¥{displayValue.toLocaleString()}
                                </span>
                                {hasActual && (
                                  <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                                    予測: ¥{pl.laborCostForecast.toLocaleString()}
                                    <br />
                                    差分: {diff >= 0 ? '+' : ''}¥{diff.toLocaleString()} (
                                    {pl.laborCostDiffPercent >= 0 ? '+' : ''}
                                    {pl.laborCostDiffPercent.toFixed(1)}%)
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                )}
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-right font-bold bg-blue-50 border-l-2 border-gray-300">
                        ¥
                        {monthlyPL
                          .reduce(
                            (sum, pl) =>
                              sum +
                              (pl.laborCostActual > 0 ? pl.laborCostActual : pl.laborCostForecast),
                            0
                          )
                          .toLocaleString()}
                      </td>
                    </tr>

                    {/* 人件費率 */}
                    <tr className="border-b-2 border-gray-300 hover:bg-gray-50">
                      <td className="sticky left-0 bg-white px-4 py-2 font-medium border-r-2 border-gray-300 pl-8 text-xs">
                        　人件費率
                      </td>
                      {monthlyPL.map(pl => {
                        const hasActual = pl.laborRateActual !== 0 || pl.salesActual > 0
                        const displayValue = hasActual ? pl.laborRateActual : pl.laborRateForecast
                        const diff = pl.laborRateActual - pl.laborRateForecast
                        const bgColor = !hasActual
                          ? 'bg-gray-50'
                          : diff > 0
                            ? 'bg-red-50'
                            : diff < 0
                              ? 'bg-green-50'
                              : 'bg-white'

                        return (
                          <td
                            key={pl.month}
                            className={`px-3 py-2 text-right border-r border-gray-100 ${bgColor} relative group ${hasActual ? 'cursor-help' : ''}`}
                          >
                            {displayValue !== 0 || pl.salesForecast > 0 || pl.salesActual > 0 ? (
                              <>
                                <span className={!hasActual ? 'text-gray-500' : ''}>
                                  {!hasActual && '(予) '}
                                  {displayValue.toFixed(1)}%
                                </span>
                                {hasActual && (
                                  <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                                    予測: {pl.laborRateForecast.toFixed(1)}%<br />
                                    差分: {diff >= 0 ? '+' : ''}
                                    {diff.toFixed(1)}pt
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                )}
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-right font-bold bg-blue-50 border-l-2 border-gray-300">
                        {(() => {
                          const totalSales = monthlyPL.reduce(
                            (sum, pl) =>
                              sum + (pl.salesActual > 0 ? pl.salesActual : pl.salesForecast),
                            0
                          )
                          const totalLabor = monthlyPL.reduce(
                            (sum, pl) =>
                              sum +
                              (pl.laborCostActual > 0 ? pl.laborCostActual : pl.laborCostForecast),
                            0
                          )
                          return totalSales > 0
                            ? `${((totalLabor / totalSales) * 100).toFixed(1)}%`
                            : '-'
                        })()}
                      </td>
                    </tr>

                    {/* 交通費 */}
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="sticky left-0 bg-white px-4 py-2 font-medium border-r-2 border-gray-300">
                        交通費
                      </td>
                      {monthlyPL.map(pl => {
                        const hasActual = pl.commuteActual > 0
                        const displayValue = hasActual ? pl.commuteActual : pl.commuteForecast
                        const diff = pl.commuteActual - pl.commuteForecast
                        const bgColor = !hasActual
                          ? 'bg-gray-50'
                          : diff > 0
                            ? 'bg-red-50'
                            : diff < 0
                              ? 'bg-green-50'
                              : 'bg-white'

                        return (
                          <td
                            key={pl.month}
                            className={`px-3 py-2 text-right border-r border-gray-100 ${bgColor} relative group ${hasActual ? 'cursor-help' : ''}`}
                          >
                            {displayValue > 0 ? (
                              <>
                                <span className={!hasActual ? 'text-gray-500' : ''}>
                                  {!hasActual && '(予) '}¥{displayValue.toLocaleString()}
                                </span>
                                {hasActual && (
                                  <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                                    予測: ¥{pl.commuteForecast.toLocaleString()}
                                    <br />
                                    差分: {diff >= 0 ? '+' : ''}¥{diff.toLocaleString()} (
                                    {pl.commuteDiffPercent >= 0 ? '+' : ''}
                                    {pl.commuteDiffPercent.toFixed(1)}%)
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                )}
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-right font-bold bg-blue-50 border-l-2 border-gray-300">
                        ¥
                        {monthlyPL
                          .reduce(
                            (sum, pl) =>
                              sum + (pl.commuteActual > 0 ? pl.commuteActual : pl.commuteForecast),
                            0
                          )
                          .toLocaleString()}
                      </td>
                    </tr>

                    {/* 交通費率 */}
                    <tr className="border-b-2 border-gray-300 hover:bg-gray-50">
                      <td className="sticky left-0 bg-white px-4 py-2 font-medium border-r-2 border-gray-300 pl-8 text-xs">
                        　交通費率
                      </td>
                      {monthlyPL.map(pl => {
                        const hasActual = pl.commuteRateActual !== 0 || pl.salesActual > 0
                        const displayValue = hasActual
                          ? pl.commuteRateActual
                          : pl.commuteRateForecast
                        const diff = pl.commuteRateActual - pl.commuteRateForecast
                        const bgColor = !hasActual
                          ? 'bg-gray-50'
                          : diff > 0
                            ? 'bg-red-50'
                            : diff < 0
                              ? 'bg-green-50'
                              : 'bg-white'

                        return (
                          <td
                            key={pl.month}
                            className={`px-3 py-2 text-right border-r border-gray-100 ${bgColor} relative group ${hasActual ? 'cursor-help' : ''}`}
                          >
                            {displayValue !== 0 || pl.salesForecast > 0 || pl.salesActual > 0 ? (
                              <>
                                <span className={!hasActual ? 'text-gray-500' : ''}>
                                  {!hasActual && '(予) '}
                                  {displayValue.toFixed(1)}%
                                </span>
                                {hasActual && (
                                  <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                                    予測: {pl.commuteRateForecast.toFixed(1)}%<br />
                                    差分: {diff >= 0 ? '+' : ''}
                                    {diff.toFixed(1)}pt
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                )}
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-right font-bold bg-blue-50 border-l-2 border-gray-300">
                        {(() => {
                          const totalSales = monthlyPL.reduce(
                            (sum, pl) =>
                              sum + (pl.salesActual > 0 ? pl.salesActual : pl.salesForecast),
                            0
                          )
                          const totalCommute = monthlyPL.reduce(
                            (sum, pl) =>
                              sum + (pl.commuteActual > 0 ? pl.commuteActual : pl.commuteForecast),
                            0
                          )
                          return totalSales > 0
                            ? `${((totalCommute / totalSales) * 100).toFixed(1)}%`
                            : '-'
                        })()}
                      </td>
                    </tr>

                    {/* 営業利益 */}
                    <tr className="border-b border-gray-200 bg-yellow-50 hover:bg-yellow-100">
                      <td className="sticky left-0 bg-yellow-50 px-4 py-2 font-bold border-r-2 border-gray-300">
                        営業利益
                      </td>
                      {monthlyPL.map(pl => {
                        const hasActual = pl.profitActual !== 0 || pl.salesActual > 0
                        const displayValue = hasActual ? pl.profitActual : pl.profitForecast
                        const diff = pl.profitActual - pl.profitForecast
                        let bgColor = 'bg-yellow-50'
                        if (hasActual) {
                          bgColor =
                            diff > 0 ? 'bg-green-100' : diff < 0 ? 'bg-red-100' : 'bg-yellow-50'
                        }
                        const textColor = displayValue >= 0 ? 'text-green-700' : 'text-red-700'

                        return (
                          <td
                            key={pl.month}
                            className={`px-3 py-2 text-right border-r border-gray-100 font-semibold ${bgColor} ${textColor} relative group ${hasActual ? 'cursor-help' : ''}`}
                          >
                            {displayValue !== 0 || pl.salesForecast > 0 || pl.salesActual > 0 ? (
                              <>
                                <span>
                                  {!hasActual && <span className="text-gray-500">(予) </span>}¥
                                  {displayValue.toLocaleString()}
                                </span>
                                {hasActual && (
                                  <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                                    予測: ¥{pl.profitForecast.toLocaleString()}
                                    <br />
                                    差分: {diff >= 0 ? '+' : ''}¥{diff.toLocaleString()}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                )}
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-right font-bold bg-blue-100 border-l-2 border-gray-300 text-green-800">
                        ¥
                        {monthlyPL
                          .reduce(
                            (sum, pl) =>
                              sum +
                              (pl.profitActual !== 0 || pl.salesActual > 0
                                ? pl.profitActual
                                : pl.profitForecast),
                            0
                          )
                          .toLocaleString()}
                      </td>
                    </tr>

                    {/* 営業利益率 */}
                    <tr className="hover:bg-gray-50">
                      <td className="sticky left-0 bg-white px-4 py-2 font-medium border-r-2 border-gray-300 pl-8 text-xs whitespace-nowrap">
                        　利益率
                      </td>
                      {monthlyPL.map(pl => {
                        const hasActual = pl.profitRateActual !== 0 || pl.salesActual > 0
                        const displayValue = hasActual ? pl.profitRateActual : pl.profitRateForecast
                        const diff = pl.profitRateActual - pl.profitRateForecast
                        const bgColor = !hasActual
                          ? 'bg-gray-50'
                          : diff > 0
                            ? 'bg-green-50'
                            : diff < 0
                              ? 'bg-red-50'
                              : 'bg-white'

                        return (
                          <td
                            key={pl.month}
                            className={`px-3 py-2 text-right border-r border-gray-100 ${bgColor} relative group ${hasActual ? 'cursor-help' : ''}`}
                          >
                            {displayValue !== 0 || pl.salesForecast > 0 || pl.salesActual > 0 ? (
                              <>
                                <span className={!hasActual ? 'text-gray-500' : ''}>
                                  {!hasActual && '(予) '}
                                  {displayValue.toFixed(1)}%
                                </span>
                                {hasActual && (
                                  <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                                    予測: {pl.profitRateForecast.toFixed(1)}%<br />
                                    差分: {diff >= 0 ? '+' : ''}
                                    {diff.toFixed(1)}pt
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                )}
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-right font-bold bg-blue-50 border-l-2 border-gray-300">
                        {(() => {
                          const totalSales = monthlyPL.reduce(
                            (sum, pl) =>
                              sum + (pl.salesActual > 0 ? pl.salesActual : pl.salesForecast),
                            0
                          )
                          const totalProfit = monthlyPL.reduce(
                            (sum, pl) =>
                              sum +
                              (pl.profitActual !== 0 || pl.salesActual > 0
                                ? pl.profitActual
                                : pl.profitForecast),
                            0
                          )
                          return totalSales > 0
                            ? `${((totalProfit / totalSales) * 100).toFixed(1)}%`
                            : '-'
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-bold">凡例:</span>
                  <span className="ml-4 inline-block px-2 py-1 bg-green-50 border border-green-200 text-xs">
                    緑背景
                  </span>{' '}
                  = 実績が予測より良好
                  <span className="ml-2 inline-block px-2 py-1 bg-red-50 border border-red-200 text-xs">
                    赤背景
                  </span>{' '}
                  = 実績が予測より悪化
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 月別インポートステータス */}
          <Card>
            <CardHeader>
              <CardTitle>月別インポートステータス（{selectedYear}年）</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                データが揃っている月をクリックすると予実差分を確認できます
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {monthlyStatus.map(month => (
                  <div
                    key={month.month}
                    onClick={() => handleMonthClick(month)}
                    className={`border rounded-lg p-3 text-center transition-all ${
                      month.hasForecast &&
                      month.hasWorkHours &&
                      month.hasPayroll &&
                      month.hasSalesActual
                        ? 'cursor-pointer hover:shadow-lg hover:border-blue-500 bg-blue-50'
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <p className="font-bold text-lg mb-2">{month.month}月</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1 text-xs">
                        {month.hasForecast ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-300" />
                        )}
                        <span className={month.hasForecast ? 'text-green-700' : 'text-gray-400'}>
                          予測 {month.forecastCount}件
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        {month.hasWorkHours ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-300" />
                        )}
                        <span className={month.hasWorkHours ? 'text-green-700' : 'text-gray-400'}>
                          実績 {month.workHoursCount}件
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        {month.hasPayroll ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-300" />
                        )}
                        <span className={month.hasPayroll ? 'text-green-700' : 'text-gray-400'}>
                          給与 {month.payrollCount}件
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        {month.hasSalesActual ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-300" />
                        )}
                        <span className={month.hasSalesActual ? 'text-green-700' : 'text-gray-400'}>
                          売上 {month.salesActualCount}件
                        </span>
                      </div>
                    </div>
                    {month.hasForecast &&
                      month.hasWorkHours &&
                      month.hasPayroll &&
                      month.hasSalesActual && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <span className="text-xs text-blue-700 font-medium flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            差分を見る
                          </span>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}

export default BudgetActualManagement
