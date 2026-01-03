# FirstPlanEditor / SecondPlanEditor 共通化設計書

## 概要

FirstPlanEditorとSecondPlanEditorで重複していた状態・ハンドラーを共通フック`useShiftPlanEditor`に抽出し、保守性とコードの一貫性を向上させた。

## 背景・課題

### 問題点
1. **コード重複**: 約15個のハンドラー関数が両ファイルでほぼ同一コードで重複
2. **保守性の低下**: バグ修正時に両方を修正する必要がある
3. **一貫性の欠如**: 同じ機能でも微妙に実装が異なるケースがあった
4. **可読性の問題**: 各ファイルが1000行以上で見通しが悪い

### きっかけ
- handleBackのプラン削除ロジックがSecondPlanEditorにのみ存在しないバグ
- 二重確認ダイアログの問題を両エディタで修正する必要があった

## 設計

### アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    FirstPlanEditor.jsx                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 特有機能:                                       │    │
│  │ - loadInitialData (前月コピーデータの初期化)    │    │
│  │ - handleSaveDraft (unsaved状態処理)             │    │
│  │ - handleApprove (unsaved状態処理)               │    │
│  └─────────────────────────────────────────────────┘    │
│                          ↓                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │            useShiftPlanEditor (共通)            │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   SecondPlanEditor.jsx                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 特有機能:                                       │    │
│  │ - firstPlanShifts (第1案との比較表示)           │    │
│  │ - monthlyComments / commentsMap                 │    │
│  │ - conflicts / checkPreferenceConflicts          │    │
│  │ - handlePNGExport (画像出力)                    │    │
│  │ - チャットボット関連                            │    │
│  └─────────────────────────────────────────────────┘    │
│                          ↓                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │            useShiftPlanEditor (共通)            │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  useShiftPlanEditor.js                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 共通状態:                                       │    │
│  │ - loading, calendarData, selectedDay            │    │
│  │ - dayShifts, hasSavedDraft, windowState         │    │
│  │ - shiftData, defaultPatternId, preferences      │    │
│  │ - shiftPatterns                                 │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 共通計算値:                                     │    │
│  │ - preferencesMap (O(1) lookup用)                │    │
│  │ - timeOverlapInfo (時間重複チェック)            │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 共通ハンドラー:                                 │    │
│  │ - handleDayClick, handleMaximize                │    │
│  │ - handleBack, handleDelete                      │    │
│  │ - handleUpdateShift, handleDeleteShift          │    │
│  │ - handleAddShift, handleShiftClick              │    │
│  │ - handleModalSave, handleModalDelete            │    │
│  │ - handleExportCSV                               │    │
│  │ - navigateToDashboard, handleDashboard          │    │
│  └─────────────────────────────────────────────────┘    │
│                          ↓                               │
│  ┌───────────────────┐  ┌───────────────────────┐       │
│  │ useShiftEditorBase│  │   useShiftEditing     │       │
│  │ (マスタデータ)    │  │ (シフト編集・保存)    │       │
│  └───────────────────┘  └───────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 共通化した機能一覧

#### 状態（State）

| 状態名 | 型 | 説明 |
|--------|-----|------|
| loading | boolean | データ読み込み状態 |
| calendarData | object | カレンダー表示データ |
| selectedDay | number | 選択日 |
| selectedStoreId | number | 選択店舗ID |
| dayShifts | array | 選択日のシフト |
| hasSavedDraft | boolean | 下書き保存フラグ |
| windowState | object | ウィンドウ状態 |
| shiftData | array | シフトデータ |
| defaultPatternId | number | デフォルトパターン |
| preferences | array | 希望シフト |
| shiftPatterns | array | シフトパターンマスタ |

#### 計算値（Computed）

| 値名 | 説明 |
|------|------|
| preferencesMap | 希望シフトをMap化（O(1) lookup） |
| timeOverlapInfo | 時間重複情報 |

#### ハンドラー

| ハンドラー名 | 説明 |
|-------------|------|
| navigateToDashboard | ダッシュボード遷移 |
| handleDashboard | ダッシュボードボタン |
| handleBack | 戻るボタン（未保存確認、プラン削除含む） |
| handleDelete | プラン削除 |
| handleDayClick | 日付クリック |
| handleMaximize | ウィンドウ最大化 |
| handleUpdateShift | シフト更新 |
| handleDeleteShift | シフト削除 |
| handleAddShift | シフト追加 |
| handleShiftClick | シフトクリック |
| handleModalSave | モーダル保存 |
| handleModalDelete | モーダル削除 |
| handleExportCSV | CSVエクスポート |

### 引数の差異吸収

First/Secondで異なるコールバック名を吸収：

```javascript
// フック内部
const goBack = onBack || onPrev

// 使用時
if (goBack) goBack()
```

| FirstPlanEditor | SecondPlanEditor | フック内部 |
|-----------------|------------------|------------|
| onBack | onPrev | goBack |
| onApprove | onNext | onApproveComplete |
| onDelete | - | onDelete |

### planTypeによる分岐

フック内部でplanTypeに応じた処理を分岐：

```javascript
// 確認メッセージの文言
const confirmMsg = planType === 'SECOND'
  ? 'この第2案シフト計画を破棄してもよろしいですか？'
  : 'このシフト計画を破棄してもよろしいですか？'

// 削除完了メッセージ
if (planType === 'SECOND') {
  alert('第2案を削除しました')
}
```

## ファイル変更一覧

| ファイル | 変更内容 |
|----------|----------|
| `frontend/src/hooks/useShiftPlanEditor.js` | 新規作成 |
| `frontend/src/components/screens/shift/FirstPlanEditor.jsx` | リファクタリング（約300行削減） |
| `frontend/src/components/screens/shift/SecondPlanEditor.jsx` | リファクタリング（約200行削減） |

## 動作確認項目

### FirstPlanEditor

- [ ] 第1案の新規作成
- [ ] 第1案の編集・保存
- [ ] 第1案の承認
- [ ] 第1案の削除
- [ ] 戻るボタン（未保存変更がある場合の確認ダイアログ）
- [ ] 戻るボタン（DRAFT状態でのプラン削除確認）
- [ ] シフト追加・編集・削除
- [ ] CSVエクスポート
- [ ] カレンダービューの最大化・復元
- [ ] 日付クリックでのタイムライン表示

### SecondPlanEditor

- [ ] 第2案の新規作成（第1案コピー）
- [ ] 第2案の編集・保存
- [ ] 第2案の承認
- [ ] 第2案の削除
- [ ] 戻るボタン（未保存変更がある場合の確認ダイアログ）
- [ ] 戻るボタン（DRAFT状態でのプラン削除確認）
- [ ] シフト追加・編集・削除
- [ ] CSVエクスポート
- [ ] PNG画像出力
- [ ] 希望シフトとの突合表示
- [ ] カレンダービューの最大化・復元
- [ ] 日付クリックでのタイムライン表示

### 共通確認

- [ ] 時間重複チェック表示
- [ ] 店舗選択切り替え
- [ ] 希望シフト色分け表示

## 今後の改善案

1. **handleSaveDraft/handleApproveの共通化**
   - 現在はunsaved状態の処理がFirst/Secondで異なるためローカルに保持
   - 将来的には共通化を検討

2. **モーダル処理の統一**
   - openModal/closeModal と setModalState の使い分けを整理

3. **TypeScript化**
   - 型定義を追加してより堅牢に

## 関連コミット

- `refactor: FirstPlanEditorとSecondPlanEditorの共通化`
- `style: Prettierフォーマット修正`

## 作成日

2026-01-04
