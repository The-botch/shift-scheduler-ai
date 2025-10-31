# データベース構築手順書

**対象環境**: Railway PostgreSQL
**作成日**: 2025-10-31

---

## 📋 目次

1. [Railway環境セットアップ](#railway環境セットアップ)
2. [データベース作成手順](#データベース作成手順)
3. [ローカル開発環境設定](#ローカル開発環境設定)
4. [トラブルシューティング](#トラブルシューティング)

---

## Railway環境セットアップ

### 1. Railwayプロジェクト作成

```bash
# Railwayにログイン
railway login

# 新規プロジェクト作成
railway init

# PostgreSQLサービスを追加
railway add
# → "PostgreSQL" を選択
```

### 2. 接続情報の取得

```bash
# データベース接続情報を表示
railway variables

# 以下の環境変数が表示される
# DATABASE_URL=postgresql://postgres:xxx@containers-us-west-xxx.railway.app:5432/railway
# PGHOST=containers-us-west-xxx.railway.app
# PGPORT=5432
# PGUSER=postgres
# PGPASSWORD=xxx
# PGDATABASE=railway
```

### 3. 環境変数の設定

バックエンドの `.env` ファイルに追加:

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:xxx@containers-us-west-xxx.railway.app:5432/railway
```

---

## データベース作成手順

### 方法1: Railway CLI経由で実行（推奨）

```bash
# プロジェクトディレクトリに移動
cd shift-scheduler-ai

# Railwayに接続してSQLを実行
railway run psql $DATABASE_URL -f scripts/db/001_create_tables.sql
railway run psql $DATABASE_URL -f scripts/db/002_seed_master_data.sql
```

### 方法2: psqlコマンドで直接実行

```bash
# ローカルからRailway DBに接続
psql $DATABASE_URL

# psql プロンプトで実行
\i scripts/db/001_create_tables.sql
\i scripts/db/002_seed_master_data.sql

# 終了
\q
```

### 方法3: Railway Webコンソールで実行

1. Railway Dashboard にアクセス
2. PostgreSQL サービスを選択
3. "Query" タブを開く
4. `scripts/db/001_create_tables.sql` の内容をコピペして実行
5. `scripts/db/002_seed_master_data.sql` の内容をコピペして実行

---

## テーブル作成の確認

```bash
# Railwayデータベースに接続
railway run psql $DATABASE_URL

# テーブル一覧表示
\dt

# 期待される出力:
#  Schema |         Name          | Type  |  Owner
# --------+-----------------------+-------+----------
#  public | availability_requests | table | postgres
#  public | certifications        | table | postgres
#  public | demand_forecasts      | table | postgres
#  public | labor_law_constraints | table | postgres
#  public | payroll               | table | postgres
#  public | roles                 | table | postgres
#  public | sales_actual          | table | postgres
#  public | shift_history         | table | postgres
#  public | shift_patterns        | table | postgres
#  public | shift_plans           | table | postgres
#  public | shift_preferences     | table | postgres
#  public | shift_validation_rules| table | postgres
#  public | shifts                | table | postgres
#  public | skills                | table | postgres
#  public | staff                 | table | postgres
#  public | staff_certifications  | table | postgres
#  public | staff_skills          | table | postgres
#  public | store_constraints     | table | postgres
#  public | stores                | table | postgres
#  public | work_hours_actual     | table | postgres
# (20 rows)

# データ確認
SELECT * FROM stores;
SELECT * FROM staff;
SELECT * FROM roles;

# 終了
\q
```

---

## ローカル開発環境設定

### Docker Composeでローカル PostgreSQL（開発用）

`docker-compose.yml` をプロジェクトルートに作成:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: shift-scheduler-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: shift_scheduler
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/db:/docker-entrypoint-initdb.d

volumes:
  postgres_data:
```

起動:

```bash
# Docker Compose起動
docker-compose up -d

# データベース初期化（自動実行される）
# /docker-entrypoint-initdb.d内のSQLファイルが自動実行される

# 接続確認
psql postgresql://postgres:postgres@localhost:5432/shift_scheduler

# 停止
docker-compose down
```

### ローカル環境の環境変数

```bash
# backend/.env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shift_scheduler
```

---

## バックエンドからの接続設定

### Node.js (pg パッケージ)

```bash
# 必要なパッケージをインストール
cd backend
npm install pg dotenv
```

`backend/src/db/connection.js` を作成:

```javascript
import pkg from 'pg'
const { Pool } = pkg
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// 接続テスト
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err)
  } else {
    console.log('✅ Database connected:', res.rows[0].now)
  }
})

export default pool
```

使用例:

```javascript
import pool from './db/connection.js'

// クエリ実行
const result = await pool.query('SELECT * FROM stores WHERE is_active = $1', [true])
console.log(result.rows)
```

---

## マイグレーション管理（今後の拡張）

### 推奨ツール

1. **node-pg-migrate**
```bash
npm install node-pg-migrate
npx node-pg-migrate create initial-schema
```

2. **Prisma**
```bash
npm install prisma --save-dev
npx prisma init
npx prisma migrate dev --name init
```

---

## トラブルシューティング

### 1. 接続エラー

**エラー**: `connection refused`

**解決策**:
```bash
# Railwayサービスが起動しているか確認
railway status

# 環境変数を再取得
railway variables

# SSL接続を明示的に指定
psql "$DATABASE_URL?sslmode=require"
```

### 2. テーブルが作成されない

**エラー**: `permission denied` または `syntax error`

**解決策**:
```bash
# PostgreSQLバージョン確認
railway run psql $DATABASE_URL -c "SELECT version();"

# ログ確認
railway logs

# SQLファイルの文字コードを確認
file scripts/db/001_create_tables.sql
# → UTF-8であることを確認
```

### 3. 外部キー制約エラー

**エラー**: `foreign key constraint fails`

**解決策**:
```sql
-- 既存データを削除してから再実行
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- スクリプト再実行
\i scripts/db/001_create_tables.sql
\i scripts/db/002_seed_master_data.sql
```

### 4. データベースリセット

```bash
# Railway DBをリセット
railway run psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 再度テーブル作成
railway run psql $DATABASE_URL -f scripts/db/001_create_tables.sql
railway run psql $DATABASE_URL -f scripts/db/002_seed_master_data.sql
```

---

## 便利なSQLコマンド

```sql
-- テーブル一覧
\dt

-- テーブル構造確認
\d stores
\d staff

-- インデックス確認
\di

-- 外部キー制約確認
\dS+ shifts

-- テーブルサイズ確認
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;

-- レコード数確認
SELECT
    schemaname,
    tablename,
    n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

## 次のステップ

1. ✅ **データベース構築完了**
2. 📝 **バックエンドAPI実装**
   - CRUD操作のエンドポイント作成
   - `/api/staff`, `/api/shifts`, etc.
3. 🔄 **フロントエンド連携**
   - ローカルストレージからDB連携に移行
   - API呼び出しの実装
4. 🧪 **テスト実装**
   - API統合テスト
   - E2Eテスト

---

## 参考リンク

- [Railway Documentation](https://docs.railway.app/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg)](https://node-postgres.com/)
- [Prisma](https://www.prisma.io/)
