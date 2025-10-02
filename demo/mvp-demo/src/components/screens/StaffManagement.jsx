import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Users, X, DollarSign, Clock, TrendingUp, Calendar, Award, FileText, Edit3 } from 'lucide-react'
import Papa from 'papaparse'
import { validateStaffCSV } from '../../utils/csvHelper'
import { calculatePayslip } from '../../utils/salaryCalculator'
import { getStaffWorkHistory, getStaffPayrollHistory } from '../../utils/indexedDB'
import CSVActions from '../shared/CSVActions'

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([])
  const [roles, setRoles] = useState([])
  const [employmentTypes, setEmploymentTypes] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [staffPerformance, setStaffPerformance] = useState({})
  const [insuranceRates, setInsuranceRates] = useState([])
  const [taxBrackets, setTaxBrackets] = useState([])
  const [commuteAllowances, setCommuteAllowances] = useState([])
  const [payslips, setPayslips] = useState({})
  const [showMasters, setShowMasters] = useState(false)

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

      // Load employment_types.csv
      const employmentTypesResponse = await fetch('/data/master/employment_types.csv')
      const employmentTypesText = await employmentTypesResponse.text()
      const employmentTypesParsed = Papa.parse(employmentTypesText, { header: true, skipEmptyLines: true })

      // Load skills.csv
      const skillsResponse = await fetch('/data/master/skills.csv')
      const skillsText = await skillsResponse.text()
      const skillsParsed = Papa.parse(skillsText, { header: true, skipEmptyLines: true })

      // Load insurance_rates.csv
      const insuranceRatesResponse = await fetch('/data/master/insurance_rates.csv')
      const insuranceRatesText = await insuranceRatesResponse.text()
      const insuranceRatesParsed = Papa.parse(insuranceRatesText, { header: true, skipEmptyLines: true })

      // Load tax_brackets.csv
      const taxBracketsResponse = await fetch('/data/master/tax_brackets.csv')
      const taxBracketsText = await taxBracketsResponse.text()
      const taxBracketsParsed = Papa.parse(taxBracketsText, { header: true, skipEmptyLines: true })

      // Load commute_allowance.csv
      const commuteAllowancesResponse = await fetch('/data/master/commute_allowance.csv')
      const commuteAllowancesText = await commuteAllowancesResponse.text()
      const commuteAllowancesParsed = Papa.parse(commuteAllowancesText, { header: true, skipEmptyLines: true })

      // Load shift_history_2023-2024.csv for performance data (全期間シフト履歴)
      const shiftsResponse = await fetch('/data/history/shift_history_2023-2024.csv')
      const shiftsText = await shiftsResponse.text()
      const shiftsParsed = Papa.parse(shiftsText, { header: true, skipEmptyLines: true })

      // スタッフ別シフト履歴を集計
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

      // IndexedDBから2024年実績データを取得して追加
      const { openDB } = await import('../../utils/indexedDB')
      await openDB()

      // 各スタッフの実績データをIndexedDBから取得
      for (const staff of staffParsed.data) {
        try {
          const workHistory = await getStaffWorkHistory(staff.staff_id)
          const payrollHistory = await getStaffPayrollHistory(staff.staff_id)

          if (workHistory.length > 0 || payrollHistory.length > 0) {
            // 実績データがある場合はperformanceMapに追加情報として保存
            if (!performanceMap[staff.name]) {
              performanceMap[staff.name] = {
                totalDays: 0,
                totalHours: 0,
                totalWage: 0,
                weekdayDays: 0,
                weekendDays: 0,
                earlyShifts: 0,
                lateShifts: 0,
                modifiedCount: 0,
                shifts: [],
                monthlyStats: {}
              }
            }

            performanceMap[staff.name].actualData = {
              workHistory,
              payrollHistory
            }
          }
        } catch (err) {
          console.log(`実績データ取得エラー (${staff.name}):`, err)
        }
      }

      setStaffList(staffParsed.data)
      setRoles(rolesParsed.data)
      setEmploymentTypes(employmentTypesParsed.data)
      setSkills(skillsParsed.data)
      setStaffPerformance(performanceMap)
      setInsuranceRates(insuranceRatesParsed.data)
      setTaxBrackets(taxBracketsParsed.data)
      setCommuteAllowances(commuteAllowancesParsed.data)

      // 給与明細を計算
      const payslipMap = {}
      staffParsed.data.forEach(staff => {
        if (performanceMap[staff.name]) {
          payslipMap[staff.name] = calculatePayslip(
            staff,
            performanceMap[staff.name],
            {
              insuranceRates: insuranceRatesParsed.data,
              taxBrackets: taxBracketsParsed.data,
              commuteAllowances: commuteAllowancesParsed.data
            }
          )
        }
      })
      setPayslips(payslipMap)
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

  const getEmploymentTypeName = (employmentType) => {
    // employment_typeは文字列（monthly, hourly, contract）
    const typeMap = {
      monthly: '正社員',
      hourly: 'アルバイト・パート',
      contract: '業務委託'
    }
    return typeMap[employmentType] || employmentType
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

  // スタッフ詳細画面
  if (selectedStaff) {
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
                <div>
                  <CardTitle className="text-2xl mb-2">{selectedStaff.name}</CardTitle>
                  <p className="text-sm text-blue-100">{selectedStaff.staff_code} · {getRoleName(selectedStaff.role_id)}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedStaff(null)}
                  className="bg-white text-blue-700 hover:bg-gray-100"
                >
                  <X className="h-4 w-4 mr-2" />
                  戻る
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
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
                      {getEmploymentTypeName(selectedStaff.employment_type)}
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
              {staffPerformance[selectedStaff.name] && (() => {
                // 総給与の計算: 正社員・業務委託は固定給×月数、時給制のみ実績ベース
                const monthCount = Object.keys(staffPerformance[selectedStaff.name].monthlyStats).length
                let totalWage = 0
                let avgDailyWage = 0

                if (selectedStaff.employment_type === 'monthly') {
                  totalWage = parseInt(selectedStaff.monthly_salary || 0) * monthCount
                  avgDailyWage = Math.round(totalWage / staffPerformance[selectedStaff.name].totalDays)
                } else if (selectedStaff.employment_type === 'contract') {
                  totalWage = parseInt(selectedStaff.contract_fee || 0) * monthCount
                  avgDailyWage = Math.round(totalWage / staffPerformance[selectedStaff.name].totalDays)
                } else if (selectedStaff.employment_type === 'hourly') {
                  totalWage = Math.round(staffPerformance[selectedStaff.name].totalHours * parseInt(selectedStaff.hourly_rate || 0))
                  avgDailyWage = Math.round(totalWage / staffPerformance[selectedStaff.name].totalDays)
                }

                return (
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
                            ¥{totalWage.toLocaleString()}
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            {selectedStaff.employment_type === 'hourly' ? '平均 ' : ''}
                            ¥{avgDailyWage.toLocaleString()}/日
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
                        <div className="text-sm text-gray-600 mb-2">給与情報</div>
                        <div className="space-y-2">
                          {selectedStaff.employment_type === 'monthly' && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span>月給:</span>
                                <span className="font-bold">¥{parseInt(selectedStaff.monthly_salary || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>平均時給換算:</span>
                                <span className="font-bold">¥{Math.round(parseInt(selectedStaff.monthly_salary || 0) / 160).toLocaleString()}</span>
                              </div>
                            </>
                          )}
                          {selectedStaff.employment_type === 'contract' && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span>業務委託料:</span>
                                <span className="font-bold">¥{parseInt(selectedStaff.contract_fee || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>平均時給換算:</span>
                                <span className="font-bold">¥{Math.round(parseInt(selectedStaff.contract_fee || 0) / 160).toLocaleString()}</span>
                              </div>
                            </>
                          )}
                          {selectedStaff.employment_type === 'hourly' && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span>時給:</span>
                                <span className="font-bold">¥{parseInt(selectedStaff.hourly_rate || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>平均月収:</span>
                                <span className="font-bold">¥{Math.round(totalWage / monthCount).toLocaleString()}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between text-sm">
                            <span>週平均時間:</span>
                            <span className="font-bold">{(staffPerformance[selectedStaff.name].totalHours / monthCount / 4.3).toFixed(1)}h</span>
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
                            .map(([monthKey, stats]) => {
                              // 給与計算: 正社員・業務委託は固定給、時給制のみ実績ベース
                              let monthlySalary = 0
                              if (selectedStaff.employment_type === 'monthly') {
                                monthlySalary = parseInt(selectedStaff.monthly_salary || 0)
                              } else if (selectedStaff.employment_type === 'contract') {
                                monthlySalary = parseInt(selectedStaff.contract_fee || 0)
                              } else if (selectedStaff.employment_type === 'hourly') {
                                monthlySalary = Math.round(stats.hours * parseInt(selectedStaff.hourly_rate || 0))
                              }

                              return (
                                <tr key={monthKey} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 font-medium">{monthKey}</td>
                                  <td className="px-3 py-2 text-right">{stats.days}日</td>
                                  <td className="px-3 py-2 text-right">{stats.hours.toFixed(1)}h</td>
                                  <td className="px-3 py-2 text-right font-medium text-green-700">
                                    ¥{monthlySalary.toLocaleString()}
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 給与明細（2023年11月〜2024年10月） */}
                  {payslips[selectedStaff.name] && (
                    <div>
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        給与明細（2023年11月〜2024年10月）
                      </h3>
                      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-2 gap-6">
                            {/* 支給 */}
                            <div>
                              <h4 className="font-bold text-green-800 mb-3 border-b-2 border-green-300 pb-2">支給</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-700">
                                    {selectedStaff.employment_type === 'monthly' && '月給'}
                                    {selectedStaff.employment_type === 'hourly' && '時給×時間'}
                                    {selectedStaff.employment_type === 'contract' && '業務委託料'}
                                  </span>
                                  <span className="font-bold">¥{payslips[selectedStaff.name].grossSalary.toLocaleString()}</span>
                                </div>
                                {selectedStaff.employment_type === 'hourly' && (
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>（¥{selectedStaff.hourly_rate} × {payslips[selectedStaff.name].workHours.toFixed(1)}h）</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-700">
                                    交通費
                                    {(selectedStaff.employment_type === 'monthly' || selectedStaff.employment_type === 'contract') && '（定額）'}
                                    {selectedStaff.employment_type === 'hourly' && `（${payslips[selectedStaff.name].workDays}日分）`}
                                  </span>
                                  <span className="font-bold">¥{payslips[selectedStaff.name].commuteAllowance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-base border-t pt-2 mt-2">
                                  <span className="font-bold text-green-800">総支給額</span>
                                  <span className="font-bold text-green-800 text-lg">¥{payslips[selectedStaff.name].totalGross.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            {/* 控除 */}
                            <div>
                              <h4 className="font-bold text-red-800 mb-3 border-b-2 border-red-300 pb-2">控除</h4>
                              <div className="space-y-2">
                                {payslips[selectedStaff.name].socialInsurance.healthInsurance > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">健康保険</span>
                                    <span className="font-medium text-red-700">¥{payslips[selectedStaff.name].socialInsurance.healthInsurance.toLocaleString()}</span>
                                  </div>
                                )}
                                {payslips[selectedStaff.name].socialInsurance.pension > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">厚生年金</span>
                                    <span className="font-medium text-red-700">¥{payslips[selectedStaff.name].socialInsurance.pension.toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-700">雇用保険</span>
                                  <span className="font-medium text-red-700">¥{payslips[selectedStaff.name].socialInsurance.employmentInsurance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-700">所得税</span>
                                  <span className="font-medium text-red-700">¥{payslips[selectedStaff.name].incomeTax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-700">住民税</span>
                                  <span className="font-medium text-red-700">¥{payslips[selectedStaff.name].residentTax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-base border-t pt-2 mt-2">
                                  <span className="font-bold text-red-800">控除合計</span>
                                  <span className="font-bold text-red-800">¥{payslips[selectedStaff.name].totalDeductions.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 差引支給額 */}
                          <div className="mt-6 pt-4 border-t-2 border-blue-300">
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-bold text-blue-900">差引支給額</span>
                              <span className="text-3xl font-bold text-blue-900">¥{payslips[selectedStaff.name].netSalary.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* 勤務情報 */}
                          <div className="mt-4 pt-4 border-t border-gray-300 grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>勤務日数: <span className="font-bold">{payslips[selectedStaff.name].workDays}日</span></div>
                            <div>勤務時間: <span className="font-bold">{payslips[selectedStaff.name].workHours.toFixed(1)}時間</span></div>
                            <div>通勤距離: <span className="font-bold">{selectedStaff.commute_distance_km}km</span></div>
                            <div>社会保険: <span className="font-bold">{selectedStaff.has_social_insurance === 'TRUE' ? '加入' : '未加入'}</span></div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

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
              )
            })()}
            </CardContent>
          </Card>
        </motion.div>
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
                  onClick={() => setShowMasters(!showMasters)}
                  className="bg-white text-blue-700 hover:bg-gray-100"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  マスター編集
                </Button>
                <CSVActions
                  data={staffList}
                  filename="staff"
                  onImport={setStaffList}
                  validateFunction={validateStaffCSV}
                  importConfirmMessage="既存のスタッフデータを上書きします。よろしいですか？"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {showMasters ? (
              /* マスター編集セクション */
              <>
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* 雇用形態一覧 */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-purple-600 rounded"></div>
                    雇用形態マスタ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {employmentTypes.map((type) => (
                      <Card key={type.employment_type_id} className="border-2 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="font-bold text-lg mb-1">{type.employment_name}</div>
                          <div className="text-sm text-gray-600">{type.employment_code}</div>
                          <div className="text-xs text-gray-500 mt-2">
                            {type.payment_type === 'monthly' && '月給制'}
                            {type.payment_type === 'hourly' && '時給制'}
                            {type.payment_type === 'contract' && '委託契約'}
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
              </>
            ) : (
              /* スタッフ一覧テーブル */
              <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-orange-600 rounded"></div>
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
                          {getEmploymentTypeName(staff.employment_type)}
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
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default StaffManagement
