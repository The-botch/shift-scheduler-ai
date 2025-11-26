# シフト関連テーブル構造変更 - 実装計画

## 概要
設計書: `docs/design-docs/20251126_shift_preferences_schema_change.html`

### 変更対象
1. **ops.shift_preferences**: 1日1レコード形式に変更
2. **ops.shifts**: TIME→VARCHAR(5)、pattern_id NULL許可

---

## Phase 1: データベース変更 ✅ 完了

### 1.1 schema.sql の修正 ✅
**ファイル**: `scripts/database/ddl/schema.sql`

#### shifts テーブル
```sql
-- 変更前
pattern_id INT NOT NULL,
start_time TIME NOT NULL,
end_time TIME NOT NULL,

-- 変更後
pattern_id INT,                    -- NULL許可
start_time VARCHAR(5) NOT NULL,    -- "09:00", "25:00"
end_time VARCHAR(5) NOT NULL,      -- "18:00", "26:00"
```

#### shift_preferences テーブル
```sql
-- 完全に再定義（新構造）
CREATE TABLE ops.shift_preferences (
    preference_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    staff_id INT NOT NULL,
    preference_date DATE NOT NULL,
    is_ng BOOLEAN NOT NULL DEFAULT FALSE,
    start_time VARCHAR(5),
    end_time VARCHAR(5),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_preference_per_staff_date UNIQUE (tenant_id, staff_id, preference_date)
);
```

#### インデックス変更
- `idx_shift_preferences_period(year, month)` → `idx_shift_preferences_date(preference_date)`
- `idx_shift_preferences_is_ng(is_ng)` 追加

### 1.2 setup_tenant3_test_data.mjs の修正 ✅
**ファイル**: `scripts/database/setup/setup_tenant3_test_data.mjs`

- 時刻フォーマット: HH:MM:SS → HH:MM形式（VARCHAR(5)対応）
- `pattern_id` を `null` に変更

### 1.3 STG DB反映 ✅
- `node scripts/run-ddl-dml-stg.mjs` 実行完了
- テーブル構造確認済み

### 1.4 マイグレーションスクリプト
~~**ファイル**: `scripts/database/migrations/001_shift_schema_change.sql`~~
→ 今回はSTG環境のため、DDL/DMLスクリプトを直接修正して再実行する方式に変更

---

## Phase 2: バックエンドAPI修正 ✅ 完了

### 2.1 shifts.js の修正 ✅
**ファイル**: `backend/src/routes/shifts.js`

#### 修正したエンドポイント

| エンドポイント | 修正内容 |
|---------------|---------|
| `GET /api/shifts/preferences` | ✅ クエリパラメータ: year,month → date_from,date_to, is_ng |
| `GET /api/shifts/preferences/:id` | ✅ レスポンス構造変更 |
| `POST /api/shifts/preferences` | ✅ リクエストボディ変更（preference_date, is_ng, start_time, end_time） |
| `PUT /api/shifts/preferences/:id` | ✅ リクエストボディ変更（is_ng, start_time, end_time, notes） |
| `DELETE /api/shifts/preferences/:id` | ✅ レスポンス構造変更（preference_date） |
| `POST /api/shifts/preferences/bulk` | ✅ 新規追加（一括登録、UPSERT対応） |

### 2.2 vector-store.js の確認 ✅
**ファイル**: `backend/src/routes/vector-store.js`
- SELECT * のため変更不要（新カラムは自動取得）

### 2.3 動作確認 ✅
- GET/POST/PUT/DELETE/bulk 全て正常動作を確認

---

## Phase 3: フロントエンド修正

### 3.1 Repository層
**ファイル**: `frontend/src/infrastructure/repositories/ShiftRepository.js`
- `getPreferences()`: パラメータ変更（year,month → dateFrom,dateTo）
- レスポンスデータ構造の対応

### 3.2 画面コンポーネント

| ファイル | 修正内容 |
|---------|---------|
| `LineShiftInput.jsx` | API対応、時刻入力UI（24時超過対応） |
| `Monitoring.jsx` | 新構造での表示処理 |
| `MultiStoreShiftTable.jsx` | isPreferredDay/isNgDay関数修正 |
| `FirstPlanEditor.jsx` | 希望シフト参照処理修正 |
| `SecondPlanEditor.jsx` | 希望シフト参照処理修正 |

### 3.3 共通コンポーネント

| ファイル | 修正内容 |
|---------|---------|
| `ShiftTimeline.jsx` | timeToMinutes()関数修正（"25:00"形式対応） |
| `ShiftPatternSelector.jsx` | 時刻入力UI（24時超過対応） |

### 3.4 ユーティリティ
**ファイル**: `frontend/src/utils/shiftInputCollector.js`
- API呼び出し修正
- データ変換処理修正

---

## Phase 4: その他

### 4.1 ドキュメント更新
- `docs/DATABASE_SCHEMA.md`

### 4.2 デバッグスクリプト
- `scripts/debug/export_transaction_data.mjs`
- `scripts/debug/verify_columns.mjs`

### 4.3 デモデータ
- `fixtures/demo_data/transactions/shift_preferences_*.csv` 再生成

---

## 実装順序

| # | タスク | 依存 |
|---|--------|------|
| 1 | schema.sql 修正 | - |
| 2 | マイグレーションスクリプト作成 | 1 |
| 3 | バックエンド: shifts.js preferences API修正 | 2 |
| 4 | バックエンド: shifts.js shifts関連修正（pattern_id NULL対応） | 2 |
| 5 | バックエンド: 一括登録API追加 | 3 |
| 6 | フロントエンド: ShiftRepository.js | 3 |
| 7 | フロントエンド: 時刻入力共通コンポーネント作成 | - |
| 8 | フロントエンド: LineShiftInput.jsx | 6, 7 |
| 9 | フロントエンド: ShiftTimeline.jsx | - |
| 10 | フロントエンド: MultiStoreShiftTable.jsx | 6 |
| 11 | フロントエンド: Monitoring.jsx | 6 |
| 12 | フロントエンド: FirstPlanEditor.jsx, SecondPlanEditor.jsx | 6 |
| 13 | ドキュメント・デモデータ更新 | 1-12 |
| 14 | 統合テスト | 1-13 |

---

## 注意事項

1. **破壊的変更**: API互換性がないため、フロントエンド/バックエンドを同時にデプロイ必要
2. **データ移行**: 既存データのバックアップ必須（shift_preferences_old として保持）
3. **時刻形式**: 05:00〜28:00の範囲を想定（バリデーションは別タスク）
4. **pattern_id**: 既存データは保持、新規データはNULL可

---

## 見積もり（参考）

- Phase 1（DB）: 小
- Phase 2（バックエンド）: 中
- Phase 3（フロントエンド）: 大
- Phase 4（その他）: 小

**合計**: 中〜大規模の変更
