import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use(
  (config) => {
    const sessionData = localStorage.getItem("user_session");

    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);

        const token = session?.token || session?.jwt;
        if (token && token !== "undefined" && token !== "null") {
          config.headers.Authorization = `Bearer ${token.trim()}`;
        } else {
          delete config.headers.Authorization;
        }
      } catch (err) {
        console.error("Axios interceptor parse error", err);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      if (window.location.pathname !== "/") {
        localStorage.removeItem("user_session");
        window.location.href = "/?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
