-- ============================================
-- AIシフトスケジューラー Row Level Security (RLS) セットアップ
-- 対象: Railway PostgreSQL 15+
-- 作成日: 2025-10-31
--
-- 目的:
--   マルチテナント環境でテナント間のデータ分離を自動化
--   セッション変数 app.current_tenant_id に基づいてデータアクセスを制限
-- ============================================

-- ============================================
-- RLS概要
-- ============================================
-- Row Level Security (RLS) は、PostgreSQLの機能で、
-- 各行に対してアクセス制御ポリシーを設定できます。
--
-- 使い方:
--   1. アプリケーションログイン時にセッション変数を設定:
--      SET app.current_tenant_id = 1;
--
--   2. 以降、全てのSELECT/INSERT/UPDATE/DELETEは
--      自動的に該当テナントのデータのみに制限される
--
--   3. スーパーユーザーはRLSをバイパス可能 (管理用)

-- ============================================
-- ステップ1: セッション変数設定用関数
-- ============================================

-- 現在のテナントIDを取得する関数
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS INT AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::INT;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_current_tenant_id() IS 'セッション変数app.current_tenant_idからテナントIDを取得';

-- テナントIDを設定する関数（アプリケーションから使用）
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id INT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_current_tenant(INT) IS 'セッション変数にテナントIDを設定（アプリケーションから呼び出し）';

-- ============================================
-- ステップ2: Core Schema - RLS有効化
-- ============================================

-- 2.1 core.tenants - RLS不要（全テナント閲覧可）
-- テナントマスタは全ユーザーが閲覧できる必要がある場合が多いためRLSは設定しない

-- 2.2 core.divisions
ALTER TABLE core.divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON core.divisions
    USING (tenant_id = get_current_tenant_id());

COMMENT ON POLICY tenant_isolation_policy ON core.divisions IS 'テナント分離ポリシー: 自テナントのデータのみアクセス可';

-- 2.3 core.stores
ALTER TABLE core.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON core.stores
    USING (tenant_id = get_current_tenant_id());

-- 2.4 core.roles
ALTER TABLE core.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON core.roles
    USING (tenant_id = get_current_tenant_id());

-- 2.5 core.skills
ALTER TABLE core.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON core.skills
    USING (tenant_id = get_current_tenant_id());

-- 2.6 core.certifications
ALTER TABLE core.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON core.certifications
    USING (tenant_id = get_current_tenant_id());

-- 2.7 core.shift_patterns
ALTER TABLE core.shift_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON core.shift_patterns
    USING (tenant_id = get_current_tenant_id());

RAISE NOTICE '✅ Core Schema - RLS有効化完了 (6テーブル)';

-- ============================================
-- ステップ3: HR Schema - RLS有効化
-- ============================================

-- 3.1 hr.staff
ALTER TABLE hr.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON hr.staff
    USING (tenant_id = get_current_tenant_id());

-- 3.2 hr.staff_skills
ALTER TABLE hr.staff_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON hr.staff_skills
    USING (tenant_id = get_current_tenant_id());

-- 3.3 hr.staff_certifications
ALTER TABLE hr.staff_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON hr.staff_certifications
    USING (tenant_id = get_current_tenant_id());

-- 3.4 hr.payroll
ALTER TABLE hr.payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON hr.payroll
    USING (tenant_id = get_current_tenant_id());

-- 3.5 hr.commute_allowance
ALTER TABLE hr.commute_allowance ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON hr.commute_allowance
    USING (tenant_id = get_current_tenant_id());

-- 3.6 hr.insurance_rates
ALTER TABLE hr.insurance_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON hr.insurance_rates
    USING (tenant_id = get_current_tenant_id());

-- 3.7 hr.tax_brackets
ALTER TABLE hr.tax_brackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON hr.tax_brackets
    USING (tenant_id = get_current_tenant_id());

-- 3.8 hr.staff_monthly_performance
ALTER TABLE hr.staff_monthly_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON hr.staff_monthly_performance
    USING (tenant_id = get_current_tenant_id());

RAISE NOTICE '✅ HR Schema - RLS有効化完了 (8テーブル)';

-- ============================================
-- ステップ4: Ops Schema - RLS有効化
-- ============================================

-- 4.1 ops.labor_law_constraints
ALTER TABLE ops.labor_law_constraints ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON ops.labor_law_constraints
    USING (tenant_id = get_current_tenant_id());

