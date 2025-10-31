-- ============================================
-- 夜勤シフト対応：時刻制約の削除
-- ============================================
--
-- 背景:
--   CSVデータに26:00のような翌日にまたがる時刻が含まれている
--   PostgreSQLのTIME型は00:00-23:59の範囲のみ対応
--   26:00は02:00に変換されるが、CHECK (end_time > start_time) 制約に違反する
--
-- 対応:
--   夜勤シフトを扱えるように、時刻の大小関係をチェックする制約を削除
--
-- ============================================

-- core.shift_patterns テーブルの制約削除
ALTER TABLE core.shift_patterns
DROP CONSTRAINT IF EXISTS shift_patterns_check;

-- ops.shifts テーブルの制約削除（存在する場合）
ALTER TABLE ops.shifts
DROP CONSTRAINT IF EXISTS shifts_check;

-- 確認用：残っている制約を表示
DO $$
BEGIN
    RAISE NOTICE '制約削除完了';
    RAISE NOTICE '';
    RAISE NOTICE 'core.shift_patterns の残り制約:';
END $$;

SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'core.shift_patterns'::regclass
ORDER BY conname;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'ops.shifts の残り制約:';
END $$;

SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'ops.shifts'::regclass
ORDER BY conname;
