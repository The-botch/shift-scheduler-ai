/**
 * シフト表PNG画像生成ユーティリティ
 * jsPDF + autoTable + pdf.js を使用してPNG画像を出力
 * （日本語フォント対応）
 */
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// PDF.js workerの設定
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// 曜日の配列
const DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土']

// 契約種別のソート順
const EMPLOYMENT_TYPE_ORDER = {
  FULL_TIME: 1,
  CONTRACT: 2,
  TEMPORARY: 3,
  PART_TIME: 4,
}

// 契約種別の表示名
const EMPLOYMENT_TYPE_NAMES = {
  FULL_TIME: '正社員',
  PART_TIME: 'アルバイト',
  CONTRACT: '業務委託',
  TEMPORARY: '派遣社員',
}

// フォントデータキャッシュ（Base64）
let cachedFontBase64 = null
let fontLoadAttempted = false

/**
 * 日本語フォントを読み込んでjsPDFに登録
 * @returns {string|null} 登録されたフォント名、失敗時はnull
 */
async function loadJapaneseFont(doc) {
  const FONT_NAME = 'IPAexGothic'

  // キャッシュされたフォントデータがあれば、このドキュメントに登録
  if (cachedFontBase64) {
    doc.addFileToVFS(`${FONT_NAME}.ttf`, cachedFontBase64)
    doc.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal')
    doc.setFont(FONT_NAME, 'normal')
    return FONT_NAME
  }

  // 既に試行済みで失敗していた場合
  if (fontLoadAttempted) {
    return null
  }

  fontLoadAttempted = true

  try {
    // IPAexゴシックを使用（jsPDFとの互換性が高い）
    const fontUrls = [
      // ローカルフォント（最優先）
      '/fonts/ipaexg.ttf',
    ]

    let arrayBuffer = null
    for (const fontUrl of fontUrls) {
      try {
        console.log('Trying to load font from:', fontUrl)
        const response = await fetch(fontUrl)
        if (response.ok) {
          arrayBuffer = await response.arrayBuffer()
          console.log('Font loaded successfully from:', fontUrl, 'Size:', arrayBuffer.byteLength)
          break
        } else {
          console.warn('Font fetch failed:', fontUrl, response.status)
        }
      } catch (err) {
        console.warn('Font fetch error:', fontUrl, err)
        continue
      }
    }

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('All font sources failed or returned empty data')
    }

    // ArrayBufferをBase64に変換（大きなファイル対応）
    const uint8Array = new Uint8Array(arrayBuffer)
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize)
      binary += String.fromCharCode.apply(null, chunk)
    }
    const base64 = btoa(binary)

    // キャッシュに保存
    cachedFontBase64 = base64

    // フォントを登録
    doc.addFileToVFS(`${FONT_NAME}.ttf`, base64)
    doc.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal')
    doc.setFont(FONT_NAME, 'normal')

    console.log('Font registered successfully:', FONT_NAME)
    return FONT_NAME
  } catch (error) {
    console.error('日本語フォントの読み込みに失敗しました:', error)
    return null
  }
}

/**
 * 日付から曜日を取得
 */
const getDayOfWeek = (year, month, day) => {
  const date = new Date(year, month - 1, day)
  return DAY_OF_WEEK[date.getDay()]
}

/**
 * 土曜日かどうか
 */
const isSaturday = (year, month, day) => {
  const date = new Date(year, month - 1, day)
  return date.getDay() === 6
}

/**
 * 日曜日かどうか
 */
const isSunday = (year, month, day) => {
  const date = new Date(year, month - 1, day)
  return date.getDay() === 0
}

/**
 * 時刻フォーマット（9:00形式）
 */
const formatTime = time => {
  if (!time) return ''
  const [h, m] = time.split(':')
  return `${parseInt(h)}:${m}`
}

/**
 * 店舗別のシフト表PNG画像を生成
 */
