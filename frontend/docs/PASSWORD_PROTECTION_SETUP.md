# パスワード保護機能 - セットアップガイド

## 概要

このドキュメントでは、アプリケーションに実装されたクライアントサイドのパスワード保護機能について説明します。

**重要な注意事項**: この機能は**真のセキュリティを提供するものではありません**。軽度の保護（カジュアルユーザーに対する簡易的なアクセス制限）のみを目的としており、機密データの保護には適していません。

## 機能の目的

この機能は以下のような用途に適しています：

- ステージング環境への一般ユーザーのアクセスを制限
- 開発中のプロトタイプへの軽度なアクセス制御
- 検索エンジンのインデックス登録を抑制する補助的な手段

**適さない用途**：
- 機密データの保護
- 本番環境のセキュリティ対策
- 法的要件やコンプライアンス対応
- 真のユーザー認証システム

## セットアップ方法

### 1. 環境変数の設定

#### ローカル開発環境

`.env` ファイルに以下の環境変数を設定します：

```bash
# パスワード保護を有効化
VITE_PASSWORD_PROTECTION_ENABLED=true

# 認証情報の設定（複数のユーザー/パスワードペア）
# フォーマット: "username1:password1,username2:password2,username3:password3"
VITE_PASSWORD_PROTECTION_CREDENTIALS=admin:your_secure_password,developer:dev_password,tester:test_password

# セッション有効期限の設定（ミリ秒単位、オプション）
# デフォルト: 3600000（1時間）
# 例: 1800000（30分）、7200000（2時間）、86400000（24時間）
VITE_PASSWORD_PROTECTION_SESSION_DURATION=3600000
```

#### Vercel（ステージング・本番環境）

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. "Settings" → "Environment Variables" に移動
4. 以下の環境変数を追加：

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `VITE_PASSWORD_PROTECTION_ENABLED` | `true` | Production, Preview, Development |
| `VITE_PASSWORD_PROTECTION_CREDENTIALS` | `user1:pass1,user2:pass2` | Production, Preview, Development |
| `VITE_PASSWORD_PROTECTION_SESSION_DURATION` | `3600000` | Production, Preview, Development |

**注意**:
- 環境ごとに異なる認証情報を設定することが可能です
- Preview環境のみで有効化し、Production環境では無効にすることも可能です
- 設定後は再デプロイが必要です

### 2. 機能の無効化

パスワード保護を無効にする場合：

```bash
VITE_PASSWORD_PROTECTION_ENABLED=false
```

または環境変数を削除するだけでも無効化できます。

## 機能仕様

### 認証フロー

1. ユーザーがアプリケーションにアクセス
2. `VITE_PASSWORD_PROTECTION_ENABLED` が `true` の場合、ログインフォームを表示
3. ユーザーがユーザー名とパスワードを入力
4. 入力された認証情報が設定された複数のペアのいずれかと一致するか検証
5. 認証成功時、セッションデータをsessionStorageに保存
6. アプリケーションのコンテンツを表示

### セッション管理

- **保存先**: `sessionStorage`（ブラウザのタブごと）
- **有効期限**: 環境変数 `VITE_PASSWORD_PROTECTION_SESSION_DURATION` で設定（デフォルト: 1時間 = 3,600,000ミリ秒）
- **セッションキー**: `app-auth-session`
- **セッションの動作**:
  - ログイン時刻から設定した時間が経過すると、セッションが期限切れになります
  - 期限切れの確認は**ページをリロードまたは再訪問した時**に行われます
  - セッション中は操作を続けても期限は延長されません（固定時間制）
  - タブを閉じるとセッションは失効します
  - 別のタブで開くと新たにログインが必要です

#### セッション時間の設定例

```bash
# 10秒（テスト用）
VITE_PASSWORD_PROTECTION_SESSION_DURATION=10000

# 30分
VITE_PASSWORD_PROTECTION_SESSION_DURATION=1800000

# 2時間
VITE_PASSWORD_PROTECTION_SESSION_DURATION=7200000

# 8時間
VITE_PASSWORD_PROTECTION_SESSION_DURATION=28800000

# 24時間
VITE_PASSWORD_PROTECTION_SESSION_DURATION=86400000
```

**重要な注意点**:
- セッション期限切れの確認はページリロード時のみ行われます
- 操作中に自動的にログアウトされることはありません
- 期限切れ後も、ページをリロードするまでは使用を続けられます

### 複数ユーザー/パスワードの設定

認証情報は以下の形式で設定します：

```
username1:password1,username2:password2,username3:password3
```

