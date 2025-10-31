-- ============================================
-- AIシフトスケジューラー マルチテナント対応スキーマ構築
-- 対象: Railway PostgreSQL 15+
-- 作成日: 2025-10-31
--
-- 構成:
--   - 5つの機能別スキーマ (core, ops, hr, analytics, audit)
--   - 3層階層構造 (tenant → division → store)
--   - 全テーブルにtenant_id追加
-- ============================================

-- ============================================
-- 1. スキーマ作成
-- ============================================

-- 既存のpublicスキーマは残したまま、新しいスキーマを作成
CREATE SCHEMA IF NOT EXISTS core;       -- テナント・事業・店舗マスタ
CREATE SCHEMA IF NOT EXISTS ops;        -- シフト運用データ
CREATE SCHEMA IF NOT EXISTS hr;         -- 人事・給与データ
CREATE SCHEMA IF NOT EXISTS analytics;  -- 売上・分析データ
CREATE SCHEMA IF NOT EXISTS audit;      -- 監査・履歴データ

COMMENT ON SCHEMA core IS 'コアマスタデータ（テナント、事業、店舗、役職、スキル等）';
COMMENT ON SCHEMA ops IS 'シフト運用データ（シフト計画、実績、制約等）';
COMMENT ON SCHEMA hr IS '人事給与データ（スタッフ、給与、勤怠等）';
COMMENT ON SCHEMA analytics IS '分析データ（売上、需要予測、KPI等）';
COMMENT ON SCHEMA audit IS '監査ログ（変更履歴、チェック記録等）';

-- ============================================
-- 2. Core Schema - テナント・事業・店舗
-- ============================================

-- 2.1 テナント（法人）マスタ
CREATE TABLE core.tenants (
    tenant_id SERIAL PRIMARY KEY,
    tenant_code VARCHAR(50) UNIQUE NOT NULL,
    tenant_name VARCHAR(200) NOT NULL,
    corporate_number VARCHAR(13),  -- 法人番号
    contract_plan VARCHAR(50) NOT NULL DEFAULT 'STANDARD',  -- STANDARD, PREMIUM, ENTERPRISE
    contract_start_date DATE NOT NULL,
    contract_end_date DATE,
    max_divisions INT DEFAULT 10,
    max_stores INT DEFAULT 100,
    max_staff INT DEFAULT 1000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_code ON core.tenants(tenant_code);
CREATE INDEX idx_tenants_active ON core.tenants(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE core.tenants IS 'テナント（法人）マスタ';
COMMENT ON COLUMN core.tenants.contract_plan IS 'STANDARD, PREMIUM, ENTERPRISE';
COMMENT ON COLUMN core.tenants.corporate_number IS '法人番号（13桁）';

-- 2.2 事業マスタ
CREATE TABLE core.divisions (
    division_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    division_code VARCHAR(50) NOT NULL,
    division_name VARCHAR(200) NOT NULL,
    division_type VARCHAR(50),  -- 飲食, 小売, サービス等
    parent_division_id INT,  -- 階層的な事業構造に対応
    contact_email VARCHAR(200),
    contact_phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, division_code),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_division_id) REFERENCES core.divisions(division_id) ON DELETE SET NULL
);

CREATE INDEX idx_divisions_tenant ON core.divisions(tenant_id);
CREATE INDEX idx_divisions_parent ON core.divisions(parent_division_id);
CREATE INDEX idx_divisions_active ON core.divisions(tenant_id, is_active) WHERE is_active = TRUE;

COMMENT ON TABLE core.divisions IS '事業マスタ（1法人に複数事業）';
COMMENT ON COLUMN core.divisions.parent_division_id IS '親事業ID（階層構造対応）';

-- 2.3 店舗マスタ（マルチテナント対応版）
CREATE TABLE core.stores (
    store_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    division_id INT NOT NULL,
    store_code VARCHAR(50) NOT NULL,
    store_name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    phone_number VARCHAR(20),
    business_hours_start TIME DEFAULT '09:00',
    business_hours_end TIME DEFAULT '22:00',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, division_id, store_code),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES core.divisions(division_id) ON DELETE CASCADE
);

