# LINE連携機能 実装ガイド

シフトスケジューラーとLINEを連携させるための実装ガイドです。

## 目次

1. [概要](#概要)
2. [データベーススキーマ](#データベーススキーマ)
3. [バックエンド実装](#バックエンド実装)
4. [フロントエンド実装](#フロントエンド実装)
5. [LINE連携フロー](#line連携フロー)
6. [セキュリティ考慮事項](#セキュリティ考慮事項)

---

## 概要

### LINE連携で実現する機能

1. **スタッフ認証**
   - LINE Loginを使用したスタッフのアカウント連携
   - LINE User IDとスタッフIDの紐付け

2. **通知機能**
   - シフト確定時の通知
   - シフト変更時の通知
   - リマインダー通知

3. **シフト確認**
   - LINEからシフト確認
   - 希望シフト提出

4. **双方向コミュニケーション**
   - 管理者からの連絡
   - スタッフからの問い合わせ

---

## データベーススキーマ

### 1. LINE連携テーブル

#### `hr.staff_line_accounts` - スタッフLINEアカウント連携

```sql
CREATE TABLE hr.staff_line_accounts (
    line_account_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    staff_id INT NOT NULL,
    line_user_id VARCHAR(100) UNIQUE NOT NULL,
    line_display_name VARCHAR(200),
    picture_url TEXT,
    status_message TEXT,
    is_linked BOOLEAN NOT NULL DEFAULT TRUE,
    linked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unlinked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id, staff_id),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE CASCADE
);

CREATE INDEX idx_staff_line_tenant ON hr.staff_line_accounts(tenant_id);
CREATE INDEX idx_staff_line_staff ON hr.staff_line_accounts(staff_id);
CREATE INDEX idx_staff_line_user_id ON hr.staff_line_accounts(line_user_id);

COMMENT ON TABLE hr.staff_line_accounts IS 'スタッフLINEアカウント連携情報';
COMMENT ON COLUMN hr.staff_line_accounts.line_user_id IS 'LINE User ID';
COMMENT ON COLUMN hr.staff_line_accounts.is_linked IS '連携状態（TRUE=連携中、FALSE=解除済み）';
```

#### `ops.line_notifications` - LINE通知ログ

```sql
CREATE TABLE ops.line_notifications (
    notification_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    staff_id INT,
    line_user_id VARCHAR(100),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200),
    message TEXT NOT NULL,
    shift_id INT,
    plan_id INT,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES hr.staff(staff_id) ON DELETE SET NULL,
    FOREIGN KEY (shift_id) REFERENCES ops.shifts(shift_id) ON DELETE SET NULL,
    FOREIGN KEY (plan_id) REFERENCES ops.shift_plans(plan_id) ON DELETE SET NULL,
    CHECK (notification_type IN ('SHIFT_ASSIGNED', 'SHIFT_CHANGED', 'SHIFT_REMINDER', 'ANNOUNCEMENT', 'APPROVAL_REQUEST')),
    CHECK (delivery_status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED'))
);

CREATE INDEX idx_line_notifs_tenant ON ops.line_notifications(tenant_id);
CREATE INDEX idx_line_notifs_staff ON ops.line_notifications(staff_id);
CREATE INDEX idx_line_notifs_type ON ops.line_notifications(notification_type);
CREATE INDEX idx_line_notifs_status ON ops.line_notifications(delivery_status);
CREATE INDEX idx_line_notifs_sent_at ON ops.line_notifications(sent_at DESC);

COMMENT ON TABLE ops.line_notifications IS 'LINE通知送信ログ';
```

#### `core.line_settings` - LINE設定

```sql
CREATE TABLE core.line_settings (
    setting_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    channel_id VARCHAR(100) NOT NULL,
    channel_secret VARCHAR(100) NOT NULL,
    channel_access_token TEXT NOT NULL,
    webhook_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_language VARCHAR(10) NOT NULL DEFAULT 'ja',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tenant_id),
    FOREIGN KEY (tenant_id) REFERENCES core.tenants(tenant_id) ON DELETE CASCADE
);

CREATE INDEX idx_line_settings_tenant ON core.line_settings(tenant_id);

COMMENT ON TABLE core.line_settings IS 'テナント別LINE設定';
COMMENT ON COLUMN core.line_settings.channel_access_token IS 'LINE Messaging API Channel Access Token（暗号化推奨）';
```

---

## バックエンド実装

### 1. ディレクトリ構成

```
backend/src/
├── routes/
│   ├── line.js              # LINE連携用ルート
│   └── lineWebhook.js       # LINEウェブフック
├── services/
│   ├── lineService.js       # LINE API サービス
│   ├── lineAuthService.js   # LINE認証サービス
│   └── lineNotificationService.js  # 通知サービス
├── middleware/
│   ├── lineAuth.js          # LINE認証ミドルウェア
│   └── lineWebhookValidator.js  # Webhook検証
└── models/
    ├── StaffLineAccount.js  # スタッフLINE連携モデル
    └── LineNotification.js  # 通知モデル
```

### 2. LINE API サービス（`services/lineService.js`）

```javascript
import axios from 'axios';

const LINE_API_BASE = 'https://api.line.me/v2';
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot';

class LineService {
  constructor(channelAccessToken) {
    this.accessToken = channelAccessToken;
  }

  /**
   * プッシュメッセージ送信
   */
  async sendPushMessage(lineUserId, messages) {
    try {
      const response = await axios.post(
        `${LINE_MESSAGING_API}/message/push`,
        {
          to: lineUserId,
          messages: messages
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('LINE Push Message Error:', error.response?.data);
      return { success: false, error: error.response?.data };
    }
  }

  /**
   * シフト通知メッセージ作成
   */
  createShiftNotificationMessage(shift, type = 'ASSIGNED') {
    const messages = [];

    // テキストメッセージ
    let text = '';
    if (type === 'ASSIGNED') {
      text = `【シフト確定】\n${shift.shift_date}のシフトが確定しました\n\n`;
    } else if (type === 'CHANGED') {
      text = `【シフト変更】\n${shift.shift_date}のシフトが変更されました\n\n`;
    }

    text += `勤務時間: ${shift.start_time} 〜 ${shift.end_time}\n`;
    text += `勤務場所: ${shift.work_location || '店舗'}\n`;
    if (shift.notes) {
      text += `備考: ${shift.notes}`;
    }

    messages.push({
      type: 'text',
      text: text
    });

    // Flex Messageでリッチな表示（オプション）
    messages.push({
      type: 'flex',
      altText: 'シフト詳細',
      contents: this.createShiftFlexMessage(shift)
    });

    return messages;
  }

  /**
   * Flex Message作成（シフト詳細）
   */
  createShiftFlexMessage(shift) {
    return {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'シフト詳細',
            weight: 'bold',
            size: 'lg',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#17c950'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: shift.shift_date,
            weight: 'bold',
            size: 'xl',
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '時間',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: `${shift.start_time} 〜 ${shift.end_time}`,
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5
                  }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '場所',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: shift.work_location || '店舗',
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: 'シフト詳細を見る',
              uri: `${process.env.FRONTEND_URL}/shifts/${shift.shift_id}`
            },
            style: 'primary'
          }
        ]
      }
    };
  }

  /**
   * ユーザープロフィール取得
   */
  async getUserProfile(lineUserId) {
    try {
      const response = await axios.get(
        `${LINE_MESSAGING_API}/profile/${lineUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error('LINE Get Profile Error:', error.response?.data);
      return { success: false, error: error.response?.data };
    }
  }
}

export default LineService;
```

### 3. LINE認証ルート（`routes/line.js`）

```javascript
import express from 'express';
import axios from 'axios';
import { db } from '../config/database.js';
import LineService from '../services/lineService.js';

const router = express.Router();

/**
 * LINE Login コールバック
 */
router.post('/auth/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    // state検証（CSRF対策）
    // 実際にはセッション等で検証が必要

    // アクセストークン取得
    const tokenResponse = await axios.post(
      'https://api.line.me/oauth2/v2.1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.LINE_CALLBACK_URL,
        client_id: process.env.LINE_CHANNEL_ID,
        client_secret: process.env.LINE_CHANNEL_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, id_token } = tokenResponse.data;

    // IDトークン検証とプロフィール取得
    const profileResponse = await axios.get(
      'https://api.line.me/v2/profile',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    const profile = profileResponse.data;

    // データベースに保存
    const result = await db.query(`
      INSERT INTO hr.staff_line_accounts (
        tenant_id, staff_id, line_user_id, line_display_name,
        picture_url, status_message, is_linked
      ) VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      ON CONFLICT (line_user_id)
      DO UPDATE SET
        line_display_name = EXCLUDED.line_display_name,
        picture_url = EXCLUDED.picture_url,
        status_message = EXCLUDED.status_message,
        is_linked = TRUE,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      req.body.tenant_id,
      req.body.staff_id,
      profile.userId,
      profile.displayName,
      profile.pictureUrl,
      profile.statusMessage
    ]);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('LINE Auth Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * LINE連携解除
 */
router.post('/auth/unlink', async (req, res) => {
  try {
    const { staff_id, tenant_id } = req.body;

    await db.query(`
      UPDATE hr.staff_line_accounts
      SET is_linked = FALSE, unlinked_at = CURRENT_TIMESTAMP
      WHERE staff_id = $1 AND tenant_id = $2
    `, [staff_id, tenant_id]);

    res.json({ success: true });
  } catch (error) {
    console.error('LINE Unlink Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * シフト通知送信
 */
router.post('/notify/shift', async (req, res) => {
  try {
    const { tenant_id, staff_id, shift, notification_type } = req.body;

    // スタッフのLINE連携情報取得
    const linkResult = await db.query(`
      SELECT line_user_id
      FROM hr.staff_line_accounts
      WHERE staff_id = $1 AND tenant_id = $2 AND is_linked = TRUE
    `, [staff_id, tenant_id]);

    if (linkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'LINE account not linked'
      });
    }

    const lineUserId = linkResult.rows[0].line_user_id;

    // LINE設定取得
    const settingsResult = await db.query(`
      SELECT channel_access_token
      FROM core.line_settings
      WHERE tenant_id = $1 AND is_active = TRUE
    `, [tenant_id]);

    if (settingsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'LINE settings not found'
      });
    }

    const accessToken = settingsResult.rows[0].channel_access_token;

    // LINE通知送信
    const lineService = new LineService(accessToken);
    const messages = lineService.createShiftNotificationMessage(shift, notification_type);
    const sendResult = await lineService.sendPushMessage(lineUserId, messages);

    // 通知ログ保存
    await db.query(`
      INSERT INTO ops.line_notifications (
        tenant_id, staff_id, line_user_id, notification_type,
        title, message, shift_id, delivery_status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      tenant_id,
      staff_id,
      lineUserId,
      notification_type,
      'シフト通知',
      JSON.stringify(messages),
      shift.shift_id,
      sendResult.success ? 'SENT' : 'FAILED',
      sendResult.error ? JSON.stringify(sendResult.error) : null
    ]);

    res.json(sendResult);

  } catch (error) {
    console.error('LINE Notify Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

### 4. server.jsへの統合

```javascript
// backend/src/server.js に追加
import lineRoutes from './routes/line.js';

// Routes
app.use('/api/openai', openaiRoutes);
app.use('/api', csvRoutes);
app.use('/api/line', lineRoutes);  // ← 追加
```

---

## フロントエンド実装

### 1. LINE連携画面コンポーネント

```jsx
// frontend/src/components/screens/LineIntegration.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useToast } from '../ui/use-toast';

const LineIntegration = () => {
  const [isLinked, setIsLinked] = useState(false);
  const [profile, setProfile] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    checkLinkStatus();
  }, []);

  const checkLinkStatus = async () => {
    try {
      const response = await fetch('/api/line/auth/status');
      const data = await response.json();
      setIsLinked(data.is_linked);
      setProfile(data.profile);
    } catch (error) {
      console.error('Failed to check LINE link status:', error);
    }
  };

  const handleLineLogin = () => {
    // LINE Login URLを生成
    const state = generateRandomState();
    sessionStorage.setItem('line_login_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.REACT_APP_LINE_CHANNEL_ID,
      redirect_uri: process.env.REACT_APP_LINE_CALLBACK_URL,
      state: state,
      scope: 'profile openid'
    });

    window.location.href = `https://access.line.me/oauth2/v2.1/authorize?${params}`;
  };

  const handleUnlink = async () => {
    try {
      const response = await fetch('/api/line/auth/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: /* current staff id */,
          tenant_id: /* current tenant id */
        })
      });

      if (response.ok) {
        setIsLinked(false);
        setProfile(null);
        toast({
          title: '連携解除完了',
          description: 'LINE連携を解除しました'
        });
      }
    } catch (error) {
      toast({
        title: 'エラー',
        description: '連携解除に失敗しました',
        variant: 'destructive'
      });
    }
  };

  const generateRandomState = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">LINE連携設定</h1>

      <Card className="p-6">
        {!isLinked ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">LINE連携をする</h2>
            <p className="text-gray-600 mb-4">
              LINEアカウントと連携すると、シフト通知やリマインダーをLINEで受け取れます。
            </p>
            <Button onClick={handleLineLogin} className="bg-[#00B900] hover:bg-[#00A000]">
              LINEで連携する
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">連携中のアカウント</h2>
            {profile && (
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={profile.picture_url}
                  alt="LINE Profile"
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="font-semibold">{profile.line_display_name}</p>
                  <p className="text-sm text-gray-500">連携済み</p>
                </div>
              </div>
            )}
            <Button onClick={handleUnlink} variant="destructive">
              連携を解除
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LineIntegration;
```

### 2. LINEログインコールバック処理

```jsx
// frontend/src/components/screens/LineCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LineCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const savedState = sessionStorage.getItem('line_login_state');

    // state検証
    if (state !== savedState) {
      console.error('Invalid state parameter');
      navigate('/settings/line?error=invalid_state');
      return;
    }

    try {
      const response = await fetch('/api/line/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          state: state,
          staff_id: /* current staff id */,
          tenant_id: /* current tenant id */
        })
      });

      if (response.ok) {
        navigate('/settings/line?success=true');
      } else {
        navigate('/settings/line?error=auth_failed');
      }
    } catch (error) {
      console.error('LINE callback error:', error);
      navigate('/settings/line?error=network_error');
    } finally {
      sessionStorage.removeItem('line_login_state');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <p>LINE連携処理中...</p>
    </div>
  );
};

