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

## Phase 3: フロントエンド修正 ✅ 完了

### 3.1 Repository層 ✅
**ファイル**: `frontend/src/infrastructure/repositories/ShiftRepository.js`
- `getPreferences()`: パラメータ変更（year,month → dateFrom,dateTo,isNg）✅
- `savePreferencesBulk()`: 新規追加（bulk API対応）✅

### 3.2 画面コンポーネント ✅

| ファイル | 修正内容 |
|---------|---------|
| `LineShiftInput.jsx` | ✅ loadShiftPreferences(), handleSubmit() を新API形式に対応 |
| `Monitoring.jsx` | ✅ loadAvailabilityData() を新API形式（date_from,date_to, preference_date, is_ng）に対応 |
| `MultiStoreShiftTable.jsx` | ✅ getStaffPreferenceForDate(), isPreferredDay(), isNgDay() を新API形式に対応 |
| `FirstPlanEditor.jsx` | ✅ checkPreference() を新API形式（preference_date, is_ng）に対応 |
| `SecondPlanEditor.jsx` | ✅ getPreferences() 呼び出しとcheckPreferenceConflicts() を新API形式に対応 |

### 3.3 共通コンポーネント ✅

| ファイル | 修正内容 |
|---------|---------|
| `ShiftTimeline.jsx` | ✅ timeToMinutes() 関数修正（"25:00"形式対応、null安全対策） |
| `ShiftTableView.jsx` | ✅ timeToMinutes() 関数修正（"25:00"形式対応、null安全対策） |
| `TimeInput.jsx` | ✅ **新規作成** - 24時超過対応カスタム時刻入力（5:00〜28:00、compactモード対応） |
| `StaffTimeTable.jsx` | ✅ インライン編集をTimeInputコンポーネントに置換 |

### 3.4 ユーティリティ ✅
**ファイル**: `frontend/src/utils/shiftInputCollector.js`
- ✅ API呼び出し修正（date_from,date_to）
- ✅ データ変換処理修正（preference_date, is_ng, start_time, end_time）

### 3.5 時刻入力コンポーネント適用 ✅

| ファイル | 修正内容 |
|---------|---------|
| `ShiftPatternSelector.jsx` | ✅ カスタム時間入力をTimeInputに置換 |
| `FirstPlanEditor.jsx` | ✅ 開始/終了時刻入力をTimeInputに置換 |
| `SecondPlanEditor.jsx` | ✅ 開始/終了時刻入力をTimeInputに置換 |
| `MasterDataManagement.jsx` | ✅ 営業時間・シフトパターン時刻入力をTimeInputに置換 |

### 3.6 バックエンド時刻計算ユーティリティ ✅
**ファイル**: `backend/src/utils/timeUtils.js` **新規作成**
- ✅ `timeToMinutes()` - VARCHAR(5)形式を分に変換
- ✅ `minutesToTime()` - 分をVARCHAR(5)形式に変換
- ✅ `calculateWorkHours()` - 勤務時間計算（休憩時間対応）
- ✅ `calculateWorkHoursFixed()` - 小数点2桁で丸めた勤務時間計算
- ✅ `formatDateToYYYYMMDD()` - DateオブジェクトをJSTでYYYY-MM-DD形式に変換

**ファイル**: `backend/src/routes/shifts.js`
- ✅ timeUtils関数をインポートして使用
- ✅ Summary API修正（EXTRACT(EPOCH)からCOALESCEに変更）

### 3.7 UTC→JST タイムゾーン修正 ✅
**問題**: `toISOString().split('T')[0]` や `split('T')[0]` を使うとUTCで日付が変換され、JSTと1日ずれる

#### フロントエンド ✅
**ファイル**: `frontend/src/utils/dateUtils.js`
- ✅ `isoToJSTDateString()` - ISO日時文字列をJSTのYYYY-MM-DD形式に変換
- ✅ `isoToJSTDateParts()` - ISO日時文字列からJSTのyear/month/dayを取得
- ✅ `toZonedTime`を使用して環境（UTC/JST）に依存しない実装に修正

**修正したコンポーネント:**
| ファイル | 修正内容 |
|---------|---------|
| `shiftInputCollector.js` | ✅ preference_dateパース処理 |
| `MultiStoreShiftTable.jsx` | ✅ getStaffPreferenceForDate() |
| `FirstPlanEditor.jsx` | ✅ checkPreference() |
| `LineShiftInput.jsx` | ✅ loadShiftPreferences() |
| `SecondPlanEditor.jsx` | ✅ checkPreferenceConflicts() |
| `Monitoring.jsx` | ✅ getDayShifts(), getCalendarData(), loadAvailabilityData() |

#### バックエンド ✅
**ファイル**: `backend/src/utils/timeUtils.js`
- ✅ `formatDateToYYYYMMDD()` 追加
- ✅ `toZonedTime`を使用して環境（UTC/JST）に依存しない実装に修正

**ファイル**: `backend/src/routes/shifts.js`
- ✅ `toISOString().split('T')[0]` → `formatDateToYYYYMMDD()` に置換（3箇所）

### 3.8 バグ修正 ✅

#### LineShiftInput.jsx ✅
- ✅ bulk APIリクエスト形式修正（tenant_id, store_id, staff_idをトップレベルに移動）
- ✅ シフトパターン時刻のVARCHAR(5)形式変換（substring(0, 5)で秒を削除）

#### StaffTimeTable.jsx ✅
- ✅ 時刻保存時の`:00`追加を削除（VARCHAR(5)形式対応）

#### SecondPlanEditor.jsx ✅
- ✅ 表示用時刻の`.replace(':00', '')`を削除（VARCHAR(5)形式対応）

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
