import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployees, deleteEmployee } from "../../api/employeeApi";
import ConfirmModal from "../../components/ConfirmModal";
import "./Employees.css";

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [targetId, setTargetId] = useState(null);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const confirmDelete = async () => {
    try {
      await deleteEmployee(targetId);
      fetchEmployees();
    } catch (err) { console.error(err); } 
    finally { setShowModal(false); }
  };

  const filtered = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const idStr = (emp.empId || emp.id || "").toString();
    return fullName.includes(searchTerm.toLowerCase()) || idStr.includes(searchTerm.toLowerCase());
  }).sort((a, b) => (b.empId || b.id) - (a.empId || a.id));

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="loader">Loading Dashboard...</div>;

  return (
    <div className="emp-page-container">
      <ConfirmModal show={showModal} onConfirm={confirmDelete} onCancel={() => setShowModal(false)} />

      <header className="emp-header">
        <input 
          className="emp-search" 
          placeholder="Search Name or ID..." 
          value={searchTerm} 
          onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} 
        />
        <h3 className="emp-title">Employee Management</h3>
        <button className="emp-add-btn" onClick={() => navigate("/admin/employees/new")}>+ Add New</button>
      </header>

      <div className="emp-table-card">
        <div className="emp-columns-head">
          <span>Employee (ID)</span>
          <span>Email Address</span>
          <span>Department</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        <div className="emp-list-content">
          {currentData.map(emp => {
            const id = emp.empId || emp.id;
            return (
              <div key={id} className="emp-row-group">
                <div className="emp-row-main">
                  <span className="emp-bold">#{id} {emp.firstName} {emp.lastName}</span>
                  <span className="emp-muted">{emp.email}</span>
                  <span>{emp.department?.deptName || "N/A"}</span>
                  <span>
                    <span className={`emp-status-tag ${emp.isActive ? "active" : "inactive"}`}>
                      {emp.isActive ? "Active" : "Leave"}
                    </span>
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <button className="emp-view-trigger" onClick={() => setExpandedId(expandedId === id ? null : id)}>
                      {expandedId === id ? "Close" : "Details"}
                    </button>
                  </div>
                </div>

                {expandedId === id && (
                  <div className="emp-details-tray">
                    <div className="emp-details-grid">
                      <span><strong>Contact:</strong> {emp.contact}</span>
                      <span><strong>Education:</strong> {emp.education}</span>
                      <span><strong>Role:</strong> {emp.position?.designationTitle}</span>
                      <div className="emp-tray-actions">
                        <button className="emp-action-edit" onClick={() => navigate(`/admin/employees/edit/${id}`)}>✎ Edit</button>
                        <button className="emp-action-delete" onClick={() => { setTargetId(id); setShowModal(true); }}>🗑 Delete</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <footer className="emp-pagination">
          <div className="emp-pagination-info">Showing {currentData.length} of {filtered.length} entries</div>
          <div className="emp-pagination-ctrl">
            <button className="emp-pg-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
            <span className="emp-pg-text">Page {currentPage} of {totalPages || 1}</span>
            <button className="emp-pg-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        </footer>
      </div>
    </div>
  );
}