import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployees, deleteEmployee } from "../../api/employeeApi";
import ConfirmModal from "../../components/ConfirmModal"; 
import "./Employees.css";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getEmployees();
      const data = res.data || res || [];
      setEmployees(data);
    } catch (err) {
      setStatusMsg({ type: "error", text: "Sync error: Could not reach database." });
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openDeleteModal = (e, id) => {
    e.stopPropagation();
    setTargetId(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    setShowModal(false);
    if (!targetId) return;

    try {
      // Logic: This triggers the backend to set isActive = false
      await deleteEmployee(targetId);
      setStatusMsg({ type: "success", text: "Employee record archived successfully." });
      fetchData(); // Refresh to hide the inactive record
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || "Operation failed.";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setTargetId(null);
    }
  };

  if (loading) return <div className="loader">Initializing Records...</div>;

  // FIX 1: Filter to only show active employees on the frontend
  const activeEmployees = employees.filter(emp => emp.isActive !== false);

  return (
    <div className="app-canvas">
      <ConfirmModal 
        show={showModal}
        message="Are you sure you want to remove this employee from the active list?"
        onConfirm={confirmDelete}
        onCancel={() => setShowModal(false)}
      />

      <header className="page-header">
        <h3>Employee Management</h3>
        {/* FIX 2: Ensure correct path navigation */}
        <button 
          className="primary-btn" 
          onClick={() => navigate("/admin/employees/new")}
        >
          + Register Employee
        </button>
      </header>

      {statusMsg.text && (
        <div className={`status-box ${statusMsg.type}`} style={{ marginBottom: "20px" }}>
          <span>{statusMsg.text}</span>
          <button className="close-btn" onClick={() => setStatusMsg({ type: "", text: "" })}>×</button>
        </div>
      )}

      <div className="dashboard-stats">
        <div className="stat-pill">
          <span className="month-label">Active Staff</span>
          <span className="count-label">{activeEmployees.length}</span>
        </div>
        <div className="stat-pill">
          <span className="month-label">Total Records</span>
          <span className="count-label">{employees.length}</span>
        </div>
      </div>

      <div className="data-list-container">
        <div className="list-columns">
          <span>Name</span>
          <span>Email</span>
          <span>Department</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Details</span>
        </div>

        <div className="scrollable-list-area">
          {/* FIX 3: Map through the filtered activeEmployees list */}
          {activeEmployees.length > 0 ? (
            activeEmployees.map((emp) => {
              const currentId = emp.empId || emp.id;

              return (
                <div key={currentId} className="list-row-card">
                  <div className="row-visible">
                    <span style={{ fontWeight: "600" }}>{emp.firstName} {emp.lastName}</span>
                    <span>{emp.email}</span>
                    <span>{emp.department?.deptName || "N/A"}</span>
                    <span>
                      <span className="status-tag active">Active</span>
                    </span>
                    <div style={{ textAlign: "right" }}>
                      <button className="details-btn" onClick={() => toggleRow(currentId)}>
                        {expandedId === currentId ? "Close" : "View"}
                      </button>
                    </div>
                  </div>

                  {expandedId === currentId && (
                    <div className="row-hidden-tray">
                      <div className="details-box">
                        <div><strong>Contact:</strong> {emp.contact}</div>
                        <div><strong>Designation:</strong> {emp.position?.designationTitle || "N/A"}</div>
                        <div><strong>Education:</strong> {emp.education}</div>
                        <div><strong>Marital Status:</strong> {emp.maritalStatus}</div>
                        <div style={{ gridColumn: "span 2" }}>
                            <strong>Address:</strong> {emp.address}
                        </div>
                      </div>

                      <div className="action-tray">
                        <button 
                          className="btn-link edit" 
                          onClick={() => navigate(`/admin/employees/edit/${currentId}`)}
                        >
                          Edit Profile
                        </button>
                        <button 
                          className="btn-link delete" 
                          onClick={(e) => openDeleteModal(e, currentId)}
                        >
                          Delete Record
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="no-data" style={{ padding: "20px", textAlign: "center" }}>
              No active employees found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}