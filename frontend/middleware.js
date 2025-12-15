/**
 * Vercel Edge Middleware for Basic Authentication with Session Management
 *
 * This middleware runs on Vercel's Edge Network and provides Basic Authentication
 * for the entire application. It supports multiple user credentials and session management.
 *
 * Environment Variables:
 * - BASIC_AUTH_ENABLED: Set to 'true' to enable Basic Auth (defaults to false)
 * - BASIC_AUTH_CREDENTIALS: JSON array of user credentials
 *   Example: [{"username":"user1","password":"pass1"},{"username":"user2","password":"pass2"}]
 * - BASIC_AUTH_SESSION_DURATION: Session duration in milliseconds (default: 3600000 = 1 hour)
 */

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next (Next.js internals)
     * - assets (inside /dist after build)
     * - favicon.ico, sitemap.xml, robots.txt (SEO files)
     * - Static file extensions: .js, .css, .svg, .png, .jpg, .jpeg, .gif, .ico, .woff, .woff2, .ttf, .eot
     */
    '/((?!assets/|.*\\.(js|css|svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$).*)',
  ],
};

const COOKIE_NAME = 'basic-auth-session';
const DEFAULT_SESSION_DURATION = 3600000; // 1 hour in ms

/**
 * Base64 encode (Edge Runtime compatible)
 */
function base64Encode(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

/**
 * Base64 decode (Edge Runtime compatible)
 */
function base64Decode(str) {
  return Buffer.from(str, 'base64').toString('utf-8');
}

/**
 * Parse credentials from environment variable
 */
function parseCredentials() {
  const credentialsStr = process.env.BASIC_AUTH_CREDENTIALS;

  if (!credentialsStr) {
    return [];
  }

  try {
    const credentials = JSON.parse(credentialsStr);
    if (!Array.isArray(credentials)) {
      console.error('BASIC_AUTH_CREDENTIALS must be a JSON array');
      return [];
    }
    return credentials;
  } catch (error) {
    console.error('Failed to parse BASIC_AUTH_CREDENTIALS:', error);
    return [];
  }
}

/**
 * Verify if the provided username and password match any configured credentials
 */
function verifyCredentials(username, password, credentials) {
  return credentials.some(
    (cred) => cred.username === username && cred.password === password
  );
}

/**
 * Create a session token
 */
function createSessionToken(username) {
  const expiresAt = Date.now() + getSessionDuration();
  const payload = { username, expiresAt };
  return base64Encode(JSON.stringify(payload));
}

/**
 * Verify a session token
 */
function verifySessionToken(token) {
  try {
    const payload = JSON.parse(base64Decode(token));

    if (!payload.expiresAt || !payload.username) {
      return false;
    }

    // Check if token has expired
    if (Date.now() > payload.expiresAt) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get session duration from environment variable
 */
function getSessionDuration() {
  const duration = process.env.BASIC_AUTH_SESSION_DURATION;
  if (!duration) {
    return DEFAULT_SESSION_DURATION;
  }

  const parsed = parseInt(duration, 10);
  if (isNaN(parsed) || parsed <= 0) {
    console.warn('Invalid BASIC_AUTH_SESSION_DURATION, using default');
    return DEFAULT_SESSION_DURATION;
  }

  return parsed;
}

/**
 * Parse cookies from cookie header
 */
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
    return cookies;
  }, {});
}

/**
 * Create a Set-Cookie header value
 */
function createCookieHeader(name, value, options = {}) {
  const {
    maxAge,
    httpOnly = true,
    secure = false,
    sameSite = 'strict',
    path = '/',
  } = options;

  let cookie = `${name}=${encodeURIComponent(value)}`;

  if (maxAge) {
    cookie += `; Max-Age=${maxAge}`;
  }
  if (httpOnly) {
    cookie += '; HttpOnly';
  }
  if (secure) {
    cookie += '; Secure';
  }
  if (sameSite) {
    cookie += `; SameSite=${sameSite}`;
  }
  if (path) {
    cookie += `; Path=${path}`;
  }

  return cookie;
}

export default function middleware(request) {
  // Check if Basic Auth is enabled
  const isEnabled = process.env.BASIC_AUTH_ENABLED === 'true';

  if (!isEnabled) {
    return;
  }

  // Get credentials from environment variables
  const credentials = parseCredentials();

  // If credentials are not set, skip authentication
  if (credentials.length === 0) {
    console.warn('Basic Auth is enabled but no credentials are configured');
    return;
  }

  // Check for existing session
  const cookieHeader = request.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies[COOKIE_NAME];

  if (sessionToken && verifySessionToken(sessionToken)) {
    // Valid session exists, allow access
    return;
  }

  // Get the Authorization header
  const authHeader = request.headers.get('authorization');

  // Check if Authorization header exists
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  // Extract and decode credentials
  const base64Credentials = authHeader.split(' ')[1];
  const decodedCredentials = base64Decode(base64Credentials);
  const [username, password] = decodedCredentials.split(':');

  // Verify credentials
  if (verifyCredentials(username, password, credentials)) {
    // Authentication successful, create session and set cookie
    const sessionToken = createSessionToken(username);

    // Create response with cookie
    const cookieValue = createCookieHeader(COOKIE_NAME, sessionToken, {
      maxAge: Math.floor(getSessionDuration() / 1000), // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return new Response(null, {
      status: 200,
      headers: {
        'Set-Cookie': cookieValue,
      },
    });
  }

  // Authentication failed
  return new Response('Invalid credentials', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
