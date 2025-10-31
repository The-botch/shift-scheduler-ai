# ハードコーディングされた設定値レポート

このドキュメントは、ソースコード内にハードコーディングされている設定値を一覧化し、設定ファイルへの外出しを推奨するものです。

## 📊 サマリー

| カテゴリ | ハードコード箇所数 | 優先度 |
|---------|-----------------|--------|
| tenant_id = 1 | バックエンド: 50+箇所、フロントエンド: 5箇所 | 🔴 HIGH |
| store_id = 1 | フロントエンド: 1箇所 | 🟡 MEDIUM |
| staff_id = 5 | フロントエンド: 1箇所 (デモ用) | 🟡 MEDIUM |
| plan_id = 4 | フロントエンド: 4箇所 | 🟡 MEDIUM |
| 年月 (2024/11) | フロントエンド: 3箇所 | 🟢 LOW |

---

## 🔴 HIGH: tenant_id = 1

### バックエンド (backend/src/routes/)

**影響範囲**: すべてのAPIエンドポイントのデフォルト値

#### shifts.js (12箇所)
```javascript
// Line 19, 108, 183, 309, 356, 418, 507
const { tenant_id = 1, ... } = req.query;

// Line 409: ドキュメント
* - tenant_id: テナントID (required, default: 1)
```

#### analytics.js (5箇所)
```javascript
// Line 12, 95, 157, 220
const { tenant_id = 1, ... } = req.query;
```

#### master.js (30箇所以上)
```javascript
// Line 47, 82, 117, 166, 197, 229, 266, 305, 347, 406, 440, 476, 517, 562, 595, 634, 676
const { tenant_id = 1, ... } = req.query;

// Line 688-695: 一括取得API
query('SELECT * FROM core.stores WHERE tenant_id = $1 ...', [tenant_id])
```

### フロントエンド (frontend/src/)

#### utils/shiftInputCollector.js (Line 393)
```javascript
const url = `${apiUrl}/api/shifts/preferences?tenant_id=1&year=${year}&month=${month}`
```

#### components/screens/LineShiftInput.jsx (Line 189)
```javascript
const DEMO_PARAMS = {
  tenant_id: 1,
  ...
}
```

#### infrastructure/repositories/*.js (3箇所)
```javascript
// ShiftRepository.js:11
static DEFAULT_TENANT_ID = 1

// MasterRepository.js:11
static DEFAULT_TENANT_ID = 1

// AnalyticsRepository.js:11
static DEFAULT_TENANT_ID = 1
```

**推奨対応**:
- 環境変数 `DEFAULT_TENANT_ID` を `.env` に追加
- バックエンド: `process.env.DEFAULT_TENANT_ID || 1`
- フロントエンド: `import.meta.env.VITE_DEFAULT_TENANT_ID || 1`

---

## 🟡 MEDIUM: store_id = 1

### フロントエンド

#### components/screens/LineShiftInput.jsx (Line 190)
```javascript
const DEMO_PARAMS = {
  tenant_id: 1,
  store_id: 1,  // ←
  ...
}
```

**推奨対応**:
- デモ用設定ファイル `frontend/src/config/demo.js` を作成
- または環境変数 `VITE_DEFAULT_STORE_ID`

---

## 🟡 MEDIUM: staff_id = 5

### フロントエンド

#### components/screens/LineShiftInput.jsx (Line 191)
```javascript
const DEMO_PARAMS = {
  tenant_id: 1,
  store_id: 1,
  staff_id: 5, // デモ用のスタッフID ←
  ...
}
```

**推奨対応**:
- デモ用設定ファイルに移動
- または環境変数 `VITE_DEMO_STAFF_ID`

---

## 🟡 MEDIUM: plan_id = 4

### フロントエンド

#### components/screens/FirstPlan.jsx (Line 84-86)
```javascript
// APIから並行読み込み - plan_id=4は2024年10月のシフト計画
const [shiftsResult, staffResult, rolesResult] = await Promise.all([
  shiftRepository.getShifts({ planId: 4 }),
  ...
])
```

#### components/screens/SecondPlan.jsx (Line 180, 212)
```javascript
// Line 180
shiftRepository.getShifts({ planId: 4 }), // 仮のplan_id、実際には出勤可否APIが必要

// Line 212
shiftRepository.getShifts({ planId: 4 }), // plan_id=4のシフトデータ
```

**推奨対応**:
- デモ用設定ファイル `frontend/src/config/demo.js` に移動
```javascript
export const DEMO_CONFIG = {
  PLAN_ID: 4,
  TENANT_ID: 1,
  STORE_ID: 1,
  STAFF_ID: 5,
  YEAR: 2024,
  MONTH: 10,
}
```

---

## 🟢 LOW: 年月 (2024, 11)

