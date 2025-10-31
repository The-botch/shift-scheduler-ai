# データベース構築スクリプト

このディレクトリには、AIシフトスケジューラーのデータベース構築に必要なSQLスクリプトが含まれています。

---

## 📁 ファイル構成

```
scripts/db/
├── README.md                     # このファイル
├── 001_create_tables.sql         # 基本テーブル作成DDL（20テーブル）
├── 002_seed_master_data.sql      # 基本マスターデータ投入
├── 003_add_missing_tables.sql    # 追加テーブル作成DDL（11テーブル）
└── 004_seed_additional_data.sql  # 追加マスターデータ投入
```

---

## 🚀 クイックスタート

### Railway環境での実行（完全版）

```bash
# 1. Railwayにログイン
railway login

# 2. プロジェクトに接続
cd shift-scheduler-ai
railway link

# 3. 基本テーブル作成（20テーブル）
railway run psql $DATABASE_URL -f scripts/db/001_create_tables.sql

# 4. 基本マスターデータ投入
railway run psql $DATABASE_URL -f scripts/db/002_seed_master_data.sql

# 5. 追加テーブル作成（11テーブル）
railway run psql $DATABASE_URL -f scripts/db/003_add_missing_tables.sql

# 6. 追加マスターデータ投入
railway run psql $DATABASE_URL -f scripts/db/004_seed_additional_data.sql

# 7. 確認
railway run psql $DATABASE_URL -c "\dt"
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

### ローカル環境での実行

```bash
# Docker Composeでローカル PostgreSQL起動
docker-compose up -d

# テーブル作成
psql postgresql://postgres:postgres@localhost:5432/shift_scheduler -f scripts/db/001_create_tables.sql

# マスターデータ投入
psql postgresql://postgres:postgres@localhost:5432/shift_scheduler -f scripts/db/002_seed_master_data.sql
```

---

## 📊 作成されるテーブル

### 基本テーブル（20テーブル） - 001_create_tables.sql

#### マスターテーブル（11テーブル）

| テーブル名 | 説明 | 主要カラム |
|-----------|------|-----------|
| `stores` | 店舗マスタ | store_id, store_code, store_name |
| `roles` | 役職マスタ | role_id, role_code, role_name |
| `staff` | スタッフマスタ | staff_id, staff_code, name, employment_type |
| `skills` | スキルマスタ | skill_id, skill_code, skill_name |
| `staff_skills` | スタッフスキル | staff_id, skill_id, proficiency_level |
| `certifications` | 資格マスタ | certification_id, certification_name |
| `staff_certifications` | スタッフ資格 | staff_id, certification_id |
| `shift_patterns` | シフトパターン | pattern_id, start_time, end_time |
| `labor_law_constraints` | 労働基準法制約 | constraint_code, value |
| `store_constraints` | 店舗制約 | store_id, constraint_type |
| `shift_validation_rules` | 検証ルール | rule_code, severity |

#### トランザクションテーブル（5テーブル）

| テーブル名 | 説明 | 主要カラム |
|-----------|------|-----------|
| `shift_plans` | シフト計画 | plan_id, plan_year, plan_month, status |
| `shifts` | シフト | shift_id, plan_id, staff_id, shift_date |
| `shift_preferences` | シフト希望 | staff_id, preference_date, preference_type |
| `availability_requests` | 勤務可否申請 | staff_id, request_date, availability_status |
| `demand_forecasts` | 需要予測 | store_id, forecast_date, expected_sales |

#### 実績データテーブル（4テーブル）

| テーブル名 | 説明 | 主要カラム |
|-----------|------|-----------|
| `sales_actual` | 売上実績 | store_id, actual_date, sales_amount |
| `payroll` | 給与実績 | staff_id, payment_year, payment_month |
| `work_hours_actual` | 勤務時間実績 | shift_id, staff_id, actual_work_hours |
| `shift_history` | シフト履歴 | shift_id, change_type, old_values |

---

### 追加テーブル（11テーブル） - 003_add_missing_tables.sql

#### 給与計算関連（3テーブル）

| テーブル名 | 説明 | 主要カラム |
|-----------|------|-----------|
| `commute_allowance` | 通勤手当マスタ | allowance_id, distance_from_km, allowance_amount |
| `insurance_rates` | 保険料率マスタ | rate_id, insurance_type, employee_rate |
| `tax_brackets` | 税率マスタ | bracket_id, tax_type, tax_rate |

#### シフト管理拡張（2テーブル）

| テーブル名 | 説明 | 主要カラム |
|-----------|------|-----------|
| `shift_issues` | シフト問題点 | issue_id, shift_id, issue_type, severity |
| `shift_solutions` | シフト解決策 | solution_id, issue_id, solution_type |

#### 安全衛生管理（2テーブル）

| テーブル名 | 説明 | 主要カラム |
|-----------|------|-----------|
| `safety_checklist_master` | 安全衛生チェックリストマスタ | checklist_master_id, item_name |
| `safety_checklist_records` | 安全衛生チェック実績 | record_id, check_date, check_result |

#### その他（4テーブル）

| テーブル名 | 説明 | 主要カラム |
|-----------|------|-----------|
| `weather_history` | 気象履歴 | weather_id, weather_date, temperature_avg |
| `dashboard_metrics` | ダッシュボードメトリクス | metric_id, metric_type, metric_value |
| `staff_monthly_performance` | スタッフ月次パフォーマンス | performance_id, shift_count, attendance_rate |
| `shift_monthly_summary` | シフト月次サマリー | summary_id, total_shifts, labor_law_violations |

---

**合計: 31テーブル（基本20 + 追加11）**

---

## 🔧 初期データ

### 基本マスターデータ（002_seed_master_data.sql）

- **店舗**: 1件（カフェ・ドゥ・渋谷）
- **役職**: 4件（店長、リーダー、主任、一般スタッフ）
- **スタッフ**: 10件（月給3名、時給7名）
- **スキル**: 6件（店舗運営管理、レジ、調理、接客、清掃、在庫管理）
- **資格**: 4件（食品衛生責任者、防火管理者、バリスタ）
- **シフトパターン**: 6件（通常勤務、午後、夕方、午前、短時間、店長）
- **労働基準法制約**: 5件（最大労働時間、休憩時間、連続勤務日数など）
- **店舗制約**: 4件（定休日、最低人数、スキル構成、ピーク時間）
- **検証ルール**: 7件（労働時間チェック、スキルチェックなど）

### 追加マスターデータ（004_seed_additional_data.sql）

- **通勤手当**: 7件（距離別の手当金額）
- **保険料率**: 4件（健康保険、厚生年金、雇用保険、労災保険）
- **税率**: 8件（所得税7段階 + 住民税）
- **安全衛生チェックリスト**: 12件（日次・週次・月次チェック項目）
- **気象履歴**: 10件（2024年10月のサンプルデータ）
- **ダッシュボードメトリクス**: 5件（売上・人件費・利益等のサンプル）
- **スタッフ月次パフォーマンス**: 10件（2024年10月のスタッフ実績）

---

## 🔍 データ確認クエリ

```sql
-- 店舗情報
SELECT * FROM stores;

