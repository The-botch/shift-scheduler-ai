import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LiffLogin from './components/liff/LiffLogin.jsx'
import StaffShiftInput from './screens/StaffShiftInput.jsx'
import { getCurrentTenantId, setCurrentTenantId, resetTenantId } from './config/tenant'

// デバッグ用: グローバルにテナント設定関数を公開
window.getCurrentTenantId = getCurrentTenantId
window.setCurrentTenantId = setCurrentTenantId
window.resetTenantId = resetTenantId

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 管理者画面（既存） */}
        <Route path="/*" element={<App />} />

        {/* LINE LIFF画面（スタッフ用） */}
        <Route path="/liff/login" element={<LiffLogin />} />
        <Route path="/staff/shift-input" element={<StaffShiftInput />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
