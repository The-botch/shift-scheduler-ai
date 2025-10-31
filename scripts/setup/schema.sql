-- ============================================
-- AIシフトスケジューラー マスターテーブル定義
-- 実際のDBから自動生成
-- 対象: PostgreSQL 15+
-- ============================================

-- スキーマ作成
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS ops;

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


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
    is_active BOOLEAN NOT NULL DEFAULT true,
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
-- 制約とインデックス
-- (PRIMARY KEYはすでにテーブル定義内でSERIALで設定済み)
-- ============================================
-- UNIQUE制約
-- ============================================
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

-- ============================================
-- FOREIGN KEY制約
-- ============================================
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

-- ============================================
-- インデックス
-- ============================================
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

-- ============================================
-- トリガー (updated_at自動更新)
-- ============================================
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
