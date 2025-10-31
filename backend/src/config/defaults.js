/**
 * デフォルト設定値
 *
 * ハードコーディングを避けるため、デフォルト値を一元管理します。
 * 環境変数で上書き可能です。
 */

export const DEFAULT_CONFIG = {
  // テナント・店舗設定
  TENANT_ID: parseInt(process.env.DEFAULT_TENANT_ID) || 1,
  STORE_ID: parseInt(process.env.DEFAULT_STORE_ID) || 1,

  // デモ・開発用設定
  DEMO_PLAN_ID: parseInt(process.env.DEMO_PLAN_ID) || 4,
  DEMO_STAFF_ID: parseInt(process.env.DEMO_STAFF_ID) || 5,
  DEMO_YEAR: parseInt(process.env.DEMO_YEAR) || 2024,
  DEMO_MONTH: parseInt(process.env.DEMO_MONTH) || 10,
};

/**
 * APIエンドポイントでデフォルトテナントIDを取得する
 * クエリパラメータまたはデフォルト値を返す
 */
export const getTenantId = (req) => {
  return parseInt(req.query.tenant_id) || DEFAULT_CONFIG.TENANT_ID;
};

/**
 * APIエンドポイントでデフォルト店舗IDを取得する
 * クエリパラメータまたはデフォルト値を返す
 */
export const getStoreId = (req) => {
  return parseInt(req.query.store_id) || DEFAULT_CONFIG.STORE_ID;
};

export default DEFAULT_CONFIG;
