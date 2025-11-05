# デプロイガイド

## 🚀 公開手順

### アーキテクチャ概要

```
┌─────────────────┐
│   Vercel        │ ← フロントエンド (React)
│   (無料)        │    https://your-app.vercel.app
└────────┬────────┘
         │ API呼び出し
         ↓
┌─────────────────┐
│   Railway       │ ← バックエンド (Node.js + Express)
│   (無料枠あり)  │    https://your-api.up.railway.app
└────────┬────────┘
         │ DB接続
         ↓
┌─────────────────┐
│   PostgreSQL    │ ← データベース
│   (Railway)     │
└─────────────────┘
```

---

## 1️⃣ バックエンドをRailwayにデプロイ

### 1.1 Railwayアカウント作成

```bash
# https://railway.app にアクセス
# GitHubアカウントでサインアップ
```

### 1.2 新しいプロジェクト作成

```
1. Railway Dashboard → "New Project"
2. "Deploy from GitHub repo" を選択
3. あなたのリポジトリを選択
4. "Add variables" → 環境変数を設定
```

### 1.3 環境変数設定

Railway Dashboardで以下を設定:

```bash
# データベース (Railwayが自動で設定)
DATABASE_URL=${RAILWAY_PROVIDED_DATABASE_URL}

# Node.js設定
NODE_ENV=production
PORT=3001

# LINE Bot設定
LINE_BOT_ENABLED=true
LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_CHANNEL_SECRET=your_secret_here
LIFF_ID=your_liff_id_here

# CORS設定
FRONTEND_URL=https://your-app.vercel.app
```

### 1.4 Railwayの設定ファイル作成

`backend/railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.5 Procfile作成（オプション）

`Procfile`:

```
web: cd backend && npm start
```

### 1.6 デプロイ確認

```bash
# デプロイ後、URLを確認
https://your-api.up.railway.app/health
→ {"status":"ok"} が返ってくればOK
```

---

## 2️⃣ フロントエンドをVercelにデプロイ

### 2.1 Vercelアカウント作成

```bash
# https://vercel.com にアクセス
# GitHubアカウントでサインアップ
```

### 2.2 プロジェクトインポート

```
1. Vercel Dashboard → "Add New" → "Project"
2. あなたのリポジトリを選択
3. 設定:
   - Framework Preset: Vite
   - Root Directory: frontend (重要！)
   - Build Command: npm run build (デフォルト)
   - Output Directory: dist (デフォルト)
   - Install Command: npm install (デフォルト)
```

**重要**: Root Directoryを`frontend`に設定することを忘れないでください。

### 2.3 環境変数設定

Vercel Dashboardで設定:

```bash
VITE_API_URL=https://your-api.up.railway.app
```

### 2.4 frontend/.env.production 作成

```bash
VITE_API_URL=https://your-api.up.railway.app
```

### 2.5 API接続設定を更新

`frontend/src/config/api.js`:

```javascript
export const BACKEND_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### 2.6 デプロイ確認

```bash
# Vercelが自動でデプロイ
# 完了後、URLにアクセス
https://your-app.vercel.app
```

---

## 3️⃣ データベースマイグレーション

### 3.1 Railway CLIインストール

```bash
# Homebrewの場合
brew install railway

# またはnpm
npm install -g @railway/cli
```

### 3.2 Railwayにログイン

```bash
railway login
```

### 3.3 プロジェクトにリンク

```bash
cd /path/to/your/project
railway link
# プロジェクトを選択
```

### 3.4 マイグレーション実行

```bash
# Railway のPostgreSQLに接続
railway run psql $DATABASE_URL

# マイグレーションSQL実行
\i backend/migrations/001_initial_schema.sql
\i backend/migrations/002_add_constraints.sql
# ... 他のマイグレーションも実行
```

または

```bash
# ローカルからマイグレーション実行
cat backend/migrations/*.sql | railway run psql $DATABASE_URL
```

---

## 4️⃣ LINE Webhook URL更新

### 4.1 LINE Developers設定

```
1. LINE Developers Console → チャネル → Messaging API
2. Webhook URL を更新:
   https://your-api.up.railway.app/api/webhook/line
3. Webhookの利用: ON
4. "検証" ボタンをクリックして接続テスト
```

### 4.2 LIFF Endpoint URL更新

```
1. LINE Developers Console → LIFF
2. Endpoint URL を更新:
   https://your-app.vercel.app
```

---

## 5️⃣ 動作確認

### 5.1 バックエンド確認

