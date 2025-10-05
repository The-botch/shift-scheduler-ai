// 全てのコンフィグをまとめてエクスポート

export * from './constants'
export * from './colors'
export * from './paths'
export * from './display'
export * from './shiftPatterns'
export * from './api'

// デフォルトエクスポート用のまとめオブジェクト
import * as constants from './constants'
import * as colors from './colors'
import * as paths from './paths'
import * as display from './display'
import * as shiftPatterns from './shiftPatterns'

const config = {
  constants,
  colors,
  paths,
  display,
  shiftPatterns,
}

export default config
