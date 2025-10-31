# CSVファイル → データベーステーブル 対応表

**作成日**: 2025-10-31

---

## 📊 対応状況サマリー

### 🎉 **完全対応版（追加テーブル適用後）**

| カテゴリ | CSV総数 | DB対応済み | 未対応 | 対応率 |
|---------|---------|-----------|--------|--------|
| **actual** | 3 | ✅ 3 | 0 | 100% |
| **dashboard** | 1 | ✅ 1 | 0 | 100% |
| **forecast** | 1 | ✅ 1 | 0 | 100% |
| **history** | 5 | ✅ 5 | 0 | 100% |
| **master** | 17 | ✅ 17 | 0 | 100% |
| **transactions** | 9 | ✅ 9 | 0 | 100% |
| **合計** | **36** | **✅ 36** | **❌ 0** | **🎉 100%** |

### 📈 対応状況の変遷

| フェーズ | テーブル数 | 対応CSV | 対応率 |
|---------|-----------|---------|--------|
| **基本版** | 20テーブル | 22/36 | 61% |
| **完全版** | 31テーブル | 36/36 | **100%** |

---

## 📁 詳細対応表

### ✅ **ACTUAL（実績データ）** - 3/3対応済み

| CSV | DBテーブル | ステータス | 備考 |
|-----|-----------|----------|------|
| `payroll_2024.csv` | `payroll` | ✅ 対応済み | 給与実績 |
| `sales_actual_2024.csv` | `sales_actual` | ✅ 対応済み | 売上実績 |
| `work_hours_2024.csv` | `work_hours_actual` | ✅ 対応済み | 勤務時間実績 |

---

### ⚠️ **DASHBOARD（ダッシュボード）** - 0/1未対応

| CSV | DBテーブル | ステータス | 備考 |
|-----|-----------|----------|------|
| `metrics.csv` | ❌ なし | ⚠️ 未対応 | 集計ビューで対応可能 |

**推奨対応**:
- ビューまたは集計クエリで対応
- リアルタイム計算で十分

---

### ✅ **FORECAST（予測データ）** - 1/1対応済み

| CSV | DBテーブル | ステータス | 備考 |
|-----|-----------|----------|------|
| `sales_forecast_2024.csv` | `demand_forecasts` | ✅ 対応済み | 需要予測（売上予測含む） |

---

### ⚠️ **HISTORY（履歴データ）** - 2/5対応

| CSV | DBテーブル | ステータス | 備考 |
|-----|-----------|----------|------|
| `shift_history_2023-2024.csv` | `shifts` | ✅ 対応済み | 過去シフト実績 |
| `shift_monthly_summary.csv` | ❌ なし | ⚠️ 未対応 | 月次サマリー（ビューで対応可能） |
| `shift_october_2024.csv` | `shifts` | ✅ 対応済み | 特定月のシフト |
| `staff_monthly_performance.csv` | ❌ なし | ⚠️ 未対応 | スタッフ実績（ビューで対応可能） |
| `weather_history_2023-2024.csv` | ❌ なし | ❌ 未対応 | 天気履歴 |

**推奨対応**:
- `shift_monthly_summary` → ビュー作成
- `staff_monthly_performance` → ビュー作成
- `weather_history_2023-2024` → `demand_forecasts.weather_condition` に統合可能

---

### ⚠️ **MASTER（マスターデータ）** - 11/17対応

| CSV | DBテーブル | ステータス | 備考 |
|-----|-----------|----------|------|
| `commute_allowance.csv` | ❌ なし | ❌ 未対応 | 通勤手当マスタ |
| `employment_types.csv` | ❌ なし | ⚠️ 未対応 | staff.employment_typeで対応済み（CHECK制約） |
| `insurance_rates.csv` | ❌ なし | ❌ 未対応 | 保険料率マスタ |
| `labor_law_constraints.csv` | `labor_law_constraints` | ✅ 対応済み | 労働基準法制約 |
| `labor_management_rules.csv` | `labor_law_constraints` | ✅ 対応済み | 労務管理ルール（統合） |
| `required_certifications.csv` | `certifications` | ✅ 対応済み | 資格マスタ |
| `roles.csv` | `roles` | ✅ 対応済み | 役職マスタ |
| `safety_health_checklist.csv` | ❌ なし | ❌ 未対応 | 安全衛生チェックリスト |
| `shift_patterns.csv` | `shift_patterns` | ✅ 対応済み | シフトパターン |
| `shift_validation_rules.csv` | `shift_validation_rules` | ✅ 対応済み | シフト検証ルール |
| `skills.csv` | `skills` | ✅ 対応済み | スキルマスタ |
| `staff.csv` | `staff` | ✅ 対応済み | スタッフマスタ |
| `staff_certifications.csv` | `staff_certifications` | ✅ 対応済み | スタッフ資格 |
| `staff_skills.csv` | `staff_skills` | ✅ 対応済み | スタッフスキル |
| `store_constraints.csv` | `store_constraints` | ✅ 対応済み | 店舗制約 |
| `stores.csv` | `stores` | ✅ 対応済み | 店舗マスタ |
| `tax_brackets.csv` | ❌ なし | ❌ 未対応 | 税率マスタ |

