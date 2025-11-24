import { useState, useEffect } from 'react'
import { MESSAGES } from '../../constants/messages'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Shield, AlertTriangle, Download, Upload, BookOpen } from 'lucide-react'
import {
  exportCSV as exportCSVHelper,
  importCSV,
  validateConstraintCSV,
  generateFilename,
} from '../../utils/csvHelper'
import { CSVRepository } from '../../infrastructure/repositories/CSVRepository'

const csvRepository = new CSVRepository()

const ConstraintManagement = () => {
  const [laborLaws, setLaborLaws] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load labor_law_constraints.csv
      const data = await csvRepository.loadCSV('data/master/labor_law_constraints.csv')
      setLaborLaws(data)
    } catch (error) {
      console.error('データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = category => {
    const categories = {
      working_hours: '労働時間',
      rest_period: '休憩・休日',
      minor: '年少者',
      overtime: '時間外労働',
    }
    return categories[category] || category
  }

  const getPenaltyBadge = penalty => {
    const badges = {
      critical: { bg: 'bg-red-100', text: 'text-red-800', label: '重大' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800', label: '高' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '中' },
      low: { bg: 'bg-green-100', text: 'text-green-800', label: '低' },
    }
    const badge = badges[penalty] || badges.medium
    return (
      <span className={`px-2 py-1 rounded-full text-sm md:text-xs ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const formatConstraintRule = ruleStr => {
    try {
      const rule = JSON.parse(ruleStr)
      return (
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          {Object.entries(rule).map(([key, value]) => (
            <li key={key}>
              <span className="font-medium">{key}:</span>{' '}
              {typeof value === 'object' ? JSON.stringify(value) : value}
            </li>
          ))}
        </ul>
      )
    } catch {
      return <div className="text-sm text-gray-700">{ruleStr}</div>
    }
  }

  const groupByCategory = () => {
    const grouped = {}
    laborLaws.forEach(law => {
      if (!grouped[law.category]) {
        grouped[law.category] = []
      }
      grouped[law.category].push(law)
    })
    return grouped
  }

  const handleExportCSV = () => {
    const result = exportCSVHelper(laborLaws, generateFilename('labor_law_constraints'))
    if (result.success) {
      alert(MESSAGES.SUCCESS.CSV_EXPORT)
    } else {
      alert(MESSAGES.ERROR.EXPORT_ERROR(result.error))
    }
  }

  const handleImportCSV = event => {
    const file = event.target.files[0]
    if (!file) return

    if (!window.confirm('既存の制約データを上書きします。よろしいですか？')) {
      event.target.value = ''
      return
    }

    importCSV(
      file,
      data => {
        setLaborLaws(data)
        alert(MESSAGES.SUCCESS.CONSTRAINT_IMPORT(data.length))
        event.target.value = ''
      },
      error => {
        alert(MESSAGES.ERROR.IMPORT_ERROR(error))
        event.target.value = ''
      },
      validateConstraintCSV
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  const groupedLaws = groupByCategory()

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <div className="app-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8" />
                  <CardTitle className="text-2xl">制約情報管理</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleExportCSV}
                    className="bg-white text-purple-700 hover:bg-gray-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSVエクスポート
                  </Button>
                  <label>
                    <Button
                      size="sm"
                      variant="secondary"
                      as="span"
                      className="bg-white text-purple-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      CSVインポート
                    </Button>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <p className="text-sm text-purple-100 mt-2">労働基準法に基づく制約条件を管理します</p>
            </CardHeader>

            <CardContent className="p-6">
              {/* カテゴリー別に表示 */}
              {Object.entries(groupedLaws).map(([category, laws]) => (
                <div key={category} className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-purple-600 rounded"></div>
                    {getCategoryName(category)} ({laws.length}件)
                  </h3>
                  <div className="space-y-4">
                    {laws.map(law => (
                      <motion.div
                        key={law.law_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Card className="border-2 hover:shadow-md transition-shadow">
                          <CardContent className="p-4 md:p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-lg font-bold text-gray-800">
                                    {law.law_name}
                                  </h4>
                                  {getPenaltyBadge(law.penalty_level)}
                                </div>
                                <div className="flex items-center gap-2 text-sm md:text-xs text-gray-500 mb-2">
                                  <BookOpen className="h-3 w-3" />
                                  <span>{law.legal_reference}</span>
                                  <span className="font-mono text-gray-400">({law.law_code})</span>
                                </div>
                              </div>
                            </div>

                            <div className="mb-3 p-4 md:p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm md:text-xs text-gray-500 mb-1">法的根拠</div>
                              <div className="text-sm text-gray-700">{law.description}</div>
                            </div>

                            <div className="mb-3">
                              <div className="text-sm md:text-xs text-gray-500 mb-2">
                                制約ルール
                              </div>
                              {formatConstraintRule(law.constraint_rule)}
                            </div>

                            {law.is_active === 'TRUE' ? (
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-sm md:text-xs text-green-700">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>有効</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm md:text-xs text-gray-700">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span>無効</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

              {/* サマリー */}
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-purple-600" />
                    <h4 className="font-bold text-purple-800">制約情報サマリー</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm md:text-sm">
                    <div>
                      <div className="text-purple-600">総制約数</div>
                      <div className="text-2xl font-bold text-purple-800">{laborLaws.length}</div>
                    </div>
                    <div>
                      <div className="text-purple-600">重大レベル</div>
                      <div className="text-2xl font-bold text-red-600">
                        {laborLaws.filter(l => l.penalty_level === 'critical').length}
                      </div>
                    </div>
                    <div>
                      <div className="text-purple-600">高レベル</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {laborLaws.filter(l => l.penalty_level === 'high').length}
                      </div>
                    </div>
                    <div>
                      <div className="text-purple-600">有効な制約</div>
                      <div className="text-2xl font-bold text-green-600">
                        {laborLaws.filter(l => l.is_active === 'TRUE').length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default ConstraintManagement
