const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
      if (errJson.message) errorMsg += `: ${errJson.message}`;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Dashboard
  getDashboard: (userId = 'usr_alex') => request<any>(`/api/dashboard?userId=${userId}`),

  // Groups
  getGroups: () => request<any[]>('/api/groups'),
  getGroup: (id: string) => request<any>(`/api/groups/${id}`),
  createGroup: (data: any) => request<any>('/api/groups', { method: 'POST', body: JSON.stringify(data) }),
  updateGroup: (id: string, data: any) => request<any>(`/api/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteGroup: (id: string) => request<any>(`/api/groups/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: (params: { groupId?: string; category?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.groupId) q.append('groupId', params.groupId);
    if (params.category) q.append('category', params.category);
    if (params.search) q.append('search', params.search);
    return request<any[]>(`/api/expenses?${q.toString()}`);
  },
  getExpense: (id: string) => request<any>(`/api/expenses/${id}`),
  createExpense: (data: any) => request<any>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id: string, data: any) => request<any>(`/api/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteExpense: (id: string) => request<any>(`/api/expenses/${id}`, { method: 'DELETE' }),

  // Balances
  getBalances: (groupId?: string) => {
    const q = groupId ? `?groupId=${groupId}` : '';
    return request<any>(`/api/balances${q}`);
  },

  // Settlements
  getSettlements: () => request<any[]>('/api/settlements'),
  createSettlement: (data: any) => request<any>('/api/settlements', { method: 'POST', body: JSON.stringify(data) }),

  // Insights
  getInsights: () => request<any>('/api/insights'),

  // Users
  getUsers: () => request<any[]>('/api/users'),

  // Seed & Reset
  seedData: (force = true) => request<any>('/api/seed', { method: 'POST', body: JSON.stringify({ force }) }),
  resetData: () => request<any>('/api/reset', { method: 'POST' }),

  // Health
  getHealth: () => request<any>('/api/health')
};
