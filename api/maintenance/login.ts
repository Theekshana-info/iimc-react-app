import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// In-memory rate limiting map for brute force protection
const attempts = new Map<string, { count: number; resetTime: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  const expectedPassword = process.env.SITE_ACCESS_PASSWORD;

  if (!expectedPassword) {
    return res.status(500).json({ error: 'Server configuration error: SITE_ACCESS_PASSWORD is not configured.' });
  }

  // Get client IP address for rate limiting
  const ip = (req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'unknown') as string;
  const now = Date.now();

  const record = attempts.get(ip);
  if (record && record.resetTime > now) {
    if (record.count >= 5) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please try again in 1 minute.' });
    }
  }

  // Verify password
  if (password !== expectedPassword) {
    // Record failed attempt
    const currentRecord = attempts.get(ip) || { count: 0, resetTime: now + 60000 };
    if (currentRecord.resetTime < now) {
      currentRecord.count = 1;
      currentRecord.resetTime = now + 60000;
    } else {
      currentRecord.count += 1;
    }
    attempts.set(ip, currentRecord);

    // Apply a 1.5s delay to prevent automated dictionary attacks
    await new Promise(resolve => setTimeout(resolve, 1500));
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  // On successful login, reset the failed attempt counter
  attempts.delete(ip);

  // Set up session cookie expiration (30 days)
  const expirationDays = 30;
  const expirationMs = expirationDays * 24 * 60 * 60 * 1000;
  const expiresAt = now + expirationMs;

  // Sign the expiration timestamp with the password as a key to prevent client tampering
  const signature = crypto
    .createHmac('sha256', expectedPassword)
    .update(expiresAt.toString())
    .digest('hex');

  const cookieValue = `${expiresAt}|${signature}`;

  // Issue the secure cookie
  res.setHeader(
    'Set-Cookie',
    `site_access_session=${cookieValue}; Path=/; Max-Age=${expirationDays * 24 * 60 * 60}; HttpOnly; Secure; SameSite=Lax`
  );

  return res.status(200).json({ success: true });
}
