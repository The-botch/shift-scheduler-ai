const fs = require('fs');
const Papa = require('papaparse');

// 2024年の実績データを生成
const YEAR = 2024;
const STAFF_COUNT = 10;

// スタッフマスターデータを読み込み
const staffCsv = fs.readFileSync('./public/data/master/staff.csv', 'utf8');
const staffData = Papa.parse(staffCsv, { header: true, skipEmptyLines: true }).data;

// シフトパターンマスターを読み込み
const patternsCsv = fs.readFileSync('./public/data/master/shift_patterns.csv', 'utf8');
const patternsData = Papa.parse(patternsCsv, { header: true, skipEmptyLines: true }).data;

// パターンコードからパターン情報を取得
const getPattern = (code) => patternsData.find(p => p.pattern_code === code);

// 労働時間を計算
const calculateHours = (startTime, endTime, breakMinutes) => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  const workMinutes = totalMinutes - breakMinutes;
  return workMinutes / 60;
};

// ランダムに時刻を微調整（実績は予定から少しずれる）
const adjustTime = (time, maxMinutes = 10) => {
  const [h, m] = time.split(':').map(Number);
  const adjustment = Math.floor(Math.random() * maxMinutes * 2) - maxMinutes;
  let newM = m + adjustment;
  let newH = h;

  if (newM < 0) {
    newM += 60;
    newH -= 1;
  } else if (newM >= 60) {
    newM -= 60;
    newH += 1;
  }

  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

// 1. 労働時間実績データ生成
console.log('📊 労働時間実績データを生成中...');

const workHoursData = [];
let shiftId = 1;

for (let month = 1; month <= 12; month++) {
  const daysInMonth = new Date(YEAR, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(YEAR, month - 1, day);
    const dayOfWeek = date.getDay();

    // 各スタッフのシフトを生成（全員が毎日出勤するわけではない）
    staffData.forEach(staff => {
      const staffId = staff.staff_id;
      const staffName = staff.name;

      // 出勤確率（スタッフによって異なる）
      const workProbability = staffId <= 3 ? 0.7 : 0.5;

      if (Math.random() < workProbability) {
        // ランダムにシフトパターンを選択
        const patterns = ['EARLY', 'MID', 'LATE', 'SHORT_AM', 'SHORT_PM'];
        const patternCode = patterns[Math.floor(Math.random() * patterns.length)];
        const pattern = getPattern(patternCode);

        if (!pattern) return;

        const scheduledStart = pattern.start_time;
        const scheduledEnd = pattern.end_time;
        const breakMinutes = parseInt(pattern.break_minutes);

        // 実績時刻（予定から微調整）
        const actualStart = Math.random() > 0.8 ? adjustTime(scheduledStart, 15) : scheduledStart;
        const actualEnd = Math.random() > 0.7 ? adjustTime(scheduledEnd, 20) : scheduledEnd;

        const scheduledHours = calculateHours(scheduledStart, scheduledEnd, breakMinutes);
        const actualHours = calculateHours(actualStart, actualEnd, breakMinutes);

        const isLate = actualStart > scheduledStart;
        const isEarlyLeave = actualEnd < scheduledEnd;
        const overtimeMinutes = Math.max(0, Math.round((actualHours - scheduledHours) * 60));

        const notes = [];
        if (isLate) notes.push('遅刻');
        if (isEarlyLeave) notes.push('早退');
        if (overtimeMinutes > 30) notes.push(`残業${Math.round(overtimeMinutes / 60 * 10) / 10}h`);

        workHoursData.push({
          shift_id: `SH${YEAR}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}_${String(shiftId).padStart(4, '0')}`,
          year: YEAR,
          month,
          date: day,
          staff_id: staffId,
          staff_name: staffName,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          actual_start: actualStart,
          actual_end: actualEnd,
          scheduled_hours: scheduledHours.toFixed(1),
          actual_hours: actualHours.toFixed(1),
          break_minutes: breakMinutes,
          overtime_minutes: overtimeMinutes,
          is_late: isLate ? 'TRUE' : 'FALSE',
          is_early_leave: isEarlyLeave ? 'TRUE' : 'FALSE',
          notes: notes.join(', ')
        });

        shiftId++;
      }
    });
  }
}

// 労働時間実績CSVを出力
const workHoursCsv = Papa.unparse(workHoursData);
const actualDir = './public/data/actual';
if (!fs.existsSync(actualDir)) {
  fs.mkdirSync(actualDir, { recursive: true });
}
fs.writeFileSync(`${actualDir}/work_hours_${YEAR}.csv`, workHoursCsv, 'utf8');
console.log(`✅ 労働時間実績データを生成しました: ${workHoursData.length}件`);

// 2. 給与明細データ生成
console.log('\n💰 給与明細データを生成中...');

const payrollData = [];
let payrollId = 1;

for (let month = 1; month <= 12; month++) {
  staffData.forEach(staff => {
    const staffId = staff.staff_id;
    const staffName = staff.name;
    const employmentType = staff.employment_type;
    const hourlyRate = parseFloat(staff.hourly_rate) || 0;
    const monthlySalary = parseFloat(staff.monthly_salary) || 0;
    const commuteDistanceKm = parseFloat(staff.commute_distance_km) || 0;
    const hasSocialInsurance = staff.has_social_insurance === 'TRUE';

    // その月の労働時間を集計
    const monthShifts = workHoursData.filter(
      s => s.month === month && s.staff_id === staffId
    );

    const workDays = monthShifts.length;
    const workHours = monthShifts.reduce((sum, s) => sum + parseFloat(s.actual_hours), 0);
    const overtimeHours = monthShifts.reduce((sum, s) => sum + (s.overtime_minutes / 60), 0);

    // 基本給の計算
    let baseSalary = 0;
    let overtimePay = 0;

    if (employmentType === 'monthly') {
      baseSalary = monthlySalary;
      overtimePay = Math.round(overtimeHours * (monthlySalary / 160) * 1.25);
    } else {
      baseSalary = Math.round(workHours * hourlyRate);
      overtimePay = Math.round(overtimeHours * hourlyRate * 1.25);
    }

    const regularPay = baseSalary;

    // 通勤手当（往復 × 勤務日数 × 15円/km）
    const commuteAllowance = Math.round(commuteDistanceKm * 2 * workDays * 15);

    // 総支給額
    const grossSalary = regularPay + overtimePay + commuteAllowance;

    // 控除計算
    let healthInsurance = 0;
    let pensionInsurance = 0;
    let employmentInsurance = 0;

    if (hasSocialInsurance) {
      healthInsurance = Math.round(grossSalary * 0.0495); // 健康保険 4.95%
      pensionInsurance = Math.round(grossSalary * 0.0915); // 厚生年金 9.15%
      employmentInsurance = Math.round(grossSalary * 0.003); // 雇用保険 0.3%
    }

    // 所得税（簡易計算）
    const taxableIncome = grossSalary - 88000; // 基礎控除
    let incomeTax = 0;
    if (taxableIncome > 0) {
      if (taxableIncome <= 195000) {
        incomeTax = Math.round(taxableIncome * 0.05);
      } else if (taxableIncome <= 330000) {
        incomeTax = Math.round(taxableIncome * 0.1 - 9750);
      } else {
        incomeTax = Math.round(taxableIncome * 0.2 - 42750);
      }
    }

    // 住民税（前年所得ベース、簡易的に月額固定）
    const residentTax = hasSocialInsurance ? 8000 : 0;

    const totalDeduction = healthInsurance + pensionInsurance + employmentInsurance + incomeTax + residentTax;
    const netSalary = grossSalary - totalDeduction;

    payrollData.push({
      payroll_id: `PAY${YEAR}${String(month).padStart(2, '0')}_${String(payrollId).padStart(4, '0')}`,
      year: YEAR,
      month,
      staff_id: staffId,
      staff_name: staffName,
      work_days: workDays,
      work_hours: workHours.toFixed(1),
      base_salary: regularPay,
      overtime_pay: overtimePay,
      commute_allowance: commuteAllowance,
      other_allowances: 0,
      gross_salary: grossSalary,
      health_insurance: healthInsurance,
      pension_insurance: pensionInsurance,
      employment_insurance: employmentInsurance,
      income_tax: incomeTax,
      resident_tax: residentTax,
      total_deduction: totalDeduction,
      net_salary: netSalary,
      payment_date: `${YEAR}-${String(month + 1).padStart(2, '0')}-10`,
      payment_status: 'paid'
    });

    payrollId++;
  });
}

// 給与明細CSVを出力
const payrollCsv = Papa.unparse(payrollData);
fs.writeFileSync(`${actualDir}/payroll_${YEAR}.csv`, payrollCsv, 'utf8');
console.log(`✅ 給与明細データを生成しました: ${payrollData.length}件`);

console.log('\n📈 サマリー:');
console.log(`   労働時間実績: ${workHoursData.length}シフト`);
console.log(`   給与明細: ${payrollData.length}件（${STAFF_COUNT}名 × 12ヶ月）`);
console.log(`   平均労働時間/月: ${(workHoursData.reduce((s, d) => s + parseFloat(d.actual_hours), 0) / 12).toFixed(1)}h`);
console.log(`   総人件費: ¥${payrollData.reduce((s, p) => s + p.gross_salary, 0).toLocaleString()}`);
