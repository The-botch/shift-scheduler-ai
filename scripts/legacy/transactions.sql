-- ============================================
-- AIシフトスケジューラー トランザクションテーブル定義
-- 対象: PostgreSQL 15+
-- 作成日: 2025-11-01
--
-- このファイルは13種類のトランザクションデータを扱うテーブルを定義します
-- ============================================

-- スキーマ作成（念のため）
CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS analytics;

-- ============================================
-- 1. OPS - シフト運用系（8テーブル）
-- ============================================

-- 1.1 shift_plans（シフト計画）- AIが生成
CREATE TABLE IF NOT EXISTS ops.shift_plans (
    plan_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    plan_year INT NOT NULL,
    plan_month INT NOT NULL,
    plan_code VARCHAR(100),
    plan_name VARCHAR(200),
    period_start DATE,
    period_end DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    generation_type VARCHAR(50),
    ai_model_version VARCHAR(50),
    total_labor_hours DECIMAL(10,2),
    total_labor_cost INT,
    coverage_score DECIMAL(5,2),
    constraint_violations INT DEFAULT 0,
    created_by INT,
    approved_by INT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS idx_shift_plans_tenant ON ops.shift_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_plans_store ON ops.shift_plans(store_id);
CREATE INDEX IF NOT EXISTS idx_shift_plans_period ON ops.shift_plans(plan_year, plan_month);

COMMENT ON TABLE ops.shift_plans IS 'シフト計画（AIが生成）';

-- 1.2 shifts（シフト実績/計画）- CSV投入 or AI生成
CREATE TABLE IF NOT EXISTS ops.shifts (
    shift_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    plan_id INT NOT NULL,
    staff_id INT NOT NULL,
    shift_date DATE NOT NULL,
    pattern_id INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT NOT NULL DEFAULT 0,
    total_hours DECIMAL(5,2),
    labor_cost INT,
    assigned_skills JSONB,
    is_preferred BOOLEAN DEFAULT FALSE,
    is_modified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES ops.shift_plans(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (pattern_id) REFERENCES core.shift_patterns(pattern_id)
);

CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON ops.shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_store ON ops.shifts(store_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON ops.shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_staff ON ops.shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_plan ON ops.shifts(plan_id);

COMMENT ON TABLE ops.shifts IS 'シフト実績/計画（CSV投入 or AI生成）';

-- 1.3 shift_preferences（シフト希望）- メンバーが入力
CREATE TABLE IF NOT EXISTS ops.shift_preferences (
    preference_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    staff_id INT NOT NULL,
    staff_name VARCHAR(100),
    year INT NOT NULL,
    month INT NOT NULL,
    preferred_days TEXT,
    ng_days TEXT,
    preferred_time_slots TEXT,
    max_hours_per_week DECIMAL(5,2),
    notes TEXT,
    submitted_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_shift_preferences_tenant ON ops.shift_preferences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_preferences_store ON ops.shift_preferences(store_id);
CREATE INDEX IF NOT EXISTS idx_shift_preferences_staff ON ops.shift_preferences(staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_preferences_period ON ops.shift_preferences(year, month);

COMMENT ON TABLE ops.shift_preferences IS 'シフト希望（メンバーが入力）';

-- 1.4 availability_requests（出勤可否リクエスト）- メンバーが入力
CREATE TABLE IF NOT EXISTS ops.availability_requests (
    request_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    staff_id INT NOT NULL,
    plan_id INT,
    request_date DATE NOT NULL,
    availability VARCHAR(20) NOT NULL,
    preferred_pattern VARCHAR(100),
    comments TEXT,
    submitted_at TIMESTAMP,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES ops.shift_plans(plan_id) ON DELETE CASCADE,
    CHECK (availability IN ('AVAILABLE', 'UNAVAILABLE', 'PREFERRED', 'NG'))
);

CREATE INDEX IF NOT EXISTS idx_availability_requests_tenant ON ops.availability_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_availability_requests_store ON ops.availability_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_availability_requests_staff ON ops.availability_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_availability_requests_date ON ops.availability_requests(request_date);

COMMENT ON TABLE ops.availability_requests IS '出勤可否リクエスト（メンバーが入力）';

-- 1.5 shift_issues（シフト問題）- AIが検出
CREATE TABLE IF NOT EXISTS ops.shift_issues (
    issue_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    plan_id INT,
    shift_date DATE NOT NULL,
    day_of_week VARCHAR(10),
    issue_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    impact TEXT,
    recommendation TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES ops.shift_plans(plan_id) ON DELETE CASCADE,
    CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_shift_issues_tenant ON ops.shift_issues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_issues_store ON ops.shift_issues(store_id);
CREATE INDEX IF NOT EXISTS idx_shift_issues_date ON ops.shift_issues(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_issues_type ON ops.shift_issues(issue_type);

COMMENT ON TABLE ops.shift_issues IS 'シフト問題（AIが検出）';

-- 1.6 shift_solutions（シフト解決策）- AIが生成
CREATE TABLE IF NOT EXISTS ops.shift_solutions (
    solution_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    issue_id INT NOT NULL,
    shift_date DATE NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    staff_from INT,
    staff_to INT,
    time_slot VARCHAR(50),
    skill_level_to VARCHAR(20),
    expected_improvement TEXT,
    implementation_note TEXT,
    is_implemented BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (issue_id) REFERENCES ops.shift_issues(issue_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_from) REFERENCES hr.staff(staff_id) ON DELETE SET NULL,
    FOREIGN KEY (staff_to) REFERENCES hr.staff(staff_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_shift_solutions_tenant ON ops.shift_solutions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_solutions_store ON ops.shift_solutions(store_id);
CREATE INDEX IF NOT EXISTS idx_shift_solutions_issue ON ops.shift_solutions(issue_id);

COMMENT ON TABLE ops.shift_solutions IS 'シフト解決策（AIが生成）';

-- 1.7 demand_forecasts（需要予測）- CSV投入
CREATE TABLE IF NOT EXISTS ops.demand_forecasts (
    forecast_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    forecast_date DATE NOT NULL,
    hour INT,
    predicted_customers INT,
    predicted_sales DECIMAL(12,2),
    required_staff INT,
    required_skills JSONB,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    CHECK (hour BETWEEN 0 AND 23)
);

CREATE INDEX IF NOT EXISTS idx_demand_forecasts_tenant ON ops.demand_forecasts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_store ON ops.demand_forecasts(store_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_date ON ops.demand_forecasts(forecast_date);

COMMENT ON TABLE ops.demand_forecasts IS '需要予測（CSV投入）';

-- 1.8 work_hours_actual（勤怠実績）- CSV投入
CREATE TABLE IF NOT EXISTS ops.work_hours_actual (
    work_hours_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    shift_id INT,
    year INT NOT NULL,
    month INT NOT NULL,
    work_date DATE NOT NULL,
    staff_id INT NOT NULL,
    staff_name VARCHAR(100),
    scheduled_start TIME,
    scheduled_end TIME,
    actual_start TIME,
    actual_end TIME,
    scheduled_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    break_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    is_late BOOLEAN DEFAULT FALSE,
    is_early_leave BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES ops.shifts(shift_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_work_hours_actual_tenant ON ops.work_hours_actual(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_hours_actual_store ON ops.work_hours_actual(store_id);
CREATE INDEX IF NOT EXISTS idx_work_hours_actual_staff ON ops.work_hours_actual(staff_id);
CREATE INDEX IF NOT EXISTS idx_work_hours_actual_date ON ops.work_hours_actual(work_date);

COMMENT ON TABLE ops.work_hours_actual IS '勤怠実績（CSV投入）';

-- ============================================
-- 2. HR - 人事・給与系（1テーブル）
-- ============================================

-- 2.1 payroll（給与計算）- CSV投入
CREATE TABLE IF NOT EXISTS hr.payroll (
    payroll_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    staff_id INT NOT NULL,
    staff_name VARCHAR(100),
    work_days INT,
    work_hours DECIMAL(8,2),
    base_salary DECIMAL(12,2),
    overtime_pay DECIMAL(12,2),
    commute_allowance DECIMAL(10,2),
    other_allowances DECIMAL(10,2),
    gross_salary DECIMAL(12,2),
    health_insurance DECIMAL(10,2),
    pension_insurance DECIMAL(10,2),
    employment_insurance DECIMAL(10,2),
    income_tax DECIMAL(10,2),
    resident_tax DECIMAL(10,2),
    total_deduction DECIMAL(12,2),
    net_salary DECIMAL(12,2),
    payment_date DATE,
    payment_status VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    CHECK (payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_payroll_tenant ON hr.payroll(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_store ON hr.payroll(store_id);
CREATE INDEX IF NOT EXISTS idx_payroll_staff ON hr.payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON hr.payroll(year, month);

COMMENT ON TABLE hr.payroll IS '給与計算（CSV投入）';

-- ============================================
-- 3. ANALYTICS - 分析系（3テーブル）
-- ============================================

-- 3.1 sales_actual（売上実績）- CSV投入
CREATE TABLE IF NOT EXISTS analytics.sales_actual (
    actual_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    store_id INT NOT NULL,
    actual_sales DECIMAL(12,2),
    daily_average DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sales_actual_tenant ON analytics.sales_actual(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_actual_store ON analytics.sales_actual(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_actual_period ON analytics.sales_actual(year, month);

COMMENT ON TABLE analytics.sales_actual IS '売上実績（CSV投入）';

-- 3.2 sales_forecast（売上予測）- CSV投入
CREATE TABLE IF NOT EXISTS analytics.sales_forecast (
    forecast_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    store_id INT NOT NULL,
    forecasted_sales DECIMAL(12,2),
    required_labor_cost DECIMAL(12,2),
    required_hours DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sales_forecast_tenant ON analytics.sales_forecast(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_forecast_store ON analytics.sales_forecast(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_forecast_period ON analytics.sales_forecast(year, month);

COMMENT ON TABLE analytics.sales_forecast IS '売上予測（CSV投入）';

-- 3.3 dashboard_metrics（ダッシュボード指標）- システム自動生成
CREATE TABLE IF NOT EXISTS analytics.dashboard_metrics (
    metric_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    predicted DECIMAL(12,2),
    actual DECIMAL(12,2),
    unit VARCHAR(20),
    status VARCHAR(20),
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    CHECK (status IN ('GOOD', 'WARNING', 'ALERT', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_tenant ON analytics.dashboard_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_name ON analytics.dashboard_metrics(metric_name);

COMMENT ON TABLE analytics.dashboard_metrics IS 'ダッシュボード指標（システム自動生成）';

-- ============================================
-- 4. トリガー設定（updated_at自動更新）
-- ============================================

DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname IN ('ops', 'hr', 'analytics')
        AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = pg_tables.schemaname
            AND table_name = pg_tables.tablename
            AND column_name = 'updated_at'
        )
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I.%I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I.%I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ', t.tablename, t.schemaname, t.tablename, t.tablename, t.schemaname, t.tablename);
    END LOOP;
END $$;

-- ============================================
-- 5. 完了メッセージ
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ トランザクションテーブル作成完了';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '作成されたテーブル: 13個';
    RAISE NOTICE '';
    RAISE NOTICE '【OPS】8テーブル';
    RAISE NOTICE '  - shift_plans (シフト計画)';
    RAISE NOTICE '  - shifts (シフト実績/計画)';
    RAISE NOTICE '  - shift_preferences (シフト希望)';
    RAISE NOTICE '  - availability_requests (出勤可否)';
    RAISE NOTICE '  - shift_issues (シフト問題)';
    RAISE NOTICE '  - shift_solutions (シフト解決策)';
    RAISE NOTICE '  - demand_forecasts (需要予測)';
    RAISE NOTICE '  - work_hours_actual (勤怠実績)';
    RAISE NOTICE '';
    RAISE NOTICE '【HR】1テーブル';
    RAISE NOTICE '  - payroll (給与計算)';
    RAISE NOTICE '';
    RAISE NOTICE '【ANALYTICS】3テーブル';
    RAISE NOTICE '  - sales_actual (売上実績)';
    RAISE NOTICE '  - sales_forecast (売上予測)';
    RAISE NOTICE '  - dashboard_metrics (ダッシュボード指標)';
    RAISE NOTICE '';
END $$;
