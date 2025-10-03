# AIシフトスケジューラー

AIによる自動シフト生成システムのMVPデモアプリケーションです。

## 📚 ドキュメント

- [プロダクト概要のLP](https://claude.ai/public/artifacts/0f62011c-69c4-4e2f-abfc-01e52b5323a9)
- [アーキテクチャー設計書並びにシステム構成](https://claude.ai/public/artifacts/6480b2f5-6f71-456b-a184-74fa83ffe577)

## デモ起動方法

```bash
# リポジトリをクローン
git clone https://github.com/info-mnml/shift-scheduler-ai.git
cd shift-scheduler-ai/demo/mvp-demo

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:5173 にアクセスしてデモを開始してください。

## システム機能

詳細な機能説明は [Issue #22](https://github.com/info-mnml/shift-scheduler-ai/issues/22) を参照してください。

### 主な機能

- **ダッシュボード**: 売上・人件費・利益の予実分析とグラフ表示
- **シフト管理**: 月別シフトの作成・編集・閲覧
- **スタッフ管理**: スタッフ情報と給与計算
- **店舗管理**: 店舗情報と制約条件の管理
- **制約管理**: 労働基準法などの制約設定
- **予実管理**: 実績データのインポートと分析
- **LINEメッセージ管理**: シフト希望の収集
- **シフト希望管理**: スタッフのシフト希望の確認

## 🛠️ 技術スタック

- **Frontend**: React 18, Vite
- **UI Framework**: Tailwind CSS v4, Radix UI
- **Charts**: Recharts
- **Animation**: Framer Motion
- **Data Storage**: IndexedDB
- **CSV Processing**: PapaParse

## 📁 プロジェクト構成

```
demo/mvp-demo/
├── src/
│   ├── components/
│   │   ├── screens/          # 各画面コンポーネント
│   │   ├── shared/           # 共通コンポーネント（AppHeader等）
│   │   └── ui/               # UIコンポーネント（Radix UI）
│   ├── utils/                # ユーティリティ関数
│   ├── config/               # 設定ファイル
│   ├── App.jsx               # メインアプリケーション
│   ├── main.jsx              # エントリーポイント
│   └── index.css             # グローバルスタイル
└── public/data/              # CSVデータファイル
```

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
