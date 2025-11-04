import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  Users,
  X,
  DollarSign,
  Clock,
  TrendingUp,
  Calendar,
  Award,
  FileText,
  Edit3,
  Database,
  Store,
  Filter,
} from 'lucide-react'
import { validateStaffCSV } from '../../utils/csvHelper'
import { calculatePayslip } from '../../utils/salaryCalculator'
import { getStaffWorkHistory, getStaffPayrollHistory } from '../../utils/indexedDB'
import CSVActions from '../shared/CSVActions'
import { CSVRepository } from '../../infrastructure/repositories/CSVRepository'
import { MasterRepository } from '../../infrastructure/repositories/MasterRepository'
import { BACKEND_API_URL, API_ENDPOINTS } from '../../config/api'
import { useTenant } from '../../contexts/TenantContext'

const csvRepository = new CSVRepository()
const masterRepository = new MasterRepository()

const StaffManagement = ({
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
  const [shiftPatterns, setShiftPatterns] = useState([])
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'inactive'

  useEffect(() => {
    loadData()
  }, [tenantId])

  const loadData = async () => {
    setLoading(true)
    try {
      // MasterRepositoryを使用してテナント別データを取得
      const [
        staffData,
        rolesData,
        employmentTypesData,
        skillsData,
        insuranceRatesData,
        taxBracketsData,
        commuteAllowancesData,
        shiftPatternsData,
        storesData
      ] = await Promise.all([
        masterRepository.getStaff(tenantId),
        masterRepository.getRoles(tenantId),
        masterRepository.getEmploymentTypes(tenantId),
        masterRepository.getSkills(tenantId),
        masterRepository.getInsuranceRates(tenantId),
        masterRepository.getTaxBrackets(tenantId),
        masterRepository.getCommuteAllowance(tenantId),
        masterRepository.getShiftPatterns(tenantId),
        masterRepository.getStores(tenantId)
      ])

      // データを旧形式に合わせる（Papa.parseの戻り値形式）
      const staffParsed = { data: staffData }
      const rolesParsed = { data: rolesData }
      const employmentTypesParsed = { data: employmentTypesData }
      const skillsParsed = { data: skillsData }
      const insuranceRatesParsed = { data: insuranceRatesData }
      const taxBracketsParsed = { data: taxBracketsData }
      const commuteAllowancesParsed = { data: commuteAllowancesData }
      const shiftPatternsParsed = { data: shiftPatternsData }

      // 時刻からシフトパターンを推測する関数
      const inferPatternCode = (startTime, endTime, patterns) => {
        // 完全一致を探す
        const exactMatch = patterns.find(p => p.start_time === startTime && p.end_time === endTime)
        if (exactMatch) return exactMatch.pattern_code

        // 開始時刻をベースに推測
        const startHour = parseInt(startTime.split(':')[0])
        const endHour = parseInt(endTime.split(':')[0])

        // 09:00-10:00頃開始
        if (startHour >= 9 && startHour <= 10) {
          // 終了が13:00以前なら SHORT_AM、それ以外は EARLY
          if (endHour <= 13) {
            return 'SHORT_AM'
          } else if (endHour >= 22) {
            return 'FULL'
          } else {
            return 'EARLY'
          }
        }

        // 13:00-14:00頃開始
        if (startHour >= 13 && startHour <= 14) {
          // 終了が18:00以前なら SHORT_PM、それ以外は MID
          if (endHour <= 18) {
            return 'SHORT_PM'
          } else {
            return 'MID'
          }
        }

        // 17:00頃開始
        if (startHour >= 17 && startHour <= 18) {
          return 'LATE'
        }

        // 11:00-12:00頃開始（中間的な時間帯）
        if (startHour >= 11 && startHour <= 12) {
          if (endHour >= 20) {
            return 'MID'
          } else {
            return 'EARLY'
          }
        }

        return 'その他'
      }

      // バックエンドAPIから実績データを取得して集計
      const performanceMap = {}

      // 全スタッフの給与データを一括取得
      const payrollResponse = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.ANALYTICS_PAYROLL}?tenant_id=${tenantId}`);
      const payrollData = await payrollResponse.json();
      const allPayroll = payrollData.success ? payrollData.data : [];

      // スタッフIDごとにグループ化
      const payrollByStaff = {};
      allPayroll.forEach(p => {
        if (!payrollByStaff[p.staff_id]) {
          payrollByStaff[p.staff_id] = [];
        }
        payrollByStaff[p.staff_id].push(p);
      });

      // 各スタッフの実績データをバックエンドAPIから取得して集計
      for (const staff of staffParsed.data) {
        try {
          const payrollHistory = payrollByStaff[staff.staff_id] || [];
          const workHistory = []; // 労働時間実績は現在未使用

          // 実績データがある場合のみperformanceMapに登録（給与データのみでもOK）
          if (payrollHistory.length > 0) {
            performanceMap[staff.name] = {
              totalDays: 0,
              totalHours: 0,
              totalWage: 0,
              weekdayDays: 0,
              weekendDays: 0,
              shiftPatterns: {},
              modifiedCount: 0,
              shifts: [],
              monthlyStats: {},
            }

            const perf = performanceMap[staff.name]

            // 給与データから実績を集計
            payrollHistory.forEach(payroll => {
              const days = parseInt(payroll.work_days || 0)
              const hours = parseFloat(payroll.work_hours || 0)
              const wage = parseFloat(payroll.gross_salary || 0)

              perf.totalDays += days
              perf.totalHours += hours
              perf.totalWage += wage

              // 月別統計
              const monthKey = `${payroll.year}-${String(payroll.month).padStart(2, '0')}`
              if (!perf.monthlyStats[monthKey]) {
                perf.monthlyStats[monthKey] = {
                  days: 0,
                  hours: 0,
                  wage: 0,
                }
              }
              perf.monthlyStats[monthKey].days += days
              perf.monthlyStats[monthKey].hours += hours
              perf.monthlyStats[monthKey].wage += wage
            })
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
      setShiftPatterns(shiftPatternsParsed.data)
      setStores(storesData)

      // 給与明細を計算
      const payslipMap = {}
      staffParsed.data.forEach(staff => {
        if (performanceMap[staff.name]) {
          payslipMap[staff.name] = calculatePayslip(staff, performanceMap[staff.name], {
            insuranceRates: insuranceRatesParsed.data,
            taxBrackets: taxBracketsParsed.data,
            commuteAllowances: commuteAllowancesParsed.data,
          })
        }
      })
      setPayslips(payslipMap)
    } catch (error) {
      console.error('データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleName = roleId => {
    const role = roles.find(r => r.role_id === roleId)
    return role ? role.role_name : roleId
  }

  const getEmploymentTypeName = employmentType => {
    // employment_typeは文字列（FULL_TIME, PART_TIME, CONTRACT）
    const typeMap = {
      FULL_TIME: '正社員',
      PART_TIME: 'アルバイト・パート',
      CONTRACT: '業務委託',
      // 旧形式との互換性
      monthly: '正社員',
      hourly: 'アルバイト・パート',
      contract: '業務委託',
    }
    return typeMap[employmentType] || employmentType
  }

  // 店舗フィルタリング + 在籍状況フィルタリング
  const filteredStaffList = staffList.filter(staff => {
    // 店舗フィルター
    const storeMatch = selectedStore === 'all' || staff.store_id === parseInt(selectedStore)

    // 在籍状況フィルター
    let statusMatch = true
    if (statusFilter === 'active') {
      statusMatch = staff.is_active === true
    } else if (statusFilter === 'inactive') {
      statusMatch = staff.is_active === false
    }

    return storeMatch && statusMatch
  })

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
                  <p className="text-sm text-blue-100">
                    {selectedStaff.staff_code} · {getRoleName(selectedStaff.role_id)}
                  </p>
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
                  <div>
                    <div className="text-gray-600">給与</div>
                    <div className="font-bold text-green-700">
                      {(selectedStaff.employment_type === 'monthly' || selectedStaff.employment_type === 'FULL_TIME') &&
                        `¥${parseInt(selectedStaff.monthly_salary || 0).toLocaleString()} / 月`}
                      {(selectedStaff.employment_type === 'hourly' || selectedStaff.employment_type === 'PART_TIME') &&
                        `¥${parseInt(selectedStaff.hourly_rate || 0).toLocaleString()} / 時間`}
                      {selectedStaff.employment_type === 'contract' &&
                        `¥${parseInt(selectedStaff.contract_fee || 0).toLocaleString()} / 月`}
                    </div>
                  </div>
                </div>
              </div>

              {/* スキル情報 */}
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  保有スキル
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => {
                    const hasSkill =
                      selectedStaff.skill_ids?.includes(skill.skill_id) || Math.random() > 0.5
                    return (
                      <div
                        key={skill.skill_id}
                        className={`px-3 py-1 rounded-full text-sm ${
                          hasSkill
                            ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                            : 'bg-gray-100 text-gray-400 border border-gray-300'
                        }`}
                      >
                        {hasSkill && '✓ '}
                        {skill.skill_name}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 福利厚生・その他情報 */}
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  福利厚生・その他情報
                </h3>
                <Card className="border-2 border-indigo-200 bg-indigo-50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">社会保険</div>
                        <div
                          className={`font-bold text-lg ${selectedStaff.has_social_insurance ? 'text-green-700' : 'text-gray-500'}`}
                        >
                          {selectedStaff.has_social_insurance ? '✓ 加入' : '未加入'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">通勤距離</div>
                        <div className="font-bold text-lg text-gray-800">
                          {selectedStaff.commute_distance_km || 0}km
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">交通費支給額</div>
                        <div className="font-bold text-lg text-blue-700">
                          ¥
                          {(
                            (parseInt(selectedStaff.commute_distance_km) || 0) *
                            20 *
                            20
                          ).toLocaleString()}
                          /月
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          往復{(parseInt(selectedStaff.commute_distance_km) || 0) * 2}km × 20円/km ×
                          20日
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 実績データ */}
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  実績（2024年）
                </h3>

                {staffPerformance[selectedStaff.name] ? (
                  (() => {
                    // 総給与の計算: 正社員・業務委託は固定給×月数、時給制のみ実績ベース
                    const monthCount = Object.keys(
                      staffPerformance[selectedStaff.name].monthlyStats
                    ).length
                    let totalWage = 0
                    let avgDailyWage = 0

                    if (selectedStaff.employment_type === 'monthly' || selectedStaff.employment_type === 'FULL_TIME') {
                      totalWage = parseInt(selectedStaff.monthly_salary || 0) * monthCount
                      avgDailyWage = Math.round(
                        totalWage / staffPerformance[selectedStaff.name].totalDays
                      )
                    } else if (selectedStaff.employment_type === 'contract') {
                      totalWage = parseInt(selectedStaff.contract_fee || 0) * monthCount
                      avgDailyWage = Math.round(
                        totalWage / staffPerformance[selectedStaff.name].totalDays
                      )
                    } else if (selectedStaff.employment_type === 'hourly' || selectedStaff.employment_type === 'PART_TIME') {
                      totalWage = Math.round(
                        staffPerformance[selectedStaff.name].totalHours *
                          parseInt(selectedStaff.hourly_rate || 0)
                      )
                      avgDailyWage = Math.round(
                        totalWage / staffPerformance[selectedStaff.name].totalDays
                      )
                    }

                    return (
                      <div>
                        {/* サマリー（実績） */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4 text-center">
                              <div className="text-sm text-blue-700 mb-1">総勤務日数</div>
                              <div className="text-3xl font-bold text-blue-800">
                                {staffPerformance[selectedStaff.name].totalDays}日
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                平日{staffPerformance[selectedStaff.name].weekdayDays}日 / 土日
                                {staffPerformance[selectedStaff.name].weekendDays}日
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
                                平均{' '}
                                {(
                                  staffPerformance[selectedStaff.name].totalHours /
                                  staffPerformance[selectedStaff.name].totalDays
                                ).toFixed(1)}
                                h/日
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
                                {selectedStaff.employment_type === 'hourly' ? '平均 ' : ''}¥
                                {avgDailyWage.toLocaleString()}/日
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* 詳細実績 */}
                        <div className="mb-4">
                          <Card className="border-2">
                            <CardContent className="p-4">
                              <div className="text-sm text-gray-600 mb-2">シフト内訳</div>
                              <div className="space-y-2">
                                {Object.entries(
                                  staffPerformance[selectedStaff.name].shiftPatterns || {}
                                )
                                  .sort((a, b) => b[1] - a[1]) // 回数の多い順
                                  .map(([patternCode, count]) => {
                                    const pattern = shiftPatterns.find(
                                      p => p.pattern_code === patternCode
                                    )
                                    const patternName = pattern ? pattern.pattern_name : patternCode
                                    const colors = [
                                      'text-blue-600',
                                      'text-orange-600',
                                      'text-purple-600',
                                      'text-green-600',
                                      'text-indigo-600',
                                      'text-pink-600',
                                    ]
                                    const colorIndex = Object.keys(
                                      staffPerformance[selectedStaff.name].shiftPatterns
                                    ).indexOf(patternCode)

                                    return (
                                      <div
                                        key={patternCode}
                                        className="flex justify-between text-sm"
                                      >
                                        <span>{patternName}:</span>
                                        <span
                                          className={`font-bold ${colors[colorIndex % colors.length]}`}
                                        >
                                          {count}回
                                        </span>
                                      </div>
                                    )
                                  })}
                                {staffPerformance[selectedStaff.name].modifiedCount > 0 && (
                                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                    <span>シフト変更回数:</span>
                                    <span className="font-bold text-yellow-600">
                                      {staffPerformance[selectedStaff.name].modifiedCount}回
                                    </span>
                                  </div>
                                )}
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
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                    年月
                                  </th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                                    勤務日数
                                  </th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                                    総時間
                                  </th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                                    給与
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {Object.entries(staffPerformance[selectedStaff.name].monthlyStats)
                                  .filter(([monthKey]) => monthKey.startsWith('2024'))
                                  .sort((a, b) => a[0].localeCompare(b[0]))
                                  .map(([monthKey, stats]) => {
                                    // 給与計算: 正社員・業務委託は固定給、時給制のみ実績ベース
                                    let monthlySalary = 0
                                    if (selectedStaff.employment_type === 'monthly' || selectedStaff.employment_type === 'FULL_TIME') {
                                      monthlySalary = parseInt(selectedStaff.monthly_salary || 0)
                                    } else if (selectedStaff.employment_type === 'contract') {
                                      monthlySalary = parseInt(selectedStaff.contract_fee || 0)
                                    } else if (selectedStaff.employment_type === 'hourly' || selectedStaff.employment_type === 'PART_TIME') {
                                      monthlySalary = Math.round(
                                        stats.hours * parseInt(selectedStaff.hourly_rate || 0)
                                      )
                                    }

                                    return (
                                      <tr key={monthKey} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-medium">{monthKey}</td>
                                        <td className="px-3 py-2 text-right">{stats.days}日</td>
                                        <td className="px-3 py-2 text-right">
                                          {stats.hours.toFixed(1)}h
                                        </td>
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

                        {/* 年間予測 */}
                        {(() => {
                          // 2024年のデータのみを集計
                          const year2024Months = Object.keys(
                            staffPerformance[selectedStaff.name].monthlyStats
                          ).filter(key => key.startsWith('2024'))
                          const monthsWorked2024 = year2024Months.length
                          const remainingMonths = 12 - monthsWorked2024

                          // 2024年の実績を集計
                          let totalDays2024 = 0
                          let totalHours2024 = 0
                          let totalWage2024 = 0

                          year2024Months.forEach(monthKey => {
                            const stats =
                              staffPerformance[selectedStaff.name].monthlyStats[monthKey]
                            totalDays2024 += stats.days
                            totalHours2024 += stats.hours

                            // 給与計算
                            if (selectedStaff.employment_type === 'monthly') {
                              totalWage2024 += parseInt(selectedStaff.monthly_salary || 0)
                            } else if (selectedStaff.employment_type === 'contract') {
                              totalWage2024 += parseInt(selectedStaff.contract_fee || 0)
                            } else if (selectedStaff.employment_type === 'hourly') {
                              totalWage2024 += Math.round(
                                stats.hours * parseInt(selectedStaff.hourly_rate || 0)
                              )
                            }
                          })

                          if (remainingMonths > 0 && monthsWorked2024 > 0) {
                            // 月平均を計算
                            const avgDaysPerMonth = totalDays2024 / monthsWorked2024
                            const avgHoursPerMonth = totalHours2024 / monthsWorked2024
                            const avgWagePerMonth = totalWage2024 / monthsWorked2024

                            // 予測残り値
                            const predictedRemainingDays = Math.round(
                              avgDaysPerMonth * remainingMonths
                            )
                            const predictedRemainingHours = avgHoursPerMonth * remainingMonths
                            const predictedRemainingWage = avgWagePerMonth * remainingMonths

                            // 年間予測
                            const predictedAnnualDays = totalDays2024 + predictedRemainingDays
                            const predictedAnnualHours = totalHours2024 + predictedRemainingHours
                            const predictedAnnualWage = totalWage2024 + predictedRemainingWage

                            return (
                              <div className="mb-4">
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                  <TrendingUp className="h-5 w-5 text-purple-600" />
                                  年間予測労働
                                </h3>
                                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                                  <CardContent className="p-4">
                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                      <div className="text-center">
                                        <div className="text-xs text-purple-600 mb-1">月平均</div>
                                        <div className="text-sm font-bold text-purple-800">
                                          {avgDaysPerMonth.toFixed(1)}日/月
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          {avgHoursPerMonth.toFixed(1)}h/月
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-xs text-purple-600 mb-1">
                                          予測残り（{remainingMonths}ヶ月）
                                        </div>
                                        <div className="text-sm font-bold text-purple-800">
                                          +{predictedRemainingDays}日
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          +{predictedRemainingHours.toFixed(1)}h
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-xs text-purple-600 mb-1">年間予測</div>
                                        <div className="text-lg font-bold text-purple-900">
                                          {predictedAnnualDays}日
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          {predictedAnnualHours.toFixed(1)}h
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )
                          }
                          return null
                        })()}

                        {/* 給与明細（予測含む） */}
                        {(() => {
                          // 2024年のデータのみを集計
                          const year2024Months = Object.keys(
                            staffPerformance[selectedStaff.name].monthlyStats
                          ).filter(key => key.startsWith('2024'))
                          const monthsWorked2024 = year2024Months.length
                          const remainingMonths = 12 - monthsWorked2024

                          // 2024年の実績を集計
                          let totalDays2024 = 0
                          let totalHours2024 = 0
                          let totalWage2024 = 0

                          year2024Months.forEach(monthKey => {
                            const stats =
                              staffPerformance[selectedStaff.name].monthlyStats[monthKey]
                            totalDays2024 += stats.days
                            totalHours2024 += stats.hours

                            // 給与計算
                            if (selectedStaff.employment_type === 'monthly') {
                              totalWage2024 += parseInt(selectedStaff.monthly_salary || 0)
                            } else if (selectedStaff.employment_type === 'contract') {
                              totalWage2024 += parseInt(selectedStaff.contract_fee || 0)
                            } else if (selectedStaff.employment_type === 'hourly') {
                              totalWage2024 += Math.round(
                                stats.hours * parseInt(selectedStaff.hourly_rate || 0)
                              )
                            }
                          })

                          // 予測を計算
                          let predictedAnnualDays = totalDays2024
                          let predictedAnnualHours = totalHours2024
                          let predictedAnnualBaseSalary = 0

                          if (remainingMonths > 0 && monthsWorked2024 > 0) {
                            const avgDaysPerMonth = totalDays2024 / monthsWorked2024
                            const avgHoursPerMonth = totalHours2024 / monthsWorked2024

                            predictedAnnualDays =
                              totalDays2024 + Math.round(avgDaysPerMonth * remainingMonths)
                            predictedAnnualHours =
                              totalHours2024 + avgHoursPerMonth * remainingMonths
                          } else {
                            // 残り月がない場合でも年間給与は計算
                            predictedAnnualDays = totalDays2024
                            predictedAnnualHours = totalHours2024
                          }

                          // 年間基本給与を計算（12ヶ月分）
                          if (selectedStaff.employment_type === 'monthly') {
                            predictedAnnualBaseSalary =
                              parseInt(selectedStaff.monthly_salary || 0) * 12
                          } else if (selectedStaff.employment_type === 'contract') {
                            predictedAnnualBaseSalary =
                              parseInt(selectedStaff.contract_fee || 0) * 12
                          } else if (selectedStaff.employment_type === 'hourly') {
                            predictedAnnualBaseSalary = Math.round(
                              predictedAnnualHours * parseInt(selectedStaff.hourly_rate || 0)
                            )
                          }

                          // 交通費を計算（年間）
                          const annualCommuteAllowance =
                            (parseInt(selectedStaff.commute_distance_km) || 0) * 20 * 20 * 12

                          // 総支給額
                          const totalGross = predictedAnnualBaseSalary + annualCommuteAllowance

                          // 年間の控除を計算
                          // 社会保険料（年額）
                          let annualHealthInsurance = 0
                          let annualPension = 0
                          let annualEmploymentInsurance = 0

                          if (
                            selectedStaff.has_social_insurance &&
                            selectedStaff.employment_type !== 'hourly'
                          ) {
                            // 月給制・業務委託の場合
                            const monthlyBaseSalary =
                              selectedStaff.employment_type === 'monthly'
                                ? parseInt(selectedStaff.monthly_salary || 0)
                                : parseInt(selectedStaff.contract_fee || 0)

                            const healthInsuranceRate = insuranceRates.find(
                              r => r.rate_type === 'health_insurance'
                            )
                            const pensionRate = insuranceRates.find(r => r.rate_type === 'pension')
                            const employmentInsuranceRate = insuranceRates.find(
                              r => r.rate_type === 'employment_insurance'
                            )

                            annualHealthInsurance = healthInsuranceRate
                              ? Math.floor(
                                  monthlyBaseSalary *
                                    (parseFloat(healthInsuranceRate.employee_percentage) / 100)
                                ) * 12
                              : 0
                            annualPension = pensionRate
                              ? Math.floor(
                                  monthlyBaseSalary *
                                    (parseFloat(pensionRate.employee_percentage) / 100)
                                ) * 12
                              : 0
                            annualEmploymentInsurance = employmentInsuranceRate
                              ? Math.floor(
                                  monthlyBaseSalary *
                                    (parseFloat(employmentInsuranceRate.employee_percentage) / 100)
                                ) * 12
                              : 0
                          } else {
                            // 時給制または社会保険未加入の場合は雇用保険のみ
                            const employmentInsuranceRate = insuranceRates.find(
                              r => r.rate_type === 'employment_insurance'
                            )
                            annualEmploymentInsurance = employmentInsuranceRate
                              ? Math.floor(
                                  predictedAnnualBaseSalary *
                                    (parseFloat(employmentInsuranceRate.employee_percentage) / 100)
                                )
                              : 0
                          }

                          const totalSocialInsurance =
                            annualHealthInsurance + annualPension + annualEmploymentInsurance

                          // 所得税（年額）
                          // 給与所得控除
                          let employmentIncomeDeduction = 0
                          if (predictedAnnualBaseSalary <= 1625000) {
                            employmentIncomeDeduction = 550000
                          } else if (predictedAnnualBaseSalary <= 1800000) {
                            employmentIncomeDeduction = predictedAnnualBaseSalary * 0.4 - 100000
                          } else if (predictedAnnualBaseSalary <= 3600000) {
                            employmentIncomeDeduction = predictedAnnualBaseSalary * 0.3 + 80000
                          } else if (predictedAnnualBaseSalary <= 6600000) {
                            employmentIncomeDeduction = predictedAnnualBaseSalary * 0.2 + 440000
                          } else if (predictedAnnualBaseSalary <= 8500000) {
                            employmentIncomeDeduction = predictedAnnualBaseSalary * 0.1 + 1100000
                          } else {
                            employmentIncomeDeduction = 1950000
                          }

                          // 基礎控除
                          const basicDeduction = 480000

                          // 課税所得
                          const taxableAmount = Math.max(
                            0,
                            predictedAnnualBaseSalary - employmentIncomeDeduction - basicDeduction
                          )

                          // 税率表から該当する税率を探す
                          const bracket =
                            taxBrackets.find(
                              b => taxableAmount >= b.income_from && taxableAmount <= b.income_to
                            ) || taxBrackets[taxBrackets.length - 1]

                          // 所得税
                          const annualIncomeTax = bracket ? Math.floor(
                            taxableAmount * (parseFloat(bracket.tax_rate) / 100) -
                              parseFloat(bracket.deduction)
                          ) : 0

                          // 住民税（年額：課税所得の10%）
                          const annualResidentTax = Math.floor(predictedAnnualBaseSalary * 0.1)

                          // 控除合計
                          const totalDeductions =
                            totalSocialInsurance + annualIncomeTax + annualResidentTax

                          // 予測年間手取り
                          const annualNetSalary = totalGross - totalDeductions

                          const predictedPayslip = {
                            grossSalary: predictedAnnualBaseSalary,
                            commuteAllowance: annualCommuteAllowance,
                            totalGross: totalGross,
                            socialInsurance: {
                              healthInsurance: annualHealthInsurance,
                              pension: annualPension,
                              employmentInsurance: annualEmploymentInsurance,
                              total: totalSocialInsurance,
                            },
                            incomeTax: annualIncomeTax,
                            residentTax: annualResidentTax,
                            totalDeductions: totalDeductions,
                            netSalary: annualNetSalary,
                            workDays: predictedAnnualDays,
                            workHours: predictedAnnualHours,
                          }

                          return (
                            <div>
                              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-green-600" />
                                給与明細（予測含む）
                              </h3>
                              <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
                                <CardContent className="p-6">
                                  <div className="grid grid-cols-2 gap-6">
                                    {/* 支給 */}
                                    <div>
                                      <h4 className="font-bold text-green-800 mb-3 border-b-2 border-green-300 pb-2">
                                        支給
                                      </h4>
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-700">
                                            {selectedStaff.employment_type === 'monthly' &&
                                              '月給×12ヶ月'}
                                            {selectedStaff.employment_type === 'hourly' &&
                                              '時給×予測時間'}
                                            {selectedStaff.employment_type === 'contract' &&
                                              '業務委託料×12ヶ月'}
                                          </span>
                                          <span className="font-bold">
                                            ¥{predictedAnnualBaseSalary.toLocaleString()}
                                          </span>
                                        </div>
                                        {selectedStaff.employment_type === 'hourly' && (
                                          <div className="flex justify-between text-xs text-gray-500">
                                            <span>
                                              （¥{selectedStaff.hourly_rate} ×{' '}
                                              {predictedAnnualHours.toFixed(1)}h）
                                            </span>
                                          </div>
                                        )}
                                        {(selectedStaff.employment_type === 'monthly' ||
                                          selectedStaff.employment_type === 'contract') && (
                                          <div className="flex justify-between text-xs text-gray-500">
                                            <span>
                                              （¥
                                              {(selectedStaff.employment_type === 'monthly'
                                                ? selectedStaff.monthly_salary
                                                : selectedStaff.contract_fee
                                              ).toLocaleString()}{' '}
                                              × 12ヶ月）
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-700">交通費（年間）</span>
                                          <span className="font-bold">
                                            ¥{annualCommuteAllowance.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                          <span>
                                            （往復
                                            {(parseInt(selectedStaff.commute_distance_km) || 0) * 2}
                                            km × 20円/km × 20日 × 12ヶ月）
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-base border-t pt-2 mt-2">
                                          <span className="font-bold text-green-800">総支給額</span>
                                          <span className="font-bold text-green-800 text-lg">
                                            ¥{totalGross.toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* 控除 */}
                                    <div>
                                      <h4 className="font-bold text-red-800 mb-3 border-b-2 border-red-300 pb-2">
                                        控除
                                      </h4>
                                      <div className="space-y-2">
                                        {predictedPayslip.socialInsurance.healthInsurance > 0 && (
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-700">健康保険</span>
                                            <span className="font-medium text-red-700">
                                              ¥
                                              {predictedPayslip.socialInsurance.healthInsurance.toLocaleString()}
                                            </span>
                                          </div>
                                        )}
                                        {predictedPayslip.socialInsurance.pension > 0 && (
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-700">厚生年金</span>
                                            <span className="font-medium text-red-700">
                                              ¥
                                              {predictedPayslip.socialInsurance.pension.toLocaleString()}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-700">雇用保険</span>
                                          <span className="font-medium text-red-700">
                                            ¥
                                            {predictedPayslip.socialInsurance.employmentInsurance.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-700">所得税</span>
                                          <span className="font-medium text-red-700">
                                            ¥{predictedPayslip.incomeTax.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-700">住民税</span>
                                          <span className="font-medium text-red-700">
                                            ¥{predictedPayslip.residentTax.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-base border-t pt-2 mt-2">
                                          <span className="font-bold text-red-800">控除合計</span>
                                          <span className="font-bold text-red-800">
                                            ¥{predictedPayslip.totalDeductions.toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 差引支給額 */}
                                  <div className="mt-6 pt-4 border-t-2 border-blue-300">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xl font-bold text-blue-900">
                                        予測年間手取り
                                      </span>
                                      <span className="text-3xl font-bold text-blue-900">
                                        ¥{predictedPayslip.netSalary.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* 勤務情報 */}
                                  <div className="mt-4 pt-4 border-t border-gray-300 grid grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                      予測勤務日数:{' '}
                                      <span className="font-bold">
                                        {predictedPayslip.workDays}日
                                      </span>
                                    </div>
                                    <div>
                                      予測勤務時間:{' '}
                                      <span className="font-bold">
                                        {predictedPayslip.workHours.toFixed(1)}時間
                                      </span>
                                    </div>
                                    <div>
                                      通勤距離:{' '}
                                      <span className="font-bold">
                                        {selectedStaff.commute_distance_km}km
                                      </span>
                                    </div>
                                    <div>
                                      社会保険:{' '}
                                      <span className="font-bold">
                                        {selectedStaff.has_social_insurance
                                          ? '加入'
                                          : '未加入'}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })()
                ) : (
                  <Card className="bg-gray-50 border-2 border-gray-300">
                    <CardContent className="p-8 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <Database className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-700 mb-1">
                            実績データが登録されていません
                          </p>
                          <p className="text-sm text-gray-500">
                            実績管理画面から労働時間実績と給与明細をインポートすると、ここに実績データが表示されます
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-8">
      <div className="app-container">
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

            <CardContent className="p-0">
              <div className="p-6">
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
                      {roles.map(role => (
                        <Card
                          key={role.role_id}
                          className="border-2 hover:shadow-md transition-shadow"
                        >
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
                      {employmentTypes.map(type => (
                        <Card
                          key={type.employment_type_id}
                          className="border-2 hover:shadow-md transition-shadow"
                        >
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
                      {skills.map(skill => (
                        <Card
                          key={skill.skill_id}
                          className="border-2 hover:shadow-md transition-shadow"
                        >
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
              ) : null}
              </div>
              {!showMasters && (
                /* スタッフ一覧テーブル */
                <>
                  <div className="px-6 pb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <div className="w-1 h-6 bg-orange-600 rounded"></div>
                      スタッフ一覧 ({filteredStaffList.length}名)
                    </h3>
                    <div className="flex items-center gap-3">
                      <Filter className="h-4 w-4 text-gray-600" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="all">全ての状態</option>
                        <option value="active">在籍のみ</option>
                        <option value="inactive">退職のみ</option>
                      </select>
                      <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="all">全ての店舗</option>
                        {stores.map(store => (
                          <option key={store.store_id} value={store.store_id}>
                            {store.store_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {filteredStaffList.length === 0 ? (
                    <Card className="bg-gray-50 border-2 border-gray-300">
                      <CardContent className="p-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-gray-700 mb-1">
                              {selectedStore === 'all' ? 'スタッフデータがありません' : 'この店舗にスタッフがいません'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {selectedStore === 'all'
                                ? 'CSVインポートボタンからスタッフデータをインポートしてください'
                                : '別の店舗を選択するか、フィルターを「全ての店舗」に変更してください'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <table className="min-w-full bg-white border border-gray-200 table-auto">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                              スタッフコード
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                              氏名
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                              フリガナ
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                              役職
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                              雇用形態
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                              デフォルト店舗
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                              入社日
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                              スキルレベル
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                              週最大時間
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                              状態
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStaffList.map((staff, index) => (
                            <motion.tr
                              key={staff.staff_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-blue-50 transition-colors cursor-pointer"
                              onClick={() => setSelectedStaff(staff)}
                            >
                              <td className="px-4 py-3 text-sm border-b">{staff.staff_code}</td>
                              <td className="px-4 py-3 text-sm font-medium border-b">
                                {staff.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 border-b">
                                {staff.name_kana}
                              </td>
                              <td className="px-4 py-3 text-sm border-b">
                                {getRoleName(staff.role_id)}
                              </td>
                              <td className="px-4 py-3 text-sm border-b">
                                {getEmploymentTypeName(staff.employment_type)}
                              </td>
                              <td className="px-4 py-3 text-sm border-b">
                                {staff.store_name || '未設定'}
                              </td>
                              <td className="px-4 py-3 text-sm border-b">{staff.hire_date}</td>
                              <td className="px-4 py-3 text-sm border-b">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${
                                        i < parseInt(staff.skill_level)
                                          ? 'bg-yellow-400'
                                          : 'bg-gray-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm border-b">
                                {staff.max_hours_per_week}時間
                              </td>
                              <td className="px-4 py-3 text-sm border-b">
                                {staff.is_active === true ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                    在籍
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                    退職
                                  </span>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default StaffManagement