CREATE INDEX idx_stores_tenant ON core.stores(tenant_id);
CREATE INDEX idx_stores_division ON core.stores(division_id);
CREATE INDEX idx_stores_code ON core.stores(tenant_id, store_code);
CREATE INDEX idx_stores_active ON core.stores(tenant_id, is_active) WHERE is_active = TRUE;

COMMENT ON TABLE core.stores IS '店舗マスタ（マルチテナント対応）';

-- 2.4 役職マスタ（マルチテナント対応版）
CREATE TABLE core.roles (
    role_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, role_code),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE
);

CREATE INDEX idx_roles_tenant ON core.roles(tenant_id);
CREATE INDEX idx_roles_active ON core.roles(tenant_id, is_active) WHERE is_active = TRUE;

COMMENT ON TABLE core.roles IS '役職マスタ（マルチテナント対応）';

-- 2.5 スキルマスタ（マルチテナント対応版）
CREATE TABLE core.skills (
    skill_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    skill_code VARCHAR(50) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, skill_code),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE
);

CREATE INDEX idx_skills_tenant ON core.skills(tenant_id);
CREATE INDEX idx_skills_active ON core.skills(tenant_id, is_active) WHERE is_active = TRUE;

COMMENT ON TABLE core.skills IS 'スキルマスタ（マルチテナント対応）';

-- 2.6 資格マスタ（マルチテナント対応版）
CREATE TABLE core.certifications (
    certification_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    certification_code VARCHAR(50) NOT NULL,
    certification_name VARCHAR(200) NOT NULL,
    issuing_organization VARCHAR(200),
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, certification_code),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE
);

CREATE INDEX idx_certifications_tenant ON core.certifications(tenant_id);
CREATE INDEX idx_certifications_required ON core.certifications(tenant_id, is_required) WHERE is_required = TRUE;

COMMENT ON TABLE core.certifications IS '資格マスタ（マルチテナント対応）';

-- 2.7 シフトパターンマスタ（マルチテナント対応版）
CREATE TABLE core.shift_patterns (
    pattern_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT,  -- NULL = 全店舗共通, 指定 = 店舗固有
    pattern_code VARCHAR(50) NOT NULL,
    pattern_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, pattern_code),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    CHECK (end_time > start_time)
);

CREATE INDEX idx_shift_patterns_tenant ON core.shift_patterns(tenant_id);
CREATE INDEX idx_shift_patterns_store ON core.shift_patterns(store_id);

COMMENT ON TABLE core.shift_patterns IS 'シフトパターンマスタ（マルチテナント対応）';

-- ============================================
-- 3. HR Schema - 人事・給与データ
-- ============================================

-- 3.1 スタッフマスタ（マルチテナント対応版）
CREATE TABLE hr.staff (
    staff_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    division_id INT,  -- スタッフが所属する事業
    store_id INT NOT NULL,
    role_id INT NOT NULL,
    staff_code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200),
    phone_number VARCHAR(20),
    employment_type VARCHAR(50) NOT NULL,
    hire_date DATE NOT NULL,
    resignation_date DATE,
    monthly_salary DECIMAL(10,2),
    hourly_rate DECIMAL(8,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, staff_code),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES core.divisions(division_id) ON DELETE SET NULL,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES core.roles(role_id) ON DELETE RESTRICT,
    CHECK (employment_type IN ('MONTHLY', 'HOURLY', 'CONTRACT', 'PART_TIME')),
    CHECK ((employment_type = 'MONTHLY' AND monthly_salary IS NOT NULL) OR
           (employment_type IN ('HOURLY', 'PART_TIME') AND hourly_rate IS NOT NULL))
);

CREATE INDEX idx_staff_tenant ON hr.staff(tenant_id);
CREATE INDEX idx_staff_division ON hr.staff(division_id);
CREATE INDEX idx_staff_store ON hr.staff(store_id);
CREATE INDEX idx_staff_code ON hr.staff(tenant_id, staff_code);
CREATE INDEX idx_staff_active ON hr.staff(tenant_id, is_active) WHERE is_active = TRUE;

COMMENT ON TABLE hr.staff IS 'スタッフマスタ（マルチテナント対応）';

