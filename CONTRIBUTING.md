# Contributing to Shift Scheduler AI

Shift Scheduler AIへのコントリビュートをご検討いただき、ありがとうございます！このドキュメントでは、プロジェクトへの貢献方法をガイドします。

## 目次

- [行動規範](#行動規範)
- [始める前に](#始める前に)
- [開発フロー](#開発フロー)
- [ブランチ戦略](#ブランチ戦略)
- [コミットメッセージ規約](#コミットメッセージ規約)
- [Pull Request プロセス](#pull-request-プロセス)
- [Issue 管理](#issue-管理)
- [コードレビュー](#コードレビュー)

## 行動規範

本プロジェクトは、全ての参加者に対して敬意と思いやりを持って接することを期待しています。

### 期待される行動
- 建設的なフィードバックを提供する
- 他者の意見を尊重する
- プロジェクトの目標に焦点を当てる
- 新しいコントリビューターを歓迎し、サポートする

### 許容されない行動
- 攻撃的、差別的、ハラスメント的な言動
- 他者の個人情報の無断公開
- プロジェクトと関係のない議論

## 始める前に

### 必要な知識

- **フロントエンド**: React 18+, Vite, Tailwind CSS
- **バックエンド**: Node.js, Express.js, PostgreSQL
- **Git**: 基本的なGit操作（branch, commit, push, pull, merge）

### 環境構築

詳細は [DEVELOPMENT.md](./DEVELOPMENT.md) を参照してください。

## 開発フロー

### 基本的な流れ

1. **Issue を確認または作成**
   - 既存のIssueを確認
   - 新しい機能やバグ修正の場合は、Issue を作成して議論

2. **ブランチを作成**
   - 最新の `staging` ブランチから切り出す
   - 適切な命名規則に従う

3. **開発**
   - コーディングスタイルガイドに従う ([CODING_STYLE.md](./CODING_STYLE.md))
   - 必要に応じてテストを追加 ([TESTING.md](./TESTING.md))
   - こまめにコミット

4. **Pull Request を作成**
   - staging ブランチへの PR を作成
   - テンプレートに従って記入
   - CI チェックが通ることを確認

5. **レビュー対応**
   - レビュアーのフィードバックに対応
   - 承認者の承認を取得

6. **マージ**
   - 承認後、staging にマージ
   - ステージング環境で動作確認

## ブランチ戦略

詳細は [docs/design-docs/20251126_branch_strategy.html](./docs/design-docs/20251126_branch_strategy.html) を参照してください。

### ブランチ構成

```
main (本番環境)
  ↑
  │ マージ（任意のタイミング）
  │
staging (ステージング環境)
  ↑
  │ マージ（開発完了時）
  │
feature/xxx, fix/xxx, etc. (ローカル開発ブランチ)
```

### ブランチ命名規則

ブランチ名は `<type>/<description>` の形式で命名します：

| Type | 用途 | 例 |
|------|------|-----|
| `feature/` | 新機能 | `feature/add-shift-export` |
| `fix/` | バグ修正 | `fix/date-calculation-bug` |
| `refactor/` | リファクタリング | `refactor/optimize-queries` |
| `docs/` | ドキュメント | `docs/update-contributing` |
| `chore/` | その他の作業 | `chore/update-dependencies` |
| `hotfix/` | 緊急本番修正 | `hotfix/critical-auth-bug` |

### ブランチ作成手順

```bash
# 1. staging ブランチに切り替え
git checkout staging

# 2. 最新の状態を取得
git pull origin staging

# 3. 新しいブランチを作成
git checkout -b feature/your-feature-name
```

### Hotfix 運用

本番環境で緊急修正が必要な場合のみ使用します。

```bash
# 1. main ブランチから切り出し
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# 2. 最小限の修正を実施

# 3. main にマージ（承認必須）

# 4. staging にバックポート（必須）
git checkout staging
git pull origin staging
git merge hotfix/critical-bug-fix
git push origin staging
```

## コミットメッセージ規約

### 基本形式

```
<type>: <subject>

<body>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Type の種類

- `feat`: 新機能の追加
- `fix`: バグ修正
- `refactor`: リファクタリング（機能変更なし）
- `docs`: ドキュメントの変更
- `style`: コードスタイルの変更（フォーマット、セミコロンなど）
- `test`: テストの追加・修正
- `chore`: ビルドプロセスや補助ツールの変更
- `ci`: CI/CD 設定の変更
- `perf`: パフォーマンス改善

### 例

```
feat: シフトエクスポート機能を追加

CSVとPDF形式でのシフトエクスポートを実装

- CSVエクスポート機能の実装
- PDFエクスポート機能の実装
- エクスポートボタンのUI追加

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### ベストプラクティス

- ✅ 現在形で書く（"add" not "added"）
- ✅ 簡潔に（50文字以内推奨）
- ✅ 大文字で始めない（小文字で開始）
- ✅ 末尾にピリオドを付けない
- ❌ 曖昧な表現を避ける（"fix bug" → 具体的に何を修正したか）

## Pull Request プロセス

### PR 作成前のチェックリスト

- [ ] 最新の staging ブランチをマージ済み
- [ ] ローカルでテストが通る
- [ ] ESLint/Prettier でエラーがない
- [ ] ビルドが成功する
- [ ] 関連する Issue がある場合はリンク

### PR テンプレート

```markdown
## 概要
<!-- 変更内容の簡潔な説明 -->

## 変更理由
<!-- なぜこの変更が必要か -->

## 変更内容
<!-- 具体的な変更点をリスト形式で -->
-
-

## 影響範囲
- **フロントエンド**:
- **バックエンド**:
- **データベース**:

## テスト
- [ ] ローカルでテスト済み
- [ ] ステージング環境で確認予定

## スクリーンショット（該当する場合）
<!-- UI 変更がある場合は、変更前後のスクリーンショットを添付 -->

## 関連 Issue
Closes #xxx
```

### PR 作成手順

1. **GitHub でPRを作成**
   ```bash
   git push -u origin feature/your-feature-name
   ```

2. **GitHub UI で PR を作成**
   - Base: `staging`
   - Compare: `feature/your-feature-name`
   - テンプレートに従って記入

3. **CI チェックを確認**
   - ✅ Frontend Checks (ESLint, Prettier, Tests, Build)
   - ✅ Backend Checks (Tests, Syntax)

4. **レビュアーをアサイン**
   - 適切なレビュアーを指定

### マージ要件

PR をマージするには、以下の条件を**全て**満たす必要があります：

- ✅ **承認者（Approver）の承認が必要**
- ✅ CI チェックが全てパス
- ✅ コードレビューで指摘事項が解決済み
- ✅ コンフリクトが解消されている

### マージ後

- ステージング環境で動作確認
- 問題があれば追加の修正 PR を作成

## Issue 管理

### Issue 作成のガイドライン

#### バグ報告

```markdown
## 環境
- ブラウザ:
- OS:
- バージョン:

## 再現手順
1.
2.
3.

## 期待される動作


## 実際の動作


## スクリーンショット・エラーログ

```

#### 機能リクエスト

```markdown
## 問題・背景


## 提案する解決策


## 代替案


## 追加情報

```

### ラベルの使用

- `bug`: バグ報告
- `enhancement`: 新機能・改善
- `documentation`: ドキュメント関連
- `good first issue`: 初心者向けのタスク
- `help wanted`: 協力者募集
- `priority: high`: 優先度高
- `priority: medium`: 優先度中
- `priority: low`: 優先度低

## コードレビュー

### レビュアーの責務

- コードの品質を確認
- セキュリティリスクをチェック
- パフォーマンスへの影響を評価
- 既存機能への影響を確認
- 建設的なフィードバックを提供

### レビュー観点

#### 必須チェック項目

- [ ] コードが期待通りに動作するか
- [ ] セキュリティ脆弱性がないか
- [ ] パフォーマンスに悪影響がないか
- [ ] 既存のテストが通るか
- [ ] コーディングスタイルガイドに従っているか

#### 推奨チェック項目

- [ ] エラーハンドリングが適切か
- [ ] ログ出力が適切か
- [ ] コメントが必要な箇所にあるか
- [ ] 命名が適切か
- [ ] 冗長なコードがないか

### レビューコメントの書き方

#### 良い例

```
提案: この部分は useMemo でメモ化することで、再レンダリングを防げます。

const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

#### 避けるべき例

```
これは良くないです。直してください。
```

### 承認基準

承認するには、以下を満たす必要があります：

- ✅ コードが正しく動作する
- ✅ セキュリティリスクがない
- ✅ コーディングスタイルに準拠
- ✅ テストが適切
- ✅ ドキュメントが更新されている（必要な場合）

## その他のガイドライン

### セキュリティ

- 本番データベースに直接SQLを実行しない
- 認証情報をコードにハードコードしない
- 環境変数を適切に管理する
- ユーザー入力は必ずバリデーション

### パフォーマンス

- 不要な再レンダリングを避ける
- データベースクエリを最適化
- 大量データの処理はページネーション

### アクセシビリティ

- セマンティックHTML を使用
- キーボード操作をサポート
- 適切な ARIA 属性を使用

## サポート

質問や不明点がある場合：

1. [DEVELOPMENT.md](./DEVELOPMENT.md) を確認
2. 既存の Issue を検索
3. 新しい Issue を作成してメンターに質問

---

**このプロジェクトへの貢献を心から感謝します！** 🎉
