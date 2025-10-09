// frontend/src/services/files.ts

const API_BASE_URL =
  (import.meta as any)?.env?.VITE_API_BASE_URL ||
  "https://clouddrivebackend.onrender.com/api";

function getBase() {
  const raw = API_BASE_URL;
  return raw.trim().replace(/\/$/, '');
}

function authHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export type BackendFile = {
  id: string;
  user_id: string;
  name: string;
  original_name?: string;
  size: number; // bytes
  type: string; // mime type
  mime_type?: string;
  extension?: string | null;
  path: string;
  is_deleted?: boolean;
  is_folder?: boolean;
  is_starred?: boolean;
  parent_id?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export async function listFiles(opts?: {
  deleted?: boolean;
  parentId?: string | null;
  starred?: boolean;
  recent?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "size" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
}): Promise<BackendFile[]> {
  const params = new URLSearchParams();
  if (typeof opts?.deleted === 'boolean') params.set('deleted', String(opts.deleted));
  if (typeof opts?.starred === 'boolean') params.set('starred', String(opts.starred));
  if (typeof opts?.recent === 'boolean') params.set('recent', String(opts.recent));
  if (typeof opts?.parentId !== 'undefined') params.set('parentId', (opts.parentId === null ? 'root' : String(opts.parentId)));
  if (typeof opts?.page === 'number') params.set('page', String(opts.page));
  if (typeof opts?.limit === 'number') params.set('limit', String(opts.limit));
  if (opts?.search && opts.search.trim().length > 0) params.set('search', opts.search.trim());
  if (opts?.sortBy) params.set('sortBy', opts.sortBy);
  if (opts?.sortOrder) params.set('sortOrder', opts.sortOrder);
  const url = `${getBase()}/files${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() ? { ...authHeaders()! } : {} });
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return json.files as BackendFile[];
}

export async function uploadFile(file: File, parentId?: string | null): Promise<BackendFile> {
  const url = `${getBase()}/files/upload`;
  const fd = new FormData();
  fd.append('file', file);
  if (parentId !== undefined) {
    fd.append('parentId', parentId === null ? '' : parentId);
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders() ? { ...authHeaders()! } : {}, // do NOT set Content-Type for FormData
    body: fd,
  });
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return json.file as BackendFile;
}

export async function createFolder(name: string, parentId?: string | null): Promise<BackendFile> {
  const url = `${getBase()}/files/folders`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authHeaders() || {}) },
    body: JSON.stringify({ name, parentId: parentId ?? null }),
  });
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return json.folder as BackendFile;
}

export async function updateFile(id: string, payload: { name?: string; parentId?: string | null; starred?: boolean }): Promise<BackendFile> {
  const url = `${getBase()}/files/${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(authHeaders() || {}) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return json.file as BackendFile;
}

export async function softDeleteFile(id: string): Promise<void> {
  const url = `${getBase()}/files/${id}`;
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders() ? { ...authHeaders()! } : {} });
  if (!res.ok) throw new Error(await safeError(res));
}

export async function restoreFile(id: string): Promise<void> {
  const url = `${getBase()}/files/${id}/restore`;
  const res = await fetch(url, { method: 'POST', headers: authHeaders() ? { ...authHeaders()! } : {} });
  if (!res.ok) throw new Error(await safeError(res));
}

export async function permanentDeleteFile(id: string): Promise<void> {
  const url = `${getBase()}/files/${id}/permanent`;
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders() ? { ...authHeaders()! } : {} });
  if (!res.ok) throw new Error(await safeError(res));
}

export async function getDownloadUrl(id: string): Promise<string> {
  const url = `${getBase()}/files/${id}/download`;
  const res = await fetch(url, { headers: authHeaders() ? { ...authHeaders()! } : {} });
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return json.downloadUrl as string;
}

// Sharing services
export type ShareRecord = {
  id: string;
  permissions: 'view' | 'edit' | 'admin';
  share_type?: string;
  expires_at?: string | null;
  created_at: string;
  files?: BackendFile;
  file_id?: string;
  shared_with_email?: string;
  profiles?: {
    email: string;
  };
};

export async function listSharedWithMe(opts?: { page?: number; limit?: number; search?: string; }): Promise<{shares: ShareRecord[]; total: number; page: number; limit: number;}> {
  const params = new URLSearchParams();
  if (typeof opts?.page === 'number') params.set('page', String(opts.page));
  if (typeof opts?.limit === 'number') params.set('limit', String(opts.limit));
  if (opts?.search && opts.search.trim().length > 0) params.set('search', opts.search.trim());
  const url = `${getBase()}/shares/shared-with-me${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() ? { ...authHeaders()! } : {} });
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return { shares: json.shares as ShareRecord[], total: json.total ?? (json.shares?.length ?? 0), page: json.page ?? 1, limit: json.limit ?? 20 };
}

export async function shareFile(fileId: string, email: string, permissions: 'view' | 'edit' | 'admin' = 'view'): Promise<void> {
  const url = `${getBase()}/shares/${fileId}/share`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ email, permissions }),
  });
  if (!res.ok) throw new Error(await safeError(res));
}

export async function listSharedByMe(opts?: { page?: number; limit?: number; search?: string; }): Promise<{shares: ShareRecord[]; total: number; page: number; limit: number;}> {
  const params = new URLSearchParams();
  if (typeof opts?.page === 'number') params.set('page', String(opts.page));
  if (typeof opts?.limit === 'number') params.set('limit', String(opts.limit));
  if (opts?.search && opts.search.trim().length > 0) params.set('search', opts.search.trim());
  const url = `${getBase()}/shares/shared-by-me${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() ? { ...authHeaders()! } : {} });
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return { shares: json.shares as ShareRecord[], total: json.total ?? (json.shares?.length ?? 0), page: json.page ?? 1, limit: json.limit ?? 20 };
}

// Users services
export async function getQuota(): Promise<{ plan: string; storage_used: number; storage_limit: number; file_count: number; file_count_limit: number; }> {
  const url = `${getBase()}/users/quota`;
  const res = await fetch(url, { headers: authHeaders() ? { ...authHeaders()! } : {} });
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return json.quota;
}

// Versioning services
export async function createVersion(fileId: string, file: File): Promise<any> {
  const url = `${getBase()}/files/${fileId}/versions`;
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: fd,
  });
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return json.version;
}

export async function listVersions(fileId: string): Promise<any[]> {
  const url = `${getBase()}/files/${fileId}/versions`;
  const res = await fetch(url, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return json.versions;
}

export async function restoreVersion(fileId: string, versionNumber: number): Promise<void> {
  const url = `${getBase()}/files/${fileId}/versions/${versionNumber}/restore`;
  const res = await fetch(url, { method: 'POST', headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(await safeError(res));
}

// Public link sharing
export async function createPublicLink(fileId: string, expiresAt?: string): Promise<{token: string}> {
  const url = `${getBase()}/shares/${fileId}/public`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ expiresAt }),
  });
  if (!res.ok) throw new Error(await safeError(res));
  const json = await res.json();
  return { token: json.token };
}

export async function revokePublicLink(token: string): Promise<void> {
  const url = `${getBase()}/shares/public/${token}`;
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders() ? { ...authHeaders()! } : {} });
  if (!res.ok) throw new Error(await safeError(res));
}

async function safeError(res: Response) {
  try {
    const data = await res.json();
    return data?.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}