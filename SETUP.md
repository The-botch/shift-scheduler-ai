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