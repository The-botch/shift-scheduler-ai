/**
 * Vite Plugin for Basic Authentication (Local Development)
 *
 * This plugin adds Basic Authentication to Vite's development server.
 * For production (Vercel), use middleware.js instead.
 *
 * Environment Variables:
 * - BASIC_AUTH_ENABLED: Set to 'true' to enable Basic Auth
 * - BASIC_AUTH_CREDENTIALS: JSON array of user credentials
 * - BASIC_AUTH_SESSION_DURATION: Session duration in milliseconds
 */

const COOKIE_NAME = 'basic-auth-session';
const DEFAULT_SESSION_DURATION = 3600000; // 1 hour in ms

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
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Verify a session token
 */
function verifySessionToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

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

/**
 * Vite Plugin
 */
export default function basicAuthPlugin() {
  return {
    name: 'vite-plugin-basic-auth',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Check if Basic Auth is enabled
        const isEnabled = process.env.BASIC_AUTH_ENABLED === 'true';

        if (!isEnabled) {
          return next();
        }

        // Get credentials from environment variables
        const credentials = parseCredentials();

        // If credentials are not set, skip authentication
        if (credentials.length === 0) {
          console.warn('Basic Auth is enabled but no credentials are configured');
          return next();
        }

        // Check for existing session
        const cookieHeader = req.headers.cookie;
        const cookies = parseCookies(cookieHeader);
        const sessionToken = cookies[COOKIE_NAME];

        if (sessionToken && verifySessionToken(sessionToken)) {
          // Valid session exists, allow access
          return next();
        }

        // Get the Authorization header
        const authHeader = req.headers.authorization;

        // Check if Authorization header exists
        if (!authHeader || !authHeader.startsWith('Basic ')) {
          res.statusCode = 401;
          res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
          res.end('Authentication required');
          return;
        }

        // Extract and decode credentials
        const base64Credentials = authHeader.split(' ')[1];
        const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = decodedCredentials.split(':');

        // Verify credentials
        if (verifyCredentials(username, password, credentials)) {
          // Authentication successful, create session and set cookie
          const sessionToken = createSessionToken(username);

          const cookieValue = createCookieHeader(COOKIE_NAME, sessionToken, {
            maxAge: Math.floor(getSessionDuration() / 1000), // Convert to seconds
            httpOnly: true,
            secure: false, // Local development uses HTTP
            sameSite: 'strict',
            path: '/',
          });

          res.setHeader('Set-Cookie', cookieValue);
          return next();
        }

        // Authentication failed
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.end('Invalid credentials');
      });
    },
  };
}
