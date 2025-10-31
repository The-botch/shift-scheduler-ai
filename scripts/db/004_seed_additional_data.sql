-- ============================================
-- 追加テーブル用初期データ投入スクリプト
-- ============================================

-- ============================================
-- 1. 通勤手当マスタ
-- ============================================
INSERT INTO commute_allowance (distance_from_km, distance_to_km, allowance_amount, description, is_active) VALUES
(0, 2, 0, '2km未満（支給なし）', TRUE),
(2, 5, 4000, '2km以上5km未満', TRUE),
(5, 10, 6000, '5km以上10km未満', TRUE),
(10, 15, 8000, '10km以上15km未満', TRUE),
(15, 20, 10000, '15km以上20km未満', TRUE),
(20, 30, 12000, '20km以上30km未満', TRUE),
(30, 999, 15000, '30km以上', TRUE);

-- ============================================
-- 2. 保険料率マスタ
-- ============================================
INSERT INTO insurance_rates (
    insurance_type, insurance_name, employee_rate, employer_rate,
    salary_lower_limit, salary_upper_limit, effective_from, effective_to, description, is_active
) VALUES
-- 健康保険
('health', '協会けんぽ（東京）', 0.0498, 0.0498, NULL, NULL, '2024-04-01', NULL, '健康保険料率（令和6年度）', TRUE),

-- 厚生年金保険
('pension', '厚生年金保険', 0.0915, 0.0915, NULL, NULL, '2024-04-01', NULL, '厚生年金保険料率（令和6年度）', TRUE),

-- 雇用保険
('employment', '雇用保険（一般）', 0.006, 0.0095, NULL, NULL, '2024-04-01', NULL, '雇用保険料率（令和6年度）', TRUE),

-- 労災保険
('workers_comp', '労災保険（飲食業）', 0.0, 0.003, NULL, NULL, '2024-04-01', NULL, '労災保険料率（事業主全額負担）', TRUE);

-- ============================================
-- 3. 税率マスタ
-- ============================================
INSERT INTO tax_brackets (
    tax_type, income_from, income_to, tax_rate, deduction_amount,
    effective_from, effective_to, description, is_active
) VALUES
-- 所得税
('income', 0, 1950000, 0.05, 0, '2024-01-01', NULL, '所得税5%', TRUE),
('income', 1950000, 3300000, 0.10, 97500, '2024-01-01', NULL, '所得税10%', TRUE),
('income', 3300000, 6950000, 0.20, 427500, '2024-01-01', NULL, '所得税20%', TRUE),
('income', 6950000, 9000000, 0.23, 636000, '2024-01-01', NULL, '所得税23%', TRUE),
('income', 9000000, 18000000, 0.33, 1536000, '2024-01-01', NULL, '所得税33%', TRUE),
('income', 18000000, 40000000, 0.40, 2796000, '2024-01-01', NULL, '所得税40%', TRUE),
('income', 40000000, NULL, 0.45, 4796000, '2024-01-01', NULL, '所得税45%', TRUE),

-- 住民税（標準税率）
('resident', 0, NULL, 0.10, 0, '2024-01-01', NULL, '住民税10%（一律）', TRUE);

-- ============================================
-- 4. 安全衛生チェックリストマスタ
-- ============================================
INSERT INTO safety_checklist_master (
    checklist_code, checklist_type, category, item_name, item_description,
    check_frequency, is_mandatory, display_order, is_active
) VALUES
-- 日次チェック（食品衛生）
('HYGIENE_DAILY_001', 'HYGIENE', '食品衛生', '冷蔵庫・冷凍庫の温度チェック', '冷蔵庫: 10℃以下、冷凍庫: -18℃以下', 'DAILY', TRUE, 1, TRUE),
('HYGIENE_DAILY_002', 'HYGIENE', '食品衛生', '食材の賞味期限チェック', '期限切れ食材の有無確認', 'DAILY', TRUE, 2, TRUE),
('HYGIENE_DAILY_003', 'HYGIENE', '清掃', '調理場の清掃状態', '床・壁・調理台の清掃確認', 'DAILY', TRUE, 3, TRUE),
('HYGIENE_DAILY_004', 'HYGIENE', '清掃', 'トイレの清掃状態', 'トイレの清掃・消毒確認', 'DAILY', TRUE, 4, TRUE),