```bash
# ヘルスチェック
curl https://your-api.up.railway.app/health

# API確認
curl https://your-api.up.railway.app/api/stores
```

### 5.2 フロントエンド確認

```
1. https://your-app.vercel.app にアクセス
2. ログインできるか確認
3. データが表示されるか確認
```

### 5.3 LINE連携確認

```
1. LINEグループでBotにメッセージ送信
2. リッチメニューからLIFFアプリ起動
3. シフト希望登録
4. データがDBに保存されているか確認
```

---

## 🔧 トラブルシューティング

### エラー: CORS policy error

**原因**: バックエンドのCORS設定が間違っている

**対処**:
```javascript
// backend/src/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### エラー: Database connection failed

**原因**: DATABASE_URLが正しく設定されていない

**対処**:
```bash
# Railway Dashboard → Variables → DATABASE_URL を確認
# 正しいPostgreSQL接続文字列が設定されているか確認
```

### エラー: Build failed on Vercel

**原因**: ビルド設定が間違っている

**対処**:
```bash
# vercel.json を確認
# または Vercel Dashboard → Settings → Build & Development Settings
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

### エラー: LINE Webhook verification failed

**原因**: Webhook URLが間違っているか、署名検証が失敗

**対処**:
```bash
# 1. URLが正しいか確認
curl https://your-api.up.railway.app/api/webhook/line/health

# 2. 環境変数確認
Railway Dashboard → Variables
LINE_CHANNEL_SECRET が正しく設定されているか
```

---

## 📊 コスト見積もり

### Vercel (フロントエンド)
```
フリープラン: 無料
- 100GB帯域幅/月
- 自動HTTPS
- カスタムドメイン対応
```

### Railway (バックエンド + DB)
```
フリープラン: $5 クレジット/月
- 実行時間: 500時間/月
- メモリ: 512MB
- PostgreSQL: 1GB

推定コスト:
- 小規模 (10人以下): 無料枠内
- 中規模 (50人程度): $5-20/月
- 大規模 (100人以上): $20-50/月
```

### LINE Messaging API
```
フリープラン: 無料
- メッセージ送信: 500通/月

プロプラン: ¥5,000/月
- メッセージ送信: 30,000通/月
```

---

## 🔒 セキュリティチェックリスト

- [ ] 環境変数に秘密情報を設定（コミットしない）
- [ ] HTTPS強制（Vercel/Railwayは自動対応）
- [ ] CORS設定を本番URLに限定
- [ ] LINE Webhook署名検証を有効化
- [ ] データベース接続にSSL使用
- [ ] 本番環境でデバッグログを無効化
- [ ] レート制限を設定

---

## 🚀 継続的デプロイ (CI/CD)

### GitHubプッシュで自動デプロイ

```bash
# mainブランチにpush
git add .
git commit -m "Update feature"
git push origin main

# Vercel と Railway が自動でデプロイ
# 数分後に本番環境に反映
```

### デプロイステータス確認

```bash
# Vercel
https://vercel.com/your-username/your-project/deployments

# Railway
https://railway.app/project/your-project
```

---

## 📝 カスタムドメイン設定（オプション）

### フロントエンド (Vercel)

```
1. Vercel Dashboard → Settings → Domains
2. カスタムドメインを追加
   例: shift-scheduler.yourdomain.com
3. DNSレコードを設定
   - Type: CNAME
   - Name: shift-scheduler
   - Value: cname.vercel-dns.com
```

### バックエンド (Railway)

```
1. Railway Dashboard → Settings → Domains
2. カスタムドメインを追加
   例: api.yourdomain.com
3. DNSレコードを設定
   - Type: CNAME
   - Name: api
   - Value: your-project.up.railway.app
```

---

## ✅ デプロイ完了チェックリスト

- [ ] バックエンドがRailwayで動作
- [ ] データベースマイグレーション完了
- [ ] フロントエンドがVercelで動作
- [ ] APIとフロントエンドの接続確認
- [ ] LINE Webhook URL更新
- [ ] LIFF Endpoint URL更新
- [ ] 環境変数すべて設定
- [ ] HTTPS動作確認
- [ ] 実際のユーザーで動作テスト

---

## 🆘 サポート

問題が発生した場合:

1. **ログ確認**
   ```bash
   # Railway
   railway logs

   # Vercel
   vercel logs
   ```

2. **公式ドキュメント**
   - Vercel: https://vercel.com/docs
   - Railway: https://docs.railway.app

3. **コミュニティ**
   - Railway Discord: https://discord.gg/railway
   - Vercel Discord: https://discord.gg/vercel
