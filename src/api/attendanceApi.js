import api from "./axios";

const BASE_URL = "/attendance";

export const getAttendanceByEmployee = (empId) => {
  if (!empId) return Promise.reject("Employee ID is required");
  return api.get(`${BASE_URL}/employee/${empId}`);
};

export const checkIn = (payload) => {
  return api.post(BASE_URL, payload);
};

export const checkOut = (attendanceId) => {
  if (!attendanceId) return Promise.reject("Attendance ID is required");
  return api.put(`${BASE_URL}/checkout/${attendanceId}`);
};

export default {
  getAttendanceByEmployee,
  checkIn,
  checkOut,
};
