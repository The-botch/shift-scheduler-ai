// 表示設定・UIアニメーション設定

// ページ遷移アニメーション
export const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

export const PAGE_TRANSITION = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}

// モーダルアニメーション
export const MODAL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

export const MODAL_TRANSITION = {
  duration: 0.2
}

// カードアニメーション
export const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// スタッガーアニメーション設定
export const STAGGER_DELAY = 0.05

// ローディング設定
export const LOADING = {
  SPINNER_SIZE: 12,
  MIN_DISPLAY_TIME_MS: 500
}

// ページネーション
export const PAGINATION = {
  ITEMS_PER_PAGE: 20,
  MAX_PAGE_BUTTONS: 5
}

// テーブル設定
export const TABLE = {
  MAX_ROWS_BEFORE_SCROLL: 10,
  ROW_HEIGHT_PX: 48,
  HEADER_HEIGHT_PX: 56
}

// カレンダー設定
export const CALENDAR = {
  CELL_MIN_HEIGHT_PX: 60,
  MAX_SHIFTS_PREVIEW: 2,
  SHOW_WEEK_NUMBERS: false
}

// グラフ設定
export const CHART = {
  DEFAULT_HEIGHT_PX: 300,
  ANIMATION_DURATION_MS: 750,
  COLORS: [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316'  // orange
  ]
}

// フォント設定
export const FONT = {
  SIZE: {
    XS: '0.75rem',
    SM: '0.875rem',
    BASE: '1rem',
    LG: '1.125rem',
    XL: '1.25rem',
    '2XL': '1.5rem',
    '3XL': '1.875rem',
    '4XL': '2.25rem'
  }
}

// レスポンシブブレークポイント
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px'
}

// 通知設定
export const NOTIFICATION = {
  DURATION_MS: 3000,
  MAX_VISIBLE: 3,
  POSITION: 'top-right'
}

// アイコンサイズ
export const ICON_SIZES = {
  XS: 'h-3 w-3',
  SM: 'h-4 w-4',
  MD: 'h-5 w-5',
  LG: 'h-6 w-6',
  XL: 'h-8 w-8'
}

// ボタンサイズ
export const BUTTON_SIZES = {
  XS: 'px-2 py-1 text-xs',
  SM: 'px-3 py-1.5 text-sm',
  MD: 'px-4 py-2 text-base',
  LG: 'px-6 py-3 text-lg',
  XL: 'px-8 py-4 text-xl'
}
