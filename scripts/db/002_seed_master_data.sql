-- ============================================
-- マスターデータ初期投入スクリプト
-- ============================================

-- ============================================
-- 1. 店舗マスタ
-- ============================================
INSERT INTO stores (store_code, store_name, address, phone_number, business_hours_start, business_hours_end, is_active) VALUES
('STORE001', 'カフェ・ドゥ・渋谷', '東京都渋谷区道玄坂1-2-3', '03-1234-5678', '09:00', '22:00', TRUE);

-- ============================================
-- 2. 役職マスタ
-- ============================================
INSERT INTO roles (role_code, role_name, display_order, is_active) VALUES
('MANAGER', '店長', 1, TRUE),
('LEADER', 'リーダー', 2, TRUE),
('SUB_LEADER', '主任', 3, TRUE),
('STAFF', '一般スタッフ', 4, TRUE);

-- ============================================
-- 3. スキルマスタ
-- ============================================
INSERT INTO skills (skill_code, skill_name, category, description, display_order, is_active) VALUES
('MANAGEMENT', '店舗運営管理', 'マネジメント', '店舗の運営・管理全般', 1, TRUE),
('CASHIER', 'レジ業務', 'フロント', 'レジ操作・会計処理', 2, TRUE),
('COOKING', '調理', 'キッチン', '料理の調理', 3, TRUE),
('CUSTOMER', '接客', 'フロント', '顧客対応・接客', 4, TRUE),
('CLEANING', '清掃', 'その他', '店舗清掃', 5, TRUE),
('INVENTORY', '在庫管理', 'バックオフィス', '在庫チェック・発注', 6, TRUE);

-- ============================================
-- 4. 資格マスタ
-- ============================================
INSERT INTO certifications (certification_code, certification_name, issuing_organization, validity_period_months, is_active) VALUES
('FOOD_HYGIENE', '食品衛生責任者', '各都道府県食品衛生協会', NULL, TRUE),
('FIRE_SAFETY', '防火管理者', '各都道府県消防本部', NULL, TRUE),
('BARISTA_BASIC', 'バリスタ基礎資格', '日本バリスタ協会', 36, TRUE),
('BARISTA_PRO', 'バリスタプロフェッショナル', '日本バリスタ協会', 36, TRUE);

-- ============================================
-- 5. シフトパターンマスタ
-- ============================================
INSERT INTO shift_patterns (pattern_code, pattern_name, start_time, end_time, break_minutes, total_hours, is_active) VALUES
('FULL_DAY', '通常勤務', '09:00', '17:00', 60, 7.0, TRUE),
('AFTERNOON', '午後シフト', '13:00', '21:00', 60, 7.0, TRUE),
('EVENING', '夕方シフト', '17:00', '22:00', 0, 5.0, TRUE),
('MORNING', '午前シフト', '09:00', '13:00', 0, 4.0, TRUE),
('SHORT', '短時間シフト', '14:00', '18:00', 0, 4.0, TRUE),
('MANAGER', '店長シフト', '09:00', '22:00', 120, 11.0, TRUE);

-- ============================================
-- 6. スタッフマスタ
-- ============================================
INSERT INTO staff (
    store_id, staff_code, name, name_kana, role_id, email, phone_number,
    hire_date, birth_date, employment_type, hourly_rate, monthly_salary,
    contract_fee, daily_cost, max_hours_per_week, min_hours_per_week,
    max_consecutive_days, skill_level, commute_distance_km, has_social_insurance, is_active
) VALUES
-- 店長・リーダー（月給）
(1, 'S001', '田中太郎', 'タナカタロウ', 2, 'tanaka@example.com', '080-1111-1111',
 '2020-04-01', '1985-03-15', 'monthly', NULL, 350000, NULL, 15909, 40, 40, 6, 5, 12, TRUE, TRUE),

(1, 'S002', '佐藤花子', 'サトウハナコ', 2, 'sato@example.com', '080-2222-2222',
 '2021-06-01', '1990-07-20', 'monthly', NULL, 280000, NULL, 12727, 40, 32, 6, 5, 8, TRUE, TRUE),

(1, 'S009', '小林大輔', 'コバヤシダイスケ', 3, 'kobayashi@example.com', '080-9999-9999',
 '2019-04-01', '1987-06-10', 'monthly', NULL, 320000, NULL, 14545, 40, 40, 6, 5, 18, TRUE, TRUE),

