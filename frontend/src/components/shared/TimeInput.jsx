import React, { useMemo } from 'react'

/**
 * 24時超過対応の時刻入力コンポーネント
 * - 5:00〜28:00の範囲をサポート（深夜営業対応）
 * - 15分刻みまたは30分刻みで選択可能
 * - VARCHAR(5)形式 "HH:MM" で値を管理
 */
const TimeInput = ({
  value,
  onChange,
  label,
  minHour = 5,
  maxHour = 28,
  minuteStep = 15, // 15 or 30
  disabled = false,
  required = false,
  className = '',
  error,
  compact = false, // コンパクトモード（インライン編集用）
}) => {
  // 時間の選択肢を生成
  const hourOptions = useMemo(() => {
    const options = []
    for (let h = minHour; h <= maxHour; h++) {
      options.push(h)
    }
    return options
  }, [minHour, maxHour])

  // 分の選択肢を生成
  const minuteOptions = useMemo(() => {
    const options = []
    for (let m = 0; m < 60; m += minuteStep) {
      options.push(m)
    }
    return options
  }, [minuteStep])

  // 現在の値をパース
  const parseValue = val => {
    if (!val) return { hour: '', minute: '' }
    const parts = val.split(':')
    if (parts.length !== 2) return { hour: '', minute: '' }
    return {
      hour: parseInt(parts[0], 10),
      minute: parseInt(parts[1], 10),
    }
  }

  const { hour: currentHour, minute: currentMinute } = parseValue(value)

  // 値をフォーマット
  const formatValue = (hour, minute) => {
    if (hour === '' || hour === undefined || minute === '' || minute === undefined) {
      return ''
    }
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  // 時間変更ハンドラ
  const handleHourChange = e => {
    const newHour = e.target.value === '' ? '' : parseInt(e.target.value, 10)
    const newMinute = currentMinute !== '' ? currentMinute : 0
    onChange(formatValue(newHour, newMinute))
  }

  // 分変更ハンドラ
  const handleMinuteChange = e => {
    const newMinute = e.target.value === '' ? '' : parseInt(e.target.value, 10)
    const newHour = currentHour !== '' ? currentHour : minHour
    onChange(formatValue(newHour, newMinute))
  }

  // 表示用の時間フォーマット（24時超過の場合は翌日表示も）
  const formatHourDisplay = hour => {
    if (compact) {
      return `${hour}`
    }
    if (hour >= 24) {
      return `${hour}時 (翌${hour - 24}時)`
    }
    return `${hour}時`
  }

  // コンパクトモード用のスタイル
  const selectBaseClass = compact
    ? 'px-0.5 py-0.5 text-[0.6rem] border rounded'
    : 'px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
  const hourSelectWidth = compact ? 'w-12' : 'w-24'
  const minuteSelectWidth = compact ? 'w-10' : 'w-16'
  const labelClass = compact
    ? 'block text-[0.55rem] font-medium text-gray-600'
    : 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className={`time-input ${className}`}>
      {label && (
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center gap-0.5">
        {/* 時間セレクト */}
        <select
          value={currentHour !== '' ? currentHour : ''}
          onChange={handleHourChange}
          disabled={disabled}
          className={`${hourSelectWidth} ${selectBaseClass} ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${error ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">--</option>
          {hourOptions.map(h => (
            <option key={h} value={h}>
              {formatHourDisplay(h)}
            </option>
          ))}
        </select>
        <span className={compact ? 'text-[0.55rem] text-gray-500' : 'text-gray-500'}>:</span>
        {/* 分セレクト */}
        <select
          value={currentMinute !== '' ? currentMinute : ''}
          onChange={handleMinuteChange}
          disabled={disabled}
          className={`${minuteSelectWidth} ${selectBaseClass} ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${error ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">--</option>
          {minuteOptions.map(m => (
            <option key={m} value={m}>
              {compact ? String(m).padStart(2, '0') : `${String(m).padStart(2, '0')}分`}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

/**
 * 時刻範囲入力コンポーネント（開始〜終了）
 */
export const TimeRangeInput = ({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  startLabel = '開始時刻',
  endLabel = '終了時刻',
  minHour = 5,
  maxHour = 28,
  minuteStep = 15,
  disabled = false,
  required = false,
  className = '',
  error,
}) => {
  return (
    <div className={`time-range-input flex items-end gap-4 ${className}`}>
      <TimeInput
        value={startTime}
        onChange={onStartChange}
        label={startLabel}
        minHour={minHour}
        maxHour={maxHour}
        minuteStep={minuteStep}
        disabled={disabled}
        required={required}
      />
      <span className="text-gray-500 pb-2">〜</span>
      <TimeInput
        value={endTime}
        onChange={onEndChange}
        label={endLabel}
        minHour={minHour}
        maxHour={maxHour}
        minuteStep={minuteStep}
        disabled={disabled}
        required={required}
      />
      {error && <p className="text-xs text-red-500 self-end pb-2">{error}</p>}
    </div>
  )
}

export default TimeInput
