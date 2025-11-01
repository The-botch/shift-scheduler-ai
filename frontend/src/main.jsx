import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { getCurrentTenantId, setCurrentTenantId, resetTenantId } from './config/tenant'

// デバッグ用: グローバルにテナント設定関数を公開
window.getCurrentTenantId = getCurrentTenantId
window.setCurrentTenantId = setCurrentTenantId
window.resetTenantId = resetTenantId

console.log('🏢 現在のテナントID:', getCurrentTenantId())
console.log('💡 テナント切り替え方法:')
console.log('  - バインミー(ID=3)に切り替え: setCurrentTenantId(3)')
console.log('  - デモ企業(ID=1)に切り替え: setCurrentTenantId(1)')
console.log('  - デフォルトにリセット: resetTenantId()')
console.log('  - 現在のテナントID確認: getCurrentTenantId()')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