-- アルバイト（時給）
(1, 'S003', '鈴木次郎', 'スズキジロウ', 4, 'suzuki-j@example.com', '080-3333-3333',
 '2022-01-15', '1988-11-10', 'hourly', 1100, NULL, NULL, 0, 40, 20, 6, 4, 5, FALSE, TRUE),

(1, 'S004', '山田美咲', 'ヤマダミサキ', 4, 'yamada@example.com', '080-4444-4444',
 '2023-04-01', '2005-09-05', 'hourly', 1000, NULL, NULL, 0, 28, 12, 5, 3, 3, FALSE, TRUE),

(1, 'S005', '高橋健太', 'タカハシケンタ', 4, 'takahashi@example.com', '080-5555-5555',
 '2023-09-01', '2004-02-14', 'hourly', 1000, NULL, NULL, 0, 28, 12, 4, 3, 7, FALSE, TRUE),

(1, 'S006', '伊藤さくら', 'イトウサクラ', 4, 'ito@example.com', '080-6666-6666',
 '2024-01-10', '1999-12-01', 'hourly', 1100, NULL, NULL, 0, 40, 20, 5, 4, 15, FALSE, TRUE),

(1, 'S007', '渡辺翔', 'ワタナベショウ', 4, 'watanabe@example.com', '080-7777-7777',
 '2024-03-01', '2006-05-20', 'hourly', 950, NULL, NULL, 0, 20, 10, 4, 2, 20, FALSE, TRUE),

(1, 'S008', '中村陽子', 'ナカムラヨウコ', 4, 'nakamura@example.com', '080-8888-8888',
 '2023-02-01', '1992-08-15', 'hourly', 1200, NULL, NULL, 0, 35, 20, 5, 4, 6, FALSE, TRUE),

(1, 'S010', '加藤真由美', 'カトウマユミ', 4, 'kato@example.com', '080-0000-0000',
 '2023-05-15', '1995-03-25', 'hourly', 1100, NULL, NULL, 0, 35, 20, 5, 4, 10, FALSE, TRUE);

-- ============================================
-- 7. スタッフスキル中間テーブル
-- ============================================
INSERT INTO staff_skills (staff_id, skill_id, proficiency_level, acquired_date, is_active) VALUES
-- 田中太郎（店長）
(1, 1, 5, '2020-04-01', TRUE), -- MANAGEMENT
(1, 2, 5, '2020-04-01', TRUE), -- CASHIER
(1, 3, 4, '2020-04-01', TRUE), -- COOKING
(1, 4, 5, '2020-04-01', TRUE), -- CUSTOMER
(1, 6, 5, '2020-04-01', TRUE), -- INVENTORY

-- 佐藤花子（リーダー）
(2, 2, 5, '2021-06-01', TRUE), -- CASHIER
(2, 3, 4, '2021-06-01', TRUE), -- COOKING
(2, 4, 5, '2021-06-01', TRUE), -- CUSTOMER

-- 小林大輔（主任）
(3, 1, 4, '2019-04-01', TRUE), -- MANAGEMENT
(3, 2, 5, '2019-04-01', TRUE), -- CASHIER
(3, 4, 5, '2019-04-01', TRUE), -- CUSTOMER
(3, 6, 4, '2019-04-01', TRUE), -- INVENTORY

-- 鈴木次郎
(4, 3, 4, '2022-01-15', TRUE), -- COOKING

-- 山田美咲
(5, 4, 3, '2023-04-01', TRUE), -- CUSTOMER

-- 高橋健太
(6, 4, 3, '2023-09-01', TRUE), -- CUSTOMER

-- 伊藤さくら
(7, 2, 4, '2024-01-10', TRUE), -- CASHIER
(7, 4, 4, '2024-01-10', TRUE), -- CUSTOMER

-- 渡辺翔
(8, 4, 2, '2024-03-01', TRUE), -- CUSTOMER

-- 中村陽子
(9, 2, 4, '2023-02-01', TRUE), -- CASHIER
(9, 4, 4, '2023-02-01', TRUE), -- CUSTOMER

-- 加藤真由美
(10, 2, 4, '2023-05-15', TRUE), -- CASHIER
(10, 4, 4, '2023-05-15', TRUE); -- CUSTOMER

