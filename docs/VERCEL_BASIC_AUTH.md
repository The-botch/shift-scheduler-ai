# Vercel Basic認証設定ガイド

このドキュメントでは、Vercelにデプロイしたアプリケーションに無料でBasic認証を追加する方法を説明します。

## 概要

- **実装方法**: Vercel Edge Middleware
- **コスト**: 無料（Vercel Freeプランで利用可能）
- **対象環境**: 本番環境のみ（開発環境では無効）

## ファイル構成

```
shift-scheduler-ai/
├── middleware.js          # Basic認証を実装したEdge Middleware
├── vercel.json            # Vercelデプロイ設定
└── docs/
    └── VERCEL_BASIC_AUTH.md  # このドキュメント
```

## セットアップ手順

### 1. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定します。

1. [Vercelダッシュボード](https://vercel.com/dashboard)にアクセス
2. プロジェクトを選択
3. **Settings** → **Environment Variables** に移動
4. 以下の環境変数を追加：

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `BASIC_AUTH_CREDENTIALS` | カンマ区切りの認証情報<br>形式: `user1:pass1,user2:pass2,user3:pass3`<br>例: `admin:secure123,viewer:view456,dev:dev789` | Production |

**重要**:
- 環境は **Production** のみに設定してください
- Preview環境やDevelopment環境には設定しないでください（プレビューでも認証が必要な場合は追加）

### 2. デプロイ

環境変数を設定したら、通常通りデプロイします：

```bash
git push origin main
```

または、Vercelダッシュボードから手動でデプロイします。

### 3. 動作確認

1. デプロイが完了したら、本番URLにアクセス
2. Basic認証ダイアログが表示されることを確認
3. 設定したユーザー名とパスワードでログイン
4. アプリケーションが表示されることを確認

## 仕組み

### middleware.js

```javascript
// 本番環境でのみBasic認証を有効化
if (process.env.NODE_ENV === 'development') {
  return NextResponse.next()  // 開発環境ではスキップ
}

// 環境変数から認証情報を取得（カンマ区切り）
// フォーマット: "user1:pass1,user2:pass2,user3:pass3"
const credentials = process.env.BASIC_AUTH_CREDENTIALS

// 環境変数が未設定の場合はスキップ
if (!credentials) {
  return NextResponse.next()
}

// 認証情報をパースして有効なユーザーリストを作成
const validUsers = {}
credentials.split(',').forEach(cred => {
  const [user, password] = cred.split(':')
  if (user && password) {
    validUsers[user.trim()] = password.trim()
  }
})

// Authorizationヘッダーをチェック
// 認証成功 → アクセス許可
// 認証失敗 → 401 Unauthorized + WWW-Authenticate ヘッダー
```

### 特徴

1. **開発環境では無効**: ローカル開発時は認証なしでアクセス可能
2. **環境変数未設定でも動作**: 環境変数が設定されていない場合は認証をスキップ
3. **全ページ保護**: `matcher: '/:path*'` で全てのパスを保護
4. **無料**: Vercel Freeプランで利用可能

## トラブルシューティング

### 認証ダイアログが表示されない

**原因**: 環境変数が設定されていないか、開発環境で実行している

**解決方法**:
1. Vercelダッシュボードで環境変数が正しく設定されているか確認
2. 本番環境（Production）で実行されているか確認
3. デプロイ後、環境変数を変更した場合は再デプロイが必要

### 正しいパスワードでもログインできない

**原因**: 環境変数の値が正しくない、またはキャッシュの問題

**解決方法**:
1. Vercelダッシュボードで環境変数の値を確認（スペースや改行が含まれていないか）
2. ブラウザのキャッシュをクリア
3. シークレットモードで試す
4. 環境変数を再設定して再デプロイ

### ビルドエラーが発生する

**原因**: `middleware.js` が Next.js の構文を使用している

**解決方法**:
このプロジェクトはVite+Reactなので、Next.jsの依存関係は不要です。
`middleware.js` は Vercel Edge Runtimeで実行されるため、Next.jsがインストールされていなくても動作します。

ただし、ビルドエラーが発生する場合は、`package.json` に `next` を追加する必要があるかもしれません：

```bash
cd frontend
npm install next --save-dev
```

## セキュリティに関する注意事項

1. **強力なパスワードを使用**: 簡単に推測できるパスワードは避けてください
2. **定期的な変更**: パスワードは定期的に変更することを推奨
3. **環境変数の管理**: `.env` ファイルにパスワードを記載しないでください
4. **HTTPS必須**: Vercelは自動的にHTTPSを提供しますが、カスタムドメインでも必ずHTTPSを使用してください

## Basic認証の制限事項

- **ユーザー管理不可**: 単一のユーザー名/パスワードのみ
- **セッション管理なし**: ブラウザを閉じるたびに再認証が必要
- **高度な認証には不向き**: より高度な認証が必要な場合は、Auth0やNextAuth.jsなどを検討してください

## より高度な認証への移行

Basic認証は簡易的な保護には十分ですが、本格的なユーザー認証が必要な場合は以下を検討してください：

- **Auth0**: エンタープライズグレードの認証サービス
- **Firebase Authentication**: Googleが提供する認証サービス
- **NextAuth.js**: Next.js向けの認証ライブラリ（ただしこのプロジェクトはVite+React）
- **Supabase Auth**: オープンソースのFirebase代替

## 参考リンク

- [Vercel Edge Middleware](https://vercel.com/docs/concepts/functions/edge-middleware)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [HTTP Basic Authentication (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)
