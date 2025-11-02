-- 労働時間インポートの速度最適化
-- ON CONFLICTで使用するUNIQUE制約と複合インデックスを追加

-- 1. UNIQUE制約を追加（ON CONFLICTに必要）
ALTER TABLE ops.work_hours_actual
ADD CONSTRAINT uq_work_hours_actual_key
UNIQUE (tenant_id, store_id, staff_id, work_date);

-- 2. 複合インデックスを追加（クエリ高速化）
CREATE INDEX IF NOT EXISTS idx_work_hours_actual_composite
ON ops.work_hours_actual(tenant_id, store_id, staff_id, work_date);

-- 3. 既存の不要な個別インデックスを削除（インデックスメンテナンスコスト削減）
-- 複合インデックスがあれば個別インデックスは不要
DROP INDEX IF EXISTS ops.idx_work_hours_actual_tenant;
DROP INDEX IF EXISTS ops.idx_work_hours_actual_store;
DROP INDEX IF EXISTS ops.idx_work_hours_actual_staff;
DROP INDEX IF EXISTS ops.idx_work_hours_actual_date;

-- 4. 年月別のクエリ用インデックス（月別PL計算用）
CREATE INDEX IF NOT EXISTS idx_work_hours_actual_year_month
ON ops.work_hours_actual(tenant_id, year, month);

-- 確認
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'work_hours_actual'
ORDER BY indexname;

-- 制約確認
SELECT
    conname,
    contype,
    pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'ops.work_hours_actual'::regclass;
