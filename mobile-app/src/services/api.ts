/**
 * API Client for ViralitYT Mobile App
 * Adaptado desde el cliente web
 */

const API_BASE = __DEV__ 
  ? 'http://localhost:8000' 
  : 'https://viralityt-backend-production.up.railway.app';

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

export interface APIProject {
  id: string;
  project_name: string;
  daily_quota: number;
  quota_used_today: number;
}

export interface Account {
  id: string;
  display_name: string;
  channel_id?: string;
  theme_slug: string;
  active: boolean;
}

export interface Upload {
  id: string;
  account_id: string;
  status: 'scheduled' | 'uploading' | 'done' | 'failed' | 'retry' | 'paused';
  scheduled_for: string;
  title: string;
  youtube_video_id?: string;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
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
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.request<DashboardMetrics>('/dashboard/metrics');
  }

  async listAccounts(): Promise<{ accounts: Account[] }> {
    return this.request<{ accounts: Account[] }>('/accounts');
  }

  async listUploads(accountId?: string, status?: string, limit = 100): Promise<{ uploads: Upload[]; count: number }> {
    const params = new URLSearchParams();
    if (accountId) params.set('account_id', accountId);
    if (status) params.set('status', status);
    params.set('limit', limit.toString());

    return this.request<{ uploads: Upload[]; count: number }>(`/uploads?${params.toString()}`);
  }

  async updateAccountStatus(accountId: string, active: boolean): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/accounts/${accountId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  }
}

export const api = new APIClient(API_BASE);

