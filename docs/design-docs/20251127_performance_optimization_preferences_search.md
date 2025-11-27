# シフトテーブル検索パフォーマンス最適化設計書

## 概要

MultiStoreShiftTable.jsxおよび関連コンポーネントで発生しているO(n)検索のパフォーマンス問題を修正する。

## 問題分析

### 現状の問題

`MultiStoreShiftTable.jsx`内の以下の関数が、各セルレンダリング時にO(n)の線形検索を実行している：

1. **`getShiftForDateAndStaff()`** (line 67-75)
   - `shiftData.find()` を使用
   - 各セルで呼び出される

2. **`getConflict()`** (line 223-229)
   - `conflicts.find()` を使用
   - 各セルで呼び出される

3. **`getHopeShift()`** (line 232-240)
   - `hopeShifts.find()` を使用
   - 各セルで呼び出される

4. **`getStaffPreferenceForDate()`** (line 244-250)
   - `preferences.find()` を使用
   - 各セルで呼び出される

### パフォーマンス影響

- **セル数**: 31日 × 50スタッフ = 約1,550セル
- **呼び出し回数**: 1セルあたり複数回（getShiftForDateAndStaff は多箇所で呼び出し）
- **合計呼び出し**: 約20,000回のO(n)検索
- **データ量**: preferencesは2,796レコード（実測値）
- **比較回数**: 20,000 × 2,796 = 約5,600万回

## 解決策

### useMemo + Map による O(1) 検索への変換

各検索対象データを `useMemo` フックで Map 構造に変換し、O(1) でアクセスできるようにする。

### 実装計画

#### 1. shiftDataMap

```javascript
const shiftDataMap = useMemo(() => {
  const map = new Map()
  shiftData.forEach(shift => {
    if (shift.shift_date) {
      const dateStr = shift.shift_date.substring(0, 10)
      const key = `${dateStr}_${shift.staff_id}`
      map.set(key, shift)
    }
  })
  return map
}, [shiftData])
```

#### 2. conflictsMap

```javascript
const conflictsMap = useMemo(() => {
  const map = new Map()
  conflicts.forEach(c => {
    const key = `${c.date}_${c.staffId}`
    map.set(key, c)
  })
  return map
}, [conflicts])
```

#### 3. hopeShiftsMap

```javascript
const hopeShiftsMap = useMemo(() => {
  const map = new Map()
  hopeShifts.forEach(hope => {
    if (hope.shift_date) {
      const dateStr = hope.shift_date.substring(0, 10)
      const key = `${dateStr}_${hope.staff_id}`
      map.set(key, hope)
    }
  })
  return map
}, [hopeShifts])
```

#### 4. preferencesMap

```javascript
const preferencesMap = useMemo(() => {
  const map = new Map()
  preferences.forEach(pref => {
    const prefDate = isoToJSTDateString(pref.preference_date)
    const key = `${pref.staff_id}_${prefDate}`
    map.set(key, pref)
  })
  return map
}, [preferences])
```

### 検索関数の変更

変更前（O(n)）:
```javascript
const getShiftForDateAndStaff = (date, staffId) => {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
  return shiftData.find(
    shift =>
      shift.shift_date &&
      shift.shift_date.startsWith(dateStr) &&
      parseInt(shift.staff_id) === parseInt(staffId)
  )
}
```

変更後（O(1)）:
```javascript
const getShiftForDateAndStaff = (date, staffId) => {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
  return shiftDataMap.get(`${dateStr}_${staffId}`)
}
```

## 対象ファイル

1. **frontend/src/components/shared/MultiStoreShiftTable.jsx**
   - 全4つのMap追加
   - 検索関数の修正

2. **frontend/src/components/screens/shift/FirstPlanEditor.jsx**
   - preferencesMap追加（該当する場合）

3. **frontend/src/components/screens/shift/SecondPlanEditor.jsx**
   - preferencesMap追加（該当する場合）

## 期待される効果

- **検索計算量**: O(n) → O(1)
- **総比較回数**: 約5,600万回 → 約20,000回（Map.get()）
- **体感速度**: 数秒のラグ → 即座のレンダリング

## 注意点

- Mapのキー生成時にstaffIdの型を統一する（parseInt不要、文字列比較で統一）
- isoToJSTDateString()は既存のdateUtils.jsの関数を使用
- 既存の振る舞いを変更しないよう、返り値は同一のオブジェクトを返す
