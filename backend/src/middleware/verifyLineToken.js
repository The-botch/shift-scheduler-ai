import { jwtVerify, createRemoteJWKSet } from 'jose'

// LINEのJWKSエンドポイント
const LINE_JWKS_URL = new URL('https://api.line.me/oauth2/v2.1/certs')
const JWKS = createRemoteJWKSet(LINE_JWKS_URL)

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

    // トークンを検証
    const channelId = process.env.LINE_CHANNEL_ID

    if (!channelId) {
      throw new Error('LINE_CHANNEL_IDが設定されていません')
    }

    // joseライブラリでJWT検証（ES256/RS256自動対応）
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: 'https://access.line.me',
      audience: channelId
    })

    // 検証済みのユーザー情報をリクエストに追加
    req.lineUser = {
      userId: payload.sub,
      displayName: payload.name,
      pictureUrl: payload.picture
    }

    next()
  } catch (error) {
    console.error('LINE ID Token検証エラー:', error)

    if (error.code === 'ERR_JWT_EXPIRED') {
      return res.status(401).json({
        success: false,
        error: 'トークンの有効期限が切れています'
      })
    }

    if (error.code?.startsWith('ERR_JWT') || error.code?.startsWith('ERR_JWS')) {
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