-- ============================================
-- 8. スタッフ資格
-- ============================================
INSERT INTO staff_certifications (staff_id, certification_id, acquisition_date, expiration_date, certification_number, is_active) VALUES
(1, 1, '2020-04-01', NULL, 'FH-2020-001', TRUE), -- 田中太郎 食品衛生責任者
(1, 2, '2020-05-01', NULL, 'FM-2020-001', TRUE), -- 田中太郎 防火管理者
(1, 4, '2021-03-01', '2024-03-01', 'BP-2021-001', TRUE), -- 田中太郎 バリスタプロ
(2, 1, '2021-06-01', NULL, 'FH-2021-002', TRUE), -- 佐藤花子 食品衛生責任者
(3, 1, '2019-04-01', NULL, 'FH-2019-003', TRUE); -- 小林大輔 食品衛生責任者

-- ============================================
-- 9. 労働基準法制約マスタ
-- ============================================
INSERT INTO labor_law_constraints (constraint_code, constraint_name, constraint_type, value, description, is_active) VALUES
('MAX_WORK_HOURS_DAY', '1日の最大労働時間', 'DAILY', '{"max_hours": 8, "max_hours_with_overtime": 12}', '1日8時間、残業を含めて最大12時間', TRUE),
('MAX_WORK_HOURS_WEEK', '週の最大労働時間', 'WEEKLY', '{"max_hours": 40, "max_hours_with_overtime": 60}', '週40時間、残業を含めて最大60時間', TRUE),
('MIN_REST_HOURS', '最小休憩時間', 'DAILY', '{"hours_6_8": 45, "hours_8_plus": 60}', '6-8時間勤務: 45分、8時間超: 60分', TRUE),
('MAX_CONSECUTIVE_DAYS', '最大連続勤務日数', 'WEEKLY', '{"max_days": 6}', '最大6日連続勤務', TRUE),
('MIN_REST_BETWEEN_SHIFTS', 'シフト間最小休息時間', 'DAILY', '{"min_hours": 11}', 'シフト間に最低11時間の休息', TRUE);

-- ============================================
-- 10. 店舗制約マスタ
-- ============================================
INSERT INTO store_constraints (store_id, constraint_type, constraint_value, priority, is_active) VALUES
(1, 'CLOSED_DAY', '{"day_of_week": "Monday"}', 1, TRUE), -- 月曜定休
(1, 'MIN_STAFF_PER_SHIFT', '{"min_count": 3}', 2, TRUE), -- シフトごとに最低3名
(1, 'REQUIRED_SKILL_MIX', '{"skills": ["CASHIER", "COOKING", "CUSTOMER"]}', 3, TRUE), -- 必須スキル構成
(1, 'PEAK_HOURS', '{"hours": ["12:00-14:00", "18:00-20:00"], "min_staff": 4}', 4, TRUE); -- ピーク時最低4名

-- ============================================
-- 11. シフト検証ルールマスタ
-- ============================================
INSERT INTO shift_validation_rules (rule_code, rule_name, rule_type, severity, validation_logic, error_message, is_active) VALUES
('RULE_MAX_HOURS_DAY', '1日最大労働時間チェック', 'LABOR_LAW', 'ERROR',
 '{"condition": "total_hours <= 12"}', '1日の労働時間が12時間を超えています', TRUE),

('RULE_MAX_HOURS_WEEK', '週最大労働時間チェック', 'LABOR_LAW', 'ERROR',
 '{"condition": "weekly_hours <= 60"}', '週の労働時間が60時間を超えています', TRUE),

('RULE_MIN_REST', '休憩時間チェック', 'LABOR_LAW', 'ERROR',
 '{"condition": "break_minutes >= required_break"}', '休憩時間が不足しています', TRUE),

('RULE_CONSECUTIVE_DAYS', '連続勤務日数チェック', 'LABOR_LAW', 'WARNING',
 '{"condition": "consecutive_days <= 6"}', '6日以上の連続勤務です', TRUE),

('RULE_REST_BETWEEN_SHIFTS', 'シフト間休息チェック', 'LABOR_LAW', 'WARNING',
 '{"condition": "hours_between_shifts >= 11"}', 'シフト間の休息時間が11時間未満です', TRUE),

('RULE_SKILL_MATCH', 'スキル適合性チェック', 'SKILL', 'ERROR',
 '{"condition": "has_required_skills"}', '必要なスキルを持っていません', TRUE),

('RULE_MIN_STAFF_COUNT', '最低スタッフ数チェック', 'STORE', 'ERROR',
 '{"condition": "staff_count >= min_required"}', 'スタッフ数が最低人数を下回っています', TRUE);

-- ============================================
-- 完了メッセージ
-- ============================================
SELECT '✅ マスターデータの投入が完了しました' AS status;