-- 4.2 ops.store_constraints
ALTER TABLE ops.store_constraints ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON ops.store_constraints
    USING (tenant_id = get_current_tenant_id());

-- 4.3 ops.shift_validation_rules
ALTER TABLE ops.shift_validation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON ops.shift_validation_rules
    USING (tenant_id = get_current_tenant_id());

-- 4.4 ops.shift_plans
ALTER TABLE ops.shift_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON ops.shift_plans
    USING (tenant_id = get_current_tenant_id());

-- 4.5 ops.shifts
ALTER TABLE ops.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON ops.shifts
    USING (tenant_id = get_current_tenant_id());

-- 4.6 ops.shift_preferences
ALTER TABLE ops.shift_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON ops.shift_preferences
    USING (tenant_id = get_current_tenant_id());

-- 4.7 ops.availability_requests
ALTER TABLE ops.availability_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON ops.availability_requests
    USING (tenant_id = get_current_tenant_id());

-- 4.8 ops.work_hours_actual
ALTER TABLE ops.work_hours_actual ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON ops.work_hours_actual
    USING (tenant_id = get_current_tenant_id());

-- 4.9 ops.shift_issues
ALTER TABLE ops.shift_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON ops.shift_issues
    USING (tenant_id = get_current_tenant_id());

-- 4.10 ops.shift_solutions
ALTER TABLE ops.shift_solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON ops.shift_solutions
    USING (tenant_id = get_current_tenant_id());

-- 4.11 ops.shift_monthly_summary
ALTER TABLE ops.shift_monthly_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON ops.shift_monthly_summary
    USING (tenant_id = get_current_tenant_id());

RAISE NOTICE '✅ Ops Schema - RLS有効化完了 (11テーブル)';

-- ============================================
-- ステップ5: Analytics Schema - RLS有効化
-- ============================================

-- 5.1 analytics.sales_actual
ALTER TABLE analytics.sales_actual ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON analytics.sales_actual
    USING (tenant_id = get_current_tenant_id());

-- 5.2 analytics.demand_forecasts
ALTER TABLE analytics.demand_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON analytics.demand_forecasts
    USING (tenant_id = get_current_tenant_id());

-- 5.3 analytics.weather_history
ALTER TABLE analytics.weather_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON analytics.weather_history
    USING (tenant_id = get_current_tenant_id());

-- 5.4 analytics.dashboard_metrics
ALTER TABLE analytics.dashboard_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON analytics.dashboard_metrics
    USING (tenant_id = get_current_tenant_id());

RAISE NOTICE '✅ Analytics Schema - RLS有効化完了 (4テーブル)';

-- ============================================
-- ステップ6: Audit Schema - RLS有効化
-- ============================================

-- 6.1 audit.shift_history
ALTER TABLE audit.shift_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON audit.shift_history
    USING (tenant_id = get_current_tenant_id());

-- 6.2 audit.safety_checklist_master
ALTER TABLE audit.safety_checklist_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON audit.safety_checklist_master
    USING (tenant_id = get_current_tenant_id());

-- 6.3 audit.safety_checklist_records
ALTER TABLE audit.safety_checklist_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON audit.safety_checklist_records
    USING (tenant_id = get_current_tenant_id());

RAISE NOTICE '✅ Audit Schema - RLS有効化完了 (3テーブル)';

-- ============================================
-- ステップ7: 管理者用バイパスロール作成（オプション）
-- ============================================

-- 管理者用ロール作成（すべてのテナントのデータにアクセス可能）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_role') THEN
        CREATE ROLE admin_role;
        COMMENT ON ROLE admin_role IS '管理者ロール: RLSをバイパスしてすべてのテナントデータにアクセス可能';
    END IF;
END $$;

-- 管理者ロールにRLSバイパス権限を付与
ALTER ROLE admin_role BYPASSRLS;

RAISE NOTICE '✅ 管理者ロール作成完了 (admin_role)';

-- ============================================
-- ステップ8: アプリケーション用ロール作成
-- ============================================

-- アプリケーション用ロール作成
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_role') THEN
        CREATE ROLE app_role LOGIN PASSWORD 'change_this_password_in_production';
        COMMENT ON ROLE app_role IS 'アプリケーション用ロール: RLSによってテナントデータが自動的に分離される';
    END IF;
END $$;

-- アプリケーションロールに各スキーマへのアクセス権限を付与
GRANT USAGE ON SCHEMA core TO app_role;
GRANT USAGE ON SCHEMA hr TO app_role;
GRANT USAGE ON SCHEMA ops TO app_role;
GRANT USAGE ON SCHEMA analytics TO app_role;
GRANT USAGE ON SCHEMA audit TO app_role;

