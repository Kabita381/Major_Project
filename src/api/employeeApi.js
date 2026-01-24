import api from "./axios";

const BASE_URL = "/employees";

// NEW CONCEPT: Fetch profile by User ID (attached to token session)
export const getProfileByUserId = async (userId) => {
  if (!userId) return Promise.reject("User ID is missing");
  
  // Explicitly parse to Number to ensure the URL is /user/14 and not /user/undefined
  const cleanId = Number(userId);
  
  return api.get(`/employees/user/${cleanId}`);
};

export const getEmployees = (id) => {
  if (id && typeof id !== 'object' && (typeof id === 'string' || typeof id === 'number')) {
    return api.get(`${BASE_URL}/${id}`);
  }
  return api.get(BASE_URL);
};

export const getDashboardStats = (id) => {
  if (!id) return Promise.reject("ID is required");
  return api.get(`/employee/dashboard/stats/${id}`); 
};

export const getEmployeeByEmail = (email) => {
  if (!email) return Promise.reject("Email is required");
  return api.get(`${BASE_URL}/email/${encodeURIComponent(email)}`);
};

export const createEmployee = (employee) => api.post(BASE_URL, employee);
export const updateEmployee = (id, employee) => api.put(`${BASE_URL}/${id}`, employee);
export const deleteEmployee = (id) => api.delete(`${BASE_URL}/${id}`);
export const getActiveEmployeeStats = () => api.get(`${BASE_URL}/stats/active-per-month`);
export const getEmployeeById = (id) => api.get(`${BASE_URL}/${id}`);

export default {
    getProfileByUserId,
    getEmployees,
    getEmployeeByEmail,
    getDashboardStats,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getActiveEmployeeStats,
    getEmployeeById
};