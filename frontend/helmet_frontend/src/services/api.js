const API_URL = 'http://localhost:5000';

// Helper for API calls
const apiCall = async (endpoint, options = {}) => {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
  });

  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Something went wrong');
  }

  return response.json();
};