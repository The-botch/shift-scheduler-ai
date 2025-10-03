# シフトスケジューラーAI - MVP Demo

飲食店向けのAI搭載シフト管理システムのMVPデモアプリケーションです。

## 📚 ドキュメント

- [プロダクト概要のLP](https://claude.ai/public/artifacts/0f62011c-69c4-4e2f-abfc-01e52b5323a9)
- [アーキテクチャー設計書並びにシステム構成](https://claude.ai/public/artifacts/6480b2f5-6f71-456b-a184-74fa83ffe577)

## 🚀 主な機能

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

## 📦 セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build
```

## 📁 プロジェクト構成

```
src/
├── components/
│   ├── screens/          # 各画面コンポーネント
│   ├── shared/           # 共通コンポーネント（AppHeader等）
│   └── ui/               # UIコンポーネント（Radix UI）
├── utils/                # ユーティリティ関数
├── config/               # 設定ファイル
├── App.jsx               # メインアプリケーション
├── main.jsx              # エントリーポイント
└── index.css             # グローバルスタイル
```

## 🎨 デザインシステム

統一されたslate系のモノトーン配色を採用し、全画面で一貫したUIを実現しています。

- カスタムCSSクラス: `app-header`, `app-card`, `app-container`等
- Tailwind CSS v4の`@theme`ディレクティブを使用
- レスポンシブ対応

## 📊 データフロー

1. CSVファイルからマスタデータを読み込み
2. IndexedDBに実績データを保存
3. Rechartsでデータを可視化
4. 予実差分を自動計算・表示

## 🔒 ライセンス

内部使用のみ
