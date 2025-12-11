/**
 * スクリーンショットユーティリティ
 * テーブル要素をPNG画像としてキャプチャするための汎用関数
 */
import { domToPng } from 'modern-screenshot'

/**
 * テーブル要素をPNG画像としてキャプチャしてダウンロードする
 *
 * @param {Object} options - キャプチャオプション
 * @param {HTMLElement} options.element - キャプチャ対象のDOM要素
 * @param {string} options.filename - 出力ファイル名
 * @param {Object} [options.padding] - 余白設定
 * @param {number} [options.padding.top=200] - 上の余白(px)
 * @param {number} [options.padding.right=120] - 右の余白(px)
 * @param {number} [options.padding.bottom=0] - 下の余白(px)
 * @param {number} [options.padding.left=120] - 左の余白(px)
 * @param {number} [options.scale=2] - 画像の拡大率
 * @param {string} [options.backgroundColor='#ffffff'] - 背景色
 * @returns {Promise<string>} - キャプチャしたデータURL
 */
export async function captureTableAsImage({
  element,
  filename,
  padding = { top: 200, right: 120, bottom: 0, left: 120 },
  scale = 2,
  backgroundColor = '#ffffff',
}) {
  if (!element) {
    throw new Error('キャプチャ対象の要素が見つかりません')
  }

  // デフォルト値とマージ
  const paddingConfig = {
    top: padding.top ?? 200,
    right: padding.right ?? 120,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 120,
  }

  // 高さ制限を持つ全要素を取得
  const constrainedElements = element.querySelectorAll(
    '[class*="overflow"], [class*="h-full"], [class*="flex-1"], [class*="flex-col"]'
  )
  const savedStyles = []

  // 各制限要素のスタイルを保存して解除
  constrainedElements.forEach(el => {
    savedStyles.push({
      el,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
      overflow: el.style.overflow,
      maxHeight: el.style.maxHeight,
      height: el.style.height,
      flex: el.style.flex,
    })
    el.scrollLeft = 0
    el.scrollTop = 0
    el.style.overflow = 'visible'
    el.style.maxHeight = 'none'
    el.style.height = 'auto'
    el.style.flex = 'none'
  })

  // 親コンテナの制限も解除
  const savedContainerStyle = {
    overflow: element.style.overflow,
    maxHeight: element.style.maxHeight,
    height: element.style.height,
    flex: element.style.flex,
    padding: element.style.padding,
  }
  element.style.overflow = 'visible'
  element.style.maxHeight = 'none'
  element.style.height = 'auto'
  element.style.flex = 'none'
  element.style.padding = `${paddingConfig.top}px ${paddingConfig.right}px ${paddingConfig.bottom}px ${paddingConfig.left}px`

  // DOM更新を待つ
  await new Promise(resolve => setTimeout(resolve, 300))

  // テーブル全体のサイズを取得
  const tables = element.querySelectorAll('table')
  let contentHeight = 0
  let contentWidth = 0
  tables.forEach(table => {
    contentHeight += table.offsetHeight
    if (table.offsetWidth > contentWidth) contentWidth = table.offsetWidth
  })

  // 余白込みのサイズを計算
  const captureWidth = contentWidth + paddingConfig.left + paddingConfig.right
  const captureHeight =
    Math.max(contentHeight, element.scrollHeight) + paddingConfig.top + paddingConfig.bottom

  console.log('Screenshot dimensions:', { captureWidth, captureHeight })

  // PNGキャプチャ
  const dataUrl = await domToPng(element, {
    backgroundColor,
    scale,
    width: captureWidth,
    height: captureHeight,
  })

  // スタイルを復元
  savedStyles.forEach(({ el, scrollLeft, scrollTop, overflow, maxHeight, height, flex }) => {
    el.style.overflow = overflow
    el.style.maxHeight = maxHeight
    el.style.height = height
    el.style.flex = flex
    el.scrollLeft = scrollLeft
    el.scrollTop = scrollTop
  })
  element.style.overflow = savedContainerStyle.overflow
  element.style.maxHeight = savedContainerStyle.maxHeight
  element.style.height = savedContainerStyle.height
  element.style.flex = savedContainerStyle.flex
  element.style.padding = savedContainerStyle.padding

  // ダウンロード
  if (filename) {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  }

  return dataUrl
}

/**
 * 複数店舗のスクリーンショットを一括でキャプチャする
 *
 * @param {Object} options - キャプチャオプション
 * @param {HTMLElement} options.tableContainerRef - テーブルコンテナのRef
 * @param {Set} options.selectedStores - 選択中の店舗IDセット
 * @param {Function} options.setSelectedStores - 店舗選択を変更する関数
 * @param {Object} options.storesMap - 店舗IDから店舗情報へのマップ
 * @param {number} options.year - 年
 * @param {number} options.month - 月
 * @param {Object} [options.padding] - 余白設定
 * @param {number} [options.scale=2] - 画像の拡大率
 * @returns {Promise<void>}
 */
export async function captureMultipleStores({
  tableContainerRef,
  selectedStores,
  setSelectedStores,
  storesMap,
  year,
  month,
  padding = { top: 200, right: 120, bottom: 0, left: 120 },
  scale = 2,
}) {
  const originalSelectedStores = new Set(selectedStores)
  const storeIds = Array.from(originalSelectedStores)

  for (const storeId of storeIds) {
    // 一時的に1店舗のみ選択
    setSelectedStores(new Set([storeId]))

    // DOM更新を待つ
    await new Promise(resolve => setTimeout(resolve, 300))

    const tableElement = tableContainerRef.current
    if (!tableElement) continue

    const storeName = storesMap[storeId]?.store_name || `店舗${storeId}`
    const filename = `${year}年${month}月_${storeName}.png`

    await captureTableAsImage({
      element: tableElement,
      filename,
      padding,
      scale,
    })

    // 少し間隔を開ける
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // 元の選択状態に戻す
  setSelectedStores(originalSelectedStores)

  return storeIds.length
}
