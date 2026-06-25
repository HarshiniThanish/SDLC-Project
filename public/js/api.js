// CareSync Client-Side API Service Wrapper

const API_BASE_URL = '/api';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('caresync_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
};

const CareSyncAPI = {
  // Auth Services
  auth: {
    login: async (email, password) => {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token) {
        localStorage.setItem('caresync_token', data.token);
      }
      return data;
    },
    register: async (payload) => {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (data.token) {
        localStorage.setItem('caresync_token', data.token);
      }
      return data;
    },
    getMe: async () => {
      return await apiRequest('/auth/me');
    },
    logout: () => {
      localStorage.removeItem('caresync_token');
    }
  },

  // Patient Services
  patients: {
    getAll: async () => {
      return await apiRequest('/patients');
    },
    getById: async (id) => {
      return await apiRequest(`/patients/${id}`);
    },
    update: async (id, payload) => {
      return await apiRequest(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    }
  },

  // Doctor Services
  doctors: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.specialization) params.append('specialization', filters.specialization);
      if (filters.search) params.append('search', filters.search);
      
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return await apiRequest(`/doctors${queryStr}`);
    },
    getById: async (id) => {
      return await apiRequest(`/doctors/${id}`);
    },
    updateSlots: async (id, slots) => {
      return await apiRequest(`/doctors/${id}/slots`, {
        method: 'PUT',
        body: JSON.stringify({ availableSlots: slots })
      });
    }
  },

  // Appointment Services
  appointments: {
    getAll: async () => {
      return await apiRequest('/appointments');
    },
    getById: async (id) => {
      return await apiRequest(`/appointments/${id}`);
    },
    create: async (payload) => {
      return await apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    reschedule: async (id, date, time) => {
      return await apiRequest(`/appointments/${id}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({ appointmentDate: date, appointmentTime: time })
      });
    },
    updateStatus: async (id, status, notes = '') => {
      return await apiRequest(`/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes })
      });
    }
  },

  // Medical Record Services
  medicalRecords: {
    getAll: async (patientId = '') => {
      const query = patientId ? `?patientId=${patientId}` : '';
      return await apiRequest(`/medical-records${query}`);
    },
    create: async (payload) => {
      return await apiRequest('/medical-records', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
  },

  // Admin Services
  admin: {
    getStats: async () => {
      return await apiRequest('/admin/dashboard-stats');
    }
  }
};
