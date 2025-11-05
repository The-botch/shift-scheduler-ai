/**
 * LINE Webhook ルーター
 * LINEグループからのメッセージを受信してシフト希望を登録
 */
import express from 'express';
import crypto from 'crypto';
import { query } from '../config/database.js';

const router = express.Router();

// LINE設定（環境変数から取得）
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_BOT_ENABLED = process.env.LINE_BOT_ENABLED === 'true';

/**
 * LINE署名検証ミドルウェア
 */
const verifyLineSignature = (req, res, next) => {
  if (!LINE_BOT_ENABLED) {
    return res.status(503).json({ error: 'LINE bot is disabled' });
  }

  const signature = req.headers['x-line-signature'];
  if (!signature) {
    console.error('LINE Webhook: No signature header');
    return res.status(401).json({ error: 'No signature' });
  }

  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('SHA256', LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64');

  if (signature !== hash) {
    console.error('LINE Webhook: Invalid signature');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  next();
};

/**
 * メッセージパーサー - 日付とシフト希望タイプを抽出
 */
class MessageParser {
  constructor(text) {
    this.text = text;
    this.currentYear = new Date().getFullYear();
  }

  /**
   * 日付を抽出
   */
  extractDates() {
    const dates = [];

    // パターン1: "5/1" または "5月1日"
    const pattern1 = /(\d{1,2})[\/月](\d{1,2})(日)?/g;
    let match;
    while ((match = pattern1.exec(this.text)) !== null) {
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        dates.push(new Date(this.currentYear, month - 1, day));
      }
    }

    // パターン2: "2025-05-01"
    const pattern2 = /(\d{4})-(\d{1,2})-(\d{1,2})/g;
    while ((match = pattern2.exec(this.text)) !== null) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]);
      const day = parseInt(match[3]);
      dates.push(new Date(year, month - 1, day));
    }

    // 範囲指定: "5/1-5/3"
    const rangePattern = /(\d{1,2})[\/月](\d{1,2})(日)?[-~〜](\d{1,2})[\/月](\d{1,2})(日)?/;
    const rangeMatch = this.text.match(rangePattern);
    if (rangeMatch) {
      const startMonth = parseInt(rangeMatch[1]);
      const startDay = parseInt(rangeMatch[2]);
      const endMonth = parseInt(rangeMatch[4]);
      const endDay = parseInt(rangeMatch[5]);

      const startDate = new Date(this.currentYear, startMonth - 1, startDay);
      const endDate = new Date(this.currentYear, endMonth - 1, endDay);

      dates.length = 0; // 範囲指定の場合は個別日付をクリア
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
    }

    return dates;
  }

  /**
   * シフト希望タイプを判定
   */
  extractPreferenceType() {
    const dayOffKeywords = ['休み', '休', '休日', '有給', '公休', 'やすみ'];
    const preferredKeywords = ['出勤', '勤務', '可能', 'OK', 'ok', 'でます'];
    const unavailableKeywords = ['不可', 'NG', 'ng', '無理', 'できません'];

    const lowerText = this.text.toLowerCase();

    if (dayOffKeywords.some(keyword => this.text.includes(keyword))) {
      return 'day_off';
    }
    if (unavailableKeywords.some(keyword => this.text.includes(keyword))) {
      return 'unavailable';
    }
    if (preferredKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'preferred';
    }

    return null;
  }

  /**
   * 時刻を抽出
   */
  extractTimes() {
    const timePattern = /(\d{1,2}):(\d{2})/g;
    const times = [];
    let match;

    while ((match = timePattern.exec(this.text)) !== null) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        times.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      }
    }

    return times.length >= 2 ? { start_time: times[0], end_time: times[1] } : null;
  }

  /**
   * メッセージを完全に解析
   */
  parse() {
    const dates = this.extractDates();
    const preferenceType = this.extractPreferenceType();
    const times = this.extractTimes();

    return {
      dates,
      preferenceType,
      times,
      isValid: dates.length > 0 && preferenceType !== null
    };
  }
}

/**
 * LINE User IDからスタッフ情報を取得
 */
