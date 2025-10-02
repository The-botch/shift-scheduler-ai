import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle, XCircle, FileText, DollarSign, Database, Download } from 'lucide-react'
import Papa from 'papaparse'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import {
  saveActualShifts,
  savePayroll,
  getActualShifts,
  getPayroll,
  getCount,
  clearStore
} from '../../utils/indexedDB'
import { INDEXED_DB, STORAGE_KEYS } from '../../config'
import { PAGE_VARIANTS, PAGE_TRANSITION } from '../../config/display'

const ActualDataImport = () => {
  const [workHoursFile, setWorkHoursFile] = useState(null)
  const [payrollFile, setPayrollFile] = useState(null)
  const [workHoursPreview, setWorkHoursPreview] = useState([])
  const [payrollPreview, setPayrollPreview] = useState([])
  const [workHoursData, setWorkHoursData] = useState([])
  const [payrollData, setPayrollData] = useState([])
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState({
    workHours: { status: 'idle', message: '' },
    payroll: { status: 'idle', message: '' }
  })
  const [monthlyStatus, setMonthlyStatus] = useState([])

  // IndexedDB内のデータ件数を取得
  useEffect(() => {
    loadImportStatus()
  }, [])

  const loadImportStatus = async () => {
    try {
      const workHoursCount = await getCount(INDEXED_DB.STORES.ACTUAL_SHIFTS)
      const payrollCount = await getCount(INDEXED_DB.STORES.PAYROLL)

      // 月ごとのステータスを生成
      const months = []
      for (let month = 1; month <= 12; month++) {
        const monthWorkHours = await getActualShifts(2024, month)
        const monthPayroll = await getPayroll(2024, month)

        months.push({
          month,
          year: 2024,
          workHoursCount: monthWorkHours.length,
          payrollCount: monthPayroll.length,
          hasWorkHours: monthWorkHours.length > 0,
          hasPayroll: monthPayroll.length > 0
        })
      }

      setMonthlyStatus(months)
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
    } else {
      setPayrollFile(file)
      parseCSV(file, 'payroll')
    }
  }

  // CSV解析
  const parseCSV = (file, type) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (type === 'workHours') {
          setWorkHoursData(result.data)
          setWorkHoursPreview(result.data.slice(0, 5))
        } else {
          setPayrollData(result.data)
          setPayrollPreview(result.data.slice(0, 5))
        }
      },
      error: (error) => {
        console.error('CSV解析エラー:', error)
        if (type === 'workHours') {
          setImportStatus(prev => ({
            ...prev,
            workHours: { status: 'error', message: 'CSV解析に失敗しました' }
          }))
        } else {
          setImportStatus(prev => ({
            ...prev,
            payroll: { status: 'error', message: 'CSV解析に失敗しました' }
          }))
        }
      }
    })
  }

  // サンプルデータをロード（publicフォルダのCSVファイルを直接読み込み）
  const loadSampleData = async () => {
    try {
      setImporting(true)

      // 労働時間実績CSVをロード
      const workHoursResponse = await fetch('/data/actual/work_hours_2024.csv')
      const workHoursText = await workHoursResponse.text()

      Papa.parse(workHoursText, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setWorkHoursData(result.data)
          setWorkHoursPreview(result.data.slice(0, 5))
          setWorkHoursFile({ name: 'work_hours_2024.csv (サンプル)' })
        }
      })

      // 給与明細CSVをロード
      const payrollResponse = await fetch('/data/actual/payroll_2024.csv')
      const payrollText = await payrollResponse.text()

      Papa.parse(payrollText, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setPayrollData(result.data)
          setPayrollPreview(result.data.slice(0, 5))
          setPayrollFile({ name: 'payroll_2024.csv (サンプル)' })
        }
      })

      setImportStatus({
        workHours: { status: 'idle', message: '' },
        payroll: { status: 'idle', message: '' }
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
        workHours: { status: 'error', message: 'データがありません' }
      }))
      return
    }

    setImporting(true)
    setImportStatus(prev => ({
      ...prev,
      workHours: { status: 'loading', message: 'インポート中...' }
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
        notes: row.notes || ''
      }))

      const result = await saveActualShifts(formattedData)

      setImportStatus(prev => ({
        ...prev,
        workHours: {
          status: 'success',
          message: `${formattedData.length}件のデータをインポートしました`
        }
      }))

      // ステータスを更新
      await loadImportStatus()
    } catch (error) {
      console.error('インポートエラー:', error)
      setImportStatus(prev => ({
        ...prev,
        workHours: { status: 'error', message: `エラー: ${error.message}` }
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
        payroll: { status: 'error', message: 'データがありません' }
      }))
      return
    }

    setImporting(true)
    setImportStatus(prev => ({
      ...prev,
      payroll: { status: 'loading', message: 'インポート中...' }
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
        payment_status: row.payment_status
      }))

      const result = await savePayroll(formattedData)

      setImportStatus(prev => ({
        ...prev,
        payroll: {
          status: 'success',
          message: `${formattedData.length}件のデータをインポートしました`
        }
      }))

      // ステータスを更新
      await loadImportStatus()
    } catch (error) {
      console.error('インポートエラー:', error)
      setImportStatus(prev => ({
        ...prev,
        payroll: { status: 'error', message: `エラー: ${error.message}` }
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
      await loadImportStatus()
      setImportStatus({
        workHours: { status: 'idle', message: '' },
        payroll: { status: 'idle', message: '' }
      })
      alert('データを削除しました')
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'loading':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return null
    }
  }

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="in"
      exit="out"
      transition={PAGE_TRANSITION}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">実績管理</h1>
            <p className="text-gray-600 mt-1">
              労働時間実績と給与明細データをIndexedDBにインポートします
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadSampleData} disabled={importing} className="text-blue-600 border-blue-600">
              <Download className="h-4 w-4 mr-2" />
              サンプルデータをロード
            </Button>
            <Button variant="outline" onClick={clearAllData} className="text-red-600 border-red-600">
              <Database className="h-4 w-4 mr-2" />
              データクリア
            </Button>
          </div>
        </div>

        {/* インポートセクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  onChange={(e) => handleFileSelect(e, 'workHours')}
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
                  <p className="text-xs text-blue-700 mt-1">
                    {workHoursData.length}件のレコード
                  </p>
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
                            <td className="px-2 py-1">{row.month}/{row.date}</td>
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
                  onChange={(e) => handleFileSelect(e, 'payroll')}
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
                  <p className="text-xs text-green-700 mt-1">
                    {payrollData.length}件のレコード
                  </p>
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
                            <td className="px-2 py-1">{row.year}/{row.month}</td>
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
        </div>

        {/* 月別インポートステータス */}
        <Card>
          <CardHeader>
            <CardTitle>月別インポートステータス（2024年）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {monthlyStatus.map((month) => (
                <div
                  key={month.month}
                  className="border rounded-lg p-3 text-center"
                >
                  <p className="font-bold text-lg mb-2">{month.month}月</p>
                  <div className="space-y-1">
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
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

export default ActualDataImport
