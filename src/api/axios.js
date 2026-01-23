import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api", 
  headers: {
    "Content-Type": "application/json",
  },
});

/* REQUEST INTERCEPTOR */
api.interceptors.request.use(
  (config) => {
    const sessionData = localStorage.getItem("user_session");
    
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);

        // Ensure token exists and is a valid string before attaching
        if (session && session.token && session.token !== "undefined" && session.token !== "null") {
          const cleanToken = session.token.trim();
          config.headers.Authorization = `Bearer ${cleanToken}`;
        } else {
          delete config.headers.Authorization;
        }
      } catch (error) {
        console.error("Axios Interceptor: Session parse error", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* RESPONSE INTERCEPTOR */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handling global auth failures (401 Unauthorized or 403 Forbidden)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Auth failure detected. Status:", error.response.status);
      
      // Only clear and redirect if we aren't already on the login page
      if (window.location.pathname !== '/') {
        localStorage.removeItem("user_session");
        window.location.href = "/?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;