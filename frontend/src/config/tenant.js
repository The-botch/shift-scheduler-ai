/**
 * テナント管理
 * localStorage を使用してテナントIDを保存・取得
 */

// TenantContextと統一するため、キー名を'tenantId'に変更
const TENANT_KEY = 'tenantId'
const DEFAULT_TENANT_ID = 3 // デフォルトはバインミー (tenant_id=3)

/**
 * 現在のテナントIDを取得
 */
export const getCurrentTenantId = () => {
  const stored = localStorage.getItem(TENANT_KEY)
  return stored ? parseInt(stored, 10) : DEFAULT_TENANT_ID
}

/**
 * テナントIDを設定
 */
export const setCurrentTenantId = (tenantId) => {
  localStorage.setItem(TENANT_KEY, tenantId.toString())
  // ページをリロードして変更を反映
  window.location.reload()
}

/**
 * テナントIDをデフォルトにリセット
 */
export const resetTenantId = () => {
  localStorage.removeItem(TENANT_KEY)
  window.location.reload()
}
