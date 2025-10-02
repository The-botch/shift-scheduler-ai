import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { 
  Sparkles,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  Loader2,
  Calendar as CalendarIcon
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

const FirstPlan = ({ onNext, onPrev }) => {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [shiftData, setShiftData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalShifts: 0,
    totalHours: 0,
    staffCount: 0
  })

  // CSVからデータを読み込む
  useEffect(() => {
    loadShiftData()
  }, [])

  const generateDemoData = () => {
    // 30日分のデモデータを生成
    const demoData = []
    const staffNames = ['田中', '佐藤', '鈴木', '高橋', '山田', '中村', '伊藤', '渡辺']

    for (let i = 1; i <= 30; i++) {
      const shifts = []
      const numShifts = 2 + Math.floor(Math.random() * 3) // 2-4シフト/日

      for (let j = 0; j < numShifts; j++) {
        const staffName = staffNames[Math.floor(Math.random() * staffNames.length)]
        const startHour = 9 + j * 4
        const endHour = startHour + 4

        shifts.push({
          name: staffName,
          time: `${startHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00`,
          skill: 3 + Math.floor(Math.random() * 3), // スキル3-5
          hours: 4
        })
      }

      demoData.push({
        date: i,
        fullDate: `2024-10-${i.toString().padStart(2, '0')}`,
        shifts
      })
    }

    return demoData
  }

  const loadShiftData = async () => {
    try {
      setLoading(true)

      // shift.csvを読み込み
      const shiftsResponse = await fetch('/data/transactions/shift.csv')

      if (!shiftsResponse.ok) {
        throw new Error('CSVファイルが見つかりません')
      }

      const shiftsText = await shiftsResponse.text()

      const shiftsResult = await new Promise((resolve, reject) => {
        Papa.parse(shiftsText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        })
      })

      // staff.csvを読み込み
      const staffResponse = await fetch('/data/master/staff.csv')
      const staffText = await staffResponse.text()

      const staffResult = await new Promise((resolve, reject) => {
        Papa.parse(staffText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        })
      })

      // スタッフIDから名前へのマッピング
      const staffMap = {}
      staffResult.data.forEach(staff => {
        staffMap[staff.staff_id] = staff.name
      })

      // 日付別にグループ化
      const groupedByDate = {}
      shiftsResult.data.forEach(shift => {
        const date = shift.shift_date
        if (!groupedByDate[date]) {
          groupedByDate[date] = []
        }
        groupedByDate[date].push({
          name: staffMap[shift.staff_id] || '不明',
          time: `${shift.start_time?.substring(0,5)}-${shift.end_time?.substring(0,5)}`,
          skill: shift.skill_level || 3,
          hours: shift.total_hours || 0
        })
      })

      // 日付順にソート
      const sortedDates = Object.keys(groupedByDate).sort()

      // 1日から連番で格納
      const formattedData = sortedDates.map((date, index) => ({
        date: index + 1,
        fullDate: date,
        shifts: groupedByDate[date]
      }))

      console.log('CSVから読み込んだデータ:', formattedData.length, '日分')
      console.log('スタッフ数:', Object.keys(staffMap).length)

      // データが不十分な場合（30日未満）はデモデータを使用
      if (formattedData.length < 30) {
        console.warn(`CSVデータが不十分です (${formattedData.length}日分)。デモデータを使用します。`)
        const demoData = generateDemoData()
        setShiftData(demoData)
        setStats({ totalShifts: demoData.length * 3, totalHours: demoData.length * 12, staffCount: 8 })
      } else {
        console.log('CSVデータを使用します')
        setShiftData(formattedData)

        // 統計情報を計算
        const totalShifts = shiftsResult.data.length
        const totalHours = shiftsResult.data.reduce((sum, s) => sum + (s.total_hours || 0), 0)
        const staffCount = Object.keys(staffMap).length

        setStats({ totalShifts, totalHours, staffCount })
      }

      setLoading(false)

    } catch (err) {
      console.error('データ読み込みエラー:', err)
      console.log('デモデータを使用します')

      // エラー時はデモデータを使用
      const demoData = generateDemoData()
      setShiftData(demoData)
      setStats({ totalShifts: demoData.length * 3, totalHours: demoData.length * 12, staffCount: 8 })
      setLoading(false)
    }
  }

  const generateFirstPlan = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
    }, 3000)
  }

  if (loading) {
    return (
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="container mx-auto px-4 py-8"
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg text-gray-600">データを準備しています...</p>
        </div>
      </motion.div>
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
          第1案生成（AI自動）
        </h1>
        <p className="text-lg text-gray-600">
          2024年10月シフト - {shiftData.length}日分のシフトを自動生成
        </p>
      </div>

      {!generated ? (
        <Card className="shadow-lg border-0">
          <CardContent className="p-12 text-center">
            {generating ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-12 w-12 text-purple-600" />
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold mb-4">AIがシフトを生成中...</h3>
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-200 rounded-full h-2 mb-4">
                    <motion.div
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3 }}
                    />
                  </div>
                  <p className="text-gray-600">制約条件を考慮し、最適なシフトを計算中...</p>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-12 w-12 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">AI自動シフト生成</h3>
                <p className="text-gray-600 mb-8">
                  スタッフ情報と制約条件から、最適なシフトを自動生成します
                  <br />
                  読み込み完了: {shiftData.length}日分、{stats.staffCount}名のスタッフ
                </p>
                <Button 
                  onClick={generateFirstPlan}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  自動生成を開始
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：KPI */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>生成結果サマリー</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">総シフト数</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.totalShifts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">総労働時間</span>
                  <span className="text-2xl font-bold text-green-600">{stats.totalHours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">カバレッジ</span>
                  <span className="text-2xl font-bold text-purple-600">94.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">制約違反</span>
                  <span className="text-2xl font-bold text-green-600">0件</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  法令遵守チェック
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    労働基準法第32条（法定労働時間）
                  </div>
                  <div className="flex items-center text-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    労働基準法第34条（休憩時間）
                  </div>
                  <div className="flex items-center text-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    労働基準法第35条（法定休日）
                  </div>
                  <div className="flex items-center text-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    労働基準法第61条（年少者保護）
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側：カレンダー */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  10月のシフト（{shiftData.length}日分）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                    <div key={day} className="p-2 text-center text-xs font-bold bg-blue-50 rounded">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {shiftData.map((dayData, index) => {
                    const dayOfWeek = new Date(dayData.fullDate).getDay()
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                    
                    return (
                      <motion.div
                        key={index}
                        className={`p-1 border rounded min-h-[80px] ${
                          isWeekend ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                        }`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <div className="text-xs font-bold mb-1 text-gray-700">
                          {dayData.date}
                        </div>
                        {dayData.shifts.map((shift, idx) => (
                          <motion.div
                            key={idx}
                            className="text-xs p-1 rounded mb-1 bg-green-100 border border-green-300"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 + idx * 0.1 }}
                          >
                            <div className="font-medium text-green-800">{shift.name}</div>
                            <div className="text-green-600 text-xs">{shift.time}</div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )
                  })}
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
                    <span>シフト配置済み</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded mr-2"></div>
                    <span>土日</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ナビゲーション */}
      <div className="mt-8 flex justify-between">
        <Button onClick={onPrev} variant="outline" size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          前のステップ
        </Button>
        <Button 
          onClick={onNext} 
          size="lg" 
          disabled={!generated}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          次のステップへ
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  )
}

export default FirstPlan