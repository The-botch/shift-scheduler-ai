-- ============================================================================
-- opsスキーマのマスターデータ
-- Tenant ID = 3 (Stand Banh Mi)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. 労働法制約マスター登録
-- ----------------------------------------------------------------------------
-- 週の法定労働時間上限
INSERT INTO ops.labor_law_constraints (
  tenant_id, constraint_code, constraint_name, value, unit, description,
  law_code, law_name, category, constraint_rule, penalty_level, legal_reference, is_active
)
VALUES (
  3, 'WEEKLY_MAX_HOURS', '週の法定労働時間上限', 40, 'hours',
  '労働基準法第32条:1週間の労働時間は40時間を超えてはならない',
  'LSA_32', '労働基準法第32条', '労働時間',
  '1週間の労働時間が40時間を超えないこと',
  'HIGH', '6ヶ月以下の懲役又は30万円以下の罰金', true
)
ON CONFLICT DO NOTHING;

-- 1日の法定労働時間上限
INSERT INTO ops.labor_law_constraints (
  tenant_id, constraint_code, constraint_name, value, unit, description,
  law_code, law_name, category, constraint_rule, penalty_level, legal_reference, is_active
)
VALUES (
  3, 'DAILY_MAX_HOURS', '1日の法定労働時間上限', 8, 'hours',
  '労働基準法第32条:1日の労働時間は8時間を超えてはならない',
  'LSA_32', '労働基準法第32条', '労働時間',
  '1日の労働時間が8時間を超えないこと(36協定がない場合)',
  'HIGH', '6ヶ月以下の懲役又は30万円以下の罰金', true
)
ON CONFLICT DO NOTHING;

-- 継続勤務の最低休息時間
INSERT INTO ops.labor_law_constraints (
  tenant_id, constraint_code, constraint_name, value, unit, description,
  law_code, law_name, category, constraint_rule, penalty_level, legal_reference, is_active
)
VALUES (
  3, 'CONTINUOUS_REST_MIN', '継続勤務の最低休息時間', 11, 'hours',
  '勤務間インターバル制度:次の勤務まで11時間以上の休息を確保',
  'GUIDELINE', '労働時間等設定改善指針', '休息時間',
  '勤務終了から次の勤務開始まで11時間以上の休息時間を確保すること',
  'MEDIUM', '努力義務', true
)
ON CONFLICT DO NOTHING;

-- 週の最低休日数
INSERT INTO ops.labor_law_constraints (
  tenant_id, constraint_code, constraint_name, value, unit, description,
  law_code, law_name, category, constraint_rule, penalty_level, legal_reference, is_active
)
VALUES (
  3, 'WEEKLY_REST_DAYS', '週の最低休日数', 1, 'days',
  '労働基準法第35条:毎週少なくとも1回の休日を与えなければならない',
  'LSA_35', '労働基準法第35条', '休日',
  '毎週少なくとも1日の休日を与えること',
  'HIGH', '6ヶ月以下の懲役又は30万円以下の罰金', true
)
ON CONFLICT DO NOTHING;

-- 月の時間外労働上限(36協定)
INSERT INTO ops.labor_law_constraints (
  tenant_id, constraint_code, constraint_name, value, unit, description,
  law_code, law_name, category, constraint_rule, penalty_level, legal_reference, is_active
)
VALUES (
  3, 'MONTHLY_OVERTIME_LIMIT', '月の時間外労働上限(36協定)', 45, 'hours',
  '36協定による時間外労働の上限(月45時間)',
  'LSA_36', '労働基準法第36条', '時間外労働',
  '時間外労働が月45時間を超えないこと',
  'HIGH', '6ヶ月以下の懲役又は30万円以下の罰金', true
)
ON CONFLICT DO NOTHING;

-- 6時間超勤務時の休憩時間
INSERT INTO ops.labor_law_constraints (
  tenant_id, constraint_code, constraint_name, value, unit, description,
  law_code, law_name, category, constraint_rule, penalty_level, legal_reference, is_active
)
VALUES (
  3, 'BREAK_TIME_6H', '6時間超勤務時の休憩時間', 45, 'minutes',
  '労働基準法第34条:6時間を超える場合は少なくとも45分の休憩',
  'LSA_34', '労働基準法第34条', '休憩時間',
  '労働時間が6時間を超える場合、少なくとも45分の休憩を与えること',
  'HIGH', '6ヶ月以下の懲役又は30万円以下の罰金', true
)
ON CONFLICT DO NOTHING;

