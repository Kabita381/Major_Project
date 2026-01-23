import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById, createUser, updateUser } from "../../api/userApi";
import { getRoles } from "../../api/roleApi"; 
import "./AddUser.css"; 

export default function AddUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: { roleId: "" }, 
    status: "ACTIVE"
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // Wrapped in useCallback to prevent unnecessary re-renders
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Roles
      const rolesData = await getRoles();
      // Ensure we handle both Axios response structures
      const finalRoles = Array.isArray(rolesData) ? rolesData : rolesData.data || [];
      setRoles(finalRoles);

      // 2. If editing, fetch the specific user
      if (isEditMode) {
        const userRes = await getUserById(id);
        
        // FIX: Check if data is nested under userRes.data or directly in userRes
        const u = userRes.data ? userRes.data : userRes;

        if (u) {
          setFormData({
            username: u.username || "",
            email: u.email || "",
            password: "", // Always keep password empty on load for security
            role: { 
              roleId: u.role?.roleId || u.roleId || "" 
            },
            status: u.status || "ACTIVE"
          });
        }
      }
    } catch (err) {
      console.error("Initialization error:", err);
      setStatusMsg({ type: "error", text: "Error fetching user data. Please check your connection." });
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "roleId") {
      setFormData((prev) => ({ 
        ...prev, 
        role: { roleId: value } // Keep as string for the dropdown, parse on submit if needed
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create a clean payload (parse roleId to Integer if your backend requires it)
      const payload = {
        ...formData,
        role: { roleId: parseInt(formData.role.roleId) }
      };

      if (isEditMode) {
        // If password is empty in edit mode, you might want to remove it 
        // from payload so it doesn't overwrite with an empty string
        if (!payload.password) delete payload.password;

        await updateUser(id, payload);
        setStatusMsg({ type: "success", text: "User updated successfully!" });
      } else {
        await createUser(payload);
        setStatusMsg({ type: "success", text: "User account created!" });
      }
      
      setTimeout(() => navigate("/admin/users"), 2000);
    } catch (err) {
      console.error("Submit error:", err);
      setStatusMsg({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to save user." 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.username) {
    return <div className="app-canvas"><p>Loading user data...</p></div>;
  }

  return (
    <div className="app-canvas">
      <header className="page-header">
        <h3>{isEditMode ? "Update User" : "Create New User"}</h3>
      </header>

      {statusMsg.text && (
        <div className={`status-box ${statusMsg.type}`}>{statusMsg.text}</div>
      )}

      <div className="form-card-container">
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Username</label>
              <input 
                name="username" 
                value={formData.username} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Password {isEditMode && "(Leave blank to keep current)"}</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required={!isEditMode} 
              />
            </div>

            <div className="form-group">
              <label>Assign Role</label>
              <select 
                name="roleId" 
                value={formData.role.roleId} 
                onChange={handleChange} 
                required
              >
                <option value="">-- Select a Role --</option>
                {roles.map((r) => (
                  <option key={r.roleId} value={r.roleId}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Account Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="details-btn" onClick={() => navigate("/admin/users")}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Processing..." : (isEditMode ? "Save Changes" : "Create User")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}