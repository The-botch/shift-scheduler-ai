# シフト管理システム MVP デモ

AI駆動型シフト管理システムのMVP（Minimum Viable Product）デモアプリケーションです。

## 機能概要

### 1. シフト管理
- シフトの一覧表示・詳細確認
- カレンダービュー対応
- スタッフ別・日別の勤務時間集計

### 2. スタッフ管理
- スタッフ情報の登録・編集
- 時給設定・勤務可能時間帯の管理
- 年齢制限（深夜勤務制限）の自動チェック

### 3. 店舗管理
- 店舗情報・営業時間の設定
- 複数店舗対応

### 4. 制約管理
- ハード制約（労働基準法準拠）
- ソフト制約（業務要件）
- CSVベースの制約ルール管理

### 5. 予算実績管理
- 月次人件費の予算設定
- 実績との比較・差異分析

### 6. LINE連携
- LINE Botによるシフト希望受付
- スタッフへの通知機能

### 7. モニタリング
- シフト状況のリアルタイム可視化
- アラート機能

### 8. 開発者ツール（重要）
- **シフトバリデーションチェック**: 全CSVファイルに対する制約チェック
- **AI対話（GPT-4連携）**: シフトに関する質問・分析
- **シフト自動生成（GPT-4連携）**: AIによるシフト自動作成
- **対話ログ管理**: AI対話履歴の自動記録・CSV出力（100件ごと）

## セットアップ

### 前提条件

- Node.js 18.x以上
- npm または yarn
- OpenAI APIキー（AI機能を使用する場合）

### インストール

```bash
# 依存パッケージのインストール
npm install
```

### 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成：

```bash
cp .env.example .env
```

`.env`ファイルを編集してOpenAI APIキーを設定：

```env
# OpenAI API Key
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI API Configuration (オプション)
VITE_OPENAI_MODEL=gpt-4
VITE_OPENAI_MAX_TOKENS=2000
```

**OpenAI APIキーの取得方法:**
詳しくは [OPENAI_SETUP.md](./OPENAI_SETUP.md) を参照してください。

### 開発サーバーの起動

```bash
npm run dev
```

開発サーバーが起動します：
- URL: http://localhost:5174/
- ポート5173が使用中の場合、自動的に5174が使用されます

### バックエンドの起動（LINE連携機能を使用する場合）

LINE連携機能を使用する場合は、別途Djangoバックエンドを起動する必要があります：

```bash
# バックエンドディレクトリに移動
cd ../../backend

# 仮想環境を有効化
source venv/bin/activate  # macOS/Linux
# または
venv\Scripts\activate  # Windows

# Django開発サーバーを起動
python manage.py runserver
```

バックエンドAPI: http://localhost:8000/

## プロジェクト構造

```
mvp-demo/
├── src/
│   ├── components/
│   │   ├── screens/          # 画面コンポーネント
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DevTools.jsx  # 開発者ツール（重要）
│   │   │   ├── ShiftManagement.jsx
│   │   │   └── ...
│   │   ├── shared/           # 共通コンポーネント
│   │   └── ui/               # UIコンポーネント
│   ├── config/
│   │   └── validationMessages.js  # バリデーションメッセージ定義
│   ├── utils/
│   │   ├── shiftValidator.js      # シフトバリデーションエンジン
│   │   ├── fileScanner.js         # CSV動的スキャン
│   │   └── openaiClient.js        # OpenAI API連携
│   └── App.jsx
├── public/
│   ├── data/                 # CSVデータファイル
│   │   ├── master/          # マスタデータ
│   │   ├── transactions/    # 現行データ
│   │   └── history/         # 実績データ
│   └── logs/
│       └── ai_conversations/  # AI対話ログ保存先
├── tests/                    # テストファイル
│   ├── validation/          # バリデーションテスト
│   │   ├── test-validator.html
│   │   └── test-september-2024.html
│   └── index.html           # テストメニュー
├── .env.example             # 環境変数テンプレート
├── .gitignore
├── package.json
├── vite.config.js
├── OPENAI_SETUP.md          # OpenAI APIセットアップガイド
└── README.md                # このファイル
```

