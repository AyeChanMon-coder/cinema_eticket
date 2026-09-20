import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const isAdminRequest = config.url?.startsWith("/admin") || window.location.pathname.startsWith("/admin");
    const token = isAdminRequest
      ? localStorage.getItem("admin_token")
      : localStorage.getItem("user_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
