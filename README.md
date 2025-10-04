# AIシフトスケジューラー

AIによる自動シフト生成システムのMVPデモアプリケーションです。

## 📚 ドキュメント

- [プロダクト概要のLP](https://claude.ai/public/artifacts/0f62011c-69c4-4e2f-abfc-01e52b5323a9)
- [アーキテクチャー設計書並びにシステム構成](https://sysdiag-datorr.manus.space)

## クイックスタート

```bash
# リポジトリをクローン
git clone https://github.com/info-mnml/shift-scheduler-ai.git
cd shift-scheduler-ai/demo/mvp-demo

# 依存関係をインストール
npm install

# 環境変数の設定（OpenAI API使用時）
cp .env.example .env
# .envファイルを編集してAPIキーを設定

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:5174 にアクセスしてデモを開始してください。

**📖 詳細なセットアップ・使い方については [demo/mvp-demo/README.md](./demo/mvp-demo/README.md) を参照してください。**

## システム機能

### 主な機能

- **ダッシュボード**: 売上・人件費・利益の予実分析とグラフ表示
- **シフト管理**: 月別シフトの作成・編集・閲覧
- **スタッフ管理**: スタッフ情報と給与計算
- **店舗管理**: 店舗情報と制約条件の管理
- **制約管理**: 労働基準法などの制約設定
- **予実管理**: 実績データのインポートと分析
- **LINEメッセージ管理**: シフト希望の収集
- **開発者ツール**: バリデーションチェック、AI対話（GPT-4）、シフト自動生成

詳細な機能説明は以下を参照：
- [Issue #22](https://github.com/info-mnml/shift-scheduler-ai/issues/22)
- [demo/mvp-demo/README.md](./demo/mvp-demo/README.md)

## 🛠️ 技術スタック

- **Frontend**: React 18, Vite
- **UI Framework**: Tailwind CSS v4, Radix UI
- **Charts**: Recharts
- **Animation**: Framer Motion
- **Data Storage**: IndexedDB
- **CSV Processing**: PapaParse
- **AI**: OpenAI GPT-4 API
- **Backend**: Django REST Framework（LINE連携用）

## 📁 プロジェクト構成

```
shift-scheduler-ai/
├── demo/mvp-demo/            # フロントエンドMVPデモ
│   ├── src/
│   │   ├── components/
│   │   │   ├── screens/      # 各画面コンポーネント
│   │   │   ├── shared/       # 共通コンポーネント
│   │   │   └── ui/           # UIコンポーネント
│   │   ├── utils/            # ユーティリティ
│   │   │   ├── shiftValidator.js    # バリデーションエンジン
│   │   │   ├── fileScanner.js       # CSV動的スキャン
│   │   │   └── openaiClient.js      # OpenAI API連携
│   │   └── config/           # 設定ファイル
│   ├── public/
│   │   ├── data/             # CSVデータファイル
│   │   └── logs/             # AI対話ログ保存先
│   ├── tests/                # テストファイル
│   ├── README.md             # 詳細ドキュメント
│   └── OPENAI_SETUP.md       # OpenAI APIセットアップガイド
├── backend/                  # Djangoバックエンド（LINE連携）
└── README.md                 # このファイル
```

詳細な構成は [demo/mvp-demo/README.md](./demo/mvp-demo/README.md) を参照してください。

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
