import React, { createContext, useContext, useState, useEffect } from 'react'
import { DEFAULT_CONFIG } from '../config/defaults'
import { BACKEND_API_URL, API_ENDPOINTS } from '../config/api'

const TenantContext = createContext()

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

export const TenantProvider = ({ children }) => {
  const [tenantId, setTenantId] = useState(null)
  const [tenantName, setTenantName] = useState('')
  const [availableTenants, setAvailableTenants] = useState([])
  const [loading, setLoading] = useState(true)

  // 初回マウント時にテナント一覧を取得
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        // DBのマスターデータからテナント一覧を取得
        const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.TENANTS}`)
        const result = await response.json()

        if (result.success && result.data.length > 0) {
          // テナント一覧を保存
          setAvailableTenants(result.data)

          // localStorageに保存されているテナントIDを確認
          const savedTenantId = localStorage.getItem('tenantId')

          if (savedTenantId) {
            // 保存されているテナントIDが利用可能なテナントに含まれているか確認
            const savedTenant = result.data.find(t => t.tenant_id === parseInt(savedTenantId))
            if (savedTenant) {
              setTenantId(savedTenant.tenant_id)
              setTenantName(savedTenant.tenant_name || savedTenant.tenant_code)
            } else {
              // 存在しない場合は最初のテナントを選択
              const firstTenant = result.data[0]
              setTenantId(firstTenant.tenant_id)
              setTenantName(firstTenant.tenant_name || firstTenant.tenant_code)
              localStorage.setItem('tenantId', firstTenant.tenant_id.toString())
            }
          } else {
            // 保存されていない場合は最初のテナントを選択
            const firstTenant = result.data[0]
            setTenantId(firstTenant.tenant_id)
            setTenantName(firstTenant.tenant_name || firstTenant.tenant_code)
            localStorage.setItem('tenantId', firstTenant.tenant_id.toString())
          }
        }
      } catch (error) {
        console.error('テナント一覧の取得に失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTenants()
  }, [])

  const changeTenant = (newTenantId, newTenantName) => {
    setTenantId(newTenantId)
    setTenantName(newTenantName)
    // 選択したテナントをlocalStorageに保存
    localStorage.setItem('tenantId', newTenantId.toString())
  }

  return (
    <TenantContext.Provider
      value={{ tenantId, tenantName, changeTenant, availableTenants, loading }}
    >
      {children}
    </TenantContext.Provider>
  )
}
