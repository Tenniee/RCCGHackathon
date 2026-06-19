import axios from "axios";
 
const BASE_URL = import.meta.env.VITE_API_URL || "https://rccghackathon.onrender.com";
 
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});
 
// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rccg_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
 
// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("rccg_token");
      localStorage.removeItem("rccg_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
 
export default api;