-- 3.2 スタッフスキル（マルチテナント対応版）
CREATE TABLE hr.staff_skills (
    staff_skill_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    staff_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level INT NOT NULL DEFAULT 1,
    acquired_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (staff_id, skill_id),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES core.skills(skill_id) ON DELETE CASCADE,
    CHECK (proficiency_level BETWEEN 1 AND 5)
);

CREATE INDEX idx_staff_skills_tenant ON hr.staff_skills(tenant_id);
CREATE INDEX idx_staff_skills_staff ON hr.staff_skills(staff_id);
CREATE INDEX idx_staff_skills_skill ON hr.staff_skills(skill_id);

COMMENT ON TABLE hr.staff_skills IS 'スタッフスキル（マルチテナント対応）';

-- 3.3 スタッフ資格（マルチテナント対応版）
CREATE TABLE hr.staff_certifications (
    staff_certification_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    staff_id INT NOT NULL,
    certification_id INT NOT NULL,
    acquired_date DATE NOT NULL,
    expiration_date DATE,
    certification_number VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (staff_id, certification_id),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (certification_id) REFERENCES core.certifications(certification_id) ON DELETE CASCADE
);

CREATE INDEX idx_staff_certs_tenant ON hr.staff_certifications(tenant_id);
CREATE INDEX idx_staff_certs_staff ON hr.staff_certifications(staff_id);
CREATE INDEX idx_staff_certs_cert ON hr.staff_certifications(certification_id);

COMMENT ON TABLE hr.staff_certifications IS 'スタッフ資格（マルチテナント対応）';

-- 3.4 給与実績（マルチテナント対応版）
CREATE TABLE hr.payroll (
    payroll_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    staff_id INT NOT NULL,
    payment_year INT NOT NULL,
    payment_month INT NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    overtime_pay DECIMAL(10,2) NOT NULL DEFAULT 0,
    commute_allowance DECIMAL(10,2) NOT NULL DEFAULT 0,
    other_allowances DECIMAL(10,2) NOT NULL DEFAULT 0,
    health_insurance DECIMAL(10,2) NOT NULL DEFAULT 0,
    pension_insurance DECIMAL(10,2) NOT NULL DEFAULT 0,
    employment_insurance DECIMAL(10,2) NOT NULL DEFAULT 0,
    income_tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    resident_tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, staff_id, payment_year, payment_month),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    CHECK (payment_month BETWEEN 1 AND 12)
);

CREATE INDEX idx_payroll_tenant ON hr.payroll(tenant_id);
CREATE INDEX idx_payroll_staff ON hr.payroll(staff_id);
CREATE INDEX idx_payroll_period ON hr.payroll(tenant_id, payment_year, payment_month);

COMMENT ON TABLE hr.payroll IS '給与実績（マルチテナント対応）';

-- 3.5 通勤手当マスタ（マルチテナント対応版）
CREATE TABLE hr.commute_allowance (
    allowance_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    distance_from_km DECIMAL(5,2) NOT NULL,
    distance_to_km DECIMAL(5,2) NOT NULL,
    allowance_amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    CHECK (distance_from_km < distance_to_km)
);

CREATE INDEX idx_commute_allowance_tenant ON hr.commute_allowance(tenant_id);

COMMENT ON TABLE hr.commute_allowance IS '通勤手当マスタ（マルチテナント対応）';

-- 3.6 保険料率マスタ（マルチテナント対応版）
CREATE TABLE hr.insurance_rates (
    rate_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    insurance_type VARCHAR(50) NOT NULL,
    employee_rate DECIMAL(5,4) NOT NULL,
    employer_rate DECIMAL(5,4) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    CHECK (insurance_type IN ('HEALTH', 'PENSION', 'EMPLOYMENT', 'WORKERS_COMP'))
);

CREATE INDEX idx_insurance_rates_tenant ON hr.insurance_rates(tenant_id);
CREATE INDEX idx_insurance_rates_type ON hr.insurance_rates(tenant_id, insurance_type);

COMMENT ON TABLE hr.insurance_rates IS '保険料率マスタ（マルチテナント対応）';

