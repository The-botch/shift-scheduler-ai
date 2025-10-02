# シフト管理システム MVP - プロジェクト構造

## 📁 ディレクトリ構造

```
src/
├── components/
│   ├── screens/           # 画面コンポーネント
│   │   ├── Dashboard.jsx          # ダッシュボード画面
│   │   ├── ChatModification.jsx   # チャット修正画面（インタラクティブデモ）
│   │   └── FirstPlan.jsx          # 第1案生成画面
│   ├── common/            # 共通コンポーネント
│   │   └── ShiftCalendar.jsx      # シフトカレンダー表示
│   └── ui/                # UIライブラリ（shadcn/ui）
├── hooks/                 # カスタムフック
│   ├── useShiftData.js            # シフトデータ管理
│   ├── useChat.js                 # チャット機能
│   └── use-mobile.js              # モバイル検出
├── data/                  # データとパターン
│   └── demoPatterns.js            # デモ用修正パターンとシフトデータ
├── utils/                 # ユーティリティ関数
├── lib/                   # ライブラリ設定
│   └── utils.js                   # Tailwind CSS utilities
├── App.jsx                # メインアプリケーション（ルーティング）
├── App-original.jsx       # 元の単一ファイル版（バックアップ）
└── main.jsx               # エントリーポイント
```

## 🎯 主要コンポーネント

### 画面コンポーネント (screens/)

#### Dashboard.jsx
- **機能**: システム概要、KPI表示、通知管理
- **特徴**: アニメーション付きKPIカード、リアルタイム通知
- **依存**: Framer Motion、Lucide Icons

#### ChatModification.jsx
- **機能**: インタラクティブなチャット修正デモ
- **特徴**: リアルタイムシフト変更、視覚的フィードバック
- **依存**: useChat, useShiftData, ShiftCalendar
- **デモパターン**: 5つの事前定義された修正指示

#### FirstPlan.jsx
- **機能**: AI自動シフト生成、法令チェック
- **特徴**: 3秒生成アニメーション、1ヶ月分カレンダー表示
- **依存**: ShiftCalendar, firstPlanShiftData

### 共通コンポーネント (common/)

#### ShiftCalendar.jsx
- **機能**: 再利用可能なシフトカレンダー表示
- **プロパティ**:
  - `shiftData`: シフトデータ配列
  - `changedDates`: 変更された日付のSet
  - `showPreferred`: 希望時間帯表示フラグ
- **特徴**: アニメーション、色分け表示、レスポンシブ対応

## 🔧 カスタムフック (hooks/)

### useShiftData.js
- **機能**: シフトデータの状態管理と変更処理
- **メソッド**:
  - `applyShiftChanges(changes)`: シフト変更の適用
  - `resetShiftData()`: データリセット
- **戻り値**: `{ shiftData, changedDates, applyShiftChanges, resetShiftData }`

### useChat.js
- **機能**: チャット機能の状態管理
- **パラメータ**: `onShiftChange` - シフト変更コールバック
- **特徴**: デモパターンマッチング、AI応答シミュレーション
- **戻り値**: `{ messages, inputValue, setInputValue, isTyping, sendMessage }`

## 📊 データ管理 (data/)

### demoPatterns.js
- **demoPatterns**: チャット修正用の5つのデモパターン
- **initialShiftData**: チャット修正画面用の初期シフトデータ
- **firstPlanShiftData**: 第1案生成用の30日分シフトデータ
- **secondPlanShiftData**: 第2案生成用の希望反映シフトデータ

## 🎨 スタイリング

- **Tailwind CSS**: ユーティリティファーストCSS
- **shadcn/ui**: モダンなUIコンポーネントライブラリ
- **Framer Motion**: アニメーションライブラリ
- **Lucide Icons**: アイコンライブラリ

## 🚀 開発・ビルド

```bash
# 開発サーバー起動
pnpm run dev

# プロダクションビルド
pnpm run build

# プレビュー
pnpm run preview
```

## 📝 主要な改善点

1. **保守性向上**: 単一ファイル（2400行）から適切なコンポーネント分割
2. **再利用性**: ShiftCalendarなど共通コンポーネントの抽出
3. **状態管理**: カスタムフックによるロジック分離
4. **データ分離**: デモパターンとシフトデータの外部化
5. **型安全性**: 明確なプロパティ定義とインターフェース

## 🎯 インタラクティブデモ機能

チャット修正画面では以下のデモ指示が実際にシフトを変更します：

1. **「田中さんの月曜日を休みにしてください」** → シフト削除
2. **「午前のシフトを1人増やしてください」** → スタッフ追加
3. **「土日のベテランスタッフを増やしてください」** → 複数日変更
4. **「連続勤務を3日以内に制限してください」** → 制約適用
5. **「佐藤さんの水曜日を夜勤に変更してください」** → 時間変更

各変更は即座にカレンダーに反映され、視覚的フィードバックが提供されます。
