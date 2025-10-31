#!/usr/bin/env node

/**
 * マスターAPIエンドポイントテスト
 *
 * 全17マスターテーブルのAPIが正常に動作するかテスト
 */

const BASE_URL = 'http://localhost:3001/api/master';
const TENANT_ID = 1;

const endpoints = [
  { name: '1. テナント', path: '/tenants' },
  { name: '2. 部門', path: '/divisions', query: `?tenant_id=${TENANT_ID}` },
  { name: '3. 店舗', path: '/stores', query: `?tenant_id=${TENANT_ID}` },
  { name: '4. 役職', path: '/roles', query: `?tenant_id=${TENANT_ID}` },
  { name: '5. スキル', path: '/skills', query: `?tenant_id=${TENANT_ID}` },
  { name: '6. 雇用形態', path: '/employment-types', query: `?tenant_id=${TENANT_ID}` },
  { name: '7. シフトパターン', path: '/shift-patterns', query: `?tenant_id=${TENANT_ID}` },
  { name: '8. スタッフ', path: '/staff', query: `?tenant_id=${TENANT_ID}` },
  { name: '9. スタッフスキル', path: '/staff-skills', query: `?tenant_id=${TENANT_ID}` },
  { name: '10. スタッフ資格', path: '/staff-certifications', query: `?tenant_id=${TENANT_ID}` },
  { name: '11. 通勤手当', path: '/commute-allowance', query: `?tenant_id=${TENANT_ID}` },
  { name: '12. 保険料率', path: '/insurance-rates', query: `?tenant_id=${TENANT_ID}` },
  { name: '13. 税率', path: '/tax-brackets', query: `?tenant_id=${TENANT_ID}` },
  { name: '14. 労働基準法制約', path: '/labor-law-constraints', query: `?tenant_id=${TENANT_ID}` },
  { name: '15. 労務管理ルール', path: '/labor-management-rules', query: `?tenant_id=${TENANT_ID}` },
  { name: '16. シフト検証ルール', path: '/shift-validation-rules', query: `?tenant_id=${TENANT_ID}` },
  { name: '17. 店舗制約', path: '/store-constraints', query: `?tenant_id=${TENANT_ID}` },
];

async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}${endpoint.query || ''}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.success && data.data) {
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
  console.log('📊 マスターAPIエンドポイントテスト');
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
    console.log('🎉 全てのマスターAPIが正常に動作しています！\n');
  } else {
    console.log('⚠️  一部のAPIが失敗しました。バックエンドサーバーが起動しているか確認してください。\n');
    process.exit(1);
  }
}

main();
