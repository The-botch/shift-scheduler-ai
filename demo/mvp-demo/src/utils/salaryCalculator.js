/**
 * 給与計算ユーティリティ
 */

/**
 * 社会保険料を計算
 * @param {number} grossSalary - 総支給額
 * @param {string} employmentType - 雇用形態
 * @param {boolean} hasSocialInsurance - 社会保険加入有無
 * @param {Array} insuranceRates - 保険料率マスタ
 * @returns {Object} 社会保険料の内訳
 */
export const calculateSocialInsurance = (grossSalary, employmentType, hasSocialInsurance, insuranceRates) => {
  if (!hasSocialInsurance || employmentType === 'hourly') {
    // 時給制は雇用保険のみ
    const employmentInsurance = insuranceRates.find(r => r.rate_type === 'employment_insurance')
    const employmentInsuranceFee = employmentInsurance
      ? Math.floor(grossSalary * (parseFloat(employmentInsurance.employee_percentage) / 100))
      : 0

    return {
      healthInsurance: 0,
      pension: 0,
      employmentInsurance: employmentInsuranceFee,
      workersCompensation: 0,
      total: employmentInsuranceFee
    }
  }

  // 月給制の場合は全ての社会保険を計算
  const healthInsurance = insuranceRates.find(r => r.rate_type === 'health_insurance')
  const pension = insuranceRates.find(r => r.rate_type === 'pension')
  const employmentInsurance = insuranceRates.find(r => r.rate_type === 'employment_insurance')

  const healthInsuranceFee = healthInsurance
    ? Math.floor(grossSalary * (parseFloat(healthInsurance.employee_percentage) / 100))
    : 0

  const pensionFee = pension
    ? Math.floor(grossSalary * (parseFloat(pension.employee_percentage) / 100))
    : 0

  const employmentInsuranceFee = employmentInsurance
    ? Math.floor(grossSalary * (parseFloat(employmentInsurance.employee_percentage) / 100))
    : 0

  return {
    healthInsurance: healthInsuranceFee,
    pension: pensionFee,
    employmentInsurance: employmentInsuranceFee,
    workersCompensation: 0, // 労災は全額事業主負担
    total: healthInsuranceFee + pensionFee + employmentInsuranceFee
  }
}

/**
 * 所得税を計算（簡易計算）
 * @param {number} taxableIncome - 課税所得
 * @param {Array} taxBrackets - 税率表
 * @returns {number} 所得税額
 */
export const calculateIncomeTax = (taxableIncome, taxBrackets) => {
  // 月額の場合は年額に換算してから計算
  const annualIncome = taxableIncome * 12

  // 給与所得控除（簡易計算）
  let employmentIncomeDeduction = 0
  if (annualIncome <= 1625000) {
    employmentIncomeDeduction = 550000
  } else if (annualIncome <= 1800000) {
    employmentIncomeDeduction = annualIncome * 0.4 - 100000
  } else if (annualIncome <= 3600000) {
    employmentIncomeDeduction = annualIncome * 0.3 + 80000
  } else if (annualIncome <= 6600000) {
    employmentIncomeDeduction = annualIncome * 0.2 + 440000
  } else if (annualIncome <= 8500000) {
    employmentIncomeDeduction = annualIncome * 0.1 + 1100000
  } else {
    employmentIncomeDeduction = 1950000
  }

  // 基礎控除
  const basicDeduction = 480000

  // 課税所得
  const taxableAmount = Math.max(0, annualIncome - employmentIncomeDeduction - basicDeduction)

  // 税率表から該当する税率を探す
  const bracket = taxBrackets.find(b =>
    taxableAmount >= b.income_from && taxableAmount <= b.income_to
  ) || taxBrackets[taxBrackets.length - 1]

  // 所得税計算
  const annualTax = Math.floor(taxableAmount * (parseFloat(bracket.tax_rate) / 100) - parseFloat(bracket.deduction))

  // 月額に換算
  return Math.floor(annualTax / 12)
}

/**
 * 住民税を計算（簡易計算：所得の10%）
 * @param {number} taxableIncome - 課税所得
 * @returns {number} 住民税額
 */
export const calculateResidentTax = (taxableIncome) => {
  // 簡易計算：課税所得の10%
  const annualIncome = taxableIncome * 12
  const annualTax = Math.floor(annualIncome * 0.1)
  return Math.floor(annualTax / 12)
}

/**
 * 交通費を計算
 * @param {number} commuteDistance - 通勤距離（km）
 * @param {number} workDays - 勤務日数
 * @param {Array} commuteAllowances - 交通費手当マスタ
 * @param {string} employmentType - 雇用形態
 * @returns {Object} 交通費情報
 */
export const calculateCommuteAllowance = (commuteDistance, workDays, commuteAllowances, employmentType) => {
  const allowance = commuteAllowances.find(a =>
    commuteDistance >= a.distance_from_km && commuteDistance < a.distance_to_km
  )

  if (!allowance) {
    return { dailyAllowance: 0, totalAllowance: 0, monthlyMax: 0 }
  }

  // 正社員・業務委託は月額上限を支給、時給制は実績日数×日額
  let totalAllowance = 0
  if (employmentType === 'monthly' || employmentType === 'contract') {
    totalAllowance = allowance.monthly_max
  } else {
    totalAllowance = Math.min(
      allowance.daily_allowance * workDays,
      allowance.monthly_max
    )
  }

  return {
    dailyAllowance: allowance.daily_allowance,
    totalAllowance,
    monthlyMax: allowance.monthly_max
  }
}

/**
 * 給与明細を計算
 * @param {Object} staff - スタッフ情報
 * @param {Object} performance - 勤務実績
 * @param {Object} masterData - マスターデータ
 * @returns {Object} 給与明細
 */
export const calculatePayslip = (staff, performance, masterData) => {
  const { insuranceRates, taxBrackets, commuteAllowances } = masterData

  // 総支給額の計算
  let grossSalary = 0
  if (staff.employment_type === 'monthly') {
    grossSalary = parseInt(staff.monthly_salary || 0)
  } else if (staff.employment_type === 'hourly') {
    grossSalary = Math.floor(performance.totalHours * parseInt(staff.hourly_rate || 0))
  } else if (staff.employment_type === 'contract') {
    grossSalary = parseInt(staff.contract_fee || 0)
  }

  // 交通費
  const commuteAllowance = calculateCommuteAllowance(
    parseFloat(staff.commute_distance_km || 0),
    performance.totalDays,
    commuteAllowances,
    staff.employment_type
  )

  // 社会保険料
  const socialInsurance = calculateSocialInsurance(
    grossSalary,
    staff.employment_type,
    staff.has_social_insurance === 'TRUE',
    insuranceRates
  )

  // 所得税（交通費は非課税）
  const incomeTax = calculateIncomeTax(grossSalary, taxBrackets)

  // 住民税
  const residentTax = calculateResidentTax(grossSalary)

  // 控除合計
  const totalDeductions = socialInsurance.total + incomeTax + residentTax

  // 差引支給額
  const netSalary = grossSalary + commuteAllowance.totalAllowance - totalDeductions

  return {
    grossSalary,
    commuteAllowance: commuteAllowance.totalAllowance,
    totalGross: grossSalary + commuteAllowance.totalAllowance,
    socialInsurance,
    incomeTax,
    residentTax,
    totalDeductions,
    netSalary,
    workDays: performance.totalDays,
    workHours: performance.totalHours
  }
}
