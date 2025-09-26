import { useAuthContext } from '../context/AuthContext';
import { decodeJWT } from '../lib/jwt';

export default function UserInfo() {
  const { token, logout } = useAuthContext();
  if (!token) return null;
  const payload = decodeJWT(token);
  const username = payload?.username || 'User';
  const exp = payload?.exp ? new Date(payload.exp * 1000) : null;
  const expired = exp && exp < new Date();
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-gray-700">
        Logged in as <b>{username}</b>
        {exp && (
          <span className="ml-2 text-xs text-gray-500">(expires {exp.toLocaleString()}{expired ? ', expired' : ''})</span>
        )}
      </span>
      <button className="text-red-600 underline" onClick={logout}>
        Logout
      </button>
    </div>
  );
}
