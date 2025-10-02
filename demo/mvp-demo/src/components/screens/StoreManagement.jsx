import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Store, Clock, MapPin, Phone, Download, Upload } from 'lucide-react'
import Papa from 'papaparse'
import { exportCSV, importCSV, validateStoreCSV, generateFilename } from '../../utils/csvHelper'

const StoreManagement = () => {
  const [stores, setStores] = useState([])
  const [constraints, setConstraints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load stores.csv
      const storesResponse = await fetch('/data/master/stores.csv')
      const storesText = await storesResponse.text()
      const storesParsed = Papa.parse(storesText, { header: true, skipEmptyLines: true })

      // Load store_constraints.csv
      const constraintsResponse = await fetch('/data/master/store_constraints.csv')
      const constraintsText = await constraintsResponse.text()
      const constraintsParsed = Papa.parse(constraintsText, { header: true, skipEmptyLines: true })

      setStores(storesParsed.data)
      setConstraints(constraintsParsed.data)
    } catch (error) {
      console.error('データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConstraintsByStore = (storeId) => {
    return constraints.filter(c => c.store_id === storeId && c.is_active === 'TRUE')
  }

  const formatConstraintValue = (constraint) => {
    try {
      const value = JSON.parse(constraint.constraint_value)
      if (constraint.constraint_type === 'min_staff_per_hour') {
        return `${value.hour_start}:00-${value.hour_end}:00 最低${value.min_staff}名`
      } else if (constraint.constraint_type === 'max_consecutive_days') {
        return `連続${value.max_days}日まで`
      } else if (constraint.constraint_type === 'required_skill_mix') {
        const skills = Object.entries(value.skills).map(([skill, count]) => `${skill}:${count}名`).join(', ')
        return `必要スキル: ${skills}`
      } else if (constraint.constraint_type === 'monthly_budget') {
        return `目標: ¥${value.target_cost?.toLocaleString()} / 上限: ¥${value.max_labor_cost?.toLocaleString()}`
      }
      return JSON.stringify(value)
    } catch (e) {
      return constraint.constraint_value
    }
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return badges[priority] || 'bg-gray-100 text-gray-800'
  }

  const handleExportCSV = () => {
    const result = exportCSV(stores, generateFilename('stores'))
    if (result.success) {
      alert('✅ CSVファイルをエクスポートしました')
    } else {
      alert(`❌ エクスポートに失敗しました: ${result.error}`)
    }
  }

  const handleImportCSV = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!window.confirm('既存の店舗データを上書きします。よろしいですか？')) {
      event.target.value = ''
      return
    }

    importCSV(
      file,
      (data) => {
        setStores(data)
        alert(`✅ ${data.length}件の店舗データをインポートしました`)
        event.target.value = ''
      },
      (error) => {
        alert(`❌ インポートエラー:\n${error}`)
        event.target.value = ''
      },
      validateStoreCSV
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Store className="h-8 w-8" />
                <CardTitle className="text-2xl">店舗情報管理</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleExportCSV}
                  className="bg-white text-green-700 hover:bg-gray-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSVエクスポート
                </Button>
                <label>
                  <Button
                    size="sm"
                    variant="secondary"
                    as="span"
                    className="bg-white text-green-700 hover:bg-gray-100 cursor-pointer"
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
          </CardHeader>

          <CardContent className="p-6">
            {stores.map((store) => {
              const storeConstraints = getConstraintsByStore(store.store_id)
              return (
                <motion.div
                  key={store.store_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  {/* 店舗基本情報 */}
                  <Card className="border-2 border-green-200 mb-4">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">{store.store_name}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{store.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{store.phone_number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>営業時間: {store.business_hours_start} - {store.business_hours_end}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">店舗コード</div>
                          <div className="font-mono font-bold text-lg">{store.store_code}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 店舗制約情報 */}
                  <div>
                    <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <div className="w-1 h-6 bg-green-600 rounded"></div>
                      店舗制約条件 ({storeConstraints.length}件)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {storeConstraints.map((constraint) => (
                        <Card key={constraint.constraint_id} className="border hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-semibold text-gray-800">
                                {constraint.constraint_type}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${getPriorityBadge(constraint.priority)}`}>
                                {constraint.priority}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {formatConstraintValue(constraint)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {constraint.description}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default StoreManagement
