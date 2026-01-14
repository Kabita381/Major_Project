import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================================================
   1. REQUEST INTERCEPTOR (Attaches Token)
   ============================================================ */
api.interceptors.request.use(
  (config) => {
    const sessionData = localStorage.getItem("user_session");
    
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        
        // Ensure token exists, isn't null, and isn't the string "undefined"
        if (session && session.token && session.token !== "undefined" && session.token !== "null") {
          config.headers.Authorization = `Bearer ${session.token}`;
        } else {
          delete config.headers.Authorization;
        }
      } catch (error) {
        console.error("Axios Interceptor: JSON parsing error", error);
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================================================
   2. RESPONSE INTERCEPTOR (Handles 403/401 Errors)
   ============================================================ */
api.interceptors.response.use(
  (response) => {
    // Return the response directly if successful
    return response;
  },
  (error) => {
    // If backend returns 401 (Unauthorized) or 403 (Forbidden)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Authentication failed or session expired. Redirecting...");
      
      // Clear the invalid session so the user can log in again fresh
      localStorage.removeItem("user_session");
      
      // Redirect to login page and add an 'expired' flag for the UI
      if (window.location.pathname !== '/') {
        window.location.href = "/?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;