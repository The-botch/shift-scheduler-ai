import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { getCurrentTenantId, setCurrentTenantId, resetTenantId } from './config/tenant'

// デバッグ用: グローバルにテナント設定関数を公開
window.getCurrentTenantId = getCurrentTenantId
window.setCurrentTenantId = setCurrentTenantId
window.resetTenantId = resetTenantId

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