-- スタッフ一覧（役職付き）
SELECT
    s.staff_code,
    s.name,
    r.role_name,
    s.employment_type,
    COALESCE(s.monthly_salary, s.hourly_rate) AS pay
FROM staff s
JOIN roles r ON s.role_id = r.role_id
WHERE s.is_active = TRUE
ORDER BY r.display_order, s.staff_id;

-- スタッフのスキル一覧
SELECT
    s.name AS staff_name,
    sk.skill_name,
    ss.proficiency_level
FROM staff s
JOIN staff_skills ss ON s.staff_id = ss.staff_id
JOIN skills sk ON ss.skill_id = sk.skill_id
WHERE s.is_active = TRUE
ORDER BY s.name, sk.display_order;

-- 労働基準法制約
SELECT constraint_code, constraint_name, value
FROM labor_law_constraints
WHERE is_active = TRUE;
```

---

## 📝 スクリプト詳細

### 001_create_tables.sql

**内容**:
- 20テーブルの作成
- 外部キー制約の設定
- インデックスの作成
- トリガー（updated_at自動更新）の設定

**実行時間**: 約5秒

### 002_seed_master_data.sql

**内容**:
- マスターデータの投入
- スタッフ情報（10名）
- スキル・資格の紐付け
- 制約・ルールの設定

**実行時間**: 約3秒

---

## ⚠️ 注意事項

### 実行順序

**必ず以下の順序で実行してください**:

1. `001_create_tables.sql` ← テーブル作成
2. `002_seed_master_data.sql` ← データ投入

逆順で実行すると外部キー制約エラーが発生します。

### データベースリセット

既存のテーブルを削除して再構築する場合:

```sql
-- 全テーブル削除（注意: データが全て消えます）
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

その後、再度スクリプトを実行してください。

---

## 🛠️ カスタマイズ

### 追加データの投入

`002_seed_master_data.sql` に INSERT文を追加:

```sql
-- 例: 新しいスキルを追加
INSERT INTO skills (skill_code, skill_name, category, display_order, is_active) VALUES
('DELIVERY', '配達', 'その他', 7, TRUE);
```

### テーブルの追加

`001_create_tables.sql` に CREATE TABLE文を追加:

```sql
-- 例: 新しいテーブルを追加
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE
);
```

---

## 📚 関連ドキュメント

- [DATABASE_SCHEMA.md](../../docs/DATABASE_SCHEMA.md) - テーブル定義の詳細
- [DATABASE_SETUP.md](../../docs/DATABASE_SETUP.md) - Railway構築手順
- [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - システムアーキテクチャ

---

## 🔗 次のステップ

1. ✅ データベース構築完了
2. 📝 バックエンドAPI実装
   - `backend/src/db/connection.js` - DB接続設定
   - `backend/src/routes/staff.js` - スタッフAPI
   - `backend/src/routes/shifts.js` - シフトAPI
3. 🔄 フロントエンド連携
   - API呼び出しの実装
   - ローカルストレージから移行

---

## ❓ トラブルシューティング

問題が発生した場合は [DATABASE_SETUP.md](../../docs/DATABASE_SETUP.md) のトラブルシューティングセクションを参照してください。
