#!/usr/bin/env node

/**
 * SharePointアップロードスクリプト
 *
 * Microsoft Graph APIを使用してSharePointにバックアップファイルをアップロード
 *
 * 環境変数:
 *   - AZURE_TENANT_ID: Azure ADテナントID
 *   - AZURE_CLIENT_ID: Azure ADクライアントID
 *   - AZURE_CLIENT_SECRET: Azure ADクライアントシークレット
 *   - SHAREPOINT_SITE_URL: SharePointサイトURL
 *   - SHAREPOINT_FOLDER_PATH: 保存先フォルダパス
 *   - BACKUP_FILE: アップロードするファイル名
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 環境変数の取得
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const SHAREPOINT_SITE_URL = process.env.SHAREPOINT_SITE_URL;
const SHAREPOINT_FOLDER_PATH = process.env.SHAREPOINT_FOLDER_PATH || 'Shared Documents/DB-Backups';
const BACKUP_FILE = process.env.BACKUP_FILE;

/**
 * 環境変数のチェック
 */
function validateEnvironmentVariables() {
  const required = {
    AZURE_TENANT_ID,
    AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET,
    SHAREPOINT_SITE_URL,
    BACKUP_FILE,
  };

  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('❌ エラー: 以下の環境変数が設定されていません:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('');
    console.error('詳細は scripts/backup/README.md を参照してください。');
    process.exit(1);
  }
}

/**
 * Azure ADアクセストークンを取得
 */
async function getAccessToken() {
  console.log('🔑 Azure ADアクセストークンを取得中...');

  const tokenEndpoint = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`認証エラー: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log('✅ アクセストークン取得成功');
    return data.access_token;

  } catch (error) {
    console.error('❌ アクセストークン取得エラー:', error.message);
    throw error;
  }
}

/**
 * SharePointサイトIDを取得
 */
async function getSiteId(accessToken) {
  console.log('🔍 SharePointサイトIDを取得中...');

  try {
    // URLからホスト名とサイトパスを抽出
    const siteUrl = new URL(SHAREPOINT_SITE_URL);
    const hostname = siteUrl.hostname;
    const sitePath = siteUrl.pathname;

    const endpoint = `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`サイトID取得エラー: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log('✅ サイトID取得成功');
    return data.id;

  } catch (error) {
    console.error('❌ サイトID取得エラー:', error.message);
    throw error;
  }
}

/**
 * SharePointにファイルをアップロード
 */
async function uploadToSharePoint(accessToken, siteId, filePath) {
  console.log('📤 SharePointにアップロード中...');

  try {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);
    const fileSize = fileContent.length;

    console.log(`📂 ファイル名: ${fileName}`);
    console.log(`📊 ファイルサイズ: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

    // ファイルサイズが4MB未満の場合は単純アップロード
    if (fileSize < 4 * 1024 * 1024) {
      return await simpleUpload(accessToken, siteId, fileName, fileContent);
    } else {
      // 4MB以上の場合はアップロードセッションを使用
      return await largeFileUpload(accessToken, siteId, fileName, fileContent);
    }

  } catch (error) {
    console.error('❌ アップロードエラー:', error.message);
    throw error;
  }
}

/**
 * 単純アップロード（4MB未満）
 */
async function simpleUpload(accessToken, siteId, fileName, fileContent) {
  const endpoint = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/${SHAREPOINT_FOLDER_PATH}/${fileName}:/content`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: fileContent,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`アップロードエラー: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('✅ アップロード成功');
  console.log(`🔗 SharePointリンク: ${data.webUrl}`);

  return data;
}

/**
 * 大容量ファイルのアップロード（4MB以上）
 */
async function largeFileUpload(accessToken, siteId, fileName, fileContent) {
  console.log('📦 大容量ファイルのアップロード処理を開始...');

  // アップロードセッションを作成
  const createSessionEndpoint = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/${SHAREPOINT_FOLDER_PATH}/${fileName}:/createUploadSession`;

  const sessionResponse = await fetch(createSessionEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item: {
        '@microsoft.graph.conflictBehavior': 'replace',
      },
    }),
  });

  if (!sessionResponse.ok) {
    const error = await sessionResponse.text();
    throw new Error(`セッション作成エラー: ${sessionResponse.status} ${error}`);
  }

  const sessionData = await sessionResponse.json();
  const uploadUrl = sessionData.uploadUrl;

  // チャンクサイズ（320KB推奨）
  const chunkSize = 320 * 1024;
  const fileSize = fileContent.length;
  let offset = 0;

  while (offset < fileSize) {
    const chunkEnd = Math.min(offset + chunkSize, fileSize);
    const chunk = fileContent.slice(offset, chunkEnd);

    console.log(`📤 アップロード進捗: ${((chunkEnd / fileSize) * 100).toFixed(1)}%`);

    const chunkResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': chunk.length.toString(),
        'Content-Range': `bytes ${offset}-${chunkEnd - 1}/${fileSize}`,
      },
      body: chunk,
    });

    if (!chunkResponse.ok && chunkResponse.status !== 202) {
      const error = await chunkResponse.text();
      throw new Error(`チャンクアップロードエラー: ${chunkResponse.status} ${error}`);
    }

    offset = chunkEnd;
  }

  console.log('✅ アップロード成功');
  return { success: true };
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 SharePointアップロード処理を開始します...');
  console.log(`📅 日時: ${new Date().toLocaleString('ja-JP')}`);
  console.log('');

  try {
    // 環境変数のチェック
    validateEnvironmentVariables();

    // バックアップファイルの存在確認
    if (!fs.existsSync(BACKUP_FILE)) {
      throw new Error(`バックアップファイルが見つかりません: ${BACKUP_FILE}`);
    }

    // アクセストークン取得
    const accessToken = await getAccessToken();

    // サイトID取得
    const siteId = await getSiteId(accessToken);

    // ファイルアップロード
    await uploadToSharePoint(accessToken, siteId, BACKUP_FILE);

    console.log('');
    console.log('✅ すべての処理が正常に完了しました！');

  } catch (error) {
    console.error('');
    console.error('❌ エラーが発生しました:', error.message);
    console.error('');
    console.error('💡 トラブルシューティング:');
    console.error('  1. Azure ADの権限設定を確認してください');
    console.error('  2. SharePointサイトURLが正しいか確認してください');
    console.error('  3. フォルダパスが存在するか確認してください');
    console.error('');
    console.error('詳細は scripts/backup/README.md を参照してください。');
    process.exit(1);
  }
}

// スクリプト実行
main();
