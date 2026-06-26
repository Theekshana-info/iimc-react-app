import type { VercelRequest, VercelResponse } from '@vercel/node';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing Turnstile token.' });
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('[Turnstile] TURNSTILE_SECRET_KEY is not configured.');
    return res.status(500).json({ success: false, error: 'Server configuration error.' });
  }

  // Get client IP for additional validation
  const remoteip = (req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '') as string;

  try {
    const verifyResponse = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        ...(remoteip ? { remoteip } : {}),
      }).toString(),
    });

    const result = await verifyResponse.json();

    if (result.success) {
      return res.status(200).json({ success: true });
    }

    console.warn('[Turnstile] Verification failed:', result['error-codes']);
    return res.status(403).json({
      success: false,
      error: 'CAPTCHA verification failed. Please try again.',
    });
  } catch (error) {
    console.error('[Turnstile] Siteverify request error:', error);
    return res.status(500).json({
      success: false,
      error: 'CAPTCHA verification service unavailable.',
    });
  }
}
