import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, deleteUser } from "../../api/userApi"; 
import ConfirmModal from "../../components/ConfirmModal";
import "./users.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  
  // Custom Modal State
  const [showModal, setShowModal] = useState(false);
  const [targetId, setTargetId] = useState(null);

  // Status Message State
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getUsers();
      // Adjust based on your API response structure
      const data = res.data || res || [];
      setUsers(data);
    } catch (err) {
      setStatusMsg({ type: "error", text: "Sync error: Could not reach user database." });
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
      await deleteUser(targetId);
      setStatusMsg({ type: "success", text: "User account removed successfully." });
      fetchData();
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || "Operation failed.";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setTargetId(null);
    }
  };

  if (loading) return <div className="loader">Initializing User Records...</div>;

  return (
    <div className="app-canvas">
      <ConfirmModal 
        show={showModal}
        message="Are you sure you want to permanently delete this user account? This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowModal(false)}
      />

      <header className="page-header">
        <h3>User Management</h3>
        <button 
          className="primary-btn" 
          onClick={() => navigate("/admin/users/new")}
        >
          + Create New User
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
          <span className="month-label">Total Users</span>
          <span className="count-label">{users.length}</span>
        </div>
        <div className="stat-pill">
          <span className="month-label">Active Accounts</span>
          <span className="count-label">
            {users.filter(u => u.status?.toLowerCase() === "active").length}
          </span>
        </div>
      </div>

      <div className="data-list-container">
        <div className="list-columns">
          <span>Username</span>
          <span>Email Address</span>
          <span>Role</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Details</span>
        </div>

        <div className="scrollable-list-area">
          {users.map((user) => {
            const currentId = user.userId;

            return (
              <div key={currentId} className="list-row-card">
                <div className="row-visible">
                  <span style={{ fontWeight: "600" }}>{user.username}</span>
                  <span>{user.email}</span>
                  <span>{user.role?.roleName || "N/A"}</span>
                  <span>
                    <span className={`status-tag ${user.status?.toLowerCase() === "active" ? "active" : "inactive"}`}>
                      {user.status || "UNKNOWN"}
                    </span>
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
                      <div><strong>User ID:</strong> #{user.userId}</div>
                      <div><strong>Account Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</div>
                      <div><strong>Role Description:</strong> {user.role?.description || "No description provided"}</div>
                      <div><strong>Login Access:</strong> Enabled</div>
                    </div>

                    <div className="action-tray">
                      <button 
                        className="btn-link edit" 
                        onClick={() => navigate(`/admin/users/edit/${currentId}`)}
                      >
                        Edit User
                      </button>
                      <button 
                        className="btn-link delete" 
                        onClick={(e) => openDeleteModal(e, currentId)}
                      >
                        Delete User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}