const API_URL = 'http://localhost:4000/api';

export async function logoutApi(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  return res.json();
}
