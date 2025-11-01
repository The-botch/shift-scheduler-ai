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
  // LocalStorageから初期値を取得、なければデフォルト値
  const [tenantId, setTenantId] = useState(() => {
    const saved = localStorage.getItem('tenantId')
    return saved ? parseInt(saved) : DEFAULT_CONFIG.TENANT_ID
  })

  const [tenantName, setTenantName] = useState(() => {
    return localStorage.getItem('tenantName') || 'DEMO'
  })

  const [availableTenants, setAvailableTenants] = useState([])
  const [loading, setLoading] = useState(true)

  // 初回マウント時にテナント一覧を取得
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}${API_ENDPOINTS.TENANTS}`)
        const result = await response.json()
        if (result.success) {
          setAvailableTenants(result.data)

          // LocalStorageに保存されているtenantIdが利用可能なテナントに含まれているか確認
          const savedTenantId = localStorage.getItem('tenantId')
          if (savedTenantId) {
            const savedTenant = result.data.find(t => t.tenant_id === parseInt(savedTenantId))
            if (savedTenant) {
              setTenantId(savedTenant.tenant_id)
              setTenantName(savedTenant.tenant_code)
            } else {
              // 保存されているテナントが存在しない場合は最初のテナントを使用
              if (result.data.length > 0) {
                setTenantId(result.data[0].tenant_id)
                setTenantName(result.data[0].tenant_code)
              }
            }
          } else if (result.data.length > 0) {
            // LocalStorageにない場合は最初のテナントを使用
            setTenantId(result.data[0].tenant_id)
            setTenantName(result.data[0].tenant_code)
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

  // tenantIdが変更されたらLocalStorageに保存
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('tenantId', tenantId.toString())
      localStorage.setItem('tenantName', tenantName)
    }
  }, [tenantId, tenantName, loading])

  const changeTenant = (newTenantId, newTenantName) => {
    setTenantId(newTenantId)
    setTenantName(newTenantName)
  }

  return (
    <TenantContext.Provider value={{ tenantId, tenantName, changeTenant, availableTenants, loading }}>
      {children}
    </TenantContext.Provider>
  )
}
