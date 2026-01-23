import React, { useState, useEffect } from "react";
import api from "../../api/axios"; 
import "./Leave.css";

const LeaveAdmin = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({}); 
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const fetchLeaves = async () => {
    try {
      const res = await api.get("/employee-leaves");
      const leaves = Array.isArray(res.data) ? res.data : [];
      // Sorting by ID descending so newest requests appear first
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

  const handleLeaveAction = async (leaveId, action) => {
    const sessionData = localStorage.getItem("user_session");
    const userSession = sessionData ? JSON.parse(sessionData) : null;
    const adminId = userSession?.empId || userSession?.id || userSession?.user?.id;

    if (!adminId) {
      alert("Session Error: Please sign out and sign in again.");
      return;
    }

    try {
      await api.patch(`/employee-leaves/${leaveId}/status`, null, {
        params: { status: action, adminId: adminId }
      });
      alert(`Leave ${action} successfully.`);
      fetchLeaves();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || "Server SQL Error";
      alert("Backend Error: " + errMsg);
    }
  };

  // Pagination Logic
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
              <th>Leave Days (This Req)</th>
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

      {/* Professional Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, leaveRequests.length)} of {leaveRequests.length}
          </div>
          <div className="pagination-buttons">
            <button 
              className="pg-btn" 
              disabled={currentPage === 1} 
              onClick={() => paginate(currentPage - 1)}
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                className={`pg-num ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </button>
            ))}

            <button 
              className="pg-btn" 
              disabled={currentPage === totalPages} 
              onClick={() => paginate(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveAdmin;