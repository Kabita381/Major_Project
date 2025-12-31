// src/api/departmentApi.js
import api from "./axios";


const BASE_URL = "/departments";

export const getDepartments = () => api.get(BASE_URL);
export const createDepartment = (data) => api.post(BASE_URL, data);
export const updateDepartment = (id, data) => api.put(`${BASE_URL}/${id}`, data);
export const deleteDepartment = (id) => api.delete(`${BASE_URL}/${id}`);
