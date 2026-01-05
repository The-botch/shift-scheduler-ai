# シフト乖離分析レポート機能 設計書

## 1. 機能概要

### 目的
第1案（初稿）と第2案（確定版）のシフト差異を分析し、店舗運営改善とAI予測精度向上に活用するためのレポート機能。

### ユースケース
1. 第2案承認後、自動でレポート生成
2. レポート一覧画面から過去のレポートを閲覧
3. 店舗オーナー向けの経営提言を確認
4. AI開発者向けの精度向上示唆を確認

### 画面イメージ
```
┌─────────────────────────────────────────────────────┐
│  分析レポート一覧                          [生成する] │
├─────────────────────────────────────────────────────┤
│  フィルター: [2026年 ▼] [全店舗 ▼]                   │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │ 2026年1月  第1案 vs 第2案                    │   │
│  │ 生成日: 2026-01-05  一致率: 35.1%           │   │
│  │ 6店舗 / 30名                       [詳細 →] │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 2025年12月  第1案 vs 第2案                   │   │
│  │ 生成日: 2025-12-05  一致率: 42.3%           │   │
│  │ 6店舗 / 28名                       [詳細 →] │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 2. データベース設計

### 2.1 新規テーブル: `ops.analysis_reports`

```sql
CREATE TABLE IF NOT EXISTS ops.analysis_reports (
    report_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,

    -- 対象期間
    plan_year INT NOT NULL,
    plan_month INT NOT NULL,

    -- 比較対象プラン
    first_plan_id INT,
    second_plan_id INT,

    -- サマリー統計
    total_comparison INT NOT NULL,        -- 比較対象シフト数
    match_count INT NOT NULL,             -- 完全一致数
    time_diff_count INT NOT NULL,         -- 時間変更数
    first_only_count INT NOT NULL,        -- 第1案のみ（削除）
    second_only_count INT NOT NULL,       -- 第2案のみ（追加）
    match_rate DECIMAL(5,2) NOT NULL,     -- 一致率(%)

    -- 第1案/第2案のシフト総数
    first_plan_total INT,
    second_plan_total INT,

    -- 分析対象
    store_count INT,                      -- 店舗数
    staff_count INT,                      -- スタッフ数

    -- AI分析結果（JSON）
    store_analysis JSONB,                 -- 店舗別分析
    staff_analysis JSONB,                 -- スタッフ別分析
    contract_analysis JSONB,              -- 契約形態別分析
    dow_analysis JSONB,                   -- 曜日別分析
    time_analysis JSONB,                  -- 時間帯分析

    -- AI生成コンテンツ
    executive_summary JSONB,              -- エグゼクティブサマリー
    business_recommendations JSONB,       -- 店舗運営への提言
    ai_improvements JSONB,                -- AI予測精度向上への示唆

    -- メタ情報
    ai_model VARCHAR(50),                 -- 使用AIモデル
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 外部キー
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (first_plan_id) REFERENCES ops.shift_plans(plan_id) ON DELETE SET NULL,
    FOREIGN KEY (second_plan_id) REFERENCES ops.shift_plans(plan_id) ON DELETE SET NULL,

    -- 一意制約（同じ年月のレポートは1つ）
    CONSTRAINT uq_analysis_report UNIQUE (tenant_id, plan_year, plan_month)
);

-- インデックス
CREATE INDEX idx_analysis_reports_tenant_period
ON ops.analysis_reports(tenant_id, plan_year, plan_month);
```

### 2.2 JSONB カラムの構造

```javascript
// store_analysis
[
  {
    "store_id": 6,
    "store_name": "COME 麻布台",
    "match": 54,
    "time_diff": 19,
    "first_only": 47,
    "second_only": 27,
    "total": 147,
    "match_rate": 36.7
  }
]

// staff_analysis
[
  {
    "staff_id": 100,
    "staff_name": "加藤智津子",
    "employment_type": "PART_TIME",
    "match": 19,
    "time_diff": 1,
    "first_only": 2,
    "second_only": 1,
    "total": 23,
    "match_rate": 82.6
  }
]

// executive_summary (AI生成)
{
  "key_message": "第1案から約65%のシフトに変更が発生...",
  "insights": [
    {
      "type": "positive",
      "title": "うまくいっている点",
      "description": "Tipsy Tiger（70.4%）は高い一致率"
    }
  ]
}

// business_recommendations (AI生成)
[
  {
    "title": "第1案作成前に希望を確定させる",
    "problem": "現在、第1案から約65%のシフトが変更されている",
    "solution": "希望収集の締切を第1案作成の3日前に設定",
    "benefits": ["連絡の往復が減る", "修正回数が減る"]
  }
]

// ai_improvements (AI生成)
{
  "data_system": ["固定シフトフラグの導入", "デフォルト終了時間の変更"],
  "operation": ["希望収集の早期化", "0%一致スタッフへのフォロー"],
  "expected_effect": {
    "current_rate": 35.1,
    "target_rate": 60,
    "improvements": ["固定シフトスタッフ自動割当で+100件"]
  }
}
```

---

## 3. バックエンドAPI設計

### 3.1 エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/reports` | レポート一覧取得 |
| GET | `/api/reports/:report_id` | レポート詳細取得 |
| POST | `/api/reports/generate` | レポート生成（Claude API呼び出し） |
| DELETE | `/api/reports/:report_id` | レポート削除 |

### 3.2 新規ルートファイル

**ファイル**: `backend/src/routes/reports.js`

```javascript
import express from 'express'
import { query } from '../config/database.js'
import { generateAnalysisWithClaude } from '../services/claudeAnalyzer.js'

const router = express.Router()

/**
 * GET /api/reports
 * レポート一覧取得
 */
router.get('/', async (req, res) => {
  const { tenant_id, year } = req.query

  const result = await query(`
    SELECT
      report_id, tenant_id, plan_year, plan_month,
      match_rate, total_comparison, match_count,
      store_count, staff_count, generated_at
    FROM ops.analysis_reports
    WHERE tenant_id = $1
      AND ($2::int IS NULL OR plan_year = $2)
    ORDER BY plan_year DESC, plan_month DESC
  `, [tenant_id, year || null])

  res.json({ success: true, data: result.rows })
})

/**
 * GET /api/reports/:report_id
 * レポート詳細取得
 */
router.get('/:report_id', async (req, res) => {
  const { report_id } = req.params

  const result = await query(`
    SELECT * FROM ops.analysis_reports WHERE report_id = $1
  `, [report_id])

  res.json({ success: true, data: result.rows[0] })
})

/**
 * POST /api/reports/generate
 * レポート生成
 */
router.post('/generate', async (req, res) => {
  const { tenant_id, year, month } = req.body

  // 1. 比較データ収集（SQL）
  const comparisonData = await collectComparisonData(tenant_id, year, month)

  // 2. Claude APIで分析
  const aiAnalysis = await generateAnalysisWithClaude(comparisonData)

  // 3. DBに保存
  const result = await query(`
    INSERT INTO ops.analysis_reports (
      tenant_id, plan_year, plan_month,
      total_comparison, match_count, time_diff_count,
      first_only_count, second_only_count, match_rate,
      store_analysis, staff_analysis, contract_analysis,
      dow_analysis, time_analysis,
      executive_summary, business_recommendations, ai_improvements,
      ai_model
    ) VALUES ($1, $2, $3, ...)
    RETURNING *
  `, [...])

  res.json({ success: true, data: result.rows[0] })
})

export default router
```

### 3.3 server.js への追加

```javascript
import reportsRouter from './routes/reports.js'
app.use('/api/reports', reportsRouter)
```

---

## 4. Claude API連携

### 4.1 新規サービスファイル

**ファイル**: `backend/src/services/claudeAnalyzer.js`

```javascript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function generateAnalysisWithClaude(data) {
  const prompt = buildAnalysisPrompt(data)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  })

  return JSON.parse(response.content[0].text)
}

function buildAnalysisPrompt(data) {
  return `
あなたは飲食店チェーンの経営コンサルタントであり、シフト最適化AIの開発者でもあります。

以下のシフト比較データを分析し、JSONで回答してください。

======================
【入力データ】
======================

■ 全体サマリー
- 比較対象シフト数: ${data.summary.total}件
- 完全一致: ${data.summary.match}件 (${data.summary.matchRate}%)
- 時間変更: ${data.summary.timeDiff}件
- 第1案のみ（削除）: ${data.summary.firstOnly}件
- 第2案のみ（追加）: ${data.summary.secondOnly}件

■ 店舗別データ
${JSON.stringify(data.byStore, null, 2)}

■ スタッフ別データ
${JSON.stringify(data.byStaff, null, 2)}

