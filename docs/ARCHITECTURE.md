# アーキテクチャドキュメント

## 概要

このプロジェクトは、OpenAI GPT-4を活用したAIシフト自動生成システムです。
フロントエンド（React）とバックエンド（Express）で構成され、PostgreSQLデータベースとOpenAI Assistants API v2を使用してシフトを生成します。

## システム構成図

```mermaid
graph TB
    User[👤 ユーザー] --> Frontend[🖥️ Frontend<br/>React + Vite]
    Frontend --> Backend[⚙️ Backend<br/>Express API]
    Backend --> Database[(🗄️ PostgreSQL<br/>Railway)]
    Backend --> OpenAI[🤖 OpenAI API<br/>GPT-4 + Assistants v2]
    Backend --> FileSystem[(📁 File System<br/>CSV Data)]
    OpenAI --> VectorStore[(🗄️ Vector Store<br/>参照データ)]
```

## ディレクトリ構造

```
shift-scheduler-ai/
├── frontend/                    # フロントエンド
│   ├── src/
│   │   ├── components/          # Reactコンポーネント
│   │   │   ├── ui/              # UIプリミティブ(shadcn/ui)
│   │   │   ├── shared/          # 共有コンポーネント
│   │   │   └── screens/         # 画面コンポーネント
│   │   ├── utils/               # ユーティリティ関数
│   │   │   ├── openaiClient.js  # OpenAI Chat Completion API
│   │   │   ├── assistantClient.js  # OpenAI Assistants API
│   │   │   ├── shiftValidator.js    # シフト検証
│   │   │   └── shiftInputCollector.js  # 入力データ収集
│   │   ├── dev/                 # 開発ツール
│   │   │   └── DevTools.jsx     # AIシフト生成UI
│   │   ├── config/              # 設定ファイル (新規)
│   │   │   └── default.js       # デフォルト設定
│   │   └── App.jsx              # ルートコンポーネント
│   ├── public/
│   │   └── data/                # データファイル
│   │       ├── master/          # マスタデータ(CSV)
│   │       ├── history/         # 履歴データ(CSV)
│   │       └── generated/       # 生成されたシフト(CSV)
│   ├── .env.example             # 環境変数テンプレート
│   ├── .prettierrc              # Prettier設定
│   ├── eslint.config.js         # ESLint設定
│   └── vite.config.js           # Vite設定
│
├── backend/                     # バックエンド
│   ├── src/
│   │   ├── server.js            # Express APIサーバー
│   │   ├── config/
│   │   │   └── database.js      # PostgreSQL接続設定
│   │   ├── routes/
│   │   │   ├── openai.js        # OpenAI API ルート
│   │   │   ├── csv.js           # CSV操作 ルート
│   │   │   └── master.js        # マスターデータAPI ルート
│   │   └── utils/
│   │       └── logger.js        # ロギング
│   ├── .env                     # 環境変数
│   └── package.json
│
├── fixtures/                    # テストデータ
│   └── demo_data/               # デモ用データ
│
├── docs/                        # ドキュメント
│   ├── ARCHITECTURE.md          # このファイル
│   ├── CONFIGURATION.md         # 設定ガイド
│   ├── DATABASE_GUIDE.md        # DB接続・セットアップ
│   ├── DATABASE_SCHEMA.md       # DBスキーマ設計
│   ├── DATABASE_CLI_COMMANDS.md # CLIコマンド集
│   ├── SAMPLE_QUERIES.md        # サンプルクエリ
│   ├── CSV_TO_DB_MAPPING.md     # CSV・DB対応表
│   ├── MULTITENANT_REDESIGN.md  # マルチテナント設計
│   └── LINE_INTEGRATION.md      # LINE連携ガイド
│
├── scripts/                     # ユーティリティスクリプト
│   ├── setup/                   # データベースセットアップ
│   │   ├── schema.sql           # スキーマ定義 (795行)
│   │   ├── seed_data.sql        # マスターデータ
│   │   ├── setup_fresh_db.mjs   # DB初期化スクリプト
│   │   ├── verify_setup.mjs     # 検証スクリプト
│   │   └── import_all_17_masters.mjs  # マスターデータインポート
│   ├── dev/                     # 開発用スクリプト
│   ├── test_db_connection.mjs   # DB接続テスト
│   └── test_schema_crud.mjs     # CRUD総合テスト
│
├── .gitignore
├── SECURITY.md                  # セキュリティポリシー
└── README.md

```

