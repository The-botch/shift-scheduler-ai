-- ============================================
-- マスターデータシードスクリプト（完全版）
-- schema.sql実行後にこのスクリプトを実行してデモデータを投入
-- 最終更新: 2025-11-06
--
-- テナント構成:
--   - Tenant 1: DEMO (デモ企業)
--   - Tenant 3: STAND_BANH_MI (Stand Banh Mi)
-- ============================================

DO $$
DECLARE
    v_tenant_id INT;
    v_tenant_id_3 INT;
    v_division_id INT;
    v_division_id_3 INT;
    v_store_id INT;
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📝 マスターデータシード投入開始';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

    -- ============================================
    -- 1. テナント作成
    -- ============================================
    RAISE NOTICE '📋 1. Tenants';

    INSERT INTO core.tenants (tenant_code, tenant_name, contract_start_date, contract_plan, max_stores, max_staff, is_active)
    VALUES ('DEMO', 'デモ企業', '2024-01-01', 'PREMIUM', 100, 1000, TRUE)
    ON CONFLICT (tenant_code) DO NOTHING;

    INSERT INTO core.tenants (tenant_code, tenant_name, contract_start_date, contract_plan, max_stores, max_staff, is_active)
    VALUES ('STAND_BANH_MI', 'Stand Banh Mi', '2025-11-02', 'STANDARD', 10, 100, TRUE)
    ON CONFLICT (tenant_code) DO NOTHING;

    SELECT tenant_id INTO v_tenant_id FROM core.tenants WHERE tenant_code = 'DEMO';
    SELECT tenant_id INTO v_tenant_id_3 FROM core.tenants WHERE tenant_code = 'STAND_BANH_MI';
    RAISE NOTICE '   ✅ DEMO (ID: %)', v_tenant_id;
    RAISE NOTICE '   ✅ STAND_BANH_MI (ID: %)', v_tenant_id_3;

    -- ============================================
    -- 2. Division作成
    -- ============================================
    RAISE NOTICE '📋 2. Divisions';

    INSERT INTO core.divisions (tenant_id, division_code, division_name, is_active)
    VALUES (v_tenant_id, 'TOKYO', '東京エリア', TRUE)
    ON CONFLICT (tenant_id, division_code) DO NOTHING;

    INSERT INTO core.divisions (tenant_id, division_code, division_name, is_active)
    VALUES (v_tenant_id_3, 'DEFAULT', 'デフォルト部門', TRUE)
    ON CONFLICT (tenant_id, division_code) DO NOTHING;

    SELECT division_id INTO v_division_id FROM core.divisions WHERE tenant_id = v_tenant_id AND division_code = 'TOKYO';
    SELECT division_id INTO v_division_id_3 FROM core.divisions WHERE tenant_id = v_tenant_id_3 AND division_code = 'DEFAULT';
    RAISE NOTICE '   ✅ DEMO/TOKYO (ID: %)', v_division_id;
    RAISE NOTICE '   ✅ STAND_BANH_MI/DEFAULT (ID: %)', v_division_id_3;

    -- ============================================
    -- 3. 店舗作成
    -- ============================================
    RAISE NOTICE '📋 3. Stores';

    -- ──────────────────────────────────────────
    -- Tenant 1: DEMO
    -- ──────────────────────────────────────────
    INSERT INTO core.stores (tenant_id, division_id, store_code, store_name, address, phone_number, business_hours_start, business_hours_end, is_active)
    VALUES (v_tenant_id, v_division_id, 'STORE001', '渋谷店', '東京都渋谷区道玄坂1-2-3', '03-1234-5678', '09:00', '22:00', TRUE)
    ON CONFLICT (tenant_id, division_id, store_code) DO NOTHING;

    -- ──────────────────────────────────────────
    -- Tenant 3: STAND_BANH_MI
    -- ──────────────────────────────────────────
    INSERT INTO core.stores (tenant_id, division_id, store_code, store_name, address, phone_number, business_hours_start, business_hours_end, is_active)
    VALUES (v_tenant_id_3, v_division_id_3, 'COME', 'CO''ME by stand Bánh Mi(麻布台)', '東京都港区麻布台1-3-1 ガーデンプラザC 麻布台ヒルズマーケット B1F', '03-6277-6887', '11:00', '20:00', TRUE)
    ON CONFLICT (tenant_id, division_id, store_code) DO NOTHING;

    INSERT INTO core.stores (tenant_id, division_id, store_code, store_name, address, phone_number, business_hours_start, business_hours_end, is_active)
    VALUES (v_tenant_id_3, v_division_id_3, 'ATELIER', 'L''Atelier de Stand Banh Mi （ラトリエ ドゥ スタンドバインミー）', '東京都目黒区自由が丘1-3-21', '050-5589-5869', '09:00', '22:00', TRUE)
    ON CONFLICT (tenant_id, division_id, store_code) DO NOTHING;

    INSERT INTO core.stores (tenant_id, division_id, store_code, store_name, address, phone_number, business_hours_start, business_hours_end, is_active)
    VALUES (v_tenant_id_3, v_division_id_3, 'SHIBUYA', 'BANH MI STAR SHIBUYA by Nha Viet Nam', '東京都渋谷区渋谷3-21-3 渋谷ストリーム 2F', '03-5962-7962', '10:00', '23:00', TRUE)
    ON CONFLICT (tenant_id, division_id, store_code) DO NOTHING;

    INSERT INTO core.stores (tenant_id, division_id, store_code, store_name, address, phone_number, business_hours_start, business_hours_end, is_active)
    VALUES (v_tenant_id_3, v_division_id_3, 'STAND_BANH_MI', 'Stand Banh Mi', '東京都目黒区鷹番2-16-23 Ｍ＆Ｋ鷹番 1F', '050-5594-9783', '10:00', '21:00', TRUE)
    ON CONFLICT (tenant_id, division_id, store_code) DO NOTHING;

    INSERT INTO core.stores (tenant_id, division_id, store_code, store_name, address, phone_number, business_hours_start, business_hours_end, is_active)
    VALUES (v_tenant_id_3, v_division_id_3, 'STAND_BO_BUN', 'Stand Bo Bun', '東京都目黒区祐天寺2-3-2', '03-6303-2245', '10:00', '21:00', TRUE)
    ON CONFLICT (tenant_id, division_id, store_code) DO NOTHING;

    SELECT store_id INTO v_store_id FROM core.stores WHERE tenant_id = v_tenant_id AND store_code = 'STORE001';
    RAISE NOTICE '   ✅ 6店舗作成完了';

    -- ============================================
    -- 4. 役職作成
    -- ============================================
    RAISE NOTICE '📋 4. Roles';

    -- ──────────────────────────────────────────
    -- Tenant 1: DEMO
    -- ──────────────────────────────────────────
    INSERT INTO core.roles (tenant_id, role_code, role_name, display_order, is_active) VALUES
    (v_tenant_id, 'MANAGER', '店長', 1, TRUE),
    (v_tenant_id, 'SUB_MANAGER', '副店長', 2, TRUE),
    (v_tenant_id, 'LEADER', 'リーダー', 3, TRUE),
    (v_tenant_id, 'SUB_LEADER', '主任', 3, TRUE),
    (v_tenant_id, 'STAFF', 'スタッフ', 4, TRUE)
    ON CONFLICT (tenant_id, role_code) DO NOTHING;

    -- ──────────────────────────────────────────
    -- Tenant 3: STAND_BANH_MI
    -- ──────────────────────────────────────────
    INSERT INTO core.roles (tenant_id, role_code, role_name, display_order, is_active) VALUES
    (v_tenant_id_3, 'TRIAL', 'トライアル', 0, TRUE),
    (v_tenant_id_3, 'STAFF', '一般スタッフ', 1, TRUE),
    (v_tenant_id_3, 'SENIOR', '店長', 2, TRUE)
    ON CONFLICT (tenant_id, role_code) DO NOTHING;

    RAISE NOTICE '   ✅ 役職作成完了';

    -- ============================================
    -- 5. スキル作成
    -- ============================================
    RAISE NOTICE '📋 5. Skills';

    INSERT INTO core.skills (tenant_id, skill_code, skill_name, category, display_order, is_active) VALUES
    (v_tenant_id, 'CASHIER', 'レジ業務', 'フロント', 1, TRUE),
    (v_tenant_id, 'COOKING', '調理', 'キッチン', 2, TRUE),
    (v_tenant_id, 'CUSTOMER', '接客', 'フロント', 3, TRUE),
    (v_tenant_id, 'MANAGEMENT', '店舗管理', '管理', 4, TRUE)
    ON CONFLICT (tenant_id, skill_code) DO NOTHING;

    RAISE NOTICE '   ✅ スキル作成完了';

    -- ============================================
    -- 6. 雇用形態作成
    -- ============================================
    RAISE NOTICE '📋 6. Employment Types';

    -- ──────────────────────────────────────────
    -- Tenant 1: DEMO
    -- ──────────────────────────────────────────
    INSERT INTO core.employment_types (tenant_id, employment_code, employment_name, payment_type, display_order, is_active) VALUES
    (v_tenant_id, 'FULL_TIME', '正社員', 'monthly', 1, TRUE),
    (v_tenant_id, 'CONTRACT', '契約社員', 'monthly', 2, TRUE),
    (v_tenant_id, 'PART_TIME', 'アルバイト', 'hourly', 3, TRUE),
    (v_tenant_id, 'PART', 'パート', 'hourly', 4, TRUE),
    (v_tenant_id, 'OUTSOURCE', '業務委託', 'contract', 5, TRUE)
    ON CONFLICT (tenant_id, employment_code) DO NOTHING;

    -- ──────────────────────────────────────────
    -- Tenant 3: STAND_BANH_MI
    -- ──────────────────────────────────────────
    INSERT INTO core.employment_types (tenant_id, employment_code, employment_name, payment_type, display_order, is_active) VALUES
    (v_tenant_id_3, 'FULL_TIME', '正社員', 'MONTHLY', 0, TRUE),
    (v_tenant_id_3, 'PART_TIME', 'アルバイト', 'HOURLY', 0, TRUE),
    (v_tenant_id_3, 'CONTRACT', '契約社員', 'MONTHLY', 2, TRUE),
    (v_tenant_id_3, 'FREELANCE', '業務委託', 'HOURLY', 3, TRUE)
    ON CONFLICT (tenant_id, employment_code) DO NOTHING;

    RAISE NOTICE '   ✅ 雇用形態作成完了';

    -- ============================================
    -- 7. シフトパターン作成
    -- ============================================
    RAISE NOTICE '📋 7. Shift Patterns';

    INSERT INTO core.shift_patterns (tenant_id, pattern_code, pattern_name, start_time, end_time, break_minutes, is_active) VALUES
    (v_tenant_id, 'MORNING', '早番', '09:00', '17:00', 60, TRUE),
    (v_tenant_id, 'AFTERNOON', '遅番', '14:00', '22:00', 60, TRUE),
    (v_tenant_id, 'FULL_DAY', '通し', '09:00', '22:00', 120, TRUE),
    (v_tenant_id, 'SHORT_MORNING', '午前短時間', '09:00', '13:00', 0, TRUE),
    (v_tenant_id, 'SHORT_AFTERNOON', '午後短時間', '17:00', '22:00', 0, TRUE),
    (v_tenant_id, 'MID_DAY', '中番', '11:00', '19:00', 60, TRUE),
    (v_tenant_id, 'EARLY', '早番', '09:00', '17:00', 60, TRUE),
    (v_tenant_id, 'MID', '中番', '13:00', '21:00', 60, TRUE),
    (v_tenant_id, 'LATE', '遅番', '17:00', '22:00', 0, TRUE),
    (v_tenant_id, 'SHORT_AM', '短時間午前', '09:00', '13:00', 0, TRUE)
    ON CONFLICT (tenant_id, pattern_code) DO NOTHING;

    RAISE NOTICE '   ✅ シフトパターン作成完了';

    -- ============================================
    -- 8. 通勤手当マスター（Tenant 1のみ）
    -- ============================================
    RAISE NOTICE '📋 8. Commute Allowance';

    INSERT INTO hr.commute_allowance (tenant_id, distance_from_km, distance_to_km, allowance_amount, description, is_active) VALUES
    (v_tenant_id, 0.00, 2.00, 0.00, '2km未満（支給なし）', TRUE),
    (v_tenant_id, 2.00, 10.00, 500.00, '2km以上10km未満', TRUE),
    (v_tenant_id, 10.00, 15.00, 600.00, '10km以上15km未満', TRUE),
    (v_tenant_id, 15.00, 25.00, 800.00, '15km以上25km未満', TRUE),
    (v_tenant_id, 25.00, 35.00, 1000.00, '25km以上35km未満', TRUE),
    (v_tenant_id, 35.00, 45.00, 1200.00, '35km以上45km未満', TRUE),
    (v_tenant_id, 45.00, 999.00, 1500.00, '45km以上', TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '   ✅ 通勤手当作成完了';

    -- ============================================
    -- 9. 保険料率マスター（Tenant 1のみ）
    -- ============================================
    RAISE NOTICE '📋 9. Insurance Rates';

    INSERT INTO hr.insurance_rates (tenant_id, insurance_type, employee_rate, employer_rate, effective_from, is_active) VALUES
    (v_tenant_id, 'HEALTH', 0.0499, 0.0499, '2024-01-01', TRUE),
    (v_tenant_id, 'PENSION', 0.0915, 0.0915, '2024-01-01', TRUE),
    (v_tenant_id, 'EMPLOYMENT', 0.0060, 0.0095, '2024-01-01', TRUE),
    (v_tenant_id, 'WORKERS_COMP', 0.0000, 0.0030, '2024-01-01', TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '   ✅ 保険料率作成完了';

    -- ============================================
    -- 10. 税率ブラケットマスター（Tenant 1のみ）
    -- ============================================
    RAISE NOTICE '📋 10. Tax Brackets';

    INSERT INTO hr.tax_brackets (tenant_id, tax_type, income_from, income_to, tax_rate, deduction_amount, effective_from, is_active) VALUES
    (v_tenant_id, 'INCOME_TAX', 0.00, 1950000.00, 0.0500, 0.00, '2024-01-01', TRUE),
    (v_tenant_id, 'INCOME_TAX', 1950001.00, 3300000.00, 0.1000, 97500.00, '2024-01-01', TRUE),
    (v_tenant_id, 'INCOME_TAX', 3300001.00, 6950000.00, 0.2000, 427500.00, '2024-01-01', TRUE),
    (v_tenant_id, 'INCOME_TAX', 6950001.00, 9000000.00, 0.2300, 636000.00, '2024-01-01', TRUE),
    (v_tenant_id, 'INCOME_TAX', 9000001.00, 18000000.00, 0.3300, 1536000.00, '2024-01-01', TRUE),
    (v_tenant_id, 'INCOME_TAX', 18000001.00, 40000000.00, 0.4000, 2796000.00, '2024-01-01', TRUE),
    (v_tenant_id, 'INCOME_TAX', 40000001.00, NULL, 0.4500, 4796000.00, '2024-01-01', TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '   ✅ 税率ブラケット作成完了';

    -- ============================================
    -- 11. 労働法制約マスター（Tenant 1のみ）
    -- ============================================
    RAISE NOTICE '📋 11. Labor Law Constraints';

    INSERT INTO ops.labor_law_constraints (tenant_id, constraint_code, constraint_name, value, description, is_active) VALUES
    (v_tenant_id, 'LAW_001', '法定労働時間（1日）', 8.00, '使用者は労働者に休憩時間を除き一週間について四十時間を超えて労働させてはならない', TRUE),
    (v_tenant_id, 'LAW_002', '法定労働時間（1週間）', 40.00, '使用者は一週間の各日については労働者に休憩時間を除き一日について八時間を超えて労働させてはならない', TRUE),
    (v_tenant_id, 'LAW_003', '休憩時間（6時間超）', 45.00, '労働時間が六時間を超える場合においては少くとも四十五分の休憩時間を労働時間の途中に与えなければならない', TRUE),
    (v_tenant_id, 'LAW_004', '休憩時間（8時間超）', 60.00, '労働時間が八時間を超える場合においては少くとも一時間の休憩時間を労働時間の途中に与えなければならない', TRUE),
    (v_tenant_id, 'LAW_005', '法定休日', 40.00, '使用者は労働者に対して毎週少くとも一回の休日を与えなければならない', TRUE),
    (v_tenant_id, 'LAW_006', '時間外労働上限（月）', 45.00, '三六協定で定める時間外労働は原則として月45時間以内', TRUE),
    (v_tenant_id, 'LAW_007', '時間外労働上限（年）', 360.00, '三六協定で定める時間外労働は原則として年360時間以内', TRUE),
    (v_tenant_id, 'LAW_008', '勤務間インターバル', 11.00, '勤務終了後から次の勤務開始まで11時間以上の休息時間を確保（努力義務）', TRUE)
    ON CONFLICT (tenant_id, constraint_code) DO NOTHING;

    RAISE NOTICE '   ✅ 労働法制約作成完了';

    -- ============================================
    -- 12. シフト検証ルールマスター（Tenant 1のみ）
    -- ============================================
    RAISE NOTICE '📋 12. Shift Validation Rules';

    INSERT INTO ops.shift_validation_rules (tenant_id, rule_code, rule_name, severity, is_active) VALUES
    (v_tenant_id, 'VAL001', '18歳未満深夜勤務', 'ERROR', TRUE),
    (v_tenant_id, 'VAL002', '労働時間上限', 'ERROR', TRUE),
    (v_tenant_id, 'VAL003', '休憩時間確保', 'ERROR', TRUE),
    (v_tenant_id, 'VAL004', '勤務間インターバル', 'WARNING', TRUE),
    (v_tenant_id, 'VAL005', '36協定上限', 'ERROR', TRUE),
    (v_tenant_id, 'VAL006', '連続勤務日数', 'WARNING', TRUE),
    (v_tenant_id, 'VAL007', '最低人員配置', 'ERROR', TRUE),
    (v_tenant_id, 'VAL008', 'スキル要件', 'WARNING', TRUE)
    ON CONFLICT (tenant_id, rule_code) DO NOTHING;

    RAISE NOTICE '   ✅ シフト検証ルール作成完了';

    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🎉 マスターデータシード投入完了';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '📌 次のステップ:';
    RAISE NOTICE '   スタッフデータを投入するには:';
    RAISE NOTICE '   node scripts/setup/import_all_17_masters.mjs';
    RAISE NOTICE '';
    RAISE NOTICE '   トランザクションデータを投入するには:';
    RAISE NOTICE '   psql $DATABASE_URL -f scripts/setup/seed_transaction_data.sql';
    RAISE NOTICE '';
END $$;
