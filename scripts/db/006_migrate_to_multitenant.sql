-- ============================================
-- AIシフトスケジューラー マルチテナント移行スクリプト
-- 対象: Railway PostgreSQL 15+
-- 作成日: 2025-10-31
--
-- 目的:
--   既存のpublicスキーマのデータを
--   新しいマルチテナント対応スキーマ (core, ops, hr, analytics, audit) に移行
-- ============================================

-- ============================================
-- 前提条件チェック
-- ============================================

DO $$
BEGIN
    -- 新スキーマの存在確認
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'core') THEN
        RAISE EXCEPTION '❌ coreスキーマが存在しません。先に005_create_multitenant_schema.sqlを実行してください。';
    END IF;

    RAISE NOTICE '✅ 前提条件チェック完了';
END $$;

-- ============================================
-- ステップ1: デフォルトテナントの作成
-- ============================================

DO $$
DECLARE
    v_tenant_id INT;
    v_division_id INT;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ステップ1: デフォルトテナント作成';
    RAISE NOTICE '============================================';

    -- デフォルトテナント作成（既存データ用）
    INSERT INTO core.tenants (
        tenant_code,
        tenant_name,
        corporate_number,
        contract_plan,
        contract_start_date,
        max_divisions,
        max_stores,
        max_staff,
        is_active
    ) VALUES (
        'DEFAULT',
        'デフォルト法人（既存データ移行用）',
        NULL,
        'STANDARD',
        CURRENT_DATE,
        10,
        100,
        1000,
        TRUE
    )
    ON CONFLICT (tenant_code) DO NOTHING
    RETURNING tenant_id INTO v_tenant_id;

    -- tenant_idを取得（既に存在する場合）
    IF v_tenant_id IS NULL THEN
        SELECT tenant_id INTO v_tenant_id FROM core.tenants WHERE tenant_code = 'DEFAULT';
    END IF;

    RAISE NOTICE '✅ デフォルトテナント作成完了 (tenant_id: %)', v_tenant_id;

    -- デフォルト事業作成
    INSERT INTO core.divisions (
        tenant_id,
        division_code,
        division_name,
        division_type,
        is_active
    ) VALUES (
        v_tenant_id,
        'DEFAULT_DIV',
        'デフォルト事業（既存データ移行用）',
        '飲食',
        TRUE
    )
    ON CONFLICT (tenant_id, division_code) DO NOTHING
    RETURNING division_id INTO v_division_id;

    -- division_idを取得（既に存在する場合）
    IF v_division_id IS NULL THEN
        SELECT division_id INTO v_division_id FROM core.divisions WHERE tenant_id = v_tenant_id AND division_code = 'DEFAULT_DIV';
    END IF;

    RAISE NOTICE '✅ デフォルト事業作成完了 (division_id: %)', v_division_id;
END $$;

-- ============================================
-- ステップ2: Core Schema - マスターデータ移行
-- ============================================

