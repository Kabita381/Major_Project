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

  const navigate = useNavigate();

  /* =========================
     INITIAL FETCH
     ========================= */
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, statRes] = await Promise.all([
        getEmployees(),
        getActiveEmployeeStats(),
      ]);
      setEmployees(empRes.data || []);
      setActiveStats(statRes.data || {});
    } catch (err) {
      console.error(
        "Failed to load employees. Check JWT token or backend.",
        err
      );
    }
  };

  /* =========================
     DELETE
     ========================= */
  const handleDelete = async () => {
    try {
      await deleteEmployee(deleteId);
      setShowConfirm(false);
      fetchData();
    } catch (err) {
      alert(
        err?.response?.data?.message || "Failed to delete employee"
      );
    }
  };

  return (
    <div className="app-canvas">
      <header className="page-header">
        <div className="header-text">
          <h1>Employee Management</h1>
          <p>Clean view of your workforce directory</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => navigate("/admin/employees/new")}
        >
          + Add Employee
        </button>
      </header>

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
          {employees.map((emp) => (
            <div
              key={emp.empId}
              className={`list-row-card ${
                expandedId === emp.empId ? "expanded" : ""
              }`}
            >
              <div
                className="row-visible"
                onClick={() =>
                  setExpandedId(
                    expandedId === emp.empId ? null : emp.empId
                  )
                }
              >
                <span className="emp-name">
                  {emp.firstName} {emp.lastName}
                </span>
                <span className="emp-email">{emp.email}</span>
                <span className="emp-title">
                  {emp.position?.designationTitle || "N/A"}
                </span>
                <span>
                  <b
                    className={`status-tag ${
                      emp.isActive ? "active" : "inactive"
                    }`}
                  >
                    {emp.isActive ? "Working" : "On Leave"}
                  </b>
                </span>
                <span className="text-right">
                  <button className="details-btn">
                    {expandedId === emp.empId ? "Hide" : "View"}
                  </button>
                </span>
              </div>

              {expandedId === emp.empId && (
                <div className="row-hidden-tray">
                  <div className="details-box">
                    <div>
                      <strong>Contact:</strong> {emp.contact}
                    </div>
                    <div>
                      <strong>Education:</strong> {emp.education}
                    </div>
                    <div>
                      <strong>Joined:</strong> {emp.joiningDate}
                    </div>
                    <div>
                      <strong>Address:</strong> {emp.address}
                    </div>
                  </div>

                  <div className="action-tray">
                    <button
                      className="btn-link edit"
                      onClick={() =>
                        navigate(
                          `/admin/employees/edit/${emp.empId}`
                        )
                      }
                    >
                      Edit Profile
                    </button>
                    <button
                      className="btn-link delete"
                      onClick={() => {
                        setDeleteId(emp.empId);
                        setShowConfirm(true);
                      }}
                    >
                      Delete Record
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        show={showConfirm}
        message="Are you sure you want to delete this employee?"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
