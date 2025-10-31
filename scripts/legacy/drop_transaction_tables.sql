-- ============================================
-- トランザクションテーブル削除スクリプト
-- マスターテーブルのみを残す
-- ============================================

-- analyticsスキーマ - 全削除
DROP TABLE IF EXISTS analytics.dashboard_metrics CASCADE;
DROP TABLE IF EXISTS analytics.demand_forecasts CASCADE;
DROP TABLE IF EXISTS analytics.sales_actual CASCADE;
DROP TABLE IF EXISTS analytics.weather_history CASCADE;

-- analyticsスキーマ自体も削除
DROP SCHEMA IF EXISTS analytics CASCADE;

-- auditスキーマ - トランザクションのみ削除
DROP TABLE IF EXISTS audit.safety_checklist_records CASCADE;
DROP TABLE IF EXISTS audit.shift_history CASCADE;
-- safety_checklist_masterは残す

-- hrスキーマ - トランザクションのみ削除
DROP TABLE IF EXISTS hr.payroll CASCADE;
DROP TABLE IF EXISTS hr.staff_monthly_performance CASCADE;

-- opsスキーマ - トランザクションのみ削除
DROP TABLE IF EXISTS ops.availability_requests CASCADE;
DROP TABLE IF EXISTS ops.shift_issues CASCADE;
DROP TABLE IF EXISTS ops.shift_monthly_summary CASCADE;
DROP TABLE IF EXISTS ops.shift_plans CASCADE;
DROP TABLE IF EXISTS ops.shift_preferences CASCADE;
DROP TABLE IF EXISTS ops.shift_solutions CASCADE;
DROP TABLE IF EXISTS ops.shifts CASCADE;
DROP TABLE IF EXISTS ops.work_hours_actual CASCADE;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ トランザクションテーブル削除完了';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '削除されたテーブル:';
    RAISE NOTICE '  - analytics: 4テーブル (スキーマごと削除)';
    RAISE NOTICE '  - audit: 2テーブル';
    RAISE NOTICE '  - hr: 2テーブル';
    RAISE NOTICE '  - ops: 8テーブル';
    RAISE NOTICE '';
    RAISE NOTICE '合計: 16テーブル削除';
    RAISE NOTICE '';
    RAISE NOTICE '残ったマスターテーブルを確認:';
    RAISE NOTICE '  SELECT schemaname, tablename FROM pg_tables';
    RAISE NOTICE '  WHERE schemaname IN (''core'', ''hr'', ''ops'', ''audit'')';
    RAISE NOTICE '  ORDER BY schemaname, tablename;';
    RAISE NOTICE '';
END $$;
