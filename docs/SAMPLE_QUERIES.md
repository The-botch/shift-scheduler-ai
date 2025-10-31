# サンプルSELECT文集

投入されたデータを確認・活用するためのSELECT文のサンプル集です。

## 📊 基本的な確認クエリ

### 1. テナント情報の確認
```sql
SELECT
  tenant_id,
  tenant_code,
  tenant_name,
  contract_plan,
  contract_start_date,
  max_stores,
  max_staff,
  is_active
FROM core.tenants;
```

### 2. 店舗一覧
```sql
SELECT
  s.store_id,
  s.store_code,
  s.store_name,
  s.address,
  s.phone_number,
  s.business_hours_start,
  s.business_hours_end,
  d.division_name
FROM core.stores s
JOIN core.divisions d ON s.division_id = d.division_id
WHERE s.is_active = TRUE;
```

### 3. スタッフ一覧（役職付き）
```sql
SELECT
  s.staff_id,
  s.staff_code,
  s.name,
  r.role_name,
  s.employment_type,
  CASE
    WHEN s.employment_type = 'MONTHLY' THEN '月給 ¥' || s.monthly_salary
    WHEN s.employment_type = 'HOURLY' THEN '時給 ¥' || s.hourly_rate
  END as salary,
  s.hire_date,
  s.email
FROM hr.staff s
JOIN core.roles r ON s.role_id = r.role_id
WHERE s.is_active = TRUE
ORDER BY r.display_order, s.staff_id;
```

## 🔍 集計・分析クエリ

### 4. 雇用形態別スタッフ数
```sql
SELECT
  employment_type,
  COUNT(*) as staff_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM hr.staff
WHERE is_active = TRUE
GROUP BY employment_type
ORDER BY staff_count DESC;
```

### 5. 役職別スタッフ数
```sql
SELECT
  r.role_name,
  COUNT(s.staff_id) as staff_count,
  ROUND(AVG(
    CASE
      WHEN s.employment_type = 'MONTHLY' THEN s.monthly_salary
      WHEN s.employment_type = 'HOURLY' THEN s.hourly_rate * 160
    END
  ), 0) as avg_monthly_equivalent
FROM core.roles r
LEFT JOIN hr.staff s ON r.role_id = s.role_id AND s.is_active = TRUE
GROUP BY r.role_id, r.role_name, r.display_order
ORDER BY r.display_order;
```

### 6. 月給・時給スタッフの平均給与
```sql
SELECT
  'MONTHLY' as type,
  COUNT(*) as count,
  MIN(monthly_salary) as min_salary,
  ROUND(AVG(monthly_salary), 0) as avg_salary,
  MAX(monthly_salary) as max_salary
FROM hr.staff
WHERE employment_type = 'MONTHLY' AND is_active = TRUE

UNION ALL

SELECT
  'HOURLY' as type,
  COUNT(*) as count,
  MIN(hourly_rate) as min_salary,
  ROUND(AVG(hourly_rate), 0) as avg_salary,
  MAX(hourly_rate) as max_salary
FROM hr.staff
WHERE employment_type = 'HOURLY' AND is_active = TRUE;
```

## 📅 シフトパターン関連

### 7. シフトパターン一覧（労働時間計算付き）
```sql
SELECT
  pattern_code,
  pattern_name,
  start_time,
  end_time,
  break_minutes,
  EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 as total_hours_raw,
  ROUND(
    (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) - (break_minutes / 60.0),
    2
  ) as work_hours
FROM core.shift_patterns
WHERE is_active = TRUE
ORDER BY start_time;
```

### 8. 早番・遅番の分類
```sql
SELECT
  pattern_name,
  start_time,
  end_time,
  CASE
    WHEN start_time < '12:00:00' THEN '早番系'
    WHEN start_time >= '12:00:00' AND start_time < '17:00:00' THEN '中番系'
    ELSE '遅番系'
  END as shift_category,
  ROUND(
    (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) - (break_minutes / 60.0),
    2
  ) as work_hours
FROM core.shift_patterns
WHERE is_active = TRUE
ORDER BY start_time;
```

## 🔗 結合クエリ

### 9. スタッフと店舗・役職・事業部の完全情報
```sql
SELECT
  s.staff_code,
  s.name,
  r.role_name,
  st.store_name,
  d.division_name,
  s.employment_type,
  s.hire_date,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, s.hire_date)) as years_employed,
  s.email,
  s.phone_number
FROM hr.staff s
JOIN core.roles r ON s.role_id = r.role_id
JOIN core.stores st ON s.store_id = st.store_id
LEFT JOIN core.divisions d ON s.division_id = d.division_id
WHERE s.is_active = TRUE
ORDER BY st.store_id, r.display_order, s.staff_id;
```

### 10. スキル別マスタ一覧
```sql
SELECT
  skill_id,
  skill_code,
  skill_name,
  category,
  display_order
FROM core.skills
WHERE is_active = TRUE
ORDER BY display_order;
```

## 📈 日付・期間関連

### 11. 入社年別スタッフ数
```sql
SELECT
  EXTRACT(YEAR FROM hire_date) as hire_year,
  COUNT(*) as staff_count,
  STRING_AGG(name, ', ' ORDER BY hire_date) as staff_names
FROM hr.staff
WHERE is_active = TRUE
GROUP BY EXTRACT(YEAR FROM hire_date)
ORDER BY hire_year DESC;
```

### 12. 勤続年数別スタッフ一覧
```sql
SELECT
  name,
  staff_code,
  hire_date,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) as years,
  EXTRACT(MONTH FROM AGE(CURRENT_DATE, hire_date)) as months,
  CASE
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 5 THEN 'ベテラン'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 2 THEN '中堅'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 1 THEN '若手'
    ELSE '新人'
  END as experience_level
FROM hr.staff
WHERE is_active = TRUE
ORDER BY hire_date;
```

