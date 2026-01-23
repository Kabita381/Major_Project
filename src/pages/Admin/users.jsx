import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, deleteUser } from "../../api/userApi"; 
import ConfirmModal from "../../components/ConfirmModal";
import "./users.css";

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [targetId, setTargetId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data || res || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(targetId);
      fetchData();
    } catch (err) { console.error(err); } 
    finally { setShowModal(false); }
  };

  const filteredUsers = users
    .filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.userId.toString().includes(searchTerm))
    .sort((a, b) => b.userId - a.userId);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentData = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="loader">Initializing Records...</div>;

  return (
    <div className="user-app-canvas">
      <ConfirmModal show={showModal} onConfirm={confirmDelete} onCancel={() => setShowModal(false)} />

      <header className="user-page-header">
        <input 
          className="user-search-box" 
          placeholder="Search Username/ID..." 
          value={searchTerm} 
          onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} 
        />
        <h3 className="user-centered-title">User Management</h3>
        <button className="user-primary-btn" onClick={() => navigate("/admin/users/new")}>+ Create User</button>
      </header>

      <div className="user-list-card">
        <div className="user-grid-header">
          <span>Username / ID</span>
          <span>Email Address</span>
          <span>Role</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        <div className="user-list-body">
          {currentData.map((user) => (
            <div key={user.userId} className="user-row-wrapper">
              <div className="user-row-visible">
                <span className="user-font-bold">#{user.userId} - {user.username}</span>
                <span>{user.email}</span>
                <span>{user.role?.roleName || "N/A"}</span>
                <span><span className={`user-status-pill ${user.status?.toLowerCase()}`}>{user.status}</span></span>
                <div style={{ textAlign: "right" }}>
                  <button className="user-view-btn" onClick={() => setExpandedId(expandedId === user.userId ? null : user.userId)}>
                    {expandedId === user.userId ? "Close" : "View"}
                  </button>
                </div>
              </div>

              {expandedId === user.userId && (
                <div className="user-expand-tray">
                  <div className="user-details-layout">
                    <span><strong>Username:</strong> {user.username}</span>
                    <span><strong>User ID:</strong> {user.userId}</span>
                    <span><strong>Role:</strong> {user.role?.roleName}</span>
                    <div className="user-tray-buttons">
                      <button className="user-btn-edit" onClick={() => navigate(`/admin/users/edit/${user.userId}`)}>Edit User</button>
                      <button className="user-btn-delete" onClick={() => { setTargetId(user.userId); setShowModal(true); }}>Delete User</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <footer className="user-footer-pagination">
          <div className="user-entry-count">Showing {currentData.length} of {filteredUsers.length} entries</div>
          <div className="user-pagination-group">
            <button className="user-pg-arrow" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
            <span className="user-pg-indicator">Page {currentPage} of {totalPages || 1}</span>
            <button className="user-pg-arrow" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        </footer>
      </div>
    </div>
  );
}