# 👨‍💻 開発ガイドライン

## 開発フロー

### 1. ブランチ戦略
```
main (本番環境)
├── develop (開発統合)
    ├── feature/csv-upload
    ├── feature/ai-integration
    └── feature/calendar-ui
```

### 2. コミットメッセージ規約
```bash
# 機能追加
feat: CSV upload functionality

# バグ修正
fix: OpenAI API timeout handling

# ドキュメント
docs: update API specification

# リファクタリング
refactor: extract shift validation logic

# テスト
test: add unit tests for AI service
```

### 3. プルリクエスト
- **機能完成後**にdevelopブランチへPR
- **レビュー必須**（最低1名）
- **CI通過後**にマージ

## コーディング規約

### Python (Django)

#### コード品質
```python
# Black でフォーマット
black backend/

# flake8 でリント
flake8 backend/

# isort でインポート整理
isort backend/
```

#### 命名規約
```python
# クラス: PascalCase
class ShiftPlan:
    pass

# 関数・変数: snake_case
def generate_shift():
    staff_count = 5

# 定数: UPPER_SNAKE_CASE
MAX_HOURS_PER_DAY = 8
```

#### Docstring
```python
def generate_shift(staff_list, constraints):
    """
    スタッフリストと制約からシフトを生成する
    
    Args:
        staff_list (List[Staff]): スタッフのリスト
        constraints (Dict): 制約条件
    
    Returns:
        ShiftPlan: 生成されたシフト計画
        
    Raises:
        ValidationError: 制約条件が無効な場合
    """
    pass
```

### TypeScript (Next.js)

#### コード品質
```bash
# Prettier でフォーマット
npm run format

# ESLint でリント
npm run lint

# 型チェック
npm run type-check
```

#### 命名規約
```typescript
// インターface: PascalCase
interface StaffData {
  staffId: number;
  name: string;
}

// 関数・変数: camelCase
const generateShift = () => {};
const staffCount = 5;

// 定数: UPPER_SNAKE_CASE
const MAX_HOURS_PER_DAY = 8;

// コンポーネント: PascalCase
const ShiftCalendar = () => {};
```

#### 型定義
```typescript
// 明示的な型定義
interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

// Generics使用
const fetchData = async <T>(url: string): Promise<T> => {
  // 実装
};
```

## ファイル構成

### バックエンド
```
backend/
├── shift_scheduler/           # Django プロジェクト
│   ├── settings/
│   │   ├── base.py           # 基本設定
│   │   ├── development.py    # 開発環境
│   │   └── production.py     # 本番環境
│   └── urls.py
├── apps/                     # Django アプリ
│   ├── staff/               # スタッフ管理
│   ├── shifts/              # シフト管理
│   ├── ai_engine/           # AI統合
│   └── core/                # 共通機能
├── fixtures/                # テストデータ
├── tests/                   # テストファイル
└── requirements/
    ├── base.txt
    ├── development.txt
    └── production.txt
```

### フロントエンド
```
frontend/
├── src/
│   ├── app/                 # App Router
│   ├── components/          # 再利用可能コンポーネント
│   │   ├── ui/             # 基本UIコンポーネント
│   │   ├── forms/          # フォームコンポーネント
│   │   └── calendar/       # カレンダー関連
│   ├── hooks/              # カスタムフック
│   ├── lib/                # ユーティリティ
│   ├── types/              # 型定義
│   └── styles/             # グローバルスタイル
├── public/                 # 静的ファイル
└── tests/                  # テストファイル
```

## テスト戦略

### バックエンドテスト

#### Unit Tests
```python
# tests/test_ai_engine.py
import pytest
from apps.ai_engine.services import ShiftGenerator

class TestShiftGenerator:
    def test_generate_basic_shift(self):
        generator = ShiftGenerator()
        result = generator.generate(staff_list, constraints)
        
        assert result.status == 'success'
        assert len(result.shifts) > 0
```

#### Integration Tests
```python
# tests/test_api.py
from rest_framework.test import APITestCase

class TestShiftAPI(APITestCase):
    def test_shift_generation_endpoint(self):
        response = self.client.post('/api/shifts/generate/', data)
        self.assertEqual(response.status_code, 200)
```

### フロントエンドテスト

#### Component Tests
```typescript
// tests/ShiftCalendar.test.tsx
import { render, screen } from '@testing-library/react';
import ShiftCalendar from '@/components/calendar/ShiftCalendar';

test('renders shift calendar', () => {
  render(<ShiftCalendar shifts={mockShifts} />);
  expect(screen.getByTestId('calendar')).toBeInTheDocument();
});
```

#### E2E Tests
```typescript
// tests/e2e/shift-creation.spec.ts
import { test, expect } from '@playwright/test';

test('shift creation flow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="upload-csv"]');
  // テストフロー
});
```

## パフォーマンス指標

### バックエンド
- **API応答時間**: < 2秒
- **シフト生成時間**: < 10秒 (10人×7日)
- **メモリ使用量**: < 512MB
- **CPU使用率**: < 80%

### フロントエンド
- **First Contentful Paint**: < 1.5秒
- **Time to Interactive**: < 3秒
- **Bundle Size**: < 1MB (gzip)

## セキュリティ

### API セキュリティ
```python
# settings.py
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
```

### データ保護
- **個人情報の暗号化**
- **APIキーの環境変数管理**
- **SQL インジェクション対策**
- **CSRF 保護**

## デプロイ

### 開発環境
```bash
# ローカル開発
docker-compose up -d

# テスト実行
npm test
python manage.py test
```

### 本番環境

#### フロントエンド (Vercel)
```bash
# 自動デプロイ
git push origin main

# 手動デプロイ
vercel --prod
```

#### バックエンド (Railway)
```bash
# 自動デプロイ
git push origin main

# 環境変数設定
railway variables set OPENAI_API_KEY=sk-xxx
```

## 監視・ログ

### エラー監視
- **Sentry**: エラー追跡
- **DataDog**: パフォーマンス監視
- **GitHub Actions**: CI/CD

### ログ設定
```python
# Django logging
LOGGING = {
    'version': 1,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'django.log',
        },
    },
    'loggers': {
        'apps.ai_engine': {
            'handlers': ['file'],
            'level': 'DEBUG',
        },
    },
}
```

## AI・プロンプト管理

### プロンプトバージョン管理
```python
# apps/ai_engine/prompts/v1.py
SHIFT_GENERATION_PROMPT = """
あなたはシフト管理の専門家です...
バージョン: 1.0
作成日: 2024-12-01
"""

# apps/ai_engine/prompts/v2.py  
SHIFT_GENERATION_PROMPT = """
改良版プロンプト...
バージョン: 2.0
変更点: より詳細な制約処理
"""
```

### A/Bテスト
```python
# プロンプト比較テスト
def test_prompt_performance():
    results_v1 = test_with_prompt(PROMPT_V1)
    results_v2 = test_with_prompt(PROMPT_V2)
    
    assert results_v2.accuracy > results_v1.accuracy
```

## 1ヶ月POC特別ルール

### 開発速度優先
- **コードレビュー**: 簡素化（重要な部分のみ）
- **テスト**: 主要機能のみ
- **ドキュメント**: 最小限（後で補強）

### 品質vs速度のバランス
- **セキュリティ**: 最低限確保
- **パフォーマンス**: 基本的な最適化のみ
- **エラーハンドリング**: ユーザー体験を損なわない程度