**例**:
```bash
VITE_PASSWORD_PROTECTION_CREDENTIALS=admin:SecurePass123,developer:DevPass456,tester:TestPass789
```

この場合、以下の3つの認証情報のいずれかでログイン可能：
- ユーザー名: `admin`, パスワード: `SecurePass123`
- ユーザー名: `developer`, パスワード: `DevPass456`
- ユーザー名: `tester`, パスワード: `TestPass789`

## セキュリティ上の脆弱性とリスク

### ⚠️ 重大な脆弱性

#### 1. 認証情報の平文露出

**問題**:
- すべての認証情報（ユーザー名とパスワード）がビルドされたJavaScriptファイルに**平文で含まれます**
- ブラウザの開発者ツールで誰でも簡単に確認可能
- ソースコードを調査すれば認証情報が見つかります

**影響**:
```javascript
// ビルドされたJavaScriptファイル内
const credentialsString = "admin:password123,user:secret456";
```

**リスク**:
- 技術的知識を持つユーザーは容易にバイパス可能
- パスワードが他のシステムで再利用されている場合、それらも危険にさらされる
- 認証情報の漏洩を検知する手段がない

#### 2. クライアントサイド検証のみ

**問題**:
- 認証ロジックがクライアントサイド（ブラウザ）でのみ実行
- サーバーサイドでの検証が一切ない
- JavaScriptを無効化したり、直接APIにアクセスすることでバイパス可能

**影響**:
- バックエンドAPIは保護されていません
- 直接APIエンドポイントにアクセス可能
- React DevToolsなどで認証状態を操作可能

#### 3. セッション管理の脆弱性

**問題**:
- セッショントークンが暗号化されていない
- CSRF対策がない
- セッション固定攻撃への対策がない

**リスク**:
- `sessionStorage` を直接操作してセッションを偽造可能
- ブラウザの開発者コンソールで以下のコードを実行すれば認証をバイパス：
```javascript
sessionStorage.setItem('app-auth-session',
  JSON.stringify({expiresAt: Date.now() + 3600000})
);
location.reload();
```

#### 4. パスワードの弱い暗号化

**問題**:
- パスワードがハッシュ化されていない
- ソルトが使用されていない
- 平文比較のみ

**リスク**:
- レインボーテーブル攻撃に脆弱
- パスワードが即座に判明

#### 5. ブルートフォース攻撃への無防備

**問題**:
- ログイン試行回数の制限がない
- アカウントロック機能がない
- レート制限がない

**リスク**:
- 自動化ツールで無制限にパスワードを試行可能
- 簡単なパスワードは数秒で破られる可能性

### その他のセキュリティリスク

#### 6. HTTPS非使用時の盗聴リスク

- HTTPで通信する場合、認証情報が平文で送信される
- 中間者攻撃（MITM）で認証情報が傍受される可能性

#### 7. コード難読化の欠如

- ソースコードが読みやすい状態でデプロイされる
- リバースエンジニアリングが容易

#### 8. セッション有効期限の固定

- セッション時間が環境変数で調整できない（コード内で1時間固定）
- ユーザーの操作によるセッション延長がない

#### 9. ログアウト機能の欠如

- ユーザーが明示的にログアウトする手段がない
- セッションを手動で削除する必要がある

#### 10. 監査ログの不在

- ログイン試行の記録がない
- 誰がいつアクセスしたか追跡不可能
- 不正アクセスの検知ができない

## 推奨される使用方法とベストプラクティス

### ✅ 推奨される使用例

1. **ステージング環境の保護**
   ```bash
   # Preview環境でのみ有効化
   VITE_PASSWORD_PROTECTION_ENABLED=true
   VITE_PASSWORD_PROTECTION_CREDENTIALS=staging:preview123
   ```

2. **デモサイトの保護**
   - クライアントプレゼンテーション前のアクセス制限
   - 一般公開前の限定公開

3. **開発環境の軽度な保護**
   - チーム内での簡易的なアクセス管理
   - 誤って共有したURLへのアクセス防止

### ❌ 避けるべき使用例

1. **本番環境での機密データ保護** - 絶対に使用しないでください
2. **個人情報や金融情報の保護** - 適切な認証システムを使用してください
3. **コンプライアンス要件への対応** - この機能では不十分です
4. **管理画面の保護** - サーバーサイド認証が必要です

### 🔒 セキュリティ強化のための追加対策

この機能を使用する場合、以下の追加対策を検討してください：

1. **HTTPS必須化**
   - Vercelは自動的にHTTPSを提供しますが、カスタムドメインでも必ず有効化

