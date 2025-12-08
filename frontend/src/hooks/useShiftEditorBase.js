import { useState } from 'react'
import { MasterRepository } from '../infrastructure/repositories/MasterRepository'

const masterRepository = new MasterRepository()

/**
 * シフトエディタの基本機能を提供するカスタムhook
 * FirstPlanEditorとSecondPlanEditorの共通ロジックを抽出
 *
 * @param {Object} selectedShift - 選択されたシフト情報
 * @returns {Object} 共通の状態と関数
 */
export const useShiftEditorBase = () => {
  const [staffMap, setStaffMap] = useState({})
  const [rolesMap, setRolesMap] = useState({})
  const [storesMap, setStoresMap] = useState({})
  const [availableStores, setAvailableStores] = useState([])
  const [selectedStores, setSelectedStores] = useState(new Set())
  const [loading, setLoading] = useState(false)

  /**
   * マスタデータ（スタッフ、役職、店舗）を取得し、マッピングを作成
   */
  const loadMasterData = async () => {
    try {
      setLoading(true)

      // 並行でマスタデータを取得
      const [staffResult, rolesResult, storesResult] = await Promise.all([
        masterRepository.getStaff(),
        masterRepository.getRoles(),
        masterRepository.getStores(),
      ])

      // 役職IDから役職名へのマッピング
      const rolesMapping = {}
      rolesResult.forEach(role => {
        rolesMapping[role.role_id] = role.role_name
      })
      setRolesMap(rolesMapping)

      // スタッフIDから名前・役職へのマッピング
      const staffMapping = {}
      staffResult.forEach(staff => {
        staffMapping[staff.staff_id] = {
          name: staff.name,
          role_id: staff.role_id,
          role_name: rolesMapping[staff.role_id] || 'スタッフ',
          is_active: staff.is_active,
          store_id: staff.store_id,
          employment_type: staff.employment_type,
        }
      })
      setStaffMap(staffMapping)

      // 店舗IDから店舗情報へのマッピング
      const storesMapping = {}
      storesResult.forEach(store => {
        storesMapping[store.store_id] = {
          store_code: store.store_code,
          store_name: store.store_name,
          address: store.address,
        }
      })
      setStoresMap(storesMapping)

      // 利用可能な店舗リストを設定
      const stores = storesResult
        .map(store => ({
          store_id: store.store_id,
          store_name: store.store_name,
        }))
        .sort((a, b) => a.store_name.localeCompare(b.store_name))
      setAvailableStores(stores)

      // 初期状態で選択された店舗を設定
      initializeSelectedStores(stores)

      return { staffMapping, rolesMapping, storesMapping, stores }
    } catch (error) {
      console.error('マスタデータ取得エラー:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  /**
   * 選択された店舗の初期状態を設定
   * 常に全店舗を選択（マルチストア表示のため）
   * ユーザーはチェックボックスで表示する店舗を選択できる
   */
  const initializeSelectedStores = stores => {
    // 常に全店舗を選択
    const allStoreIds = stores.map(s => parseInt(s.store_id))
    setSelectedStores(new Set(allStoreIds))
  }

  /**
   * 店舗選択状態をトグル
   */
  const toggleStoreSelection = storeId => {
    setSelectedStores(prev => {
      const newSet = new Set(prev)
      const numericStoreId = parseInt(storeId)

      if (newSet.has(numericStoreId)) {
        newSet.delete(numericStoreId)
      } else {
        newSet.add(numericStoreId)
      }

      return newSet
    })
  }

  /**
   * 全店舗を選択
   */
  const selectAllStores = () => {
    setSelectedStores(new Set(availableStores.map(s => parseInt(s.store_id))))
  }

  /**
   * 全店舗の選択を解除
   */
  const deselectAllStores = () => {
    setSelectedStores(new Set())
  }

  return {
    // 状態
    staffMap,
    rolesMap,
    storesMap,
    availableStores,
    selectedStores,
    loading,

    // 関数
    loadMasterData,
    toggleStoreSelection,
    selectAllStores,
    deselectAllStores,
    setSelectedStores,
  }
}
