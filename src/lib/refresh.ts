import { login } from './api';

const API_URL = 'http://localhost:4001/api';

export async function refreshToken(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  return res.json();
}
