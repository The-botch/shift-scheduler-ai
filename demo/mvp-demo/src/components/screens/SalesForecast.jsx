import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { TrendingUp, DollarSign, Users, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import Papa from 'papaparse'
import CSVActions from '../shared/CSVActions'

const SalesForecast = () => {
  const [forecasts, setForecasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(2024)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load sales_forecast_2024.csv
      const response = await fetch('/data/forecast/sales_forecast_2024.csv')
      const text = await response.text()
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })

      setForecasts(parsed.data)
    } catch (error) {
      console.error('売上予測データ読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateSalesForecastCSV = (data) => {
    const requiredColumns = ['forecast_id', 'year', 'month', 'store_id', 'forecasted_sales', 'required_staff_count', 'required_hours']

    if (!data || data.length === 0) {
      throw new Error('CSVファイルが空です')
    }

    const columns = Object.keys(data[0])
    const missingColumns = requiredColumns.filter(col => !columns.includes(col))

    if (missingColumns.length > 0) {
      throw new Error(`必須カラムが不足しています: ${missingColumns.join(', ')}`)
    }

    return true
  }

  const getMonthlyData = (month) => {
    return forecasts.find(f => parseInt(f.year) === selectedYear && parseInt(f.month) === month)
  }

  const calculateYearlyTotals = () => {
    const yearlyForecasts = forecasts.filter(f => parseInt(f.year) === selectedYear)

    return {
      totalSales: yearlyForecasts.reduce((sum, f) => sum + parseInt(f.forecasted_sales || 0), 0),
      avgStaffCount: Math.round(yearlyForecasts.reduce((sum, f) => sum + parseInt(f.required_staff_count || 0), 0) / yearlyForecasts.length),
      totalHours: yearlyForecasts.reduce((sum, f) => sum + parseInt(f.required_hours || 0), 0),
      monthCount: yearlyForecasts.length
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  const yearlyTotals = calculateYearlyTotals()

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8" />
                <CardTitle className="text-2xl">売上予測管理</CardTitle>
              </div>
              <CSVActions
                data={forecasts}
                filename="sales_forecast"
                onImport={setForecasts}
                validateFunction={validateSalesForecastCSV}
                importConfirmMessage="既存の売上予測データを上書きします。よろしいですか？"
              />
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* 年選択 */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedYear(selectedYear - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-2xl font-bold">{selectedYear}年</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedYear(selectedYear + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 年間サマリー */}
            {yearlyTotals.monthCount > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
                  <CardContent className="p-6 text-center">
                    <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm text-blue-700 mb-1">年間売上予測</div>
                    <div className="text-3xl font-bold text-blue-800">
                      ¥{yearlyTotals.totalSales.toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      月平均 ¥{Math.round(yearlyTotals.totalSales / yearlyTotals.monthCount).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300">
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm text-purple-700 mb-1">平均必要人員</div>
                    <div className="text-3xl font-bold text-purple-800">
                      {yearlyTotals.avgStaffCount}名
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      {yearlyTotals.monthCount}ヶ月平均
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-sm text-green-700 mb-1">年間必要労働時間</div>
                    <div className="text-3xl font-bold text-green-800">
                      {yearlyTotals.totalHours.toLocaleString()}h
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      月平均 {Math.round(yearlyTotals.totalHours / yearlyTotals.monthCount).toLocaleString()}h
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 月別予測データ */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-600 rounded"></div>
                月別売上予測
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                  const data = getMonthlyData(month)

                  return (
                    <Card
                      key={month}
                      className={`border-2 transition-all ${
                        data
                          ? 'border-blue-300 hover:shadow-lg bg-gradient-to-br from-white to-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xl font-bold text-gray-800">{month}月</div>
                          {data && (
                            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              登録済
                            </div>
                          )}
                        </div>

                        {data ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">売上予測:</span>
                              <span className="font-bold text-blue-700">
                                ¥{parseInt(data.forecasted_sales).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">必要人員:</span>
                              <span className="font-semibold text-purple-700">
                                {data.required_staff_count}名
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">必要時間:</span>
                              <span className="font-semibold text-green-700">
                                {parseInt(data.required_hours).toLocaleString()}h
                              </span>
                            </div>
                            {data.notes && (
                              <div className="pt-2 border-t border-gray-200">
                                <div className="text-xs text-gray-500">{data.notes}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-400 text-sm">
                            データなし
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {forecasts.filter(f => parseInt(f.year) === selectedYear).length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-2">
                  {selectedYear}年の売上予測データがありません
                </p>
                <p className="text-sm text-gray-400">
                  CSVファイルをインポートしてください
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default SalesForecast