-- 各スキーマのテーブルに対するSELECT/INSERT/UPDATE/DELETE権限を付与
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA core TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA hr TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ops TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA analytics TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA audit TO app_role;

-- シーケンスへのUSAGE権限を付与（AUTO_INCREMENTに必要）
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA core TO app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA hr TO app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ops TO app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA analytics TO app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA audit TO app_role;

-- 将来作成されるテーブルにも自動的に権限を付与
ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ops GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA core GRANT USAGE, SELECT ON SEQUENCES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr GRANT USAGE, SELECT ON SEQUENCES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ops GRANT USAGE, SELECT ON SEQUENCES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT USAGE, SELECT ON SEQUENCES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT USAGE, SELECT ON SEQUENCES TO app_role;

RAISE NOTICE '✅ アプリケーションロール作成・権限付与完了 (app_role)';

-- ============================================
-- ステップ9: RLSテスト用サンプルデータ
-- ============================================

-- テスト用の第2テナント作成
INSERT INTO core.tenants (
    tenant_code,
    tenant_name,
    contract_plan,
    contract_start_date,
    max_divisions,
    max_stores,
    max_staff,
    is_active
) VALUES (
    'TEST_COMPANY',
    'テスト株式会社',
    'PREMIUM',
    CURRENT_DATE,
    20,
    200,
    2000,
    TRUE
)
ON CONFLICT (tenant_code) DO NOTHING;

RAISE NOTICE '✅ テスト用テナント作成完了 (TEST_COMPANY)';

-- ============================================
-- 完了メッセージと使い方
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ Row Level Security (RLS) セットアップ完了！';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RLS有効化済みテーブル: 32テーブル';
    RAISE NOTICE '  - Core Schema: 6テーブル';
    RAISE NOTICE '  - HR Schema: 8テーブル';
    RAISE NOTICE '  - Ops Schema: 11テーブル';
    RAISE NOTICE '  - Analytics Schema: 4テーブル';
    RAISE NOTICE '  - Audit Schema: 3テーブル';
    RAISE NOTICE '';
    RAISE NOTICE '👥 作成されたロール:';
    RAISE NOTICE '  - admin_role: 管理者用（RLSバイパス）';
    RAISE NOTICE '  - app_role: アプリケーション用（RLS適用）';
    RAISE NOTICE '';
    RAISE NOTICE '📝 アプリケーションからの使用方法:';
    RAISE NOTICE '';
    RAISE NOTICE '-- 1. ログイン時にテナントIDを設定:';
    RAISE NOTICE 'SELECT set_current_tenant(1);';
    RAISE NOTICE '';
    RAISE NOTICE '-- 2. 通常通りクエリ実行（自動的に該当テナントのみ）:';
    RAISE NOTICE 'SELECT * FROM core.stores;  -- tenant_id=1 のデータのみ表示';
    RAISE NOTICE '';
    RAISE NOTICE '-- 3. セッション終了時またはテナント切替時:';
    RAISE NOTICE 'SELECT set_current_tenant(2);  -- 別のテナントに切替';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  注意事項:';
    RAISE NOTICE '  - app_roleでログインした場合、必ずset_current_tenant()を実行してください';
    RAISE NOTICE '  - admin_roleはRLSをバイパスするため、本番環境では慎重に使用してください';
    RAISE NOTICE '  - app_roleのパスワードは必ず本番環境で変更してください';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 RLS動作確認方法:';
    RAISE NOTICE '';
    RAISE NOTICE '-- テスト1: tenant_id=1 でログイン';
    RAISE NOTICE 'SELECT set_current_tenant(1);';
    RAISE NOTICE 'SELECT tenant_id, tenant_name FROM core.tenants;  -- 1件のみ表示されるべき';
    RAISE NOTICE '';
    RAISE NOTICE '-- テスト2: tenant_id=2 に切替';
    RAISE NOTICE 'SELECT set_current_tenant(2);';
    RAISE NOTICE 'SELECT tenant_id, tenant_name FROM core.tenants;  -- 別の1件が表示される';
    RAISE NOTICE '';
    RAISE NOTICE '次のステップ: バックエンドAPI実装 (backend/src/db/connection.js)';
    RAISE NOTICE '  - データベース接続時にset_current_tenant()を自動実行';
    RAISE NOTICE '  - JWTトークンからtenant_idを取得してセット';
END $$;