export async function generateShiftPDF({
  year,
  month,
  shiftData,
  staffMap,
  storesMap,
  storeId,
  deadlineText = '',
}) {
  const store = storesMap[storeId]
  const storeName = store?.store_name || `店舗${storeId}`

  // 月の日数を取得
  const daysInMonth = new Date(year, month, 0).getDate()
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // 店舗に所属するスタッフを取得（ソート済み）
  const staffInStore = Object.entries(staffMap)
    .map(([id, info]) => ({ staff_id: parseInt(id), ...info }))
    .filter(staff => parseInt(staff.store_id) === parseInt(storeId) && staff.is_active !== false)
    .sort((a, b) => {
      const orderA = EMPLOYMENT_TYPE_ORDER[a.employment_type] ?? 99
      const orderB = EMPLOYMENT_TYPE_ORDER[b.employment_type] ?? 99
      if (orderA !== orderB) return orderA - orderB
      return (a.name || '').localeCompare(b.name || '', 'ja')
    })

  // シフトデータをMap化
  const shiftDataMap = new Map()
  shiftData.forEach(shift => {
    if (shift.shift_date) {
      const dateStr = shift.shift_date.substring(0, 10)
      const key = `${dateStr}_${shift.staff_id}`
      if (!shiftDataMap.has(key)) {
        shiftDataMap.set(key, [])
      }
      shiftDataMap.get(key).push(shift)
    }
  })

  // シフト取得関数（複数シフト対応）
  const getShiftsForDateAndStaff = (date, staffId) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    return shiftDataMap.get(`${dateStr}_${staffId}`) || []
  }

  // タイトルテキスト
  const titleText = `${year}年${month}月1日(${getDayOfWeek(year, month, 1)})〜${year}年${month}月${daysInMonth}日(${getDayOfWeek(year, month, daysInMonth)})のシフト`

  // PDF作成（横向きA4）
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // 日本語フォントを読み込み
  const loadedFontName = await loadJapaneseFont(doc)

  // タイトルと店舗名
  doc.setFontSize(10)
  doc.text(titleText, 14, 12)
  doc.text(storeName, 283, 12, { align: 'right' })

  // テーブルヘッダー
  const headers = [
    { content: '日付', styles: { halign: 'center', fillColor: [245, 245, 245] } },
    ...staffInStore.map(staff => ({
      content: `${staff.name || ''}\n${EMPLOYMENT_TYPE_NAMES[staff.employment_type] || ''}`,
      styles: { halign: 'center', fillColor: [245, 245, 245], fontSize: 6 },
    })),
  ]

  // テーブルデータ
  const tableData = dates.map(date => {
    const dayOfWeek = getDayOfWeek(year, month, date)
    const isSun = isSunday(year, month, date)
    const isSat = isSaturday(year, month, date)

    // その日に誰か稼働しているかチェック
    let hasAnyShift = false
    staffInStore.forEach(staff => {
      const shifts = getShiftsForDateAndStaff(date, staff.staff_id)
      if (shifts.length > 0) hasAnyShift = true
    })

    // 日付セル
    const dateCell = {
      content: `${month}/${date} (${dayOfWeek})`,
      styles: {
        fillColor: !hasAnyShift
          ? [224, 224, 224]
          : isSun
            ? [255, 235, 238]
            : isSat
              ? [227, 242, 253]
              : [255, 255, 255],
        textColor: !hasAnyShift
          ? [136, 136, 136]
          : isSun
            ? [211, 47, 47]
            : isSat
              ? [25, 118, 210]
              : [0, 0, 0],
      },
    }

    // スタッフごとのシフトセル（複数シフト対応）
    const staffCells = staffInStore.map(staff => {
      const shifts = getShiftsForDateAndStaff(date, staff.staff_id)

      if (shifts.length === 0) {
        return {
          content: '',
          styles: {
            fillColor: !hasAnyShift ? [224, 224, 224] : [255, 255, 255],
          },
        }
      }

      // 複数シフトを改行で結合
      const shiftTexts = shifts.map(shift => {
        const isOtherStore = parseInt(shift.store_id) !== parseInt(storeId)
        const otherStoreCode = isOtherStore ? storesMap[shift.store_id]?.store_code || '' : ''
        const timeText = `${formatTime(shift.start_time)}~${formatTime(shift.end_time)}`
        return isOtherStore ? `${otherStoreCode} ${timeText}` : timeText
      })

      const hasOtherStore = shifts.some(s => parseInt(s.store_id) !== parseInt(storeId))

      return {
        content: shiftTexts.join('\n'),
        styles: {
          fillColor: !hasAnyShift ? [224, 224, 224] : [255, 255, 255],
          textColor: !hasAnyShift ? [136, 136, 136] : [0, 0, 0],
          fontSize: hasOtherStore || shifts.length > 1 ? 5 : 6,
        },
      }
    })

    return [dateCell, ...staffCells]
  })

  // テーブル描画
  const tableResult = autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 30,
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 1,
      halign: 'center',
      valign: 'middle',
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      fontStyle: 'normal',
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontSize: 6,
      fontStyle: 'normal',
    },
    columnStyles: {
      0: { cellWidth: 18 }, // 日付列
    },
    margin: { left: 10, right: 10, bottom: 5 },
    didParseCell: function (data) {
      // 全セルに同じフォントを適用
      if (loadedFontName) {
        data.cell.styles.font = loadedFontName
        data.cell.styles.fontStyle = 'normal'
      }
    },
  })

  // 締切テキスト
  if (deadlineText) {
    const finalY = tableResult?.finalY || 200
    doc.setTextColor(211, 47, 47)
    doc.setFontSize(9)
    doc.text(deadlineText, 14, finalY + 10)
  }

  // PDFをPNG画像として保存
  const pdfData = doc.output('arraybuffer')
  const pngDataUrl = await convertPdfToPng(pdfData)

  // PNGをダウンロード
  const fileName = `シフト表_${year}${String(month).padStart(2, '0')}01-${year}${String(month).padStart(2, '0')}${daysInMonth}_${storeName}.png`
  const link = document.createElement('a')
  link.download = fileName
  link.href = pngDataUrl
  link.click()
}

/**
 * PDFをPNG画像に変換
 * @param {ArrayBuffer} pdfData - PDFのArrayBuffer
 * @param {number} scale - 画像のスケール（デフォルト4で高解像度）
 * @returns {Promise<string>} - PNG画像のData URL
 */
async function convertPdfToPng(pdfData, scale = 10) {
  // PDFをロード
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
  const page = await pdf.getPage(1)

  // ビューポートを取得（スケール適用）
  const viewport = page.getViewport({ scale })

  // Canvasを作成
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = viewport.width
  canvas.height = viewport.height

  // PDFをキャンバスにレンダリング
  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise

  // Canvas内容をPNG Data URLとして返す
  return canvas.toDataURL('image/png')
}

/**
 * 複数店舗のPNG画像を一括生成
 */
export async function generateMultipleStorePDFs({
  year,
  month,
  shiftData,
  staffMap,
  storesMap,
  selectedStores,
  deadlineText = '',
}) {
  const storeIds = Array.from(selectedStores)
  let count = 0

  for (const storeId of storeIds) {
    await generateShiftPDF({
      year,
      month,
      shiftData,
      staffMap,
      storesMap,
      storeId,
      deadlineText,
    })

    count++
    // 少し間隔を開ける
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return count
}