-- 8時間超勤務時の休憩時間
INSERT INTO ops.labor_law_constraints (
  tenant_id, constraint_code, constraint_name, value, unit, description,
  law_code, law_name, category, constraint_rule, penalty_level, legal_reference, is_active
)
VALUES (
  3, 'BREAK_TIME_8H', '8時間超勤務時の休憩時間', 60, 'minutes',
  '労働基準法第34条:8時間を超える場合は少なくとも1時間の休憩',
  'LSA_34', '労働基準法第34条', '休憩時間',
  '労働時間が8時間を超える場合、少なくとも1時間の休憩を与えること',
  'HIGH', '6ヶ月以下の懲役又は30万円以下の罰金', true
)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. 労務管理ルールマスター登録
-- ----------------------------------------------------------------------------
-- 時間外労働アラート
INSERT INTO ops.labor_management_rules (
  tenant_id, rule_id, category, rule_type, description,
  threshold_value, unit, evaluation_period, action_type, priority, is_active
)
VALUES (
  3, 'OVERTIME_ALERT', 'WORK_HOURS', 'THRESHOLD_CHECK',
  '時間外労働が月40時間を超えた場合にアラート',
  40, 'hours', 'MONTHLY', 'ALERT', 'HIGH', true
)
ON CONFLICT DO NOTHING;

-- 連続勤務日数チェック
INSERT INTO ops.labor_management_rules (
  tenant_id, rule_id, category, rule_type, description,
  threshold_value, unit, evaluation_period, action_type, priority, is_active
)
VALUES (
  3, 'CONSECUTIVE_WORK_DAYS', 'WORK_PATTERN', 'SEQUENCE_CHECK',
  '連続勤務日数が6日を超えないようチェック',
  6, 'days', 'WEEKLY', 'WARNING', 'MEDIUM', true
)
ON CONFLICT DO NOTHING;

-- 最低必要人数チェック
INSERT INTO ops.labor_management_rules (
  tenant_id, rule_id, category, rule_type, description,
  threshold_value, unit, evaluation_period, action_type, priority, is_active
)
VALUES (
  3, 'MIN_STAFF_PER_SHIFT', 'STAFFING', 'COUNT_CHECK',
  'シフトごとの最低必要人数チェック',
  2, 'persons', 'SHIFT', 'ERROR', 'HIGH', true
)
ON CONFLICT DO NOTHING;

-- 深夜勤務制限
INSERT INTO ops.labor_management_rules (
  tenant_id, rule_id, category, rule_type, description,
  threshold_value, unit, evaluation_period, action_type, priority, is_active
)
VALUES (
  3, 'NIGHT_SHIFT_LIMIT', 'WORK_HOURS', 'THRESHOLD_CHECK',
  '深夜勤務(22:00-5:00)の月間回数制限',
  10, 'days', 'MONTHLY', 'WARNING', 'MEDIUM', true
)
ON CONFLICT DO NOTHING;

-- 月間総労働時間制限
INSERT INTO ops.labor_management_rules (
  tenant_id, rule_id, category, rule_type, description,
  threshold_value, unit, evaluation_period, action_type, priority, is_active
)
VALUES (
  3, 'MONTHLY_HOURS_LIMIT', 'WORK_HOURS', 'THRESHOLD_CHECK',
  '月間総労働時間の上限チェック(160時間)',
  160, 'hours', 'MONTHLY', 'ERROR', 'HIGH', true
)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. 店舗制約マスター登録
-- ----------------------------------------------------------------------------
-- COME 麻布台の営業時間制約
INSERT INTO ops.store_constraints (
  tenant_id, store_id, constraint_id, constraint_type, constraint_value, description, priority, is_active
)
SELECT
  3,
  store_id,
  'COME_OPEN_HOURS',
  'BUSINESS_HOURS',
  '{"start": "10:00", "end": "22:00"}',
  'COMEの営業時間: 10:00-22:00',
  'HIGH',
  true
FROM core.stores
WHERE tenant_id = 3 AND store_code = 'COME'
ON CONFLICT DO NOTHING;

-- COME 麻布台の最低必要人数
INSERT INTO ops.store_constraints (
  tenant_id, store_id, constraint_id, constraint_type, constraint_value, description, priority, is_active
)
SELECT
  3,
  store_id,
  'COME_MIN_STAFF',
  'MIN_STAFF_COUNT',
  '2',
  'COMEの最低必要人数: 2名',
  'HIGH',
  true
FROM core.stores
WHERE tenant_id = 3 AND store_code = 'COME'
ON CONFLICT DO NOTHING;

