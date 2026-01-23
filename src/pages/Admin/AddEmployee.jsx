import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios"; 
import { getEmployeeById, createEmployee, updateEmployee } from "../../api/employeeApi"; 
import "./AddEmployee.css"; 

const AddEmployee = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", contact: "", address: "",
    education: "", maritalStatus: "SINGLE", departmentId: "",
    positionId: "", isActive: true, basicSalary: 0,
    joiningDate: new Date().toISOString().split('T')[0]
  });

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const loadInit = async () => {
      try {
        const [d, p] = await Promise.all([api.get("/departments"), api.get("/designations")]);
        setDepartments(d.data); setPositions(p.data);
        if (isEditMode) {
          const res = await getEmployeeById(id);
          const u = res.data || res;
          setFormData({...u, departmentId: u.department?.deptId, positionId: u.position?.designationId});
        }
      } catch (e) { console.error(e); }
    };
    loadInit();
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      let userId = null;
      
      // Step 1: Check User Existence in User table by Email
      const userRes = await api.get(`/users/search?email=${formData.email}`);
      const userData = userRes.data;

      if (!userData || userData.length === 0) {
        setErrorMsg("No user found with this email. Please create the User account first.");
        setLoading(false);
        return;
      }
      
      userId = userData.id || userData[0].id; // Extracting User ID

      // Step 2: Prepare Payload with User ID as FK
      const payload = { 
        ...formData, 
        user: { id: userId }, 
        department: { deptId: parseInt(formData.departmentId) }, 
        position: { designationId: parseInt(formData.positionId) } 
      };

      isEditMode ? await updateEmployee(id, payload) : await createEmployee(payload);
      navigate("/admin/employees");
    } catch (err) { 
      setErrorMsg("Validation failed. Ensure email matches a registered user.");
      setLoading(false); 
    }
  };

  return (
    <div className="app-canvas compact-form-view">
      <div className="form-container">
        <header className="form-header">
          <h3>{isEditMode ? "✎ Edit Employee" : "✚ New Employee"}</h3>
        </header>

        {errorMsg && <div className="error-banner">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="compact-form">
          <div className="form-grid-4">
            <div className="field-item"><label>First Name</label><input value={formData.firstName} onChange={(e)=>setFormData({...formData, firstName: e.target.value})} required /></div>
            <div className="field-item"><label>Last Name</label><input value={formData.lastName} onChange={(e)=>setFormData({...formData, lastName: e.target.value})} required /></div>
            <div className="field-item"><label>Email</label><input type="email" value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} required /></div>
            <div className="field-item"><label>Contact</label><input value={formData.contact} onChange={(e)=>setFormData({...formData, contact: e.target.value})} required /></div>
            <div className="field-item"><label>Education</label><input value={formData.education} onChange={(e)=>setFormData({...formData, education: e.target.value})} required /></div>
            <div className="field-item"><label>Dept.</label>
              <select value={formData.departmentId} onChange={(e)=>setFormData({...formData, departmentId: e.target.value})} required>
                <option value="">Select...</option>
                {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
              </select>
            </div>
            <div className="field-item"><label>Salary</label><input type="number" value={formData.basicSalary} onChange={(e)=>setFormData({...formData, basicSalary: e.target.value})} required /></div>
            <div className="field-item"><label>Joining</label><input type="date" value={formData.joiningDate} onChange={(e)=>setFormData({...formData, joiningDate: e.target.value})} required /></div>
          </div>

          <div className="form-bottom-section">
            <div className="addr-side">
              <label>Address</label>
              <textarea value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} required />
            </div>
            <div className="btn-side">
              <button type="button" className="btn-cancel" onClick={() => navigate("/admin/employees")}>Cancel</button>
              <button type="submit" className="btn-save" disabled={loading}>{isEditMode ? "Update" : "Save"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;