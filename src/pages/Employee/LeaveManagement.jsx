import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios"; 
import "./LeaveManagement.css";

const LeaveManagement = () => {
  // Retrieve session once on component load
  const userSession = JSON.parse(localStorage.getItem("user_session") || "{}");
  
  /**
   * FIX: We strictly prioritize the new 'empId' from the backend session.
   * If this is missing, the user likely needs to log out and back in.
   */
  const currentEmpId = userSession.empId; 

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); 
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const today = new Date().toISOString().split("T")[0];

  const loadLeaveData = useCallback(async () => {
    // Prevent API calls if identity is not verified
    if (!currentEmpId) {
        setLoading(false);
        setErrorMsg("Session Error: Employee Profile not found. Please re-login.");
        return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      // Fetching all necessary data in parallel
      const [typesRes, balRes, histRes] = await Promise.all([
        api.get("/leave-types"),
        api.get(`/leave-balance/employee/${currentEmpId}`),
        api.get("/employee-leaves") // We will filter this locally for now
      ]);
      
      setLeaveTypes(typesRes.data || []);
      setBalances(Array.isArray(balRes.data) ? balRes.data : [balRes.data]);
      
      // Filter history to only show records belonging to the current employee
      const myHistory = histRes.data.filter(item => 
        item.employee?.empId === currentEmpId
      );
      setLeaveHistory(myHistory);
    } catch (err) {
      console.error("Fetch Error:", err);
      setErrorMsg("Failed to sync leave data with server.");
    } finally {
      setLoading(false);
    }
  }, [currentEmpId]);

  useEffect(() => {
    loadLeaveData();
  }, [loadLeaveData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    // Double-check identity before submission
    if (!currentEmpId) {
        setErrorMsg("Submission failed: Missing Employee ID.");
        return;
    }
    
    // Construct payload as expected by EmployeeLeaveServiceImpl.requestLeave()
    const payload = {
      employee: { empId: currentEmpId },
      leaveType: { leaveTypeId: parseInt(formData.leaveTypeId) },
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: "Pending"
    };

    try {
      await api.post("/employee-leaves", payload);
      setSuccessMsg("Application Sent Successfully!");
      
      // Reset form fields
      setFormData({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
      
      // Refresh balance and history
      loadLeaveData(); 
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error("Submission Error:", err);
      setErrorMsg(`Failed: ${err.response?.data?.message || "Internal Server Error"}`);
    }
  };

  if (loading) return <div className="loading-state">Syncing Quota with Server...</div>;

  return (
    <div className="leave-module-wrapper">
      <div className="module-header-center">
        <h1>Employee Leave Portal</h1>
        <p>Manage requests for <strong>{userSession.username || "Employee"}</strong></p>
      </div>

      {successMsg && <div className="success-toast-message">{successMsg}</div>}
      {errorMsg && <div className="error-toast-message">{errorMsg}</div>}

      <div className="leave-top-layout">
        <div className="balance-box-compact">
          <span className="box-label">Available Quota</span>
          <div className="days-display">
            {balances.length > 0 ? balances.reduce((sum, b) => sum + (b.currentBalanceDays || 0), 0) : "0"}
            <span className="days-unit">Days</span>
          </div>
          <div className="approved-footer">
            Approved this Year: <strong>{leaveHistory.filter(l => l.status === 'Approved').reduce((s, l) => s + (l.totalDays || 0), 0)}</strong>
          </div>
        </div>

        <div className="apply-box-large">
          <h2 className="apply-title">Apply for New Leave</h2>
          <form onSubmit={handleSubmit} className="leave-form-grid">
            <div className="form-field">
              <select value={formData.leaveTypeId} onChange={(e) => setFormData({...formData, leaveTypeId: e.target.value})} required>
                <option value="">Select Leave Type</option>
                {leaveTypes.map(t => <option key={t.leaveTypeId} value={t.leaveTypeId}>{t.typeName}</option>)}
              </select>
            </div>
            <div className="form-field-row">
              <div className="date-group">
                <label>From Date</label>
                <input type="date" value={formData.startDate} min={today} onChange={(e)=>setFormData({...formData, startDate: e.target.value})} required />
              </div>
              <div className="date-group">
                <label>To Date</label>
                <input type="date" value={formData.endDate} min={formData.startDate || today} onChange={(e)=>setFormData({...formData, endDate: e.target.value})} required />
              </div>
            </div>
            <div className="form-field">
              <textarea placeholder="Reason for leave request..." value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} required />
            </div>
            <div className="submit-action-center">
              <button type="submit" className="btn-apply-gradient">Submit Application</button>
            </div>
          </form>
        </div>
      </div>

      <div className="leave-history-container">
        <h2 className="history-section-title">Your Leave History</h2>
        <div className="table-wrapper-scroll">
          <table className="leave-data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
                <th>Admin Remarks</th>
                <th>Approved By</th>
              </tr>
            </thead>
            <tbody>
              {leaveHistory.length > 0 ? (
                leaveHistory.map((item) => (
                  <tr key={item.leaveId}>
                    <td>#LV-{item.leaveId}</td>
                    <td>{item.leaveType?.typeName}</td>
                    <td>{item.startDate} to {item.endDate}</td>
                    <td className="bold-days">{item.totalDays}</td>
                    <td><span className={`status-pill ${item.status?.toLowerCase()}`}>{item.status}</span></td>
                    <td className="remarks-cell">
                      {item.status === "Rejected" ? (
                        <span className="rejection-text">{item.rejectionReason || "No reason provided"}</span>
                      ) : (
                        <span className="dash-text">—</span>
                      )}
                    </td>
                    <td>{item.approvedBy?.username || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" style={{textAlign: 'center'}}>No personal history records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;