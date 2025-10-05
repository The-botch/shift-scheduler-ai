// シフトパターン設定

export const SHIFT_PATTERNS = {
  EARLY: {
    code: 'EARLY',
    name: '早番',
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 60,
    description: '朝から夕方までの勤務',
  },
  MID: {
    code: 'MID',
    name: '中番',
    startTime: '13:00',
    endTime: '21:00',
    breakMinutes: 60,
    description: '昼から夜までの勤務',
  },
  LATE: {
    code: 'LATE',
    name: '遅番',
    startTime: '17:00',
    endTime: '22:00',
    breakMinutes: 0,
    description: '夕方から閉店までの勤務',
  },
  SHORT_AM: {
    code: 'SHORT_AM',
    name: '短時間午前',
    startTime: '09:00',
    endTime: '13:00',
    breakMinutes: 0,
    description: '午前中のみの短時間勤務',
  },
  SHORT_PM: {
    code: 'SHORT_PM',
    name: '短時間午後',
    startTime: '14:00',
    endTime: '18:00',
    breakMinutes: 0,
    description: '午後のみの短時間勤務',
  },
  FULL: {
    code: 'FULL',
    name: '通し',
    startTime: '09:00',
    endTime: '22:00',
    breakMinutes: 120,
    description: '開店から閉店までの長時間勤務',
  },
}

// パターンコードの配列
export const PATTERN_CODES = Object.keys(SHIFT_PATTERNS)

// パターン名からパターンを取得
export const getPatternByCode = code => {
  return SHIFT_PATTERNS[code] || null
}

// パターンの労働時間を計算
export const calculatePatternHours = patternCode => {
  const pattern = SHIFT_PATTERNS[patternCode]
  if (!pattern) return 0

  const start = new Date(`2000-01-01 ${pattern.startTime}`)
  const end = new Date(`2000-01-01 ${pattern.endTime}`)
  const totalMinutes = (end - start) / (1000 * 60)
  const workMinutes = totalMinutes - pattern.breakMinutes
  return workMinutes / 60
}

// 全パターンを配列で取得
export const getAllPatterns = () => {
  return Object.values(SHIFT_PATTERNS)
}

// パターンコードから名前を取得
export const getPatternName = code => {
  return SHIFT_PATTERNS[code]?.name || '不明'
}

// パターンコードから時間範囲を取得
export const getPatternTimeRange = code => {
  const pattern = SHIFT_PATTERNS[code]
  if (!pattern) return ''
  return `${pattern.startTime}-${pattern.endTime}`
}
