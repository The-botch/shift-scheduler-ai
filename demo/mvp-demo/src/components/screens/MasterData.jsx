import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  Users,
  Store,
  Shield,
  Award,
  Calendar,
  AlertCircle,
  Scale,
  Loader2,
  ChevronLeft
} from 'lucide-react'
import Papa from 'papaparse'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}

const MasterData = ({ onPrev }) => {
  const [activeTab, setActiveTab] = useState('staff')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    staff: [],
    stores: [],
    roles: [],
    skills: [],
    staffSkills: [],
    shiftPatterns: [],
    storeConstraints: [],
    laborLawConstraints: []
  })

  const tabs = [
    { id: 'staff', label: 'スタッフ一覧', icon: Users, file: 'staff.csv' },
    { id: 'stores', label: '店舗情報', icon: Store, file: 'stores.csv' },
    { id: 'roles', label: '役割', icon: Shield, file: 'roles.csv' },
    { id: 'skills', label: 'スキル', icon: Award, file: 'skills.csv' },
    { id: 'staffSkills', label: 'スタッフスキル', icon: Award, file: 'staff_skills.csv' },
    { id: 'shiftPatterns', label: 'シフトパターン', icon: Calendar, file: 'shift_patterns.csv' },
    { id: 'storeConstraints', label: '店舗制約', icon: AlertCircle, file: 'store_constraints.csv' },
    { id: 'laborLawConstraints', label: '労働法制約', icon: Scale, file: 'labor_law_constraints.csv' }
  ]

  useEffect(() => {
    loadAllData()
  }, [])

  const loadCSV = async (fileName) => {
    const response = await fetch(`/data/master/${fileName}`)
    const text = await response.text()

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => resolve(result.data),
        error: reject
      })
    })
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const results = await Promise.all(
        tabs.map(async (tab) => {
          try {
            const csvData = await loadCSV(tab.file)
            return { id: tab.id, data: csvData }
          } catch (err) {
            console.error(`${tab.file} の読み込みエラー:`, err)
            return { id: tab.id, data: [] }
          }
        })
      )

      const newData = {}
      results.forEach(result => {
        newData[result.id] = result.data
      })
      setData(newData)
    } catch (err) {
      console.error('データ読み込みエラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderTable = (tableData) => {
    if (!tableData || tableData.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>データがありません</p>
        </div>
      )
    }

    const columns = Object.keys(tableData[0])

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rowIndex * 0.02 }}
                className="hover:bg-gray-50"
              >
                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {row[column] !== null && row[column] !== undefined
                      ? String(row[column])
                      : '-'}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          マスターデータ管理
        </h1>
        <p className="text-lg text-gray-600">スタッフ、店舗、制約条件などの基本情報を確認</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg text-gray-600">データを読み込んでいます...</p>
        </div>
      ) : (
        <>
          {/* タブナビゲーション */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? 'default' : 'outline'}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center ${
                      isActive
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : ''
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                      {data[tab.id]?.length || 0}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* データ表示カード */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                {(() => {
                  const currentTab = tabs.find(t => t.id === activeTab)
                  const Icon = currentTab?.icon || Users
                  return (
                    <>
                      <Icon className="h-5 w-5 mr-2 text-blue-600" />
                      {currentTab?.label}
                    </>
                  )
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable(data[activeTab])}
            </CardContent>
          </Card>
        </>
      )}

      {/* ナビゲーション */}
      <div className="mt-8">
        <Button onClick={onPrev} variant="outline" size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          ダッシュボードに戻る
        </Button>
      </div>
    </motion.div>
  )
}

export default MasterData
