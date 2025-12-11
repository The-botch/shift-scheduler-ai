# Development Guide

このドキュメントでは、Shift Scheduler AI の開発環境のセットアップとローカル開発の手順を説明します。

## 目次

- [必要な環境](#必要な環境)
- [環境構築](#環境構築)
- [ローカル開発](#ローカル開発)
- [デバッグ](#デバッグ)
- [トラブルシューティング](#トラブルシューティング)

## 必要な環境

### 必須

- **Node.js**: v20.13.1 以上
- **npm**: v10.5.2 以上
- **PostgreSQL**: v14 以上
- **Git**: 最新版

### 推奨

- **エディタ**: VS Code（推奨拡張機能あり）
- **ブラウザ**: Chrome/Firefox（開発者ツール使用）
- **ターミナル**: iTerm2（Mac）/ Windows Terminal（Windows）

## 環境構築

### 1. リポジトリのクローン

```bash
# HTTPS
git clone https://github.com/The-botch/shift-scheduler-ai.git

# SSH
git clone git@github.com:The-botch/shift-scheduler-ai.git

cd shift-scheduler-ai
```

### 2. staging ブランチに切り替え

```bash
git checkout staging
git pull origin staging
```

### 3. フロントエンド環境構築

```bash
cd frontend

# 依存パッケージのインストール
npm ci

# 環境変数ファイルの作成
cp .env.example .env

# .env ファイルを編集してバックエンドのURLを設定
# VITE_API_BASE_URL=http://localhost:3001
```

#### フロントエンド環境変数

`.env` ファイルに以下を設定：

```bash
# バックエンドAPI URL
VITE_API_BASE_URL=http://localhost:3001

# その他の環境変数
# VITE_LIFF_ID=your-liff-id
```

### 4. バックエンド環境構築

```bash
cd ../backend

# 依存パッケージのインストール
npm ci

# 環境変数ファイルの作成
cp .env.example .env

# .env ファイルを編集してデータベース接続情報を設定
```

#### バックエンド環境変数

`.env` ファイルに以下を設定：

```bash
# データベース接続情報
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shift_scheduler_dev
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# サーバー設定
PORT=3001
NODE_ENV=development

# OpenAI API（オプション）
OPENAI_API_KEY=your_openai_api_key

# その他の環境変数
# CORS_ORIGIN=http://localhost:5173
```

### 5. データベースセットアップ

#### PostgreSQL のインストール

**Mac（Homebrew）:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### データベース作成

```bash
# PostgreSQL にログイン
psql postgres

# データベース作成
CREATE DATABASE shift_scheduler_dev;

# ユーザー作成（必要に応じて）
CREATE USER your_db_user WITH PASSWORD 'your_db_password';
GRANT ALL PRIVILEGES ON DATABASE shift_scheduler_dev TO your_db_user;

# 終了
\q
```

#### スキーマとデータの投入

```bash
cd backend

# DDLの実行（テーブル作成）
psql -U your_db_user -d shift_scheduler_dev -f scripts/database/ddl/schema.sql

# DMLの実行（初期データ投入）
node scripts/database/setup/setup_tenant3_test_data.mjs
```

### 6. VS Code 拡張機能（推奨）

`.vscode/extensions.json` に推奨拡張機能がリストされています：

- **ESLint**: コードの静的解析
- **Prettier**: コードフォーマッター
- **Tailwind CSS IntelliSense**: Tailwind CSS の入力補完
- **PostgreSQL**: SQL サポート

VS Code で開くと自動的にインストールが促されます。

## ローカル開発

### 開発サーバーの起動

#### フロントエンド

```bash
cd frontend
npm run dev
```

ブラウザで http://localhost:5173 を開きます。

#### バックエンド

```bash
cd backend
npm run dev
```

バックエンドは http://localhost:3001 で起動します。

### 両方を同時に起動

ターミナルを2つ開いて、それぞれで起動します：

```bash
# ターミナル 1
cd frontend && npm run dev

# ターミナル 2
cd backend && npm run dev
```

### ホットリロード

- **フロントエンド**: Vite により自動的にホットリロード
- **バックエンド**: nodemon により自動的に再起動

コードを変更すると、自動的に反映されます。

## デバッグ

### フロントエンド デバッグ

#### ブラウザ開発者ツール

1. Chrome/Firefox で開発者ツールを開く（F12）
2. Console タブでログを確認
3. Network タブで API リクエストを確認
4. React DevTools でコンポーネント構造を確認

#### VS Code デバッガー

`.vscode/launch.json` を作成：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

#### デバッグログの追加

```javascript
// 開発環境のみ
if (import.meta.env.DEV) {
  console.log('Debug:', data)
}
```

### バックエンド デバッグ

#### VS Code デバッガー

`.vscode/launch.json` に追加：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "program": "${workspaceFolder}/backend/src/server.js",
  "cwd": "${workspaceFolder}/backend",
  "env": {
    "NODE_ENV": "development"
  }
}
```

#### ログ出力

```javascript
// 開発環境のみ
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data)
}
```

### データベース デバッグ

#### psql でクエリ確認

```bash
psql -U your_db_user -d shift_scheduler_dev

# テーブル一覧
\dt

# テーブル構造確認
\d shifts

# クエリ実行
SELECT * FROM shifts WHERE store_id = 1 LIMIT 10;
```

#### pgAdmin

GUI ツール pgAdmin を使用すると、視覚的にデータベースを操作できます。

## コード品質チェック

### Lint チェック

```bash
# フロントエンド
cd frontend
npm run lint

# 自動修正
npm run lint:fix
```

### フォーマットチェック

```bash
# フロントエンド
cd frontend
npm run format:check

# 自動フォーマット
npm run format
```

### テスト実行

```bash
# フロントエンド
cd frontend
npm run test

# バックエンド
cd backend
npm run test
```

### ビルドチェック

```bash
# フロントエンド
cd frontend
npm run build
```

## Git フック

Husky による自動チェックが設定されています：

### pre-commit

コミット前に自動実行：
- ESLint
- Prettier
- Tests（変更されたファイルのみ）

### pre-push

プッシュ前に自動実行：
- フロントエンドビルドチェック
- バックエンドシンタックスチェック

## トラブルシューティング

### npm install でエラー

```bash
# node_modules とロックファイルを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### ポートが既に使用中

```bash
# プロセスを確認
lsof -i :5173  # フロントエンド
lsof -i :3001  # バックエンド

# プロセスを終了
kill -9 <PID>
```

### データベース接続エラー

1. PostgreSQL が起動しているか確認
   ```bash
   # Mac
   brew services list

   # Ubuntu
   sudo systemctl status postgresql
   ```

2. `.env` ファイルの接続情報を確認

3. データベースが存在するか確認
   ```bash
   psql -l
   ```

### ホットリロードが効かない

1. ブラウザのキャッシュをクリア
2. 開発サーバーを再起動
3. `node_modules` を削除して再インストール

### ESLint/Prettier エラー

```bash
# 設定ファイルを確認
cat .eslintrc.json
cat .prettierrc

# 自動修正を試す
npm run lint:fix
npm run format
```

### Git pre-commit フックが失敗

```bash
# 手動で lint と format を実行
npm run lint:fix
npm run format

# 再度コミット
git add .
git commit -m "your message"
```

### ビルドエラー

1. 依存関係を確認
   ```bash
   npm ci
   ```

2. TypeScript エラーがないか確認
   ```bash
   npm run lint
   ```

3. 環境変数が正しく設定されているか確認

## 便利なコマンド

### プロジェクト全体

```bash
# すべての依存パッケージを更新
cd frontend && npm update && cd ../backend && npm update

# プロジェクト全体の統計
cloc . --exclude-dir=node_modules,dist,build
```

### データベース

```bash
# データベースのバックアップ
pg_dump -U your_db_user shift_scheduler_dev > backup.sql

# データベースのリストア
psql -U your_db_user shift_scheduler_dev < backup.sql

# データベースのリセット
dropdb shift_scheduler_dev
createdb shift_scheduler_dev
psql -U your_db_user -d shift_scheduler_dev -f scripts/database/ddl/schema.sql
```

### Git

```bash
# 未追跡ファイルを確認
git status

# 変更を一時退避
git stash

# 退避した変更を戻す
git stash pop

# ブランチの履歴を確認
git log --oneline --graph --all
```

## 開発時のベストプラクティス

### コミット前

- [ ] ESLint でエラーがないか確認
- [ ] Prettier でフォーマット済みか確認
- [ ] ローカルでテストが通るか確認
- [ ] ビルドが成功するか確認

### プッシュ前

- [ ] 最新の staging をマージ済みか確認
- [ ] コンフリクトがないか確認
- [ ] コミットメッセージが規約に従っているか確認

### PR 作成前

- [ ] ステージング環境で動作確認
- [ ] CI チェックが通ることを確認
- [ ] PR テンプレートに従って記入

## 参考リンク

- [CONTRIBUTING.md](./CONTRIBUTING.md) - コントリビュートガイド
- [CODING_STYLE.md](./CODING_STYLE.md) - コーディングスタイルガイド
- [TESTING.md](./TESTING.md) - テストガイド
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

開発中に問題が発生した場合は、Issue を作成してください。
