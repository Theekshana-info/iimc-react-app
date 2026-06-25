import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Clear the cookie by setting Max-Age to 0
  res.setHeader(
    'Set-Cookie',
    'site_access_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'
  );
  
  // Redirect back to the lock screen
  return res.redirect('/maintenance');
}
