import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Payroll.css";

const PayrollAdmin = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // State must match the 'name' attributes of your inputs
  const [formData, setFormData] = useState({
    empId: "",
    grossSalary: "",
    totalAllowances: "",
    totalDeductions: "",
    accountId: 1,
    paymentMethodId: 1,
    payGroupId: 1
  });

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/payrolls");
      setPayrollData(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  // CORRECTED AUTO-FILL LOGIC
  const handleFetchEmployeeDetails = async () => {
    if (!formData.empId) return;
    try {
      const response = await axios.get(`http://localhost:8080/api/employees/${formData.empId}`);
      const emp = response.data;
      
      if (emp) {
        // MUST map Java entity fields to React state fields
        setFormData(prev => ({
          ...prev,
          grossSalary: emp.basicSalary ? emp.basicSalary.toString() : "", 
          totalAllowances: emp.allowances ? emp.allowances.toString() : "0",
          totalDeductions: emp.deductions ? emp.deductions.toString() : "0"
        }));
      }
    } catch (err) {
      console.error("Employee fetch error. Check if backend is running.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        empId: parseInt(formData.empId),
        grossSalary: parseFloat(formData.grossSalary),
        totalAllowances: parseFloat(formData.totalAllowances),
        totalDeductions: parseFloat(formData.totalDeductions),
        accountId: parseInt(formData.accountId),
        paymentMethodId: parseInt(formData.paymentMethodId),
        payGroupId: parseInt(formData.payGroupId)
      };
      await axios.post("http://localhost:8080/api/payrolls", payload);
      alert("Payroll Processed Successfully!");
      setShowForm(false);
      setFormData({ empId: "", grossSalary: "", totalAllowances: "", totalDeductions: "", accountId: 1, paymentMethodId: 1, payGroupId: 1 });
      fetchPayrolls();
    } catch (err) {
      alert("Error: Check if ID exists and all fields are filled.");
    }
  };

  // Professional Printable Slip
  const handlePrint = (data) => {
    const printWindow = window.open("", "_blank", "width=800,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>NAST COLLEGE - Pay Slip</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; }
            .container { border: 1px solid #000; padding: 40px; max-width: 600px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #333; margin-bottom: 30px; }
            .row { display: flex; justify-content: space-between; margin: 12px 0; }
            .total { border-top: 2px solid #000; padding-top: 15px; font-weight: bold; font-size: 1.2em; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>NAST COLLEGE</h2>
              <p>Dhangadhi, Nepal</p>
              <h3>PAY SLIP</h3>
            </div>
            <div class="row"><span>Employee:</span> <strong>${data.employee?.firstName} ${data.employee?.lastName}</strong></div>
            <div class="row"><span>Gross Salary:</span> <span>Rs. ${data.grossSalary?.toLocaleString()}</span></div>
            <div class="row"><span>Allowances:</span> <span>Rs. ${data.totalAllowances?.toLocaleString()}</span></div>
            <div class="row"><span>Deductions:</span> <span style="color:red">-(Rs. ${data.totalDeductions?.toLocaleString()})</span></div>
            <div class="row"><span>Tax (1%):</span> <span style="color:red">-(Rs. ${data.totalTax?.toLocaleString()})</span></div>
            <div class="total row"><span>NET PAYABLE:</span> <span>Rs. ${data.netSalary?.toLocaleString()}</span></div>
            <div style="text-align:center; margin-top:30px;">
              <button class="no-print" onclick="window.print()">Print Receipt</button>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return <div className="payroll-wrapper">Syncing with Server...</div>;

  return (
    <div className="payroll-wrapper">
      <header className="payroll-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', color: '#0f172a' }}>Payroll Management</h2>
            <p style={{ color: '#64748b' }}>Nepal Labor Act Compliance (FY 2081/82)</p>
          </div>
          <button className="btn-cancel" onClick={() => setShowForm(!showForm)} 
                  style={{ background: '#0369a1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
            {showForm ? "Cancel Entry" : "+ New Payroll"}
          </button>
        </div>
      </header>

      {showForm && (
        <div className="form-container">
          <form className="payroll-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label>EMPLOYEE ID</label>
                <input type="number" name="empId" value={formData.empId} onChange={handleInputChange} onBlur={handleFetchEmployeeDetails} required />
              </div>
              <div className="input-group">
                <label>GROSS SALARY</label>
                <input type="number" name="grossSalary" value={formData.grossSalary} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label>ALLOWANCES</label>
                <input type="number" name="totalAllowances" value={formData.totalAllowances} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label>DEDUCTIONS</label>
                <input type="number" name="totalDeductions" value={formData.totalDeductions} onChange={handleInputChange} />
              </div>
            </div>
            <button type="submit" className="btn-submit-form" style={{ marginTop: '20px' }}>Confirm & Save Payroll</button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>EMPLOYEE NAME</th>
              <th>STATUS</th>
              <th>NET AMOUNT</th>
              <th>PAYMENT INFO</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {payrollData.map((data) => (
              <tr key={data.payrollId}>
                <td>
                  <div style={{ fontWeight: '600' }}>{data.employee?.firstName} {data.employee?.lastName}</div>
                  <div style={{ fontSize: '0.85em', color: '#64748b' }}>{data.employee?.department?.deptName || "Staff"}</div>
                </td>
                <td><span className="badge processed">PROCESSED</span></td>
                <td style={{ fontWeight: '700', color: '#0369a1' }}>Rs. {data.netSalary?.toLocaleString()}</td>
                <td>{data.paymentMethod?.methodName || 'Bank Transfer'}</td>
                <td><button className="btn-slip" onClick={() => handlePrint(data)}>Get Slip</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollAdmin;