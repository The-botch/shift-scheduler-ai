import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: '/:path*',
}

export function middleware(request: NextRequest) {
  // 本番環境のみBasic認証を有効化
  // if (process.env.VERCEL_ENV !== 'production') {
  //   return NextResponse.next()
  // }

  // 環境変数から認証情報を取得
  // フォーマット: "user1:pass1,user2:pass2,user3:pass3"
  const credentials = process.env.BASIC_AUTH_CREDENTIALS

  if (!credentials) {
    return NextResponse.next()
  }

  // 認証情報をパース
  const validUsers: Record<string, string> = {}
  credentials.split(',').forEach(cred => {
    const [user, password] = cred.split(':')
    if (user && password) {
      validUsers[user.trim()] = password.trim()
    }
  })

  // 有効なユーザーが存在しない場合はスキップ
  if (Object.keys(validUsers).length === 0) {
    return NextResponse.next()
  }

  // Authorization ヘッダーを取得
  const authorizationHeader = request.headers.get('authorization')

  if (authorizationHeader) {
    const basicAuth = authorizationHeader.split(' ')[1]
    const [user, pwd] = Buffer.from(basicAuth, 'base64').toString().split(':')

    // 認証成功チェック
    if (validUsers[user] && validUsers[user] === pwd) {
      return NextResponse.next()
    }
  }

  // 認証失敗 - Basic認証ダイアログを表示
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}
