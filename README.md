# AIシフトスケジューラー

AIによる自動シフト生成システムです。PostgreSQLデータベースとOpenAI GPT-4を活用した、マルチテナント対応のシフト管理アプリケーションです。

## 📚 ドキュメント

### プロダクト概要
- [プロダクト概要のLP](https://claude.ai/public/artifacts/0f62011c-69c4-4e2f-abfc-01e52b5323a9)
- [アーキテクチャー設計書並びにシステム構成](https://sysdiag-datorr.manus.space)

### 技術ドキュメント
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - システムアーキテクチャ
- [DATABASE_GUIDE.md](docs/DATABASE_GUIDE.md) - データベース接続・セットアップ
- [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - データベーススキーマ設計
- [CONFIGURATION.md](docs/CONFIGURATION.md) - 設定ガイド
- [QUICK_START.md](QUICK_START.md) - クイックスタートガイド

## クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/info-mnml/shift-scheduler-ai.git
cd shift-scheduler-ai
```

### 2. データベースのセットアップ

```bash
# 依存関係をインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してDATABASE_URLを設定

# データベース初期化
node scripts/setup/setup_fresh_db.mjs
```

詳細は [DATABASE_GUIDE.md](docs/DATABASE_GUIDE.md) を参照。

### 3. バックエンドの起動

```bash
cd backend
npm install
npm run dev  # http://localhost:3001 で起動
```

### 4. フロントエンドの起動

```bash
cd frontend
pnpm install
pnpm run dev  # http://localhost:5173 で起動
```

## システム機能

### 主な機能

- **マルチテナント対応**: 複数法人・事業・店舗の階層管理
- **マスターデータ管理**: 17種類のマスターデータAPI（店舗、スタッフ、役職、スキルなど）
- **ダッシュボード**: 売上・人件費・利益の予実分析とグラフ表示
- **シフト管理**: 月別シフトの作成・編集・閲覧
- **スタッフ管理**: スタッフ情報と給与計算
- **店舗管理**: 店舗情報と制約条件の管理
- **制約管理**: 労働基準法などの制約設定
- **予実管理**: 実績データのインポートと分析
- **開発者ツール**: バリデーションチェック、AI対話（GPT-4）、シフト自動生成
- **LINE連携**: シフト希望の収集（実装予定）

## 🛠️ 技術スタック

### Frontend
- **Framework**: React 18, Vite
- **UI**: Tailwind CSS v4, Radix UI
- **Charts**: Recharts
- **Animation**: Framer Motion
- **CSV**: PapaParse

### Backend
- **Runtime**: Node.js, Express
- **Database**: PostgreSQL 15+ (Railway)
- **AI**: OpenAI GPT-4 API, Assistants API v2
- **ORM**: node-postgres (pg)

## 📁 プロジェクト構成

```
shift-scheduler-ai/
├── frontend/                  # フロントエンド（React + Vite）
│   ├── src/
│   │   ├── components/        # Reactコンポーネント
│   │   ├── utils/             # ユーティリティ
│   │   ├── infrastructure/    # リポジトリ層
│   │   └── dev/               # 開発ツール
│   └── public/data/           # CSVデータ（レガシー）
│
├── backend/                   # バックエンド（Express + PostgreSQL）
│   ├── src/
│   │   ├── server.js          # APIサーバー
│   │   ├── config/
│   │   │   └── database.js    # DB接続設定
│   │   ├── routes/
│   │   │   ├── openai.js      # OpenAI APIルート
│   │   │   ├── csv.js         # CSV操作ルート
│   │   │   └── master.js      # マスターデータAPIルート
│   │   └── utils/
│   └── .env                   # 環境変数
│
├── scripts/
│   ├── setup/                 # データベースセットアップ
│   │   ├── schema.sql         # スキーマ定義（795行、30テーブル）
│   │   ├── seed_data.sql      # マスターデータDML
│   │   ├── seed_transaction_data.sql  # トランザクションデータDML（4,911件）
│   │   ├── setup_fresh_db.mjs # DB初期化スクリプト
│   │   └── verify_setup.mjs   # 検証スクリプト
│   └── dev/                   # 開発用スクリプト
│
├── docs/                      # ドキュメント
│   ├── ARCHITECTURE.md        # アーキテクチャ設計
│   ├── DATABASE_GUIDE.md      # DB接続・セットアップ
│   ├── DATABASE_SCHEMA.md     # スキーマ設計書
│   └── ...                    # その他ドキュメント
│
└── README.md                  # このファイル
```

詳細な構成は [ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照してください。

## Git コマンド

```bash
# ブランチ作成
git checkout -b feature/branch-name

# 変更をステージング
git add .

# コミット
git commit -m "commit message"

# プッシュ
git push origin feature/branch-name
```

## ライセンス

MIT License
