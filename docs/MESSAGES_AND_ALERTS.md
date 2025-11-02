# メッセージ・アラート管理ドキュメント

## 概要

このシステムでは、ユーザーに表示するメッセージとアラートを一元管理しています。

## ファイル構成

- `frontend/src/constants/messages.js` - メッセージ定義
- `frontend/src/constants/alerts.js` - アラート定義

## メッセージ管理 (messages.js)

### 使用方法

```javascript
import { MESSAGES, getMessage } from '../constants/messages'

// 直接参照
alert(MESSAGES.SUCCESS.SAVE) // 'データを保存しました'

// パスで取得
const message = getMessage('SUCCESS.SAVE') // 'データを保存しました'

// 関数型メッセージ
const message = getMessage('ERROR.AI_API_ERROR', 'タイムアウト') // 'AIアシスタントエラー: タイムアウト'
```

### メッセージカテゴリ

#### SUCCESS - 成功メッセージ
操作が成功したときに表示

#### ERROR - エラーメッセージ
エラーが発生したときに表示

#### WARNING - 警告メッセージ
ユーザーに注意を促すとき使用

#### INFO - 情報メッセージ
一般的な情報を伝えるとき使用

#### VALIDATION - バリデーションメッセージ
入力値のバリデーション時に使用

#### SHIFT - シフト関連メッセージ
シフト操作時に使用

#### AI - AI関連メッセージ
AI機能使用時に使用

#### CSV - CSV関連メッセージ
CSVインポート/エクスポート時に使用

#### AUTH - 認証関連メッセージ
ログイン/ログアウト時に使用

#### NOTIFICATION - 通知メッセージ
システム通知時に使用

### 関数型メッセージ

動的な値を含めるメッセージは関数として定義:

```javascript
VALIDATION: {
  REQUIRED: (field) => `${field}は必須です`,
  MIN_LENGTH: (field, length) => `${field}は${length}文字以上で入力してください`,
}

// 使用例
getMessage('VALIDATION.REQUIRED', 'メールアドレス') // 'メールアドレスは必須です'
getMessage('VALIDATION.MIN_LENGTH', 'パスワード', 8) // 'パスワードは8文字以上で入力してください'
```

## アラート管理 (alerts.js)

### 使用方法

```javascript
import { ALERTS, ALERT_TYPES, ALERT_SEVERITY, createAlert } from '../constants/alerts'

// アラート生成
const alert = createAlert('SHIFT.CONSTRAINT_VIOLATION')

// 動的アラート生成
const alert = createAlert('SHIFT.UNDERSTAFFED', '15', 5, 3)
// {
//   type: 'warning',
//   severity: 'high',
//   title: '人員不足',
//   message: '15日: 必要人数5名に対して3名しか配置されていません',
//   action: 'スタッフを追加してください',
//   timestamp: '2025-01-15T10:30:00.000Z',
//   id: 'SHIFT.UNDERSTAFFED_1736934600000_a1b2c3d4e'
// }
```

### アラートタイプ

| タイプ | 説明 | 用途 |
|--------|------|------|
| SUCCESS | 成功 | 処理が正常に完了 |
| ERROR | エラー | エラーが発生 |
| WARNING | 警告 | 注意が必要 |
| INFO | 情報 | 一般的な情報 |

### アラート重要度

| 重要度 | 説明 | 対応 |
|--------|------|------|
| LOW | 低 | 参考情報 |
| MEDIUM | 中 | 注意が必要 |
| HIGH | 高 | 早急な対応が必要 |
| CRITICAL | 緊急 | 即時対応が必要 |

### アラートカテゴリ

#### SHIFT - シフト関連アラート
- `CONSTRAINT_VIOLATION` - 制約違反
- `OVERLAP_DETECTED` - シフト重複
- `UNDERSTAFFED` - 人員不足
- `OVERSTAFFED` - 人員過剰
- `OVERTIME_WARNING` - 残業時間超過警告
- `REST_DAY_VIOLATION` - 休日不足
- `CONSECUTIVE_WORK_WARNING` - 連続勤務警告

#### BUDGET - 予算関連アラート
- `OVER_BUDGET` - 予算超過
- `BUDGET_WARNING` - 予算警告
- `LABOR_COST_HIGH` - 人件費率高

#### DATA - データ関連アラート
- `IMPORT_ERROR` - インポートエラー
- `EXPORT_ERROR` - エクスポートエラー
- `DATA_SYNC_ERROR` - 同期エラー
- `VALIDATION_ERROR` - バリデーションエラー