-- 3.7 税率マスタ（マルチテナント対応版）
CREATE TABLE hr.tax_brackets (
    bracket_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    tax_type VARCHAR(50) NOT NULL,
    income_from DECIMAL(12,2) NOT NULL,
    income_to DECIMAL(12,2),
    tax_rate DECIMAL(5,4) NOT NULL,
    deduction_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    CHECK (tax_type IN ('INCOME_TAX', 'RESIDENT_TAX'))
);

CREATE INDEX idx_tax_brackets_tenant ON hr.tax_brackets(tenant_id);
CREATE INDEX idx_tax_brackets_type ON hr.tax_brackets(tenant_id, tax_type);

COMMENT ON TABLE hr.tax_brackets IS '税率マスタ（マルチテナント対応）';

-- 3.8 スタッフ月次パフォーマンス（マルチテナント対応版）
CREATE TABLE hr.staff_monthly_performance (
    performance_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    staff_id INT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    shift_count INT NOT NULL DEFAULT 0,
    total_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    overtime_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
    attendance_rate DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, staff_id, year, month),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    CHECK (month BETWEEN 1 AND 12)
);

CREATE INDEX idx_staff_perf_tenant ON hr.staff_monthly_performance(tenant_id);
CREATE INDEX idx_staff_perf_staff ON hr.staff_monthly_performance(staff_id);
CREATE INDEX idx_staff_perf_period ON hr.staff_monthly_performance(tenant_id, year, month);

COMMENT ON TABLE hr.staff_monthly_performance IS 'スタッフ月次パフォーマンス（マルチテナント対応）';

-- ============================================
-- 4. Ops Schema - シフト運用データ
-- ============================================

-- 4.1 労働基準法制約（マルチテナント対応版）
CREATE TABLE ops.labor_law_constraints (
    constraint_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    constraint_code VARCHAR(50) NOT NULL,
    constraint_name VARCHAR(200) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, constraint_code),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE
);

CREATE INDEX idx_labor_constraints_tenant ON ops.labor_law_constraints(tenant_id);

COMMENT ON TABLE ops.labor_law_constraints IS '労働基準法制約（マルチテナント対応）';

-- 4.2 店舗制約（マルチテナント対応版）
CREATE TABLE ops.store_constraints (
    store_constraint_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    constraint_type VARCHAR(50) NOT NULL,
    constraint_value TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE
);

CREATE INDEX idx_store_constraints_tenant ON ops.store_constraints(tenant_id);
CREATE INDEX idx_store_constraints_store ON ops.store_constraints(store_id);

COMMENT ON TABLE ops.store_constraints IS '店舗制約（マルチテナント対応）';

-- 4.3 シフト検証ルール（マルチテナント対応版）
CREATE TABLE ops.shift_validation_rules (
    rule_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    rule_code VARCHAR(50) NOT NULL,
    rule_name VARCHAR(200) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, rule_code),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    CHECK (severity IN ('ERROR', 'WARNING', 'INFO'))
);

CREATE INDEX idx_validation_rules_tenant ON ops.shift_validation_rules(tenant_id);

COMMENT ON TABLE ops.shift_validation_rules IS 'シフト検証ルール（マルチテナント対応）';

-- 4.4 シフト計画（マルチテナント対応版）
CREATE TABLE ops.shift_plans (
    plan_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    plan_year INT NOT NULL,
    plan_month INT NOT NULL,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'FIRST',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_by INT,
    approved_by INT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, store_id, plan_year, plan_month, plan_type),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES hr.staff(staff_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES hr.staff(staff_id) ON DELETE SET NULL,
    CHECK (plan_month BETWEEN 1 AND 12),
    CHECK (plan_type IN ('FIRST', 'SECOND', 'FINAL')),
    CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PUBLISHED'))
);

CREATE INDEX idx_shift_plans_tenant ON ops.shift_plans(tenant_id);
CREATE INDEX idx_shift_plans_store ON ops.shift_plans(store_id);
CREATE INDEX idx_shift_plans_period ON ops.shift_plans(tenant_id, plan_year, plan_month);

COMMENT ON TABLE ops.shift_plans IS 'シフト計画（マルチテナント対応）';

