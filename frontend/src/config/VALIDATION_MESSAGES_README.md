# バリデーションメッセージ管理

## 概要

全てのバリデーションエラー・警告メッセージは `src/config/validationMessages.js` で一元管理されています。

## メッセージマスタの構造

```javascript
export const ERROR_MESSAGES = {
  VAL001: {
    code: 'VAL001',
    category: '法令',
    template: '18歳未満のスタッフ「{staffName}」は深夜時間帯(22:00-05:00)に配置できません',
    lawReference: '労働基準法第61条',
    level: 'ERROR',
    autoAction: '自動削除',
  },
  // ... 他のメッセージ
}
```

## 使い方

### 1. エラーメッセージの作成

```javascript
import { createError, createWarning } from '../config/validationMessages.js'

// エラーを作成
const error = createError(
  'VAL001', // メッセージコード
  {
    // コンテキスト情報
    shift_id: shift.shift_id,
    staff_id: shift.staff_id,
    shift_date: shift.shift_date,
  },
  {
    // テンプレートパラメータ
    staffName: staff.name,
  }
)

// 警告を作成
const warning = createWarning(
  'VAL004',
  {
    shift_id: shift.shift_id,
    staff_id: shift.staff_id,
  },
  {
    intervalHours: 10.5,
  }
)
```

### 2. メッセージ情報の取得

```javascript
import { getMessageInfo, formatMessage } from '../config/validationMessages.js'

// メッセージ情報を取得
const info = getMessageInfo('VAL001')
console.log(info.lawReference) // '労働基準法第61条'

// メッセージをフォーマット
const formatted = formatMessage('VAL001', { staffName: '田中太郎' })
console.log(formatted.message)
// '18歳未満のスタッフ「田中太郎」は深夜時間帯(22:00-05:00)に配置できません'
```

### 3. カテゴリ・レベル別の取得

```javascript
import { getMessagesByCategory, getMessagesByLevel } from '../config/validationMessages.js'

// カテゴリ別
const lawMessages = getMessagesByCategory('法令')
// ['VAL001', 'VAL002', 'VAL003', ...]

// レベル別
const errorMessages = getMessagesByLevel('ERROR')
// ['VAL001', 'VAL002', 'LAW_001', ...]
```

## メッセージコード一覧

### shift_validation_rules.csv 対応

- **VAL001-VAL015**: シフトバリデーションルール
  - VAL001: 18歳未満深夜勤務禁止
  - VAL002: 法定労働時間超過
  - VAL003: 休憩時間不足
  - VAL004: 勤務間インターバル不足
  - VAL005: 36協定上限超過
  - その他...

### labor_law_constraints.csv 対応

- **LAW_001-LAW_012**: 労働法制約
  - LAW_001: 1日労働時間上限
  - LAW_002: 週間労働時間上限
  - LAW_007: 年少者労働時間制限
  - LAW_008: 年少者深夜労働禁止
  - その他...

### labor_management_rules.csv 対応

- **LM001-LM015**: 労務管理ルール
  - LM001: 土日勤務偏り
  - LM002: 希望シフト反映率
  - LM004: 連続勤務日数（警告）
  - LM005: 連続勤務日数（エラー）
  - その他...

### システムエラー

- **STAFF_NOT_FOUND**: スタッフマスタ不在
- **INVALID_DATA**: データ不正

## メッセージの追加方法

1. `src/config/validationMessages.js` の `ERROR_MESSAGES` に新しいエントリを追加

```javascript
export const ERROR_MESSAGES = {
  // ... 既存のメッセージ

  NEW_RULE_001: {
    code: 'NEW_RULE_001',
    category: '安全',
    template: '新しいルール: {param1} が {param2} を超えています',
    lawReference: '関連法令',
    level: 'ERROR',
    autoAction: 'ブロック',
  },
}
```

2. バリデーターで使用

```javascript
const error = createError('NEW_RULE_001', { shift_id: 123 }, { param1: '値1', param2: '値2' })
```

## テンプレート変数の命名規則

- **キャメルケース**を使用: `{staffName}`, `{intervalHours}`
- **わかりやすい名前**を使用: `{maxHours}` より `{maxWeeklyHours}`
- **数値は単位を明記**: `{hours}`, `{days}`, `{rate}`

## メッセージレベル

- **ERROR**: 必須制約違反（シフト確定不可）
- **WARNING**: 推奨制約違反（要確認）
- **INFO**: 情報提供のみ

## 多言語対応の準備

将来的に多言語対応する場合は、以下のように拡張可能:

```javascript
export const ERROR_MESSAGES = {
  VAL001: {
    code: 'VAL001',
    category: '法令',
    template: {
      ja: '18歳未満のスタッフ「{staffName}」は...',
      en: 'Staff "{staffName}" under 18 cannot...',
    },
    lawReference: {
      ja: '労働基準法第61条',
      en: 'Labor Standards Act Article 61',
    },
  },
}
```

## 注意事項

1. **メッセージの変更は慎重に**: 既存のメッセージを変更すると、ログやレポートの一貫性が失われる可能性があります
2. **コードの削除禁止**: 使用されていないように見えても、過去のデータ参照のために残す
3. **テンプレート変数の型**: 文字列として扱うため、数値は適切にフォーマットしてから渡す

## テスト方法

```bash
# 開発サーバー起動
npm run dev

# テストページにアクセス
http://localhost:5174/test-validator.html
```

バリデーション実行ボタンをクリックすると、全メッセージが正しくフォーマットされているか確認できます。