export default LineCallback;
```

### 3. ルーティング設定

```jsx
// frontend/src/App.jsx に追加
import LineIntegration from './components/screens/LineIntegration';
import LineCallback from './components/screens/LineCallback';

// ルート定義に追加
<Route path="/settings/line" element={<LineIntegration />} />
<Route path="/auth/line/callback" element={<LineCallback />} />
```

---

## LINE連携フロー

### 1. スタッフアカウント連携フロー

```
[フロントエンド]                    [バックエンド]              [LINE]
     |                                   |                        |
     | 1. 「LINEで連携」ボタンクリック      |                        |
     |---------------------------------->|                        |
     | 2. LINE Login URL生成               |                        |
     |<----------------------------------|                        |
     | 3. LINEログイン画面へリダイレクト     |                        |
     |------------------------------------------------>|
     |                                   |             4. 認証     |
     |                                   |<------------ code ------
     | 5. コールバックURL呼び出し          |                        |
     |---------------------------------->|                        |
     |                                   | 6. アクセストークン取得  |
     |                                   |----------------------->|
     |                                   |<----- token -----------|
     |                                   | 7. プロフィール取得      |
     |                                   |----------------------->|
     |                                   |<---- profile ----------|
     |                                   | 8. DB保存              |
     |                                   | (staff_line_accounts)  |
     | 9. 連携完了通知                    |                        |
     |<----------------------------------|                        |
