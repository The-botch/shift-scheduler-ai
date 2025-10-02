import React, { useState, useEffect, useRef } from 'react'
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
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  Download
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
  const [editingRow, setEditingRow] = useState(null)
  const [editedData, setEditedData] = useState({})
  const fileInputRef = useRef(null)

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

  const handleAddRow = () => {
    const tableData = data[activeTab] || []
    if (tableData.length === 0) return

    const columns = Object.keys(tableData[0])
    const newRow = {}
    columns.forEach(col => {
      newRow[col] = ''
    })

    setData({
      ...data,
      [activeTab]: [...tableData, newRow]
    })
  }

  const handleEditRow = (rowIndex) => {
    setEditingRow(rowIndex)
    setEditedData({ ...data[activeTab][rowIndex] })
  }

  const handleSaveRow = () => {
    const updatedData = [...data[activeTab]]
    updatedData[editingRow] = editedData
    setData({
      ...data,
      [activeTab]: updatedData
    })
    setEditingRow(null)
    setEditedData({})
  }

  const handleCancelEdit = () => {
    setEditingRow(null)
    setEditedData({})
  }

  const handleDeleteRow = (rowIndex) => {
    if (!confirm('この行を削除しますか？')) return

    const updatedData = data[activeTab].filter((_, index) => index !== rowIndex)
    setData({
      ...data,
      [activeTab]: updatedData
    })
  }

  const handleCellChange = (column, value) => {
    setEditedData({
      ...editedData,
      [column]: value
    })
  }

  const handleImportCSV = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length > 0) {
            console.error('CSVパースエラー:', result.errors)
            alert('CSVの読み込み中にエラーが発生しました')
            return
          }
          setData({
            ...data,
            [activeTab]: result.data
          })
          alert('CSVを正常にインポートしました')
          event.target.value = ''
        },
        error: (err) => {
          console.error('CSVインポートエラー:', err)
          alert('CSVのインポートに失敗しました')
        }
      })
    }
    reader.onerror = () => {
      alert('ファイルの読み込みに失敗しました')
    }
    reader.readAsText(file)
  }

  const handleExportCSV = () => {
    const tableData = data[activeTab]
    if (!tableData || tableData.length === 0) {
      alert('エクスポートするデータがありません')
      return
    }

    try {
      // BOM付きでUTF-8エンコード（Excelで文字化けしないように）
      const csv = Papa.unparse(tableData)
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
      const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const currentTab = tabs.find(t => t.id === activeTab)
      link.setAttribute('href', url)
      link.setAttribute('download', currentTab.file)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // メモリ解放
      setTimeout(() => URL.revokeObjectURL(url), 100)

      alert('CSVを正常にエクスポートしました')
    } catch (err) {
      console.error('CSVエクスポートエラー:', err)
      alert('CSVのエクスポートに失敗しました')
    }
  }

  const renderTable = (tableData) => {
    if (!tableData || tableData.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>データがありません</p>
          <Button onClick={handleAddRow} className="mt-4" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            最初の行を追加
          </Button>
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rowIndex * 0.02 }}
                className={editingRow === rowIndex ? "bg-blue-50" : "hover:bg-gray-50"}
              >
                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-6 py-4 whitespace-nowrap text-sm"
                  >
                    {editingRow === rowIndex ? (
                      <input
                        type="text"
                        value={editedData[column] || ''}
                        onChange={(e) => handleCellChange(column, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-900">
                        {row[column] !== null && row[column] !== undefined
                          ? String(row[column])
                          : '-'}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                  {editingRow === rowIndex ? (
                    <>
                      <Button onClick={handleSaveRow} size="sm" variant="default">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button onClick={handleCancelEdit} size="sm" variant="outline">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => handleEditRow(rowIndex)} size="sm" variant="outline">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDeleteRow(rowIndex)} size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </td>
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

          {/* ツールバー */}
          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={handleAddRow} size="sm" variant="default">
                <Plus className="h-4 w-4 mr-2" />
                行を追加
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                CSVインポート
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </div>
            <Button onClick={handleExportCSV} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              CSVエクスポート
            </Button>
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
    </motion.div>
  )
}

export default MasterData
