import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Supabase auth token is required' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  const expectedPassword = process.env.SITE_ACCESS_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey || !expectedPassword) {
    return res.status(500).json({ error: 'Server configuration error: missing Supabase keys or SITE_ACCESS_PASSWORD.' });
  }

  try {
    // Standard Supabase client using anonymised client keys
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Fetch user from Supabase using access token (verifies signature on the server)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired Supabase user session.' });
    }

    // 2. Query user_roles table to see if user is an admin
    const { data: roleRecord, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleRecord) {
      return res.status(403).json({ error: 'Access denied: User does not hold the Administrator role.' });
    }

    // 3. User is admin ➔ Issue signed bypass session cookie
    const expirationDays = 30;
    const expirationMs = expirationDays * 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() + expirationMs;

    const signature = crypto
      .createHmac('sha256', expectedPassword)
      .update(expiresAt.toString())
      .digest('hex');

    const cookieValue = `${expiresAt}|${signature}`;

    // Set secure cookie
    res.setHeader(
      'Set-Cookie',
      `site_access_session=${cookieValue}; Path=/; Max-Age=${expirationDays * 24 * 60 * 60}; HttpOnly; Secure; SameSite=Lax`
    );

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Error generating admin bypass session:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
