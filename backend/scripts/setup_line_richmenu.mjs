/**
 * LINE リッチメニュー設定スクリプト
 * LIFFアプリを開くリッチメニューを作成
 */
import { config } from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

config();

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LIFF_ID = process.env.LIFF_ID; // LIFFアプリのID (liff-xxxxxxxxx)

if (!LINE_CHANNEL_ACCESS_TOKEN) {
  console.error('❌ LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
  process.exit(1);
}

if (!LIFF_ID) {
  console.error('❌ LIFF_ID が設定されていません');
  process.exit(1);
}

/**
 * リッチメニューを作成
 */
async function createRichMenu() {
  console.log('📋 リッチメニューを作成中...');

  const richMenuData = {
    size: {
      width: 2500,
      height: 1686
    },
    selected: true,
    name: 'シフト希望入力メニュー',
    chatBarText: 'シフト入力',
    areas: [
      {
        bounds: {
          x: 0,
          y: 0,
          width: 1250,
          height: 1686
        },
        action: {
          type: 'uri',
          label: 'シフト希望入力',
          uri: `https://liff.line.me/${LIFF_ID}`
        }
      },
      {
        bounds: {
          x: 1250,
          y: 0,
          width: 1250,
          height: 843
        },
        action: {
          type: 'message',
          label: '今月の希望確認',
          text: '今月のシフト希望を確認'
        }
      },
      {
        bounds: {
          x: 1250,
          y: 843,
          width: 1250,
          height: 843
        },
        action: {
          type: 'message',
          label: 'ヘルプ',
          text: '使い方を教えて'
        }
      }
    ]
  };

  try {
    const response = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify(richMenuData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`リッチメニュー作成失敗: ${error}`);
    }

    const result = await response.json();
    console.log('✅ リッチメニュー作成成功:', result.richMenuId);
    return result.richMenuId;
  } catch (error) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

/**
 * リッチメニュー画像をアップロード
 * 注: 画像は事前に用意する必要があります
 */
async function uploadRichMenuImage(richMenuId, imagePath) {
  console.log('🖼️  リッチメニュー画像をアップロード中...');

  if (!fs.existsSync(imagePath)) {
    console.warn('⚠️  画像ファイルが見つかりません:', imagePath);
    console.log('   スキップします。後で手動でアップロードしてください。');
    return;
  }

  const imageBuffer = fs.readFileSync(imagePath);

  try {
    const response = await fetch(
      `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
        },
        body: imageBuffer
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`画像アップロード失敗: ${error}`);
    }

    console.log('✅ 画像アップロード成功');
  } catch (error) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

/**
 * デフォルトのリッチメニューとして設定
 */
async function setDefaultRichMenu(richMenuId) {
  console.log('🔧 デフォルトリッチメニューとして設定中...');

  try {
    const response = await fetch(
      `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`デフォルト設定失敗: ${error}`);
    }

    console.log('✅ デフォルトリッチメニュー設定成功');
  } catch (error) {
    console.error('❌ エラー:', error.message);
    throw error;
  }
}

/**
 * 既存のリッチメニューを削除
 */
async function deleteAllRichMenus() {
  console.log('🗑️  既存のリッチメニューを削除中...');

  try {
    // リッチメニューリスト取得
    const listResponse = await fetch('https://api.line.me/v2/bot/richmenu/list', {
      headers: {
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      }
    });

    if (!listResponse.ok) {
      throw new Error('リッチメニューリスト取得失敗');
    }

    const { richmenus } = await listResponse.json();

    // 各リッチメニューを削除
    for (const menu of richmenus) {
      const deleteResponse = await fetch(
        `https://api.line.me/v2/bot/richmenu/${menu.richMenuId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
          }
        }
      );

      if (deleteResponse.ok) {
        console.log(`  ✅ 削除: ${menu.richMenuId} (${menu.name})`);
      }
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('===========================================');
  console.log('LINE リッチメニュー セットアップ');
  console.log('===========================================\n');

  try {
    // 既存のリッチメニューを削除（オプション）
    const shouldDelete = process.argv.includes('--delete-existing');
    if (shouldDelete) {
      await deleteAllRichMenus();
      console.log('');
    }

    // リッチメニュー作成
    const richMenuId = await createRichMenu();
    console.log('');

    // 画像アップロード（オプション）
    const imagePath = './assets/richmenu_image.png';
    try {
      await uploadRichMenuImage(richMenuId, imagePath);
      console.log('');
    } catch (error) {
      console.log('画像アップロードをスキップしました\n');
    }

    // デフォルトリッチメニューとして設定
    await setDefaultRichMenu(richMenuId);

    console.log('\n===========================================');
    console.log('✅ セットアップ完了！');
    console.log('===========================================');
    console.log('\n📝 次のステップ:');
    console.log('1. LINE Developers Console でリッチメニュー画像を確認');
    console.log('2. 画像が表示されていない場合は手動でアップロード');
    console.log('   - 画像サイズ: 2500x1686px');
    console.log('   - ファイル形式: PNG or JPEG');
    console.log('3. LINEアプリでBotをトークして確認');
    console.log('\nリッチメニューID:', richMenuId);

  } catch (error) {
    console.error('\n❌ セットアップ失敗:', error.message);
    process.exit(1);
  }
}

main();
