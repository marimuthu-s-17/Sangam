import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        console.warn('Unauthorized - redirecting to login');
      }
      return Promise.reject({
        status,
        message: data?.detail || 'An error occurred',
      });
    }
    return Promise.reject({
      status: 0,
      message: 'Network error - please check your connection',
    });
  }
);

// Request deduplication for simultaneous GET requests
const originalRequest = api.request.bind(api);
const inFlightRequests = new Map();

api.request = function (config) {
  const conf = typeof config === 'string' ? { url: config } : { ...config };
  const method = (conf.method || 'get').toLowerCase();

  if (method === 'get') {
    const url = conf.url || '';
    const params = conf.params ? JSON.stringify(conf.params) : '';
    const key = `${url}::${params}`;

    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key);
    }

    const promise = originalRequest(conf).finally(() => {
      inFlightRequests.delete(key);
    });

    inFlightRequests.set(key, promise);
    return promise;
  }

  return originalRequest(conf);
};

export default api;