-- Atelierの営業時間制約
INSERT INTO ops.store_constraints (
  tenant_id, store_id, constraint_id, constraint_type, constraint_value, description, priority, is_active
)
SELECT
  3,
  store_id,
  'ATELIER_OPEN_HOURS',
  'BUSINESS_HOURS',
  '{"start": "10:00", "end": "22:00"}',
  'Atelierの営業時間: 10:00-22:00',
  'HIGH',
  true
FROM core.stores
WHERE tenant_id = 3 AND store_code = 'ATELIER'
ON CONFLICT DO NOTHING;

-- Atelierの最低必要人数
INSERT INTO ops.store_constraints (
  tenant_id, store_id, constraint_id, constraint_type, constraint_value, description, priority, is_active
)
SELECT
  3,
  store_id,
  'ATELIER_MIN_STAFF',
  'MIN_STAFF_COUNT',
  '2',
  'Atelierの最低必要人数: 2名',
  'HIGH',
  true
FROM core.stores
WHERE tenant_id = 3 AND store_code = 'ATELIER'
ON CONFLICT DO NOTHING;

-- SHIBUYAの営業時間制約
INSERT INTO ops.store_constraints (
  tenant_id, store_id, constraint_id, constraint_type, constraint_value, description, priority, is_active
)
SELECT
  3,
  store_id,
  'SHIBUYA_OPEN_HOURS',
  'BUSINESS_HOURS',
  '{"start": "10:00", "end": "22:00"}',
  'SHIBUYAの営業時間: 10:00-22:00',
  'HIGH',
  true
FROM core.stores
WHERE tenant_id = 3 AND store_code = 'SHIBUYA'
ON CONFLICT DO NOTHING;

-- SHIBUYAの最低必要人数
INSERT INTO ops.store_constraints (
  tenant_id, store_id, constraint_id, constraint_type, constraint_value, description, priority, is_active
)
SELECT
  3,
  store_id,
  'SHIBUYA_MIN_STAFF',
  'MIN_STAFF_COUNT',
  '2',
  'SHIBUYAの最低必要人数: 2名',
  'HIGH',
  true
FROM core.stores
WHERE tenant_id = 3 AND store_code = 'SHIBUYA'
ON CONFLICT DO NOTHING;

-- Stand Banh Miの営業時間制約
INSERT INTO ops.store_constraints (
  tenant_id, store_id, constraint_id, constraint_type, constraint_value, description, priority, is_active
)
SELECT
  3,
  store_id,
  'STAND_BANH_MI_OPEN_HOURS',
  'BUSINESS_HOURS',
  '{"start": "10:00", "end": "22:00"}',
  'Stand Banh Miの営業時間: 10:00-22:00',
  'HIGH',
  true
FROM core.stores
WHERE tenant_id = 3 AND store_code = 'STAND_BANH_MI'
ON CONFLICT DO NOTHING;

-- Stand Banh Miの最低必要人数
INSERT INTO ops.store_constraints (
  tenant_id, store_id, constraint_id, constraint_type, constraint_value, description, priority, is_active
)
SELECT
  3,
  store_id,
  'STAND_BANH_MI_MIN_STAFF',
  'MIN_STAFF_COUNT',
  '2',
  'Stand Banh Miの最低必要人数: 2名',
  'HIGH',
  true
FROM core.stores
WHERE tenant_id = 3 AND store_code = 'STAND_BANH_MI'
ON CONFLICT DO NOTHING;

-- Stand Bo Bunの営業時間制約
INSERT INTO ops.store_constraints (
  tenant_id, store_id, constraint_id, constraint_type, constraint_value, description, priority, is_active
)
SELECT
  3,
  store_id,
  'STAND_BO_BUN_OPEN_HOURS',
  'BUSINESS_HOURS',
  '{"start": "10:00", "end": "22:00"}',
  'Stand Bo Bunの営業時間: 10:00-22:00',
  'HIGH',
  true
FROM core.stores
WHERE tenant_id = 3 AND store_code = 'STAND_BO_BUN'
ON CONFLICT DO NOTHING;

-- Stand Bo Bunの最低必要人数
INSERT INTO ops.store_constraints (
  tenant_id, store_id, constraint_id, constraint_type, constraint_value, description, priority, is_active
)
SELECT
  3,
  store_id,
  'STAND_BO_BUN_MIN_STAFF',
  'MIN_STAFF_COUNT',
  '2',
  'Stand Bo Bunの最低必要人数: 2名',
  'HIGH',
  true
