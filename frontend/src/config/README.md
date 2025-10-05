# コンフィグファイル使用ガイド

このディレクトリには、アプリケーション全体で使用する定数やパラメータがまとめられています。

## ファイル構成

```
src/config/
├── index.js           # 全体をエクスポート（推奨インポート元）
├── constants.js       # 基本定数
├── colors.js          # カラー設定
├── paths.js           # ファイルパス
├── display.js         # 表示・アニメーション設定
├── shiftPatterns.js   # シフトパターン設定
└── README.md          # このファイル
```

## 使用方法

### 基本的なインポート

```javascript
// 推奨: 必要な定数だけをインポート
import { WEEKDAYS, SHIFT_STATUS, MASTER_DATA_PATHS } from '@/config'

// または: カテゴリごとにインポート
import { ROLE_COLORS, getRoleColor } from '@/config/colors'
import { SHIFT_PATTERNS, getPatternByCode } from '@/config/shiftPatterns'
```

### 各ファイルの使用例

#### 1. constants.js - 基本定数

```javascript
import { SYSTEM, WEEKDAYS, STORAGE_KEYS } from '@/config'

// システム情報
console.log(SYSTEM.STORE_NAME) // 'カフェ○○'
console.log(SYSTEM.DEFAULT_YEAR) // 2024

// 曜日
const weekday = WEEKDAYS[new Date().getDay()] // '月'

// LocalStorage キー
const key = STORAGE_KEYS.APPROVED_FIRST_PLAN(2024, 10)
// 'approved_first_plan_2024_10'
```

#### 2. colors.js - カラー設定

```javascript
import { ROLE_COLORS, getRoleColor, CALENDAR_COLORS } from '@/config/colors'

// 役職の色を取得
const roleColor = getRoleColor('店長')
// { bg: 'bg-red-500', text: 'text-red-700', ... }

// クラス名として使用
<div className={`${roleColor.bg} ${roleColor.text}`}>
  店長
</div>

// カレンダーの色
<div className={CALENDAR_COLORS.weekend}>
  土日
</div>
```

#### 3. paths.js - ファイルパス

```javascript
import { MASTER_DATA_PATHS, getWorkHoursPath } from '@/config/paths'

// マスターデータの読み込み
const response = await fetch(MASTER_DATA_PATHS.STAFF)

// 動的なパス生成
const workHoursPath = getWorkHoursPath(2024)
// '/data/actual/work_hours_2024.csv'
```

#### 4. display.js - 表示設定

```javascript
import { PAGE_VARIANTS, PAGE_TRANSITION, ICON_SIZES } from '@/config/display'

// ページ遷移アニメーション
<motion.div
  variants={PAGE_VARIANTS}
  transition={PAGE_TRANSITION}
  initial="initial"
  animate="in"
  exit="out"
>
  {/* コンテンツ */}
</motion.div>

// アイコンサイズ
<CheckIcon className={ICON_SIZES.SM} />
```

#### 5. shiftPatterns.js - シフトパターン

```javascript
import {
  SHIFT_PATTERNS,
  getPatternByCode,
  getPatternName,
  calculatePatternHours,
} from '@/config/shiftPatterns'

// パターン情報の取得
const pattern = getPatternByCode('EARLY')
// { code: 'EARLY', name: '早番', startTime: '09:00', ... }

// パターン名の取得
const name = getPatternName('EARLY') // '早番'

// 労働時間の計算
const hours = calculatePatternHours('EARLY') // 7.0
```

## 実際の使用例

### Before（定数をハードコード）

```javascript
// 悪い例 ❌
const staffResponse = await fetch('/data/master/staff.csv')

const getRoleColor = role => {
  const colorMap = {
    店長: 'bg-red-500',
    リーダー: 'bg-purple-500',
    // ...
  }
  return colorMap[role] || 'bg-gray-500'
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
```

### After（コンフィグを使用）

```javascript
// 良い例 ✅
import { MASTER_DATA_PATHS, WEEKDAYS, getRoleColor } from '@/config'

const staffResponse = await fetch(MASTER_DATA_PATHS.STAFF)
const roleColor = getRoleColor('店長')
const weekday = WEEKDAYS[0]
```

## 設定の変更方法

### 新しい定数を追加する

1. 適切なファイルを選択（または新規作成）
2. 定数を追加・エクスポート
3. `index.js` で再エクスポート（必要に応じて）

```javascript
// constants.js に追加
export const NEW_CONSTANT = {
  KEY: 'value',
}

// index.js で再エクスポート
export * from './constants'
```

### 既存の定数を変更する

```javascript
// 例: システム名を変更
// constants.js
export const SYSTEM = {
  STORE_NAME: '新しい店舗名', // ← ここを変更
  // ...
}
```

変更は全ファイルに自動的に反映されます。

## ベストプラクティス

1. **ハードコードを避ける**: 定数は必ずコンフィグファイルに定義
2. **名前付きエクスポートを使う**: デフォルトエクスポートより明示的
3. **関連する定数をグループ化**: 機能ごとにオブジェクトにまとめる
4. **ヘルパー関数を提供**: 複雑な処理は関数として提供
5. **型安全性**: TypeScript を使う場合は型定義も追加

## トラブルシューティング

### インポートエラーが出る

```javascript
// NG: 相対パスが間違っている
import { SYSTEM } from '../../../config'

// OK: 正しい相対パス、またはエイリアスを使用
import { SYSTEM } from '@/config'
```

### 定数が undefined になる

```javascript
// 確認: 正しくエクスポートされているか
console.log(Object.keys(config))

// 確認: スペルミスがないか
import { SYSTME } from '@/config' // ❌ SYSTEM のスペルミス
import { SYSTEM } from '@/config' // ✅ 正しい
```

## 今後の拡張

- API エンドポイントの設定
- 環境変数の管理
- テーマ設定（ダーク/ライトモード）
- 多言語対応の文言定義
