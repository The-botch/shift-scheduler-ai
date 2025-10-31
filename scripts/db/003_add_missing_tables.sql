-- ============================================
-- 未対応CSVファイル対応テーブル追加スクリプト
-- CSVに存在する全機能をデータベースでも実現
-- ============================================

-- ============================================
-- 1. 給与計算関連テーブル（優先度: 高）
-- ============================================

-- 1.1 通勤手当マスタ
CREATE TABLE commute_allowance (
    allowance_id SERIAL PRIMARY KEY,
    distance_from_km DECIMAL(5,2) NOT NULL,
    distance_to_km DECIMAL(5,2) NOT NULL,
    allowance_amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (distance_from_km < distance_to_km)
);

COMMENT ON TABLE commute_allowance IS '通勤手当マスタ';
COMMENT ON COLUMN commute_allowance.distance_from_km IS '距離範囲開始（km）';
COMMENT ON COLUMN commute_allowance.distance_to_km IS '距離範囲終了（km）';
COMMENT ON COLUMN commute_allowance.allowance_amount IS '手当金額';

-- 1.2 保険料率マスタ
CREATE TABLE insurance_rates (
    rate_id SERIAL PRIMARY KEY,
    insurance_type VARCHAR(50) NOT NULL,
    insurance_name VARCHAR(100) NOT NULL,
    employee_rate DECIMAL(5,4) NOT NULL,
    employer_rate DECIMAL(5,4) NOT NULL,
    salary_lower_limit DECIMAL(12,2),
    salary_upper_limit DECIMAL(12,2),
    effective_from DATE NOT NULL,
    effective_to DATE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (insurance_type IN ('health', 'pension', 'employment', 'workers_comp'))
);

COMMENT ON TABLE insurance_rates IS '保険料率マスタ';
COMMENT ON COLUMN insurance_rates.insurance_type IS '保険種別（health/pension/employment/workers_comp）';
COMMENT ON COLUMN insurance_rates.employee_rate IS '従業員負担率';
COMMENT ON COLUMN insurance_rates.employer_rate IS '事業主負担率';

-- 1.3 税率マスタ
CREATE TABLE tax_brackets (
    bracket_id SERIAL PRIMARY KEY,
    tax_type VARCHAR(50) NOT NULL,
    income_from DECIMAL(12,2) NOT NULL,
    income_to DECIMAL(12,2),
    tax_rate DECIMAL(5,4) NOT NULL,
    deduction_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    effective_from DATE NOT NULL,
    effective_to DATE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (tax_type IN ('income', 'resident', 'special'))
);

COMMENT ON TABLE tax_brackets IS '税率マスタ';
COMMENT ON COLUMN tax_brackets.tax_type IS '税種別（income/resident/special）';
COMMENT ON COLUMN tax_brackets.income_from IS '課税所得下限';
COMMENT ON COLUMN tax_brackets.income_to IS '課税所得上限';
COMMENT ON COLUMN tax_brackets.tax_rate IS '税率';
COMMENT ON COLUMN tax_brackets.deduction_amount IS '控除額';

-- ============================================
-- 2. シフト管理拡張テーブル（優先度: 中）
-- ============================================