#### SYSTEM - システム関連アラート
- `NETWORK_ERROR` - ネットワークエラー
- `SESSION_EXPIRED` - セッション期限切れ
- `MAINTENANCE` - メンテナンス予告
- `UPDATE_AVAILABLE` - 更新通知

#### APPROVAL - 承認フロー関連アラート
- `PENDING_APPROVAL` - 承認待ち
- `APPROVAL_DEADLINE` - 承認期限警告
- `APPROVED` - 承認完了
- `REJECTED` - 却下

#### STAFF - スタッフ関連アラート
- `SHIFT_REQUEST_PENDING` - シフト希望未提出
- `SHIFT_REQUEST_DEADLINE` - シフト希望締切
- `SKILL_MISMATCH` - スキル不一致

### ヘルパー関数

#### createAlert(path, ...args)
アラートオブジェクトを生成

```javascript
const alert = createAlert('BUDGET.OVER_BUDGET', 1500000, 1200000)
```

#### getAlertPriority(severity)
アラート重要度を数値で取得（ソート用）

```javascript
const priority = getAlertPriority(ALERT_SEVERITY.HIGH) // 3
```

#### compareAlerts(a, b)
アラートをソートするための比較関数

```javascript
const sortedAlerts = alerts.sort(compareAlerts)
// 重要度が高い順、同じ重要度なら新しい順にソート
```

## 実装例

### メッセージの使用例

```javascript
// SecondPlan.jsx
import { MESSAGES } from '../constants/messages'

const handleApprove = async () => {
  try {
    await shiftRepository.updatePlanStatus(planId, 'SECOND_PLAN_APPROVED')
    alert(MESSAGES.SUCCESS.APPROVE_SECOND_PLAN)
  } catch (error) {
    alert(MESSAGES.ERROR.UPDATE_FAILED)
  }
}
```

### アラートの使用例

```javascript
// ShiftValidator.jsx
import { createAlert } from '../constants/alerts'

const validateShifts = (shifts) => {
  const alerts = []

  // 人員不足チェック
  if (actualCount < requiredCount) {
    alerts.push(createAlert('SHIFT.UNDERSTAFFED', date, requiredCount, actualCount))
  }

  // 予算超過チェック
  if (actualCost > budget) {
    alerts.push(createAlert('BUDGET.OVER_BUDGET', actualCost, budget))
  }

  return alerts
}
```

### アラート表示コンポーネント例

```javascript
// AlertPanel.jsx
import { compareAlerts } from '../constants/alerts'

const AlertPanel = ({ alerts }) => {
  const sortedAlerts = alerts.sort(compareAlerts)

  return (
    <div className="alert-panel">
      {sortedAlerts.map(alert => (
        <div key={alert.id} className={`alert alert-${alert.type} alert-${alert.severity}`}>
          <h4>{alert.title}</h4>
          <p>{alert.message}</p>
          {alert.action && <button>{alert.action}</button>}
          <span className="timestamp">{new Date(alert.timestamp).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}
```

## メッセージ・アラート追加ガイド

### 新しいメッセージの追加

1. `frontend/src/constants/messages.js`を開く
2. 適切なカテゴリに追加
3. 動的な値が必要な場合は関数として定義

```javascript
export const MESSAGES = {
  SHIFT: {
    NEW_MESSAGE: '新しいメッセージ',
    DYNAMIC_MESSAGE: (param1, param2) => `${param1}と${param2}`,
  },
}
```

### 新しいアラートの追加

1. `frontend/src/constants/alerts.js`を開く
2. 適切なカテゴリに追加
3. type, severity, title, message, actionを定義

```javascript
export const ALERTS = {
  SHIFT: {
    NEW_ALERT: {
      type: ALERT_TYPES.WARNING,
      severity: ALERT_SEVERITY.MEDIUM,
      title: 'アラートタイトル',
      message: 'アラートメッセージ',
      action: 'アクション名',
    },
  },
}
```

## ベストプラクティス

1. **一貫性**: 同じ操作には同じメッセージを使用
2. **明確性**: ユーザーが次に何をすべきか明確に
3. **簡潔性**: メッセージは短く分かりやすく
4. **多言語対応**: 将来的な多言語化を考慮した構造
5. **エラー処理**: エラーメッセージには具体的な原因と対処法を含める

## 注意事項

- メッセージやアラートは削除せず、非推奨としてマークする
- 既存のメッセージを変更する場合は影響範囲を確認
- 新しいカテゴリを追加する場合はチームで議論
- アラートの重要度は慎重に設定（過度な警告はユーザーの注意を散漫にする）
