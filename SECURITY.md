# セキュリティポリシー

## 環境変数の管理

### ローカル開発環境
1. `frontend/.env.example`をコピーして`frontend/.env`を作成
2. 自分のAPIキー・トークンを設定
3. **`.env`ファイルは絶対にGitにコミットしない**

### 本番環境（Vercel/Railway）
- GitHub Secretsまたはホスティングサービスの環境変数設定を使用
- 以下の環境変数を設定:
  - `VITE_OPENAI_API_KEY`
  - `VITE_OPENAI_MODEL`
  - `VITE_OPENAI_MAX_TOKENS`

## 秘密情報のリーク対策
- APIキー・トークンは`.env`ファイルでのみ管理
- コード内にハードコーディングしない
- ログ出力時は秘密情報をマスキング

## セキュリティ問題の報告
セキュリティ上の問題を発見した場合は、publicに issue を作成せず、リポジトリオーナーに直接連絡してください。