-- 2.1 シフト問題点
CREATE TABLE shift_issues (
    issue_id SERIAL PRIMARY KEY,
    shift_id INT,
    plan_id INT,
    issue_date DATE NOT NULL,
    issue_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('HIGH', 'MEDIUM', 'LOW')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    affected_staff_ids JSONB DEFAULT '[]',
    detected_by INT,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INT,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES shift_plans(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (detected_by) REFERENCES staff(staff_id),
    FOREIGN KEY (resolved_by) REFERENCES staff(staff_id),
    CHECK (issue_type IN ('CONFLICT', 'SHORTAGE', 'SKILL_MISMATCH', 'LABOR_LAW_VIOLATION',
                          'OVERTIME', 'CONSECUTIVE_WORK', 'PREFERENCE_MISMATCH', 'OTHER'))
);

COMMENT ON TABLE shift_issues IS 'シフト問題点';
COMMENT ON COLUMN shift_issues.issue_type IS '問題タイプ（CONFLICT/SHORTAGE/SKILL_MISMATCH等）';
COMMENT ON COLUMN shift_issues.affected_staff_ids IS '影響を受けるスタッフID（JSON配列）';

CREATE INDEX idx_shift_issues_shift ON shift_issues(shift_id);
CREATE INDEX idx_shift_issues_plan ON shift_issues(plan_id);
CREATE INDEX idx_shift_issues_date ON shift_issues(issue_date);
CREATE INDEX idx_shift_issues_resolved ON shift_issues(is_resolved);

-- 2.2 シフト解決策
CREATE TABLE shift_solutions (
    solution_id SERIAL PRIMARY KEY,
    issue_id INT NOT NULL,
    solution_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    proposed_changes JSONB,
    priority INT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    estimated_impact VARCHAR(20) DEFAULT 'MEDIUM' CHECK (estimated_impact IN ('HIGH', 'MEDIUM', 'LOW')),
    proposed_by INT,
    proposed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    implemented_at TIMESTAMP,
    implemented_by INT,
    is_implemented BOOLEAN NOT NULL DEFAULT FALSE,
    implementation_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES shift_issues(issue_id) ON DELETE CASCADE,
    FOREIGN KEY (proposed_by) REFERENCES staff(staff_id),
    FOREIGN KEY (implemented_by) REFERENCES staff(staff_id),
    CHECK (solution_type IN ('REASSIGN', 'ADD_STAFF', 'ADJUST_TIME', 'SPLIT_SHIFT',
                             'CHANGE_PATTERN', 'REQUEST_OVERTIME', 'OTHER'))
);

COMMENT ON TABLE shift_solutions IS 'シフト解決策';
COMMENT ON COLUMN shift_solutions.solution_type IS '解決タイプ（REASSIGN/ADD_STAFF/ADJUST_TIME等）';
COMMENT ON COLUMN shift_solutions.proposed_changes IS '提案される変更内容（JSON形式）';

CREATE INDEX idx_shift_solutions_issue ON shift_solutions(issue_id);
CREATE INDEX idx_shift_solutions_implemented ON shift_solutions(is_implemented);

-- ============================================
-- 3. 安全衛生管理テーブル（優先度: 中）
-- ============================================

-- 3.1 安全衛生チェックリストマスタ
CREATE TABLE safety_checklist_master (
    checklist_master_id SERIAL PRIMARY KEY,
    checklist_code VARCHAR(50) UNIQUE NOT NULL,
    checklist_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    item_description TEXT,
    check_frequency VARCHAR(20) NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (checklist_type IN ('SAFETY', 'HEALTH', 'HYGIENE', 'EQUIPMENT', 'ENVIRONMENT')),
    CHECK (check_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'))
);

COMMENT ON TABLE safety_checklist_master IS '安全衛生チェックリストマスタ';
COMMENT ON COLUMN safety_checklist_master.checklist_type IS 'チェックリストタイプ（SAFETY/HEALTH/HYGIENE等）';
COMMENT ON COLUMN safety_checklist_master.check_frequency IS '実施頻度（DAILY/WEEKLY/MONTHLY等）';

-- 3.2 安全衛生チェック実績
CREATE TABLE safety_checklist_records (
    record_id SERIAL PRIMARY KEY,
    checklist_master_id INT NOT NULL,
    store_id INT NOT NULL,
    check_date DATE NOT NULL,
    check_result BOOLEAN NOT NULL DEFAULT FALSE,
    checked_by INT NOT NULL,
    notes TEXT,
    photo_url VARCHAR(500),
    issue_found BOOLEAN NOT NULL DEFAULT FALSE,
    action_required BOOLEAN NOT NULL DEFAULT FALSE,
    action_taken TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (checklist_master_id) REFERENCES safety_checklist_master(checklist_master_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (checked_by) REFERENCES staff(staff_id)
);

COMMENT ON TABLE safety_checklist_records IS '安全衛生チェック実績';
COMMENT ON COLUMN safety_checklist_records.check_result IS 'チェック結果（TRUE=OK, FALSE=NG）';
COMMENT ON COLUMN safety_checklist_records.action_required IS '対応必要フラグ';

CREATE INDEX idx_safety_records_store_date ON safety_checklist_records(store_id, check_date);
CREATE INDEX idx_safety_records_checklist ON safety_checklist_records(checklist_master_id);

-- ============================================
-- 4. 気象データテーブル（優先度: 低）
-- ============================================

-- 4.1 気象履歴（demand_forecastsと統合せず、独立管理）
CREATE TABLE weather_history (
    weather_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    weather_date DATE NOT NULL,
    weather_condition VARCHAR(50),
    weather_code VARCHAR(20),
    temperature_high DECIMAL(5,2),
    temperature_low DECIMAL(5,2),
    temperature_avg DECIMAL(5,2),
    humidity DECIMAL(5,2),
    precipitation_mm DECIMAL(6,2),
    wind_speed_mps DECIMAL(5,2),
    pressure_hpa DECIMAL(6,2),
    sunshine_hours DECIMAL(5,2),
    is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
    special_event VARCHAR(200),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (store_id, weather_date),
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

COMMENT ON TABLE weather_history IS '気象履歴';
COMMENT ON COLUMN weather_history.weather_condition IS '天気（晴れ/曇り/雨/雪等）';
COMMENT ON COLUMN weather_history.temperature_avg IS '平均気温';
COMMENT ON COLUMN weather_history.precipitation_mm IS '降水量（mm）';

CREATE INDEX idx_weather_store_date ON weather_history(store_id, weather_date);

-- ============================================
-- 5. 集計・分析用テーブル（優先度: 低）
-- ============================================

-- 5.1 ダッシュボードメトリクス（事前集計テーブル）
CREATE TABLE dashboard_metrics (
    metric_id SERIAL PRIMARY KEY,
    store_id INT NOT NULL,
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2),
    metric_unit VARCHAR(20),
    comparison_period VARCHAR(20),
    comparison_value DECIMAL(15,2),
    change_rate DECIMAL(8,4),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (store_id, metric_date, metric_type, metric_name),
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    CHECK (metric_type IN ('SALES', 'LABOR_COST', 'PROFIT', 'CUSTOMER', 'EFFICIENCY', 'STAFF')),
    CHECK (comparison_period IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'))
);

COMMENT ON TABLE dashboard_metrics IS 'ダッシュボードメトリクス（事前集計）';
COMMENT ON COLUMN dashboard_metrics.metric_type IS 'メトリクスタイプ（SALES/LABOR_COST/PROFIT等）';
COMMENT ON COLUMN dashboard_metrics.change_rate IS '変化率（前期比）';

CREATE INDEX idx_dashboard_metrics_store_date ON dashboard_metrics(store_id, metric_date);
CREATE INDEX idx_dashboard_metrics_type ON dashboard_metrics(metric_type);

-- 5.2 スタッフ月次パフォーマンス（事前集計テーブル）
CREATE TABLE staff_monthly_performance (
    performance_id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL,
    performance_year INT NOT NULL,
    performance_month INT NOT NULL CHECK (performance_month BETWEEN 1 AND 12),
    shift_count INT NOT NULL DEFAULT 0,
    total_work_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_labor_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    avg_work_hours DECIMAL(5,2) DEFAULT 0,
    late_count INT NOT NULL DEFAULT 0,
    absent_count INT NOT NULL DEFAULT 0,
    overtime_hours DECIMAL(10,2) DEFAULT 0,
    attendance_rate DECIMAL(5,2),
    performance_score DECIMAL(5,2),
    skills_used JSONB DEFAULT '[]',
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (staff_id, performance_year, performance_month),
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE
);

COMMENT ON TABLE staff_monthly_performance IS 'スタッフ月次パフォーマンス（事前集計）';
COMMENT ON COLUMN staff_monthly_performance.attendance_rate IS '出勤率（%）';
COMMENT ON COLUMN staff_monthly_performance.performance_score IS 'パフォーマンススコア（0-100）';

CREATE INDEX idx_staff_performance_staff ON staff_monthly_performance(staff_id, performance_year, performance_month);

-- 5.3 シフト月次サマリー（事前集計テーブル）
CREATE TABLE shift_monthly_summary (
    summary_id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL,
    store_id INT NOT NULL,
    summary_year INT NOT NULL,
    summary_month INT NOT NULL CHECK (summary_month BETWEEN 1 AND 12),
    total_shifts INT NOT NULL DEFAULT 0,
    total_staff_count INT NOT NULL DEFAULT 0,
    total_work_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_labor_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    avg_hours_per_shift DECIMAL(5,2) DEFAULT 0,
    avg_staff_per_day DECIMAL(5,2) DEFAULT 0,
    max_staff_per_day INT DEFAULT 0,
    min_staff_per_day INT DEFAULT 0,
    labor_law_violations INT DEFAULT 0,
    preference_match_rate DECIMAL(5,2),
    issues_count INT DEFAULT 0,
    resolved_issues_count INT DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (plan_id),
    FOREIGN KEY (plan_id) REFERENCES shift_plans(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
);

COMMENT ON TABLE shift_monthly_summary IS 'シフト月次サマリー（事前集計）';
COMMENT ON COLUMN shift_monthly_summary.preference_match_rate IS 'シフト希望適合率（%）';
COMMENT ON COLUMN shift_monthly_summary.labor_law_violations IS '労働基準法違反件数';

CREATE INDEX idx_shift_summary_plan ON shift_monthly_summary(plan_id);
CREATE INDEX idx_shift_summary_store_month ON shift_monthly_summary(store_id, summary_year, summary_month);

-- ============================================
-- 6. インデックス追加
-- ============================================

-- 通勤手当
CREATE INDEX idx_commute_allowance_distance ON commute_allowance(distance_from_km, distance_to_km);

-- 保険料率
CREATE INDEX idx_insurance_rates_type ON insurance_rates(insurance_type, effective_from);

-- 税率
CREATE INDEX idx_tax_brackets_type ON tax_brackets(tax_type, income_from);

-- ============================================
-- 7. トリガー（updated_at自動更新）
-- ============================================

CREATE TRIGGER update_commute_allowance_updated_at BEFORE UPDATE ON commute_allowance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_rates_updated_at BEFORE UPDATE ON insurance_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_brackets_updated_at BEFORE UPDATE ON tax_brackets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_issues_updated_at BEFORE UPDATE ON shift_issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_solutions_updated_at BEFORE UPDATE ON shift_solutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_safety_checklist_master_updated_at BEFORE UPDATE ON safety_checklist_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_safety_checklist_records_updated_at BEFORE UPDATE ON safety_checklist_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weather_history_updated_at BEFORE UPDATE ON weather_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_metrics_updated_at BEFORE UPDATE ON dashboard_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_monthly_performance_updated_at BEFORE UPDATE ON staff_monthly_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_monthly_summary_updated_at BEFORE UPDATE ON shift_monthly_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完了メッセージ
-- ============================================
SELECT '✅ 未対応CSVファイル用テーブル（11テーブル）の追加が完了しました' AS status;
SELECT '📊 合計テーブル数: 20（既存）+ 11（追加）= 31テーブル' AS info;
