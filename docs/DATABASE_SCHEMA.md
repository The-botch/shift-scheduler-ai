# データベーススキーマ設計書

**対象環境**: Railway PostgreSQL
**バージョン**: PostgreSQL 15+
**文字コード**: UTF-8
**最終更新**: 2025-11-27
**実装ファイル**: `scripts/database/ddl/schema.sql`

---

## 📋 目次

1. [概要](#概要)
2. [スキーマ構成](#スキーマ構成)
3. [マスターテーブル](#マスターテーブル)
4. [トランザクションテーブル](#トランザクションテーブル)
5. [インデックス設計](#インデックス設計)
6. [外部キー制約](#外部キー制約)

---

## 概要

このデータベースは、AIシフトスケジューラーシステムのために設計されたマルチテナント対応のPostgreSQLスキーマです。

### 実装状況

✅ **DDL（スキーマ定義）**: `scripts/database/ddl/schema.sql`
✅ **DML（マスターデータ）**: `scripts/database/dml/*.sql`
✅ **セットアップスクリプト**: `scripts/database/setup/setup.mjs`
✅ **テストデータ**: `scripts/database/setup/setup_tenant3_test_data.mjs`

### 主要な特徴

- **マルチテナント対応**: すべてのテーブルに`tenant_id`を持ち、テナント分離を実現
- **4つのスキーマ構成**: core（基幹）、hr（人事）、ops（運用）、analytics（分析）
- **30+テーブル**: マスター17テーブル + トランザクション13テーブル
- **外部キー制約**: CASCADE設定による整合性保証
- **自動更新**: `updated_at`カラムの自動更新トリガー
- **インデックス最適化**: tenant_id, 外部キー, 日付カラムに適切なインデックス

---

## スキーマ構成

```
┌─────────────────────────────────────────────────────┐
│ Core Schema (基幹マスタ)                             │
├─────────────────────────────────────────────────────┤
│ - tenants (テナント)                                 │
│ - divisions (部署)                                   │
│ - stores (店舗)                                      │
│ - roles (役割)                                       │
│ - skills (スキル)                                    │
│ - employment_types (雇用形態)                        │
│ - shift_patterns (シフトパターン)                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ HR Schema (人事マスタ)                               │
├─────────────────────────────────────────────────────┤
│ - staff (スタッフ)                                   │
│ - staff_skills (スタッフスキル)                      │
│ - staff_certifications (スタッフ資格)                │
│ - commute_allowance (通勤手当)                       │
│ - insurance_rates (保険料率)                         │
│ - tax_brackets (税率区分)                            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ OPS Schema (運用マスタ + トランザクション)            │
├─────────────────────────────────────────────────────┤
│ [マスタ]                                             │
│ - labor_law_constraints (労働法制約)                 │
│ - labor_management_rules (労務管理ルール)            │
│ - shift_validation_rules (シフト検証ルール)          │
│ - store_constraints (店舗制約)                       │
│                                                      │
│ [トランザクション]                                    │
│ - shift_plans (シフト計画)                           │
│ - shifts (シフト)                                    │
│ - shift_preferences (シフト希望)                     │
│ - availability_requests (出勤可否)                   │
│ - shift_issues (シフト問題)                          │
│ - shift_solutions (シフト解決策)                     │
│ - demand_forecasts (需要予測)                        │
│ - work_hours_actual (勤怠実績)                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Analytics Schema (分析系トランザクション)             │
├─────────────────────────────────────────────────────┤
│ - sales_actual (売上実績)                            │
│ - sales_forecast (売上予測)                          │
│ - dashboard_metrics (ダッシュボード指標)             │
└─────────────────────────────────────────────────────┘
```

---

## マスターテーブル

### Core Schema

#### 1. tenants（テナント）
マルチテナントの基盤となるテナント情報

| カラム名 | データ型 | NOT NULL | デフォルト | 説明 |
|---------|---------|----------|-----------|------|
| tenant_id | SERIAL | ✓ | - | テナントID（PK） |
| tenant_code | VARCHAR(50) | ✓ | - | テナントコード |
| tenant_name | VARCHAR(200) | ✓ | - | テナント名 |
| corporate_number | VARCHAR(13) | | - | 法人番号 |
| contract_plan | VARCHAR(50) | ✓ | 'STANDARD' | 契約プラン |
| contract_start_date | DATE | ✓ | - | 契約開始日 |
| contract_end_date | DATE | | - | 契約終了日 |
| max_divisions | INTEGER | | 10 | 最大部署数 |
| max_stores | INTEGER | | 100 | 最大店舗数 |
| max_staff | INTEGER | | 1000 | 最大スタッフ数 |
| is_active | BOOLEAN | ✓ | TRUE | 有効フラグ |
| created_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | ✓ | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- PRIMARY KEY: `tenant_id`
- UNIQUE: `tenant_code`

---

#### 2. divisions（部署）
組織階層を管理

| カラム名 | データ型 | NOT NULL | 説明 |
|---------|---------|----------|------|
| division_id | SERIAL | ✓ | 部署ID（PK） |
| tenant_id | INTEGER | ✓ | テナントID（FK） |
| division_code | VARCHAR(50) | ✓ | 部署コード |
| division_name | VARCHAR(200) | ✓ | 部署名 |
| division_type | VARCHAR(50) | | 部署タイプ |
| parent_division_id | INTEGER | | 親部署ID |
| contact_email | VARCHAR(200) | | 連絡先メール |
| contact_phone | VARCHAR(20) | | 連絡先電話 |
| is_active | BOOLEAN | ✓ | 有効フラグ |

**制約**:
- UNIQUE: `(tenant_id, division_code)`
- FOREIGN KEY: `tenant_id` → `tenants(tenant_id)` ON DELETE CASCADE
- FOREIGN KEY: `parent_division_id` → `divisions(division_id)`

---

#### 3. stores（店舗）
店舗情報を管理

| カラム名 | データ型 | NOT NULL | 説明 |
|---------|---------|----------|------|
| store_id | SERIAL | ✓ | 店舗ID（PK） |
| tenant_id | INTEGER | ✓ | テナントID（FK） |
| division_id | INTEGER | ✓ | 部署ID（FK） |
| store_code | VARCHAR(50) | ✓ | 店舗コード |
| store_name | VARCHAR(200) | ✓ | 店舗名 |
| address | VARCHAR(500) | | 住所 |
| phone_number | VARCHAR(20) | | 電話番号 |
| business_hours_start | TIME | | 営業開始時間 |
| business_hours_end | TIME | | 営業終了時間 |
| is_active | BOOLEAN | ✓ | 有効フラグ |

**制約**:
- UNIQUE: `(tenant_id, division_id, store_code)`
- FOREIGN KEY: `tenant_id`, `division_id`

---

#### 4-7. その他マスタ

- **roles**: 役割マスタ
- **skills**: スキルマスタ
- **employment_types**: 雇用形態マスタ
- **shift_patterns**: シフトパターンマスタ

すべて`tenant_id`で分離され、`(tenant_id, {code})`でユニーク制約

---

### HR Schema

#### 8. staff（スタッフ）
スタッフ情報の中核テーブル

| カラム名 | データ型 | NOT NULL | 説明 |
|---------|---------|----------|------|
| staff_id | SERIAL | ✓ | スタッフID（PK） |
| tenant_id | INTEGER | ✓ | テナントID（FK） |
| division_id | INTEGER | | 部署ID（FK） |
| store_id | INTEGER | ✓ | 店舗ID（FK） |
| role_id | INTEGER | ✓ | 役割ID（FK） |
| staff_code | VARCHAR(50) | ✓ | スタッフコード |
| name | VARCHAR(100) | ✓ | 氏名 |
| email | VARCHAR(200) | | メールアドレス |
| phone_number | VARCHAR(20) | | 電話番号 |
| employment_type | VARCHAR(50) | ✓ | 雇用形態 |
| hire_date | DATE | ✓ | 入社日 |
| resignation_date | DATE | | 退職日 |
| monthly_salary | NUMERIC(10,2) | | 月給 |
| hourly_rate | NUMERIC(8,2) | | 時給 |
| is_active | BOOLEAN | ✓ | 有効フラグ |

**制約**:
- UNIQUE: `(tenant_id, staff_code)`
- FOREIGN KEY: `tenant_id`, `division_id`, `store_id`, `role_id`

---

#### 9-13. その他HRマスタ

- **staff_skills**: スタッフスキル中間テーブル
- **staff_certifications**: スタッフ資格中間テーブル
- **commute_allowance**: 通勤手当マスタ
- **insurance_rates**: 保険料率マスタ
- **tax_brackets**: 税率区分マスタ

---

### OPS Schema（マスタ部分）

#### 14-17. 運用ルール・制約マスタ

- **labor_law_constraints**: 労働法制約
- **labor_management_rules**: 労務管理ルール
- **shift_validation_rules**: シフト検証ルール
- **store_constraints**: 店舗制約

すべて`tenant_id`でテナント分離

---

## トランザクションテーブル

### OPS Schema（トランザクション部分）

#### 18. shift_plans（シフト計画）
AIが生成するシフト計画の基本情報

| カラム名 | データ型 | NOT NULL | 説明 |
|---------|---------|----------|------|
| plan_id | SERIAL | ✓ | 計画ID（PK） |
| tenant_id | INT | ✓ | テナントID（FK） |
| store_id | INT | ✓ | 店舗ID（FK） |
| plan_year | INT | ✓ | 対象年 |
| plan_month | INT | ✓ | 対象月 |
| plan_code | VARCHAR(100) | | 計画コード |
| plan_name | VARCHAR(200) | | 計画名 |
| period_start | DATE | | 期間開始日 |
| period_end | DATE | | 期間終了日 |
| status | VARCHAR(20) | ✓ | ステータス |
| total_labor_hours | DECIMAL(10,2) | | 総労働時間 |
| total_labor_cost | INT | | 総人件費 |
| created_by | INT | | 作成者ID |
| approved_by | INT | | 承認者ID |

**データ投入元**: AI生成

**制約**:
- CHECK: `status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED')`
- FOREIGN KEY: `tenant_id`, `store_id`

---

#### 19. shifts（シフト）
個別のシフト情報（CSV投入 or AI生成）

| カラム名 | データ型 | NOT NULL | 説明 |
|---------|---------|----------|------|
| shift_id | SERIAL | ✓ | シフトID（PK） |
| tenant_id | INT | ✓ | テナントID（FK） |
| store_id | INT | ✓ | 店舗ID（FK） |
| plan_id | INT | ✓ | 計画ID（FK） |
| staff_id | INT | ✓ | スタッフID（FK） |
| shift_date | DATE | ✓ | シフト日 |
| pattern_id | INT | | パターンID（FK）**※NULL許可** |
| start_time | VARCHAR(5) | ✓ | 開始時間（"09:00", "25:00"形式）**※24時超過対応** |
| end_time | VARCHAR(5) | ✓ | 終了時間（"18:00", "26:00"形式）**※24時超過対応** |
| break_minutes | INT | ✓ | 休憩時間（分） |
| total_hours | DECIMAL(5,2) | | 総労働時間 |
| labor_cost | INT | | 人件費 |
| assigned_skills | JSONB | | 割り当てスキル |
| is_preferred | BOOLEAN | | 希望シフトフラグ |
| is_modified | BOOLEAN | | 修正済みフラグ |
| notes | TEXT | | 備考 |

**データ投入元**: CSV手動投入 or AI生成

**制約**:
- FOREIGN KEY: `tenant_id`, `store_id`, `plan_id`, `staff_id`, `pattern_id`
- INDEX: `(tenant_id)`, `(store_id)`, `(shift_date)`, `(staff_id)`, `(plan_id)`

**2025-11-27 変更**:
- `pattern_id`: NOT NULL → NULL許可（MVPではシフトパターン入力なし）
- `start_time`, `end_time`: TIME → VARCHAR(5)（24時間超過表記対応: "25:00"など）

---

#### 20. shift_preferences（シフト希望）
メンバーが入力するシフト希望（**2025-11-27 完全再設計**）

| カラム名 | データ型 | NOT NULL | 説明 |
|---------|---------|----------|------|
| preference_id | SERIAL | ✓ | 希望ID（PK） |
| tenant_id | INT | ✓ | テナントID（FK） |
| store_id | INT | ✓ | 店舗ID（FK） |
| staff_id | INT | ✓ | スタッフID（FK） |
| preference_date | DATE | ✓ | 希望日（1日1レコード） |
| is_ng | BOOLEAN | ✓ | NG日フラグ（TRUE=NG日、FALSE=希望日） |
| start_time | VARCHAR(5) | | 希望開始時間（"09:00"形式） |
| end_time | VARCHAR(5) | | 希望終了時間（"18:00"形式） |
| notes | TEXT | | 備考 |
| created_at | TIMESTAMP | ✓ | 作成日時 |
| updated_at | TIMESTAMP | ✓ | 更新日時 |

**データ投入元**: メンバー入力（LINEシフト入力画面）

**制約**:
- UNIQUE: `(tenant_id, staff_id, preference_date)` - 1スタッフ1日1レコード
- FOREIGN KEY: `tenant_id`, `store_id`, `staff_id`
- INDEX: `idx_shift_preferences_date(preference_date)`, `idx_shift_preferences_is_ng(is_ng)`

**2025-11-27 変更**:
- 旧形式: 1ヶ月1レコード（year, month, preferred_days, ng_days）
- 新形式: 1日1レコード（preference_date, is_ng, start_time, end_time）
- 詳細: `docs/design-docs/20251126_shift_preferences_schema_change.html`

---

#### 21. availability_requests（出勤可否リクエスト）
メンバーが入力する出勤可否申請

**データ投入元**: メンバー入力

---

#### 22. shift_issues（シフト問題）
AIが検出したシフトの問題点

**データ投入元**: AI自動検出

---

#### 23. shift_solutions（シフト解決策）
AIが生成したシフト問題の解決策

**データ投入元**: AI自動生成

---

#### 24. demand_forecasts（需要予測）
店舗の需要予測データ

**データ投入元**: CSV投入

---

#### 25. work_hours_actual（勤怠実績）
スタッフの実際の勤務時間

| カラム名 | データ型 | NOT NULL | 説明 |
|---------|---------|----------|------|
| work_hours_id | SERIAL | ✓ | 勤務時間ID（PK） |
| tenant_id | INT | ✓ | テナントID（FK） |
| store_id | INT | ✓ | 店舗ID（FK） |
| shift_id | INT | | シフトID（FK） |
| year | INT | ✓ | 年 |
| month | INT | ✓ | 月 |
| work_date | DATE | ✓ | 勤務日 |
| staff_id | INT | ✓ | スタッフID（FK） |
| scheduled_start | TIME | | 予定開始 |
| scheduled_end | TIME | | 予定終了 |
| actual_start | TIME | | 実際の開始 |
| actual_end | TIME | | 実際の終了 |
| scheduled_hours | DECIMAL(5,2) | | 予定時間 |
| actual_hours | DECIMAL(5,2) | | 実働時間 |
| break_minutes | INT | | 休憩時間 |
| overtime_minutes | INT | | 残業時間 |
| is_late | BOOLEAN | | 遅刻フラグ |
| is_early_leave | BOOLEAN | | 早退フラグ |

**データ投入元**: CSV投入

---

### HR Schema（トランザクション部分）

#### 26. payroll（給与計算）
スタッフの給与計算データ

| カラム名 | データ型 | NOT NULL | 説明 |
|---------|---------|----------|------|
| payroll_id | SERIAL | ✓ | 給与ID（PK） |
| tenant_id | INT | ✓ | テナントID（FK） |
| store_id | INT | ✓ | 店舗ID（FK） |
| year | INT | ✓ | 年 |
| month | INT | ✓ | 月 |
| staff_id | INT | ✓ | スタッフID（FK） |
| work_days | INT | | 出勤日数 |
| work_hours | DECIMAL(8,2) | | 労働時間 |
| base_salary | DECIMAL(12,2) | | 基本給 |
| overtime_pay | DECIMAL(12,2) | | 残業代 |
| commute_allowance | DECIMAL(10,2) | | 通勤手当 |
| gross_salary | DECIMAL(12,2) | | 総支給額 |
| health_insurance | DECIMAL(10,2) | | 健康保険 |
| pension_insurance | DECIMAL(10,2) | | 年金保険 |
| employment_insurance | DECIMAL(10,2) | | 雇用保険 |
| income_tax | DECIMAL(10,2) | | 所得税 |
| resident_tax | DECIMAL(10,2) | | 住民税 |
| total_deduction | DECIMAL(12,2) | | 総控除額 |
| net_salary | DECIMAL(12,2) | | 手取り額 |
| payment_status | VARCHAR(20) | | 支払ステータス |

**データ投入元**: CSV投入

**制約**:
- UNIQUE: `uq_payroll_key (tenant_id, store_id, year, month, staff_id)`
- CHECK: `payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED')`

---

### Analytics Schema

#### 27. sales_actual（売上実績）
店舗の売上実績データ

**データ投入元**: CSV投入

---

#### 28. sales_forecast（売上予測）
店舗の売上予測データ

**データ投入元**: CSV投入

---

#### 29. dashboard_metrics（ダッシュボード指標）
システムが自動計算するダッシュボード指標

**データ投入元**: システム自動生成

---

## インデックス設計

### パフォーマンス最適化のための主要インデックス

```sql
-- マスターテーブル
CREATE INDEX idx_tenants_active ON core.tenants(is_active);
CREATE INDEX idx_divisions_tenant ON core.divisions(tenant_id);
CREATE INDEX idx_stores_tenant ON core.stores(tenant_id);
CREATE INDEX idx_staff_tenant ON hr.staff(tenant_id);
CREATE INDEX idx_staff_store ON hr.staff(store_id);

-- トランザクションテーブル
CREATE INDEX idx_shifts_tenant ON ops.shifts(tenant_id);
CREATE INDEX idx_shifts_store ON ops.shifts(store_id);
CREATE INDEX idx_shifts_date ON ops.shifts(shift_date);
CREATE INDEX idx_shifts_staff ON ops.shifts(staff_id);
CREATE INDEX idx_shifts_plan ON ops.shifts(plan_id);

CREATE INDEX idx_shift_plans_period ON ops.shift_plans(plan_year, plan_month);
CREATE INDEX idx_work_hours_actual_date ON ops.work_hours_actual(work_date);
CREATE INDEX idx_payroll_period ON hr.payroll(year, month);

-- シフト希望（2025-11-27追加）
CREATE INDEX idx_shift_preferences_date ON ops.shift_preferences(preference_date);
CREATE INDEX idx_shift_preferences_is_ng ON ops.shift_preferences(is_ng);
```

---

## 外部キー制約

### CASCADE設定による整合性保証

#### ON DELETE CASCADE
親レコード削除時に子レコードも自動削除

- `core.divisions` → `core.tenants`
- `core.stores` → `core.tenants`, `core.divisions`
- `hr.staff` → `core.tenants`
- `ops.shifts` → `ops.shift_plans`, `hr.staff`
- すべてのトランザクションテーブル → `core.tenants`

#### ON DELETE SET NULL
親レコード削除時に子レコードの外部キーをNULLに設定

- `ops.shift_solutions.staff_from` → `hr.staff`
- `ops.shift_solutions.staff_to` → `hr.staff`
- `ops.work_hours_actual.shift_id` → `ops.shifts`

---

## データ投入元まとめ

| テーブル | 投入方法 | 備考 |
|---------|---------|------|
| **マスター17テーブル** | 初期セットアップ | setup/seed_data.sql |
| shifts | CSV手動 or AI生成 | 両方対応 |
| shift_plans | AI生成 | - |
| shift_preferences | メンバー入力 | フロントエンド |
| availability_requests | メンバー入力 | フロントエンド |
| shift_issues | AI自動検出 | バックグラウンド処理 |
| shift_solutions | AI自動生成 | バックグラウンド処理 |
| demand_forecasts | CSV手動 | - |
| work_hours_actual | CSV手動 | - |
| payroll | CSV手動 | - |
| sales_actual | CSV手動 | - |
| sales_forecast | CSV手動 | - |
| dashboard_metrics | システム自動 | 定期バッチ |

---

## DDL実行

スキーマとテーブルの作成:

```bash
# 開発環境（ローカル）
cd scripts/database/setup
node setup.mjs --env dev

# デモ環境（テストデータ含む）
node setup.mjs --env demo
```

詳細は `scripts/database/README.md` を参照。

---

## 変更履歴

| 日付 | 変更内容 |
|-----|---------|
| 2025-11-27 | shift_preferences テーブル完全再設計（1日1レコード形式）、shifts テーブル時刻型変更 |
| 2025-11-01 | 初版作成 |

---
