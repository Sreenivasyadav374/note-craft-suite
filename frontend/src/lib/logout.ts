const API_URL = process.env.NODE_ENV === 'production' 
  ? "/api" // ✅ Production: Use relative path for Vercel rewrite
  : "http://localhost:4002/api"; // ✅ Development: Use known local absolute URL

export async function logoutApi(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  return res.json();
}
