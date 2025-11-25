-- ============================================
-- AIシフトスケジューラー データベーススキーマ定義
-- マスターテーブル + トランザクションテーブル
-- 対象: PostgreSQL 15+
-- 最終更新: 2025-11-01
-- ============================================

-- スキーマ作成
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS analytics;

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 1: マスターテーブル定義
-- ============================================

-- core.tenants
CREATE TABLE IF NOT EXISTS core.tenants (
    tenant_id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) NOT NULL,
    tenant_name VARCHAR(200) NOT NULL,
    corporate_number VARCHAR(13),
    contract_plan VARCHAR(50) NOT NULL DEFAULT 'STANDARD'::character varying,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE,
    max_divisions INTEGER DEFAULT 10,
    max_stores INTEGER DEFAULT 100,
    max_staff INTEGER DEFAULT 1000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- core.divisions
CREATE TABLE IF NOT EXISTS core.divisions (
    division_id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    division_code VARCHAR(50) NOT NULL,
    division_name VARCHAR(200) NOT NULL,
    division_type VARCHAR(50),
    parent_division_id INTEGER,
    contact_email VARCHAR(200),
    contact_phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- core.stores
CREATE TABLE IF NOT EXISTS core.stores (
    store_id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    division_id INTEGER NOT NULL,
    store_code VARCHAR(50) NOT NULL,
    store_name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    phone_number VARCHAR(20),
    business_hours_start TIME DEFAULT '09:00:00'::time without time zone,
    business_hours_end TIME DEFAULT '22:00:00'::time without time zone,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- core.roles
CREATE TABLE IF NOT EXISTS core.roles (
    role_id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- core.skills
CREATE TABLE IF NOT EXISTS core.skills (
    skill_id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    skill_code VARCHAR(50) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- core.employment_types
CREATE TABLE IF NOT EXISTS core.employment_types (
    employment_type_id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    employment_code VARCHAR(50) NOT NULL,
    employment_name VARCHAR(100) NOT NULL,
    payment_type VARCHAR(20) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- core.shift_patterns
CREATE TABLE IF NOT EXISTS core.shift_patterns (
    pattern_id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    store_id INTEGER,
    pattern_code VARCHAR(50) NOT NULL,
    pattern_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- hr.staff
CREATE TABLE IF NOT EXISTS hr.staff (
    staff_id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    division_id INTEGER,
    store_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    staff_code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200),
    phone_number VARCHAR(20),
    employment_type VARCHAR(50) NOT NULL,
    hire_date DATE NOT NULL,
    resignation_date DATE,
    monthly_salary NUMERIC(10,2),
    hourly_rate NUMERIC(8,2),
    commute_distance_km NUMERIC(5,2),
    has_social_insurance BOOLEAN DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- hr.staff_skills
CREATE TABLE IF NOT EXISTS hr.staff_skills (
    staff_skill_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    staff_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    proficiency_level INTEGER NOT NULL DEFAULT 1,
    acquired_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- hr.staff_certifications
CREATE TABLE IF NOT EXISTS hr.staff_certifications (
    staff_certification_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    staff_id INTEGER NOT NULL,
    certification_id INTEGER NOT NULL,
    acquired_date DATE NOT NULL,
    expiration_date DATE,
    certification_number VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    staff_name VARCHAR(100),
    food_hygiene_cert VARCHAR(50),
    cert_date_fh DATE,
    fire_prevention_cert VARCHAR(50),
    cert_type_fp VARCHAR(50),
    cert_date_fp DATE,
    alcohol_sales_cert VARCHAR(50),
    cert_date_as DATE,
    next_training_as DATE,
    cooking_license VARCHAR(50),
    cert_date_cl DATE,
    driver_license VARCHAR(50),
    license_expire DATE,
    health_manager_cert VARCHAR(50),
    other_certs TEXT,
    notes TEXT
);

-- hr.commute_allowance
CREATE TABLE IF NOT EXISTS hr.commute_allowance (
    allowance_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    distance_from_km NUMERIC(5,2) NOT NULL,
    distance_to_km NUMERIC(5,2) NOT NULL,
    allowance_amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    daily_allowance INTEGER,
    monthly_max INTEGER,
    notes TEXT
);

-- hr.insurance_rates
CREATE TABLE IF NOT EXISTS hr.insurance_rates (
    rate_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    insurance_type VARCHAR(50) NOT NULL,
    employee_rate NUMERIC(5,4) NOT NULL,
    employer_rate NUMERIC(5,4) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rate_type VARCHAR(100),
    rate_name VARCHAR(200),
    rate_percentage NUMERIC(5,2),
    employer_percentage NUMERIC(5,2),
    employee_percentage NUMERIC(5,2),
    applicable_employment_types TEXT,
    notes TEXT
);

-- hr.tax_brackets
CREATE TABLE IF NOT EXISTS hr.tax_brackets (
    bracket_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    tax_type VARCHAR(50) NOT NULL,
    income_from NUMERIC(12,2) NOT NULL,
    income_to NUMERIC(12,2),
    tax_rate NUMERIC(5,4) NOT NULL,
    deduction_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deduction INTEGER,
    bracket_name VARCHAR(100),
    notes TEXT
);

-- ops.labor_law_constraints
CREATE TABLE IF NOT EXISTS ops.labor_law_constraints (
    constraint_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    constraint_code VARCHAR(50) NOT NULL,
    constraint_name VARCHAR(200) NOT NULL,
    value NUMERIC(10,2) NOT NULL,
    unit VARCHAR(20),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    law_id VARCHAR(50),
    law_code VARCHAR(50),
    law_name VARCHAR(200),
    category VARCHAR(100),
    constraint_rule TEXT,
    penalty_level VARCHAR(50),
    legal_reference TEXT
);

-- ops.labor_management_rules
CREATE TABLE IF NOT EXISTS ops.labor_management_rules (
    rule_id VARCHAR(50) NOT NULL,
    tenant_id INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    rule_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    threshold_value NUMERIC(10,2),
    unit VARCHAR(20),
    evaluation_period VARCHAR(20),
    action_type VARCHAR(100),
    priority VARCHAR(20) NOT NULL,
    auto_check BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ops.shift_validation_rules
CREATE TABLE IF NOT EXISTS ops.shift_validation_rules (
    rule_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    rule_code VARCHAR(50) NOT NULL,
    rule_name VARCHAR(200) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    validation_id VARCHAR(50),
    check_category VARCHAR(100),
    validation_rule TEXT,
    description TEXT,
    check_level VARCHAR(50),
    auto_action VARCHAR(100),
    error_message TEXT,
    override_possible BOOLEAN,
    override_authority VARCHAR(100),
    implementation_status VARCHAR(50)
);

-- ops.store_constraints
CREATE TABLE IF NOT EXISTS ops.store_constraints (
    store_constraint_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    store_id INTEGER NOT NULL,
    constraint_type VARCHAR(50) NOT NULL,
    constraint_value TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    constraint_id VARCHAR(50),
    description TEXT,
    priority VARCHAR(50)
);

-- ============================================
-- PART 2: トランザクションテーブル定義
-- ============================================

-- ops.shift_plans（シフト計画）- AIが生成
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
    plan_type VARCHAR(20),
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
    CHECK (status IN ('DRAFT', 'APPROVED'))
);

COMMENT ON TABLE ops.shift_plans IS 'シフト計画（AIが生成）';

-- ops.shifts（シフト実績/計画）- CSV投入 or AI生成
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

COMMENT ON TABLE ops.shifts IS 'シフト実績/計画（CSV投入 or AI生成）';

-- ops.shift_preferences（シフト希望）- メンバーが入力
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

COMMENT ON TABLE ops.shift_preferences IS 'シフト希望（メンバーが入力）';

-- ops.availability_requests（出勤可否リクエスト）- メンバーが入力
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

COMMENT ON TABLE ops.availability_requests IS '出勤可否リクエスト（メンバーが入力）';

-- ops.shift_issues（シフト問題）- AIが検出
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

COMMENT ON TABLE ops.shift_issues IS 'シフト問題（AIが検出）';

-- ops.shift_solutions（シフト解決策）- AIが生成
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

COMMENT ON TABLE ops.shift_solutions IS 'シフト解決策（AIが生成）';

-- ops.demand_forecasts（需要予測）- CSV投入
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

COMMENT ON TABLE ops.demand_forecasts IS '需要予測（CSV投入）';

-- ops.work_hours_actual（勤怠実績）- CSV投入
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
    FOREIGN KEY (shift_id) REFERENCES ops.shifts(shift_id) ON DELETE SET NULL,

    CONSTRAINT uq_work_hours_actual_key UNIQUE (tenant_id, store_id, staff_id, work_date)
);

COMMENT ON TABLE ops.work_hours_actual IS '勤怠実績（CSV投入）';

-- hr.payroll（給与計算）- CSV投入
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

    CONSTRAINT uq_payroll_key UNIQUE (tenant_id, store_id, year, month, staff_id),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    CHECK (payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED'))
);

COMMENT ON TABLE hr.payroll IS '給与計算（CSV投入）';

-- analytics.sales_actual（売上実績）- CSV投入
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

    CONSTRAINT uq_sales_actual_key UNIQUE (tenant_id, year, month, store_id),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE
);

COMMENT ON TABLE analytics.sales_actual IS '売上実績（CSV投入）';

-- analytics.sales_forecast（売上予測）- CSV投入
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

    CONSTRAINT uq_sales_forecast_key UNIQUE (tenant_id, year, month, store_id),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE
);

COMMENT ON TABLE analytics.sales_forecast IS '売上予測（CSV投入）';

-- analytics.dashboard_metrics（ダッシュボード指標）- システム自動生成
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

COMMENT ON TABLE analytics.dashboard_metrics IS 'ダッシュボード指標（システム自動生成）';

-- ============================================
-- PART 3: 制約とインデックス
-- ============================================

-- UNIQUE制約（マスターテーブル）
ALTER TABLE core.tenants ADD CONSTRAINT uq_tenants_code UNIQUE (tenant_code);
ALTER TABLE core.divisions ADD CONSTRAINT uq_divisions_tenant_code UNIQUE (tenant_id, division_code);
ALTER TABLE core.stores ADD CONSTRAINT uq_stores_tenant_div_code UNIQUE (tenant_id, division_id, store_code);
ALTER TABLE core.roles ADD CONSTRAINT uq_roles_tenant_code UNIQUE (tenant_id, role_code);
ALTER TABLE core.skills ADD CONSTRAINT uq_skills_tenant_code UNIQUE (tenant_id, skill_code);
ALTER TABLE core.employment_types ADD CONSTRAINT uq_employment_types_tenant_code UNIQUE (tenant_id, employment_code);
ALTER TABLE core.shift_patterns ADD CONSTRAINT uq_shift_patterns_tenant_code UNIQUE (tenant_id, pattern_code);
ALTER TABLE hr.staff ADD CONSTRAINT uq_staff_tenant_code UNIQUE (tenant_id, staff_code);
ALTER TABLE hr.staff_skills ADD CONSTRAINT uq_staff_skills_staff_skill UNIQUE (staff_id, skill_id);
ALTER TABLE ops.labor_law_constraints ADD CONSTRAINT uq_labor_law_constraints_tenant_code UNIQUE (tenant_id, constraint_code);
ALTER TABLE ops.labor_management_rules ADD CONSTRAINT uq_labor_management_rules_rule_id UNIQUE (rule_id);
ALTER TABLE ops.shift_validation_rules ADD CONSTRAINT uq_shift_validation_rules_tenant_code UNIQUE (tenant_id, rule_code);

-- FOREIGN KEY制約（マスターテーブル）
ALTER TABLE core.divisions ADD CONSTRAINT fk_divisions_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE core.divisions ADD CONSTRAINT fk_divisions_parent FOREIGN KEY (parent_division_id) REFERENCES core.divisions(division_id);
ALTER TABLE core.stores ADD CONSTRAINT fk_stores_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE core.stores ADD CONSTRAINT fk_stores_division FOREIGN KEY (division_id) REFERENCES core.divisions(division_id) ON DELETE CASCADE;
ALTER TABLE core.roles ADD CONSTRAINT fk_roles_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE core.skills ADD CONSTRAINT fk_skills_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE core.employment_types ADD CONSTRAINT fk_employment_types_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE core.shift_patterns ADD CONSTRAINT fk_shift_patterns_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE hr.staff ADD CONSTRAINT fk_staff_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE hr.staff ADD CONSTRAINT fk_staff_division FOREIGN KEY (division_id) REFERENCES core.divisions(division_id);
ALTER TABLE hr.staff ADD CONSTRAINT fk_staff_store FOREIGN KEY (store_id) REFERENCES core.stores(store_id);
ALTER TABLE hr.staff ADD CONSTRAINT fk_staff_role FOREIGN KEY (role_id) REFERENCES core.roles(role_id);
ALTER TABLE hr.staff_skills ADD CONSTRAINT fk_staff_skills_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE hr.staff_skills ADD CONSTRAINT fk_staff_skills_staff FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE;
ALTER TABLE hr.staff_skills ADD CONSTRAINT fk_staff_skills_skill FOREIGN KEY (skill_id) REFERENCES core.skills(skill_id);
ALTER TABLE hr.staff_certifications ADD CONSTRAINT fk_staff_certs_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE hr.staff_certifications ADD CONSTRAINT fk_staff_certs_staff FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE;
ALTER TABLE hr.commute_allowance ADD CONSTRAINT fk_commute_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE hr.insurance_rates ADD CONSTRAINT fk_insurance_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE hr.tax_brackets ADD CONSTRAINT fk_tax_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE ops.labor_law_constraints ADD CONSTRAINT fk_labor_law_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE ops.labor_management_rules ADD CONSTRAINT fk_labor_mgmt_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE ops.shift_validation_rules ADD CONSTRAINT fk_shift_validation_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE ops.store_constraints ADD CONSTRAINT fk_store_constraints_tenant FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE;
ALTER TABLE ops.store_constraints ADD CONSTRAINT fk_store_constraints_store FOREIGN KEY (store_id) REFERENCES core.stores(store_id);

-- インデックス（マスターテーブル）
CREATE INDEX IF NOT EXISTS idx_tenants_active ON core.tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_divisions_tenant ON core.divisions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stores_tenant ON core.stores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stores_division ON core.stores(division_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON core.roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_skills_tenant ON core.skills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employment_types_tenant ON core.employment_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_patterns_tenant ON core.shift_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_tenant ON hr.staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_store ON hr.staff(store_id);
CREATE INDEX IF NOT EXISTS idx_staff_skills_tenant ON hr.staff_skills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_skills_staff ON hr.staff_skills(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_certs_tenant ON hr.staff_certifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_certs_staff ON hr.staff_certifications(staff_id);

-- インデックス（トランザクションテーブル）
CREATE INDEX IF NOT EXISTS idx_shift_plans_tenant ON ops.shift_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_plans_store ON ops.shift_plans(store_id);
CREATE INDEX IF NOT EXISTS idx_shift_plans_period ON ops.shift_plans(plan_year, plan_month);
CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON ops.shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_store ON ops.shifts(store_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON ops.shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_staff ON ops.shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_plan ON ops.shifts(plan_id);
CREATE INDEX IF NOT EXISTS idx_shift_preferences_tenant ON ops.shift_preferences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_preferences_store ON ops.shift_preferences(store_id);
CREATE INDEX IF NOT EXISTS idx_shift_preferences_staff ON ops.shift_preferences(staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_preferences_period ON ops.shift_preferences(year, month);
CREATE INDEX IF NOT EXISTS idx_availability_requests_tenant ON ops.availability_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_availability_requests_store ON ops.availability_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_availability_requests_staff ON ops.availability_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_availability_requests_date ON ops.availability_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_shift_issues_tenant ON ops.shift_issues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_issues_store ON ops.shift_issues(store_id);
CREATE INDEX IF NOT EXISTS idx_shift_issues_date ON ops.shift_issues(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_issues_type ON ops.shift_issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_shift_solutions_tenant ON ops.shift_solutions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_solutions_store ON ops.shift_solutions(store_id);
CREATE INDEX IF NOT EXISTS idx_shift_solutions_issue ON ops.shift_solutions(issue_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_tenant ON ops.demand_forecasts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_store ON ops.demand_forecasts(store_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_date ON ops.demand_forecasts(forecast_date);
-- 労働時間実績テーブルの最適化インデックス（ON CONFLICT高速化用）
CREATE INDEX IF NOT EXISTS idx_work_hours_actual_composite ON ops.work_hours_actual(tenant_id, store_id, staff_id, work_date);
CREATE INDEX IF NOT EXISTS idx_work_hours_actual_year_month ON ops.work_hours_actual(tenant_id, year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_tenant ON hr.payroll(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_store ON hr.payroll(store_id);
CREATE INDEX IF NOT EXISTS idx_payroll_staff ON hr.payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON hr.payroll(year, month);
CREATE INDEX IF NOT EXISTS idx_sales_actual_tenant ON analytics.sales_actual(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_actual_store ON analytics.sales_actual(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_actual_period ON analytics.sales_actual(year, month);
CREATE INDEX IF NOT EXISTS idx_sales_forecast_tenant ON analytics.sales_forecast(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_forecast_store ON analytics.sales_forecast(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_forecast_period ON analytics.sales_forecast(year, month);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_tenant ON analytics.dashboard_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_name ON analytics.dashboard_metrics(metric_name);

-- ============================================
-- PART 4: トリガー（updated_at自動更新）
-- ============================================

-- マスターテーブルのトリガー
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON core.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_divisions_updated_at BEFORE UPDATE ON core.divisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_stores_updated_at BEFORE UPDATE ON core.stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON core.roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_skills_updated_at BEFORE UPDATE ON core.skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_employment_types_updated_at BEFORE UPDATE ON core.employment_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_shift_patterns_updated_at BEFORE UPDATE ON core.shift_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_staff_updated_at BEFORE UPDATE ON hr.staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_staff_skills_updated_at BEFORE UPDATE ON hr.staff_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_staff_certs_updated_at BEFORE UPDATE ON hr.staff_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_commute_updated_at BEFORE UPDATE ON hr.commute_allowance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_insurance_updated_at BEFORE UPDATE ON hr.insurance_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_tax_updated_at BEFORE UPDATE ON hr.tax_brackets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_labor_law_updated_at BEFORE UPDATE ON ops.labor_law_constraints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_labor_mgmt_updated_at BEFORE UPDATE ON ops.labor_management_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_shift_validation_updated_at BEFORE UPDATE ON ops.shift_validation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_store_constraints_updated_at BEFORE UPDATE ON ops.store_constraints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- トランザクションテーブルのトリガー（自動設定）
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname IN ('ops', 'hr', 'analytics')
        AND tablename IN ('shift_plans', 'shifts', 'shift_preferences', 'availability_requests', 
                         'shift_issues', 'shift_solutions', 'demand_forecasts', 'work_hours_actual',
                         'payroll', 'sales_actual', 'sales_forecast', 'dashboard_metrics')
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
-- PART 5: マイグレーション（後から追加された変更）
-- ============================================

-- Migration 1: LINE連携機能 (2025-01-05追加)
-- ============================================

-- 1. スタッフとLINE User IDの紐付けテーブル
CREATE TABLE IF NOT EXISTS hr.staff_line_accounts (
  staff_line_id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  line_user_id VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
  UNIQUE(tenant_id, staff_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_staff_line_accounts_user_id ON hr.staff_line_accounts(line_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_line_accounts_staff_id ON hr.staff_line_accounts(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_line_accounts_tenant_id ON hr.staff_line_accounts(tenant_id);

COMMENT ON TABLE hr.staff_line_accounts IS 'スタッフとLINEアカウントの紐付け';
COMMENT ON COLUMN hr.staff_line_accounts.line_user_id IS 'LINE User ID (Uから始まる一意ID)';
COMMENT ON COLUMN hr.staff_line_accounts.display_name IS 'LINEの表示名';
COMMENT ON COLUMN hr.staff_line_accounts.is_active IS '連携が有効かどうか';

-- 2. LINEメッセージログテーブル
CREATE TABLE IF NOT EXISTS ops.line_message_logs (
  log_id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  line_user_id VARCHAR(255),
  staff_id INTEGER,
  group_id VARCHAR(255),
  message_type VARCHAR(50),
  message_text TEXT,
  parsed_intent VARCHAR(50),
  parsed_data JSONB,
  response_text TEXT,
  status VARCHAR(20), -- 'success', 'failed', 'ignored'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_line_message_logs_created ON ops.line_message_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_line_message_logs_staff ON ops.line_message_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_line_message_logs_status ON ops.line_message_logs(status);
CREATE INDEX IF NOT EXISTS idx_line_message_logs_user_id ON ops.line_message_logs(line_user_id);

COMMENT ON TABLE ops.line_message_logs IS 'LINEメッセージの処理ログ（監査・デバッグ用）';
COMMENT ON COLUMN ops.line_message_logs.status IS 'success: 成功, failed: 失敗, ignored: 無視';
COMMENT ON COLUMN ops.line_message_logs.parsed_data IS '解析されたデータのJSON';

-- 3. shift_preferencesテーブルにユニーク制約を追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_shift_preference_per_staff_period'
  ) THEN
    ALTER TABLE ops.shift_preferences
    ADD CONSTRAINT unique_shift_preference_per_staff_period
    UNIQUE (tenant_id, staff_id, year, month);
  END IF;
END $$;

-- Migration 2: シフト案区分機能 (2025-11-09追加)
-- ============================================

-- shift_plansテーブルにplan_typeカラムを追加
ALTER TABLE ops.shift_plans
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20);

-- Trigger for staff_line_accounts
DROP TRIGGER IF EXISTS update_staff_line_accounts_updated_at ON hr.staff_line_accounts;
CREATE TRIGGER update_staff_line_accounts_updated_at
  BEFORE UPDATE ON hr.staff_line_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
