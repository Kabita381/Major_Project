import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getEmployees,
  deleteEmployee,
  getActiveEmployeeStats,
} from "../../api/employeeApi";
import ConfirmModal from "../../components/ConfirmModal";
import "./Employees.css";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [activeStats, setActiveStats] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  /* =========================
      1. PAGINATION STATE
     ========================= */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Change this to show more/fewer rows per page

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  // Reset to page 1 whenever searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      const [empRes, statRes] = await Promise.all([
        getEmployees(),
        getActiveEmployeeStats(),
      ]);
      setEmployees(empRes.data || []);
      setActiveStats(statRes.data || {});
    } catch (err) {
      console.error("Failed to load employees.", err);
    }
  };

  /* =========================
      2. FILTER & PAGINATION LOGIC
     ========================= */
  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    const empIdStr = emp.empId?.toString() || "";
    return fullName.includes(search) || empIdStr.includes(search);
  });

  // Calculate indexes for slicing
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // The actual items shown on the current page
  const currentEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  
  // Total pages calculation
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDelete = async () => {
    try {
      await deleteEmployee(deleteId);
      setShowConfirm(false);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete employee");
    }
  };

  return (
    <div className="app-canvas">
      <header className="page-header">
        <div className="header-text">
          <h1>Employee Management</h1>
          <p>Clean view of your workforce directory</p>
        </div>

        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search by ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="primary-btn" onClick={() => navigate("/admin/employees/new")}>
            + Add Employee
          </button>
        </div>
      </header>

      {/* Stats Section */}
      <section className="dashboard-stats">
        {Object.entries(activeStats).map(([month, count]) => (
          <div className="stat-pill" key={month}>
            <span className="month-label">Month {month}</span>
            <span className="count-label">{count} Working</span>
          </div>
        ))}
      </section>

      <div className="data-list-container">
        <div className="list-columns">
          <span>Employee Name</span>
          <span>Email</span>
          <span>Designation</span>
          <span>Status</span>
          <span className="text-right">Details</span>
        </div>

        <div className="scrollable-list-area">
          {currentEmployees.length > 0 ? (
            currentEmployees.map((emp) => (
              <div key={emp.empId} className={`list-row-card ${expandedId === emp.empId ? "expanded" : ""}`}>
                <div className="row-visible" onClick={() => setExpandedId(expandedId === emp.empId ? null : emp.empId)}>
                  <span className="emp-name">
                    <small>#{emp.empId}</small> {emp.firstName} {emp.lastName}
                  </span>
                  <span className="emp-email">{emp.email}</span>
                  <span className="emp-title">{emp.position?.designationTitle || "N/A"}</span>
                  <span>
                    <b className={`status-tag ${emp.isActive ? "active" : "inactive"}`}>
                      {emp.isActive ? "Working" : "On Leave"}
                    </b>
                  </span>
                  <span className="text-right">
                    <button className="details-btn">{expandedId === emp.empId ? "Hide" : "View"}</button>
                  </span>
                </div>
                {/* Hidden Tray Logic here... */}
              </div>
            ))
          ) : (
            <div className="no-results">No employees found.</div>
          )}
        </div>

       
        {totalPages > 1 && (
          <div className="pagination-bar">
            <button 
              disabled={currentPage === 1} 
              onClick={() => paginate(currentPage - 1)}
              className="page-btn"
            >
              Prev
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => paginate(index + 1)}
                className={`page-btn ${currentPage === index + 1 ? "active" : ""}`}
              >
                {index + 1}
              </button>
            ))}

            <button 
              disabled={currentPage === totalPages} 
              onClick={() => paginate(currentPage + 1)}
              className="page-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        show={showConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}