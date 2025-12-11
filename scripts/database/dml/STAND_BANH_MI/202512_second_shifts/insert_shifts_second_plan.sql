-- ============================================
-- シフトデータ（第2案・承認済み）
-- 生成日時: 2025-12-11T00:44:14.931518
-- tenant_id: 3
-- ============================================

-- ============================================
-- shift_plans INSERT文
-- ============================================

INSERT INTO ops.shift_plans (
    plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES (
    201, 3, 7, 2025, 12, 'SECOND-202512-7', '2025年12月 第2案 (Atelier)',
    '2025-12-01', '2025-12-30', 'APPROVED', 'SECOND', 'MANUAL',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO ops.shift_plans (
    plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES (
    202, 3, 7, 2026, 1, 'SECOND-202601-7', '2026年1月 第2案 (Atelier)',
    '2026-01-04', '2026-01-05', 'APPROVED', 'SECOND', 'MANUAL',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO ops.shift_plans (
    plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES (
    203, 3, 6, 2025, 12, 'SECOND-202512-6', '2025年12月 第2案 (COME 麻布台)',
    '2025-12-01', '2025-12-31', 'APPROVED', 'SECOND', 'MANUAL',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO ops.shift_plans (
    plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES (
    204, 3, 10, 2025, 12, 'SECOND-202512-10', '2025年12月 第2案 (SHIBUYA)',
    '2025-12-01', '2025-12-30', 'APPROVED', 'SECOND', 'MANUAL',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO ops.shift_plans (
    plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES (
    205, 3, 10, 2026, 1, 'SECOND-202601-10', '2026年1月 第2案 (SHIBUYA)',
    '2026-01-03', '2026-01-05', 'APPROVED', 'SECOND', 'MANUAL',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO ops.shift_plans (
    plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES (
    206, 3, 8, 2025, 12, 'SECOND-202512-8', '2025年12月 第2案 (Stand Banh Mi)',
    '2025-12-01', '2025-12-29', 'APPROVED', 'SECOND', 'MANUAL',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO ops.shift_plans (
    plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES (
    207, 3, 9, 2025, 12, 'SECOND-202512-9', '2025年12月 第2案 (Stand Bo Bun)',
    '2025-12-01', '2025-12-29', 'APPROVED', 'SECOND', 'MANUAL',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO ops.shift_plans (
    plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES (
    208, 3, 10, 2025, 12, 'SECOND-202512-10', '2025年12月 第2案 (Stand Pho You)',
    '2025-12-04', '2025-12-29', 'APPROVED', 'SECOND', 'MANUAL',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO ops.shift_plans (
    plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES (
    209, 3, 10, 2026, 1, 'SECOND-202601-10', '2026年1月 第2案 (Stand Pho You)',
    '2026-01-05', '2026-01-05', 'APPROVED', 'SECOND', 'MANUAL',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO ops.shift_plans (
    plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES (
    210, 3, 11, 2025, 12, 'SECOND-202512-11', '2025年12月 第2案 (Tipsy Tiger)',
    '2025-12-01', '2025-12-30', 'APPROVED', 'SECOND', 'MANUAL',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO ops.shift_plans (
    plan_id, tenant_id, store_id, plan_year, plan_month, plan_code, plan_name,
    period_start, period_end, status, plan_type, generation_type,
    created_at, updated_at
) VALUES (
    211, 3, 11, 2026, 1, 'SECOND-202601-11', '2026年1月 第2案 (Tipsy Tiger)',
    '2026-01-03', '2026-01-05', 'APPROVED', 'SECOND', 'MANUAL',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- ============================================
-- shifts INSERT文
-- ============================================

-- Atelier 2025年12月
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-01', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 323, '2025-12-01', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-01', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 329, '2025-12-01', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-03', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 312, '2025-12-03', 1,
    '18:00', '23:30', 60, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 319, '2025-12-03', 1,
    '18:00', '23:30', 0, 5.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-03', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-03', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-04', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 323, '2025-12-04', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 329, '2025-12-04', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 330, '2025-12-04', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-05', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 312, '2025-12-05', 1,
    '18:00', '23:30', 60, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 319, '2025-12-05', 1,
    '18:00', '23:30', 0, 5.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-05', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-05', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-06', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 312, '2025-12-06', 1,
    '16:00', '23:30', 60, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 319, '2025-12-06', 1,
    '16:00', '23:30', 0, 7.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-06', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 329, '2025-12-06', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-07', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 303, '2025-12-07', 1,
    '10:30', '15:30', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 312, '2025-12-07', 1,
    '16:00', '23:30', 60, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 319, '2025-12-07', 1,
    '16:00', '23:30', 0, 7.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-07', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-08', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 323, '2025-12-08', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-08', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 329, '2025-12-08', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-11', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 323, '2025-12-11', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 329, '2025-12-11', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 330, '2025-12-11', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 331, '2025-12-11', 1,
    '10:00', '18:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-12', 1,
    '16:00', '23:30', 0, 7.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-12', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-12', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 330, '2025-12-12', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-13', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 312, '2025-12-13', 1,
    '16:00', '23:30', 60, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 319, '2025-12-13', 1,
    '16:00', '23:30', 0, 7.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-13', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 329, '2025-12-13', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-14', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 312, '2025-12-14', 1,
    '10:00', '23:30', 60, 12.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 319, '2025-12-14', 1,
    '10:00', '23:30', 60, 12.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-14', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-15', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 323, '2025-12-15', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-15', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 329, '2025-12-15', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-18', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 323, '2025-12-18', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 329, '2025-12-18', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 331, '2025-12-18', 1,
    '10:00', '16:00', 0, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-19', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 312, '2025-12-19', 1,
    '18:00', '23:30', 60, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 319, '2025-12-19', 1,
    '18:00', '23:30', 0, 5.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-19', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-19', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-20', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 303, '2025-12-20', 1,
    '10:30', '15:30', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 312, '2025-12-20', 1,
    '16:00', '23:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 319, '2025-12-20', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-20', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 329, '2025-12-20', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-21', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 303, '2025-12-21', 1,
    '10:30', '15:30', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 320, '2025-12-21', 1,
    '11:00', '23:00', 60, 11.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-21', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-22', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 323, '2025-12-22', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-22', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 329, '2025-12-22', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-24', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 312, '2025-12-24', 1,
    '18:00', '23:00', 60, 4.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 319, '2025-12-24', 1,
    '18:00', '23:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-24', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-24', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-25', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 312, '2025-12-25', 1,
    '10:00', '23:30', 60, 12.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 319, '2025-12-25', 1,
    '10:00', '23:30', 60, 12.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-25', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-26', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 312, '2025-12-26', 1,
    '18:00', '23:30', 60, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 319, '2025-12-26', 1,
    '18:00', '23:30', 0, 5.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-26', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-26', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-27', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 303, '2025-12-27', 1,
    '10:30', '15:30', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 323, '2025-12-27', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-27', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 329, '2025-12-27', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-28', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 303, '2025-12-28', 1,
    '10:30', '15:30', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 320, '2025-12-28', 1,
    '11:00', '23:00', 60, 11.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-28', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 302, '2025-12-29', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 324, '2025-12-29', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-29', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 327, '2025-12-29', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 330, '2025-12-29', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 201, 326, '2025-12-30', 1,
    '09:00', '15:00', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Atelier 2026年1月
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 202, 329, '2026-01-04', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 202, 312, '2026-01-05', 1,
    '10:00', '23:30', 60, 12.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 7, 202, 326, '2026-01-05', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- COME 麻布台 2025年12月
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-01', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-01', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 319, '2025-12-01', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-02', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-02', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-02', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 312, '2025-12-02', 1,
    '17:30', '23:30', 0, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-03', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-03', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-03', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-03', 1,
    '12:00', '20:30', 60, 7.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 304, '2025-12-04', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-04', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-04', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-05', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-05', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-05', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-06', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-06', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-06', 1,
    '08:00', '17:30', 60, 8.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-07', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-07', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-07', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-08', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-08', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 319, '2025-12-08', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-08', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 304, '2025-12-09', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-09', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-09', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-10', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-10', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-10', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 312, '2025-12-10', 1,
    '17:00', '23:30', 0, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 304, '2025-12-11', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 310, '2025-12-11', 1,
    '15:00', '20:30', 0, 5.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-11', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 312, '2025-12-11', 1,
    '15:00', '20:30', 60, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 316, '2025-12-11', 1,
    '15:00', '20:30', 60, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 319, '2025-12-11', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 328, '2025-12-11', 1,
    '15:00', '20:30', 0, 5.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-12', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 319, '2025-12-12', 1,
    '11:00', '20:30', 60, 8.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-12', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-13', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-13', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-13', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-14', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-14', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-14', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 312, '2025-12-14', 1,
    '12:00', '23:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 304, '2025-12-15', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-15', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-15', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-16', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-16', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 319, '2025-12-16', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-17', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-17', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 312, '2025-12-17', 1,
    '17:00', '23:30', 0, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 319, '2025-12-17', 1,
    '17:00', '20:30', 0, 3.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-17', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 329, '2025-12-17', 1,
    '17:00', '20:30', 0, 3.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-18', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-18', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 312, '2025-12-18', 1,
    '17:00', '23:30', 0, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 319, '2025-12-18', 1,
    '11:00', '20:30', 60, 8.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-19', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-19', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-19', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-20', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-20', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 312, '2025-12-20', 1,
    '17:00', '23:30', 0, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-20', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-21', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-21', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 312, '2025-12-21', 1,
    '11:00', '23:30', 60, 11.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 319, '2025-12-21', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-21', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 304, '2025-12-22', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-22', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-22', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-23', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-23', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-23', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 312, '2025-12-23', 1,
    '17:30', '23:30', 0, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-24', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-24', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-24', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 304, '2025-12-25', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-25', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-25', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-26', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-26', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 310, '2025-12-26', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-26', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-27', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-27', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 312, '2025-12-27', 1,
    '12:00', '23:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 319, '2025-12-27', 1,
    '17:00', '20:30', 0, 3.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-27', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-28', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-28', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 319, '2025-12-28', 1,
    '17:00', '20:30', 0, 3.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-28', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-29', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-29', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 319, '2025-12-29', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 307, '2025-12-30', 1,
    '11:00', '20:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-30', 1,
    '08:00', '17:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 319, '2025-12-30', 1,
    '09:00', '20:30', 60, 10.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-30', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 308, '2025-12-31', 1,
    '09:00', '18:30', 60, 8.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 311, '2025-12-31', 1,
    '08:00', '18:00', 60, 9.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 6, 203, 322, '2025-12-31', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- SHIBUYA 2025年12月
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-01', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 319, '2025-12-02', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-02', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-03', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-04', 1,
    '14:00', '23:30', 60, 8.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-05', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-06', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-07', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-08', 1,
    '17:00', '23:30', 0, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-09', 1,
    '17:00', '23:30', 0, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-09', 1,
    '17:00', '23:30', 60, 5.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 319, '2025-12-10', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-10', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-11', 1,
    '17:00', '23:30', 0, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-12', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-13', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-14', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-14', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-15', 1,
    '15:00', '23:30', 60, 7.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-16', 1,
    '17:00', '23:30', 0, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 319, '2025-12-17', 1,
    '09:00', '15:00', 0, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-17', 1,
    '09:00', '15:00', 0, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-18', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-19', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-20', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-21', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-22', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 319, '2025-12-23', 1,
    '17:00', '23:30', 0, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-23', 1,
    '17:00', '23:30', 0, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-24', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-25', 1,
    '17:00', '23:30', 0, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-26', 1,
    '17:00', '23:30', 0, 6.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 326, '2025-12-27', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-28', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-29', 1,
    '17:00', '23:00', 0, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 204, 329, '2025-12-30', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- SHIBUYA 2026年1月
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 205, 329, '2026-01-03', 1,
    '09:00', '21:00', 60, 11.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 205, 326, '2026-01-04', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 205, 329, '2026-01-05', 1,
    '17:00', '23:30', 60, 5.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Stand Banh Mi 2025年12月
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-01', 1,
    '16:00', '23:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-01', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-01', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-01', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-01', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 305, '2025-12-03', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 313, '2025-12-03', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-03', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-03', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-03', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 305, '2025-12-04', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 313, '2025-12-04', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-04', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-04', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-04', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-04', 1,
    '11:00', '22:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-05', 1,
    '11:00', '23:00', 60, 11.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-05', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 321, '2025-12-05', 1,
    '18:00', '22:00', 0, 4.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-05', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-05', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 306, '2025-12-06', 1,
    '10:30', '15:30', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-06', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-06', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-06', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-06', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 305, '2025-12-07', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 313, '2025-12-07', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-07', 1,
    '16:00', '23:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-07', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-07', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 305, '2025-12-08', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-08', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-08', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-08', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-08', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 313, '2025-12-10', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-10', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-10', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 321, '2025-12-10', 1,
    '18:00', '23:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-10', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 306, '2025-12-11', 1,
    '10:30', '15:30', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 313, '2025-12-11', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-11', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-11', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-11', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-11', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 305, '2025-12-12', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-12', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-12', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-12', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-12', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-13', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-13', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-13', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-13', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 305, '2025-12-14', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-14', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-14', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-14', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-14', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 305, '2025-12-15', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-15', 1,
    '16:00', '23:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-15', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-15', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-15', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-15', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 313, '2025-12-17', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-17', 1,
    '16:00', '23:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-17', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-17', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-17', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-18', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-18', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-18', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-18', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 305, '2025-12-19', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-19', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-19', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 321, '2025-12-19', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-19', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-19', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 306, '2025-12-20', 1,
    '10:30', '15:30', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 313, '2025-12-20', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-20', 1,
    '16:00', '23:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-20', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-20', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-20', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-21', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-21', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 321, '2025-12-21', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-21', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-21', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 305, '2025-12-22', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-22', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-22', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-22', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 313, '2025-12-24', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-24', 1,
    '11:00', '23:00', 60, 11.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-24', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-24', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 306, '2025-12-25', 1,
    '10:30', '15:30', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 313, '2025-12-25', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-25', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-25', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-25', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-25', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-26', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-26', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-26', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-26', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 313, '2025-12-27', 1,
    '09:00', '16:00', 60, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-27', 1,
    '11:00', '23:00', 60, 11.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-27', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-27', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-27', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 306, '2025-12-28', 1,
    '10:30', '15:30', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-28', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-28', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 325, '2025-12-28', 1,
    '11:00', '16:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 330, '2025-12-28', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-28', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 305, '2025-12-29', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 314, '2025-12-29', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 317, '2025-12-29', 1,
    '16:00', '27:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 8, 206, 332, '2025-12-29', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Stand Bo Bun 2025年12月
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 309, '2025-12-01', 1,
    '09:00', '13:30', 0, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-01', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 309, '2025-12-02', 1,
    '09:00', '13:30', 0, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-02', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 328, '2025-12-02', 1,
    '17:30', '23:30', 0, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-03', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 328, '2025-12-03', 1,
    '09:00', '15:00', 0, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 312, '2025-12-05', 1,
    '19:00', '22:00', 0, 3.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 315, '2025-12-05', 1,
    '19:00', '22:00', 0, 3.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 316, '2025-12-05', 1,
    '19:00', '22:00', 0, 3.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-05', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-06', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 313, '2025-12-07', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-07', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 332, '2025-12-07', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 309, '2025-12-08', 1,
    '09:00', '13:30', 0, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-08', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 309, '2025-12-10', 1,
    '09:00', '13:30', 0, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-10', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 309, '2025-12-12', 1,
    '09:00', '13:30', 0, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-12', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 312, '2025-12-13', 1,
    '17:00', '22:00', 0, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 315, '2025-12-13', 1,
    '17:00', '22:00', 60, 4.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-13', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 313, '2025-12-14', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-14', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 332, '2025-12-14', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 309, '2025-12-15', 1,
    '09:00', '13:30', 0, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-15', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 309, '2025-12-17', 1,
    '09:00', '13:30', 0, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-17', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 313, '2025-12-18', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-18', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 332, '2025-12-18', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 309, '2025-12-19', 1,
    '09:00', '13:30', 0, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-19', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-20', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 323, '2025-12-20', 1,
    '16:00', '23:00', 0, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 313, '2025-12-21', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-21', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 323, '2025-12-21', 1,
    '11:00', '23:00', 60, 11.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 332, '2025-12-21', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 309, '2025-12-22', 1,
    '09:00', '13:30', 0, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-22', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 309, '2025-12-23', 1,
    '09:00', '13:30', 0, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-23', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 328, '2025-12-23', 1,
    '17:30', '23:30', 0, 6.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 309, '2025-12-24', 1,
    '09:00', '13:30', 0, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-24', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 313, '2025-12-27', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-27', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 332, '2025-12-27', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 312, '2025-12-28', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 313, '2025-12-28', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 315, '2025-12-28', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 316, '2025-12-28', 1,
    '09:00', '22:00', 60, 12.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-28', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 323, '2025-12-28', 1,
    '11:00', '23:00', 60, 11.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 309, '2025-12-29', 1,
    '09:00', '13:30', 0, 4.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 9, 207, 318, '2025-12-29', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Stand Pho You 2025年12月
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-04', 1,
    '09:00', '14:00', 60, 4.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-08', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-09', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-11', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-14', 1,
    '12:00', '23:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-15', 1,
    '09:00', '15:00', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-16', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-18', 1,
    '17:00', '23:30', 60, 5.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-20', 1,
    '17:00', '23:30', 60, 5.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-21', 1,
    '11:00', '23:30', 60, 11.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-23', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-25', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-26', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-27', 1,
    '12:00', '23:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 208, 315, '2025-12-29', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Stand Pho You 2026年1月
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 10, 209, 315, '2026-01-05', 1,
    '09:00', '17:00', 60, 7.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Tipsy Tiger 2025年12月
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-01', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-01', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-02', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-03', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-03', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-04', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-05', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-06', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-06', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-07', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-08', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-08', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-09', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-09', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-10', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-10', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-11', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-12', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-13', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-13', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-14', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-14', 1,
    '12:00', '23:00', 60, 10.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-15', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-15', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-16', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-16', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-17', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-17', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-18', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-18', 1,
    '17:00', '23:30', 60, 5.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-19', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-20', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-20', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-21', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-21', 1,
    '11:00', '23:30', 60, 11.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-22', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-22', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-23', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-24', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-24', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-25', 1,
    '09:00', '23:00', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-26', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-27', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 316, '2025-12-27', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-28', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-29', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 210, 301, '2025-12-30', 1,
    '09:00', '23:30', 60, 13.5,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Tipsy Tiger 2026年1月
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 211, 301, '2026-01-03', 1,
    '09:00', '21:00', 60, 11.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 211, 301, '2026-01-04', 1,
    '17:30', '23:30', 60, 5.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 211, 316, '2026-01-04', 1,
    '09:00', '18:00', 60, 8.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
INSERT INTO ops.shifts (
    tenant_id, store_id, plan_id, staff_id, shift_date, pattern_id,
    start_time, end_time, break_minutes, total_hours,
    shift_type, status, created_at, updated_at
) VALUES (
    3, 11, 211, 301, '2026-01-05', 1,
    '09:30', '23:30', 60, 13.0,
    'REGULAR', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
