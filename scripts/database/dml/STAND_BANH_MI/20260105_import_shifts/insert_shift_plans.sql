-- ============================================
-- シフトプランデータ（第2案）
-- 生成日時: 2026-01-05
-- tenant_id: 3
-- ============================================

-- 店舗IDマッピング:
-- 麻布台 → store_id: 6 (COME 麻布台)
-- 自由が丘 → store_id: 7 (Atelier)
-- 学大 → store_id: 8 (Stand Banh Mi)
-- 祐天寺 → store_id: 9 (Stand Bo Bun)
-- pho/渋谷 → store_id: 10 (Stand Pho Yo)
-- TT → store_id: 11 (Tipsy Tiger) ※要確認

-- ============================================
-- shift_plans INSERT文
-- ============================================

-- 2025年12月分
INSERT INTO ops.shift_plans (
    tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES
    (3, 6, 2025, 12, 'SECOND-202512-6', '2025年12月 第2案 (COME 麻布台)',
     '2025-12-01', '2025-12-31', 'APPROVED', 'SECOND', 'MANUAL',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 7, 2025, 12, 'SECOND-202512-7', '2025年12月 第2案 (Atelier)',
     '2025-12-01', '2025-12-31', 'APPROVED', 'SECOND', 'MANUAL',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 8, 2025, 12, 'SECOND-202512-8', '2025年12月 第2案 (Stand Banh Mi)',
     '2025-12-01', '2025-12-31', 'APPROVED', 'SECOND', 'MANUAL',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 9, 2025, 12, 'SECOND-202512-9', '2025年12月 第2案 (Stand Bo Bun)',
     '2025-12-01', '2025-12-31', 'APPROVED', 'SECOND', 'MANUAL',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 10, 2025, 12, 'SECOND-202512-10', '2025年12月 第2案 (Stand Pho Yo)',
     '2025-12-01', '2025-12-31', 'APPROVED', 'SECOND', 'MANUAL',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 11, 2025, 12, 'SECOND-202512-11', '2025年12月 第2案 (Tipsy Tiger)',
     '2025-12-01', '2025-12-31', 'APPROVED', 'SECOND', 'MANUAL',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, store_id, plan_year, plan_month, plan_type) DO NOTHING;

-- 2026年1月分
INSERT INTO ops.shift_plans (
    tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES
    (3, 6, 2026, 1, 'SECOND-202601-6', '2026年1月 第2案 (COME 麻布台)',
     '2026-01-01', '2026-01-31', 'APPROVED', 'SECOND', 'MANUAL',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 7, 2026, 1, 'SECOND-202601-7', '2026年1月 第2案 (Atelier)',
     '2026-01-01', '2026-01-31', 'APPROVED', 'SECOND', 'MANUAL',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 8, 2026, 1, 'SECOND-202601-8', '2026年1月 第2案 (Stand Banh Mi)',
     '2026-01-01', '2026-01-31', 'APPROVED', 'SECOND', 'MANUAL',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 9, 2026, 1, 'SECOND-202601-9', '2026年1月 第2案 (Stand Bo Bun)',
     '2026-01-01', '2026-01-31', 'APPROVED', 'SECOND', 'MANUAL',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 10, 2026, 1, 'SECOND-202601-10', '2026年1月 第2案 (Stand Pho Yo)',
     '2026-01-01', '2026-01-31', 'APPROVED', 'SECOND', 'MANUAL',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 11, 2026, 1, 'SECOND-202601-11', '2026年1月 第2案 (Tipsy Tiger)',
     '2026-01-01', '2026-01-31', 'APPROVED', 'SECOND', 'MANUAL',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tenant_id, store_id, plan_year, plan_month, plan_type) DO NOTHING;
