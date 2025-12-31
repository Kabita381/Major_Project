
// src/api/designationApi.js
import api from "./axios";

const BASE_URL = "/designations";

export const getDesignations = () => api.get(BASE_URL);
export const createDesignation = (data) => api.post(BASE_URL, data);
export const updateDesignation = (id, data) => api.put(`${BASE_URL}/${id}`, data);
export const deleteDesignation = (id) => api.delete(`${BASE_URL}/${id}`);
