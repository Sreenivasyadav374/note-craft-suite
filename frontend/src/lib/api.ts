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
  try {
    const res = await fetchWithTimeout(`${API_URL}/notes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      const error = await res.json().catch(() => ({ message: 'Failed to fetch notes' }));
      throw new Error(error.message || 'Failed to fetch notes');
    }
    
    return res.json();
  } catch (error: any) {
    throw new Error(error.message || 'Unable to connect to server. Please try again later.');
  }
}

export async function createNote(
  token: string, 
  title: string, 
  content: string, 
  tags: string[] = [], // <-- New: Tags array
  type: 'file' | 'folder' = 'file', // <-- New: Type with default 'file'
  parentId: string | null = null // <-- New: Optional parent folder ID
) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/notes`, {
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
    
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      const error = await res.json().catch(() => ({ message: `Failed to create ${type}` }));
      throw new Error(error.message || `Failed to create ${type}`);
    }
    
    return res.json();
  } catch (error: any) {
    throw new Error(error.message || 'Unable to connect to server. Please try again later.');
  }
}

export async function updateNote(
  token: string,
  id: string,
  title: string,
  content: string,
  tags?: string[],
  type?: 'file' | 'folder',
  parentId?: string | null,
  reminderDate?: string | null
) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        content,
        tags,
        type,
        parentId,
        reminderDate
      })
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      if (res.status === 404) {
        throw new Error('Item not found. It may have been deleted.');
      }
      const error = await res.json().catch(() => ({ message: 'Failed to update item' }));
      throw new Error(error.message || 'Failed to update item');
    }

    return res.json();
  } catch (error: any) {
    throw new Error(error.message || 'Unable to connect to server. Please try again later.');
  }
}

export async function deleteNote(token: string, id: string) {
  try {
    const res = await fetchWithTimeout(`${API_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      if (res.status === 404) {
        throw new Error('Item not found. It may have been deleted.');
      }
      const error = await res.json().catch(() => ({ message: 'Failed to delete item' }));
      throw new Error(error.message || 'Failed to delete item');
    }
    
    return res.status === 204;
  } catch (error: any) {
    throw new Error(error.message || 'Unable to connect to server. Please try again later.');
  }
}
