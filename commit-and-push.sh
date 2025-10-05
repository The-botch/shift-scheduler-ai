#!/bin/bash
cd /Users/yukiuchiyama/Dev/shift-scheduler-ai/shift-scheduler-ai

git add .

git commit -m "refactor: プロジェクト構造をリファクタリング

- セキュリティ対策: .envをGit管理外に、.env.example追加
- Linter/Formatter導入: ESLint + Prettier設定
- 設定の外部化: config/default.js作成
- バックエンド分離: backend/ディレクトリ作成、server.js移行
- ドキュメント整備: ARCHITECTURE.md, CONFIGURATION.md, QUICK_START.md追加
- DevTools移動: 開発ツールをsrc/dev/に配置

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