FROM core.stores
WHERE tenant_id = 3 AND store_code = 'STAND_BO_BUN'
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. シフト検証ルールマスター登録
-- ----------------------------------------------------------------------------
-- シフト重複チェック
INSERT INTO ops.shift_validation_rules (
  tenant_id, validation_id, rule_code, rule_name, check_category, validation_rule,
  description, check_level, severity, auto_action, error_message,
  override_possible, override_authority, is_active
)
VALUES (
  3, 'CHECK_OVERLAP', 'SHIFT_OVERLAP', 'シフト重複チェック', 'SCHEDULING',
  '同一スタッフの同一日に複数のシフトが重複していないかチェック',
  'スタッフが同じ日に複数のシフトにアサインされていないか検証',
  'ERROR', 'HIGH', 'REJECT',
  '同一スタッフが同じ日に複数のシフトにアサインされています',
  false, NULL, true
)
ON CONFLICT DO NOTHING;

-- 勤務間インターバルチェック
INSERT INTO ops.shift_validation_rules (
  tenant_id, validation_id, rule_code, rule_name, check_category, validation_rule,
  description, check_level, severity, auto_action, error_message,
  override_possible, override_authority, is_active
)
VALUES (
  3, 'CHECK_REST_TIME', 'MIN_REST_INTERVAL', '勤務間インターバルチェック', 'WORK_HOURS',
  '連続するシフト間に最低11時間の休息時間が確保されているかチェック',
  '労働時間等設定改善指針に基づく勤務間インターバルの検証',
  'WARNING', 'MEDIUM', 'WARN',
  '勤務間インターバルが11時間未満です',
  true, 'MANAGER', true
)
ON CONFLICT DO NOTHING;

-- 週間労働時間チェック
INSERT INTO ops.shift_validation_rules (
  tenant_id, validation_id, rule_code, rule_name, check_category, validation_rule,
  description, check_level, severity, auto_action, error_message,
  override_possible, override_authority, is_active
)
VALUES (
  3, 'CHECK_WEEKLY_HOURS', 'WEEKLY_HOURS_LIMIT', '週間労働時間チェック', 'WORK_HOURS',
  '1週間の労働時間が法定上限(40時間)を超えていないかチェック',
  '労働基準法第32条に基づく週間労働時間の検証',
  'ERROR', 'HIGH', 'REJECT',
  '週間労働時間が40時間を超えています',
  true, 'ADMIN', true
)
ON CONFLICT DO NOTHING;

-- 最低人数チェック
INSERT INTO ops.shift_validation_rules (
  tenant_id, validation_id, rule_code, rule_name, check_category, validation_rule,
  description, check_level, severity, auto_action, error_message,
  override_possible, override_authority, is_active
)
VALUES (
  3, 'CHECK_MIN_STAFF', 'MIN_STAFF_COUNT', '最低人数チェック', 'STAFFING',
  'シフトごとに最低必要人数が確保されているかチェック',
  '各シフトに必要な最低人数が配置されているか検証',
  'ERROR', 'HIGH', 'REJECT',
  'シフトの最低必要人数が不足しています',
  true, 'MANAGER', true
)
ON CONFLICT DO NOTHING;

-- 休憩時間チェック
INSERT INTO ops.shift_validation_rules (
  tenant_id, validation_id, rule_code, rule_name, check_category, validation_rule,
  description, check_level, severity, auto_action, error_message,
  override_possible, override_authority, is_active
)
VALUES (
  3, 'CHECK_BREAK_TIME', 'REQUIRED_BREAK', '休憩時間チェック', 'WORK_HOURS',
  '労働時間に応じた適切な休憩時間が設定されているかチェック',
  '労働基準法第34条に基づく休憩時間の検証(6h超:45分, 8h超:60分)',
  'ERROR', 'HIGH', 'REJECT',
  '必要な休憩時間が不足しています',
  false, NULL, true
)
ON CONFLICT DO NOTHING;

-- 連続勤務日数チェック
INSERT INTO ops.shift_validation_rules (
  tenant_id, validation_id, rule_code, rule_name, check_category, validation_rule,
  description, check_level, severity, auto_action, error_message,
  override_possible, override_authority, is_active
)
VALUES (
  3, 'CHECK_CONSECUTIVE_WORK', 'MAX_CONSECUTIVE_DAYS', '連続勤務日数チェック', 'WORK_PATTERN',
  '連続勤務日数が6日を超えていないかチェック',
  '労働基準法第35条に基づく週休の検証',
  'WARNING', 'MEDIUM', 'WARN',
  '連続勤務日数が6日を超えています',
  true, 'MANAGER', true
)
ON CONFLICT DO NOTHING;

