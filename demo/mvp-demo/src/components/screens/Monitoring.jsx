import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  Users,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ArrowRight,
  Loader2
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

const Monitoring = ({ onNext, onPrev }) => {
  const [staffStatus, setStaffStatus] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAvailabilityData()
  }, [])

  const loadAvailabilityData = async () => {
    setLoading(true)
    try {
      // staff.csvを読み込み
      const staffResponse = await fetch('/data/master/staff.csv')
      const staffText = await staffResponse.text()
      const staffParsed = Papa.parse(staffText, { header: true, skipEmptyLines: true })

      // availability_requests.csvを読み込み
      const availResponse = await fetch('/data/transactions/availability_requests.csv')
      const availText = await availResponse.text()
      const availParsed = Papa.parse(availText, { header: true, skipEmptyLines: true })

      // スタッフごとに集計
      const staffMap = {}
      staffParsed.data.forEach(staff => {
        staffMap[staff.staff_id] = {
          id: parseInt(staff.staff_id),
          name: staff.name,
          submitted: false,
          submittedAt: null,
          lastReminder: null
        }
      })

      // 提出状況を集計
      availParsed.data.forEach(req => {
        if (staffMap[req.staff_id]) {
          staffMap[req.staff_id].submitted = true
          if (req.submitted_at) {
            const date = new Date(req.submitted_at)
            const formatted = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
            if (!staffMap[req.staff_id].submittedAt || new Date(req.submitted_at) > new Date(staffMap[req.staff_id].submittedAt)) {
              staffMap[req.staff_id].submittedAt = formatted
            }
          }
        }
      })

      setStaffStatus(Object.values(staffMap))
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const submittedCount = staffStatus.filter(s => s.submitted).length
  const totalCount = staffStatus.length
  const submissionRate = Math.round((submittedCount / totalCount) * 100)

  const sendReminder = (staffId) => {
    setStaffStatus(prev => prev.map(staff =>
      staff.id === staffId
        ? { ...staff, lastReminder: new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
        : staff
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
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
          希望回収モニタリング
        </h1>
        <p className="text-lg text-gray-600">スタッフの希望提出状況を監視</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">提出率</p>
                <p className="text-3xl font-bold text-blue-600">{submissionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">提出済み</p>
                <p className="text-3xl font-bold text-green-600">{submittedCount}名</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">未提出</p>
                <p className="text-3xl font-bold text-red-600">{totalCount - submittedCount}名</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* スタッフ一覧 */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-purple-600" />
            スタッフ提出状況
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staffStatus.map(staff => (
              <motion.div
                key={staff.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    staff.submitted ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium">{staff.name}</p>
                    <p className="text-sm text-gray-600">
                      {staff.submitted 
                        ? `提出済み: ${staff.submittedAt}`
                        : `最終催促: ${staff.lastReminder}`
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {staff.submitted ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">完了</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">未提出</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => sendReminder(staff.id)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        催促
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 一括操作 */}
      <Card className="shadow-lg border-0 mt-8">
        <CardHeader>
          <CardTitle>一括操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button variant="outline" className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              未提出者に一括催促
            </Button>
            <Button variant="outline" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              締切延長通知
            </Button>
          </div>
        </CardContent>
      </Card>

    </motion.div>
  )
}

export default Monitoring
