import axios from 'axios';

// Public axios instance — no auth interceptor, no token injection
const axiosPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  headers: { 'Content-Type': 'application/json' },
});

export default axiosPublic;