-- 4.5 シフト（マルチテナント対応版）
CREATE TABLE ops.shifts (
    shift_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    plan_id INT NOT NULL,
    staff_id INT NOT NULL,
    shift_date DATE NOT NULL,
    pattern_id INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES ops.shift_plans(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (pattern_id) REFERENCES core.shift_patterns(pattern_id) ON DELETE RESTRICT,
    CHECK (end_time > start_time)
);

CREATE INDEX idx_shifts_tenant ON ops.shifts(tenant_id);
CREATE INDEX idx_shifts_plan ON ops.shifts(plan_id);
CREATE INDEX idx_shifts_staff ON ops.shifts(staff_id);
CREATE INDEX idx_shifts_date ON ops.shifts(tenant_id, shift_date);

COMMENT ON TABLE ops.shifts IS 'シフト（マルチテナント対応）';

-- 4.6 シフト希望（マルチテナント対応版）
CREATE TABLE ops.shift_preferences (
    preference_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    staff_id INT NOT NULL,
    preference_date DATE NOT NULL,
    preference_type VARCHAR(50) NOT NULL,
    preferred_pattern_id INT,
    priority INT NOT NULL DEFAULT 3,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, staff_id, preference_date),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (preferred_pattern_id) REFERENCES core.shift_patterns(pattern_id) ON DELETE SET NULL,
    CHECK (preference_type IN ('WANT', 'AVOID', 'OFF', 'FLEXIBLE')),
    CHECK (priority BETWEEN 1 AND 5)
);

CREATE INDEX idx_shift_prefs_tenant ON ops.shift_preferences(tenant_id);
CREATE INDEX idx_shift_prefs_staff ON ops.shift_preferences(staff_id);
CREATE INDEX idx_shift_prefs_date ON ops.shift_preferences(tenant_id, preference_date);

COMMENT ON TABLE ops.shift_preferences IS 'シフト希望（マルチテナント対応）';

-- 4.7 勤務可否申請（マルチテナント対応版）
CREATE TABLE ops.availability_requests (
    request_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    staff_id INT NOT NULL,
    request_date DATE NOT NULL,
    availability_status VARCHAR(50) NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    approved_by INT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, staff_id, request_date),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES hr.staff(staff_id) ON DELETE SET NULL,
    CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE', 'CONDITIONALLY_AVAILABLE')),
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_availability_tenant ON ops.availability_requests(tenant_id);
CREATE INDEX idx_availability_staff ON ops.availability_requests(staff_id);
CREATE INDEX idx_availability_date ON ops.availability_requests(tenant_id, request_date);

COMMENT ON TABLE ops.availability_requests IS '勤務可否申請（マルチテナント対応）';

-- 4.8 勤務時間実績（マルチテナント対応版）
CREATE TABLE ops.work_hours_actual (
    actual_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    shift_id INT NOT NULL,
    staff_id INT NOT NULL,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    actual_break_minutes INT NOT NULL DEFAULT 0,
    actual_work_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, shift_id),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES ops.shifts(shift_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE
);

CREATE INDEX idx_work_hours_tenant ON ops.work_hours_actual(tenant_id);
CREATE INDEX idx_work_hours_shift ON ops.work_hours_actual(shift_id);
CREATE INDEX idx_work_hours_staff ON ops.work_hours_actual(staff_id);

COMMENT ON TABLE ops.work_hours_actual IS '勤務時間実績（マルチテナント対応）';

-- 4.9 シフト問題点（マルチテナント対応版）
CREATE TABLE ops.shift_issues (
    issue_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    plan_id INT,
    shift_id INT,
    issue_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES ops.shift_plans(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES ops.shifts(shift_id) ON DELETE CASCADE,
    CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'IGNORED'))
);

CREATE INDEX idx_shift_issues_tenant ON ops.shift_issues(tenant_id);
CREATE INDEX idx_shift_issues_plan ON ops.shift_issues(plan_id);
CREATE INDEX idx_shift_issues_shift ON ops.shift_issues(shift_id);

COMMENT ON TABLE ops.shift_issues IS 'シフト問題点（マルチテナント対応）';

-- 4.10 シフト解決策（マルチテナント対応版）
CREATE TABLE ops.shift_solutions (
    solution_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    issue_id INT NOT NULL,
    solution_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    applied BOOLEAN NOT NULL DEFAULT FALSE,
    applied_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (issue_id) REFERENCES ops.shift_issues(issue_id) ON DELETE CASCADE
);