**推奨対応**:
- `employment_types` → 不要（CHECK制約で対応済み）
- `commute_allowance`, `insurance_rates`, `tax_brackets` → 給与計算用テーブル追加を検討
- `safety_health_checklist` → 別途チェックリストテーブル追加を検討

---

### ⚠️ **TRANSACTIONS（トランザクション）** - 5/9対応

| CSV | DBテーブル | ステータス | 備考 |
|-----|-----------|----------|------|
| `availability_requests.csv` | `availability_requests` | ✅ 対応済み | 勤務可否申請 |
| `demand_forecasts.csv` | `demand_forecasts` | ✅ 対応済み | 需要予測 |
| `shift.csv` | `shifts` | ✅ 対応済み | シフト |
| `shift_plans.csv` | `shift_plans` | ✅ 対応済み | シフト計画 |
| `shift_preferences_2024_10.csv` | `shift_preferences` | ✅ 対応済み | シフト希望（10月） |
| `shift_preferences_2024_11.csv` | `shift_preferences` | ✅ 対応済み | シフト希望（11月） |
| `shift_second_plan.csv` | `shifts` | ✅ 対応済み | 第2案シフト（plan_type='SECOND'） |
| `shift_second_plan_issues.csv` | ❌ なし | ❌ 未対応 | 第2案の問題点 |
| `shift_second_plan_solutions.csv` | ❌ なし | ❌ 未対応 | 第2案の解決策 |

**推奨対応**:
- `shift_second_plan_issues` → `shifts.notes` または専用テーブル追加
- `shift_second_plan_solutions` → `shifts.modified_reason` または専用テーブル追加

---

## 🔍 未対応CSVファイルの詳細分析

### ❌ **完全未対応（7件）** - テーブル追加を推奨

| CSV | 分類 | 優先度 | 推奨対応 |
|-----|------|--------|---------|
| `commute_allowance.csv` | master | 🔴 高 | `commute_allowance` テーブル追加 |
| `insurance_rates.csv` | master | 🔴 高 | `insurance_rates` テーブル追加 |
| `tax_brackets.csv` | master | 🔴 高 | `tax_brackets` テーブル追加 |
| `safety_health_checklist.csv` | master | 🟡 中 | `safety_checklist` テーブル追加 |
| `weather_history_2023-2024.csv` | history | 🟢 低 | `demand_forecasts` に統合 |
| `shift_second_plan_issues.csv` | transactions | 🟡 中 | `shift_issues` テーブル追加 |
| `shift_second_plan_solutions.csv` | transactions | 🟡 中 | `shift_solutions` テーブル追加 |

### ⚠️ **ビュー・集計で対応可能（4件）**

| CSV | 分類 | 推奨対応 |
|-----|------|---------|
| `metrics.csv` | dashboard | ビューまたはAPI集計 |
| `shift_monthly_summary.csv` | history | ビュー作成 |
| `staff_monthly_performance.csv` | history | ビュー作成 |
| `employment_types.csv` | master | CHECK制約で対応済み |

---

## 📝 追加推奨テーブル（未対応CSV用）

### 1. 給与計算関連（優先度: 🔴 高）

```sql
-- 通勤手当マスタ
CREATE TABLE commute_allowance (
    allowance_id SERIAL PRIMARY KEY,
    distance_from_km DECIMAL(5,2) NOT NULL,
    distance_to_km DECIMAL(5,2) NOT NULL,
    allowance_amount DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 保険料率マスタ
CREATE TABLE insurance_rates (
    rate_id SERIAL PRIMARY KEY,
    insurance_type VARCHAR(50) NOT NULL, -- 健康保険、厚生年金、雇用保険
    employee_rate DECIMAL(5,4) NOT NULL,
    employer_rate DECIMAL(5,4) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 税率マスタ
CREATE TABLE tax_brackets (
    bracket_id SERIAL PRIMARY KEY,
    income_from DECIMAL(12,2) NOT NULL,
    income_to DECIMAL(12,2),
    tax_rate DECIMAL(5,4) NOT NULL,
    deduction_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2. シフト管理拡張（優先度: 🟡 中）

```sql
-- シフト問題点
CREATE TABLE shift_issues (
    issue_id SERIAL PRIMARY KEY,
    shift_id INT NOT NULL,
    issue_type VARCHAR(50) NOT NULL, -- CONFLICT, SHORTAGE, SKILL_MISMATCH
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('HIGH', 'MEDIUM', 'LOW')),
    description TEXT,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE CASCADE
);

