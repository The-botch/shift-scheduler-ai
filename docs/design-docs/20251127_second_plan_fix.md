# 第2案シフトプラン作成機能の修正

## 概要

第2案（SECOND plan）のシフトプラン作成・保存・承認時に、誤って第1案（FIRST plan）が更新されてしまうバグを修正。

## 修正日

2025年11月27日

## 問題の背景

### 発生していた問題

1. SecondPlanEditorで「下書き保存」または「承認」を実行すると、第2案ではなく第1案のデータが更新される
2. 第2案として新規プランが作成されず、既存の第1案プランが上書きされる
3. 承認後のステータスも第1案が「承認済み」になる

### 根本原因

`ShiftRepository.createPlansWithShifts()` メソッドで `plan_type` パラメータがバックエンドに送信されていなかった。

```javascript
// 修正前（問題のあるコード）
async createPlansWithShifts(data) {
  const { target_year, target_month, created_by, stores, tenantId = null } = data
  // plan_type が抽出されていない！

  body: JSON.stringify({
    tenant_id: actualTenantId,
    target_year,
    target_month,
    created_by,
    stores,
    // plan_type が送信されていない！
  }),
}
```

バックエンドはデフォルトで `plan_type = 'FIRST'` を使用するため、常に第1案として処理されていた。

## 修正内容

### 1. ShiftRepository.js

`plan_type` パラメータを必須化し、バックエンドに送信するよう修正。

```javascript
// 修正後
async createPlansWithShifts(data) {
  const { target_year, target_month, created_by, stores, tenantId = null, plan_type } = data

  if (!plan_type) {
    throw new Error('plan_type is required')
  }

  body: JSON.stringify({
    tenant_id: actualTenantId,
    target_year,
    target_month,
    created_by,
    stores,
    plan_type,  // 追加
  }),
}
```

### 2. FirstPlanEditor.jsx

`createPlansWithShifts()` 呼び出し時に `plan_type: 'FIRST'` を明示的に指定。

```javascript
const result = await shiftRepository.createPlansWithShifts({
  target_year: year,
  target_month: month,
  created_by: 1,
  stores: mergedStores,
  plan_type: 'FIRST',  // 追加
})
```

### 3. SecondPlanEditor.jsx

大幅な書き直しを実施。

#### 主な変更点

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| ベース構造 | 独自実装 | FirstPlanEditorベース |
| plan_type | 未指定 | 'SECOND' を明示的に指定 |
| 削除機能 | なし | 削除ボタン追加 |
| 表示モード | 第1案/第2案/比較切り替え | 第2案のみ表示 |
| シフトID | 第1案のIDをそのまま使用 | temp_second_xxx 形式で新規生成 |

#### 削除ハンドラーの追加

```javascript
const handleDelete = async () => {
  let planIdsToDelete = []
  if (planIdsState.length > 0) {
    planIdsToDelete = [...planIdsState]
  } else {
    if (onPrev) { onPrev() }
    return
  }

  // 確認ダイアログ
  if (!confirm('この第2案シフト計画を削除してもよろしいですか？')) {
    return
  }

  // 削除処理
  const deletePromises = planIdsToDelete.map(async id => {
    const url = `${BACKEND_API_URL}/api/shifts/plans/${id}?tenant_id=${tenantId}`
    const response = await fetch(url, { method: 'DELETE' })
    // ...
  })

  await Promise.all(deletePromises)
  alert('第2案を削除しました')
  if (onPrev) { onPrev() }
}
```

### 4. main.jsx

SecondPlanEditorWrapper に `onNext` / `onPrev` コールバックを追加。

```javascript
const SecondPlanEditorWrapper = () => {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <SecondPlanEditor
      selectedShift={location.state?.shift}
      onNext={() => navigate('/')}
      onPrev={() => navigate(-1)}
    />
  )
}
```

### 5. useShiftEditing.js（新規作成）

シフト編集の共通ロジックを抽出したカスタムフック。

```javascript
export const useShiftEditing = ({ planType = 'FIRST', onApproveComplete, updateLocalUI } = {}) => {
  const [modifiedShifts, setModifiedShifts] = useState({})
  const [deletedShiftIds, setDeletedShiftIds] = useState(new Set())
  const [addedShifts, setAddedShifts] = useState([])
  // ...

  return {
    handleDeleteShift,
    handleAddShift,
    handleModifyShift,
    saveChanges,
    saveDraft,
    approve,
    deletePlan,
    // ...
  }
}
```

## データフロー

### 第2案作成フロー

```
SecondPlanEditor
    ↓
createPlansWithShifts({ plan_type: 'SECOND', ... })
    ↓
ShiftRepository (plan_type を送信)
    ↓
Backend API (/api/shifts/plans/create-with-shifts)
    ↓
既存プランチェック (WHERE plan_type = 'SECOND')
    ↓
新規SECONDプラン作成 or 既存SECOND更新
```

### バックエンドの既存プランチェック

```sql
SELECT plan_id, status, plan_type FROM ops.shift_plans
WHERE tenant_id = $1 AND store_id = $2
  AND plan_year = $3 AND plan_month = $4
  AND plan_type = $5  -- 'FIRST' または 'SECOND'
```

## テスト観点

- [ ] 第1案の下書き保存が正常に動作すること
- [ ] 第1案の承認が正常に動作すること
- [ ] 第2案の下書き保存で新規SECONDプランが作成されること
- [ ] 第2案の承認で新規SECONDプランが作成・承認されること
- [ ] 第2案の削除が正常に動作すること
- [ ] 第1案を更新しても第2案に影響しないこと
- [ ] 第2案を更新しても第1案に影響しないこと

## 関連コミット

1. `6c58362` - fix(shift): 第2案プラン作成時にFIRSTではなくSECONDプランを正しく作成するよう修正
2. `65c7298` - chore: デバッグ用console.logを削除

## 今後の課題

1. **第1案更新時の第2案への反映**: 現在は第1案が更新されても第2案には反映されない。必要に応じて「第1案から再コピー」機能の追加を検討。

2. **比較モードの再実装**: 今回削除した比較モードを、将来的に別の形で再実装する可能性あり。
