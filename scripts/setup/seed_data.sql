-- ============================================
-- マスターデータシードスクリプト
-- schema.sql実行後にこのスクリプトを実行してデモデータを投入
-- ============================================

DO $$
DECLARE
    v_tenant_id INT;
    v_division_id INT;
    v_store_id INT;
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📝 マスターデータシード投入開始';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

    -- テナント作成
    INSERT INTO core.tenants (tenant_code, tenant_name, contract_start_date, contract_plan, max_stores, max_staff, is_active)
    VALUES ('DEMO', 'デモ企業', '2024-01-01', 'PREMIUM', 100, 1000, TRUE)
    ON CONFLICT (tenant_code) DO NOTHING;

    SELECT tenant_id INTO v_tenant_id FROM core.tenants WHERE tenant_code = 'DEMO';
    RAISE NOTICE '✅ テナント作成 (ID: %)', v_tenant_id;

    -- Division作成
    INSERT INTO core.divisions (tenant_id, division_code, division_name, is_active)
    VALUES (v_tenant_id, 'TOKYO', '東京エリア', TRUE)
    ON CONFLICT (tenant_id, division_code) DO NOTHING;

    SELECT division_id INTO v_division_id FROM core.divisions WHERE tenant_id = v_tenant_id AND division_code = 'TOKYO';
    RAISE NOTICE '✅ Division作成 (ID: %)', v_division_id;

    -- 店舗
    INSERT INTO core.stores (tenant_id, division_id, store_code, store_name, address, phone_number, business_hours_start, business_hours_end, is_active)
    VALUES (v_tenant_id, v_division_id, 'STORE001', '渋谷店', '東京都渋谷区道玄坂1-2-3', '03-1234-5678', '09:00', '22:00', TRUE)
    ON CONFLICT (tenant_id, division_id, store_code) DO NOTHING;

    SELECT store_id INTO v_store_id FROM core.stores WHERE tenant_id = v_tenant_id AND store_code = 'STORE001';
    RAISE NOTICE '✅ 店舗作成 (ID: %)', v_store_id;

    -- 役職
    INSERT INTO core.roles (tenant_id, role_code, role_name, display_order, is_active) VALUES
    (v_tenant_id, 'MANAGER', '店長', 1, TRUE),
    (v_tenant_id, 'SUB_MANAGER', '副店長', 2, TRUE),
    (v_tenant_id, 'LEADER', 'リーダー', 3, TRUE),
    (v_tenant_id, 'STAFF', 'スタッフ', 4, TRUE)
    ON CONFLICT (tenant_id, role_code) DO NOTHING;

    RAISE NOTICE '✅ 役職作成';

    -- スキル
    INSERT INTO core.skills (tenant_id, skill_code, skill_name, category, display_order, is_active) VALUES
    (v_tenant_id, 'CASHIER', 'レジ業務', 'フロント', 1, TRUE),
    (v_tenant_id, 'COOKING', '調理', 'キッチン', 2, TRUE),
    (v_tenant_id, 'CUSTOMER', '接客', 'フロント', 3, TRUE),
    (v_tenant_id, 'MANAGEMENT', '店舗管理', '管理', 4, TRUE)
    ON CONFLICT (tenant_id, skill_code) DO NOTHING;

    RAISE NOTICE '✅ スキル作成';

    -- 雇用形態
    INSERT INTO core.employment_types (tenant_id, employment_code, employment_name, payment_type, display_order, is_active) VALUES
    (v_tenant_id, 'FULL_TIME', '正社員', 'monthly', 1, TRUE),
    (v_tenant_id, 'CONTRACT', '契約社員', 'monthly', 2, TRUE),
    (v_tenant_id, 'PART_TIME', 'アルバイト', 'hourly', 3, TRUE),
    (v_tenant_id, 'PART', 'パート', 'hourly', 4, TRUE),
    (v_tenant_id, 'OUTSOURCE', '業務委託', 'contract', 5, TRUE)
    ON CONFLICT (tenant_id, employment_code) DO NOTHING;

    RAISE NOTICE '✅ 雇用形態作成';

    -- シフトパターン
    INSERT INTO core.shift_patterns (tenant_id, pattern_code, pattern_name, start_time, end_time, break_minutes, is_active) VALUES
    (v_tenant_id, 'MORNING', '早番', '09:00', '17:00', 60, TRUE),
    (v_tenant_id, 'AFTERNOON', '遅番', '14:00', '22:00', 60, TRUE),
    (v_tenant_id, 'FULL_DAY', '通し', '09:00', '22:00', 120, TRUE),
    (v_tenant_id, 'SHORT_MORNING', '午前短時間', '09:00', '13:00', 0, TRUE),
    (v_tenant_id, 'SHORT_AFTERNOON', '午後短時間', '17:00', '22:00', 0, TRUE),
    (v_tenant_id, 'MID_DAY', '中番', '11:00', '19:00', 60, TRUE)
    ON CONFLICT (tenant_id, pattern_code) DO NOTHING;

    RAISE NOTICE '✅ シフトパターン作成';

    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🎉 基本マスターデータシード投入完了';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '📌 次のステップ:';
    RAISE NOTICE '   詳細マスターデータを投入するには:';
    RAISE NOTICE '   node scripts/import_all_17_masters.mjs';
    RAISE NOTICE '';
END $$;
