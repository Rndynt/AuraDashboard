import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@acme/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Convert Next.js API request to Web Request
  const url = `${process.env.BETTER_AUTH_URL || 'http://localhost:5000'}${req.url}`;
  const headers = new Headers();
  
  // Copy headers from Next.js request
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      headers.set(key, Array.isArray(value) ? value[0] : value);
    }
  });

  // Create Web Request
  const webRequest = new Request(url, {
    method: req.method || 'GET',
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : null,
  });

  try {
    // Call Better Auth handler
    const response = await auth.handler(webRequest);
    
    // Convert Web Response back to Next.js response
    const data = await response.text();
    
    // Handle Set-Cookie headers properly (multiple cookies can exist)
    const cookies = response.headers.getSetCookie?.() || [];
    if (cookies.length) {
      res.setHeader('set-cookie', cookies);
    }
    
    // Copy other response headers (skip 'set-cookie' as it's handled above)
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'set-cookie') {
        res.setHeader(key, value);
      }
    });
    
    // Set status and send response
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Auth handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}