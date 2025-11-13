import jwt from 'jsonwebtoken'
import axios from 'axios'

// LINE公開鍵キャッシュ
let linePublicKeys = null
let lastFetchTime = 0
const CACHE_DURATION = 3600000 // 1時間

/**
 * LINEの公開鍵を取得（キャッシュ付き）
 */
async function getLinePublicKeys() {
  const now = Date.now()

  // キャッシュが有効な場合は再利用
  if (linePublicKeys && (now - lastFetchTime) < CACHE_DURATION) {
    return linePublicKeys
  }

  try {
    const response = await axios.get('https://api.line.me/oauth2/v2.1/certs')
    linePublicKeys = response.data.keys
    lastFetchTime = now
    return linePublicKeys
  } catch (error) {
    console.error('LINE公開鍵の取得に失敗:', error)
    throw new Error('LINE認証サーバーへの接続に失敗しました')
  }
}

/**
 * LINE ID Tokenを検証するミドルウェア
 */
export async function verifyLineToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '認証トークンが提供されていません'
      })
    }

    const idToken = authHeader.substring(7) // "Bearer "を削除

    // トークンのデコード（検証なし）
    const decodedToken = jwt.decode(idToken, { complete: true })

    if (!decodedToken) {
      return res.status(401).json({
        success: false,
        error: '無効なトークン形式です'
      })
    }

    // LINE公開鍵を取得
    const publicKeys = await getLinePublicKeys()

    // kid（Key ID）に対応する公開鍵を探す
    const kid = decodedToken.header.kid
    const publicKey = publicKeys.find(key => key.kid === kid)

    if (!publicKey) {
      return res.status(401).json({
        success: false,
        error: 'トークンの公開鍵が見つかりません'
      })
    }

    // トークンを検証
    const channelId = process.env.LINE_CHANNEL_ID

    if (!channelId) {
      throw new Error('LINE_CHANNEL_IDが設定されていません')
    }

    // JWKを直接使用してトークンを検証（ES256/RS256両方に対応）
    // jsonwebtokenライブラリは内部でJWKをPEMに変換してくれる
    const getKey = (header, callback) => {
      const key = publicKeys.find(k => k.kid === header.kid)
      if (!key) {
        return callback(new Error('公開鍵が見つかりません'))
      }

      // JWKをそのまま返す（ES256にも対応）
      callback(null, key)
    }

    const verified = await new Promise((resolve, reject) => {
      jwt.verify(
        idToken,
        getKey,
        {
          algorithms: ['ES256', 'RS256'],
          audience: channelId,
          issuer: 'https://access.line.me'
        },
        (err, decoded) => {
          if (err) return reject(err)
          resolve(decoded)
        }
      )
    })

    // 検証済みのユーザー情報をリクエストに追加
    req.lineUser = {
      userId: verified.sub,
      displayName: verified.name,
      pictureUrl: verified.picture
    }

    next()
  } catch (error) {
    console.error('LINE ID Token検証エラー:', error)

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'トークンの有効期限が切れています'
      })
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'トークンの検証に失敗しました'
      })
    }

    return res.status(500).json({
      success: false,
      error: '認証処理中にエラーが発生しました'
    })
  }
}
