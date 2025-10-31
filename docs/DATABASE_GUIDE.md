# データベースガイド

**対象環境**: Railway PostgreSQL 17.6
**最終更新**: 2025-11-01

このドキュメントでは、データベースの接続方法、セットアップ手順、トラブルシューティングを包括的に説明します。

---

## 📋 目次

1. [接続情報](#接続情報)
2. [セットアップ手順](#セットアップ手順)
3. [データベース構築](#データベース構築)
4. [接続確認](#接続確認)
5. [バックエンド連携](#バックエンド連携)
6. [ローカル開発環境](#ローカル開発環境)
7. [トラブルシューティング](#トラブルシューティング)
8. [便利なコマンド](#便利なコマンド)

---

## 接続情報

### Railway PostgreSQL

- **Host**: mainline.proxy.rlwy.net
- **Port**: 50142
- **Database**: railway
- **User**: postgres
- **PostgreSQL Version**: 17.6

### 接続文字列の取得

```bash
# Railway CLIで接続情報を表示
railway variables

# 出力例:
# DATABASE_URL=postgresql://postgres:xxx@mainline.proxy.rlwy.net:50142/railway
```

---

## セットアップ手順

### ステップ1: リポジトリのクローン

```bash
git clone <repository-url>
cd shift-scheduler-ai
```

### ステップ2: 依存関係のインストール

```bash
npm install
```

これにより`pg`（PostgreSQLクライアント）パッケージがインストールされます。

### ステップ3: Railway環境のセットアップ

#### 3.1 Railwayプロジェクト作成

```bash
# Railwayにログイン
railway login

# 新規プロジェクト作成
railway init

# PostgreSQLサービスを追加
railway add
# → "PostgreSQL" を選択
```

#### 3.2 接続情報の取得

```bash
# データベース接続情報を表示
railway variables
```

出力される環境変数:
- `DATABASE_URL` - 接続文字列
- `PGHOST` - ホスト名
- `PGPORT` - ポート番号
- `PGUSER` - ユーザー名
- `PGPASSWORD` - パスワード
- `PGDATABASE` - データベース名

### ステップ4: 環境変数の設定

#### 方法1: .envファイルを使用（推奨）

```bash
# .env.example をコピー
cp .env.example .env

# .env ファイルを編集して、実際のDATABASE_URLを設定
# Railway管理画面から DATABASE_URL をコピーして貼り付け
```

**.envファイルの例**:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@mainline.proxy.rlwy.net:YOUR_PORT/railway
```

#### 方法2: 環境変数を直接設定

```bash
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@mainline.proxy.rlwy.net:YOUR_PORT/railway"
```

---

## データベース構築

### 方法1: セットアップスクリプト実行（推奨）

```bash
# プロジェクトディレクトリに移動
cd shift-scheduler-ai

# Node.jsセットアップスクリプト実行
node scripts/setup/setup_fresh_db.mjs
```

このスクリプトは以下を自動実行します：
- スキーマ作成（core, hr, ops, analytics）
- 全テーブル作成（マルチテナント対応）
- マスターデータ投入

### 方法2: Railway CLI経由で実行

```bash
# Railwayに接続してSQLを実行
railway run psql $DATABASE_URL -f scripts/setup/schema.sql
railway run psql $DATABASE_URL -f scripts/setup/seed_data.sql
```

### 方法3: psqlコマンドで直接実行

```bash
# ローカルからRailway DBに接続
psql $DATABASE_URL

# psql プロンプトで実行
\i scripts/setup/schema.sql
\i scripts/setup/seed_data.sql

# 終了
\q
```

### 方法4: Railway Webコンソールで実行

1. Railway Dashboard にアクセス
2. PostgreSQL サービスを選択
3. "Query" タブを開く
4. `scripts/setup/schema.sql` の内容をコピペして実行
5. `scripts/setup/seed_data.sql` の内容をコピペして実行

### テーブル作成の確認

```bash
# Node.jsで検証スクリプト実行
node scripts/setup/verify_setup.mjs
```

または手動確認:

```bash
# Railwayデータベースに接続
railway run psql $DATABASE_URL

# スキーマ一覧表示
\dn

# テーブル一覧表示（スキーマ別）
\dt core.*
\dt hr.*
\dt ops.*
\dt analytics.*

# データ確認
SELECT * FROM core.tenants;
SELECT * FROM core.stores;
SELECT * FROM hr.staff;

# 終了
\q
```

---

## 接続確認

### テスト1: 基本的な接続確認

```bash
npm run test:db
```

**実行内容**:
- PostgreSQL接続確認
- バージョン情報取得
- テーブル作成・削除
- CRUD操作（INSERT/SELECT/UPDATE/DELETE）

**期待される結果**:
```
✅ 接続確認: OK
✅ CREATE (テーブル作成): OK
✅ INSERT (データ挿入): OK
✅ SELECT (データ取得): OK
✅ UPDATE (データ更新): OK
✅ DELETE (データ削除): OK
✅ DROP (テーブル削除): OK
```

### テスト2: スキーマ・複雑なCRUD操作

```bash
npm run test:schema
```

**実行内容**:
- 複数スキーマ作成（public, test_schema）
- 外部キー制約付きテーブル作成
- JOIN、集計クエリ
- トランザクション（ロールバック）

**期待される結果**:
```
✅ スキーマ作成: OK
✅ テーブル作成（複数スキーマ）: OK
✅ 外部キー制約: OK
✅ INSERT（データ挿入）: OK
✅ SELECT（データ取得・JOIN・集計）: OK
✅ UPDATE（データ更新）: OK
✅ DELETE（データ削除）: OK
✅ トランザクション（ロールバック）: OK
```

---

## バックエンド連携

### Node.js (pg パッケージ)

#### パッケージインストール

```bash
cd backend
npm install pg dotenv
```

#### 接続設定ファイル作成

`backend/src/config/database.js`:

```javascript
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Railway PostgreSQL接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 接続テスト
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

/**
 * クエリ実行
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * トランザクション実行
 */
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 接続プール取得
 */
export function getPool() {
  return pool;
}

export default { query, transaction, getPool };
```

#### 使用例

```javascript
import { query } from './config/database.js';

// クエリ実行
const result = await query('SELECT * FROM core.stores WHERE is_active = $1', [true]);
console.log(result.rows);

// トランザクション実行例
import { transaction } from './config/database.js';

await transaction(async (client) => {
  await client.query('INSERT INTO core.stores (...) VALUES (...)');
  await client.query('INSERT INTO hr.staff (...) VALUES (...)');
});
```

---

## ローカル開発環境

### Docker Composeでローカル PostgreSQL

#### docker-compose.yml 作成

プロジェクトルートに作成:

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
      - ./scripts/setup:/docker-entrypoint-initdb.d

volumes:
  postgres_data:
```

#### 起動・停止

```bash
# Docker Compose起動
docker-compose up -d

# データベース初期化（自動実行される）
# scripts/setup/内のSQLファイルが自動実行される

# 接続確認
psql postgresql://postgres:postgres@localhost:5432/shift_scheduler

# または Node.jsスクリプトで初期化
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shift_scheduler node scripts/setup/setup_fresh_db.mjs

# 停止
docker-compose down
```

### ローカル環境の環境変数

```bash
# backend/.env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shift_scheduler
```

---

## トラブルシューティング

### 問題1: 接続タイムアウト

**症状**:
```
Error: Connection timeout
```

**解決策**:
- ネットワーク接続を確認
- Railwayのサービスが起動しているか確認
  ```bash
  railway status
  ```
- ファイアウォール設定を確認

### 問題2: 認証エラー

**症状**:
```
Error: password authentication failed
```

**解決策**:
- DATABASE_URLのパスワードが正しいか確認
- Railway管理画面から最新の接続情報を取得
  ```bash
  railway variables
  ```
- SSL接続を明示的に指定
  ```bash
  psql "$DATABASE_URL?sslmode=require"
  ```

### 問題3: データベースが見つからない

**症状**:
```
Error: database "railway" does not exist
```

**解決策**:
- Railway PostgreSQLサービスが正しくプロビジョニングされているか確認
- DATABASE_URLのデータベース名を確認

### 問題4: pgパッケージがない

**症状**:
```
Error: Cannot find package 'pg'
```

**解決策**:
```bash
npm install
# または
npm install pg
```

### 問題5: テーブルが作成されない

**症状**:
```
Error: permission denied
Error: syntax error
```

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

### 問題6: 外部キー制約エラー

**症状**:
```
Error: foreign key constraint fails
```

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

### データベースリセット

```bash
# Railway DBをリセット（全スキーマ削除）
railway run psql $DATABASE_URL -c "DROP SCHEMA IF EXISTS core CASCADE; DROP SCHEMA IF EXISTS hr CASCADE; DROP SCHEMA IF EXISTS ops CASCADE; DROP SCHEMA IF EXISTS analytics CASCADE;"

# 再度セットアップ実行
node scripts/setup/setup_fresh_db.mjs

# または手動でSQL実行
railway run psql $DATABASE_URL -f scripts/setup/schema.sql
railway run psql $DATABASE_URL -f scripts/setup/seed_data.sql
```

---

## 便利なコマンド

### 手動接続方法

#### 方法1: psql（PostgreSQLクライアント）

```bash
# パスワードを環境変数に設定
export PGPASSWORD=YOUR_PASSWORD

# psqlで接続
psql -h mainline.proxy.rlwy.net -U postgres -p 50142 -d railway
```

接続後:
```sql
-- データベース情報確認
SELECT version();

-- スキーマ一覧
\dn

-- テーブル一覧
\dt

-- 終了
\q
```

#### 方法2: Railway CLI

```bash
# Railway CLIインストール（未インストールの場合）
npm install -g @railway/cli

# Railwayにログイン
railway login

# プロジェクトにリンク
railway link

# PostgreSQLに接続
railway connect Postgres
```

#### 方法3: Node.jsスクリプト

```javascript
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

const result = await client.query('SELECT NOW()');
console.log(result.rows[0]);

await client.end();
```

### よく使うSQLコマンド

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

### 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `npm run test:db` | 基本的なDB接続確認 |
| `npm run test:schema` | スキーマ・CRUD総合テスト |
| `npm run db:summary` | データ件数サマリー |
| `npm run db:staff` | スタッフ詳細一覧 |
| `npm run db:tables` | 全テーブル一覧 |
| `npm run db:count` | レコード数確認 |

---

## セキュリティ注意事項

### 重要

- ✅ `.env` ファイルは `.gitignore` に含まれており、Gitにコミットされません
- ❌ パスワードや接続情報を直接コードに書かないでください
- ❌ `.env` ファイルを公開リポジトリにコミットしないでください
- ✅ 本番環境では環境変数を使用してください

### 本番環境での設定

```bash
# Railway環境変数（自動設定）
DATABASE_URL=postgresql://...

# または Railway CLI経由で実行
railway run npm start
```

---

## マイグレーション管理（今後の拡張）

### 推奨ツール

#### 1. node-pg-migrate

```bash
npm install node-pg-migrate
npx node-pg-migrate create initial-schema
```

#### 2. Prisma

```bash
npm install prisma --save-dev
npx prisma init
npx prisma migrate dev --name init
```

---

## GUIツールとの併用

CLIコマンドは、GUIツール（TablePlus、DBeaver、pgAdminなど）と併用できます。

### GUIツール接続情報

- Host: `mainline.proxy.rlwy.net`
- Port: `50142`
- Database: `railway`
- User: `postgres`
- Password: (`.env` ファイル参照)

### 推奨GUIツール

#### 1. TablePlus（推奨）

```bash
brew install --cask tableplus
```

- 軽量・高速
- 複数DB対応
- 見た目が美しい

#### 2. DBeaver（無料）

```bash
brew install --cask dbeaver-community
```

- 完全無料
- 多機能
- ER図自動生成

#### 3. pgAdmin

```bash
brew install --cask pgadmin4
```

- PostgreSQL公式
- 管理機能が豊富

---

## 次のステップ

接続確認が完了したら:

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

## 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | テーブル定義の詳細仕様書 |
| [MULTITENANT_REDESIGN.md](MULTITENANT_REDESIGN.md) | マルチテナント対応設計 |
| [DATABASE_CLI_COMMANDS.md](DATABASE_CLI_COMMANDS.md) | CLIコマンド集 |
| [SAMPLE_QUERIES.md](SAMPLE_QUERIES.md) | サンプルクエリ集 |

---

## 参考リンク

- [Railway Documentation](https://docs.railway.app/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg)](https://node-postgres.com/)
- [Prisma](https://www.prisma.io/)
