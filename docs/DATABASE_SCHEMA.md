# データベーススキーマ設計書

**対象環境**: Railway PostgreSQL
**バージョン**: PostgreSQL 15+
**文字コード**: UTF-8

---

## 📋 目次

1. [マスターテーブル](#マスターテーブル)
2. [トランザクションテーブル](#トランザクションテーブル)
3. [実績データテーブル](#実績データテーブル)
4. [インデックス設計](#インデックス設計)
5. [外部キー制約](#外部キー制約)
6. [DDL（テーブル作成SQL）](#ddlテーブル作成sql)

---

## マスターテーブル

### 1. stores（店舗マスタ）
店舗情報を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| store_id | SERIAL | ✓ | - | 店舗ID（PK） |
| store_code | VARCHAR(50) | ✓ | - | 店舗コード（ユニーク） |
| store_name | VARCHAR(200) | ✓ | - | 店舗名 |
| address | VARCHAR(500) | | - | 住所 |
| phone_number | VARCHAR(20) | | - | 電話番号 |
| business_hours_start | TIME | | '09:00' | 営業開始時間 |
| business_hours_end | TIME | | '22:00' | 営業終了時間 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `store_id`
- UNIQUE: `store_code`

---

### 2. roles（役職マスタ）
役職情報を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| role_id | SERIAL | ✓ | - | 役職ID（PK） |
| role_code | VARCHAR(50) | ✓ | - | 役職コード（ユニーク） |
| role_name | VARCHAR(100) | ✓ | - | 役職名 |
| display_order | INT | ✓ | 0 | 表示順 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `role_id`
- UNIQUE: `role_code`

---

### 3. staff（スタッフマスタ）
スタッフ情報を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| staff_id | SERIAL | ✓ | - | スタッフID（PK） |
| store_id | INT | ✓ | - | 店舗ID（FK → stores） |
| staff_code | VARCHAR(50) | ✓ | - | スタッフコード（ユニーク） |
| name | VARCHAR(100) | ✓ | - | 氏名 |
| name_kana | VARCHAR(200) | | - | 氏名カナ |
| role_id | INT | ✓ | - | 役職ID（FK → roles） |
| email | VARCHAR(255) | | - | メールアドレス |
| phone_number | VARCHAR(20) | | - | 電話番号 |
| hire_date | DATE | | - | 入社日 |
| birth_date | DATE | | - | 生年月日 |
| employment_type | VARCHAR(20) | ✓ | 'hourly' | 雇用形態（hourly/monthly/contract） |
| hourly_rate | DECIMAL(10,2) | | NULL | 時給 |
| monthly_salary | DECIMAL(10,2) | | NULL | 月給 |
| contract_fee | DECIMAL(10,2) | | NULL | 契約料 |
| daily_cost | DECIMAL(10,2) | ✓ | 0 | 日額人件費 |
| max_hours_per_week | DECIMAL(5,2) | ✓ | 40 | 週最大労働時間 |
| min_hours_per_week | DECIMAL(5,2) | ✓ | 0 | 週最小労働時間 |
| max_consecutive_days | INT | ✓ | 6 | 最大連続勤務日数 |
| skill_level | INT | ✓ | 1 | スキルレベル（1-5） |
| commute_distance_km | DECIMAL(5,2) | | 0 | 通勤距離（km） |
| has_social_insurance | BOOLEAN | ✓ | FALSE | 社会保険加入フラグ |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `staff_id`
- UNIQUE: `staff_code`
- FOREIGN KEY: `store_id` → `stores(store_id)`
- FOREIGN KEY: `role_id` → `roles(role_id)`
- CHECK: `employment_type IN ('hourly', 'monthly', 'contract')`
- CHECK: `skill_level BETWEEN 1 AND 5`

---

### 4. skills（スキルマスタ）
スキル情報を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| skill_id | SERIAL | ✓ | - | スキルID（PK） |
| skill_code | VARCHAR(50) | ✓ | - | スキルコード（ユニーク） |
| skill_name | VARCHAR(100) | ✓ | - | スキル名 |
| category | VARCHAR(50) | | - | カテゴリ |
| description | TEXT | | - | 説明 |
| display_order | INT | ✓ | 0 | 表示順 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `skill_id`
- UNIQUE: `skill_code`

---

### 5. staff_skills（スタッフスキル中間テーブル）
スタッフとスキルの紐付け

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| staff_skill_id | SERIAL | ✓ | - | ID（PK） |
| staff_id | INT | ✓ | - | スタッフID（FK → staff） |
| skill_id | INT | ✓ | - | スキルID（FK → skills） |
| proficiency_level | INT | ✓ | 3 | 熟練度（1-5） |
| acquired_date | DATE | | - | 習得日 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `staff_skill_id`
- UNIQUE: `(staff_id, skill_id)`
- FOREIGN KEY: `staff_id` → `staff(staff_id) ON DELETE CASCADE`
- FOREIGN KEY: `skill_id` → `skills(skill_id) ON DELETE CASCADE`
- CHECK: `proficiency_level BETWEEN 1 AND 5`

---

### 6. certifications（資格マスタ）
資格情報を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| certification_id | SERIAL | ✓ | - | 資格ID（PK） |
| certification_code | VARCHAR(50) | ✓ | - | 資格コード（ユニーク） |
| certification_name | VARCHAR(200) | ✓ | - | 資格名 |
| issuing_organization | VARCHAR(200) | | - | 発行機関 |
| validity_period_months | INT | | NULL | 有効期間（月） |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `certification_id`
- UNIQUE: `certification_code`

---

### 7. staff_certifications（スタッフ資格中間テーブル）
スタッフと資格の紐付け

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| staff_certification_id | SERIAL | ✓ | - | ID（PK） |
| staff_id | INT | ✓ | - | スタッフID（FK → staff） |
| certification_id | INT | ✓ | - | 資格ID（FK → certifications） |
| acquisition_date | DATE | | - | 取得日 |
| expiration_date | DATE | | - | 有効期限 |
| certification_number | VARCHAR(100) | | - | 資格番号 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `staff_certification_id`
- FOREIGN KEY: `staff_id` → `staff(staff_id) ON DELETE CASCADE`
- FOREIGN KEY: `certification_id` → `certifications(certification_id) ON DELETE CASCADE`

---

### 8. shift_patterns（シフトパターンマスタ）
シフトパターン情報を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| pattern_id | SERIAL | ✓ | - | パターンID（PK） |
| pattern_code | VARCHAR(50) | ✓ | - | パターンコード（ユニーク） |
| pattern_name | VARCHAR(100) | ✓ | - | パターン名 |
| start_time | TIME | ✓ | - | 開始時間 |
| end_time | TIME | ✓ | - | 終了時間 |
| break_minutes | INT | ✓ | 0 | 休憩時間（分） |
| total_hours | DECIMAL(5,2) | ✓ | - | 総労働時間 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `pattern_id`
- UNIQUE: `pattern_code`

---

### 9. labor_law_constraints（労働基準法制約マスタ）
労働基準法の制約情報を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| constraint_id | SERIAL | ✓ | - | 制約ID（PK） |
| constraint_code | VARCHAR(50) | ✓ | - | 制約コード（ユニーク） |
| constraint_name | VARCHAR(200) | ✓ | - | 制約名 |
| constraint_type | VARCHAR(50) | ✓ | - | 制約タイプ |
| value | TEXT | | - | 制約値（JSON形式） |
| description | TEXT | | - | 説明 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `constraint_id`
- UNIQUE: `constraint_code`

---

### 10. store_constraints（店舗制約マスタ）
店舗別の制約情報を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| store_constraint_id | SERIAL | ✓ | - | 店舗制約ID（PK） |
| store_id | INT | ✓ | - | 店舗ID（FK → stores） |
| constraint_type | VARCHAR(50) | ✓ | - | 制約タイプ |
| constraint_value | TEXT | | - | 制約値（JSON形式） |
| priority | INT | ✓ | 0 | 優先度 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `store_constraint_id`
- FOREIGN KEY: `store_id` → `stores(store_id) ON DELETE CASCADE`

---

### 11. shift_validation_rules（シフト検証ルールマスタ）
シフト検証ルールを管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| rule_id | SERIAL | ✓ | - | ルールID（PK） |
| rule_code | VARCHAR(50) | ✓ | - | ルールコード（ユニーク） |
| rule_name | VARCHAR(200) | ✓ | - | ルール名 |
| rule_type | VARCHAR(50) | ✓ | - | ルールタイプ |
| severity | VARCHAR(20) | ✓ | 'ERROR' | 重要度（ERROR/WARNING/INFO） |
| validation_logic | TEXT | | - | 検証ロジック（JSON形式） |
| error_message | TEXT | | - | エラーメッセージ |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `rule_id`
- UNIQUE: `rule_code`
- CHECK: `severity IN ('ERROR', 'WARNING', 'INFO')`

---

## トランザクションテーブル

### 12. shift_plans（シフト計画）
シフト計画の基本情報を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| plan_id | SERIAL | ✓ | - | 計画ID（PK） |
| store_id | INT | ✓ | - | 店舗ID（FK → stores） |
| plan_year | INT | ✓ | - | 対象年 |
| plan_month | INT | ✓ | - | 対象月 |
| plan_type | VARCHAR(20) | ✓ | 'FIRST' | 計画タイプ（FIRST/SECOND） |
| status | VARCHAR(20) | ✓ | 'DRAFT' | ステータス（DRAFT/APPROVED/PUBLISHED） |
| total_labor_cost | DECIMAL(12,2) | | 0 | 総人件費 |
| total_work_hours | DECIMAL(10,2) | | 0 | 総労働時間 |
| created_by | INT | | - | 作成者（FK → staff） |
| approved_by | INT | | - | 承認者（FK → staff） |
| approved_at | TIMESTAMP | | - | 承認日時 |
| published_at | TIMESTAMP | | - | 公開日時 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `plan_id`
- UNIQUE: `(store_id, plan_year, plan_month, plan_type)`
- FOREIGN KEY: `store_id` → `stores(store_id)`
- FOREIGN KEY: `created_by` → `staff(staff_id)`
- FOREIGN KEY: `approved_by` → `staff(staff_id)`
- CHECK: `plan_type IN ('FIRST', 'SECOND')`
- CHECK: `status IN ('DRAFT', 'APPROVED', 'PUBLISHED')`
- CHECK: `plan_month BETWEEN 1 AND 12`

---

### 13. shifts（シフト）
個別のシフト情報を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| shift_id | SERIAL | ✓ | - | シフトID（PK） |
| plan_id | INT | ✓ | - | 計画ID（FK → shift_plans） |
| staff_id | INT | ✓ | - | スタッフID（FK → staff） |
| shift_date | DATE | ✓ | - | シフト日 |
| pattern_id | INT | | - | パターンID（FK → shift_patterns） |
| start_time | TIME | ✓ | - | 開始時間 |
| end_time | TIME | ✓ | - | 終了時間 |
| break_minutes | INT | ✓ | 0 | 休憩時間（分） |
| total_hours | DECIMAL(5,2) | ✓ | - | 総労働時間 |
| labor_cost | DECIMAL(10,2) | ✓ | 0 | 人件費 |
| assigned_skills | JSONB | | '[]' | 割り当てスキル（JSON配列） |
| is_preferred | BOOLEAN | ✓ | FALSE | 希望シフトフラグ |
| is_modified | BOOLEAN | ✓ | FALSE | 修正済みフラグ |
| modified_reason | TEXT | | - | 修正理由 |
| notes | TEXT | | - | 備考 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `shift_id`
- FOREIGN KEY: `plan_id` → `shift_plans(plan_id) ON DELETE CASCADE`
- FOREIGN KEY: `staff_id` → `staff(staff_id)`
- FOREIGN KEY: `pattern_id` → `shift_patterns(pattern_id)`
- INDEX: `(plan_id, shift_date)` ← 高頻度クエリ対応
- INDEX: `(staff_id, shift_date)` ← スタッフ別シフト検索

---

### 14. shift_preferences（シフト希望）
スタッフのシフト希望を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| preference_id | SERIAL | ✓ | - | 希望ID（PK） |
| staff_id | INT | ✓ | - | スタッフID（FK → staff） |
| target_year | INT | ✓ | - | 対象年 |
| target_month | INT | ✓ | - | 対象月 |
| preference_date | DATE | ✓ | - | 希望日 |
| preference_type | VARCHAR(20) | ✓ | - | 希望タイプ（WORK/OFF/MORNING/AFTERNOON/NIGHT） |
| priority | INT | ✓ | 1 | 優先度（1-5） |
| reason | TEXT | | - | 理由 |
| status | VARCHAR(20) | ✓ | 'PENDING' | ステータス（PENDING/APPROVED/REJECTED） |
| submitted_at | TIMESTAMP | | - | 提出日時 |
| reviewed_by | INT | | - | 確認者（FK → staff） |
| reviewed_at | TIMESTAMP | | - | 確認日時 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `preference_id`
- FOREIGN KEY: `staff_id` → `staff(staff_id) ON DELETE CASCADE`
- FOREIGN KEY: `reviewed_by` → `staff(staff_id)`
- CHECK: `preference_type IN ('WORK', 'OFF', 'MORNING', 'AFTERNOON', 'NIGHT')`
- CHECK: `status IN ('PENDING', 'APPROVED', 'REJECTED')`
- CHECK: `priority BETWEEN 1 AND 5`
- CHECK: `target_month BETWEEN 1 AND 12`
- INDEX: `(staff_id, target_year, target_month)`

---

### 15. availability_requests（勤務可否申請）
スタッフの勤務可否申請を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| request_id | SERIAL | ✓ | - | 申請ID（PK） |
| staff_id | INT | ✓ | - | スタッフID（FK → staff） |
| request_date | DATE | ✓ | - | 申請日 |
| availability_status | VARCHAR(20) | ✓ | - | 可否ステータス（AVAILABLE/UNAVAILABLE/PARTIAL） |
| available_from | TIME | | - | 勤務可能開始時刻 |
| available_to | TIME | | - | 勤務可能終了時刻 |
| reason | TEXT | | - | 理由 |
| request_type | VARCHAR(20) | ✓ | 'NORMAL' | 申請タイプ（NORMAL/EMERGENCY/VACATION） |
| status | VARCHAR(20) | ✓ | 'PENDING' | ステータス（PENDING/APPROVED/REJECTED） |
| reviewed_by | INT | | - | 確認者（FK → staff） |
| reviewed_at | TIMESTAMP | | - | 確認日時 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `request_id`
- FOREIGN KEY: `staff_id` → `staff(staff_id) ON DELETE CASCADE`
- FOREIGN KEY: `reviewed_by` → `staff(staff_id)`
- CHECK: `availability_status IN ('AVAILABLE', 'UNAVAILABLE', 'PARTIAL')`
- CHECK: `request_type IN ('NORMAL', 'EMERGENCY', 'VACATION')`
- CHECK: `status IN ('PENDING', 'APPROVED', 'REJECTED')`
- INDEX: `(staff_id, request_date)`

---

### 16. demand_forecasts（需要予測）
店舗の需要予測データを管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| forecast_id | SERIAL | ✓ | - | 予測ID（PK） |
| store_id | INT | ✓ | - | 店舗ID（FK → stores） |
| forecast_date | DATE | ✓ | - | 予測日 |
| day_of_week | VARCHAR(10) | | - | 曜日 |
| expected_sales | DECIMAL(12,2) | | 0 | 予測売上 |
| expected_customers | INT | | 0 | 予測来客数 |
| weather_condition | VARCHAR(50) | | - | 天気予報 |
| temperature | DECIMAL(5,2) | | - | 気温 |
| special_event | VARCHAR(200) | | - | 特別イベント |
| required_staff_count | INT | | 0 | 必要スタッフ数 |
| forecast_method | VARCHAR(50) | | 'AI' | 予測方法（AI/MANUAL） |
| confidence_level | DECIMAL(5,2) | | - | 信頼度（0-100） |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `forecast_id`
- UNIQUE: `(store_id, forecast_date)`
- FOREIGN KEY: `store_id` → `stores(store_id) ON DELETE CASCADE`
- CHECK: `forecast_method IN ('AI', 'MANUAL')`
- INDEX: `(store_id, forecast_date)`

---

## 実績データテーブル

### 17. sales_actual（売上実績）
日別の売上実績を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| actual_id | SERIAL | ✓ | - | 実績ID（PK） |
| store_id | INT | ✓ | - | 店舗ID（FK → stores） |
| actual_date | DATE | ✓ | - | 実績日 |
| sales_amount | DECIMAL(12,2) | ✓ | 0 | 売上金額 |
| customer_count | INT | ✓ | 0 | 来客数 |
| average_spend | DECIMAL(10,2) | | 0 | 客単価 |
| weather | VARCHAR(50) | | - | 天気 |
| temperature | DECIMAL(5,2) | | - | 気温 |
| is_holiday | BOOLEAN | ✓ | FALSE | 祝日フラグ |
| notes | TEXT | | - | 備考 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `actual_id`
- UNIQUE: `(store_id, actual_date)`
- FOREIGN KEY: `store_id` → `stores(store_id) ON DELETE CASCADE`
- INDEX: `(store_id, actual_date)`

---

### 18. payroll（給与実績）
スタッフの給与実績を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| payroll_id | SERIAL | ✓ | - | 給与ID（PK） |
| staff_id | INT | ✓ | - | スタッフID（FK → staff） |
| payment_year | INT | ✓ | - | 支払年 |
| payment_month | INT | ✓ | - | 支払月 |
| total_work_hours | DECIMAL(10,2) | ✓ | 0 | 総労働時間 |
| total_work_days | INT | ✓ | 0 | 総出勤日数 |
| base_salary | DECIMAL(12,2) | ✓ | 0 | 基本給 |
| overtime_pay | DECIMAL(12,2) | | 0 | 残業代 |
| night_shift_allowance | DECIMAL(12,2) | | 0 | 深夜手当 |
| holiday_pay | DECIMAL(12,2) | | 0 | 休日手当 |
| commute_allowance | DECIMAL(12,2) | | 0 | 通勤手当 |
| deductions | DECIMAL(12,2) | | 0 | 控除額 |
| net_pay | DECIMAL(12,2) | ✓ | 0 | 手取り額 |
| payment_status | VARCHAR(20) | ✓ | 'PENDING' | 支払ステータス（PENDING/PAID） |
| payment_date | DATE | | - | 支払日 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `payroll_id`
- UNIQUE: `(staff_id, payment_year, payment_month)`
- FOREIGN KEY: `staff_id` → `staff(staff_id) ON DELETE CASCADE`
- CHECK: `payment_status IN ('PENDING', 'PAID')`
- CHECK: `payment_month BETWEEN 1 AND 12`
- INDEX: `(staff_id, payment_year, payment_month)`

---

### 19. work_hours_actual（勤務時間実績）
スタッフの日別勤務時間実績を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| work_hours_id | SERIAL | ✓ | - | 勤務時間ID（PK） |
| shift_id | INT | ✓ | - | シフトID（FK → shifts） |
| staff_id | INT | ✓ | - | スタッフID（FK → staff） |
| work_date | DATE | ✓ | - | 勤務日 |
| scheduled_start | TIME | ✓ | - | 予定開始時刻 |
| scheduled_end | TIME | ✓ | - | 予定終了時刻 |
| actual_start | TIME | | - | 実際の開始時刻 |
| actual_end | TIME | | - | 実際の終了時刻 |
| break_minutes | INT | ✓ | 0 | 休憩時間（分） |
| actual_work_hours | DECIMAL(5,2) | | 0 | 実労働時間 |
| overtime_hours | DECIMAL(5,2) | | 0 | 残業時間 |
| late_minutes | INT | | 0 | 遅刻時間（分） |
| early_leave_minutes | INT | | 0 | 早退時間（分） |
| attendance_status | VARCHAR(20) | ✓ | 'PRESENT' | 出勤ステータス（PRESENT/ABSENT/LATE/EARLY） |
| absence_reason | TEXT | | - | 欠勤理由 |
| notes | TEXT | | - | 備考 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `work_hours_id`
- FOREIGN KEY: `shift_id` → `shifts(shift_id) ON DELETE CASCADE`
- FOREIGN KEY: `staff_id` → `staff(staff_id) ON DELETE CASCADE`
- CHECK: `attendance_status IN ('PRESENT', 'ABSENT', 'LATE', 'EARLY')`
- INDEX: `(staff_id, work_date)`
- INDEX: `(shift_id)`

---

### 20. shift_history（シフト履歴）
シフトの変更履歴を管理

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| history_id | SERIAL | ✓ | - | 履歴ID（PK） |
| shift_id | INT | ✓ | - | シフトID（FK → shifts） |
| change_type | VARCHAR(20) | ✓ | - | 変更タイプ（CREATE/UPDATE/DELETE） |
| changed_by | INT | | - | 変更者（FK → staff） |
| changed_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 変更日時 |
| old_values | JSONB | | - | 変更前の値（JSON形式） |
| new_values | JSONB | | - | 変更後の値（JSON形式） |
| change_reason | TEXT | | - | 変更理由 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |

**制約**:
- PRIMARY KEY: `history_id`
- FOREIGN KEY: `shift_id` → `shifts(shift_id) ON DELETE CASCADE`
- FOREIGN KEY: `changed_by` → `staff(staff_id)`
- CHECK: `change_type IN ('CREATE', 'UPDATE', 'DELETE')`
- INDEX: `(shift_id, changed_at)`

---

## インデックス設計

### パフォーマンス最適化のためのインデックス

```sql
-- shifts テーブル
CREATE INDEX idx_shifts_plan_date ON shifts(plan_id, shift_date);
CREATE INDEX idx_shifts_staff_date ON shifts(staff_id, shift_date);
CREATE INDEX idx_shifts_date ON shifts(shift_date);

-- shift_preferences テーブル
CREATE INDEX idx_preferences_staff_month ON shift_preferences(staff_id, target_year, target_month);
CREATE INDEX idx_preferences_date ON shift_preferences(preference_date);

-- availability_requests テーブル
CREATE INDEX idx_availability_staff_date ON availability_requests(staff_id, request_date);

-- demand_forecasts テーブル
CREATE INDEX idx_forecast_store_date ON demand_forecasts(store_id, forecast_date);

-- sales_actual テーブル
CREATE INDEX idx_sales_store_date ON sales_actual(store_id, actual_date);

-- payroll テーブル
CREATE INDEX idx_payroll_staff_month ON payroll(staff_id, payment_year, payment_month);

-- work_hours_actual テーブル
CREATE INDEX idx_work_hours_staff_date ON work_hours_actual(staff_id, work_date);
CREATE INDEX idx_work_hours_shift ON work_hours_actual(shift_id);

-- shift_history テーブル
CREATE INDEX idx_history_shift ON shift_history(shift_id, changed_at);
```

---

## 外部キー制約

### CASCADE設定

- **ON DELETE CASCADE**: 親レコード削除時に子レコードも削除
  - `staff_skills` → `staff`
  - `staff_certifications` → `staff`
  - `shifts` → `shift_plans`
  - `shift_preferences` → `staff`
  - `availability_requests` → `staff`

- **ON DELETE RESTRICT**: 親レコード削除を制限（デフォルト）
  - `staff` → `stores`
  - `shift_plans` → `stores`

---

## 次のステップ

1. **DDL実行**: 次のセクションのSQLを実行
2. **初期データ投入**: CSVデータをインポート
3. **バックエンドAPI実装**: CRUD操作のエンドポイント作成
4. **フロントエンド連携**: ローカルストレージからDB連携に移行

---