DO $$
DECLARE
    v_tenant_id INT;
    v_division_id INT;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ステップ2: Coreスキーマ - マスターデータ移行';
    RAISE NOTICE '============================================';

    -- デフォルトテナント・事業のIDを取得
    SELECT tenant_id INTO v_tenant_id FROM core.tenants WHERE tenant_code = 'DEFAULT';
    SELECT division_id INTO v_division_id FROM core.divisions WHERE tenant_id = v_tenant_id AND division_code = 'DEFAULT_DIV';

    -- 店舗マスタ移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') THEN
        INSERT INTO core.stores (
            tenant_id,
            division_id,
            store_code,
            store_name,
            address,
            phone_number,
            business_hours_start,
            business_hours_end,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            v_division_id,
            store_code,
            store_name,
            address,
            phone_number,
            business_hours_start,
            business_hours_end,
            is_active,
            created_at,
            updated_at
        FROM public.stores
        ON CONFLICT (tenant_id, division_id, store_code) DO NOTHING;

        RAISE NOTICE '✅ 店舗マスタ移行完了 (% 件)', (SELECT COUNT(*) FROM core.stores WHERE tenant_id = v_tenant_id);
    END IF;

    -- 役職マスタ移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') THEN
        INSERT INTO core.roles (
            tenant_id,
            role_code,
            role_name,
            display_order,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            role_code,
            role_name,
            display_order,
            is_active,
            created_at,
            updated_at
        FROM public.roles
        ON CONFLICT (tenant_id, role_code) DO NOTHING;

        RAISE NOTICE '✅ 役職マスタ移行完了 (% 件)', (SELECT COUNT(*) FROM core.roles WHERE tenant_id = v_tenant_id);
    END IF;

    -- スキルマスタ移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'skills') THEN
        INSERT INTO core.skills (
            tenant_id,
            skill_code,
            skill_name,
            category,
            display_order,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            skill_code,
            skill_name,
            category,
            display_order,
            is_active,
            created_at,
            updated_at
        FROM public.skills
        ON CONFLICT (tenant_id, skill_code) DO NOTHING;

        RAISE NOTICE '✅ スキルマスタ移行完了 (% 件)', (SELECT COUNT(*) FROM core.skills WHERE tenant_id = v_tenant_id);
    END IF;

    -- 資格マスタ移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certifications') THEN
        INSERT INTO core.certifications (
            tenant_id,
            certification_code,
            certification_name,
            issuing_organization,
            is_required,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            'CERT_' || certification_id::TEXT,  -- certification_codeを生成
            certification_name,
            issuing_organization,
            is_required,
            is_active,
            created_at,
            updated_at
        FROM public.certifications
        ON CONFLICT (tenant_id, certification_code) DO NOTHING;

        RAISE NOTICE '✅ 資格マスタ移行完了 (% 件)', (SELECT COUNT(*) FROM core.certifications WHERE tenant_id = v_tenant_id);
    END IF;

    -- シフトパターンマスタ移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shift_patterns') THEN
        INSERT INTO core.shift_patterns (
            tenant_id,
            store_id,
            pattern_code,
            pattern_name,
            start_time,
            end_time,
            break_minutes,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            cs.store_id,  -- 新しいstore_idにマッピング
            'PATTERN_' || ps.pattern_id::TEXT,  -- pattern_codeを生成
            ps.pattern_name,
            ps.start_time,
            ps.end_time,
            ps.break_minutes,
            ps.is_active,
            ps.created_at,
            ps.updated_at
        FROM public.shift_patterns ps
        LEFT JOIN public.stores pstore ON pstore.store_id = ps.store_id
        LEFT JOIN core.stores cs ON cs.tenant_id = v_tenant_id AND cs.store_code = pstore.store_code
        ON CONFLICT (tenant_id, pattern_code) DO NOTHING;

        RAISE NOTICE '✅ シフトパターンマスタ移行完了 (% 件)', (SELECT COUNT(*) FROM core.shift_patterns WHERE tenant_id = v_tenant_id);
    END IF;

END $$;

-- ============================================
-- ステップ3: HR Schema - 人事・給与データ移行
-- ============================================

DO $$
DECLARE
    v_tenant_id INT;
    v_division_id INT;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ステップ3: HRスキーマ - 人事・給与データ移行';
    RAISE NOTICE '============================================';

    SELECT tenant_id INTO v_tenant_id FROM core.tenants WHERE tenant_code = 'DEFAULT';
    SELECT division_id INTO v_division_id FROM core.divisions WHERE tenant_id = v_tenant_id AND division_code = 'DEFAULT_DIV';

    -- スタッフマスタ移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff') THEN
        INSERT INTO hr.staff (
            tenant_id,
            division_id,
            store_id,
            role_id,
            staff_code,
            name,
            email,
            phone_number,
            employment_type,
            hire_date,
            resignation_date,
            monthly_salary,
            hourly_rate,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            v_division_id,
            cs.store_id,  -- 新しいstore_idにマッピング
            cr.role_id,   -- 新しいrole_idにマッピング
            ps.staff_code,
            ps.name,
            ps.email,
            ps.phone_number,
            ps.employment_type,
            ps.hire_date,
            ps.resignation_date,
            ps.monthly_salary,
            ps.hourly_rate,
            ps.is_active,
            ps.created_at,
            ps.updated_at
        FROM public.staff ps
        LEFT JOIN public.stores pstore ON pstore.store_id = ps.store_id
        LEFT JOIN core.stores cs ON cs.tenant_id = v_tenant_id AND cs.store_code = pstore.store_code
        LEFT JOIN public.roles prole ON prole.role_id = ps.role_id
        LEFT JOIN core.roles cr ON cr.tenant_id = v_tenant_id AND cr.role_code = prole.role_code
        ON CONFLICT (tenant_id, staff_code) DO NOTHING;

        RAISE NOTICE '✅ スタッフマスタ移行完了 (% 件)', (SELECT COUNT(*) FROM hr.staff WHERE tenant_id = v_tenant_id);
    END IF;

    -- スタッフスキル移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_skills') THEN
        INSERT INTO hr.staff_skills (
            tenant_id,
            staff_id,
            skill_id,
            proficiency_level,
            acquired_date,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            cs.staff_id,    -- 新しいstaff_idにマッピング
            csk.skill_id,   -- 新しいskill_idにマッピング
            pss.proficiency_level,
            pss.acquired_date,
            pss.created_at,
            pss.updated_at
        FROM public.staff_skills pss
        LEFT JOIN public.staff pstaff ON pstaff.staff_id = pss.staff_id
        LEFT JOIN hr.staff cs ON cs.tenant_id = v_tenant_id AND cs.staff_code = pstaff.staff_code
        LEFT JOIN public.skills pskill ON pskill.skill_id = pss.skill_id
        LEFT JOIN core.skills csk ON csk.tenant_id = v_tenant_id AND csk.skill_code = pskill.skill_code
        WHERE cs.staff_id IS NOT NULL AND csk.skill_id IS NOT NULL
        ON CONFLICT (staff_id, skill_id) DO NOTHING;

        RAISE NOTICE '✅ スタッフスキル移行完了 (% 件)', (SELECT COUNT(*) FROM hr.staff_skills WHERE tenant_id = v_tenant_id);
    END IF;

    -- 通勤手当マスタ移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'commute_allowance') THEN
        INSERT INTO hr.commute_allowance (
            tenant_id,
            distance_from_km,
            distance_to_km,
            allowance_amount,
            description,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            distance_from_km,
            distance_to_km,
            allowance_amount,
            description,
            is_active,
            created_at,
            updated_at
        FROM public.commute_allowance;

        RAISE NOTICE '✅ 通勤手当マスタ移行完了 (% 件)', (SELECT COUNT(*) FROM hr.commute_allowance WHERE tenant_id = v_tenant_id);
    END IF;

    -- 保険料率マスタ移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'insurance_rates') THEN
        INSERT INTO hr.insurance_rates (
            tenant_id,
            insurance_type,
            employee_rate,
            employer_rate,
            effective_from,
            effective_to,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            insurance_type,
            employee_rate,
            employer_rate,
            effective_from,
            effective_to,
            is_active,
            created_at,
            updated_at
        FROM public.insurance_rates;

        RAISE NOTICE '✅ 保険料率マスタ移行完了 (% 件)', (SELECT COUNT(*) FROM hr.insurance_rates WHERE tenant_id = v_tenant_id);
    END IF;

    -- 税率マスタ移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tax_brackets') THEN
        INSERT INTO hr.tax_brackets (
            tenant_id,
            tax_type,
            income_from,
            income_to,
            tax_rate,
            deduction_amount,
            effective_from,
            effective_to,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            tax_type,
            income_from,
            income_to,
            tax_rate,
            deduction_amount,
            effective_from,
            effective_to,
            is_active,
            created_at,
            updated_at
        FROM public.tax_brackets;

        RAISE NOTICE '✅ 税率マスタ移行完了 (% 件)', (SELECT COUNT(*) FROM hr.tax_brackets WHERE tenant_id = v_tenant_id);
    END IF;

END $$;

-- ============================================
-- ステップ4: Ops Schema - シフト運用データ移行
-- ============================================

DO $$
DECLARE
    v_tenant_id INT;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ステップ4: Opsスキーマ - シフト運用データ移行';
    RAISE NOTICE '============================================';

    SELECT tenant_id INTO v_tenant_id FROM core.tenants WHERE tenant_code = 'DEFAULT';

    -- 労働基準法制約移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'labor_law_constraints') THEN
        INSERT INTO ops.labor_law_constraints (
            tenant_id,
            constraint_code,
            constraint_name,
            value,
            unit,
            description,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            constraint_code,
            constraint_name,
            value,
            unit,
            description,
            is_active,
            created_at,
            updated_at
        FROM public.labor_law_constraints
        ON CONFLICT (tenant_id, constraint_code) DO NOTHING;

        RAISE NOTICE '✅ 労働基準法制約移行完了 (% 件)', (SELECT COUNT(*) FROM ops.labor_law_constraints WHERE tenant_id = v_tenant_id);
    END IF;

    -- 店舗制約移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'store_constraints') THEN
        INSERT INTO ops.store_constraints (
            tenant_id,
            store_id,
            constraint_type,
            constraint_value,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            cs.store_id,
            psc.constraint_type,
            psc.constraint_value,
            psc.is_active,
            psc.created_at,
            psc.updated_at
        FROM public.store_constraints psc
        LEFT JOIN public.stores pstore ON pstore.store_id = psc.store_id
        LEFT JOIN core.stores cs ON cs.tenant_id = v_tenant_id AND cs.store_code = pstore.store_code
        WHERE cs.store_id IS NOT NULL;

        RAISE NOTICE '✅ 店舗制約移行完了 (% 件)', (SELECT COUNT(*) FROM ops.store_constraints WHERE tenant_id = v_tenant_id);
    END IF;

    -- シフト検証ルール移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shift_validation_rules') THEN
        INSERT INTO ops.shift_validation_rules (
            tenant_id,
            rule_code,
            rule_name,
            severity,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            rule_code,
            rule_name,
            severity,
            is_active,
            created_at,
            updated_at
        FROM public.shift_validation_rules
        ON CONFLICT (tenant_id, rule_code) DO NOTHING;

        RAISE NOTICE '✅ シフト検証ルール移行完了 (% 件)', (SELECT COUNT(*) FROM ops.shift_validation_rules WHERE tenant_id = v_tenant_id);
    END IF;

    -- シフト計画移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shift_plans') THEN
        INSERT INTO ops.shift_plans (
            tenant_id,
            store_id,
            plan_year,
            plan_month,
            plan_type,
            status,
            created_by,
            approved_by,
            approved_at,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            cs.store_id,
            psp.plan_year,
            psp.plan_month,
            psp.plan_type,
            psp.status,
            cstaff_created.staff_id,
            cstaff_approved.staff_id,
            psp.approved_at,
            psp.created_at,
            psp.updated_at
        FROM public.shift_plans psp
        LEFT JOIN public.stores pstore ON pstore.store_id = psp.store_id
        LEFT JOIN core.stores cs ON cs.tenant_id = v_tenant_id AND cs.store_code = pstore.store_code
        LEFT JOIN public.staff pstaff_created ON pstaff_created.staff_id = psp.created_by
        LEFT JOIN hr.staff cstaff_created ON cstaff_created.tenant_id = v_tenant_id AND cstaff_created.staff_code = pstaff_created.staff_code
        LEFT JOIN public.staff pstaff_approved ON pstaff_approved.staff_id = psp.approved_by
        LEFT JOIN hr.staff cstaff_approved ON cstaff_approved.tenant_id = v_tenant_id AND cstaff_approved.staff_code = pstaff_approved.staff_code
        WHERE cs.store_id IS NOT NULL
        ON CONFLICT (tenant_id, store_id, plan_year, plan_month, plan_type) DO NOTHING;

        RAISE NOTICE '✅ シフト計画移行完了 (% 件)', (SELECT COUNT(*) FROM ops.shift_plans WHERE tenant_id = v_tenant_id);
    END IF;

END $$;

-- ============================================
-- ステップ5: Analytics Schema - 売上・分析データ移行
-- ============================================

DO $$
DECLARE
    v_tenant_id INT;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ステップ5: Analyticsスキーマ - 売上・分析データ移行';
    RAISE NOTICE '============================================';

    SELECT tenant_id INTO v_tenant_id FROM core.tenants WHERE tenant_code = 'DEFAULT';

    -- 売上実績移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_actual') THEN
        INSERT INTO analytics.sales_actual (
            tenant_id,
            store_id,
            actual_date,
            sales_amount,
            customer_count,
            transaction_count,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            cs.store_id,
            psa.actual_date,
            psa.sales_amount,
            psa.customer_count,
            psa.transaction_count,
            psa.created_at,
            psa.updated_at
        FROM public.sales_actual psa
        LEFT JOIN public.stores pstore ON pstore.store_id = psa.store_id
        LEFT JOIN core.stores cs ON cs.tenant_id = v_tenant_id AND cs.store_code = pstore.store_code
        WHERE cs.store_id IS NOT NULL
        ON CONFLICT (tenant_id, store_id, actual_date) DO NOTHING;

        RAISE NOTICE '✅ 売上実績移行完了 (% 件)', (SELECT COUNT(*) FROM analytics.sales_actual WHERE tenant_id = v_tenant_id);
    END IF;

    -- 需要予測移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'demand_forecasts') THEN
        INSERT INTO analytics.demand_forecasts (
            tenant_id,
            store_id,
            forecast_date,
            expected_sales,
            expected_customers,
            required_staff_count,
            confidence_level,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            cs.store_id,
            pdf.forecast_date,
            pdf.expected_sales,
            pdf.expected_customers,
            pdf.required_staff_count,
            pdf.confidence_level,
            pdf.created_at,
            pdf.updated_at
        FROM public.demand_forecasts pdf
        LEFT JOIN public.stores pstore ON pstore.store_id = pdf.store_id
        LEFT JOIN core.stores cs ON cs.tenant_id = v_tenant_id AND cs.store_code = pstore.store_code
        WHERE cs.store_id IS NOT NULL
        ON CONFLICT (tenant_id, store_id, forecast_date) DO NOTHING;

        RAISE NOTICE '✅ 需要予測移行完了 (% 件)', (SELECT COUNT(*) FROM analytics.demand_forecasts WHERE tenant_id = v_tenant_id);
    END IF;

    -- 気象履歴移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'weather_history') THEN
        INSERT INTO analytics.weather_history (
            tenant_id,
            store_id,
            weather_date,
            temperature_avg,
            temperature_max,
            temperature_min,
            precipitation_mm,
            weather_condition,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            cs.store_id,
            pwh.weather_date,
            pwh.temperature_avg,
            pwh.temperature_max,
            pwh.temperature_min,
            pwh.precipitation_mm,
            pwh.weather_condition,
            pwh.created_at,
            pwh.updated_at
        FROM public.weather_history pwh
        LEFT JOIN public.stores pstore ON pstore.store_id = pwh.store_id
        LEFT JOIN core.stores cs ON cs.tenant_id = v_tenant_id AND cs.store_code = pstore.store_code
        ON CONFLICT (tenant_id, store_id, weather_date) DO NOTHING;

        RAISE NOTICE '✅ 気象履歴移行完了 (% 件)', (SELECT COUNT(*) FROM analytics.weather_history WHERE tenant_id = v_tenant_id);
    END IF;

    -- ダッシュボードメトリクス移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dashboard_metrics') THEN
        INSERT INTO analytics.dashboard_metrics (
            tenant_id,
            store_id,
            metric_date,
            metric_type,
            metric_value,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            cs.store_id,
            pdm.metric_date,
            pdm.metric_type,
            pdm.metric_value,
            pdm.created_at,
            pdm.updated_at
        FROM public.dashboard_metrics pdm
        LEFT JOIN public.stores pstore ON pstore.store_id = pdm.store_id
        LEFT JOIN core.stores cs ON cs.tenant_id = v_tenant_id AND cs.store_code = pstore.store_code
        ON CONFLICT (tenant_id, store_id, metric_date, metric_type) DO NOTHING;

        RAISE NOTICE '✅ ダッシュボードメトリクス移行完了 (% 件)', (SELECT COUNT(*) FROM analytics.dashboard_metrics WHERE tenant_id = v_tenant_id);
    END IF;

END $$;

-- ============================================
-- ステップ6: Audit Schema - 監査・履歴データ移行
-- ============================================

DO $$
DECLARE
    v_tenant_id INT;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ステップ6: Auditスキーマ - 監査・履歴データ移行';
    RAISE NOTICE '============================================';

    SELECT tenant_id INTO v_tenant_id FROM core.tenants WHERE tenant_code = 'DEFAULT';

    -- 安全衛生チェックリストマスタ移行
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'safety_checklist_master') THEN
        INSERT INTO audit.safety_checklist_master (
            tenant_id,
            item_name,
            item_category,
            check_frequency,
            is_required,
            display_order,
            is_active,
            created_at,
            updated_at
        )
        SELECT
            v_tenant_id,
            item_name,
            item_category,
            check_frequency,
            is_required,
            display_order,
            is_active,
            created_at,
            updated_at
        FROM public.safety_checklist_master;

        RAISE NOTICE '✅ 安全衛生チェックリストマスタ移行完了 (% 件)', (SELECT COUNT(*) FROM audit.safety_checklist_master WHERE tenant_id = v_tenant_id);
    END IF;

END $$;

-- ============================================
-- 完了確認
-- ============================================

DO $$
DECLARE
    v_tenant_id INT;
    v_table_count INT;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ マルチテナント移行完了！';
    RAISE NOTICE '============================================';

    SELECT tenant_id INTO v_tenant_id FROM core.tenants WHERE tenant_code = 'DEFAULT';

    -- 各スキーマのデータ件数を表示
    RAISE NOTICE '';
    RAISE NOTICE '📊 移行データ集計 (tenant_id: %)', v_tenant_id;
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Core Schema:';
    RAISE NOTICE '  - テナント: % 件', (SELECT COUNT(*) FROM core.tenants);
    RAISE NOTICE '  - 事業: % 件', (SELECT COUNT(*) FROM core.divisions WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - 店舗: % 件', (SELECT COUNT(*) FROM core.stores WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - 役職: % 件', (SELECT COUNT(*) FROM core.roles WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - スキル: % 件', (SELECT COUNT(*) FROM core.skills WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - 資格: % 件', (SELECT COUNT(*) FROM core.certifications WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - シフトパターン: % 件', (SELECT COUNT(*) FROM core.shift_patterns WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '';
    RAISE NOTICE 'HR Schema:';
    RAISE NOTICE '  - スタッフ: % 件', (SELECT COUNT(*) FROM hr.staff WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - スタッフスキル: % 件', (SELECT COUNT(*) FROM hr.staff_skills WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - 通勤手当: % 件', (SELECT COUNT(*) FROM hr.commute_allowance WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - 保険料率: % 件', (SELECT COUNT(*) FROM hr.insurance_rates WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - 税率: % 件', (SELECT COUNT(*) FROM hr.tax_brackets WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '';
    RAISE NOTICE 'Ops Schema:';
    RAISE NOTICE '  - 労働基準法制約: % 件', (SELECT COUNT(*) FROM ops.labor_law_constraints WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - 店舗制約: % 件', (SELECT COUNT(*) FROM ops.store_constraints WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - シフト検証ルール: % 件', (SELECT COUNT(*) FROM ops.shift_validation_rules WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - シフト計画: % 件', (SELECT COUNT(*) FROM ops.shift_plans WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '';
    RAISE NOTICE 'Analytics Schema:';
    RAISE NOTICE '  - 売上実績: % 件', (SELECT COUNT(*) FROM analytics.sales_actual WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - 需要予測: % 件', (SELECT COUNT(*) FROM analytics.demand_forecasts WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - 気象履歴: % 件', (SELECT COUNT(*) FROM analytics.weather_history WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '';
    RAISE NOTICE 'Audit Schema:';
    RAISE NOTICE '  - 安全衛生チェックリスト: % 件', (SELECT COUNT(*) FROM audit.safety_checklist_master WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '';
    RAISE NOTICE '次のステップ: 007_setup_rls_policies.sql を実行してRLSを有効化';
END $$;