CREATE INDEX idx_shift_solutions_tenant ON ops.shift_solutions(tenant_id);
CREATE INDEX idx_shift_solutions_issue ON ops.shift_solutions(issue_id);

COMMENT ON TABLE ops.shift_solutions IS 'シフト解決策（マルチテナント対応）';

-- 4.11 シフト月次サマリー（マルチテナント対応版）
CREATE TABLE ops.shift_monthly_summary (
    summary_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    total_shifts INT NOT NULL DEFAULT 0,
    total_staff INT NOT NULL DEFAULT 0,
    total_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    avg_hours_per_staff DECIMAL(8,2) NOT NULL DEFAULT 0,
    labor_law_violations INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, store_id, year, month),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    CHECK (month BETWEEN 1 AND 12)
);

CREATE INDEX idx_shift_summary_tenant ON ops.shift_monthly_summary(tenant_id);
CREATE INDEX idx_shift_summary_store ON ops.shift_monthly_summary(store_id);
CREATE INDEX idx_shift_summary_period ON ops.shift_monthly_summary(tenant_id, year, month);

COMMENT ON TABLE ops.shift_monthly_summary IS 'シフト月次サマリー（マルチテナント対応）';

-- ============================================
-- 5. Analytics Schema - 売上・分析データ
-- ============================================

-- 5.1 売上実績（マルチテナント対応版）
CREATE TABLE analytics.sales_actual (
    sales_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    actual_date DATE NOT NULL,
    sales_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    customer_count INT NOT NULL DEFAULT 0,
    transaction_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, store_id, actual_date),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE
);

CREATE INDEX idx_sales_tenant ON analytics.sales_actual(tenant_id);
CREATE INDEX idx_sales_store ON analytics.sales_actual(store_id);
CREATE INDEX idx_sales_date ON analytics.sales_actual(tenant_id, actual_date);

COMMENT ON TABLE analytics.sales_actual IS '売上実績（マルチテナント対応）';

-- 5.2 需要予測（マルチテナント対応版）
CREATE TABLE analytics.demand_forecasts (
    forecast_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    forecast_date DATE NOT NULL,
    expected_sales DECIMAL(12,2) NOT NULL,
    expected_customers INT NOT NULL,
    required_staff_count INT NOT NULL,
    confidence_level DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, store_id, forecast_date),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE
);

CREATE INDEX idx_demand_tenant ON analytics.demand_forecasts(tenant_id);
CREATE INDEX idx_demand_store ON analytics.demand_forecasts(store_id);
CREATE INDEX idx_demand_date ON analytics.demand_forecasts(tenant_id, forecast_date);

COMMENT ON TABLE analytics.demand_forecasts IS '需要予測（マルチテナント対応）';

-- 5.3 気象履歴（マルチテナント対応版）
CREATE TABLE analytics.weather_history (
    weather_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT,  -- NULL = 地域共通
    weather_date DATE NOT NULL,
    temperature_avg DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    temperature_min DECIMAL(5,2),
    precipitation_mm DECIMAL(6,2) NOT NULL DEFAULT 0,
    weather_condition VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, store_id, weather_date),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE
);

CREATE INDEX idx_weather_tenant ON analytics.weather_history(tenant_id);
CREATE INDEX idx_weather_store ON analytics.weather_history(store_id);
CREATE INDEX idx_weather_date ON analytics.weather_history(tenant_id, weather_date);

COMMENT ON TABLE analytics.weather_history IS '気象履歴（マルチテナント対応）';

-- 5.4 ダッシュボードメトリクス（マルチテナント対応版）
CREATE TABLE analytics.dashboard_metrics (
    metric_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT,  -- NULL = テナント全体
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, store_id, metric_date, metric_type),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE
);

CREATE INDEX idx_metrics_tenant ON analytics.dashboard_metrics(tenant_id);
CREATE INDEX idx_metrics_store ON analytics.dashboard_metrics(store_id);
CREATE INDEX idx_metrics_date ON analytics.dashboard_metrics(tenant_id, metric_date);

COMMENT ON TABLE analytics.dashboard_metrics IS 'ダッシュボードメトリクス（マルチテナント対応）';

