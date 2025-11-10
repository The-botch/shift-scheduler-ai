-- マイグレーション: 重複スタッフの統合
-- 作成日: 2025-11-10
-- 目的: 名前のスペース有無で重複しているスタッフを統合

BEGIN;

-- 統合前の状態を確認
SELECT 
  'マイグレーション開始' as status,
  COUNT(DISTINCT staff_id) as unique_staff_before
FROM hr.staff
WHERE tenant_id = 3 AND is_active = TRUE;

-- 1. 佐々美音: 308 → 273
UPDATE ops.shifts SET staff_id = 273 WHERE staff_id = 308;
UPDATE hr.staff SET is_active = FALSE, updated_at = NOW() WHERE staff_id = 308;

-- 2. 吉田莉乃: 298 → 281
UPDATE ops.shifts SET staff_id = 281 WHERE staff_id = 298;
UPDATE hr.staff SET is_active = FALSE, updated_at = NOW() WHERE staff_id = 298;

-- 3. 橋本勇人: 314 → 311
UPDATE ops.shifts SET staff_id = 311 WHERE staff_id = 314;
UPDATE hr.staff SET is_active = FALSE, updated_at = NOW() WHERE staff_id = 314;

-- 4. 武根太一: 304 → 288
UPDATE ops.shifts SET staff_id = 288 WHERE staff_id = 304;
UPDATE hr.staff SET is_active = FALSE, updated_at = NOW() WHERE staff_id = 304;

-- 5. 甲木由紀: 307 → 305
UPDATE ops.shifts SET staff_id = 305 WHERE staff_id = 307;
UPDATE hr.staff SET is_active = FALSE, updated_at = NOW() WHERE staff_id = 307;

-- 6. 相模純平: 313 → 287
UPDATE ops.shifts SET staff_id = 287 WHERE staff_id = 313;
UPDATE hr.staff SET is_active = FALSE, updated_at = NOW() WHERE staff_id = 313;

-- 7. 高田久瑠美: 297 → 280
UPDATE ops.shifts SET staff_id = 280 WHERE staff_id = 297;
UPDATE hr.staff SET is_active = FALSE, updated_at = NOW() WHERE staff_id = 297;

-- 統合後の状態を確認
SELECT 
  '統合完了' as status,
  COUNT(DISTINCT staff_id) as unique_staff_after
FROM hr.staff
WHERE tenant_id = 3 AND is_active = TRUE;

-- 統合されたスタッフのシフト数を確認
SELECT 
  staff_id,
  s.name,
  COUNT(sh.shift_id) as shift_count
FROM hr.staff s
LEFT JOIN ops.shifts sh ON s.staff_id = sh.staff_id
WHERE s.staff_id IN (273, 281, 311, 288, 305, 287, 280)
GROUP BY staff_id, s.name
ORDER BY staff_id;

COMMIT;
