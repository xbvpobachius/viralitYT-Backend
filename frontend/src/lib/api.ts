/**
 * API Client para ViralitYT Backend
 * Conecta con FastAPI backend
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export interface APIProject {
  id: string;
  project_name: string;
  daily_quota: number;
  quota_used_today: number;
  quota_reset_at: string;
  created_at: string;
}

export interface Account {
  id: string;
  display_name: string;
  channel_id?: string;
  theme_slug: string;
  active: boolean;
  api_project_id: string;
  upload_time_1: string;
  upload_time_2: string;
  created_at: string;
}

export interface Upload {
  id: string;
  account_id: string;
  video_id: string;
  status: 'scheduled' | 'uploading' | 'done' | 'failed' | 'retry' | 'paused';
  scheduled_for: string;
  run_id?: string;
  youtube_video_id?: string;
  title: string;
  description: string;
  tags: string[];
  retry_count: number;
  error?: string;
  created_at: string;
  updated_at: string;
  video_title?: string;
  source_video_id?: string;
  account_name?: string;
}

export interface DashboardMetrics {
  uploads_today: number;
  uploads_done: number;
  uploads_failed: number;
  uploads_scheduled: number;
  active_accounts: number;
  total_accounts: number;
  quota: {
    total_quota: number;
    total_used: number;
    total_remaining: number;
    projects_available: number;
    uploads_remaining: number;
    projects: APIProject[];
  };
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.request<DashboardMetrics>('/dashboard/metrics');
  }

  // Accounts
  async listAccounts(): Promise<{ accounts: Account[] }> {
    return this.request<{ accounts: Account[] }>('/accounts');
  }

  async getAccount(accountId: string): Promise<Account> {
    return this.request<Account>(`/accounts/${accountId}`);
  }

  async updateAccountStatus(accountId: string, active: boolean): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/accounts/${accountId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  }

  // Uploads
  async listUploads(accountId?: string, status?: string, limit = 100): Promise<{ uploads: Upload[]; count: number }> {
    const params = new URLSearchParams();
    if (accountId) params.set('account_id', accountId);
    if (status) params.set('status', status);
    params.set('limit', limit.toString());

    return this.request<{ uploads: Upload[]; count: number }>(`/uploads?${params.toString()}`);
  }

  async updateUpload(uploadId: string, data: Partial<{
    scheduled_for: string;
    title: string;
    description: string;
    tags: string[];
    status: string;
  }>): Promise<Upload> {
    return this.request<Upload>(`/uploads/${uploadId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUpload(uploadId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/uploads/${uploadId}`, {
      method: 'DELETE',
    });
  }

  // OAuth
  async startOAuth(data: {
    project_id: string;
    account_name: string;
    theme_slug: string;
  }): Promise<{ authorization_url: string; state: string }> {
    return this.request<{ authorization_url: string; state: string }>('/auth/youtube/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // API Projects (para onboarding)
  async listAPIProjects(): Promise<{ projects: APIProject[] }> {
    return this.request<{ projects: APIProject[] }>('/api-projects');
  }

  async createAPIProject(data: {
    project_name: string;
    client_id: string;
    client_secret: string;
    daily_quota?: number;
  }): Promise<APIProject> {
    return this.request<APIProject>('/api-projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Quota
  async getQuotaStatus(): Promise<DashboardMetrics['quota']> {
    return this.request<DashboardMetrics['quota']>('/quota/status');
  }
}

export const api = new APIClient(API_BASE);