■ 契約形態別データ
${JSON.stringify(data.byContract, null, 2)}

■ 曜日別データ
${JSON.stringify(data.byDayOfWeek, null, 2)}

■ 時間変更パターン（上位10件）
${JSON.stringify(data.timeChangePatterns, null, 2)}

======================
【出力形式】
======================

{
  "executiveSummary": {
    "keyMessage": "（1-2文で最も重要な発見）",
    "insights": [
      { "type": "positive|negative|neutral", "title": "（10文字）", "description": "（30文字）" }
    ]
  },
  "storeAnalysis": {
    "highMatchStores": { "description": "...", "characteristics": [...] },
    "lowMatchStores": { "description": "...", "characteristics": [...] },
    "recommendations": [...]
  },
  "staffAnalysis": {
    "highMatchCharacteristics": [...],
    "lowMatchCharacteristics": [...],
    "recommendations": [...]
  },
  "contractAnalysis": {
    "insights": [...],
    "recommendations": [...]
  },
  "dayOfWeekAnalysis": {
    "stableDays": { "days": [...], "reasons": [...] },
    "unstableDays": { "days": [...], "reasons": [...] },
    "recommendations": [...]
  },
  "timeAnalysis": {
    "insights": [...],
    "recommendations": [...]
  },
  "businessRecommendations": [
    {
      "title": "...",
      "problem": "...",
      "solution": "...",
      "benefits": [...]
    }
  ],
  "aiImprovements": {
    "dataSystem": [...],
    "operation": [...],
    "expectedEffect": {
      "currentRate": ${data.summary.matchRate},
      "targetRate": 60,
      "improvements": [...]
    }
  }
}

======================
【分析の観点】
======================

1. **店舗オーナー向け**（businessRecommendations）
   - 専門用語を使わず、経営者が理解できる言葉で
   - 「なぜこの問題が起きているか」を説明
   - 売上・人件費・スタッフ満足度の観点を含める

2. **AI開発者向け**（aiImprovements）
   - 精度向上のための具体的なアクション
   - 数値目標を含める

3. **0%一致スタッフ**
   - 「なぜ全く合わないのか」を推測
   - 新規追加/削除のみのスタッフは入退社の可能性を示唆

4. **時間変更パターン**
   - 最も多いパターンの原因を推測
   - デフォルト設定の見直し提案

JSONのみを出力してください。
`
}
```

### 4.2 環境変数

**追加が必要な環境変数**:
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 4.3 パッケージ追加

```bash
cd backend && npm install @anthropic-ai/sdk
```

---

## 5. フロントエンド設計

### 5.1 新規ファイル

| ファイル | 説明 |
|---------|------|
| `frontend/src/components/screens/AnalysisReports.jsx` | レポート一覧画面 |
| `frontend/src/components/screens/AnalysisReportDetail.jsx` | レポート詳細画面 |
| `frontend/src/infrastructure/repositories/ReportRepository.js` | API呼び出し |
| `frontend/src/hooks/useAnalysisReports.js` | カスタムフック |

### 5.2 Repository

```javascript
// frontend/src/infrastructure/repositories/ReportRepository.js
import { BACKEND_API_URL } from '../../config/api'

export class ReportRepository {
  async getReports(tenantId, year = null) {
    const params = new URLSearchParams({ tenant_id: tenantId })
    if (year) params.append('year', year)

    const response = await fetch(`${BACKEND_API_URL}/api/reports?${params}`)
    const result = await response.json()
    return result.data
  }

  async getReport(reportId) {
    const response = await fetch(`${BACKEND_API_URL}/api/reports/${reportId}`)
    const result = await response.json()
    return result.data
  }

  async generateReport(tenantId, year, month) {
    const response = await fetch(`${BACKEND_API_URL}/api/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, year, month })
    })
    return await response.json()
  }
}

export const reportRepository = new ReportRepository()
```

### 5.3 画面コンポーネント（一覧）

```javascript
// frontend/src/components/screens/AnalysisReports.jsx
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { useTenant } from '../../contexts/TenantContext'
import { reportRepository } from '../../infrastructure/repositories/ReportRepository'

