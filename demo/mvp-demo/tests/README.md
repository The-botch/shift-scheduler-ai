# テストディレクトリ

このディレクトリには、本体のソースコードとは分離されたテスト用のファイルが格納されています。

## ディレクトリ構成

```
tests/
├── README.md                          # このファイル
└── validation/                        # バリデーション機能のテスト
    ├── test-validator.html            # 基本的なバリデーションテスト
    └── test-september-2024.html       # 2024年9月実績データのテスト
```

## テストの実行方法

### 1. 開発サーバーの起動

```bash
npm run dev
```

### 2. ブラウザでテストページにアクセス

開発サーバーが起動したら、以下のURLにアクセス：

#### バリデーション機能テスト

**基本テスト**
```
http://localhost:5174/tests/validation/test-validator.html
```
現在のシフトデータ（transactions/shift.csv）に対してバリデーションを実行します。

**2024年9月実績データテスト**
```
http://localhost:5174/tests/validation/test-september-2024.html
```
過去の実績データ（history/shift_history_2023-2024.csv）から2024年9月分を抽出してバリデーションを実行します。

## テストファイルの追加方法

### 1. 新しいテストカテゴリを追加する場合

```bash
mkdir tests/新カテゴリ名
```

### 2. テストHTMLファイルを作成

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>テスト名</title>
</head>
<body>
  <script type="module">
    // 本体のソースコードをインポート（相対パスに注意）
    import { 機能名 } from '../../src/utils/ファイル名.js'

    // テストコード
  </script>
</body>
</html>
```

### 3. パスの注意点

`tests/validation/` から本体のソースコードを参照する場合：

```javascript
// ❌ 間違い
import { validateShifts } from './src/utils/shiftValidator.js'

// ✅ 正しい
import { validateShifts } from '../../src/utils/shiftValidator.js'
```

## テストのベストプラクティス

1. **テストファイルは本体のsrcディレクトリに入れない**
   - 本体コードとテストコードを明確に分離

2. **テストファイルの命名規則**
   - `test-*.html` または `*.test.html`

3. **テストデータの使用**
   - 実際のデータ（public/data/）を使用してテスト
   - テスト専用のダミーデータが必要な場合は `tests/fixtures/` に配置

4. **テスト結果の可視化**
   - ブラウザでわかりやすく結果を表示
   - エラー・警告を明確に区別
   - 統計情報を提供

## 本番環境での扱い

- `tests/` ディレクトリは開発環境専用です
- 本番ビルド時は除外される想定
- `.gitignore` に追加する必要はありません（テストコードもバージョン管理対象）

## 今後の拡張予定

- [ ] ユニットテスト用のJestセットアップ
- [ ] E2Eテスト用のPlaywright/Cypressセットアップ
- [ ] テスト用フィクスチャーデータの整備
- [ ] CI/CDでの自動テスト実行
