# デザイントークン導入提案

## 概要

イシュー#19「デザインシステム&テーマカスタマイズ」に対応するため、**意味のある色分けと共通化のバランス**を考慮したデザイントークンシステムを提案します。

## 問題点

前回の機械的な色置換アプローチでは、以下の問題が発生しました:

- ❌ LINE機能の緑色(#06C755)が汎用的な成功色(green-600)に置き換えられた
- ❌ 機能固有の色が持つ意味が失われた
- ❌ すべての画面が「見づらく」なった

## 基本方針

### 1. 色を3つのカテゴリに分類

#### 🔵 **セマンティックカラー** (共通化すべき)
普遍的な意味を持つ色。1箇所変更すれば全体に反映されるべき。

- **成功 (success)**: 緑系統 - 承認済み、提出完了、正常状態
- **エラー (error)**: 赤系統 - 拒否、エラー、削除アクション
- **警告 (warning)**: 黄色系統 - 注意事項、修正必要
- **情報 (info)**: 青系統 - 通常情報、土日

#### 🎨 **コンテキストカラー** (個別に設定)
特定の機能・文脈でのみ使われる色。機能の識別性を保つため個別管理。

- **LINE機能**: LINE公式ブランドカラー (#06C755)
- **役職別**: 店長(赤)、リーダー(紫)、主任(青)、一般(緑) - 既存のROLE_COLORS
- **画面固有**: 各画面のヘッダーグラデーション

#### ⚫ **ニュートラルカラー** (共通化すべき)
グレースケール。背景、テキスト、ボーダーなど。

- **背景**: slate-50, gray-50, gray-100
- **テキスト**: gray-400, gray-500, gray-600, gray-700, gray-800
- **ボーダー**: gray-100, gray-200, gray-300

---

## 提案するファイル構成

```
frontend/src/theme/
├── index.js                    # 全トークンの統合エクスポート
├── semantic.js                 # セマンティックカラー定義
├── contextual.js               # コンテキストカラー定義
├── neutral.js                  # ニュートラルカラー定義
├── typography.js               # フォント設定
├── spacing.js                  # スペーシング
└── README.md                   # 使い方ガイド

frontend/tailwind.config.js     # Tailwind統合
frontend/src/config/colors.js   # 既存コード用の互換レイヤー (非推奨)
```

---

## 詳細設計

### 1. セマンティックカラー (`semantic.js`)

```javascript
/**
 * セマンティックカラー: 普遍的な意味を持つ色
 *
 * これらの色は全アプリケーションで統一されるべきものです。
 * 1箇所変更すれば全体に反映されます。
 */

export const semanticColors = {
  // 成功・承認・完了
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // エラー・拒否・削除
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // 警告・注意・修正必要
  warning: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },

  // 情報・通常状態
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
}

// Tailwindクラス名での使用を簡単にするヘルパー
export const getSemanticClass = (type, variant = 'default') => {
  const variants = {
    success: {
      default: 'bg-success-50 border-success-300 text-success-700',
      solid: 'bg-success-600 text-white hover:bg-success-700',
      text: 'text-success-700',
      border: 'border-success-300',
    },
    error: {
      default: 'bg-error-50 border-error-300 text-error-700',
      solid: 'bg-error-600 text-white hover:bg-error-700',
      text: 'text-error-700',
      border: 'border-error-300',
    },
    warning: {
      default: 'bg-warning-50 border-warning-300 text-warning-700',
      solid: 'bg-warning-600 text-white hover:bg-warning-700',
      text: 'text-warning-700',
      border: 'border-warning-300',
    },
    info: {
      default: 'bg-info-50 border-info-300 text-info-700',
      solid: 'bg-info-600 text-white hover:bg-info-700',
      text: 'text-info-700',
      border: 'border-info-300',
    },
  }
  return variants[type]?.[variant] || ''
}
```

### 2. コンテキストカラー (`contextual.js`)

```javascript
/**
 * コンテキストカラー: 特定の機能・文脈で使われる色
 *
 * これらは機能の識別性を保つため、個別に管理されます。
 * セマンティックカラーとは異なり、意味が文脈依存です。
 */

// LINE機能専用カラー
export const lineColors = {
  brand: '#06C755',          // LINE公式ブランドカラー
  brandDark: '#00B900',      // ホバー時
  brandLight: '#E8F5E9',     // 背景
}

// 役職別カラー (既存のROLE_COLORSを保持)
export const roleColors = {
  店長: {
    main: '#ef4444',       // error-500 相当
    light: '#fee2e2',      // error-100 相当
    dark: '#b91c1c',       // error-700 相当
    tailwind: {
      bg: 'bg-[#ef4444]',
      bgLight: 'bg-[#fee2e2]',
      text: 'text-[#b91c1c]',
      border: 'border-[#ef4444]',
    },
  },
  リーダー: {
    main: '#a855f7',       // purple-500 相当
    light: '#f3e8ff',      // purple-100 相当
    dark: '#7e22ce',       // purple-700 相当
    tailwind: {
      bg: 'bg-[#a855f7]',
      bgLight: 'bg-[#f3e8ff]',
      text: 'text-[#7e22ce]',
      border: 'border-[#a855f7]',
    },
  },
  主任: {
    main: '#3b82f6',       // blue-500 相当
    light: '#dbeafe',      // blue-100 相当
    dark: '#1d4ed8',       // blue-700 相当
    tailwind: {
      bg: 'bg-[#3b82f6]',
      bgLight: 'bg-[#dbeafe]',
      text: 'text-[#1d4ed8]',
      border: 'border-[#3b82f6]',
    },
  },
  一般スタッフ: {
    main: '#22c55e',       // green-500 相当
    light: '#dcfce7',      // green-100 相当
    dark: '#15803d',       // green-700 相当
    tailwind: {
      bg: 'bg-[#22c55e]',
      bgLight: 'bg-[#dcfce7]',
      text: 'text-[#15803d]',
      border: 'border-[#22c55e]',
    },
  },
}

// 画面固有のグラデーション
export const screenGradients = {
  storeManagement: 'from-green-600 to-green-700',      // 店舗管理
  constraintManagement: 'from-purple-600 to-purple-700', // 制約管理
  header: 'from-gray-900 to-gray-600',                  // ヘッダー
}

// 重大度別カラー (制約管理など)
export const severityColors = {
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
  },
  high: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
  },
  medium: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
  },
  low: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
  },
}

// ヘルパー関数
export const getRoleColor = (roleName) => {
  return roleColors[roleName] || roleColors['一般スタッフ']
}

export const getSeverityColor = (severity) => {
  return severityColors[severity] || severityColors.medium
}
```

### 3. ニュートラルカラー (`neutral.js`)

```javascript
/**
 * ニュートラルカラー: グレースケール
 *
 * 背景、テキスト、ボーダーなど、全体で統一されるべき色。
 */

export const neutralColors = {
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
}

// 用途別エイリアス
export const backgrounds = {
  primary: 'bg-white',
  secondary: 'bg-slate-50',
  tertiary: 'bg-gray-50',
  card: 'bg-white',
  section: 'bg-gray-50',
}

export const textColors = {
  primary: 'text-gray-800',
  secondary: 'text-gray-600',
  tertiary: 'text-gray-500',
  disabled: 'text-gray-400',
  inverse: 'text-white',
}

export const borderColors = {
  light: 'border-gray-100',
  default: 'border-gray-200',
  strong: 'border-gray-300',
}
```

### 4. 統合エクスポート (`index.js`)

```javascript
/**
 * デザイントークン統合エクスポート
 */

export * from './semantic.js'
export * from './contextual.js'
export * from './neutral.js'
export * from './typography.js'
export * from './spacing.js'

// 全トークンの統合オブジェクト
export { default as tokens } from './tokens.js'
```

---

## 使用例

### セマンティックカラーの使用

```jsx
import { getSemanticClass } from '@/theme/semantic'

// 成功メッセージ
<div className={getSemanticClass('success', 'default')}>
  シフト希望を保存しました
</div>

// エラーメッセージ
<div className={getSemanticClass('error', 'default')}>
  エラーが発生しました
</div>

// 成功ボタン
<button className={getSemanticClass('success', 'solid')}>
  承認する
</button>
```

### コンテキストカラーの使用

```jsx
import { lineColors, getRoleColor } from '@/theme/contextual'

// LINE機能のボタン
<button
  className="text-white hover:opacity-90"
  style={{ backgroundColor: lineColors.brand }}
>
  LINEで送信
</button>

// 役職バッジ
const role = getRoleColor('店長')
<div className={role.tailwind.bg}>
  <span className={role.tailwind.text}>店長</span>
</div>
```

### ニュートラルカラーの使用

```jsx
import { backgrounds, textColors, borderColors } from '@/theme/neutral'

<div className={`${backgrounds.secondary} ${borderColors.default} border rounded-lg p-4`}>
  <h2 className={textColors.primary}>タイトル</h2>
  <p className={textColors.secondary}>説明文</p>
</div>
```

---

## 移行戦略

### フェーズ1: インフラ構築 (第1週)
1. ✅ `frontend/src/theme/` ディレクトリを作成
2. ✅ 各トークンファイルを作成 (semantic.js, contextual.js, neutral.js)
3. ✅ `tailwind.config.js` に統合
4. ✅ 既存の `colors.js` から新トークンシステムへのエイリアス作成

### フェーズ2: セマンティックカラーの段階的移行 (第2週)
1. ✅ 成功・エラー・警告メッセージのみを移行
2. ✅ 動作確認
3. ✅ 問題なければ他のセマンティックカラーも移行

### フェーズ3: コンテキストカラーの整理 (第3週)
1. ✅ LINE機能の色を `lineColors` に統一
2. ✅ 役職別色を `roleColors` で管理
3. ✅ 画面固有の色を `screenGradients` で管理

### フェーズ4: ドキュメント整備 (第4週)
1. ✅ 使い方ガイド作成
2. ✅ Storybookでの可視化 (オプション)
3. ✅ チームへの説明会

---

## メリット

### ✅ 意味のある分類
- セマンティック・コンテキスト・ニュートラルの3分類で、「何を変えるべきか」が明確
- LINE緑などの文脈依存色が失われない

### ✅ 段階的な移行
- 一気に全置換せず、セマンティックカラーから段階的に移行
- 各フェーズで動作確認可能

### ✅ 柔軟性
- テナントごとにセマンティックカラーだけを変更可能
- コンテキストカラーは機能の識別性を保つため固定

### ✅ 保守性
- 新しいコードでは `theme/` を直接使用
- 既存コードは `colors.js` 経由で動作継続

---

## 次のステップ

1. **この提案の承認**: 方向性が合っているか確認
2. **フェーズ1実装**: トークンファイルの作成
3. **サンプル移行**: 1画面だけ移行してレビュー
4. **全体移行**: 承認後、段階的に全画面を移行

---

## 参考資料

- [Material Design - Color System](https://m3.material.io/styles/color/overview)
- [Tailwind CSS - Customizing Colors](https://tailwindcss.com/docs/customizing-colors)
- [Adobe Spectrum - Design Tokens](https://spectrum.adobe.com/page/design-tokens/)
