# クイックスタートガイド

## 🚀 今すぐ始める（5分で完了）

リファクタリング作業の**ほとんどは完了**しています。以下の簡単な手順で残りを完了してください。

## ✅ 完了済みの作業

以下のファイルが作成/更新されました:

1. **セキュリティ**
   - `frontend/.env.example` ✅
   - `.gitignore` (環境変数除外) ✅
   - `SECURITY.md` ✅

2. **設定**
   - `frontend/config/default.js` ✅
   - `frontend/.prettierrc` ✅
   - `frontend/eslint.config.js` ✅

3. **バックエンド分離準備**
   - `backend/package.json` ✅

4. **ドキュメント**
   - `docs/ARCHITECTURE.md` ✅
   - `docs/CONFIGURATION.md` ✅
   - `REFACTORING_CHECKLIST.md` ✅

## ⏰ 残り3ステップ（5分）

### Step 1: バックエンドのserver.jsを作成（1分）

```bash
# frontendのserver.jsをbackendにコピー
cp frontend/server.js backend/src/server.js
```

**注意**: backend/src/server.jsでは、ファイルパスを`../frontend/public/data`に変更する必要があります。

または、以下のコマンドで修正:

```bash
# publicディレクトリへのパスを修正
sed -i '' 's|path.join(__dirname, '\''public'\''|path.join(__dirname, '\''../frontend/public'\''|g' backend/src/server.js
```

### Step 2: .envファイルをbackendにコピー（10秒）

```bash
cp frontend/.env backend/.env
```

### Step 3: 依存関係インストールと起動（3分）

```bash
# バックエンド
cd backend
npm install

# 別ターミナルでフロントエンド（既にnode_modulesがある場合はスキップ可）
# cd frontend
# npm install または pnpm install
```

## 🎉 起動

### ターミナル1: バックエンド起動

```bash
cd backend
npm run dev
```

**期待される出力**:
```
🚀 Backend server running on http://localhost:3001
📡 OpenAI API Proxy enabled
```

### ターミナル2: フロントエンド起動

```bash
cd frontend
npm run dev
# または pnpm run dev（pnpmを使用している場合）
```

**期待される出力**:
```
VITE v6.3.5  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## 🔍 動作確認

1. ブラウザで http://localhost:5173 を開く
2. DevToolsページに移動
3. 「Vector Store セットアップ」ボタンをクリック → 成功を確認
4. 「AI シフト生成」を実行 → CSVダウンロードを確認

## 📝 Git Commit（推奨）

すべて正常に動作したら:

```bash
git add .
git commit -m "refactor: プロジェクト構造をリファクタリング

- セキュリティ: .env.exampleを追加、.gitignore更新
- Linter: ESLint + Prettier設定追加
- 設定: config/default.js作成
- バックエンド分離: backend/ディレクトリ作成
- ドキュメント: ARCHITECTURE.md, CONFIGURATION.md追加
"
```

## 🐛 トラブルシューティング

### エラー: Cannot find module 'prettier'

**解決**:
```bash
cd frontend
npm install --save-dev prettier
```

### エラー: Port 3001 already in use

**解決**:
```bash
lsof -ti:3001 | xargs kill -9
```

### エラー: ファイルアップロード失敗

**確認事項**:
1. バックエンドが起動しているか
2. `.env`ファイルにAPIキーが設定されているか
3. `backend/src/server.js`のファイルパスが正しいか

**パス修正が必要な箇所** (backend/src/server.js):
```javascript
// 修正前
const fullPath = path.join(__dirname, 'public', filePath)

// 修正後
const fullPath = path.join(__dirname, '../frontend/public', filePath)
```

```javascript
// 修正前
const generatedDir = path.join(__dirname, 'public', 'data', 'generated')

// 修正後
const generatedDir = path.join(__dirname, '../frontend/public', 'data', 'generated')
```

## 📚 詳細情報

- アーキテクチャ: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 設定方法: [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md)
- 詳細チェックリスト: [`REFACTORING_CHECKLIST.md`](REFACTORING_CHECKLIST.md)

---

**所要時間**: 初回セットアップ約5分
**難易度**: ★☆☆☆☆ (簡単)
