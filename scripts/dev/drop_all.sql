-- ============================================
-- データベース完全クリア
-- すべてのスキーマとテーブルを削除
-- ============================================

-- 既存スキーマをCASCADEで削除（すべてのテーブルも削除される）
DROP SCHEMA IF EXISTS ops CASCADE;
DROP SCHEMA IF EXISTS hr CASCADE;
DROP SCHEMA IF EXISTS core CASCADE;

-- 念のため他のスキーマも削除
DROP SCHEMA IF EXISTS analytics CASCADE;
DROP SCHEMA IF EXISTS audit CASCADE;
