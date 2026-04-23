import axios from 'axios';

const axiosPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});
// NO request interceptors, NO auth headers, NO response interceptors
export default axiosPublic;
