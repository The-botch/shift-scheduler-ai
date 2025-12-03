-- ============================================================================
-- coreスキーマのマスターデータ
-- Tenant ID = 3 (Stand Banh Mi)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. テナント登録
-- ----------------------------------------------------------------------------
INSERT INTO core.tenants (
  tenant_id, tenant_code, tenant_name, contract_start_date,
  contract_plan, max_stores, max_staff, is_active
)
VALUES (3, 'STAND_BANH_MI', 'Stand Banh Mi', CURRENT_DATE, 'STANDARD', 10, 100, true)
ON CONFLICT (tenant_id) DO UPDATE
SET tenant_name = EXCLUDED.tenant_name,
    updated_at = CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- 2. Division登録
-- ----------------------------------------------------------------------------
INSERT INTO core.divisions (
  tenant_id, division_code, division_name, is_active
)
VALUES (3, 'DEFAULT', 'デフォルト部門', true)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. 雇用形態登録
-- ----------------------------------------------------------------------------
-- 正社員
INSERT INTO core.employment_types (tenant_id, employment_code, employment_name, payment_type, is_active)
VALUES (3, 'FULL_TIME', '正社員', 'MONTHLY', true)
ON CONFLICT DO NOTHING;

-- アルバイト
INSERT INTO core.employment_types (tenant_id, employment_code, employment_name, payment_type, is_active)
VALUES (3, 'PART_TIME', 'アルバイト', 'HOURLY', true)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. 役職登録
-- ----------------------------------------------------------------------------
-- アルバイト
INSERT INTO core.roles (tenant_id, role_code, role_name, display_order, is_active)
VALUES (3, 'STAFF', 'アルバイト', 1, true)
ON CONFLICT DO NOTHING;

-- 社員
INSERT INTO core.roles (tenant_id, role_code, role_name, display_order, is_active)
VALUES (3, 'SENIOR', '社員', 2, true)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. 店舗登録
-- ----------------------------------------------------------------------------
-- COME 麻布台
INSERT INTO core.stores (
  tenant_id, division_id, store_code, store_name,
  business_hours_start, business_hours_end, is_active
)
SELECT
  3,
  (SELECT division_id FROM core.divisions WHERE tenant_id = 3 AND division_code = 'DEFAULT' LIMIT 1),
  'COME',
  'COME 麻布台',
  '09:00',
  '22:00',
  true
ON CONFLICT DO NOTHING;

-- Atelier
INSERT INTO core.stores (
  tenant_id, division_id, store_code, store_name,
  business_hours_start, business_hours_end, is_active
)
SELECT
  3,
  (SELECT division_id FROM core.divisions WHERE tenant_id = 3 AND division_code = 'DEFAULT' LIMIT 1),
  'ATELIER',
  'Atelier',
  '09:00',
  '22:00',
  true
ON CONFLICT DO NOTHING;

-- Stand Pho Yo（旧SHIBUYA）
INSERT INTO core.stores (
  tenant_id, division_id, store_code, store_name,
  business_hours_start, business_hours_end, is_active
)
SELECT
  3,
  (SELECT division_id FROM core.divisions WHERE tenant_id = 3 AND division_code = 'DEFAULT' LIMIT 1),
  'SPY',
  'Stand Pho Yo',
  '10:00',
  '23:00',
  true
ON CONFLICT DO NOTHING;

-- Tipsy Tiger
INSERT INTO core.stores (
  tenant_id, division_id, store_code, store_name,
  business_hours_start, business_hours_end, is_active
)
SELECT
  3,
  (SELECT division_id FROM core.divisions WHERE tenant_id = 3 AND division_code = 'DEFAULT' LIMIT 1),
  'TT',
  'Tipsy Tiger',
  '10:00',
  '23:00',
  true
ON CONFLICT DO NOTHING;

-- Stand Banh Mi
INSERT INTO core.stores (
  tenant_id, division_id, store_code, store_name,
  business_hours_start, business_hours_end, is_active
)
SELECT
  3,
  (SELECT division_id FROM core.divisions WHERE tenant_id = 3 AND division_code = 'DEFAULT' LIMIT 1),
  'STAND_BANH_MI',
  'Stand Banh Mi',
  '10:00',
  '21:00',
  true
ON CONFLICT DO NOTHING;

-- Stand Bo Bun
INSERT INTO core.stores (
  tenant_id, division_id, store_code, store_name,
  business_hours_start, business_hours_end, is_active
)
SELECT
  3,
  (SELECT division_id FROM core.divisions WHERE tenant_id = 3 AND division_code = 'DEFAULT' LIMIT 1),
  'STAND_BO_BUN',
  'Stand Bo Bun',
  '10:00',
  '21:00',
  true
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. シフトパターン登録
-- ----------------------------------------------------------------------------
-- 早番
INSERT INTO core.shift_patterns (
  tenant_id, pattern_code, pattern_name,
  start_time, end_time, break_minutes, is_active
)
VALUES (3, 'EARLY', '早番', '09:00', '17:00', 60, true)
ON CONFLICT DO NOTHING;

-- 中番
INSERT INTO core.shift_patterns (
  tenant_id, pattern_code, pattern_name,
  start_time, end_time, break_minutes, is_active
)
VALUES (3, 'MID', '中番', '12:00', '20:00', 60, true)
ON CONFLICT DO NOTHING;

-- 遅番
INSERT INTO core.shift_patterns (
  tenant_id, pattern_code, pattern_name,
  start_time, end_time, break_minutes, is_active
)
VALUES (3, 'LATE', '遅番', '15:00', '23:00', 60, true)
ON CONFLICT DO NOTHING;

-- 通し
INSERT INTO core.shift_patterns (
  tenant_id, pattern_code, pattern_name,
  start_time, end_time, break_minutes, is_active
)
VALUES (3, 'FULL', '通し', '09:00', '22:00', 90, true)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. スキルマスター登録
-- ----------------------------------------------------------------------------
-- 調理基礎
INSERT INTO core.skills (
  tenant_id, skill_code, skill_name, category, display_order, is_active
)
VALUES (3, 'COOKING_BASIC', '調理基礎', '調理', 1, true)
ON CONFLICT DO NOTHING;

-- 調理上級
INSERT INTO core.skills (
  tenant_id, skill_code, skill_name, category, display_order, is_active
)
VALUES (3, 'COOKING_ADVANCED', '調理上級', '調理', 2, true)
ON CONFLICT DO NOTHING;

-- 接客
INSERT INTO core.skills (
  tenant_id, skill_code, skill_name, category, display_order, is_active
)
VALUES (3, 'CUSTOMER_SERVICE', '接客', 'サービス', 3, true)
ON CONFLICT DO NOTHING;

-- レジ
INSERT INTO core.skills (
  tenant_id, skill_code, skill_name, category, display_order, is_active
)
VALUES (3, 'CASHIER', 'レジ', 'サービス', 4, true)
ON CONFLICT DO NOTHING;

-- マネジメント
INSERT INTO core.skills (
  tenant_id, skill_code, skill_name, category, display_order, is_active
)
VALUES (3, 'MANAGEMENT', 'マネジメント', '管理', 5, true)
ON CONFLICT DO NOTHING;
