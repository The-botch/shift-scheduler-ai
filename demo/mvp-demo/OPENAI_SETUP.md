# OpenAI ChatGPT-4 API セットアップガイド

## 概要

開発ツールのAI対話機能でOpenAI ChatGPT-4 APIを使用するための設定方法です。

## 前提条件

- OpenAI アカウント（https://platform.openai.com/）
- API キー（有料プランの場合、使用量に応じて課金されます）

## セットアップ手順

### 1. OpenAI API キーを取得

1. https://platform.openai.com/ にアクセス
2. ログインまたはサインアップ
3. 右上のアカウントメニューから「API keys」を選択
4. 「Create new secret key」をクリック
5. 生成されたAPIキーをコピー（⚠️ 一度しか表示されないので必ず保存）

### 2. 環境変数ファイルを作成

プロジェクトルート（mvp-demoディレクトリ）に `.env` ファイルを作成します：

```bash
cd /path/to/shift-scheduler-ai/demo/mvp-demo
cp .env.example .env
```

### 3. APIキーを設定

`.env` ファイルを編集して、取得したAPIキーを設定：

```env
# OpenAI API Key
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI API Configuration (オプション)
VITE_OPENAI_MODEL=gpt-4
VITE_OPENAI_MAX_TOKENS=2000
```

⚠️ **重要**: `.env` ファイルは `.gitignore` に含まれているため、Gitにコミットされません。

### 4. 開発サーバーを再起動

環境変数を反映するため、開発サーバーを再起動：

```bash
# 現在のサーバーを停止（Ctrl+C）
# 再度起動
npm run dev
```

## 使い方

### 基本的なAI対話

1. 開発ツール画面にアクセス
2. 「AI対話（GPT-4連携）」カードのテキストエリアにプロンプトを入力
3. 「AIに送信」ボタンをクリック
4. AI応答が表示されます

**プロンプト例:**
```
2024年11月のシフトを作成してください。
以下の条件を満たすようにお願いします：
- スタッフの希望シフトを70%以上反映
- 人件費は月額100万円以内
- 週末は必ず2名以上配置
```

### バリデーション結果の分析

1. シフトバリデーションを実行
2. エラーまたは警告が検出された場合
3. 「結果を分析」ボタンをクリック
4. AIが問題点を分析し、改善提案を提示します

## 料金について

### 料金体系（2024年時点）

- **GPT-4**: 入力 $0.03/1K tokens、出力 $0.06/1K tokens
- **GPT-4 Turbo**: 入力 $0.01/1K tokens、出力 $0.03/1K tokens
- **GPT-3.5 Turbo**: 入力 $0.0015/1K tokens、出力 $0.002/1K tokens

### コスト最適化

`.env` で使用するモデルを変更できます：

```env
# コスト重視（GPT-3.5 Turbo）
VITE_OPENAI_MODEL=gpt-3.5-turbo

# 品質重視（GPT-4）
VITE_OPENAI_MODEL=gpt-4

# バランス型（GPT-4 Turbo）
VITE_OPENAI_MODEL=gpt-4-turbo
```

### 使用量の確認

OpenAIダッシュボード（https://platform.openai.com/usage）で使用量をモニタリングできます。

## トラブルシューティング

### エラー: "OpenAI APIキーが設定されていません"

- `.env` ファイルが正しく作成されているか確認
- `VITE_OPENAI_API_KEY` が正しく設定されているか確認
- 開発サーバーを再起動

### エラー: "OpenAI API Error: 401"

- APIキーが正しいか確認
- APIキーが有効期限切れでないか確認
- OpenAIアカウントに支払い方法が登録されているか確認

### エラー: "OpenAI API Error: 429"

- API使用量の上限に達している可能性
- OpenAIダッシュボードで使用量を確認
- 必要に応じてプランをアップグレード

### エラー: "OpenAI API Error: 500/503"

- OpenAI側のサーバーエラー
- 時間をおいて再試行

## セキュリティ上の注意

1. **APIキーを公開しない**
   - `.env` ファイルは絶対にGitにコミットしない
   - スクリーンショットや動画にAPIキーが映らないよう注意

2. **APIキーの管理**
   - 定期的にAPIキーをローテーション
   - 不要になったAPIキーは削除

3. **使用量の監視**
   - 予期しない高額請求を防ぐため、使用量アラートを設定
   - OpenAIダッシュボードで定期的に確認

## 開発環境と本番環境の分離

本番環境では、環境変数を安全に管理する必要があります：

- Vercel: Environment Variables設定
- Netlify: Environment variables設定
- AWS/GCP: Secrets Manager使用

## 参考リンク

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/pricing)
- [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- [OpenAI API Status](https://status.openai.com/)
