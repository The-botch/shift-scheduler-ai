-- ops.shift_plansテーブルにplan_typeカラムを追加

-- 1. カラム追加
ALTER TABLE ops.shift_plans
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20);

-- 2. 既存データの更新
-- statusが'first_plan_approved'または'approved'の場合 → 'FIRST'
-- statusが'second_plan_approved'の場合 → 'SECOND'
-- statusが'draft'の場合 → plan_codeやplan_nameから判断（デフォルトは'FIRST'）

UPDATE ops.shift_plans
SET plan_type = 'FIRST'
WHERE plan_type IS NULL
  AND (status IN ('approved', 'first_plan_approved', 'draft'));

UPDATE ops.shift_plans
SET plan_type = 'SECOND'
WHERE plan_type IS NULL
  AND status = 'second_plan_approved';

-- 3. まだNULLのものはデフォルトで'FIRST'
UPDATE ops.shift_plans
SET plan_type = 'FIRST'
WHERE plan_type IS NULL;

-- 4. 確認用クエリ（実行結果を見るため）
SELECT
  plan_type,
  status,
  COUNT(*) as count
FROM ops.shift_plans
GROUP BY plan_type, status
ORDER BY plan_type, status;