```

### 2. シフト通知フロー

```
[シフト確定処理]                   [バックエンド]              [LINE API]
     |                                   |                        |
     | 1. シフト確定                      |                        |
     |---------------------------------->|                        |
     |                                   | 2. 対象スタッフ取得      |
     |                                   | (staff_line_accounts)  |
     |                                   | 3. 通知メッセージ生成    |
     |                                   | 4. LINE通知送信         |
     |                                   |----------------------->|
     |                                   |<---- 送信結果 ---------|
     |                                   | 5. 通知ログ保存         |
     |                                   | (line_notifications)   |
     | 6. 完了レスポンス                  |                        |
     |<----------------------------------|                        |
```

---

## セキュリティ考慮事項

### 1. 認証・認可

- **State パラメータ**: CSRF攻撃対策として必ず検証
- **アクセストークン**: 暗号化してDB保存
- **Webhook署名検証**: LINE Webhookの署名を必ず検証

### 2. データ保護

- **個人情報**: LINE User ID、プロフィール情報は適切に管理
- **通信**: HTTPS通信の徹底
- **ログ**: 個人情報を含むログは適切にマスキング

### 3. 環境変数

```bash
# .env に追加
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CALLBACK_URL=https://your-domain.com/auth/line/callback
FRONTEND_URL=https://your-domain.com
```

---

## 実装手順

### Phase 1: データベース準備
1. LINE連携用テーブル作成（`staff_line_accounts`, `line_notifications`, `line_settings`）
2. マイグレーション実行

### Phase 2: バックエンド実装
1. LINE API サービス実装
2. 認証エンドポイント実装
3. 通知エンドポイント実装
4. Webhook処理実装

### Phase 3: フロントエンド実装
1. LINE連携画面作成
2. コールバック処理実装
3. 通知設定画面作成

### Phase 4: テスト
1. LINE Developersでテストチャネル作成
2. 連携フローテスト
3. 通知送信テスト

### Phase 5: 本番デプロイ
1. 本番用LINEチャネル設定
2. 環境変数設定
3. デプロイ

---

## 参考リンク

- [LINE Developers](https://developers.line.biz/ja/)
- [LINE Login](https://developers.line.biz/ja/docs/line-login/)
- [Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
- [Flex Message Simulator](https://developers.line.biz/flex-simulator/)