## 🎯 実務的なクエリ

### 13. 店舗の営業時間とシフトパターンの適合性チェック
```sql
SELECT
  st.store_name,
  st.business_hours_start,
  st.business_hours_end,
  sp.pattern_name,
  sp.start_time,
  sp.end_time,
  CASE
    WHEN sp.start_time >= st.business_hours_start
     AND sp.end_time <= st.business_hours_end THEN '✓ 営業時間内'
    WHEN sp.start_time < st.business_hours_start THEN '⚠ 開店前開始'
    WHEN sp.end_time > st.business_hours_end THEN '⚠ 閉店後終了'
    ELSE '⚠ 要確認'
  END as status
FROM core.stores st
CROSS JOIN core.shift_patterns sp
WHERE st.is_active = TRUE AND sp.is_active = TRUE
ORDER BY st.store_id, sp.start_time;
```

### 14. スタッフの人件費概算（月給換算）
```sql
SELECT
  name,
  employment_type,
  CASE
    WHEN employment_type = 'MONTHLY' THEN monthly_salary
    WHEN employment_type = 'HOURLY' THEN hourly_rate * 160  -- 週40時間 × 4週
  END as monthly_equivalent,
  CASE
    WHEN employment_type = 'MONTHLY' THEN monthly_salary * 12
    WHEN employment_type = 'HOURLY' THEN hourly_rate * 160 * 12
  END as annual_equivalent
FROM hr.staff
WHERE is_active = TRUE
ORDER BY monthly_equivalent DESC;
```

### 15. 人件費合計（店舗別）
```sql
SELECT
  st.store_name,
  COUNT(s.staff_id) as staff_count,
  SUM(
    CASE
      WHEN s.employment_type = 'MONTHLY' THEN s.monthly_salary
      WHEN s.employment_type = 'HOURLY' THEN s.hourly_rate * 160
    END
  ) as total_monthly_cost,
  ROUND(
    AVG(
      CASE
        WHEN s.employment_type = 'MONTHLY' THEN s.monthly_salary
        WHEN s.employment_type = 'HOURLY' THEN s.hourly_rate * 160
      END
    ), 0
  ) as avg_monthly_cost
FROM core.stores st
LEFT JOIN hr.staff s ON st.store_id = s.store_id AND s.is_active = TRUE
GROUP BY st.store_id, st.store_name;
```

## 🔎 検索クエリ

### 16. 特定の条件でスタッフを検索（時給1000円以上）
```sql
SELECT
  name,
  staff_code,
  employment_type,
  hourly_rate,
  hire_date
FROM hr.staff
WHERE employment_type = 'HOURLY'
  AND hourly_rate >= 1000
  AND is_active = TRUE
ORDER BY hourly_rate DESC;
```

### 17. 月給スタッフ（リーダー層）の一覧
```sql
SELECT
  s.name,
  r.role_name,
  s.monthly_salary,
  s.hire_date,
  s.email
FROM hr.staff s
JOIN core.roles r ON s.role_id = r.role_id
WHERE s.employment_type = 'MONTHLY'
  AND s.is_active = TRUE
ORDER BY s.monthly_salary DESC;
```

## 📊 データ品質チェック

### 18. メールアドレス登録状況
```sql
SELECT
  CASE
    WHEN email IS NOT NULL AND email != '' THEN 'メール登録あり'
    ELSE 'メール未登録'
  END as email_status,
  COUNT(*) as count
FROM hr.staff
WHERE is_active = TRUE
GROUP BY email_status;
```

### 19. 全テーブルのレコード数確認
```sql
SELECT 'tenants' as table_name, COUNT(*) as count FROM core.tenants
UNION ALL
SELECT 'divisions', COUNT(*) FROM core.divisions
UNION ALL
SELECT 'stores', COUNT(*) FROM core.stores
UNION ALL
SELECT 'roles', COUNT(*) FROM core.roles
UNION ALL
SELECT 'skills', COUNT(*) FROM core.skills
UNION ALL
SELECT 'shift_patterns', COUNT(*) FROM core.shift_patterns
UNION ALL
SELECT 'staff', COUNT(*) FROM hr.staff
ORDER BY count DESC;
```

### 20. テナント別データサマリー
```sql
SELECT
  t.tenant_name,
  (SELECT COUNT(*) FROM core.divisions d WHERE d.tenant_id = t.tenant_id) as divisions,
  (SELECT COUNT(*) FROM core.stores s WHERE s.tenant_id = t.tenant_id) as stores,
  (SELECT COUNT(*) FROM core.roles r WHERE r.tenant_id = t.tenant_id) as roles,
  (SELECT COUNT(*) FROM core.skills sk WHERE sk.tenant_id = t.tenant_id) as skills,
  (SELECT COUNT(*) FROM core.shift_patterns sp WHERE sp.tenant_id = t.tenant_id) as patterns,
  (SELECT COUNT(*) FROM hr.staff st WHERE st.tenant_id = t.tenant_id) as staff
FROM core.tenants t;
```

---

## 🚀 実行方法

GUIツール（TablePlus、DBeaver、pgAdminなど）のSQLエディタで、上記のクエリをコピー&ペーストして実行してください。

### psqlで実行する場合:
```bash
psql postgresql://postgres:gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe@mainline.proxy.rlwy.net:50142/railway

# 実行例
\x  -- 拡張表示モード（見やすくなります）
SELECT * FROM hr.staff;
```

### Node.jsスクリプトで実行する場合:
```javascript
import pg from 'pg';
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});
await client.connect();
const result = await client.query('SELECT * FROM hr.staff');
console.table(result.rows);
await client.end();
```