## データフロー

### 1. シフト生成フロー

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant OAI as OpenAI API
    participant VS as Vector Store

    U->>FE: シフト生成リクエスト
    FE->>FE: 入力データ収集
    FE->>BE: POST /api/openai/assistants
    BE->>OAI: Create Assistant
    OAI-->>BE: Assistant ID

    BE->>OAI: Create Vector Store
    OAI-->>BE: Vector Store ID

    loop 各参照ファイル
        BE->>BE: CSV→JSON変換
        BE->>OAI: Upload File
        OAI-->>VS: Store File
    end

    BE->>OAI: Attach Files to Vector Store
    BE->>OAI: Create Thread
    BE->>OAI: Add Message (プロンプト)
    BE->>OAI: Create Run

    loop ポーリング
        BE->>OAI: Get Run Status
        OAI-->>BE: Status
    end

    OAI-->>BE: Completed
    BE->>OAI: Get Messages
    OAI-->>BE: シフトデータ
    BE->>BE: CSVに変換
    BE->>FE: シフトCSV
    FE->>U: ダウンロード可能
```

### 2. API通信フロー

**フロントエンド → バックエンド → OpenAI**

すべてのOpenAI API呼び出しはバックエンド経由で行われます（セキュリティのため）。

## 主要コンポーネント

### Frontend

#### `DevTools.jsx`
- **役割**: AI シフト生成のメイン画面
- **機能**:
  - Vector Store セットアップ
  - シフト生成パラメータ入力
  - AI シフト生成実行
  - 生成結果の表示・ダウンロード
- **状態管理**: React hooks (useState, useEffect)

#### `assistantClient.js`
- **役割**: OpenAI Assistants API v2 のクライアント
- **主要関数**:
  - `setupVectorStore()`: 参照ファイルのアップロードとVector Store作成
  - `generateShiftWithAssistant()`: Assistant を使用したシフト生成
  - `uploadFile()`: CSVファイルのアップロード（CSV→JSON変換込み）

#### `openaiClient.js`
- **役割**: OpenAI Chat Completion API のクライアント
- **使用場面**: 簡易的なシフト生成（Vector Store不使用）

#### `shiftValidator.js`
- **役割**: 生成されたシフトの検証
- **検証項目**:
  - 労働基準法遵守
  - 店舗制約チェック
  - スタッフスキルマッチング

### Backend

#### `server.js`
- **役割**: API サーバー（OpenAI プロキシ + データベース連携）
- **主要ルート**:
  - `/api/openai/*` - OpenAI API プロキシ
  - `/api/master/*` - マスターデータAPI
  - `/api/*` - CSV操作API

#### `config/database.js`
- **役割**: PostgreSQL 接続管理
- **主要機能**:
  - Connection Pool管理
  - `query(text, params)` - クエリ実行
  - `transaction(callback)` - トランザクション実行
  - `getPool()` - プール取得
- **接続先**: Railway PostgreSQL (マルチテナント対応)

#### `routes/openai.js`
- **エンドポイント**:
  - `POST /api/openai/assistants` - Assistant作成
  - `POST /api/openai/vector_stores` - Vector Store作成
  - `POST /api/openai/files` - ファイルアップロード（CSV→JSON変換）
  - `POST /api/openai/threads` - Thread作成
  - `POST /api/openai/threads/:threadId/runs` - Run作成・実行
  - `GET /api/openai/threads/:threadId/runs/:runId` - Run状態取得
- **特徴**: OpenAI APIキーの隠蔽、CSV→JSON自動変換

#### `routes/master.js`
- **エンドポイント**:
  - `GET /api/master/tenants` - テナント一覧
  - `GET /api/master/divisions` - 部門一覧
  - `GET /api/master/stores` - 店舗一覧
  - `GET /api/master/roles` - 役職一覧
  - `GET /api/master/skills` - スキル一覧
  - `GET /api/master/employment-types` - 雇用形態一覧
  - `GET /api/master/shift-patterns` - シフトパターン一覧
  - `GET /api/master/staff` - スタッフ一覧
  - `GET /api/master/commute-allowance` - 通勤手当一覧
  - `GET /api/master/insurance-rates` - 保険料率一覧
  - `GET /api/master/tax-brackets` - 税率区分一覧
  - など全17マスターテーブルに対応
- **特徴**: マルチテナント対応（tenant_idフィルタリング）

#### `routes/csv.js`
- **エンドポイント**:
  - `POST /api/save-csv` - 生成CSVの保存
- **特徴**: ファイルシステムへのCSV保存

## 設定管理

### 環境変数（`.env`）

#### バックエンド（`backend/.env`）
```bash
# OpenAI API
VITE_OPENAI_API_KEY=sk-proj-...
VITE_OPENAI_MODEL=gpt-4
VITE_OPENAI_MAX_TOKENS=2000

# Database
DATABASE_URL=postgresql://postgres:xxx@mainline.proxy.rlwy.net:50142/railway

# Node Environment
NODE_ENV=production
```

#### フロントエンド（`frontend/.env`）
```bash
VITE_OPENAI_API_KEY=sk-proj-...  # 開発用（本番ではバックエンド経由）
GH_TOKEN=ghp_...  # GitHub Pages デプロイ用
```

### 設定ファイル（`config/default.js`）

アプリケーション全体で使用する設定を一元管理:
- API URL
- ファイルパス
- デフォルト値

## データ管理

### データベース（PostgreSQL on Railway）

#### スキーマ構成
- **core**: 基幹マスタ（tenants, divisions, stores, roles, skills, employment_types, shift_patterns）
- **hr**: 人事マスタ（staff, staff_skills, staff_certifications, commute_allowance, insurance_rates, tax_brackets）
- **ops**: 運用マスタ・トランザクション（labor_law_constraints, shift_plans, shifts, shift_preferences, availability_requests, work_hours_actual など）
- **analytics**: 分析系（sales_actual, sales_forecast, dashboard_metrics）

#### マスターテーブル一覧（17テーブル）
1. tenants（テナント）
2. divisions（部門）
3. stores（店舗）
4. roles（役職）
5. skills（スキル）
6. employment_types（雇用形態）
7. shift_patterns（シフトパターン）
8. staff（スタッフ）
9. staff_skills（スタッフスキル）
10. staff_certifications（スタッフ資格）
11. commute_allowance（通勤手当）
12. insurance_rates（保険料率）
13. tax_brackets（税率区分）
14. labor_law_constraints（労働法制約）
15. labor_management_rules（労務管理ルール）
16. shift_validation_rules（シフト検証ルール）
17. store_constraints（店舗制約）

詳細は [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) を参照。

### 入力データ（CSV - レガシー）

CSVファイルはデータベース移行前の互換性のために保持。
- `frontend/public/data/master/` - マスタデータCSV
- `frontend/public/data/history/` - 履歴データCSV

### 出力データ（CSV）

生成されたシフト:
```csv
date,day,staff_id,staff_name,shift_type,start_time,end_time,break_time,work_hours,store_id,store_name,role
2024-11-01,金,S001,山田太郎,通常,09:00,18:00,60,8.0,ST001,渋谷店,店長
...
```

## セキュリティ

- **APIキーの保護**: `.env`ファイルで管理、Git管理外
- **バックエンドプロキシ**: フロントエンドから直接OpenAI APIを呼ばない
- **CORS設定**: 許可されたオリジンのみアクセス可能

詳細は [SECURITY.md](../SECURITY.md) を参照。

## パフォーマンス最適化

1. **バンドルサイズ削減**
   - Code Splitting（vendor chunk分離）
   - Tree Shaking

2. **API呼び出し最適化**
   - ファイルアップロードの並列処理
   - Runステータスのポーリング間隔調整

## 今後の改善予定

- [ ] TypeScript化
- [ ] ユニット・E2Eテスト整備
- [ ] エラーハンドリングの統一
- [ ] ログ・監視機能の追加
- [ ] Docker化
- [ ] CI/CD構築
