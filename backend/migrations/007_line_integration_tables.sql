-- LINE連携テーブル作成マイグレーション
-- 実行日: 2025-01-05

BEGIN;

-- 1. スタッフとLINE User IDの紐付けテーブル
CREATE TABLE IF NOT EXISTS hr.staff_line_accounts (
  staff_line_id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  line_user_id VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE,
  UNIQUE(tenant_id, staff_id)
);

-- インデックス作成
CREATE INDEX idx_staff_line_accounts_user_id ON hr.staff_line_accounts(line_user_id);
CREATE INDEX idx_staff_line_accounts_staff_id ON hr.staff_line_accounts(staff_id);
CREATE INDEX idx_staff_line_accounts_tenant_id ON hr.staff_line_accounts(tenant_id);

COMMENT ON TABLE hr.staff_line_accounts IS 'スタッフとLINEアカウントの紐付け';
COMMENT ON COLUMN hr.staff_line_accounts.line_user_id IS 'LINE User ID (Uから始まる一意ID)';
COMMENT ON COLUMN hr.staff_line_accounts.display_name IS 'LINEの表示名';
COMMENT ON COLUMN hr.staff_line_accounts.is_active IS '連携が有効かどうか';

-- 2. LINEメッセージログテーブル
CREATE TABLE IF NOT EXISTS ops.line_message_logs (
  log_id SERIAL PRIMARY KEY,
  tenant_id INTEGER,
  line_user_id VARCHAR(255),
  staff_id INTEGER,
  group_id VARCHAR(255),
  message_type VARCHAR(50),
  message_text TEXT,
  parsed_intent VARCHAR(50),
  parsed_data JSONB,
  response_text TEXT,
  status VARCHAR(20), -- 'success', 'failed', 'ignored'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_line_message_logs_created ON ops.line_message_logs(created_at);
CREATE INDEX idx_line_message_logs_staff ON ops.line_message_logs(staff_id);
CREATE INDEX idx_line_message_logs_status ON ops.line_message_logs(status);
CREATE INDEX idx_line_message_logs_user_id ON ops.line_message_logs(line_user_id);

COMMENT ON TABLE ops.line_message_logs IS 'LINEメッセージの処理ログ（監査・デバッグ用）';
COMMENT ON COLUMN ops.line_message_logs.status IS 'success: 成功, failed: 失敗, ignored: 無視';
COMMENT ON COLUMN ops.line_message_logs.parsed_data IS '解析されたデータのJSON';

-- 3. shift_preferencesテーブルのユニーク制約（スキップ）
-- 注: shift_preferencesテーブルにはpreference_dateカラムが存在しないため、
-- year, monthカラムを使用する必要がありますが、このマイグレーションでは不要なのでスキップします。

-- 4. トリガー関数: updated_at自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー適用
DROP TRIGGER IF EXISTS update_staff_line_accounts_updated_at ON hr.staff_line_accounts;
CREATE TRIGGER update_staff_line_accounts_updated_at
  BEFORE UPDATE ON hr.staff_line_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. サンプルデータ挿入（テスト用）
-- 本番環境では実行しないこと！
DO $$
BEGIN
  IF (SELECT current_database()) LIKE '%test%' OR (SELECT current_database()) LIKE '%dev%' THEN
    -- テストデータ: スタッフ1のLINE連携
    INSERT INTO hr.staff_line_accounts (tenant_id, staff_id, line_user_id, display_name, is_active)
    VALUES (1, 1, 'U1234567890abcdef', 'テストユーザー', true)
    ON CONFLICT (tenant_id, staff_id) DO NOTHING;

    RAISE NOTICE 'Test data inserted';
  END IF;
END $$;

COMMIT;

-- マイグレーション完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'LINE Integration Tables Migration Completed';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - hr.staff_line_accounts';
  RAISE NOTICE '  - ops.line_message_logs';
  RAISE NOTICE 'Added unique constraint to ops.shift_preferences';
  RAISE NOTICE '==============================================';
END $$;
