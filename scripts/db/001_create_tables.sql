-- ============================================
-- AIシフトスケジューラー データベース構築スクリプト
-- 対象: PostgreSQL 15+
-- 実行環境: Railway
-- ============================================

-- ============================================
-- 1. マスターテーブル
-- ============================================

-- 1.1 店舗マスタ
CREATE TABLE stores (
    store_id SERIAL PRIMARY KEY,
    store_code VARCHAR(50) UNIQUE NOT NULL,
    store_name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    phone_number VARCHAR(20),
    business_hours_start TIME DEFAULT '09:00',
    business_hours_end TIME DEFAULT '22:00',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE stores IS '店舗マスタ';
COMMENT ON COLUMN stores.store_id IS '店舗ID（PK）';
COMMENT ON COLUMN stores.store_code IS '店舗コード（ユニーク）';
COMMENT ON COLUMN stores.store_name IS '店舗名';

-- 1.2 役職マスタ
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE roles IS '役職マスタ';
COMMENT ON COLUMN roles.role_id IS '役職ID（PK）';
COMMENT ON COLUMN roles.role_code IS '役職コード（ユニーク）';

-- 1.3 スタッフマスタ
CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    staff_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_kana VARCHAR(200),
    role_id INT NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    hire_date DATE,
    birth_date DATE,
    employment_type VARCHAR(20) NOT NULL DEFAULT 'hourly' CHECK (employment_type IN ('hourly', 'monthly', 'contract')),
    hourly_rate DECIMAL(10,2),
    monthly_salary DECIMAL(10,2),
    contract_fee DECIMAL(10,2),
    daily_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_hours_per_week DECIMAL(5,2) NOT NULL DEFAULT 40,
    min_hours_per_week DECIMAL(5,2) NOT NULL DEFAULT 0,
    max_consecutive_days INT NOT NULL DEFAULT 6,
    skill_level INT NOT NULL DEFAULT 1 CHECK (skill_level BETWEEN 1 AND 5),
    commute_distance_km DECIMAL(5,2) DEFAULT 0,
    has_social_insurance BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

COMMENT ON TABLE staff IS 'スタッフマスタ';
COMMENT ON COLUMN staff.employment_type IS '雇用形態（hourly/monthly/contract）';
COMMENT ON COLUMN staff.daily_cost IS '日額人件費';

-- 1.4 スキルマスタ
CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    skill_code VARCHAR(50) UNIQUE NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE skills IS 'スキルマスタ';

-- 1.5 スタッフスキル中間テーブル
CREATE TABLE staff_skills (
    staff_skill_id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level INT NOT NULL DEFAULT 3 CHECK (proficiency_level BETWEEN 1 AND 5),
    acquired_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (staff_id, skill_id),
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
);

COMMENT ON TABLE staff_skills IS 'スタッフスキル中間テーブル';
COMMENT ON COLUMN staff_skills.proficiency_level IS '熟練度（1-5）';

-- 1.6 資格マスタ
CREATE TABLE certifications (
    certification_id SERIAL PRIMARY KEY,
    certification_code VARCHAR(50) UNIQUE NOT NULL,
    certification_name VARCHAR(200) NOT NULL,
    issuing_organization VARCHAR(200),
    validity_period_months INT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE certifications IS '資格マスタ';
COMMENT ON COLUMN certifications.validity_period_months IS '有効期間（月）';

-- 1.7 スタッフ資格中間テーブル
CREATE TABLE staff_certifications (
    staff_certification_id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL,
    certification_id INT NOT NULL,
    acquisition_date DATE,
    expiration_date DATE,
    certification_number VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (certification_id) REFERENCES certifications(certification_id) ON DELETE CASCADE
);

COMMENT ON TABLE staff_certifications IS 'スタッフ資格中間テーブル';

-- 1.8 シフトパターンマスタ
CREATE TABLE shift_patterns (
    pattern_id SERIAL PRIMARY KEY,
    pattern_code VARCHAR(50) UNIQUE NOT NULL,
    pattern_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT NOT NULL DEFAULT 0,
    total_hours DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE shift_patterns IS 'シフトパターンマスタ';

-- 1.9 労働基準法制約マスタ
CREATE TABLE labor_law_constraints (
    constraint_id SERIAL PRIMARY KEY,
    constraint_code VARCHAR(50) UNIQUE NOT NULL,
    constraint_name VARCHAR(200) NOT NULL,
    constraint_type VARCHAR(50) NOT NULL,
    value TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE labor_law_constraints IS '労働基準法制約マスタ';
COMMENT ON COLUMN labor_law_constraints.value IS '制約値（JSON形式）';

-- 1.10 店舗制約マスタ
CREATE TABLE store_constraints (
    store_constraint_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    constraint_type VARCHAR(50) NOT NULL,
    constraint_value TEXT,
    priority INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

COMMENT ON TABLE store_constraints IS '店舗制約マスタ';
COMMENT ON COLUMN store_constraints.constraint_value IS '制約値（JSON形式）';

-- 1.11 シフト検証ルールマスタ
CREATE TABLE shift_validation_rules (
    rule_id SERIAL PRIMARY KEY,
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    rule_name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'ERROR' CHECK (severity IN ('ERROR', 'WARNING', 'INFO')),
    validation_logic TEXT,
    error_message TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE shift_validation_rules IS 'シフト検証ルールマスタ';
COMMENT ON COLUMN shift_validation_rules.severity IS '重要度（ERROR/WARNING/INFO）';

-- ============================================
-- 2. トランザクションテーブル
-- ============================================

-- 2.1 シフト計画
CREATE TABLE shift_plans (
    plan_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    plan_year INT NOT NULL,
    plan_month INT NOT NULL CHECK (plan_month BETWEEN 1 AND 12),
    plan_type VARCHAR(20) NOT NULL DEFAULT 'FIRST' CHECK (plan_type IN ('FIRST', 'SECOND')),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'PUBLISHED')),
    total_labor_cost DECIMAL(12,2) DEFAULT 0,
    total_work_hours DECIMAL(10,2) DEFAULT 0,
    created_by INT,
    approved_by INT,
    approved_at TIMESTAMP,
    published_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (store_id, plan_year, plan_month, plan_type),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (created_by) REFERENCES staff(staff_id),
    FOREIGN KEY (approved_by) REFERENCES staff(staff_id)
);

COMMENT ON TABLE shift_plans IS 'シフト計画';
COMMENT ON COLUMN shift_plans.plan_type IS '計画タイプ（FIRST/SECOND）';
COMMENT ON COLUMN shift_plans.status IS 'ステータス（DRAFT/APPROVED/PUBLISHED）';

-- 2.2 シフト
CREATE TABLE shifts (
    shift_id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL,
    staff_id INT NOT NULL,
    shift_date DATE NOT NULL,
    pattern_id INT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT NOT NULL DEFAULT 0,
    total_hours DECIMAL(5,2) NOT NULL,
    labor_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    assigned_skills JSONB DEFAULT '[]',
    is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
    is_modified BOOLEAN NOT NULL DEFAULT FALSE,
    modified_reason TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES shift_plans(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id),
    FOREIGN KEY (pattern_id) REFERENCES shift_patterns(pattern_id)
);

COMMENT ON TABLE shifts IS 'シフト';
COMMENT ON COLUMN shifts.assigned_skills IS '割り当てスキル（JSON配列）';

-- 2.3 シフト希望
CREATE TABLE shift_preferences (
    preference_id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL,
    target_year INT NOT NULL,
    target_month INT NOT NULL CHECK (target_month BETWEEN 1 AND 12),
    preference_date DATE NOT NULL,
    preference_type VARCHAR(20) NOT NULL CHECK (preference_type IN ('WORK', 'OFF', 'MORNING', 'AFTERNOON', 'NIGHT')),
    priority INT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    submitted_at TIMESTAMP,
    reviewed_by INT,
    reviewed_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES staff(staff_id)
);

COMMENT ON TABLE shift_preferences IS 'シフト希望';
COMMENT ON COLUMN shift_preferences.preference_type IS '希望タイプ（WORK/OFF/MORNING/AFTERNOON/NIGHT）';

-- 2.4 勤務可否申請
CREATE TABLE availability_requests (
    request_id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL,
    request_date DATE NOT NULL,
    availability_status VARCHAR(20) NOT NULL CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE', 'PARTIAL')),
    available_from TIME,
    available_to TIME,
    reason TEXT,
    request_type VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (request_type IN ('NORMAL', 'EMERGENCY', 'VACATION')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by INT,
    reviewed_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES staff(staff_id)
);

COMMENT ON TABLE availability_requests IS '勤務可否申請';

-- 2.5 需要予測
CREATE TABLE demand_forecasts (
    forecast_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    forecast_date DATE NOT NULL,
    day_of_week VARCHAR(10),
    expected_sales DECIMAL(12,2) DEFAULT 0,
    expected_customers INT DEFAULT 0,
    weather_condition VARCHAR(50),
    temperature DECIMAL(5,2),
    special_event VARCHAR(200),
    required_staff_count INT DEFAULT 0,
    forecast_method VARCHAR(50) DEFAULT 'AI' CHECK (forecast_method IN ('AI', 'MANUAL')),
    confidence_level DECIMAL(5,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (store_id, forecast_date),
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

COMMENT ON TABLE demand_forecasts IS '需要予測';
COMMENT ON COLUMN demand_forecasts.forecast_method IS '予測方法（AI/MANUAL）';

-- ============================================
-- 3. 実績データテーブル
-- ============================================

-- 3.1 売上実績
CREATE TABLE sales_actual (
    actual_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    actual_date DATE NOT NULL,
    sales_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    customer_count INT NOT NULL DEFAULT 0,
    average_spend DECIMAL(10,2) DEFAULT 0,
    weather VARCHAR(50),
    temperature DECIMAL(5,2),
    is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (store_id, actual_date),
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

COMMENT ON TABLE sales_actual IS '売上実績';

-- 3.2 給与実績
CREATE TABLE payroll (
    payroll_id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL,
    payment_year INT NOT NULL,
    payment_month INT NOT NULL CHECK (payment_month BETWEEN 1 AND 12),
    total_work_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_work_days INT NOT NULL DEFAULT 0,
    base_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    night_shift_allowance DECIMAL(12,2) DEFAULT 0,
    holiday_pay DECIMAL(12,2) DEFAULT 0,
    commute_allowance DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    net_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID')),
    payment_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (staff_id, payment_year, payment_month),
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE
);

COMMENT ON TABLE payroll IS '給与実績';

-- 3.3 勤務時間実績
CREATE TABLE work_hours_actual (
    work_hours_id SERIAL PRIMARY KEY,
    shift_id INT NOT NULL,
    staff_id INT NOT NULL,
    work_date DATE NOT NULL,
    scheduled_start TIME NOT NULL,
    scheduled_end TIME NOT NULL,
    actual_start TIME,
    actual_end TIME,
    break_minutes INT NOT NULL DEFAULT 0,
    actual_work_hours DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    late_minutes INT DEFAULT 0,
    early_leave_minutes INT DEFAULT 0,
    attendance_status VARCHAR(20) NOT NULL DEFAULT 'PRESENT' CHECK (attendance_status IN ('PRESENT', 'ABSENT', 'LATE', 'EARLY')),
    absence_reason TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE
);

COMMENT ON TABLE work_hours_actual IS '勤務時間実績';
COMMENT ON COLUMN work_hours_actual.attendance_status IS '出勤ステータス（PRESENT/ABSENT/LATE/EARLY）';

-- 3.4 シフト履歴
CREATE TABLE shift_history (
    history_id SERIAL PRIMARY KEY,
    shift_id INT NOT NULL,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE')),
    changed_by INT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB,
    new_values JSONB,
    change_reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES staff(staff_id)
);

COMMENT ON TABLE shift_history IS 'シフト履歴';
COMMENT ON COLUMN shift_history.change_type IS '変更タイプ（CREATE/UPDATE/DELETE）';

-- ============================================
-- 4. インデックス作成
-- ============================================

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

-- ============================================
-- 5. トリガー（updated_at自動更新）
-- ============================================

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_skills_updated_at BEFORE UPDATE ON staff_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_certifications_updated_at BEFORE UPDATE ON staff_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_patterns_updated_at BEFORE UPDATE ON shift_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_labor_law_constraints_updated_at BEFORE UPDATE ON labor_law_constraints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_constraints_updated_at BEFORE UPDATE ON store_constraints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_validation_rules_updated_at BEFORE UPDATE ON shift_validation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_plans_updated_at BEFORE UPDATE ON shift_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_preferences_updated_at BEFORE UPDATE ON shift_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availability_requests_updated_at BEFORE UPDATE ON availability_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demand_forecasts_updated_at BEFORE UPDATE ON demand_forecasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_actual_updated_at BEFORE UPDATE ON sales_actual FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_hours_actual_updated_at BEFORE UPDATE ON work_hours_actual FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