async function getStaffByLineUserId(lineUserId) {
  try {
    const result = await query(`
      SELECT sla.staff_id, sla.tenant_id, s.name as staff_name
      FROM hr.staff_line_accounts sla
      JOIN hr.staff s ON sla.staff_id = s.staff_id
      WHERE sla.line_user_id = $1 AND sla.is_active = true
    `, [lineUserId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error fetching staff by LINE user ID:', error);
    return null;
  }
}

/**
 * シフト希望を登録
 */
async function registerShiftPreference(staffId, tenantId, preferenceDate, preferenceType, times, reason) {
  try {
    const result = await query(`
      INSERT INTO ops.shift_preferences (
        tenant_id, staff_id, preference_date, preference_type,
        start_time, end_time, status, reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, CURRENT_TIMESTAMP)
      ON CONFLICT (tenant_id, staff_id, preference_date)
      DO UPDATE SET
        preference_type = EXCLUDED.preference_type,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        reason = EXCLUDED.reason,
        updated_at = CURRENT_TIMESTAMP
      RETURNING preference_id
    `, [
      tenantId,
      staffId,
      preferenceDate,
      preferenceType,
      times?.start_time || null,
      times?.end_time || null,
      reason
    ]);

    return result.rows[0];
  } catch (error) {
    console.error('Error registering shift preference:', error);
    throw error;
  }
}

/**
 * メッセージログを保存
 */
async function logLineMessage(lineUserId, staffId, tenantId, messageText, parsedData, responseText, status, errorMessage = null) {
  try {
    await query(`
      INSERT INTO ops.line_message_logs (
        tenant_id, line_user_id, staff_id, message_text,
        parsed_data, response_text, status, error_message, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    `, [
      tenantId,
      lineUserId,
      staffId,
      messageText,
      JSON.stringify(parsedData),
      responseText,
      status,
      errorMessage
    ]);
  } catch (error) {
    console.error('Error logging LINE message:', error);
  }
}

/**
 * LINEに返信
 */
async function replyToLine(replyToken, message) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken,
        messages: [{
          type: 'text',
          text: message
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('LINE reply error:', error);
    }
  } catch (error) {
    console.error('Error replying to LINE:', error);
  }
}

/**
 * Webhook エンドポイント
 * POST /api/webhook/line
 */
router.post('/', express.json(), verifyLineSignature, async (req, res) => {
  try {
    const events = req.body.events || [];

    // LINEには即座に200を返す（タイムアウト防止）
    res.json({ success: true });

    // 各イベントを非同期処理
    for (const event of events) {
      if (event.type !== 'message' || event.message.type !== 'text') {
        continue;
      }

      const messageText = event.message.text;
      const lineUserId = event.source.userId;
      const replyToken = event.replyToken;

      console.log('LINE message received:', { lineUserId, messageText });

      // スタッフ情報を取得
      const staff = await getStaffByLineUserId(lineUserId);
      if (!staff) {
        await replyToLine(replyToken,
          'あなたのLINEアカウントはまだ登録されていません。管理者に連絡してください。');
        await logLineMessage(lineUserId, null, null, messageText, null,
          'アカウント未登録', 'failed', 'Staff not found');
        continue;
      }

      // メッセージを解析
      const parser = new MessageParser(messageText);
      const parsed = parser.parse();

      if (!parsed.isValid) {
        await replyToLine(replyToken,
          '申し訳ございません。メッセージを理解できませんでした。\n\n' +
          '例: 5月1日 休み希望\n' +
          '例: 5/10 9:00-17:00 出勤可');
        await logLineMessage(lineUserId, staff.staff_id, staff.tenant_id,
          messageText, parsed, '解析失敗', 'failed', 'Parse error');
        continue;
      }

      // シフト希望を登録
      try {
        const registeredDates = [];
        for (const date of parsed.dates) {
          const dateStr = date.toISOString().split('T')[0];
          await registerShiftPreference(
            staff.staff_id,
            staff.tenant_id,
            dateStr,
            parsed.preferenceType,
            parsed.times,
            messageText
          );
          registeredDates.push(dateStr);
        }

        // 成功メッセージ
        const preferenceTypeText = {
          'day_off': '休み',
          'preferred': '出勤希望',
          'unavailable': '勤務不可'
        }[parsed.preferenceType] || 'シフト希望';

        const timeText = parsed.times
          ? ` (${parsed.times.start_time}-${parsed.times.end_time})`
          : '';

        const dateText = registeredDates.length === 1
          ? registeredDates[0]
          : `${registeredDates[0]} 〜 ${registeredDates[registeredDates.length - 1]}`;

        const successMessage =
          `✅ ${dateText}の${preferenceTypeText}${timeText}を登録しました\n\n` +
          `登録件数: ${registeredDates.length}件`;

        await replyToLine(replyToken, successMessage);
        await logLineMessage(lineUserId, staff.staff_id, staff.tenant_id,
          messageText, parsed, successMessage, 'success');

        console.log('Shift preference registered:', {
          staff_id: staff.staff_id,
          dates: registeredDates,
          type: parsed.preferenceType
        });

      } catch (error) {
        await replyToLine(replyToken,
          'シフト希望の登録中にエラーが発生しました。もう一度お試しください。');
        await logLineMessage(lineUserId, staff.staff_id, staff.tenant_id,
          messageText, parsed, 'DB登録失敗', 'failed', error.message);
      }
    }

  } catch (error) {
    console.error('LINE webhook error:', error);
    // すでにレスポンスを返しているので、ここではログのみ
  }
});

/**
 * ヘルスチェック
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    botEnabled: LINE_BOT_ENABLED,
    hasToken: !!LINE_CHANNEL_ACCESS_TOKEN,
    hasSecret: !!LINE_CHANNEL_SECRET
  });
});

export default router;
