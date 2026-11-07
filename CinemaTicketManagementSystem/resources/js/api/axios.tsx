import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const requestPath = config.url ? new URL(config.url, window.location.origin).pathname : "";
    const isAdminRequest = requestPath.startsWith("/admin") || window.location.pathname.startsWith("/admin");
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
