// Utility to decode JWT and extract payload (no verification, just decode)
export function decodeJWT(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
