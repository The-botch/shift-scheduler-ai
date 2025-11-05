import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Store, Clock, MapPin, Phone, Briefcase, ChevronRight } from 'lucide-react'
import { validateStoreCSV } from '../../utils/csvHelper'
import CSVActions from '../shared/CSVActions'
import { CSVRepository } from '../../infrastructure/repositories/CSVRepository'
import { MasterRepository } from '../../infrastructure/repositories/MasterRepository'
import { useTenant } from '../../contexts/TenantContext'

const csvRepository = new CSVRepository()
const masterRepository = new MasterRepository()

const StoreManagement = ({
  onHome,
  onShiftManagement,
  onLineMessages,
  onMonitoring,
  onStaffManagement,
  onStoreManagement,
  onConstraintManagement,
  onBudgetActualManagement,
}) => {
  const { tenantId } = useTenant()
  const [stores, setStores] = useState([])
  const [constraints, setConstraints] = useState([])
  const [loading, setLoading] = useState(true)
  const [employmentTypes, setEmploymentTypes] = useState([])
  const [employmentRequirements, setEmploymentRequirements] = useState({})
  const [selectedStoreId, setSelectedStoreId] = useState(null)

  useEffect(() => {
    loadData()
  }, [tenantId])

  const loadData = async () => {
    setLoading(true)
    try {
      // 並行読み込み（MasterRepositoryを使用してテナントIDでフィルタリング）
      const [storesData, constraintsData, employmentTypesData] = await Promise.all([
        masterRepository.getStores(tenantId),
        masterRepository.getStoreConstraints(tenantId),
        masterRepository.getEmploymentTypes(tenantId),
      ])

      setStores(storesData)
      setConstraints(constraintsData)
      setEmploymentTypes(employmentTypesData)

      // デモ用の雇用形態別勤務条件を設定
      setEmploymentRequirements({
        FULL_TIME: { min_days: 20, description: '正社員は月20日以上勤務必須' },
        CONTRACT: { min_days: 18, description: '契約社員は月18日以上勤務必須' },
        PART_TIME: { min_days: 8, description: 'アルバイトは月8日以上勤務必須' },
        PART: { min_days: 10, description: 'パートは月10日以上勤務必須' },
        OUTSOURCE: { min_days: 15, description: '業務委託は月15日以上勤務必須' },
      })
    } catch (error) {
      console.error('データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConstraintsByStore = storeId => {
    return constraints.filter(c => c.store_id === storeId && c.is_active === 'TRUE')
  }

  const formatConstraintValue = constraint => {
    try {
      const value = JSON.parse(constraint.constraint_value)
      if (constraint.constraint_type === 'min_staff_per_hour') {
        return `${value.hour_start}:00-${value.hour_end}:00 最低${value.min_staff}名`
      } else if (constraint.constraint_type === 'max_consecutive_days') {
        return `連続${value.max_days}日まで`
      } else if (constraint.constraint_type === 'required_skill_mix') {
        const skills = Object.entries(value.skills)
          .map(([skill, count]) => `${skill}:${count}名`)
          .join(', ')
        return `必要スキル: ${skills}`
      } else if (constraint.constraint_type === 'monthly_budget') {
        return `目標: ¥${value.target_cost?.toLocaleString()} / 上限: ¥${value.max_labor_cost?.toLocaleString()}`
      }
      return JSON.stringify(value)
    } catch (e) {
      return constraint.constraint_value
    }
  }

  const getPriorityBadge = priority => {
    const badges = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    }
    return badges[priority] || 'bg-gray-100 text-gray-800'
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
    <div className="min-h-screen bg-slate-50 pt-8">
      <div className="app-container">
        <div className="h-[calc(100vh-180px)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            <Card className="shadow-lg flex flex-col overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Store className="h-8 w-8" />
                    <CardTitle className="text-2xl">店舗情報管理</CardTitle>
                  </div>
                  <CSVActions
                    data={stores}
                    filename="stores"
                    onImport={setStores}
                    validateFunction={validateStoreCSV}
                    importConfirmMessage="既存の店舗データを上書きします。よろしいですか？"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-6 flex-1 overflow-auto">
              {selectedStoreId === null ? (
                /* 店舗一覧表示 */
                <div className="space-y-3">
                  {stores.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>店舗データがありません</p>
                    </div>
                  ) : (
                    stores.map(store => {
                      const storeConstraints = getConstraintsByStore(store.store_id)
                      return (
                        <motion.div
                          key={store.store_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card
                            className="border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => setSelectedStoreId(store.store_id)}
                          >
                            <CardContent className="p-4 md:p-5">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Store className="h-5 w-5 text-green-600" />
                                    <h3 className="text-xl font-bold text-gray-800">
                                      {store.store_name}
                                    </h3>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm md:text-xs font-mono rounded">
                                      {store.store_code}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 ml-8">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{store.address}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-4 w-4" />
                                      <span>{store.phone_number}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        {store.business_hours_start} - {store.business_hours_end}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-2 ml-8">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-sm md:text-xs rounded">
                                      制約条件: {storeConstraints.length}件
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="h-6 w-6 text-gray-400" />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })
                  )}
                </div>
              ) : (
                /* 店舗詳細表示 */
                (() => {
                  const store = stores.find(s => s.store_id === selectedStoreId)
                  if (!store) return null
                  const storeConstraints = getConstraintsByStore(store.store_id)
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* 戻るボタン */}
                      <button
                        onClick={() => setSelectedStoreId(null)}
                        className="mb-4 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-2"
                      >
                        ← 店舗一覧に戻る
                      </button>

                      {/* 店舗基本情報 */}
                      <Card className="border-2 border-green-200 mb-6">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                {store.store_name}
                              </h3>
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
                                  <span>
                                    営業時間: {store.business_hours_start} -{' '}
                                    {store.business_hours_end}
                                  </span>
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
                      <div className="mb-6">
                        <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                          <div className="w-1 h-6 bg-green-600 rounded"></div>
                          店舗制約条件 ({storeConstraints.length}件)
                        </h4>
                        {storeConstraints.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            制約条件が設定されていません
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {storeConstraints.map(constraint => (
                              <Card
                                key={constraint.constraint_id}
                                className="border hover:shadow-md transition-shadow"
                              >
                                <CardContent className="p-4 md:p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="font-semibold text-gray-800">
                                      {constraint.constraint_type}
                                    </div>
                                    <span
                                      className={`px-2 py-1 rounded-full text-sm md:text-xs ${getPriorityBadge(constraint.priority)}`}
                                    >
                                      {constraint.priority}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 mb-2">
                                    {formatConstraintValue(constraint)}
                                  </div>
                                  <div className="text-sm md:text-xs text-gray-500">
                                    {constraint.description}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 雇用形態別勤務条件 */}
                      <div>
                        <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                          <div className="w-1 h-6 bg-purple-600 rounded"></div>
                          <Briefcase className="h-5 w-5 text-purple-600" />
                          雇用形態別勤務条件
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {employmentTypes.map(type => {
                            const requirement = employmentRequirements[type.employment_code]
                            return (
                              <Card
                                key={type.employment_type_id}
                                className="border-2 border-purple-200 hover:shadow-md transition-shadow"
                              >
                                <CardContent className="p-4 md:p-4">
                                  <div className="font-bold text-gray-800 mb-2">
                                    {type.employment_name}
                                  </div>
                                  {requirement && (
                                    <>
                                      <div className="text-2xl font-bold text-purple-600 mb-1">
                                        月{requirement.min_days}日以上
                                      </div>
                                      <div className="text-sm md:text-xs text-gray-500">
                                        {requirement.description}
                                      </div>
                                    </>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )
                })()
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default StoreManagement
