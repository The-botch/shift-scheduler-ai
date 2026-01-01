# データベースバックアップガイド

本番環境のデータベースを定期的にバックアップするための仕組みです。

## 📋 目次

- [Phase 1: ローカル手動実行（現在）](#phase-1-ローカル手動実行現在)
- [Phase 2: SharePoint自動アップロード（将来）](#phase-2-sharepoint自動アップロード将来)
- [移行手順](#移行手順)
- [トラブルシューティング](#トラブルシューティング)

---

## Phase 1: ローカル手動実行（現在）

**目的:** SharePointの承認待ちの間、手動でバックアップを取得してローカルに保存

### 前提条件

1. **PostgreSQLクライアントのインストール**

   ```bash
   # macOS
   brew install postgresql

   # Ubuntu/Debian
   sudo apt-get install postgresql-client

   # Windows
   # https://www.postgresql.org/download/windows/ からインストール
   ```

2. **本番環境のDATABASE_URLの取得**
   - Railwayダッシュボードにアクセス
   - Production環境のPostgreSQLサービスを選択
   - `DATABASE_URL` をコピー

### 使い方

#### 方法1: 環境変数ファイルを使う（推奨）

1. **プロジェクトルートの `.env` ファイル**に本番DBのURLを追加：

   **ファイルパス**: `shift-scheduler-ai/.env`（プロジェクトルート）

   ```
   shift-scheduler-ai/          ← プロジェクトルート
   ├── .env                     ← ここに設定！
   ├── backend/
   │   └── .env                 ← ここではない
   ├── frontend/
   │   └── .env                 ← ここでもない
   ├── scripts/
   │   └── backup/
   └── package.json
   ```

   ```bash
   # shift-scheduler-ai/.env
   DATABASE_URL_PRODUCTION=postgresql://user:password@host:port/database
   ```

   ⚠️ **重要**: `backend/.env` や `frontend/.env` ではなく、**プロジェクトルートの `.env`** に設定してください。

2. バックアップを実行：

   ```bash
   npm run bk:prod
   ```

#### 方法2: コマンド実行時に指定

```bash
DATABASE_URL_PRODUCTION="postgresql://user:password@host:port/database" npm run bk:prod
```

### バックアップファイルの保存場所

バックアップファイルは `backups/` ディレクトリに**タイムスタンプごとのフォルダ**として保存され、各フォルダ内に**スキーマごとのdmpファイル**が格納されます：

```
shift-scheduler-ai/
├── backups/
│   ├── 2025-12-22-120530/              ← タイムスタンプフォルダ (YYYY-MM-DD-HHMMSS)
│   │   ├── core.dmp                    ← core スキーマ
│   │   ├── hr.dmp                      ← hr スキーマ
│   │   ├── ops.dmp                     ← ops スキーマ
│   │   └── analytics.dmp               ← analytics スキーマ
│   ├── 2025-12-01-100000/              ← 前回のバックアップ
│   │   ├── core.dmp
│   │   ├── hr.dmp
│   │   ├── ops.dmp
│   │   └── analytics.dmp
│   └── ...
```

**フォルダ名の形式:**
- `YYYY-MM-DD-HHMMSS` 形式のタイムスタンプ
- 例: `2025-12-22-120530` = 2025年12月22日 12時05分30秒

**バックアップ対象のスキーマ:**
- `core` - コアテーブル
- `hr` - 人事関連テーブル
- `ops` - オペレーション関連テーブル
- `analytics` - 分析関連テーブル

**ファイル形式:**
- `.dmp` 形式（PostgreSQLカスタムフォーマット）
- `pg_restore` コマンドでリストア可能

### 実行結果の例

```bash
$ npm run bk:prod

🚀 データベースバックアップを開始します...
📅 日時: 2025/12/22 12:05:30
📋 対象スキーマ: core, hr, ops, analytics
📂 保存フォルダ: 2025-12-22-120530

📁 バックアップディレクトリを作成: /path/to/backups/2025-12-22-120530
💾 スキーマ「core」をバックアップ中...
✅ core: 45.23 MB
💾 スキーマ「hr」をバックアップ中...
✅ hr: 32.15 MB
💾 スキーマ「ops」をバックアップ中...
✅ ops: 28.67 MB
💾 スキーマ「analytics」をバックアップ中...
✅ analytics: 19.38 MB

📊 バックアップ結果サマリー:

✅ 成功: 4/4 スキーマ
   - core: 45.23 MB
   - hr: 32.15 MB
   - ops: 28.67 MB
   - analytics: 19.38 MB

📍 保存場所: /path/to/backups/2025-12-22-120530

📋 既存のバックアップ:

  ✨ 2025-12-22-120530 [最新]
     合計: 125.43 MB (4 スキーマ)
     - core: 45.23 MB
     - hr: 32.15 MB
     - ops: 28.67 MB
     - analytics: 19.38 MB

     2025-12-01-100000
     合計: 120.70 MB (4 スキーマ)
     - core: 43.10 MB
     - hr: 31.20 MB
     - ops: 27.50 MB
     - analytics: 18.90 MB

💡 ヒント: 古いバックアップフォルダは手動で削除してください
```

### 推奨スケジュール

月2回のバックアップを推奨します：
- **毎月1日** と **15日**
- カレンダーにリマインダーを設定

---

### バックアップのリストア方法

dmpファイルから特定のスキーマをリストアする場合：

```bash
# 特定のバックアップフォルダを指定
BACKUP_FOLDER="2025-12-22-120530"

# 特定のスキーマをリストア（例: core スキーマ）
pg_restore -d "postgresql://user:password@host:port/database" \
  -n core \
  --clean \
  backups/${BACKUP_FOLDER}/core.dmp

# または、全スキーマを一括でリストア
pg_restore -d "postgresql://user:password@host:port/database" \
  --clean \
  backups/${BACKUP_FOLDER}/core.dmp

pg_restore -d "postgresql://user:password@host:port/database" \
  --clean \
  backups/${BACKUP_FOLDER}/hr.dmp

pg_restore -d "postgresql://user:password@host:port/database" \
  --clean \
  backups/${BACKUP_FOLDER}/ops.dmp

pg_restore -d "postgresql://user:password@host:port/database" \
  --clean \
  backups/${BACKUP_FOLDER}/analytics.dmp
```

**全スキーマを一括でリストアするスクリプト例:**

```bash
#!/bin/bash
BACKUP_FOLDER="2025-12-22-120530"
DATABASE_URL="postgresql://user:password@host:port/database"

for schema in core hr ops analytics; do
  echo "リストア中: ${schema}"
  pg_restore -d "${DATABASE_URL}" --clean backups/${BACKUP_FOLDER}/${schema}.dmp
done
```

**オプション説明:**
- `-d`: 接続先データベースURL
- `-n`: リストアするスキーマ名
- `--clean`: リストア前に既存のオブジェクトを削除

⚠️ **注意**: `--clean` オプションは既存データを削除するため、本番環境での使用は十分注意してください。

---

## Phase 2: SharePoint自動アップロード（将来）

**目的:** GitHub Actionsで自動実行し、SharePointに保存

### 実装内容

1. **GitHub Actionsで自動実行**
   - スケジュール: 毎月1日と15日の午前3時（JST）
   - 手動実行も可能

2. **SharePointに自動アップロード**
   - Microsoft Graph APIを使用
   - Azure AD認証

3. **通知機能**
   - 成功時: Slackまたはメール通知（オプション）
   - 失敗時: アラート通知

### 必要な準備（承認後に実施）

#### 1. Azure ADアプリケーションの登録

1. **Azure Portalにアクセス**
   - https://portal.azure.com

2. **アプリケーションを登録**
   - 「Azure Active Directory」→「アプリの登録」→「新規登録」
   - 名前: `GitHub-DB-Backup-to-SharePoint`
   - 「登録」をクリック

3. **認証情報を取得**
   - アプリケーション (クライアント) ID
   - ディレクトリ (テナント) ID
   - クライアントシークレット（「証明書とシークレット」で作成）

4. **SharePointへのアクセス許可を付与**
   - 「APIのアクセス許可」→「アクセス許可の追加」
   - 「Microsoft Graph」→「アプリケーションの許可」
   - 以下を追加:
     - `Sites.ReadWrite.All`
     - `Files.ReadWrite.All`
   - 「管理者の同意を付与」をクリック

#### 2. GitHub Secretsの設定

GitHubリポジトリの Settings → Secrets and variables → Actions で以下を追加：

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `DATABASE_URL_PRODUCTION` | 本番DBのURL | `postgresql://user:pass@host:5432/db` |
| `AZURE_TENANT_ID` | Azure ADテナントID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `AZURE_CLIENT_ID` | Azure ADクライアントID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `AZURE_CLIENT_SECRET` | Azure ADクライアントシークレット | `xxxxxxxxxxxxxxxxxxxxx` |
| `SHAREPOINT_SITE_URL` | SharePointサイトURL | `https://company.sharepoint.com/sites/backups` |
| `SHAREPOINT_FOLDER_PATH` | 保存先フォルダパス | `Shared Documents/DB-Backups` |

#### 3. ワークフローファイルの有効化

`.github/workflows/db-backup-to-sharepoint.yml` のコメントアウトを解除して有効化します。

---

## 移行手順

### Phase 1 → Phase 2 への移行（SharePoint承認後）

#### ステップ1: Azure AD設定（15分）
1. Azure ADアプリケーションを登録
2. SharePointへのアクセス許可を付与
3. 認証情報（テナントID、クライアントID、シークレット）を取得

#### ステップ2: GitHub Secrets設定（5分）
1. GitHubリポジトリの Settings を開く
2. Secrets and variables → Actions
3. 上記6つのSecretを追加

#### ステップ3: SharePointフォルダ作成（5分）
1. SharePointサイトにアクセス
2. バックアップ用フォルダを作成（例: `DB-Backups`）
3. フォルダパスをメモ

#### ステップ4: ワークフロー有効化（2分）
1. `.github/workflows/db-backup-to-sharepoint.yml` を編集
2. ファイル先頭の無効化コメントを削除
3. コミット & プッシュ

#### ステップ5: テスト実行（5分）
1. GitHubの Actions タブを開く
2. 「Database Backup to SharePoint」を選択
3. 「Run workflow」で手動実行
4. 実行ログを確認
5. SharePointにファイルがアップロードされたか確認

**所要時間: 約30分**

---

## トラブルシューティング

### エラー: `pg_dump: command not found`

**原因:** PostgreSQLクライアントがインストールされていない

**解決策:**
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

---

### エラー: `DATABASE_URL が設定されていません`

**原因:** 環境変数が設定されていない、または間違った場所に設定している

**解決策:**

1. **プロジェクトルートの `.env` ファイル**に `DATABASE_URL_PRODUCTION` を追加

   ```bash
   # shift-scheduler-ai/.env（プロジェクトルート）
   DATABASE_URL_PRODUCTION=postgresql://user:password@host:port/database
   ```

2. ファイルの場所を確認：
   ```bash
   # プロジェクトルートにいることを確認
   ls -la .env

   # .envファイルが存在しない場合は作成
   touch .env
   ```

3. または、コマンド実行時に環境変数を指定：
   ```bash
   DATABASE_URL_PRODUCTION="postgresql://..." npm run bk:prod
   ```

⚠️ **よくある間違い**: `backend/.env` や `frontend/.env` に設定しても読み込まれません。必ず**プロジェクトルートの `.env`** に設定してください。

---

### バックアップファイルが大きすぎる

**原因:** データベースのサイズが大きい

**解決策:**
- 圧縮してから保存:
  ```bash
  # スクリプトを修正して gzip で圧縮
  pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_FILE}.gz"
  ```
- 古いデータを定期的にアーカイブ

---

### SharePointアップロードが失敗する（Phase 2）

**原因1:** Azure ADの権限が不足

**解決策:**
- Azure Portalで `Sites.ReadWrite.All` と `Files.ReadWrite.All` が付与されているか確認
- 管理者の同意が付与されているか確認

**原因2:** GitHub Secretsの設定ミス

**解決策:**
- 各Secretの値を再確認
- 特に `AZURE_CLIENT_SECRET` は表示されないので注意

---

## セキュリティ上の注意

1. **`.env` ファイルをGitにコミットしない**
   - すでに `.gitignore` に追加済み
   - 本番DBのURLが含まれるため特に注意

2. **バックアップファイルをGitにコミットしない**
   - `backups/` ディレクトリは `.gitignore` に追加済み
   - バックアップファイルには本番データが含まれるため特に注意

3. **本番DBのURLは厳重に管理**
   - 他人と共有しない
   - ローカルマシンのセキュリティを確保
   - 必要なメンバーのみがアクセスできるようにする

4. **古いバックアップフォルダの削除**
   - 定期的にローカルの古いバックアップフォルダを削除
   - ディスク容量とセキュリティの観点から重要
   - 最低3ヶ月分のみ保持することを推奨

   ```bash
   # 古いバックアップフォルダを削除する例
   rm -rf backups/2024-10-*

   # または、特定の日付以前を削除
   find backups/ -type d -name "2024-*" -exec rm -rf {} +
   ```

---

## よくある質問

### Q: バックアップの頻度はどのくらいが適切？

A: 本番環境のデータの重要度と更新頻度によりますが、**月2回（1日と15日）**を推奨します。より頻繁なバックアップが必要な場合は、Phase 2移行後にスケジュールを調整できます。

### Q: バックアップフォルダが増えてディスク容量を圧迫する場合は？

A: 古いバックアップフォルダを定期的に削除してください。3ヶ月以上前のバックアップは削除しても問題ないケースが多いです。

```bash
# 3ヶ月以上前のバックアップフォルダを削除（例）
# 注意: 実行前に内容を確認してください
ls -la backups/
rm -rf backups/2024-09-*
```

### Q: バックアップフォルダはどのくらい保存すべき？

A: **最低3ヶ月分**を保存することを推奨します。Phase 2では、SharePointに長期保存し、ローカルは最新1-2個のみ保持するのが良いでしょう。

### Q: 特定のスキーマだけバックアップできる？

A: 現在は4つのスキーマ（core, hr, ops, analytics）すべてをバックアップする設計です。特定のスキーマのみが必要な場合は、`scripts/backup/backup-db.mjs` の `SCHEMAS` 配列を編集してください。

```javascript
// バックアップ対象のスキーマ（カスタマイズ可能）
const SCHEMAS = ['core', 'hr']; // 例: coreとhrのみ
```

### Q: Phase 1とPhase 2を併用できる？

A: はい、可能です。Phase 2移行後も、念のためローカルバックアップを取得することをお勧めします（冗長性の確保）。

### Q: 他のストレージ（S3、Azure Blob Storage）への移行は？

A: 設計上、簡単に移行可能です。詳細は開発チームにお問い合わせください。

---

## 関連ファイル

- `scripts/backup/backup-db.mjs` - バックアップスクリプト本体
- `.github/workflows/db-backup-to-sharepoint.yml` - GitHub Actionsワークフロー（Phase 2）
- `scripts/backup/upload-to-sharepoint.mjs` - SharePointアップロードスクリプト（Phase 2）

---

## サポート

質問や問題がある場合は、開発チームまでお問い合わせください。
