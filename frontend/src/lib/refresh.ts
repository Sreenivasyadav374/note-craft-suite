import { login } from './api';

const API_URL = process.env.NODE_ENV === 'production' 
  ?"https://note-craft-suite-backend.vercel.app/api" // ✅ Production: Use relative path for Vercel rewrite
  : "http://localhost:4002/api"; // ✅ Development: Use known local absolute URL

export async function refreshToken(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  return res.json();
}