### フロントエンド

#### components/screens/LineShiftInput.jsx (Line 192-193)
```javascript
const DEMO_PARAMS = {
  tenant_id: 1,
  store_id: 1,
  staff_id: 5,
  year: 2024,   // ←
  month: 11,    // ←
}
```

**推奨対応**:
- デモ用設定ファイルに移動
- または現在の年月を動的に取得
```javascript
const currentDate = new Date();
const DEMO_PARAMS = {
  year: currentDate.getFullYear(),
  month: currentDate.getMonth() + 1,
  ...
}
```

---

## 📝 推奨実装プラン

### 1. バックエンド環境変数追加 (.env)

```bash
# デフォルトテナント設定
DEFAULT_TENANT_ID=1
DEFAULT_STORE_ID=1

# デモ用設定
DEMO_PLAN_ID=4
DEMO_STAFF_ID=5
```

### 2. フロントエンド環境変数追加 (.env.local)

```bash
# デフォルトテナント設定
VITE_DEFAULT_TENANT_ID=1
VITE_DEFAULT_STORE_ID=1

# デモ用設定
VITE_DEMO_PLAN_ID=4
VITE_DEMO_STAFF_ID=5
VITE_DEMO_YEAR=2024
VITE_DEMO_MONTH=10
```

### 3. デモ用設定ファイル作成 (frontend/src/config/demo.js)

```javascript
/**
 * デモ・開発用の設定
 * 本番環境では使用しない
 */
export const DEMO_CONFIG = {
  // テナント・店舗設定
  TENANT_ID: import.meta.env.VITE_DEFAULT_TENANT_ID || 1,
  STORE_ID: import.meta.env.VITE_DEFAULT_STORE_ID || 1,

  // デモ用パラメータ
  STAFF_ID: import.meta.env.VITE_DEMO_STAFF_ID || 5,
  PLAN_ID: import.meta.env.VITE_DEMO_PLAN_ID || 4,
  YEAR: import.meta.env.VITE_DEMO_YEAR || 2024,
  MONTH: import.meta.env.VITE_DEMO_MONTH || 10,
}

// 現在の年月を取得
export const getCurrentYearMonth = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
};
```

### 4. バックエンド設定ファイル作成 (backend/src/config/defaults.js)

```javascript
/**
 * デフォルト設定値
 */
export const DEFAULT_CONFIG = {
  TENANT_ID: parseInt(process.env.DEFAULT_TENANT_ID) || 1,
  STORE_ID: parseInt(process.env.DEFAULT_STORE_ID) || 1,

  // デモ用
  DEMO_PLAN_ID: parseInt(process.env.DEMO_PLAN_ID) || 4,
  DEMO_STAFF_ID: parseInt(process.env.DEMO_STAFF_ID) || 5,
};
```

### 5. 修正が必要なファイル一覧

#### バックエンド
- [ ] `backend/src/routes/shifts.js` (12箇所)
- [ ] `backend/src/routes/analytics.js` (5箇所)
- [ ] `backend/src/routes/master.js` (30+箇所)

#### フロントエンド
- [ ] `frontend/src/utils/shiftInputCollector.js` (1箇所)
- [ ] `frontend/src/components/screens/LineShiftInput.jsx` (5箇所)
- [ ] `frontend/src/components/screens/FirstPlan.jsx` (2箇所)
- [ ] `frontend/src/components/screens/SecondPlan.jsx` (2箇所)
- [ ] `frontend/src/infrastructure/repositories/ShiftRepository.js` (1箇所)
- [ ] `frontend/src/infrastructure/repositories/MasterRepository.js` (1箇所)
- [ ] `frontend/src/infrastructure/repositories/AnalyticsRepository.js` (1箇所)

---

## ⚠️ 注意事項

1. **本番環境でのデフォルト値**:
   - 本番環境では環境変数を必須にする
   - デフォルト値はあくまで開発環境用

2. **マルチテナント対応**:
   - 将来的にはログインユーザーのテナントIDを使用
   - 現在はデモ・開発用として `tenant_id=1` を使用

3. **API仕様**:
   - クエリパラメータで `tenant_id` を指定可能にする設計は維持
   - デフォルト値を設定ファイルから読み込むように変更

4. **段階的な移行**:
   - まずは環境変数ファイルを作成
   - 次に設定ファイルを作成
   - 最後に各ファイルを順次修正

---

## 🎯 優先順位

1. **Phase 1 (必須)**: バックエンド・フロントエンドの環境変数追加
2. **Phase 2 (推奨)**: デモ用設定ファイル作成
3. **Phase 3 (段階的)**: 各ファイルの修正（優先度: HIGH → MEDIUM → LOW）

---

生成日: 2025-10-31
