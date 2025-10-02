// IndexedDB ユーティリティ
import { INDEXED_DB } from '../config/constants'

const { DB_NAME, VERSION, STORES } = INDEXED_DB

// データベースを開く
export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // actual_shifts ストア
      if (!db.objectStoreNames.contains(STORES.ACTUAL_SHIFTS)) {
        const actualShiftsStore = db.createObjectStore(STORES.ACTUAL_SHIFTS, {
          keyPath: 'shift_id'
        })
        actualShiftsStore.createIndex('year', 'year', { unique: false })
        actualShiftsStore.createIndex('month', 'month', { unique: false })
        actualShiftsStore.createIndex('staff_id', 'staff_id', { unique: false })
        actualShiftsStore.createIndex('year_month', ['year', 'month'], { unique: false })
      }

      // payroll ストア
      if (!db.objectStoreNames.contains(STORES.PAYROLL)) {
        const payrollStore = db.createObjectStore(STORES.PAYROLL, {
          keyPath: 'payroll_id'
        })
        payrollStore.createIndex('year', 'year', { unique: false })
        payrollStore.createIndex('month', 'month', { unique: false })
        payrollStore.createIndex('staff_id', 'staff_id', { unique: false })
        payrollStore.createIndex('year_month', ['year', 'month'], { unique: false })
      }
    }
  })
}

// データを保存（一括）
export const saveBulkData = async (storeName, data) => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)

    let successCount = 0
    let errorCount = 0

    data.forEach((item) => {
      const request = store.put(item)
      request.onsuccess = () => successCount++
      request.onerror = () => errorCount++
    })

    transaction.oncomplete = () => {
      db.close()
      resolve({ success: true, saved: successCount, errors: errorCount })
    }

    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
  })
}

// データを取得（全件）
export const getAllData = async (storeName) => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = () => {
      db.close()
      resolve(request.result)
    }

    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// 年月でデータを取得
export const getDataByYearMonth = async (storeName, year, month) => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index('year_month')
    const request = index.getAll([year, month])

    request.onsuccess = () => {
      db.close()
      resolve(request.result)
    }

    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// スタッフIDでデータを取得
export const getDataByStaffId = async (storeName, staffId) => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index('staff_id')
    const request = index.getAll(staffId)

    request.onsuccess = () => {
      db.close()
      resolve(request.result)
    }

    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// データを削除（全件）
export const clearStore = async (storeName) => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onsuccess = () => {
      db.close()
      resolve({ success: true })
    }

    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// データ件数を取得
export const getCount = async (storeName) => {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.count()

    request.onsuccess = () => {
      db.close()
      resolve(request.result)
    }

    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

// 実績労働時間データの保存
export const saveActualShifts = (shifts) => {
  return saveBulkData(STORES.ACTUAL_SHIFTS, shifts)
}

// 給与明細データの保存
export const savePayroll = (payroll) => {
  return saveBulkData(STORES.PAYROLL, payroll)
}

// 実績労働時間データの取得
export const getActualShifts = (year, month) => {
  return getDataByYearMonth(STORES.ACTUAL_SHIFTS, year, month)
}

// 給与明細データの取得
export const getPayroll = (year, month) => {
  return getDataByYearMonth(STORES.PAYROLL, year, month)
}

// スタッフの給与履歴を取得
export const getStaffPayrollHistory = (staffId) => {
  return getDataByStaffId(STORES.PAYROLL, staffId)
}

// スタッフの労働時間履歴を取得
export const getStaffWorkHistory = (staffId) => {
  return getDataByStaffId(STORES.ACTUAL_SHIFTS, staffId)
}
