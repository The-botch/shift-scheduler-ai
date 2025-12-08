-- ============================================================================
-- マイグレーション: 渋谷店をStand Pho YoとTipsy Tigerに分割
-- 実行日: 2024-12-03
-- Tenant ID = 3 (Stand Banh Mi)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SHIBUYA店舗をStand Pho Yoに名称変更
-- ----------------------------------------------------------------------------
UPDATE core.stores
SET
  store_code = 'SPY',
  store_name = 'Stand Pho Yo',
  updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = 3
  AND store_code = 'SHIBUYA';

-- ----------------------------------------------------------------------------
-- 2. 新店舗 Tipsy Tiger を追加
-- ----------------------------------------------------------------------------
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
WHERE NOT EXISTS (
  SELECT 1 FROM core.stores WHERE tenant_id = 3 AND store_code = 'TT'
);

-- ----------------------------------------------------------------------------
-- 3. スタッフの所属店舗変更
--    - ケサブ: Stand Pho Yo → Tipsy Tiger
--    - 加藤智津子: Stand Pho Yo → Tipsy Tiger
-- ----------------------------------------------------------------------------
-- ケサブ (staff_code: 5) → Tipsy Tiger
UPDATE hr.staff
SET
  store_id = (SELECT store_id FROM core.stores WHERE tenant_id = 3 AND store_code = 'TT' LIMIT 1),
  updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = 3
  AND name = 'ケサブ';

-- 加藤智津子 → Tipsy Tiger
UPDATE hr.staff
SET
  store_id = (SELECT store_id FROM core.stores WHERE tenant_id = 3 AND store_code = 'TT' LIMIT 1),
  updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = 3
  AND name = '加藤智津子';

-- ----------------------------------------------------------------------------
-- 確認用クエリ（実行後に確認）
-- ----------------------------------------------------------------------------
-- SELECT store_id, store_code, store_name FROM core.stores WHERE tenant_id = 3;
-- SELECT staff_id, name, store_id FROM hr.staff WHERE tenant_id = 3 AND store_id = (SELECT store_id FROM core.stores WHERE tenant_id = 3 AND store_code = 'TT');