const AnalysisReports = ({ onSelectReport }) => {
  const { tenantId } = useTenant()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState(null)
  const [generating, setGenerating] = useState(false)

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const data = await reportRepository.getReports(tenantId, yearFilter)
      setReports(data)
    } finally {
      setLoading(false)
    }
  }, [tenantId, yearFilter])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleGenerate = async () => {
    const year = new Date().getFullYear()
    const month = new Date().getMonth() + 1

    setGenerating(true)
    try {
      await reportRepository.generateReport(tenantId, year, month)
      await loadReports()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>分析レポート</CardTitle>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? '生成中...' : 'レポート生成'}
          </Button>
        </CardHeader>
        <CardContent>
          {/* フィルター */}
          <div className="mb-4">
            <select
              value={yearFilter || ''}
              onChange={e => setYearFilter(e.target.value || null)}
              className="border rounded px-3 py-2"
            >
              <option value="">全期間</option>
              <option value="2026">2026年</option>
              <option value="2025">2025年</option>
            </select>
          </div>

          {/* レポート一覧 */}
          {loading ? (
            <p>読み込み中...</p>
          ) : reports.length === 0 ? (
            <p>レポートがありません</p>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <div
                  key={report.report_id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectReport(report.report_id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">
                        {report.plan_year}年{report.plan_month}月 第1案 vs 第2案
                      </h3>
                      <p className="text-sm text-gray-500">
                        生成日: {new Date(report.generated_at).toLocaleDateString()}
                        　|　{report.store_count}店舗 / {report.staff_count}名
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${
                        report.match_rate >= 50 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {report.match_rate}%
                      </span>
                      <p className="text-sm text-gray-500">一致率</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default AnalysisReports
```

### 5.4 ルーティング追加

**App.jsx への追加**:
```javascript
// 状態追加
const [showAnalysisReports, setShowAnalysisReports] = useState(false)
const [selectedReportId, setSelectedReportId] = useState(null)

// ルートマッピング追加
'/shift/reports': showAnalysisReports

// ナビゲーション関数追加
const goToAnalysisReports = () => {
  resetAllScreens()
  setShowAnalysisReports(true)
  navigate('/shift/reports')
}
```

---

## 6. 実装ステップ

### Phase 1: インフラ準備（15分）
1. [ ] `npm install @anthropic-ai/sdk`
2. [ ] `.env.local` に `ANTHROPIC_API_KEY` 追加
3. [ ] DBマイグレーション: `ops.analysis_reports` テーブル作成

### Phase 2: バックエンド（60分）
4. [ ] `backend/src/services/claudeAnalyzer.js` 作成
5. [ ] `backend/src/routes/reports.js` 作成
6. [ ] `backend/src/server.js` にルート追加
7. [ ] 比較データ収集SQL実装
8. [ ] 動作確認（Postman等でAPI呼び出し）

### Phase 3: フロントエンド（60分）
9. [ ] `ReportRepository.js` 作成
10. [ ] `AnalysisReports.jsx` 作成（一覧画面）
11. [ ] `AnalysisReportDetail.jsx` 作成（詳細画面）
12. [ ] `App.jsx` にルーティング追加
13. [ ] ナビゲーションメニューにリンク追加

### Phase 4: 統合テスト（30分）
14. [ ] レポート生成 → 一覧表示 → 詳細表示の一連のフロー確認
15. [ ] Claude APIのエラーハンドリング確認
16. [ ] 既存データでの動作確認

---

## 7. 修正対象ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `backend/package.json` | @anthropic-ai/sdk 追加 |
| `backend/.env.local` | ANTHROPIC_API_KEY 追加 |
| `backend/src/server.js` | reports ルート追加 |
| `backend/src/routes/reports.js` | 新規作成 |
| `backend/src/services/claudeAnalyzer.js` | 新規作成 |
| `scripts/database/ddl/` | マイグレーションSQL |
| `frontend/src/infrastructure/repositories/ReportRepository.js` | 新規作成 |
| `frontend/src/components/screens/AnalysisReports.jsx` | 新規作成 |
| `frontend/src/components/screens/AnalysisReportDetail.jsx` | 新規作成 |
| `frontend/src/App.jsx` | ルーティング追加 |

---

## 8. 注意事項

1. **Claude API料金**: 1レポートあたり約1-2円（Sonnet使用時）
2. **エラーハンドリング**: API失敗時のリトライ/フォールバック
3. **レート制限**: 同時生成リクエストの制御
4. **キャッシュ**: 同じ年月のレポートは上書き（UPSERT）
5. **セキュリティ**: APIキーは環境変数で管理、フロントエンドに露出させない
