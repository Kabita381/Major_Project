import React, { useState, useEffect } from "react";
import api from "../../api/axios"; 
import leaveApi from "../../api/leaveApi"; 
import "./Leave.css";

const LeaveAdmin = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({}); 
  const [loading, setLoading] = useState(true);
  
  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const fetchLeaves = async () => {
    try {
      const res = await api.get("/employee-leaves");
      const leaves = Array.isArray(res.data) ? res.data : [];
      // Sort by newest first
      const sortedLeaves = leaves.sort((a, b) => b.leaveId - a.leaveId);
      setLeaveRequests(sortedLeaves);

      const uniqueEmpIds = [...new Set(leaves.map(l => l.employee?.empId).filter(id => id))];
      fetchAttendanceStats(uniqueEmpIds);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async (empIds) => {
    const statsMap = {};
    await Promise.all(empIds.map(async (id) => {
      try {
        const res = await api.get(`/attendance/employee/${id}`);
        const workingDays = res.data.filter(a => a.status === "PRESENT").length;
        statsMap[id] = workingDays;
      } catch (e) {
        statsMap[id] = 0;
      }
    }));
    setAttendanceStats(statsMap);
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleLeaveAction = (leaveId, action) => {
    if (action === "Rejected") {
      setSelectedLeaveId(leaveId);
      setShowRejectModal(true);
    } else {
      submitStatusUpdate(leaveId, "Approved", "");
    }
  };
const submitStatusUpdate = async (leaveId, action, reason) => {
    const sessionData = localStorage.getItem("user_session");
    const userSession = sessionData ? JSON.parse(sessionData) : null;
    
    // ✅ FIX: Explicitly target empId. 
    // The error "Admin User not found with ID: 20" means '20' is the userId, 
    // but the backend needs the associated empId (likely '1' or similar).
    const adminId = userSession?.empId;

    if (!adminId) {
        alert("Session error: Employee Profile ID not found. Please log out and log in again.");
        return;
    }

    try {
        const payload = {
            status: action,
            adminId: adminId, // This must be the ID from the Employee table
            rejectionReason: reason
        };

        await leaveApi.updateLeaveStatus(leaveId, payload);
        
        alert(`Leave ${action} successfully.`);
        setShowRejectModal(false);
        setRejectionReason("");
        fetchLeaves(); 
    } catch (err) {
        console.error("Submission error:", err);
        // This will display the exact error message from your backend ResponseEntity
        alert("Submission Failed: " + (err.response?.data?.message || "Internal Server Error"));
    }
};

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = leaveRequests.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(leaveRequests.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div className="leave-container">Loading records...</div>;

  return (
    <div className="leave-container">
      <div className="leave-header-section">
        <h2 className="leave-header">Admin: Leave & Performance Overview</h2>
        <div className="record-count">Total Requests: {leaveRequests.length}</div>
      </div>

      <div className="leave-table-wrapper">
        <table className="leave-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Total Working Days</th>
              <th>Leave Days</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((leave) => (
                <tr key={leave.leaveId}>
                  <td>
                    <div className="emp-info">
                      <strong>{leave.employee?.firstName} {leave.employee?.lastName}</strong>
                      <span className="emp-id-sub">ID: {leave.employee?.empId}</span>
                    </div>
                  </td>
                  <td>{leave.leaveType?.typeName}</td>
                  <td className="stat-cell">{attendanceStats[leave.employee?.empId] || 0} Days</td>
                  <td className="stat-cell">{leave.totalDays || 0} Days</td>
                  <td>
                    <span className={`status-badge ${leave.status?.toLowerCase()}`}>
                      {leave.status}
                    </span>
                    {leave.status === "Rejected" && leave.rejectionReason && (
                       <div className="reason-text">Reason: {leave.rejectionReason}</div>
                    )}
                  </td>
                  <td>
                    {leave.status === "Pending" ? (
                      <div className="btn-group">
                        <button className="btn-approve" onClick={() => handleLeaveAction(leave.leaveId, "Approved")}>Approve</button>
                        <button className="btn-reject" onClick={() => handleLeaveAction(leave.leaveId, "Rejected")}>Reject</button>
                      </div>
                    ) : (
                      <span className="action-done">Processed</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No leave records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* REJECTION MODAL */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="rejection-modal">
            <h3>Reason for Rejection</h3>
            <p>Please provide a reason why this leave request is being denied.</p>
            <textarea 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Shortage of staff, peak project period..."
              required
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
              }}>Cancel</button>
              <button 
                className="btn-confirm-reject" 
                onClick={() => submitStatusUpdate(selectedLeaveId, "Rejected", rejectionReason)}
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-buttons">
            <button className="pg-btn" disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)}>Prev</button>
            {[...Array(totalPages)].map((_, index) => (
              <button key={index + 1} className={`pg-num ${currentPage === index + 1 ? 'active' : ''}`} onClick={() => paginate(index + 1)}>{index + 1}</button>
            ))}
            <button className="pg-btn" disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveAdmin;