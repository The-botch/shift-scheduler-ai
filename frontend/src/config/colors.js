// 役職別カラー設定
export const ROLE_COLORS = {
  '店長': {
    bg: 'bg-red-500',
    bgLight: 'bg-red-100',
    border: 'border-red-500',
    text: 'text-red-700',
    hex: '#ef4444'
  },
  'リーダー': {
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-100',
    border: 'border-purple-500',
    text: 'text-purple-700',
    hex: '#a855f7'
  },
  '主任': {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-100',
    border: 'border-blue-500',
    text: 'text-blue-700',
    hex: '#3b82f6'
  },
  '一般スタッフ': {
    bg: 'bg-green-500',
    bgLight: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-700',
    hex: '#22c55e'
  }
}

// ステータス別カラー
export const STATUS_COLORS = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-700'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-700'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700'
  }
}

// カレンダーカラー
export const CALENDAR_COLORS = {
  weekend: 'bg-blue-50',
  weekendBorder: 'border-blue-200',
  weekday: 'bg-white',
  weekdayBorder: 'border-gray-200',
  selected: 'bg-green-600',
  modified: 'bg-yellow-50',
  modifiedBorder: 'border-yellow-300'
}

// 差分表示カラー
export const DIFF_COLORS = {
  positive: 'text-green-600',
  negative: 'text-red-600',
  neutral: 'text-gray-600',
  added: 'text-green-600',
  removed: 'text-red-600',
  changed: 'text-orange-600'
}

// グラデーション
export const GRADIENTS = {
  primary: 'from-blue-600 to-blue-700',
  success: 'from-green-600 to-green-700',
  warning: 'from-yellow-600 to-yellow-700',
  danger: 'from-red-600 to-red-700',
  header: 'from-gray-900 to-gray-600'
}

// ヘルパー関数
export const getRoleColor = (roleName) => {
  return ROLE_COLORS[roleName] || ROLE_COLORS['一般スタッフ']
}

export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS.info
}
