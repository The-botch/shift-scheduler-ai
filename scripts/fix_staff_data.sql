-- =====================================================
-- スタッフデータ修正SQL（テナントID=3）
-- =====================================================
-- 実行前に必ずバックアップを取ってください！
--
-- 1. 重複スタッフの統合（7組）
-- 2. デフォルト店舗の修正（29名）※統合後
-- =====================================================

-- トランザクション開始
BEGIN;

-- =====================================================
-- STEP 1: 重複スタッフの統合（7組）
-- =====================================================

-- 【武根太一】STAFF_039 → STAFF_023 に統合
UPDATE ops.shifts SET staff_id = 1216 WHERE staff_id = 1232;
UPDATE ops.shift_preferences SET staff_id = 1216 WHERE staff_id = 1232;
DELETE FROM hr.staff_skills WHERE staff_id = 1232;
UPDATE hr.staff_certifications SET staff_id = 1216 WHERE staff_id = 1232;
UPDATE hr.staff SET is_active = FALSE WHERE staff_id = 1232;

-- 【佐々美音】STAFF_043 → STAFF_008 に統合
UPDATE ops.shifts SET staff_id = 1201 WHERE staff_id = 1236;
UPDATE ops.shift_preferences SET staff_id = 1201 WHERE staff_id = 1236;
DELETE FROM hr.staff_skills WHERE staff_id = 1236;
UPDATE hr.staff_certifications SET staff_id = 1201 WHERE staff_id = 1236;
UPDATE hr.staff SET is_active = FALSE WHERE staff_id = 1236;

-- 【高田久瑠美】STAFF_032 → STAFF_015 に統合
UPDATE ops.shifts SET staff_id = 1208 WHERE staff_id = 1225;
UPDATE ops.shift_preferences SET staff_id = 1208 WHERE staff_id = 1225;
DELETE FROM hr.staff_skills WHERE staff_id = 1225;
UPDATE hr.staff_certifications SET staff_id = 1208 WHERE staff_id = 1225;
UPDATE hr.staff SET is_active = FALSE WHERE staff_id = 1225;

-- 【吉田莉乃】STAFF_033 → STAFF_016 に統合
UPDATE ops.shifts SET staff_id = 1209 WHERE staff_id = 1226;
UPDATE ops.shift_preferences SET staff_id = 1209 WHERE staff_id = 1226;
DELETE FROM hr.staff_skills WHERE staff_id = 1226;
UPDATE hr.staff_certifications SET staff_id = 1209 WHERE staff_id = 1226;
UPDATE hr.staff SET is_active = FALSE WHERE staff_id = 1226;

-- 【橋本勇人】STAFF_049 → STAFF_046 に統合
UPDATE ops.shifts SET staff_id = 1239 WHERE staff_id = 1242;
UPDATE ops.shift_preferences SET staff_id = 1239 WHERE staff_id = 1242;
DELETE FROM hr.staff_skills WHERE staff_id = 1242;
UPDATE hr.staff_certifications SET staff_id = 1239 WHERE staff_id = 1242;
UPDATE hr.staff SET is_active = FALSE WHERE staff_id = 1242;

-- 【相模純平】STAFF_048 → STAFF_022 に統合
UPDATE ops.shifts SET staff_id = 1215 WHERE staff_id = 1241;
UPDATE ops.shift_preferences SET staff_id = 1215 WHERE staff_id = 1241;
DELETE FROM hr.staff_skills WHERE staff_id = 1241;
UPDATE hr.staff_certifications SET staff_id = 1215 WHERE staff_id = 1241;
UPDATE hr.staff SET is_active = FALSE WHERE staff_id = 1241;

-- 【甲木由紀】STAFF_042 → STAFF_040 に統合
UPDATE ops.shifts SET staff_id = 1233 WHERE staff_id = 1235;
UPDATE ops.shift_preferences SET staff_id = 1233 WHERE staff_id = 1235;
DELETE FROM hr.staff_skills WHERE staff_id = 1235;
UPDATE hr.staff_certifications SET staff_id = 1233 WHERE staff_id = 1235;
UPDATE hr.staff SET is_active = FALSE WHERE staff_id = 1235;

-- =====================================================
-- STEP 2: デフォルト店舗の修正（29名）
-- =====================================================

-- Stand Banh Mi (156) に変更 - 14名
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1205; -- 篠原喬人
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1206; -- 佐藤孝仁
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1207; -- 北村卓也
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1208; -- 高田久瑠美
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1209; -- 吉田莉乃
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1210; -- 中山美和
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1211; -- 梶尾真紀
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1212; -- 佐伯結香
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1227; -- 都筑麻帆
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1228; -- 都筑 紫帆
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1229; -- 川原勇人
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1230; -- 小原 綾夏
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1231; -- 植田桃子
UPDATE hr.staff SET store_id = 156 WHERE staff_id = 1239; -- 橋本勇人

-- Stand Bo Bun (157) に変更 - 5名
UPDATE hr.staff SET store_id = 157 WHERE staff_id = 1213; -- 吉原将郎
UPDATE hr.staff SET store_id = 157 WHERE staff_id = 1214; -- 五十嵐ティン
UPDATE hr.staff SET store_id = 157 WHERE staff_id = 1215; -- 相模純平
UPDATE hr.staff SET store_id = 157 WHERE staff_id = 1240; -- 横山さやか
UPDATE hr.staff SET store_id = 157 WHERE staff_id = 1243; -- 小山琴美

-- Atelier (154) に変更 - 9名
UPDATE hr.staff SET store_id = 154 WHERE staff_id = 1216; -- 武根太一
UPDATE hr.staff SET store_id = 154 WHERE staff_id = 1217; -- サー
UPDATE hr.staff SET store_id = 154 WHERE staff_id = 1218; -- 永井 航平
UPDATE hr.staff SET store_id = 154 WHERE staff_id = 1219; -- 松本佳奈
UPDATE hr.staff SET store_id = 154 WHERE staff_id = 1220; -- 藤井杉子
UPDATE hr.staff SET store_id = 154 WHERE staff_id = 1221; -- さかい のぞみ
UPDATE hr.staff SET store_id = 154 WHERE staff_id = 1222; -- 武田夕果
UPDATE hr.staff SET store_id = 154 WHERE staff_id = 1223; -- 本村めい
UPDATE hr.staff SET store_id = 154 WHERE staff_id = 1224; -- 吉田知世
UPDATE hr.staff SET store_id = 154 WHERE staff_id = 1233; -- 甲木由紀
UPDATE hr.staff SET store_id = 154 WHERE staff_id = 1234; -- グエン

-- SHIBUYA (155) に変更 - 1名
-- （武根 太一は統合されたので不要）

-- トランザクション完了
COMMIT;

-- =====================================================
-- 確認クエリ
-- =====================================================
-- アクティブなスタッフ数を確認
SELECT COUNT(*) as active_staff_count
FROM hr.staff
WHERE tenant_id = 3 AND is_active = TRUE;

-- 店舗別スタッフ数を確認
SELECT
  s.store_id,
  st.store_name,
  COUNT(*) as staff_count
FROM hr.staff s
LEFT JOIN core.stores st ON s.store_id = st.store_id
WHERE s.tenant_id = 3 AND s.is_active = TRUE
GROUP BY s.store_id, st.store_name
ORDER BY s.store_id;
