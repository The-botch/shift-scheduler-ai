# データベース接続ガイド

**作成日**: 2025-10-31
**対象**: Railway PostgreSQL 17.6

---

## 🔌 接続情報

### **Railway PostgreSQL**

- **Host**: mainline.proxy.rlwy.net
- **Port**: 50142
- **Database**: railway
- **User**: postgres
- **PostgreSQL Version**: 17.6

---

## 🚀 セットアップ手順

### **ステップ1: リポジトリのクローン**

```bash
git clone <repository-url>
cd shift-scheduler-ai
```

### **ステップ2: 依存関係のインストール**

```bash
npm install
```

これにより、`pg`（PostgreSQLクライアント）パッケージがインストールされます。

### **ステップ3: 環境変数の設定**

#### **方法1: .envファイルを使用（推奨）**

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

#### **方法2: 環境変数を直接設定**

```bash
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@mainline.proxy.rlwy.net:YOUR_PORT/railway"
```

---

## ✅ 接続確認

### **テスト1: 基本的な接続確認**

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

### **テスト2: スキーマ・複雑なCRUD操作**

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

## 📊 手動接続方法

### **方法1: psql（PostgreSQLクライアント）**

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

### **方法2: Railway CLI**

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

### **方法3: Node.jsスクリプト**

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

---

## 🛠️ トラブルシューティング

### **問題1: 接続タイムアウト**

**症状**:
```
Error: Connection timeout
```

**解決策**:
- ネットワーク接続を確認
- Railwayのサービスが起動しているか確認
- ファイアウォール設定を確認

### **問題2: 認証エラー**

**症状**:
```
Error: password authentication failed
```

**解決策**:
- DATABASE_URLのパスワードが正しいか確認
- Railway管理画面から最新の接続情報を取得

### **問題3: データベースが見つからない**

**症状**:
```
Error: database "railway" does not exist
```

**解決策**:
- Railway PostgreSQLサービスが正しくプロビジョニングされているか確認
- DATABASE_URLのデータベース名を確認

### **問題4: pgパッケージがない**

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

---

## 📚 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `npm run test:db` | 基本的なDB接続確認 |
| `npm run test:schema` | スキーマ・CRUD総合テスト |
| `npm run db:setup` | データベース初期構築（未実装） |

---

## 🔐 セキュリティ注意事項

### **重要**:
- ✅ `.env` ファイルは `.gitignore` に含まれており、Gitにコミットされません
- ❌ パスワードや接続情報を直接コードに書かないでください
- ❌ `.env` ファイルを公開リポジトリにコミットしないでください
- ✅ 本番環境では環境変数を使用してください

### **本番環境での設定**:

```bash
# Railway環境変数（自動設定）
DATABASE_URL=postgresql://...

# または Railway CLI経由で実行
railway run npm start
```

---

## 📖 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | テーブル定義（シングルテナント） |
| [MULTITENANT_REDESIGN.md](MULTITENANT_REDESIGN.md) | マルチテナント対応設計 |
| [DATABASE_COMPLETE.md](DATABASE_COMPLETE.md) | データベース構築ガイド |
| [scripts/db/README.md](../scripts/db/README.md) | SQLスクリプト一覧 |

---

## 🎯 次のステップ

接続確認が完了したら:

1. **シングルテナント構築**: `scripts/db/setup_all.sh` を実行
2. **マルチテナント構築**: `scripts/db/setup_multitenant.sh` を実行
3. **バックエンドAPI実装**: データベース接続をExpress APIに統合

詳細は各ドキュメントを参照してください。