-- 日次チェック（安全）
('SAFETY_DAILY_001', 'SAFETY', '設備点検', '火気設備の点検', 'ガスコンロ・オーブン等の異常確認', 'DAILY', TRUE, 5, TRUE),
('SAFETY_DAILY_002', 'SAFETY', '設備点検', '消火器の配置確認', '消火器の位置・状態確認', 'DAILY', TRUE, 6, TRUE),
('SAFETY_DAILY_003', 'SAFETY', '環境', '非常口の確保', '非常口前の障害物確認', 'DAILY', TRUE, 7, TRUE),

-- 週次チェック
('HYGIENE_WEEKLY_001', 'HYGIENE', '食品衛生', '冷蔵庫内の整理整頓', '期限切れ食材の廃棄・整理', 'WEEKLY', TRUE, 8, TRUE),
('SAFETY_WEEKLY_001', 'SAFETY', '設備点検', '電気設備の点検', 'コード類・コンセントの損傷確認', 'WEEKLY', TRUE, 9, TRUE),

-- 月次チェック
('HEALTH_MONTHLY_001', 'HEALTH', 'スタッフ健康', 'スタッフ健康チェック', '体調不良者の有無確認', 'MONTHLY', TRUE, 10, TRUE),
('SAFETY_MONTHLY_001', 'SAFETY', '設備点検', '避難経路の確認', '避難経路の障害物・照明確認', 'MONTHLY', TRUE, 11, TRUE),
('EQUIPMENT_MONTHLY_001', 'EQUIPMENT', '機器メンテ', '厨房機器の定期点検', '冷蔵庫・オーブン等の動作確認', 'MONTHLY', TRUE, 12, TRUE);

-- ============================================
-- 5. 気象履歴（サンプルデータ - 2024年10月）
-- ============================================
INSERT INTO weather_history (
    store_id, weather_date, weather_condition, weather_code,
    temperature_high, temperature_low, temperature_avg,
    humidity, precipitation_mm, is_holiday, is_active
) VALUES
(1, '2024-10-01', '晴れ', 'CLEAR', 24.5, 18.2, 21.3, 55, 0, FALSE, TRUE),
(1, '2024-10-02', '晴れ', 'CLEAR', 25.1, 19.0, 22.0, 58, 0, FALSE, TRUE),
(1, '2024-10-03', '曇り', 'CLOUDY', 22.8, 17.5, 20.1, 62, 0, FALSE, TRUE),
(1, '2024-10-04', '雨', 'RAIN', 20.5, 16.8, 18.6, 75, 12.5, FALSE, TRUE),
(1, '2024-10-05', '曇り', 'CLOUDY', 21.3, 17.2, 19.2, 68, 0, FALSE, TRUE),
(1, '2024-10-06', '晴れ', 'CLEAR', 23.5, 18.5, 21.0, 60, 0, FALSE, TRUE),
(1, '2024-10-07', '晴れ', 'CLEAR', 24.2, 19.1, 21.6, 57, 0, FALSE, TRUE),
(1, '2024-10-08', '晴れ', 'CLEAR', 25.0, 19.5, 22.2, 55, 0, FALSE, TRUE),
(1, '2024-10-09', '曇り', 'CLOUDY', 22.5, 18.0, 20.2, 65, 0, FALSE, TRUE),
(1, '2024-10-10', '晴れ', 'CLEAR', 23.8, 18.8, 21.3, 58, 0, FALSE, TRUE);