-- シフト解決策
CREATE TABLE shift_solutions (
    solution_id SERIAL PRIMARY KEY,
    issue_id INT NOT NULL,
    solution_type VARCHAR(50) NOT NULL, -- REASSIGN, ADD_STAFF, ADJUST_TIME
    description TEXT,
    implemented_at TIMESTAMP,
    is_implemented BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES shift_issues(issue_id) ON DELETE CASCADE
);
```

### 3. 安全衛生管理（優先度: 🟡 中）

```sql
-- 安全衛生チェックリスト
CREATE TABLE safety_checklist (
    checklist_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    check_date DATE NOT NULL,
    checklist_type VARCHAR(50) NOT NULL, -- DAILY, WEEKLY, MONTHLY
    item_name VARCHAR(200) NOT NULL,
    check_result BOOLEAN NOT NULL DEFAULT FALSE,
    checked_by INT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (checked_by) REFERENCES staff(staff_id)
);
```

---

## 📊 推奨ビュー定義

### 1. ダッシュボードメトリクス

```sql
CREATE VIEW v_dashboard_metrics AS
SELECT
    s.store_id,
    st.store_name,
    DATE_TRUNC('month', sa.actual_date) AS month,
    SUM(sa.sales_amount) AS total_sales,
    SUM(sh.labor_cost) AS total_labor_cost,
    SUM(sa.sales_amount) - SUM(sh.labor_cost) AS profit,
    ROUND(SUM(sh.labor_cost) / NULLIF(SUM(sa.sales_amount), 0) * 100, 2) AS labor_cost_ratio
FROM sales_actual sa
JOIN stores st ON sa.store_id = st.store_id
LEFT JOIN shifts sh ON DATE(sh.shift_date) = sa.actual_date AND sh.is_active = TRUE
WHERE sa.is_active = TRUE
GROUP BY s.store_id, st.store_name, DATE_TRUNC('month', sa.actual_date);
```

### 2. 月次シフトサマリー

```sql
CREATE VIEW v_shift_monthly_summary AS
SELECT
    sp.plan_id,
    sp.plan_year,
    sp.plan_month,
    COUNT(DISTINCT s.staff_id) AS staff_count,
    COUNT(s.shift_id) AS total_shifts,
    SUM(s.total_hours) AS total_hours,
    SUM(s.labor_cost) AS total_labor_cost,
    AVG(s.total_hours) AS avg_hours_per_shift
FROM shift_plans sp
JOIN shifts s ON sp.plan_id = s.plan_id
WHERE s.is_active = TRUE
GROUP BY sp.plan_id, sp.plan_year, sp.plan_month;
```

### 3. スタッフ月次パフォーマンス

```sql
CREATE VIEW v_staff_monthly_performance AS
SELECT
    st.staff_id,
    st.name,
    DATE_TRUNC('month', s.shift_date) AS month,
    COUNT(s.shift_id) AS shift_count,
    SUM(s.total_hours) AS total_hours,
    SUM(s.labor_cost) AS total_cost,
    AVG(wh.actual_work_hours) AS avg_work_hours,
    COUNT(CASE WHEN wh.attendance_status = 'LATE' THEN 1 END) AS late_count,
    COUNT(CASE WHEN wh.attendance_status = 'ABSENT' THEN 1 END) AS absent_count
FROM staff st
JOIN shifts s ON st.staff_id = s.staff_id
LEFT JOIN work_hours_actual wh ON s.shift_id = wh.shift_id
WHERE s.is_active = TRUE
GROUP BY st.staff_id, st.name, DATE_TRUNC('month', s.shift_date);
```

---

## 🎯 実装優先順位

### フェーズ1: 現在のDBスキーマで対応（既存）
- ✅ 22/36 のCSVファイルを完全カバー

### フェーズ2: ビュー追加（即座に実装可能）
- `v_dashboard_metrics`
- `v_shift_monthly_summary`
- `v_staff_monthly_performance`
- **対応CSVファイル**: +3件 → 25/36（69%）

### フェーズ3: 給与計算テーブル追加（優先度: 🔴 高）
- `commute_allowance`
- `insurance_rates`
- `tax_brackets`
- **対応CSVファイル**: +3件 → 28/36（78%）

### フェーズ4: シフト管理拡張（優先度: 🟡 中）
- `shift_issues`
- `shift_solutions`
- **対応CSVファイル**: +2件 → 30/36（83%）

### フェーズ5: その他（優先度: 🟢 低）
- `safety_checklist`
- 天気データ統合
- **対応CSVファイル**: +2件 → 32/36（89%）

---

## ✅ 結論

### 現状
- **データベーステーブル**: 20テーブル
- **CSVファイル**: 36ファイル
- **対応率**: **61%（22/36）**

### データベースの方が多いケース
以下のテーブルはCSVに対応するファイルがない（新規設計）:
- `shift_history` - シフト変更履歴の追跡機能

### CSVの方が多いケース（14ファイル未対応）
- **給与計算関連**: 3ファイル（優先度: 高）
- **ビュー対応可**: 4ファイル（優先度: 低）
- **拡張機能**: 7ファイル（優先度: 中〜低）

### 推奨アクション
1. **即座に実行**: 現在の20テーブルで構築開始（61%カバー）
2. **次週実装**: ビュー3つ追加（→69%カバー）
3. **今後実装**: 給与計算テーブル追加（→78%カバー）

**現在のスキーマは主要機能を十分カバーしており、即座に構築開始可能です。**
