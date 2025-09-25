import { useAuthContext } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export default function ProtectedExample() {
  const { token, isAuthenticated, logout } = useAuthContext();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    fetch('http://localhost:4000/api/notes', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setNotes(data))
      .catch(() => setError('Failed to fetch notes'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, token]);

  if (!isAuthenticated) return <div>Please log in to view this page.</div>;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Protected Notes Example</h2>
        <button className="text-red-600" onClick={logout}>Logout</button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="space-y-2">
        {notes.map(note => (
          <li key={note._id} className="border rounded p-3 bg-gray-50">
            <div className="font-semibold">{note.title}</div>
            <div>{note.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
