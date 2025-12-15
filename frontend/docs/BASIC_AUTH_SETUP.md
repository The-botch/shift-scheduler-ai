# Basic認証 設定ガイド

## 目次

1. [概要](#概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [環境変数の詳細](#環境変数の詳細)
4. [ローカル環境での設定](#ローカル環境での設定)
5. [Vercelでの設定（Staging/Production）](#vercelでの設定stagingproduction)
6. [動作確認方法](#動作確認方法)
7. [トラブルシューティング](#トラブルシューティング)
8. [セキュリティのベストプラクティス](#セキュリティのベストプラクティス)

---

## 概要

このアプリケーションでは、Vercel Edge Middlewareを使用したBasic認証を実装しています。

### 主な機能

- 複数のユーザー/パスワードペアをサポート
- セッション管理による再認証の頻度制御
- 環境ごとの柔軟な設定（ローカル、Staging、Production）
- Cookie-basedセッション管理

### 対応環境

- ローカル開発環境（`.env`ファイル）
- Vercel Staging環境（Preview Deployments）
- Vercel Production環境

---

## アーキテクチャ

このプロジェクトでは、環境に応じて異なるBasic認証の実装を使用します：

- **ローカル開発**: Viteプラグイン（`vite-plugin-basic-auth.js`）
- **Vercel本番環境**: Vercel Edge Middleware（`middleware.js`）

### ローカル開発環境（Vite）

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Vite Dev Server                │
│  (vite-plugin-basic-auth.js)    │
│                                 │
│  1. Check BASIC_AUTH_ENABLED    │
│  2. Verify Session Cookie       │
│  3. Check Basic Auth Header     │
│  4. Validate Credentials        │
│  5. Create Session Cookie       │
└────────┬────────────────────────┘
         │
         ▼
    ┌────────┐
    │ Allow  │ ← Valid Session or Credentials
    └────────┘
         │
         ▼
┌─────────────────┐
│  Application    │
└─────────────────┘
```

### Vercel本番環境（Edge Middleware）

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Vercel Edge Middleware         │
│  (middleware.js)                │
│                                 │
│  1. Check BASIC_AUTH_ENABLED    │
│  2. Verify Session Cookie       │
│  3. Check Basic Auth Header     │
│  4. Validate Credentials        │
│  5. Create Session Cookie       │
└────────┬────────────────────────┘
         │
         ▼
    ┌────────┐
    │ Allow  │ ← Valid Session or Credentials
    └────────┘
         │
         ▼
┌─────────────────┐
│  Application    │
└─────────────────┘
```

### セッション管理の流れ

1. **初回アクセス**: ユーザーがBasic認証を求められる
2. **認証成功**: セッションCookieが発行される（有効期限付き）
3. **再アクセス**: Cookieが有効な間は認証スキップ
4. **期限切れ**: 再度Basic認証が必要

---

## 環境変数の詳細

### BASIC_AUTH_ENABLED

Basic認証の有効/無効を制御します。

| 値 | 説明 | 推奨環境 |
|---|---|---|
| `true` | Basic認証を有効化 | Staging, Production |
| `false` | Basic認証を無効化 | Local Development |

**例:**
```bash
BASIC_AUTH_ENABLED=true
```

---

### BASIC_AUTH_CREDENTIALS

複数のユーザー認証情報をJSON配列形式で設定します。

**形式:**
```json
[
  {"username": "ユーザー名1", "password": "パスワード1"},
  {"username": "ユーザー名2", "password": "パスワード2"}
]
```

**設定例:**

#### 1ユーザーの場合
```bash
BASIC_AUTH_CREDENTIALS=[{"username":"admin","password":"SecurePass123!"}]
```

#### 複数ユーザーの場合
```bash
BASIC_AUTH_CREDENTIALS=[{"username":"admin","password":"AdminPass123!"},{"username":"viewer","password":"ViewerPass456!"}]
```

#### 環境別の推奨設定

**ローカル開発:**
```bash
BASIC_AUTH_CREDENTIALS=[{"username":"dev","password":"dev123"}]
```

**Staging:**
```bash
BASIC_AUTH_CREDENTIALS=[{"username":"staging-admin","password":"St@gingP@ss2024"},{"username":"staging-viewer","password":"View3r!2024"}]
```

**Production:**
```bash
BASIC_AUTH_CREDENTIALS=[{"username":"prod-admin","password":"Pr0d!SecureP@ss2024"},{"username":"prod-viewer","password":"Pr0dView3r!2024"}]
```

---

### BASIC_AUTH_SESSION_DURATION

セッションの有効期限をミリ秒単位で設定します。

| 期間 | ミリ秒 | 用途 |
|---|---|---|
| 30分 | 1800000 | 高セキュリティが必要な環境 |
| 1時間 | 3600000 | デフォルト（推奨） |
| 2時間 | 7200000 | 開発・テスト環境 |
| 24時間 | 86400000 | 低頻度アクセスの環境 |

**例:**
```bash
# 1時間（デフォルト）
BASIC_AUTH_SESSION_DURATION=3600000

# 30分（セキュリティ重視）
BASIC_AUTH_SESSION_DURATION=1800000

# 8時間（業務時間中）
BASIC_AUTH_SESSION_DURATION=28800000
```

---

## ローカル環境での設定

ローカル開発環境では、Viteプラグイン（`vite-plugin-basic-auth.js`）が`.env`ファイルから環境変数を読み込んでBasic認証を提供します。

### 1. `.env`ファイルの編集

プロジェクトルートの`.env`ファイルを開き、以下を設定します。

```bash
# Basic Authentication Configuration
BASIC_AUTH_ENABLED=true
BASIC_AUTH_CREDENTIALS=[{"username":"dev","password":"dev123"}]
BASIC_AUTH_SESSION_DURATION=3600000
```

### 2. 開発サーバーの起動（または再起動）

**重要**: `.env`ファイルを変更した場合は、開発サーバーを再起動する必要があります。

```bash
# サーバーが起動している場合は Ctrl+C で停止してから
npm run dev
```

### 3. ブラウザでアクセス

`http://localhost:5173` にアクセスすると、Basic認証ダイアログが表示されます。

- ユーザー名: `dev`
- パスワード: `dev123`

### 4. 認証を無効化する場合

開発中に認証を無効化したい場合:

```bash
BASIC_AUTH_ENABLED=false
```

**注意**: 設定を変更した後は、必ず開発サーバーを再起動してください。

---

## Vercelでの設定（Staging/Production）

### 1. Vercelダッシュボードにアクセス

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. 対象プロジェクトを選択
3. **Settings** タブをクリック
4. 左メニューから **Environment Variables** を選択

### 2. 環境変数の追加

#### Staging環境（Preview）の設定

| 変数名 | 値 | 環境 |
|---|---|---|
| `BASIC_AUTH_ENABLED` | `true` | Preview |
| `BASIC_AUTH_CREDENTIALS` | `[{"username":"staging-user","password":"YourStagingPassword123!"}]` | Preview |
| `BASIC_AUTH_SESSION_DURATION` | `3600000` | Preview |

**設定手順:**

1. **Add New** ボタンをクリック
2. **Name**: `BASIC_AUTH_ENABLED`
3. **Value**: `true`
4. **Environment**: `Preview` にチェック
5. **Save** をクリック

同様に残りの変数も追加します。

#### Production環境の設定

| 変数名 | 値 | 環境 |
|---|---|---|
| `BASIC_AUTH_ENABLED` | `true` | Production |
| `BASIC_AUTH_CREDENTIALS` | `[{"username":"prod-admin","password":"YourProductionPassword123!"}]` | Production |
| `BASIC_AUTH_SESSION_DURATION` | `3600000` | Production |

**設定手順:**

1. **Add New** ボタンをクリック
2. **Name**: `BASIC_AUTH_ENABLED`
3. **Value**: `true`
4. **Environment**: `Production` にチェック
5. **Save** をクリック

### 3. デプロイの実行

環境変数を設定した後、再デプロイが必要です。

#### Staging（Preview）の場合
```bash
git push origin staging
```
自動的にPreview Deploymentが作成されます。

#### Productionの場合
```bash
git push origin main
```
または、Vercelダッシュボードから **Redeploy** をクリック。

### 4. 複数ユーザーの設定例

Productionで管理者と閲覧者の2つのアカウントを設定する場合:

```bash
BASIC_AUTH_CREDENTIALS=[{"username":"admin","password":"AdminSecure123!"},{"username":"viewer","password":"ViewerPass456!"}]
```

**注意:** JSONの形式が正しいか確認してください。改行やスペースの入れすぎに注意。

---

## 動作確認方法

### ローカル環境

1. `.env`で`BASIC_AUTH_ENABLED=true`に設定
2. `npm run dev`でサーバー起動
3. ブラウザでアクセス
4. Basic認証ダイアログが表示されることを確認
5. 正しい認証情報でログイン
6. アプリケーションにアクセスできることを確認

### Staging/Production環境

1. Vercelダッシュボードで環境変数を設定
2. デプロイ
3. デプロイされたURLにアクセス
4. Basic認証ダイアログが表示されることを確認
5. 設定した認証情報でログイン

### セッションの確認

1. ログイン後、ブラウザの開発者ツールを開く
2. **Application** > **Cookies** を確認
3. `basic-auth-session` Cookieが存在することを確認
4. `Max-Age`が設定した`BASIC_AUTH_SESSION_DURATION`の秒数になっていることを確認

### セッション期限切れのテスト

1. 短いセッション期間を設定（例: 60000ms = 1分）
2. ログイン
3. 1分以上待つ
4. ページをリロード
5. 再度Basic認証が求められることを確認

---

## トラブルシューティング

### Basic認証が表示されない

**原因:**
- `BASIC_AUTH_ENABLED`が`false`になっている
- 環境変数が正しく読み込まれていない

**解決方法:**
1. `.env`ファイル（ローカル）またはVercelの環境変数を確認
2. `BASIC_AUTH_ENABLED=true`になっているか確認
3. ローカルの場合、サーバーを再起動
4. Vercelの場合、再デプロイ

### 認証情報が正しいのにログインできない

**原因:**
- `BASIC_AUTH_CREDENTIALS`のJSON形式が間違っている
- パスワードに特殊文字が含まれている

**解決方法:**
1. JSON形式を確認（`[{"username":"user","password":"pass"}]`）
2. JSONバリデータでチェック: https://jsonlint.com/
3. パスワードに`"`や`\`などの特殊文字がある場合はエスケープ
4. ログを確認（Vercelダッシュボード > Deployments > Function Logs）

### セッションがすぐに切れる

**原因:**
- `BASIC_AUTH_SESSION_DURATION`が短すぎる
- Cookieが正しく保存されていない

**解決方法:**
1. セッション期間を長く設定（例: 3600000）
2. ブラウザのCookie設定を確認
3. HTTPSで接続されているか確認（Productionの場合）

### 複数ユーザーの認証が機能しない

**原因:**
- JSON配列の形式が間違っている

**解決方法:**
```bash
# 正しい例
BASIC_AUTH_CREDENTIALS=[{"username":"user1","password":"pass1"},{"username":"user2","password":"pass2"}]

# 間違った例（改行が含まれている）
BASIC_AUTH_CREDENTIALS=[
  {"username":"user1","password":"pass1"},
  {"username":"user2","password":"pass2"}
]
```

### Vercelで環境変数が反映されない

**原因:**
- 環境変数を追加後、再デプロイしていない

**解決方法:**
1. Vercelダッシュボード > Deployments
2. 最新のデプロイの右側の **...** メニューから **Redeploy**
3. または、新しいコミットをpush

---

## セキュリティのベストプラクティス

### 1. 強力なパスワードの使用

本番環境では必ず強力なパスワードを使用してください。

**推奨:**
- 12文字以上
- 大文字・小文字・数字・記号を含む
- 辞書にない文字列

**良い例:**
```
Pr0d!SecureP@ss2024
St@ging#Secure!2024
```

**悪い例:**
```
password123
admin
test
```

### 2. 環境ごとに異なる認証情報を使用

```bash
# ローカル
BASIC_AUTH_CREDENTIALS=[{"username":"dev","password":"dev123"}]

# Staging
BASIC_AUTH_CREDENTIALS=[{"username":"staging-admin","password":"St@gingP@ss2024"}]

# Production
BASIC_AUTH_CREDENTIALS=[{"username":"prod-admin","password":"Pr0d!SecureP@ss2024"}]
```

### 3. `.env`ファイルをGitにコミットしない

`.gitignore`に以下が含まれていることを確認:

```gitignore
.env
.env.local
.env.*.local
```

### 4. セッション期間の適切な設定

セキュリティとユーザビリティのバランスを考慮:

```bash
# 高セキュリティ環境（30分）
BASIC_AUTH_SESSION_DURATION=1800000

# 標準環境（1時間）
BASIC_AUTH_SESSION_DURATION=3600000

# 低頻度アクセス環境（8時間）
BASIC_AUTH_SESSION_DURATION=28800000
```

### 5. HTTPS接続の使用

Productionでは必ずHTTPSを使用してください。Vercelでは自動的にHTTPSが有効化されます。

### 6. 定期的なパスワード変更

本番環境では定期的にパスワードを変更してください:

1. Vercelダッシュボードで`BASIC_AUTH_CREDENTIALS`を更新
2. 再デプロイ
3. チームメンバーに新しい認証情報を共有

### 7. アクセス権限の分離

管理者と閲覧者で異なる認証情報を使用:

```bash
BASIC_AUTH_CREDENTIALS=[
  {"username":"admin","password":"AdminPass123!"},
  {"username":"viewer","password":"ViewerPass456!"}
]
```

将来的にユーザーごとに権限を分けたい場合、この構成が基盤になります。

### 8. ログの監視

Vercelのログを定期的に確認し、不審なアクセスがないかチェック:

1. Vercelダッシュボード > Deployments
2. Function Logs を確認
3. 認証失敗のログをモニタリング

---

## 関連ファイル

- `vite-plugin-basic-auth.js` - ローカル開発用のViteプラグイン（Basic認証）
- `middleware.js` - Vercel本番環境用のEdge Middleware（Basic認証）
- `vite.config.js` - Vite設定ファイル（プラグインの読み込み）
- `.env` - ローカル環境の環境変数
- `.env.example` - 環境変数のサンプル
- `vercel.json` - Vercelの設定ファイル

## 参考リンク

- [Vercel Edge Middleware Documentation](https://vercel.com/docs/concepts/functions/edge-middleware)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [HTTP Basic Authentication (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|---|---|---|
| 2025-12-16 | 1.1.0 | ローカル開発用Viteプラグインを追加、アーキテクチャセクションを更新 |
| 2025-12-16 | 1.0.0 | 初版作成 |

---

## 問い合わせ

質問や問題がある場合は、開発チームまでお問い合わせください。