## 使い方

### 1. デモアプリケーションの起動

```bash
npm run dev
```

ブラウザで http://localhost:5174/ にアクセスします。

### 2. 開発者ツールの使用

画面上部のメニューから「開発ツール」をクリックすると、以下の機能が使用できます：

#### シフトバリデーションチェック
1. ドロップダウンから検証対象のCSVファイルを選択
2. 「バリデーション実行」ボタンをクリック
3. エラー・警告が表示されます

#### AI対話（GPT-4）
1. 「AI対話」タブを選択
2. テキストエリアにプロンプトを入力
3. 「AIに送信」ボタンをクリック
4. GPT-4からの応答が表示されます

#### シフト自動生成（GPT-4）
1. 「シフト生成」タブを選択
2. 追加の制約や希望を入力（1行1項目）
3. 「シフトを生成（GPT-4）」ボタンをクリック
4. AIが2024年11月のシフトを自動生成します

#### 対話ログ管理
- すべてのAI対話・シフト生成の履歴が自動記録されます
- 100件溜まると自動的に `public/logs/ai_conversations/` にCSVファイルが保存されます
- 「手動保存」ボタンで100件未満でも任意のタイミングで保存可能

### 3. テストページの使用

http://localhost:5174/tests/ にアクセスすると、以下のテストページが利用できます：

- **基本バリデーションテスト**: シフトバリデーション機能の詳細テスト
- **2024年9月実績テスト**: 過去データのバリデーション検証

## 主要機能の詳細

### シフトバリデーション

45種類以上の制約ルールに基づいてシフトをチェックします：

**ハード制約（ERROR）:**
- 労働基準法準拠（深夜勤務制限、労働時間上限など）
- 勤務間インターバル
- 休憩時間規定
- 有給休暇取得義務

**ソフト制約（WARNING）:**
- 希望シフト反映率
- 土日勤務の公平性
- 人件費予算

詳細は `src/config/validationMessages.js` を参照してください。

### AI対話・シフト生成

OpenAI GPT-4を使用して以下が可能です：

- シフトに関する質問・分析
- 制約条件を考慮したシフト自動生成
- バリデーション結果の解釈

料金や使用量については [OPENAI_SETUP.md](./OPENAI_SETUP.md) を参照してください。

## トラブルシューティング

### ポートが使用中の場合

```
Port 5173 is in use, trying another one...
```

→ Viteが自動的に別のポート（5174など）を使用します。ターミナルに表示されるURLにアクセスしてください。

### OpenAI APIエラー

**"OpenAI APIキーが設定されていません"**
→ `.env`ファイルに`VITE_OPENAI_API_KEY`が設定されているか確認し、開発サーバーを再起動してください。

**"OpenAI API Error: 401"**
→ APIキーが正しいか、有効期限が切れていないか確認してください。

**"OpenAI API Error: 429"**
→ API使用量の上限に達しています。OpenAIダッシュボードで使用量を確認してください。

### CSVファイルが見つからない

開発サーバー起動後、ブラウザのコンソールでエラーが出ている場合：
1. `public/data/`ディレクトリにCSVファイルが存在するか確認
2. ブラウザをリロード
3. 開発ツールの「検証対象CSVファイル」の🔄ボタンをクリック

## ビルド

本番環境用にビルドする場合：

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

プレビュー：

```bash
npm run preview
```

## 技術スタック

- **フロントエンド**: React 18 + Vite
- **UI**: TailwindCSS + shadcn/ui
- **アニメーション**: Framer Motion
- **CSV処理**: PapaCSV
- **AI**: OpenAI GPT-4 API
- **バックエンド**: Django REST Framework（LINE連携用）

## ライセンス

このプロジェクトは開発中のMVPデモです。

## 参考資料

- [OpenAI APIセットアップガイド](./OPENAI_SETUP.md)
- [テスト仕様書](./tests/README.md)
- [バリデーションルール定義](./public/data/master/shift_validation_rules.csv)
