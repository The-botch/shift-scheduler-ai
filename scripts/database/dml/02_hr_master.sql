-- ============================================================================
-- hrスキーマのマスターデータ
-- Tenant ID = 3 (Stand Banh Mi)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- スキーマ更新：通勤距離・社会保険カラムを追加
-- ----------------------------------------------------------------------------
ALTER TABLE hr.staff ADD COLUMN IF NOT EXISTS commute_distance_km NUMERIC(5,2);
ALTER TABLE hr.staff ADD COLUMN IF NOT EXISTS has_social_insurance BOOLEAN DEFAULT false;

-- ----------------------------------------------------------------------------
-- 1. 税率区分マスター登録
-- ----------------------------------------------------------------------------
-- 0円～1,949,000円
INSERT INTO hr.tax_brackets (
  tenant_id, tax_type, bracket_name, income_from, income_to,
  tax_rate, deduction_amount, effective_from, is_active
)
VALUES (3, 'INCOME', '0円～1,949,000円', 0, 1949000, 0.05, 0, '2024-01-01', true)
ON CONFLICT DO NOTHING;

-- 1,950,000円～3,299,000円
INSERT INTO hr.tax_brackets (
  tenant_id, tax_type, bracket_name, income_from, income_to,
  tax_rate, deduction_amount, effective_from, is_active
)
VALUES (3, 'INCOME', '1,950,000円～3,299,000円', 1950000, 3299000, 0.10, 97500, '2024-01-01', true)
ON CONFLICT DO NOTHING;

-- 3,300,000円～6,949,000円
INSERT INTO hr.tax_brackets (
  tenant_id, tax_type, bracket_name, income_from, income_to,
  tax_rate, deduction_amount, effective_from, is_active
)
VALUES (3, 'INCOME', '3,300,000円～6,949,000円', 3300000, 6949000, 0.20, 427500, '2024-01-01', true)
ON CONFLICT DO NOTHING;

-- 6,950,000円～8,999,000円
INSERT INTO hr.tax_brackets (
  tenant_id, tax_type, bracket_name, income_from, income_to,
  tax_rate, deduction_amount, effective_from, is_active
)
VALUES (3, 'INCOME', '6,950,000円～8,999,000円', 6950000, 8999000, 0.23, 636000, '2024-01-01', true)
ON CONFLICT DO NOTHING;

-- 9,000,000円～17,999,000円
INSERT INTO hr.tax_brackets (
  tenant_id, tax_type, bracket_name, income_from, income_to,
  tax_rate, deduction_amount, effective_from, is_active
)
VALUES (3, 'INCOME', '9,000,000円～17,999,000円', 9000000, 17999000, 0.33, 1536000, '2024-01-01', true)
ON CONFLICT DO NOTHING;

-- 18,000,000円～39,999,000円
INSERT INTO hr.tax_brackets (
  tenant_id, tax_type, bracket_name, income_from, income_to,
  tax_rate, deduction_amount, effective_from, is_active
)
VALUES (3, 'INCOME', '18,000,000円～39,999,000円', 18000000, 39999000, 0.40, 2796000, '2024-01-01', true)
ON CONFLICT DO NOTHING;

-- 40,000,000円以上
INSERT INTO hr.tax_brackets (
  tenant_id, tax_type, bracket_name, income_from, income_to,
  tax_rate, deduction_amount, effective_from, is_active
)
VALUES (3, 'INCOME', '40,000,000円以上', 40000000, NULL, 0.45, 4796000, '2024-01-01', true)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. 社会保険料率マスター登録
-- ----------------------------------------------------------------------------
-- 健康保険
INSERT INTO hr.insurance_rates (
  tenant_id, insurance_type, rate_name,
  employee_rate, employer_rate,
  employee_percentage, employer_percentage,
  applicable_employment_types,
  effective_from, is_active
)
VALUES (
  3, 'HEALTH', '健康保険',
  0.0495, 0.0495,
  4.95, 4.95,
  'MONTHLY,HOURLY',
  '2025-01-01', true
);

-- 厚生年金
INSERT INTO hr.insurance_rates (
  tenant_id, insurance_type, rate_name,
  employee_rate, employer_rate,
  employee_percentage, employer_percentage,
  applicable_employment_types,
  effective_from, is_active
)
VALUES (
  3, 'PENSION', '厚生年金',
  0.0915, 0.0915,
  9.15, 9.15,
  'MONTHLY,HOURLY',
  '2025-01-01', true
);

-- 雇用保険
INSERT INTO hr.insurance_rates (
  tenant_id, insurance_type, rate_name,
  employee_rate, employer_rate,
  employee_percentage, employer_percentage,
  applicable_employment_types,
  effective_from, is_active
)
VALUES (
  3, 'EMPLOYMENT', '雇用保険',
  0.0060, 0.0095,
  0.60, 0.95,
  'MONTHLY,HOURLY',
  '2025-01-01', true
);

-- 労災保険
INSERT INTO hr.insurance_rates (
  tenant_id, insurance_type, rate_name,
  employee_rate, employer_rate,
  employee_percentage, employer_percentage,
  applicable_employment_types,
  effective_from, is_active
)
VALUES (
  3, 'WORKERS_COMP', '労災保険',
  0.0000, 0.0030,
  0.00, 0.30,
  'MONTHLY,HOURLY',
  '2025-01-01', true
);

-- ----------------------------------------------------------------------------
-- 3. 通勤手当マスター登録
-- ----------------------------------------------------------------------------
-- 2km未満
INSERT INTO hr.commute_allowance (
  tenant_id, distance_from_km, distance_to_km,
  allowance_amount, description, is_active
)
VALUES (3, 0, 2, 0, '2km未満', true);

-- 2km以上5km未満
INSERT INTO hr.commute_allowance (
  tenant_id, distance_from_km, distance_to_km,
  allowance_amount, description, is_active
)
VALUES (3, 2, 5, 3000, '2km以上5km未満', true);

-- 5km以上10km未満
INSERT INTO hr.commute_allowance (
  tenant_id, distance_from_km, distance_to_km,
  allowance_amount, description, is_active
)
VALUES (3, 5, 10, 6000, '5km以上10km未満', true);

-- 10km以上15km未満
INSERT INTO hr.commute_allowance (
  tenant_id, distance_from_km, distance_to_km,
  allowance_amount, description, is_active
)
VALUES (3, 10, 15, 9000, '10km以上15km未満', true);

-- 15km以上
INSERT INTO hr.commute_allowance (
  tenant_id, distance_from_km, distance_to_km,
  allowance_amount, description, is_active
)
VALUES (3, 15, 999, 12000, '15km以上', true);
