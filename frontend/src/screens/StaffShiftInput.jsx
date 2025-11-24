import { useState } from 'react'
import { useLiff } from '../hooks/useLiff'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import MobileShiftCalendar from '../components/mobile/MobileShiftCalendar'
import ShiftPatternSelector from '../components/mobile/ShiftPatternSelector'
import { Loader2, CheckCircle, AlertCircle, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const StaffShiftInput = () => {
  const { profile, logout } = useLiff()
  const [selectedDates, setSelectedDates] = useState([])
  const [shiftTime, setShiftTime] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const handleDateToggle = (year, month, date) => {
    const dateKey = { year, month, date }
    const exists = selectedDates.some(d => d.year === year && d.month === month && d.date === date)

    if (exists) {
      setSelectedDates(
        selectedDates.filter(d => !(d.year === year && d.month === month && d.date === date))
      )
    } else {
      setSelectedDates([...selectedDates, dateKey])
    }
  }

  const handleShiftTimeSelect = time => {
    setShiftTime(time)
  }

  const handleSubmit = async () => {
    if (selectedDates.length === 0 || !shiftTime) {
      setSubmitStatus({ type: 'error', message: '日付とシフト時間を選択してください' })
      return
    }

    setSubmitting(true)
    setSubmitStatus(null)

    try {
      const shiftRequests = selectedDates.map(d => ({
        date: `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.date).padStart(2, '0')}`,
        start_time: shiftTime.start_time,
        end_time: shiftTime.end_time,
      }))

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/api/liff/shift-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${profile.idToken}`,
          },
          body: JSON.stringify({
            shift_dates: shiftRequests,
          }),
        }
      )

      const result = await response.json()

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: `${selectedDates.length}日分のシフト希望を登録しました`,
        })
        setSelectedDates([])
        setShiftTime(null)
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'シフト希望の登録に失敗しました',
        })
      }
    } catch (error) {
      console.error('シフト登録エラー:', error)
      setSubmitStatus({
        type: 'error',
        message: 'ネットワークエラーが発生しました',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile?.pictureUrl && (
                <img
                  src={profile.pictureUrl}
                  alt={profile.displayName}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-bold text-sm">{profile?.displayName}</p>
                <p className="text-xs text-gray-600">シフト希望登録</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-600">
              <LogOut className="h-4 w-4 mr-1" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* ステータスメッセージ */}
        <AnimatePresence>
          {submitStatus && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card
                className={`${
                  submitStatus.type === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    {submitStatus.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <p
                      className={`text-sm font-medium ${
                        submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {submitStatus.message}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* カレンダー */}
        <MobileShiftCalendar
          year={currentYear}
          month={currentMonth}
          selectedDates={selectedDates}
          onDateToggle={handleDateToggle}
        />

        {/* シフトパターン選択 */}
        {selectedDates.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ShiftPatternSelector
              onSelect={handleShiftTimeSelect}
              selectedDatesCount={selectedDates.length}
            />
          </motion.div>
        )}

        {/* 登録ボタン */}
        {selectedDates.length > 0 && shiftTime && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">登録内容:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 選択日数: {selectedDates.length}日</li>
                      <li>
                        • シフト時間: {shiftTime.start_time} - {shiftTime.end_time}
                      </li>
                      <li>• パターン: {shiftTime.pattern_name}</li>
                    </ul>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full h-12 text-lg font-medium"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        登録中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        シフト希望を登録
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 使い方ガイド */}
        {selectedDates.length === 0 && (
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">使い方</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 space-y-2">
              <p>1. カレンダーから勤務希望日をタップして選択</p>
              <p>2. シフトパターン（午前/午後/夜間/カスタム）を選択</p>
              <p>3. 「シフト希望を登録」ボタンをタップ</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default StaffShiftInput
