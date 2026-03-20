const API_BASE_URL = 'http://localhost:5000/api';

async function fetchWithAuth(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) => fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    register: (userData) => fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    logout: () => fetchWithAuth('/auth/logout', { method: 'POST' }),
    check: () => fetchWithAuth('/auth/check'),
    me: () => fetchWithAuth('/auth/me'),
    updateProfile: (profileData) => fetchWithAuth('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  },

  admin: {
    getDashboardStats: () => fetchWithAuth('/admin/dashboard-stats'),
    getZones: () => fetchWithAuth('/admin/zones'),
    createZone: (zoneData) => fetchWithAuth('/admin/zones', {
      method: 'POST',
      body: JSON.stringify(zoneData),
    }),
    updateZone: (zoneId, zoneData) => fetchWithAuth(`/admin/zones/${zoneId}`, {
      method: 'PUT',
      body: JSON.stringify(zoneData),
    }),
    deleteZone: (zoneId) => fetchWithAuth(`/admin/zones/${zoneId}`, {
      method: 'DELETE',
    }),
    addCamera: (zoneId, cameraData) => fetchWithAuth(`/admin/zones/${zoneId}/cameras`, {
      method: 'POST',
      body: JSON.stringify(cameraData),
    }),
    getSupervisors: () => fetchWithAuth('/admin/supervisors'),
    createSupervisor: (supervisorData) => fetchWithAuth('/admin/supervisors', {
      method: 'POST',
      body: JSON.stringify(supervisorData),
    }),
    updateSupervisor: (supervisorId, supervisorData) => fetchWithAuth(`/admin/supervisors/${supervisorId}`, {
      method: 'PUT',
      body: JSON.stringify(supervisorData),
    }),
    deleteSupervisor: (supervisorId) => fetchWithAuth(`/admin/supervisors/${supervisorId}`, {
      method: 'DELETE',
    }),
    assignSupervisor: (zoneId, supervisorId) => fetchWithAuth(`/admin/zones/${zoneId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ supervisor_id: supervisorId }),
    }),
    getViolations: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return fetchWithAuth(`/admin/violations?${params}`);
    },
    getRecentViolations: (limit = 5) => fetchWithAuth(`/admin/violations/recent?limit=${limit}`),
  },

  supervisor: {
    getDashboard: () => fetchWithAuth('/supervisor/dashboard'),
    getZones: () => fetchWithAuth('/supervisor/zones'),
    getZoneStats: (zoneId) => fetchWithAuth(`/supervisor/zones/${zoneId}/stats`),
    getDetections: () => fetchWithAuth('/supervisor/detections'),
    getRecentDetections: (limit = 10) => fetchWithAuth(`/supervisor/detections/recent?limit=${limit}`),
  },

  detection: {
    upload: (formData) => fetchWithAuth('/detection/upload', {
      method: 'POST',
      body: formData,
    }),
    getStats: () => fetchWithAuth('/detection/stats'),
    getEvents: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return fetchWithAuth(`/detection/events?${params}`);
    },
    getEventsByZone: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return fetchWithAuth(`/detection/events/by-zone?${params}`);
    },
    getViolations: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return fetchWithAuth(`/detection/violations?${params}`);
    },
    getRecentViolations: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return fetchWithAuth(`/detection/recent-violations?${params}`);
    },
    getImageUrl: (filename) => `${API_BASE_URL}/detection/image/${filename}`,
    getVideoUrl: (filename) => `${API_BASE_URL}/detection/video/${filename}`,
  },

  dailySummary: {
    getDayWiseViolations: (zoneId, startDate, endDate) => {
      let url = `/daily-summary/day-wise?zone_id=${zoneId}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      return fetchWithAuth(url);
    },
    getAllZonesDayWise: (date) => {
      let url = '/daily-summary/day-wise/all-zones';
      if (date) url += `?date=${date}`;
      return fetchWithAuth(url);
    },
    getWeeklyViolations: (zoneId) => fetchWithAuth(`/daily-summary/weekly?zone_id=${zoneId}`),
    getTodayViolations: (zoneId) => fetchWithAuth(`/daily-summary/today?zone_id=${zoneId}`),
  },
};