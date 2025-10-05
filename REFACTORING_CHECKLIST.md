# リファクタリング実施チェックリスト

このファイルは、リファクタリング作業の進捗を管理するためのチェックリストです。

## ✅ 完了済み

- [x] PR#0: セキュリティ対策
  - [x] `.env.example`作成
  - [x] `.gitignore`更新（環境変数除外）
  - [x] `SECURITY.md`作成
  - [x] `.gitkeep`追加（generatedディレクトリ保持用）

- [x] Linter/Formatter設定ファイル作成
  - [x] `.prettierrc`作成
  - [x] `eslint.config.js`作成（ESLint 9対応）

- [x] ドキュメント作成
  - [x] `docs/ARCHITECTURE.md`作成
  - [x] `docs/CONFIGURATION.md`作成
  - [x] `README.md`更新
  - [x] このチェックリスト作成

- [x] 自動化スクリプト作成
  - [x] `scripts/refactor.sh`作成

## ⏳ 実施が必要な作業

以下の作業を **順番に** 実行してください:

### Step 1: Prettier導入（5分）

```bash
cd frontend
pnpm add -D prettier
```

### Step 2: package.jsonスクリプト追加（手動編集）

`frontend/package.json`の`scripts`セクションに以下を追加:

```json
"scripts": {
  "dev": "vite",
  "server": "node server.js",
  "build": "vite build",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write \"src/**/*.{js,jsx,json,css,md}\"",
  "format:check": "prettier --check \"src/**/*.{js,jsx,json,css,md}\"",
  "preview": "vite preview",
  "deploy": "npm run build && npx gh-pages -d dist"
}
```

### Step 3: リファクタリングスクリプト実行（10分）

```bash
cd scripts
chmod +x refactor.sh
bash refactor.sh
```

このスクリプトは以下を実行します:
- 設定ファイル(`config/default.js`)作成
- バックエンド分離(`backend/`ディレクトリ作成)
- README.md更新

### Step 4: バックエンド依存関係インストール（5分）

```bash
cd backend
npm install
```

### Step 5: .envファイル確認

`backend/.env`が存在することを確認:
```bash
ls -la backend/.env
```

存在しない場合はfrontendからコピー:
```bash
cp frontend/.env backend/.env
```

### Step 6: 動作確認（15分）

#### 6-1. バックエンド起動

```bash
cd backend
npm run dev
```

**期待される出力**:
```
🚀 Backend server running on http://localhost:3001
📡 OpenAI API Proxy enabled
```

#### 6-2. フロントエンド起動（別ターミナル）

```bash
cd frontend
pnpm run dev
```

**期待される出力**:
```
VITE v6.3.5  ready in xxx ms

➜  Local:   http://localhost:5173/
```

#### 6-3. 動作テスト

1. ブラウザで http://localhost:5173 を開く
2. DevToolsページに移動
3. 「Vector Store セットアップ」ボタンをクリック
4. 成功メッセージが表示されることを確認
5. 「AI シフト生成」を試す
6. CSVがダウンロードできることを確認

### Step 7: Git commit（5分）

すべてが正常に動作することを確認したら:

```bash
cd /path/to/shift-scheduler-ai

# 変更を確認
git status

# すべてをステージング
git add .

# コミット
git commit -m "refactor: プロジェクト構造をリファクタリング

- セキュリティ対策: .envをGit管理外に
- Linter/Formatter導入: ESLint + Prettier
- 設定の外部化: config/default.js作成
- バックエンド分離: backend/ディレクトリ作成
- ドキュメント整備: ARCHITECTURE.md, CONFIGURATION.md追加"
```

### Step 8: Git履歴から.envを削除（オプション、20分）

**⚠️ 警告**: この操作は破壊的です。実行前に必ずバックアップを取ってください。

```bash
# 方法1: git-filter-repo使用（推奨）
pip3 install git-filter-repo
git filter-repo --path frontend/.env --invert-paths --force

# 方法2: BFG Repo-Cleaner
brew install bfg
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# リモートにforce push
git push origin --force --all
```

## 📝 オプショナルな改善（時間があれば）

- [ ] TypeScript化
  - [ ] `tsconfig.json`作成
  - [ ] 段階的に`.js`→`.ts`変換

- [ ] テスト整備
  - [ ] Vitest導入
  - [ ] ユニットテスト作成（カバレッジ70%目標）
  - [ ] E2Eテスト（Playwright）

- [ ] CI/CD構築
  - [ ] `.github/workflows/ci.yml`作成
  - [ ] `.github/workflows/deploy.yml`作成

- [ ] Docker化
  - [ ] `Dockerfile`作成
  - [ ] `docker-compose.yml`作成

## 🎯 最終確認チェックリスト

リファクタリング完了時に以下をすべて確認:

- [ ] `.env`ファイルがGit管理外になっている
- [ ] `.env.example`が存在し、最新の環境変数を反映している
- [ ] `pnpm run dev`でフロントエンドが起動する
- [ ] `npm run dev`（backend）でバックエンドが起動する
- [ ] Vector Storeセットアップが正常に動作する
- [ ] AIシフト生成が正常に動作する
- [ ] 生成されたCSVファイルが`frontend/public/data/generated/`に保存される
- [ ] `docs/ARCHITECTURE.md`が存在する
- [ ] `docs/CONFIGURATION.md`が存在する
- [ ] `SECURITY.md`が存在する
- [ ] `README.md`が最新の情報を反映している
- [ ] `backend/`ディレクトリが作成されている
- [ ] `frontend/config/default.js`が存在する
- [ ] ESLintが正常に動作する（`pnpm run lint`）
- [ ] Prettierが正常に動作する（`pnpm run format:check`）

## 🐛 トラブルシューティング

### エラー: pnpm: command not found

**解決策**:
```bash
npm install -g pnpm
```

### エラー: port 3001 already in use

**解決策**:
```bash
# 既存のプロセスを確認
lsof -ti:3001

# プロセスをkill
kill -9 $(lsof -ti:3001)
```

### エラー: Vector Store作成失敗

**解決策**:
1. バックエンドが起動しているか確認
2. `.env`にAPIキーが設定されているか確認
3. ファイルパスが正しいか確認

## 📞 サポート

問題が発生した場合は、以下を確認してください:

1. エラーメッセージ全文
2. ブラウザのコンソールログ
3. バックエンドのコンソールログ
4. `.env`ファイルの内容（APIキーは隠す）

---

**作成日**: 2025-10-05
**最終更新**: 2025-10-05
