const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * API Service for road damage reporting system
 */
class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get auth headers with JWT token
   */
  getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Generic fetch wrapper
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...options.headers,
        ...this.getAuthHeaders(),
      },
    };

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'İstek başarısız oldu');
    }

    return data;
  }

  // ==================== Public Endpoints ====================

  /**
   * Submit a new damage report
   */
  async submitReport(formData) {
    return this.request('/reports', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Get report status by ID
   * Returns { notFound: true } if report was deleted (no damage detected)
   */
  async getReportStatus(reportId) {
    try {
      const url = `${this.baseUrl}/reports/${reportId}/status`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });
      
      if (response.status === 404) {
        return { notFound: true };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('getReportStatus error:', error);
      throw error;
    }
  }

  /**
   * Get map markers for public view
   */
  async getMapMarkers(bounds = null) {
    let endpoint = '/reports/map/markers';
    if (bounds) {
      const params = new URLSearchParams({
        minLat: bounds.minLat,
        maxLat: bounds.maxLat,
        minLng: bounds.minLng,
        maxLng: bounds.maxLng,
      });
      endpoint += `?${params}`;
    }
    return this.request(endpoint);
  }

  // ==================== Auth Endpoints ====================

  /**
   * Admin login
   */
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    return this.request('/auth/me');
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // ==================== Admin Endpoints ====================

  /**
   * Get all reports (admin)
   */
  async getAdminReports(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.damageType) params.append('damageType', filters.damageType);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const query = params.toString();
    return this.request(`/admin/reports${query ? `?${query}` : ''}`);
  }

  /**
   * Get grouped reports by location (admin)
   */
  async getGroupedReports(filters = {}, radius = 2) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.damageType) params.append('damageType', filters.damageType);
    params.append('radius', radius);

    const query = params.toString();
    return this.request(`/admin/reports-grouped${query ? `?${query}` : ''}`);
  }

  /**
   * Get single report (admin)
   */
  async getAdminReport(reportId) {
    return this.request(`/admin/reports/${reportId}`);
  }

  /**
   * Update report status (admin)
   */
  async updateReportStatus(reportId, status, notes = null) {
    return this.request(`/admin/reports/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  /**
   * Mark report as repaired (admin)
   */
  async markAsRepaired(reportId, notes = null) {
    return this.request(`/admin/reports/${reportId}/repair`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  /**
   * Get dashboard statistics (admin)
   */
  async getStatistics() {
    return this.request('/admin/statistics');
  }

  /**
   * Get admin map data
   */
  async getAdminMapData(bounds = null) {
    let endpoint = '/admin/map';
    if (bounds) {
      const params = new URLSearchParams({
        minLat: bounds.minLat,
        maxLat: bounds.maxLat,
        minLng: bounds.minLng,
        maxLng: bounds.maxLng,
      });
      endpoint += `?${params}`;
    }
    return this.request(endpoint);
  }
}

const api = new ApiService();
export default api;
