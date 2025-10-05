# 層分離アーキテクチャ設計

## 概要

Clean Architectureの原則に基づき、以下の3層に分離します：

### 1. ドメイン層 (domain/)
- **責務**: ビジネスロジック、エンティティ、ドメインルール
- **依存**: なし（他の層に依存しない）
- **内容**:
  - エンティティ: Staff, Shift, Store, Constraint
  - バリデーションルール
  - ビジネスロジック

### 2. アプリケーション層 (application/)
- **責務**: ユースケース、アプリケーションロジック
- **依存**: ドメイン層のみ
- **内容**:
  - ユースケース: CreateShift, ValidateShift, GenerateShift
  - DTOs (Data Transfer Objects)
  - インターフェース定義

### 3. インフラ層 (infrastructure/)
- **責務**: 外部システム連携、データ永続化
- **依存**: ドメイン層、アプリケーション層
- **内容**:
  - API通信 (OpenAI, Backend)
  - CSV読み込み
  - IndexedDB操作
  - ファイルシステム操作

### 4. プレゼンテーション層 (既存のcomponents/)
- **責務**: UI表示、ユーザー操作
- **依存**: アプリケーション層
- **内容**: React コンポーネント

## ディレクトリ構造

```
src/
├── domain/                 # ドメイン層
│   ├── entities/          # エンティティ
│   │   ├── Shift.js
│   │   ├── Staff.js
│   │   ├── Store.js
│   │   └── Constraint.js
│   ├── services/          # ドメインサービス
│   │   ├── shiftValidator.js
│   │   └── shiftGenerator.js
│   └── types/             # 型定義
│
├── application/           # アプリケーション層
│   ├── usecases/         # ユースケース
│   │   ├── createShift.js
│   │   ├── validateShift.js
│   │   └── setupVectorStore.js
│   ├── dtos/             # DTO
│   └── ports/            # インターフェース
│       ├── IOpenAIClient.js
│       └── IDataRepository.js
│
├── infrastructure/        # インフラ層
│   ├── api/              # API通信
│   │   ├── openai/
│   │   └── backend/
│   ├── repositories/     # データリポジトリ
│   │   ├── csvRepository.js
│   │   └── indexedDBRepository.js
│   └── adapters/         # アダプター
│
└── components/           # プレゼンテーション層（既存）
```

## 移行計画

1. **Phase 1**: ドメイン層作成
   - エンティティクラス作成
   - バリデーションロジック移動

2. **Phase 2**: インフラ層作成
   - API通信をinfrastructure/apiに移動
   - リポジトリパターン適用

3. **Phase 3**: アプリケーション層作成
   - ユースケース抽出
   - コンポーネントから分離

4. **Phase 4**: 既存コード移行
   - 段階的に既存utilsをリファクタ