-- ============================================
-- 6. Audit Schema - 監査・履歴データ
-- ============================================

-- 6.1 シフト履歴（マルチテナント対応版）
CREATE TABLE audit.shift_history (
    history_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    shift_id INT NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by INT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES ops.shifts(shift_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES hr.staff(staff_id) ON DELETE SET NULL,
    CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'))
);

CREATE INDEX idx_shift_history_tenant ON audit.shift_history(tenant_id);
CREATE INDEX idx_shift_history_shift ON audit.shift_history(shift_id);
CREATE INDEX idx_shift_history_date ON audit.shift_history(changed_at);

COMMENT ON TABLE audit.shift_history IS 'シフト履歴（マルチテナント対応）';

-- 6.2 安全衛生チェックリストマスタ（マルチテナント対応版）
CREATE TABLE audit.safety_checklist_master (
    checklist_master_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    item_category VARCHAR(50) NOT NULL,
    check_frequency VARCHAR(50) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    CHECK (item_category IN ('CLEANLINESS', 'EQUIPMENT', 'SAFETY', 'INVENTORY', 'OPERATIONS')),
    CHECK (check_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'))
);

CREATE INDEX idx_safety_master_tenant ON audit.safety_checklist_master(tenant_id);
CREATE INDEX idx_safety_master_category ON audit.safety_checklist_master(tenant_id, item_category);

COMMENT ON TABLE audit.safety_checklist_master IS '安全衛生チェックリストマスタ（マルチテナント対応）';

-- 6.3 安全衛生チェック実績（マルチテナント対応版）
CREATE TABLE audit.safety_checklist_records (
    record_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    store_id INT NOT NULL,
    checklist_master_id INT NOT NULL,
    check_date DATE NOT NULL,
    checked_by INT NOT NULL,
    check_result VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, store_id, checklist_master_id, check_date),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES core.stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (checklist_master_id) REFERENCES audit.safety_checklist_master(checklist_master_id) ON DELETE CASCADE,
    FOREIGN KEY (checked_by) REFERENCES hr.staff(staff_id) ON DELETE RESTRICT,
    CHECK (check_result IN ('OK', 'NG', 'FIXED', 'DEFERRED'))
);

CREATE INDEX idx_safety_records_tenant ON audit.safety_checklist_records(tenant_id);
CREATE INDEX idx_safety_records_store ON audit.safety_checklist_records(store_id);
CREATE INDEX idx_safety_records_date ON audit.safety_checklist_records(tenant_id, check_date);

COMMENT ON TABLE audit.safety_checklist_records IS '安全衛生チェック実績（マルチテナント対応）';

-- ============================================
-- 7. トリガー作成（updated_at自動更新）
-- ============================================

-- updated_at自動更新用の関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON core.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_divisions_updated_at BEFORE UPDATE ON core.divisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON core.stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON core.roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON core.skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON core.certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_patterns_updated_at BEFORE UPDATE ON core.shift_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON hr.staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_skills_updated_at BEFORE UPDATE ON hr.staff_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_certs_updated_at BEFORE UPDATE ON hr.staff_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON hr.payroll FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_labor_constraints_updated_at BEFORE UPDATE ON ops.labor_law_constraints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_constraints_updated_at BEFORE UPDATE ON ops.store_constraints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_validation_rules_updated_at BEFORE UPDATE ON ops.shift_validation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_plans_updated_at BEFORE UPDATE ON ops.shift_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON ops.shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_prefs_updated_at BEFORE UPDATE ON ops.shift_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON ops.availability_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_hours_updated_at BEFORE UPDATE ON ops.work_hours_actual FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON analytics.sales_actual FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demand_updated_at BEFORE UPDATE ON analytics.demand_forecasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完了メッセージ
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ マルチテナント対応スキーマ作成完了！';
    RAISE NOTICE '============================================';
    RAISE NOTICE '作成されたスキーマ: core, ops, hr, analytics, audit';
    RAISE NOTICE 'テーブル数: 31テーブル（全テーブルにtenant_id追加）';
    RAISE NOTICE '次のステップ: 006_migrate_to_multitenant.sql を実行';
END $$;
