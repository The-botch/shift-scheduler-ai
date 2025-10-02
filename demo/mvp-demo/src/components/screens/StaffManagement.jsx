import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Users, Download, Upload, X, DollarSign, Clock, TrendingUp, Calendar, Award } from 'lucide-react'
import Papa from 'papaparse'
import { exportCSV, importCSV, validateStaffCSV, generateFilename } from '../../utils/csvHelper'

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([])
  const [roles, setRoles] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [staffPerformance, setStaffPerformance] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load staff.csv
      const staffResponse = await fetch('/data/master/staff.csv')
      const staffText = await staffResponse.text()
      const staffParsed = Papa.parse(staffText, { header: true, skipEmptyLines: true })

      // Load roles.csv
      const rolesResponse = await fetch('/data/master/roles.csv')
      const rolesText = await rolesResponse.text()
      const rolesParsed = Papa.parse(rolesText, { header: true, skipEmptyLines: true })

      // Load skills.csv
      const skillsResponse = await fetch('/data/master/skills.csv')
      const skillsText = await skillsResponse.text()
      const skillsParsed = Papa.parse(skillsText, { header: true, skipEmptyLines: true })

      // Load shift_history_2023-2024.csv for performance data (全期間実績)
      const shiftsResponse = await fetch('/data/history/shift_history_2023-2024.csv')
      const shiftsText = await shiftsResponse.text()
      const shiftsParsed = Papa.parse(shiftsText, { header: true, skipEmptyLines: true })

      // スタッフ別実績を集計
      const performanceMap = {}
      shiftsParsed.data.forEach(shift => {
        const staffName = shift.staff_name
        if (!performanceMap[staffName]) {
          performanceMap[staffName] = {
            totalDays: 0,
            totalHours: 0,
            totalWage: 0,
            weekdayDays: 0,
            weekendDays: 0,
            earlyShifts: 0,
            lateShifts: 0,
            modifiedCount: 0,
            shifts: [],
            monthlyStats: {} // 月別統計
          }
        }

        const perf = performanceMap[staffName]
        perf.totalDays += 1
        const hours = parseFloat(shift.actual_hours || 0)
        const wage = parseFloat(shift.daily_wage || 0)
        perf.totalHours += hours
        perf.totalWage += wage

        // 月別統計
        const monthKey = `${shift.year}-${String(shift.month).padStart(2, '0')}`
        if (!perf.monthlyStats[monthKey]) {
          perf.monthlyStats[monthKey] = {
            days: 0,
            hours: 0,
            wage: 0
          }
        }
        perf.monthlyStats[monthKey].days += 1
        perf.monthlyStats[monthKey].hours += hours
        perf.monthlyStats[monthKey].wage += wage

        // 曜日判定
        const dayOfWeek = shift.day_of_week
        if (dayOfWeek === '土' || dayOfWeek === '日') {
          perf.weekendDays += 1
        } else {
          perf.weekdayDays += 1
        }

        // 早番・遅番判定（開始時刻で判定）
        const startHour = parseInt(shift.start_time.split(':')[0])
        if (startHour < 12) {
          perf.earlyShifts += 1
        } else {
          perf.lateShifts += 1
        }

        // 変更フラグ
        if (shift.modified_flag === 'TRUE') {
          perf.modifiedCount += 1
        }

        // シフト詳細を保存（最新100件まで）
        if (perf.shifts.length < 100) {
          perf.shifts.push({
            year: shift.year,
            month: shift.month,
            date: shift.date,
            dayOfWeek: shift.day_of_week,
            startTime: shift.start_time,
            endTime: shift.end_time,
            hours: shift.actual_hours,
            wage: shift.daily_wage
          })
        }
      })

      setStaffList(staffParsed.data)
      setRoles(rolesParsed.data)
      setSkills(skillsParsed.data)
      setStaffPerformance(performanceMap)
    } catch (error) {
      console.error('データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.role_id === roleId)
    return role ? role.role_name : roleId
  }

  const handleExportCSV = () => {
    const result = exportCSV(staffList, generateFilename('staff'))
    if (result.success) {
      alert('✅ CSVファイルをエクスポートしました')
    } else {
      alert(`❌ エクスポートに失敗しました: ${result.error}`)
    }
  }

  const handleImportCSV = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!window.confirm('既存のスタッフデータを上書きします。よろしいですか？')) {
      event.target.value = '' // リセット
      return
    }

    importCSV(
      file,
      (data) => {
        setStaffList(data)
        alert(`✅ ${data.length}件のスタッフデータをインポートしました`)
        event.target.value = '' // リセット
      },
      (error) => {
        alert(`❌ インポートエラー:\n${error}`)
        event.target.value = '' // リセット
      },
      validateStaffCSV
    )
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

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8" />
                <CardTitle className="text-2xl">スタッフ管理</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleExportCSV}
                  className="bg-white text-blue-700 hover:bg-gray-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSVエクスポート
                </Button>
                <label>
                  <Button
                    size="sm"
                    variant="secondary"
                    as="span"
                    className="bg-white text-blue-700 hover:bg-gray-100 cursor-pointer"
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
            {/* 役職一覧 */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-600 rounded"></div>
                役職マスタ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {roles.map((role) => (
                  <Card key={role.role_id} className="border-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="font-bold text-lg mb-1">{role.role_name}</div>
                      <div className="text-sm text-gray-600">{role.role_code}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {role.employment_type === 'monthly' && '月給制'}
                        {role.employment_type === 'hourly' && '時給制'}
                        {role.employment_type === 'contract' && '業務委託'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* スキル一覧 */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-green-600 rounded"></div>
                スキルマスタ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {skills.map((skill) => (
                  <Card key={skill.skill_id} className="border-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="font-bold text-lg mb-1">{skill.skill_name}</div>
                      <div className="text-sm text-gray-600">{skill.skill_code}</div>
                      <div className="text-xs text-gray-500 mt-2">{skill.description}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* スタッフ一覧テーブル */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-purple-600 rounded"></div>
                スタッフ一覧 ({staffList.length}名)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">スタッフコード</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">氏名</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">フリガナ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">役職</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">雇用形態</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">入社日</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">スキルレベル</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">週最大時間</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((staff, index) => (
                      <motion.tr
                        key={staff.staff_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedStaff(staff)}
                      >
                        <td className="px-4 py-3 text-sm border-b">{staff.staff_code}</td>
                        <td className="px-4 py-3 text-sm font-medium border-b">{staff.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-b">{staff.name_kana}</td>
                        <td className="px-4 py-3 text-sm border-b">{getRoleName(staff.role_id)}</td>
                        <td className="px-4 py-3 text-sm border-b">
                          {staff.employment_type === 'monthly' && '月給制'}
                          {staff.employment_type === 'hourly' && '時給制'}
                          {staff.employment_type === 'contract' && '業務委託'}
                        </td>
                        <td className="px-4 py-3 text-sm border-b">{staff.hire_date}</td>
                        <td className="px-4 py-3 text-sm border-b">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < parseInt(staff.skill_level) ? 'bg-yellow-400' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm border-b">{staff.max_hours_per_week}時間</td>
                        <td className="px-4 py-3 text-sm border-b">
                          {staff.is_active === 'TRUE' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">在籍</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">退職</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* スタッフ詳細モーダル */}
        <AnimatePresence>
          {selectedStaff && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedStaff(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedStaff.name}</h2>
                    <p className="text-sm text-blue-100">{selectedStaff.staff_code} · {getRoleName(selectedStaff.role_id)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStaff(null)}
                    className="text-white hover:bg-blue-800"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="p-6 space-y-6">
                  {/* 基本情報 */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      基本情報
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">フリガナ</div>
                        <div className="font-medium">{selectedStaff.name_kana}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">雇用形態</div>
                        <div className="font-medium">
                          {selectedStaff.employment_type === 'monthly' && '月給制'}
                          {selectedStaff.employment_type === 'hourly' && '時給制'}
                          {selectedStaff.employment_type === 'contract' && '業務委託'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">入社日</div>
                        <div className="font-medium">{selectedStaff.hire_date}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">メールアドレス</div>
                        <div className="font-medium text-blue-600">{selectedStaff.email}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">電話番号</div>
                        <div className="font-medium">{selectedStaff.phone_number}</div>
                      </div>
                    </div>
                  </div>

                  {/* 給与情報 */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      給与情報
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedStaff.employment_type === 'monthly' && (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4">
                            <div className="text-sm text-green-700 mb-1">月給</div>
                            <div className="text-2xl font-bold text-green-800">
                              ¥{parseInt(selectedStaff.monthly_salary || 0).toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {selectedStaff.employment_type === 'hourly' && (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4">
                            <div className="text-sm text-green-700 mb-1">時給</div>
                            <div className="text-2xl font-bold text-green-800">
                              ¥{parseInt(selectedStaff.hourly_rate || 0).toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {selectedStaff.employment_type === 'contract' && (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4">
                            <div className="text-sm text-green-700 mb-1">契約料</div>
                            <div className="text-2xl font-bold text-green-800">
                              ¥{parseInt(selectedStaff.contract_fee || 0).toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="text-sm text-blue-700 mb-1">日当換算</div>
                          <div className="text-2xl font-bold text-blue-800">
                            ¥{parseInt(selectedStaff.daily_cost || 0).toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* 労働時間制限 */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      労働時間制限
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="border-2">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-gray-600 mb-1">週最大時間</div>
                          <div className="text-3xl font-bold text-purple-600">{selectedStaff.max_hours_per_week}h</div>
                        </CardContent>
                      </Card>
                      <Card className="border-2">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-gray-600 mb-1">週最小時間</div>
                          <div className="text-3xl font-bold text-gray-600">{selectedStaff.min_hours_per_week}h</div>
                        </CardContent>
                      </Card>
                      <Card className="border-2">
                        <CardContent className="p-4 text-center">
                          <div className="text-sm text-gray-600 mb-1">最大連続勤務</div>
                          <div className="text-3xl font-bold text-orange-600">{selectedStaff.max_consecutive_days}日</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* スキル情報 */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      スキル情報
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">スキルレベル:</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${
                              i < parseInt(selectedStaff.skill_level) ? 'bg-yellow-400' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-lg">{selectedStaff.skill_level}/5</span>
                    </div>
                  </div>

                  {/* 全期間実績 */}
                  {staffPerformance[selectedStaff.name] && (
                    <div>
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        労働実績（2023年11月〜2024年10月）
                      </h3>

                      {/* サマリー */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-blue-700 mb-1">総勤務日数</div>
                            <div className="text-3xl font-bold text-blue-800">
                              {staffPerformance[selectedStaff.name].totalDays}日
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              平日{staffPerformance[selectedStaff.name].weekdayDays}日 / 土日{staffPerformance[selectedStaff.name].weekendDays}日
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-purple-50 border-purple-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-purple-700 mb-1">総労働時間</div>
                            <div className="text-3xl font-bold text-purple-800">
                              {staffPerformance[selectedStaff.name].totalHours.toFixed(1)}h
                            </div>
                            <div className="text-xs text-purple-600 mt-1">
                              平均 {(staffPerformance[selectedStaff.name].totalHours / staffPerformance[selectedStaff.name].totalDays).toFixed(1)}h/日
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-green-700 mb-1">総給与</div>
                            <div className="text-2xl font-bold text-green-800">
                              ¥{Math.round(staffPerformance[selectedStaff.name].totalWage).toLocaleString()}
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              平均 ¥{Math.round(staffPerformance[selectedStaff.name].totalWage / staffPerformance[selectedStaff.name].totalDays).toLocaleString()}/日
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* 詳細実績 */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Card className="border-2">
                          <CardContent className="p-4">
                            <div className="text-sm text-gray-600 mb-2">シフト内訳</div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>早番（午前開始）:</span>
                                <span className="font-bold text-orange-600">{staffPerformance[selectedStaff.name].earlyShifts}回</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>遅番（午後開始）:</span>
                                <span className="font-bold text-blue-600">{staffPerformance[selectedStaff.name].lateShifts}回</span>
                              </div>
                              {staffPerformance[selectedStaff.name].modifiedCount > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span>変更されたシフト:</span>
                                  <span className="font-bold text-yellow-600">{staffPerformance[selectedStaff.name].modifiedCount}回</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-2">
                          <CardContent className="p-4">
                            <div className="text-sm text-gray-600 mb-2">労働時間分析</div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>週平均時間:</span>
                                <span className="font-bold">{(staffPerformance[selectedStaff.name].totalHours / 4.3).toFixed(1)}h</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>1日平均時間:</span>
                                <span className="font-bold">{(staffPerformance[selectedStaff.name].totalHours / staffPerformance[selectedStaff.name].totalDays).toFixed(1)}h</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>時給換算:</span>
                                <span className="font-bold">¥{Math.round(staffPerformance[selectedStaff.name].totalWage / staffPerformance[selectedStaff.name].totalHours).toLocaleString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* 月別実績サマリー */}
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">月別実績</h4>
                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">年月</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">勤務日数</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">総時間</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">給与</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {Object.entries(staffPerformance[selectedStaff.name].monthlyStats)
                                .sort((a, b) => a[0].localeCompare(b[0]))
                                .map(([monthKey, stats]) => (
                                  <tr key={monthKey} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium">{monthKey}</td>
                                    <td className="px-3 py-2 text-right">{stats.days}日</td>
                                    <td className="px-3 py-2 text-right">{stats.hours.toFixed(1)}h</td>
                                    <td className="px-3 py-2 text-right font-medium text-green-700">
                                      ¥{Math.round(stats.wage).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* シフト詳細リスト（最新100件） */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2">最近のシフト詳細（最新100件）</h4>
                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">日付</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">曜日</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">時間</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">勤務時間</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">給与</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {staffPerformance[selectedStaff.name].shifts
                                .sort((a, b) => {
                                  // 年月日でソート（降順 - 新しい順）
                                  const dateA = `${a.year}-${String(a.month).padStart(2, '0')}-${String(a.date).padStart(2, '0')}`
                                  const dateB = `${b.year}-${String(b.month).padStart(2, '0')}-${String(b.date).padStart(2, '0')}`
                                  return dateB.localeCompare(dateA)
                                })
                                .map((shift, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-3 py-2">{shift.year}/{shift.month}/{shift.date}</td>
                                    <td className="px-3 py-2">
                                      <span className={`${
                                        shift.dayOfWeek === '土' || shift.dayOfWeek === '日'
                                          ? 'text-blue-600 font-semibold'
                                          : 'text-gray-600'
                                      }`}>
                                        {shift.dayOfWeek}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-700">{shift.startTime} - {shift.endTime}</td>
                                    <td className="px-3 py-2 text-right font-medium">{shift.hours}h</td>
                                    <td className="px-3 py-2 text-right font-medium text-green-700">
                                      ¥{Math.round(shift.wage).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default StaffManagement
