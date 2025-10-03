# 年次ナビゲーションの共通化

## 背景

複数のページで年次データを扱うようになり、年選択ナビゲーション（左右矢印での年切り替え）が必要になっている。
現在、予実管理ページに個別実装されているが、今後以下のページでも同様の機能が必要：

- 予実管理ページ（実装済み）
- 営業年度を見るページ
- 実績を見るページ
- その他、年次データを扱うページ

各ページで個別実装すると保守性が低下するため、共通化の方針を検討する必要がある。

## 現状の実装

予実管理ページ（BudgetActualManagement.jsx）では以下のように実装：

```jsx
const [selectedYear, setSelectedYear] = useState(2024)

// UIパーツ
<div className="flex items-center justify-center gap-4">
  <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear - 1)}>
    <ChevronLeft className="h-4 w-4" />
  </Button>
  <div className="text-2xl font-bold">{selectedYear}年</div>
  <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear + 1)}>
    <ChevronRight className="h-4 w-4" />
  </Button>
</div>
```

## 検討ポイント

### 1. 共通化の方法

**案A: 共通コンポーネント化**
- `YearNavigator`のような再利用可能なコンポーネントを作成
- Props経由で年の状態を受け取る
- メリット: 見た目の統一、保守性向上
- デメリット: 各ページで状態管理が必要

**案B: カスタムフック化**
- `useYearNavigation`のようなフックを作成
- 年の状態管理とナビゲーションロジックを提供
- メリット: ロジックの再利用、柔軟性
- デメリット: UIは各ページで実装が必要

**案C: コンポーネント + フックの組み合わせ**
- カスタムフックで状態管理
- 共通コンポーネントでUI提供
- メリット: 両方の利点を享受
- デメリット: やや複雑

### 2. 配置場所

- ヘッダー内に配置するか
- 各ページのコンテンツ内に配置するか
- グローバルな年選択 vs ページローカルな年選択

### 3. 年の範囲制限

- 最小年・最大年を設定するか
- デフォルト年をどう決定するか（現在年、システム設定など）

### 4. データ読み込みとの連携

- 年が変更されたときのデータ読み込みをどう制御するか
- useEffectの依存配列に年を含める標準パターンを確立するか

### 5. URL連携

- 年をURLパラメータに含めるか（例: `/budget?year=2024`）
- ブラウザの戻る/進むボタンとの連携

## 提案される方向性

### Phase 1: 共通コンポーネント化

`src/components/shared/YearNavigator.jsx` を作成

```jsx
// 使用例
<YearNavigator
  year={selectedYear}
  onYearChange={setSelectedYear}
  minYear={2020}
  maxYear={2030}
/>
```

**Props:**
- `year`: 現在の年
- `onYearChange`: 年変更時のコールバック
- `minYear`: 最小年（オプション）
- `maxYear`: 最大年（オプション）
- `className`: 追加スタイル（オプション）

### Phase 2: カスタムフック追加（必要に応じて）

`src/hooks/useYearNavigation.js` を作成

```jsx
// 使用例
const { year, setYear, nextYear, prevYear, canGoNext, canGoPrev } = useYearNavigation({
  defaultYear: 2024,
  minYear: 2020,
  maxYear: 2030,
  persistKey: 'budget_year' // LocalStorageキー
})
```

### Phase 3: URL連携（必要に応じて）

React Routerのパラメータと連携し、ページリロード時も年を復元

## 影響範囲

- `src/components/screens/BudgetActualManagement.jsx`（既存実装を置き換え）
- その他、年次データを扱う画面
- `src/components/shared/` に新規コンポーネント追加
- `src/hooks/` にカスタムフック追加（Phase 2以降）

## 実装タスク

- [ ] 共通化の方針決定（案A/B/Cから選択）
- [ ] YearNavigatorコンポーネント設計・実装
- [ ] 必要に応じてuseYearNavigationフック実装
- [ ] BudgetActualManagementページを共通コンポーネントに移行
- [ ] 他のページへの適用
- [ ] ドキュメント作成

## 参考

- 現在の実装: `src/components/screens/BudgetActualManagement.jsx:1140-1152`
