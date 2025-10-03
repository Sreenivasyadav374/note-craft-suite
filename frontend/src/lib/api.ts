// Utility functions for authentication and notes API

const API_URL = process.env.NODE_ENV === 'production' 
  ? "https://note-craft-suite-backend.vercel.app/api"
  : "http://localhost:4002/api"; // ✅ Development: Use known local absolute URL

const TIMEOUT_MS = 10000; // 10 second timeout

// Helper function to add timeout to fetch requests
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Server is not responding. Please check your connection and try again.');
    }
    throw error;
  }
}

export async function register(username: string, password: string) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) {
      const error = await res.json();
      return { error: error.message || 'Registration failed' };
    }
    
    return res.json();
  } catch (error: any) {
    return { error: error.message || 'Unable to connect to server. Please try again later.' };
  }
}

export async function login(username: string, password: string) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) {
      const error = await res.json();
      return { error: error.message || 'Login failed' };
    }
    
    return res.json();
  } catch (error: any) {
    return { error: error.message || 'Unable to connect to server. Please try again later.' };
  }
}

export async function googleLogin(credential: string) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    
    if (!res.ok) {
      const error = await res.json();
      return { error: error.message || 'Google login failed' };
    }
    
    return res.json();
  } catch (error: any) {
    return { error: error.message || 'Unable to connect to server. Please try again later.' };
  }
}

export async function getNotes(token: string) {
  const res = await fetch(`${API_URL}/notes`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function createNote(
  token: string, 
  title: string, 
  content: string, 
  tags: string[] = [], // <-- New: Tags array
  type: 'file' | 'folder' = 'file', // <-- New: Type with default 'file'
  parentId: string | null = null // <-- New: Optional parent folder ID
) {
  const res = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    // Include all new fields in the request body
    body: JSON.stringify({ 
      title, 
      content, 
      tags,
      type,
      parentId 
    })
  });
  return res.json();
}

export async function updateNote(
  token: string, 
  id: string, 
  title: string, 
  content: string, 
  tags?: string[], // Already present
  type?: 'file' | 'folder', // <-- NEW: Item type
  parentId?: string | null // <-- NEW: Parent folder ID
) {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    // The request body now includes 'tags', 'type', and 'parentId'
    body: JSON.stringify({ 
      title, 
      content, 
      tags, 
      type, // Pass item type (e.g., 'file' or 'folder')
      parentId // Pass parent folder ID
    })
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