2. **強力なパスワードの使用**
   ```bash
   # 悪い例
   VITE_PASSWORD_PROTECTION_CREDENTIALS=admin:123456

   # 良い例
   VITE_PASSWORD_PROTECTION_CREDENTIALS=admin:Xy9$mK2#pL8@qR4&
   ```

3. **定期的な認証情報の変更**
   - 最低でも月1回は変更
   - プロジェクトメンバーの変更時にも更新

4. **IP制限との併用**
   - Vercelの有料プランでIP制限機能を使用
   - Cloudflare等のCDNでIP制限を追加

5. **バックエンドAPIの独立した認証**
   - APIには別途JWT等の認証を実装
   - クライアントサイド保護とは独立させる

6. **環境変数の適切な管理**
   - `.env` ファイルをGitにコミットしない（`.gitignore` に追加済み）
   - チーム内でも必要最小限の人数にのみ共有

## トラブルシューティング

### ログインフォームが表示されない

**確認事項**:
1. `VITE_PASSWORD_PROTECTION_ENABLED` が `true` に設定されているか
2. 環境変数が正しく読み込まれているか
   - ブラウザのコンソールで `import.meta.env.VITE_PASSWORD_PROTECTION_ENABLED` を確認
3. 変更後に再ビルド・再デプロイしたか

### パスワードが正しいのにログインできない

**確認事項**:
1. ユーザー名とパスワードの大文字小文字が一致しているか
2. 認証情報の形式が正しいか（`username:password,username2:password2`）
3. コロン（`:`）やカンマ（`,`）がパスワードに含まれていないか
   - 含まれている場合は現在の実装では対応不可

### セッションがすぐに切れる

**原因**:
- タブを閉じた（sessionStorageの仕様）
- 設定した時間以上経過してページをリロードした
- ブラウザのキャッシュをクリアした

**対処法**:
- 環境変数 `VITE_PASSWORD_PROTECTION_SESSION_DURATION` でセッション時間を調整可能
- デフォルトは1時間（3600000ミリ秒）
- より長いセッションが必要な場合は、値を大きく設定してください

**セッション期限のテスト方法**:
1. テスト用に短い時間（例: 10000ミリ秒 = 10秒）を設定
2. ログイン
3. 設定時間以上待つ
4. ページをリロード（F5）
5. 再認証が求められることを確認
6. テスト後、適切な時間に戻す

### Vercelで環境変数が反映されない

**対処法**:
1. Vercel Dashboardで環境変数を確認
2. 環境変数設定後、必ず**再デプロイ**を実行
3. 正しい環境（Production/Preview/Development）に設定されているか確認

## 技術仕様

### 使用技術

- **フレームワーク**: React 18+
- **ビルドツール**: Vite
- **UIコンポーネント**: shadcn/ui
- **状態管理**: React Hooks (useState, useEffect)
- **セッション保存**: sessionStorage API

### ファイル構成

```
src/
├── components/
│   └── PasswordProtection.jsx  # 認証コンポーネント本体
├── main.jsx                      # エントリーポイント（PasswordProtectionでラップ）
└── ...
```

### 環境変数

| 変数名 | 型 | デフォルト | 説明 |
|--------|-----|-----------|------|
| `VITE_PASSWORD_PROTECTION_ENABLED` | string | なし | `'true'` で有効化 |
| `VITE_PASSWORD_PROTECTION_CREDENTIALS` | string | なし | `"user:pass,user2:pass2"` 形式 |
| `VITE_PASSWORD_PROTECTION_SESSION_DURATION` | string | `3600000` | セッション有効期限（ミリ秒） |

### セッションデータ構造

```javascript
{
  "expiresAt": 1234567890123  // Unix timestamp (ミリ秒)
}
```

## まとめ

このパスワード保護機能は、**軽度な保護**を提供する簡易的な実装です。

**適切な用途**:
- ステージング環境の保護
- デモサイトの一時的なアクセス制限
- 開発中プロジェクトの軽度な保護

**不適切な用途**:
- 本番環境のセキュリティ
- 機密データの保護
- ユーザー認証システム

真のセキュリティが必要な場合は、以下を検討してください：
- 適切なサーバーサイド認証（OAuth, JWT等）
- データベースによるユーザー管理
- セキュリティ監査
- ペネトレーションテスト

## 参考リンク

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Web Authentication Best Practices](https://web.dev/sign-in-form-best-practices/)

---

**最終更新**: 2025-12-16
**バージョン**: 1.0.0
