#!/usr/bin/env node

/**
 * Analytics APIエンドポイントテスト
 *
 * Phase 3: 給与・分析APIの動作確認
 */

const BASE_URL = 'http://localhost:3001/api/analytics';
const TENANT_ID = 1;

const endpoints = [
  {
    name: '1. 給与計算',
    path: '/payroll',
    query: `?tenant_id=${TENANT_ID}`,
    description: '給与データ取得'
  },
  {
    name: '2. 売上実績',
    path: '/sales-actual',
    query: `?tenant_id=${TENANT_ID}`,
    description: '売上実績データ取得'
  },
  {
    name: '3. 売上予測',
    path: '/sales-forecast',
    query: `?tenant_id=${TENANT_ID}`,
    description: '売上予測データ取得'
  },
  {
    name: '4. ダッシュボード指標',
    path: '/dashboard-metrics',
    query: `?tenant_id=${TENANT_ID}`,
    description: 'ダッシュボード指標取得'
  },
];

async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}${endpoint.query || ''}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.success && data.data !== undefined) {
      const count = Array.isArray(data.data) ? data.data.length : 1;
      console.log(`✅ ${endpoint.name}: ${count}件`);
      return { success: true, count };
    } else {
      console.log(`❌ ${endpoint.name}: データ取得失敗`);
      return { success: false, error: 'No data' };
    }
  } catch (error) {
    console.log(`❌ ${endpoint.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Analytics APIエンドポイントテスト');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}\n`);

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ ...endpoint, ...result });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 テスト結果サマリー');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`成功: ${successCount}/${endpoints.length}`);
  console.log(`失敗: ${failCount}/${endpoints.length}\n`);

  if (failCount > 0) {
    console.log('失敗したエンドポイント:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    console.log('');
  }

  if (successCount === endpoints.length) {
    console.log('🎉 全てのAnalytics APIが正常に動作しています！\n');
  } else {
    console.log('⚠️  一部のAPIが失敗しました。');
    console.log('    - バックエンドサーバーが起動しているか確認してください');
    console.log('    - データベースにデータが投入されているか確認してください\n');
    process.exit(1);
  }
}

main();
