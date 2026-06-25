const SITE_ACCESS_PASSWORD = process.env.SITE_ACCESS_PASSWORD;
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';

// Helper to verify cookie signature using Web Crypto API
async function verifySignature(expiresAt: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(expiresAt);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      messageData
    );
  } catch (err) {
    console.error('Error verifying HMAC signature:', err);
    return false;
  }
}

// Custom cookie parser for Request headers
function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (name) {
      cookies[name] = parts.slice(1).join('=').trim();
    }
  });
  
  return cookies;
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  // If maintenance mode is disabled, let all requests pass through untouched
  if (!MAINTENANCE_MODE) {
    return;
  }

  // Handle direct logout request by redirecting to the logout serverless handler
  if (url.pathname === '/logout') {
    return new Response(null, {
      status: 307,
      headers: {
        'Location': new URL('/api/maintenance/logout', request.url).toString(),
      },
    });
  }

  // Exclude static assets, Next/Vercel paths, and API routes from the auth block
  const isAllowedPath =
    url.pathname.startsWith('/api/maintenance/') ||
    url.pathname === '/maintenance' ||
    url.pathname.includes('.') || // matches files like index.js, style.css, logo.jpg
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/static');

  if (isAllowedPath) {
    return; // Let the request continue normally without headers
  }

  // Retrieve and parse cookies
  const cookies = parseCookies(request.headers.get('cookie'));
  const session = cookies['site_access_session'];

  let isAuthorized = false;

  if (session && SITE_ACCESS_PASSWORD) {
    const [expiresAtStr, signature] = session.split('|');
    const expiresAt = parseInt(expiresAtStr || '0', 10);
    
    if (expiresAt > Date.now() && signature) {
      isAuthorized = await verifySignature(expiresAtStr, signature, SITE_ACCESS_PASSWORD);
    }
  }

  // If authorized, proceed with requests
  if (isAuthorized) {
    return; // Let the request continue normally
  }

  // Unauthorized page access: Redirect to the Maintenance screen, passing the originally requested path
  const redirectUrl = new URL('/maintenance', request.url);
  redirectUrl.searchParams.set('redirect', url.pathname);
  
  return new Response(null, {
    status: 307,
    headers: {
      'Location': redirectUrl.toString(),
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
