import api from "./axios";

const leaveApi = {
    /**
     * Admin: Fetch all leave requests for all employees
     */
    getAllLeaves: () => api.get("/employee-leaves"),

    /**
     * Employee: Fetch leave history for the logged-in user
     * Note: The backend should filter this based on the JWT token
     */
    getEmployeeLeaves: () => api.get("/employee-leaves"),

    /** * Employee: Submit a new leave application*/
    requestLeave: (payload) => api.post("/employee-leaves", payload),

    /**
     * Admin: Update the status of a request (Approve/Reject)
     * @param {number} id - The unique Leave ID
     * @param {object} statusData - { status, adminId, rejectionReason }
     */
    updateLeaveStatus: (id, statusData) => {
        // Correctly routes to the @PatchMapping("/{id}/status") in your controller
        return api.patch(`/employee-leaves/${id}/status`, statusData);
    }
};

export default leaveApi;