-- ============================================
-- 6. ダッシュボードメトリクス（サンプルデータ）
-- ============================================
INSERT INTO dashboard_metrics (
    store_id, metric_date, metric_type, metric_name, metric_value, metric_unit,
    comparison_period, comparison_value, change_rate, is_active
) VALUES
-- 2024年10月の日次メトリクス（サンプル）
(1, '2024-10-01', 'SALES', '日次売上', 152000, 'JPY', 'DAILY', 145000, 0.0483, TRUE),
(1, '2024-10-01', 'LABOR_COST', '日次人件費', 47727, 'JPY', 'DAILY', 45000, 0.0606, TRUE),
(1, '2024-10-01', 'PROFIT', '日次利益', 104273, 'JPY', 'DAILY', 100000, 0.0427, TRUE),
(1, '2024-10-01', 'CUSTOMER', '来客数', 85, 'count', 'DAILY', 80, 0.0625, TRUE),
(1, '2024-10-01', 'EFFICIENCY', '客単価', 1788, 'JPY', 'DAILY', 1813, -0.0138, TRUE);

-- ============================================
-- 7. スタッフ月次パフォーマンス（サンプルデータ - 2024年10月）
-- ============================================
INSERT INTO staff_monthly_performance (
    staff_id, performance_year, performance_month,
    shift_count, total_work_hours, total_labor_cost, avg_work_hours,
    late_count, absent_count, overtime_hours, attendance_rate,
    performance_score, skills_used, is_active
) VALUES
-- 田中太郎（店長）
(1, 2024, 10, 31, 341.0, 493179, 11.0, 0, 0, 0, 100.0, 95.0, '["MANAGEMENT", "CASHIER", "COOKING", "CUSTOMER"]', TRUE),

-- 佐藤花子（リーダー）
(2, 2024, 10, 27, 189.0, 343629, 7.0, 0, 0, 0, 100.0, 92.0, '["CASHIER", "COOKING", "CUSTOMER"]', TRUE),

-- 鈴木次郎（アルバイト）
(3, 2024, 10, 23, 161.0, 261364, 7.0, 0, 0, 0, 100.0, 88.0, '["COOKING"]', TRUE),

-- 山田美咲（アルバイト）
(4, 2024, 10, 15, 63.0, 69000, 4.2, 1, 0, 0, 93.3, 85.0, '["CUSTOMER"]', TRUE),

-- 高橋健太（アルバイト）
(5, 2024, 10, 18, 76.0, 83100, 4.2, 0, 0, 0, 100.0, 87.0, '["CUSTOMER"]', TRUE),

-- 伊藤さくら（アルバイト）
(6, 2024, 10, 19, 136.0, 159600, 7.2, 0, 0, 0, 100.0, 90.0, '["CASHIER", "CUSTOMER"]', TRUE),

-- 渡辺翔（アルバイト）
(7, 2024, 10, 8, 32.0, 30400, 4.0, 0, 0, 0, 100.0, 80.0, '["CUSTOMER"]', TRUE),

-- 中村陽子（アルバイト）
(8, 2024, 10, 16, 80.0, 96000, 5.0, 0, 0, 0, 100.0, 89.0, '["CASHIER", "CUSTOMER"]', TRUE),

-- 小林大輔（主任）
(9, 2024, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, '[]', TRUE),

-- 加藤真由美（アルバイト）
(10, 2024, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, '[]', TRUE);

-- ============================================
-- 8. シフト月次サマリー（サンプルデータ - 2024年10月）
-- ============================================
-- 注: plan_idは既存のshift_plansテーブルに依存
-- 実際のデータ投入時にはshift_plansが先に存在している必要がある

-- サンプル: 2024年10月のシフト計画が存在する場合
-- INSERT INTO shift_monthly_summary (
--     plan_id, store_id, summary_year, summary_month,
--     total_shifts, total_staff_count, total_work_hours, total_labor_cost,
--     avg_hours_per_shift, avg_staff_per_day, max_staff_per_day, min_staff_per_day,
--     labor_law_violations, preference_match_rate, issues_count, resolved_issues_count,
--     is_active
-- ) VALUES
-- (1, 1, 2024, 10, 140, 8, 1078.0, 1536272, 7.7, 4.5, 5, 3, 0, 85.5, 3, 3, TRUE);

-- ============================================
-- 完了メッセージ
-- ============================================
SELECT '✅ 追加テーブル用初期データの投入が完了しました' AS status;
SELECT '📊 投入データ: 通勤手当7件、保険料率4件、税率8件、安全衛生12件、気象10件、メトリクス5件、パフォーマンス10件' AS info;
