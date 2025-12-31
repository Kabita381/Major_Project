import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createEmployee } from "../../api/employeeApi";
import { getDepartments } from "../../api/departmentApi";
import { getDesignations } from "../../api/designationApi";
import "./AddEmployee.css"; 

export default function AddEmployee() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]); 
  const [designations, setDesignations] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "", 
    lastName: "", 
    email: "", 
    contact: "",
    deptId: "", 
    designationId: "", 
    joiningDate: "",
    address: "", 
    education: "", 
    maritalStatus: "SINGLE", // Backend mandatory field
    isActive: true
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes, desigRes] = await Promise.all([getDepartments(), getDesignations()]);
        setDepartments(deptRes.data || deptRes || []);
        setDesignations(desigRes.data || desigRes || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tempPassword = "NAST" + Math.floor(1000 + Math.random() * 9000);
    
    // Construct the payload to match mandatory Employee.java fields
    const payload = {
      ...formData,
      password: tempPassword,
      department: { deptId: parseInt(formData.deptId) },
      position: { designationId: parseInt(formData.designationId) },
      // Adding missing mandatory fields required by your @Column(nullable = false)
      employmentStatus: "FULL_TIME", 
      basicSalary: 0.0,
      allowances: 0.0,
      deductions: 0.0,
      role: "ROLE_EMPLOYEE"
    };

    try {
      await createEmployee(payload);
      alert(`Success! Employee Registered.\nDefault Password: ${tempPassword}`);
      navigate("/admin/employees");
    } catch (err) {
      // Log the specific error message from the backend
      const serverMsg = err.response?.data?.message || "Check mandatory fields.";
      console.error("Submission Error:", serverMsg);
      alert("Registration failed: " + serverMsg);
    }
  };

  if (loading) return <div className="loader">Initializing...</div>;

  return (
    <div className="registration-canvas">
      <div className="form-card">
        <header className="form-header">
          <h3>Employee Registration</h3>
          <p>Create a new profile and generate system credentials.</p>
        </header>

        <form onSubmit={handleSubmit} className="compact-grid-form">
          <div className="input-group">
            <label>First Name</label>
            <input required onChange={e => setFormData({...formData, firstName: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Last Name</label>
            <input required onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Email (Login ID)</label>
            <input type="email" required onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Contact Number</label>
            <input required onChange={e => setFormData({...formData, contact: e.target.value})} />
          </div>
          
          <div className="input-group">
            <label>Department</label>
            <select required value={formData.deptId} onChange={e => setFormData({...formData, deptId: e.target.value})}>
              <option value="">-- Select --</option>
              {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Designation</label>
            <select required value={formData.designationId} onChange={e => setFormData({...formData, designationId: e.target.value})}>
              <option value="">-- Select --</option>
              {designations.map(d => <option key={d.designationId} value={d.designationId}>{d.designationTitle}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Joining Date</label>
            <input type="date" required onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Education</label>
            <input required onChange={e => setFormData({...formData, education: e.target.value})} />
          </div>

          <div className="input-group full-width">
            <label>Residential Address</label>
            <textarea required rows="1" onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>

          <div className="form-footer">
            <button type="submit" className="btn-register">Register</button>
            <button type="button" className="btn-cancel" onClick={() => navigate("/admin/employees")}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}