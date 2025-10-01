// Utility functions for authentication and notes API

const API_URL = process.env.NODE_ENV === 'production' 
  ? "https://note-craft-suite-backend.vercel.app/api"
  : "http://localhost:4002/api"; // ✅ Development: Use known local absolute URL

  
export async function register(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function googleLogin(credential: string) {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });
  return res.json();
}

export async function getNotes(token: string) {
  const res = await fetch(`${API_URL}/notes`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function createNote(token: string, title: string, content: string) {
  const res = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, content })
  });
  return res.json();
}

export async function updateNote(
  token: string, 
  id: string, 
  title: string, 
  content: string, 
  tags?: string[] // <-- Added tags argument (optional)
) {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    // The request body now includes 'tags'
    body: JSON.stringify({ title, content, tags }) 
  });
  return res.json();
}

export async function deleteNote(token: string, id: string) {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.status === 204;
}
