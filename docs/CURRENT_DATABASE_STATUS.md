# 現在のデータベース状態

**最終更新**: 2025-10-31
**実行スクリプト**: `npm run test:schema:keep`

---

## 📊 現在のデータベース構成

### **作成されているスキーマ**
- `public` - デフォルトスキーマ
- `test_schema` - テスト用カスタムスキーマ

### **作成されているテーブル（3テーブル）**

#### 1️⃣ **public.users**（ユーザーマスタ）

**構造**:
```sql
CREATE TABLE public.users (
    user_id SERIAL PRIMARY KEY,              -- ユーザーID（自動採番）
    username VARCHAR(50) UNIQUE NOT NULL,    -- ユーザー名（一意）
    email VARCHAR(200) NOT NULL,             -- メールアドレス
    age INT,                                 -- 年齢
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**データ（3件）**:
| user_id | username | email | age |
|---------|----------|-------|-----|
| 1 | alice | alice@example.com | 25 |
| 2 | bob | bob@example.com | 30 |
| 3 | charlie | charlie@example.com | 28 |

---

#### 2️⃣ **test_schema.products**（商品マスタ）

**構造**:
```sql
CREATE TABLE test_schema.products (
    product_id SERIAL PRIMARY KEY,           -- 商品ID
    product_name VARCHAR(200) NOT NULL,      -- 商品名
    price DECIMAL(10,2) NOT NULL,            -- 価格
    stock INT NOT NULL DEFAULT 0,            -- 在庫数
    category VARCHAR(50),                    -- カテゴリ
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- アクティブフラグ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**データ（6件）**:
| product_id | product_name | price | stock | category | is_active |
|------------|--------------|-------|-------|----------|-----------|
| 1 | ノートパソコン | 120000.00 | 10 | 電子機器 | true |
| 2 | ワイヤレスマウス | 3500.00 | 50 | 電子機器 | true |
| 3 | キーボード | 8000.00 | 30 | 電子機器 | true |
| 4 | モニター | 45000.00 | 15 | 電子機器 | true |
| 5 | ヘッドホン | 15000.00 | 25 | 電子機器 | true |
| 6 | Webカメラ | 8500.00 | 40 | 電子機器 | true |

---

#### 3️⃣ **test_schema.orders**（注文トランザクション）

**構造**:
```sql
CREATE TABLE test_schema.orders (
    order_id SERIAL PRIMARY KEY,             -- 注文ID
    user_id INT NOT NULL,                    -- ユーザーID（外部キー）
    product_id INT NOT NULL,                 -- 商品ID（外部キー）
    quantity INT NOT NULL DEFAULT 1,         -- 数量
    total_amount DECIMAL(12,2) NOT NULL,     -- 合計金額
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- ステータス
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES test_schema.products(product_id) ON DELETE CASCADE
);
```

**データ（6件）**:
| order_id | user_id | product_id | quantity | total_amount | status |
|----------|---------|------------|----------|--------------|--------|
| 1 | 1 (alice) | 1 (ノートPC) | 1 | 120000.00 | COMPLETED |
| 2 | 1 (alice) | 2 (マウス) | 2 | 7000.00 | COMPLETED |
| 3 | 2 (bob) | 3 (キーボード) | 1 | 8000.00 | PENDING |
| 4 | 2 (bob) | 5 (ヘッドホン) | 1 | 15000.00 | SHIPPED |
| 5 | 3 (charlie) | 4 (モニター) | 1 | 45000.00 | SHIPPED |
| 6 | 3 (charlie) | 6 (カメラ) | 2 | 17000.00 | PENDING |

---

## 📈 集計データ

### **ユーザー別注文統計**:
| ユーザー | 注文件数 | 合計金額 |
|---------|---------|---------|
| alice | 2件 | ¥127,000 |
| charlie | 2件 | ¥62,000 |
| bob | 2件 | ¥23,000 |

### **ステータス別注文統計**:
| ステータス | 件数 | 合計金額 |
|-----------|------|---------|
| SHIPPED | 2件 | ¥60,000 |
| PENDING | 2件 | ¥25,000 |
| COMPLETED | 2件 | ¥127,000 |

---

## 🔍 GUIツールでの確認方法

### **接続情報**
```
Host: mainline.proxy.rlwy.net
Port: 50142
Database: railway
User: postgres
Password: gkfRVoPvcoLdoDHjCabWcBWhYYBONYfe
```

### **推奨GUIツール**

#### **1. TablePlus（推奨）**
```bash
brew install --cask tableplus
```
- 軽量・高速
- 複数DB対応
- 見た目が美しい

#### **2. DBeaver（無料）**
```bash
brew install --cask dbeaver-community
```
- 完全無料
- 多機能
- ER図自動生成

#### **3. pgAdmin**
```bash
brew install --cask pgadmin4
```
- PostgreSQL公式
- 管理機能が豊富

---

## 🧹 データのクリーンアップ

テストデータを削除する場合:

```bash
npm run db:cleanup
```

または:

```bash
node scripts/cleanup_test_data.mjs
```

**削除されるもの**:
- `test_schema.orders` テーブル
- `test_schema.products` テーブル
- `public.users` テーブル
- `test_schema` スキーマ

---

## 🔄 データの再作成

クリーンアップ後、再度データを作成する場合:

```bash
npm run test:schema:keep
```

---

## 📝 クエリ例

### **全ユーザー取得**
```sql
SELECT * FROM public.users ORDER BY user_id;
```

### **10000円以上の商品**
```sql
SELECT product_name, price, stock
FROM test_schema.products
WHERE price >= 10000
ORDER BY price DESC;
```

### **注文詳細（JOIN）**
```sql
SELECT
    o.order_id,
    u.username,
    p.product_name,
    o.quantity,
    o.total_amount,
    o.status
FROM test_schema.orders o
JOIN public.users u ON o.user_id = u.user_id
JOIN test_schema.products p ON o.product_id = p.product_id
ORDER BY o.order_id;
```

### **ユーザー別集計**
```sql
SELECT
    u.username,
    COUNT(o.order_id) as order_count,
    SUM(o.total_amount) as total_spent
FROM public.users u
LEFT JOIN test_schema.orders o ON u.user_id = o.user_id
GROUP BY u.user_id, u.username
ORDER BY total_spent DESC NULLS LAST;
```

---

## 🎯 次のステップ

このテストデータを確認したら:

1. ✅ **データ確認完了** - GUIツールで全テーブル・データを確認
2. 🧹 **クリーンアップ** - `npm run db:cleanup` でテストデータ削除
3. 🚀 **マルチテナント構築** - `scripts/db/setup_multitenant.sh` を実行

---

## 📚 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [DATABASE_CONNECTION.md](DATABASE_CONNECTION.md) | データベース接続ガイド |
| [MULTITENANT_REDESIGN.md](MULTITENANT_REDESIGN.md) | マルチテナント設計 |
| [DATABASE_COMPLETE.md](DATABASE_COMPLETE.md) | DB構築ガイド |
