const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('rcz_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: any) =>
    request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),
  getUsers: () => request<any[]>('/auth'),
};

// Donors
export const donorAPI = {
  getAll: (params?: string) => request<any[]>(`/donors${params ? `?${params}` : ''}`),
  getOne: (id: string) => request<any>(`/donors/${id}`),
  create: (data: any) => request<any>('/donors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/donors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/donors/${id}`, { method: 'DELETE' }),
  addCommunication: (id: string, data: any) =>
    request<any>(`/donors/${id}/communications`, { method: 'POST', body: JSON.stringify(data) }),
};

// Grants
export const grantAPI = {
  getAll: (params?: string) => request<any[]>(`/grants${params ? `?${params}` : ''}`),
  getOne: (id: string) => request<any>(`/grants/${id}`),
  create: (data: any) => request<any>('/grants', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/grants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/grants/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id: string) => request<any>(`/grants/${id}`, { method: 'DELETE' }),
};

// Transactions
export const transactionAPI = {
  getAll: (params?: string) => request<any[]>(`/transactions${params ? `?${params}` : ''}`),
  getStats: () => request<any>('/transactions/stats/summary'),
  create: (data: any) => request<any>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id: string, data: any) =>
    request<any>(`/transactions/${id}/approve`, { method: 'PATCH', body: JSON.stringify(data) }),
  flag: (id: string, data: any) =>
    request<any>(`/transactions/${id}/flag`, { method: 'PATCH', body: JSON.stringify(data) }),
  reconcile: (id: string, reconciledBy: string) =>
    request<any>(`/transactions/${id}/reconcile`, { method: 'PATCH', body: JSON.stringify({ reconciledBy }) }),
  delete: (id: string) => request<any>(`/transactions/${id}`, { method: 'DELETE' }),
};

// Audit
export const auditAPI = {
  getAll: (params?: string) => request<any[]>(`/audit${params ? `?${params}` : ''}`),
  getStats: () => request<any>('/audit/stats'),
};

// Reports / Dashboard
export const reportAPI = {
  getDashboard: () => request<any>('/reports/dashboard'),
};
