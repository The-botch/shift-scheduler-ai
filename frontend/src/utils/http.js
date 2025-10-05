/**
 * HTTP通信ユーティリティ
 */

/**
 * fetchのラッパー関数（エラーハンドリング付き）
 * @param {string} url - リクエストURL
 * @param {Object} options - fetchオプション
 * @returns {Promise<Object>} レスポンスJSON
 */
export const fetchJSON = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error ? errorData.error.message : response.statusText
      throw new Error(`HTTP Error: ${response.status} - ${errorMessage}`)
    }

    return await response.json()
  } catch (error) {
    console.error('fetchJSON Error:', error)
    throw error
  }
}

/**
 * POSTリクエストのヘルパー
 */
export const postJSON = async (url, data, options = {}) => {
  return fetchJSON(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * GETリクエストのヘルパー
 */
export const getJSON = async (url, options = {}) => {
  return fetchJSON(url, {
    method: 'GET',
    ...options,
  })
}
