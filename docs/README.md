
# 🤖 AIシフト最適化システム POC

> 1ヶ月で実証するAI自動シフト生成システム

![Status](https://img.shields.io/badge/Status-POC%20Development-yellow)
![Progress](https://img.shields.io/badge/Progress-Week%201-blue)

## 🎯 プロジェクト概要

店長の作業時間を95%削減する、AI駆動のシフト自動生成・最適化システムのプロトタイプ。

[プロダクト概要のLP](https://claude.ai/public/artifacts/0f62011c-69c4-4e2f-abfc-01e52b5323a9)

[アーキテクチャー設計書並びにシステム構成](https://claude.ai/public/artifacts/6480b2f5-6f71-456b-a184-74fa83ffe577)


### 主要機能
- 📤 CSV形式でスタッフ・希望シフト取り込み
- 🤖 OpenAI GPT-4によるシフト自動生成
- ✏️ 手動編集・音声指示による修正
- 📥 既存システム連携可能なCSV出力

### 技術スタック
- **フロントエンド**: Next.js 14 + TypeScript + TailwindCSS
- **バックエンド**: Django 4.2 + Django REST Framework
- **AI**: OpenAI GPT-4 API
- **DB**: PostgreSQL (本番) / SQLite (開発)
- **デプロイ**: Vercel (フロント) + Railway (バック)

## 🚀 クイックスタート

### 1. リポジトリクローン
```bash
git clone https://github.com/info-mnml/shift-scheduler-ai.git
cd shift-scheduler-ai
```

### 2. バックエンド起動
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# .envにOpenAI API Keyを設定
python manage.py migrate
python manage.py runserver
```

### 3. フロントエンド起動
```bash
cd frontend
npm install
cp .env.example .env.local
# .env.localにAPI URLを設定
npm run dev
```

### 4. 動作確認
- フロント: http://localhost:3000
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

## 📊 開発進捗

### Week 1: 基盤構築 ✅
- [x] プロジェクト環境構築
- [x] 基本API作成
- [x] CSV取り込み機能
- [ ] OpenAI統合

### Week 2: AI統合 🚧
- [ ] プロンプト設計
- [ ] シフト生成API
- [ ] 基本制約チェック

### Week 3: UI・編集機能 ⏳
- [ ] カレンダーUI
- [ ] 音声入力
- [ ] 手動編集

### Week 4: 完成・デプロイ ⏳
- [ ] CSV出力
- [ ] デプロイ
- [ ] デモ準備

## 👥 チームメンバー

- **Yuki** - プロジェクトリーダー・AI統合
- **Engineer** - フルスタック開発 (Django + Next.js)

## 📋 関連ドキュメント

- [環境構築手順](./SETUP.md)
- [API仕様](./API.md)
- [データ構造](./DATA_STRUCTURE.md)
- [開発ガイドライン](./DEVELOPMENT.md)
- [タスク管理](./TODO.md)

## 📖 詳細資料・外部リンク

### システム設計書
- [アーキテクチャー設計書並びにシステム構成](https://claude.ai/public/artifacts/6480b2f5-6f71-456b-a184-74fa83ffe577)
  - 技術スタック詳細
  - 実装アーキテクチャ
  - AI活用開発戦略
  - 1ヶ月POC計画

### プロダクト資料
- [プロダクト概要のLP](https://claude.ai/public/artifacts/0f62011c-69c4-4e2f-abfc-01e52b5323a9)
  - サービス全体概要
  - メンバー募集ページ
  - 利用者向け情報
  - ビジネスモデル詳細

## 🐛 問題報告

問題が発生した場合は [Issues](https://github.com/info-mnml/shift-scheduler-ai/issues) で報告してください。

## 📄 ライセンス

Private Repository - All Rights Reserved
```

---

## 2️⃣ SETUP.md
```markdown
# 🛠️ 環境構築手順

## 必要環境

- **Node.js**: v18以上
- **Python**: 3.11以上
- **Git**: 最新版

## バックエンド環境構築

### 1. Python仮想環境作成
```bash
cd backend
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. パッケージインストール
```bash
pip install -r requirements.txt
```

### 3. 環境変数設定
```bash
cp .env.example .env
```

`.env`ファイルを編集：
```env
# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# Django設定
SECRET_KEY=your-super-secret-key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3

# Allowed hosts
ALLOWED_HOSTS=localhost,127.0.0.1
```

### 4. データベース初期化
```bash
python manage.py migrate
python manage.py createsuperuser
```

### 5. サンプルデータ作成（オプション）
```bash
python manage.py loaddata fixtures/sample_data.json
```

### 6. 開発サーバー起動
```bash
python manage.py runserver
```

## フロントエンド環境構築

### 1. パッケージインストール
```bash
cd frontend
npm install
```

### 2. 環境変数設定
```bash
cp .env.example .env.local
```

`.env.local`ファイルを編集：
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-key
```

### 3. 開発サーバー起動
```bash
npm run dev
```

## 開発ツール設定

### VS Code拡張機能（推奨）
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json"
  ]
}
```

### Pre-commit設定
```bash
# バックエンド
cd backend
pip install pre-commit
pre-commit install

# フロントエンド  
cd frontend
npm install --save-dev prettier eslint
```

## トラブルシューティング

### よくあるエラー

**1. OpenAI API エラー**
```
openai.error.AuthenticationError
```
→ `.env`ファイルのAPI Keyを確認

**2. データベースエラー**
```
django.db.utils.OperationalError
```
→ `python manage.py migrate` を実行

**3. ポート使用中エラー**
```
Error: listen EADDRINUSE :::3000
```
→ 他のプロセスを終了するか、別ポート使用
```bash
npm run dev -- -p 3001
```

### パフォーマンス最適化

**開発環境の高速化**
```bash
# Python
pip install --upgrade pip setuptools wheel

# Node.js
npm install -g npm@latest
```

## Docker環境（オプション）

```bash
# 全環境をDockerで起動
docker-compose up --build

# バックエンドのみ
docker-compose up backend

# フロントエンドのみ  
docker-compose up frontend
```
```

---

## 3️⃣ .env.example
```bash
# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here

# Django Settings
SECRET_KEY=your-super-secret-django-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3
# For PostgreSQL (production):
# DATABASE_URL=postgresql://username:password@localhost:5432/shift_scheduler

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Email Settings (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Logging
LOG_LEVEL=DEBUG

# Cache (optional)
CACHE_URL=redis://localhost:6379/0

# Celery (for background tasks - optional)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

---

## 🚀 Git Commands
```bash
# 1. リポジトリをクローン
git clone https://github.com/info-mnml/shift-scheduler-ai.git
cd shift-scheduler-ai

# 2. 各ドキュメントファイルを作成
touch README.md SETUP.md API.md DATA_STRUCTURE.md TODO.md .env.example TROUBLESHOOTING.md DEVELOPMENT.md

# 3. 各ファイルに内容をコピー＆ペースト
# (各ファイルをエディタで開いて、上記のコンテンツをコピペ)

# 4. ファイル作成確認
ls -la *.md .env.example

# 5. Git設定（初回のみ）
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 6. 変更をステージング
git add .

# 7. ステージング確認
git status

# 8. コミット
git commit -m "feat: add initial project documentation

- README.md: project overview and quick start guide
- SETUP.md: detailed environment setup instructions  
- API.md: API specifications and endpoint definitions
- DATA_STRUCTURE.md: CSV formats and database models
- TODO.md: 4-week POC task management and KPIs
- .env.example: environment variables template
- TROUBLESHOOTING.md: common issues and solutions guide
- DEVELOPMENT.md: coding standards and development workflow

Added external documentation links:
- System architecture documentation
- Product overview landing page"

# 9. リモートリポジトリにプッシュ
git push origin main

# 10. 確認
git log --oneline -5
```
