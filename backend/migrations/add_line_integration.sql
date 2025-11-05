-- =====================================================
-- Migration: LINE連携機能用カラム追加
-- Description: スタッフテーブルにLINE User IDとLINE連携情報を追加
-- Date: 2025-11-05
-- =====================================================

BEGIN;

-- 1. staffテーブルにLINE User IDカラムを追加
ALTER TABLE hr.staff
ADD COLUMN IF NOT EXISTS line_user_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS line_display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS line_picture_url TEXT,
ADD COLUMN IF NOT EXISTS line_linked_at TIMESTAMP;

-- 2. line_user_idにインデックスを追加（検索高速化）
CREATE INDEX IF NOT EXISTS idx_staff_line_user_id ON hr.staff(line_user_id);

-- 3. コメント追加（ドキュメント化）
COMMENT ON COLUMN hr.staff.line_user_id IS 'LINE User ID（LINE連携時に自動取得）';
COMMENT ON COLUMN hr.staff.line_display_name IS 'LINEの表示名（参考情報）';
COMMENT ON COLUMN hr.staff.line_picture_url IS 'LINEのプロフィール画像URL（参考情報）';
COMMENT ON COLUMN hr.staff.line_linked_at IS 'LINE連携日時';

-- 4. 変更履歴を記録（オプション: 監査ログテーブルがある場合）
INSERT INTO schema_migrations (version, description, executed_at)
VALUES ('20251105_001', 'Add LINE integration columns to staff table', CURRENT_TIMESTAMP)
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- =====================================================
-- Rollback用SQL（必要な場合）
-- =====================================================
-- BEGIN;
--
-- DROP INDEX IF EXISTS idx_staff_line_user_id;
--
-- ALTER TABLE hr.staff
-- DROP COLUMN IF EXISTS line_user_id,
-- DROP COLUMN IF EXISTS line_display_name,
-- DROP COLUMN IF EXISTS line_picture_url,
-- DROP COLUMN IF EXISTS line_linked_at;
--
-- DELETE FROM schema_migrations WHERE version = '20251105_001';
--
-- COMMIT;

-- =====================================================
-- 動作確認用SQL
-- =====================================================
-- テーブル構造確認
-- \d hr.staff;

-- カラム追加確認
-- SELECT column_name, data_type, character_maximum_length, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'staff'
-- AND column_name LIKE 'line_%';
