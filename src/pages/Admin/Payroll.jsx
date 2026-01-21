import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import "./Payroll.css";

const HistoryModal = ({ isOpen, onClose, history, employeeName }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="history-modal-content">
        <div className="modal-header">
          <h2>Salary History: {employeeName}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ref #</th>
                <th>Gross</th>
                <th>Net Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((h) => (
                  <tr key={h.payrollId} className={h.isVoided ? "row-voided" : ""}>
                    <td>{h.payDate}</td>
                    <td>{h.payslipRef}</td>
                    <td>Rs. {h.grossSalary.toLocaleString()}</td>
                    <td>Rs. {h.netSalary.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${h.isVoided ? "status-void" : "status-paid"}`}>
                        {h.isVoided ? "VOIDED" : h.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No history found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PayrollManagement = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [bonuses, setBonuses] = useState({}); // Tracks festive bonus input per row

  const [historyData, setHistoryData] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedEmpName, setSelectedEmpName] = useState("");

  useEffect(() => { loadPayrolls(); }, []);

  const loadPayrolls = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payrolls");
      setPayrolls(res.data);
    } catch (err) { console.error("Failed to fetch", err); }
    finally { setLoading(false); }
  };

  const handleManualBonus = async (empId, empName) => {
    const amount = bonuses[empId];
    if (!amount || amount <= 0) return alert("Please enter a valid amount.");

    if (window.confirm(`Apply Rs. ${amount} Festive Bonus for ${empName}? This will generate a new payroll record.`)) {
      try {
        await api.post("/payrolls/process", {
          empId: empId,
          manualBonus: parseFloat(amount)
        });
        alert("Bonus Applied & Payroll Processed Successfully!");
        setBonuses({ ...bonuses, [empId]: "" }); 
        loadPayrolls();
      } catch (err) { alert("Bonus processing failed."); }
    }
  };

  const logAction = async (payrollId, actionType, employeeName) => {
    try {
      await api.post("/payroll-audit", {
        payrollId, action: actionType,
        details: `${actionType} for ${employeeName}`,
        timestamp: new Date().toISOString()
      });
    } catch (err) { console.error("Audit logging failed", err); }
  };

  const handleViewHistory = async (payroll) => {
    const fullName = `${payroll.employee.firstName} ${payroll.employee.lastName}`;
    try {
      const res = await api.get(`/payrolls/employee/${payroll.employee.empId}/history`);
      setHistoryData(res.data);
      setSelectedEmpName(fullName);
      setIsHistoryOpen(true);
      await logAction(payroll.payrollId, "HISTORY_VIEWED", fullName);
    } catch (err) { alert("Error: Could not retrieve historical data."); }
  };

  const handleVoidPayroll = async (payroll) => {
    const fullName = `${payroll.employee.firstName} ${payroll.employee.lastName}`;
    const reason = window.prompt(`Enter reason for voiding ${payroll.payslipRef || 'this payroll'}:`);
    if (reason) {
      try {
        await api.put(`/payrolls/${payroll.payrollId}/void`, { remarks: reason });
        await logAction(payroll.payrollId, "PAYROLL_VOIDED", fullName);
        alert("Payroll voided.");
        loadPayrolls();
      } catch (err) { alert("Error: Could not void payroll."); }
    }
  };

  const handleEmailDispatch = async (payroll) => {
    const fullName = `${payroll.employee.firstName} ${payroll.employee.lastName}`;
    if (window.confirm(`Send digital payslip to ${fullName}?`)) {
      try {
        await api.post(`/payrolls/${payroll.payrollId}/send-email`);
        await logAction(payroll.payrollId, "EMAIL_SENT", fullName);
        alert("Digital payslip dispatched.");
      } catch (err) { alert("Error: Email service unavailable."); }
    }
  };

  const generatePDFView = async (data) => {
    const fullName = `${data.employee.firstName} ${data.employee.lastName}`;
    await logAction(data.payrollId, "PAYSLIP_VIEWED", fullName);

    const win = window.open("", "_blank");
    const currency = data.currencyCode || 'Rs.';

    win.document.write(`
        <html>
            <head>
                <title>Payslip - ${fullName}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; color: #333; }
                    .container { max-width: 800px; margin: auto; border: 1px solid #ddd; padding: 30px; }
                    .header { text-align: center; border-bottom: 2px solid #1a73e8; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; border: 1px solid #eee; text-align: left; }
                    .net-box { background: #1a73e8; color: white; padding: 20px; text-align: right; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>NAST COLLEGE</h1>
                        <p>Salary Disbursement Slip</p>
                    </div>
                    <p><strong>Employee:</strong> ${fullName}</p>
                    <p><strong>Ref:</strong> ${data.payslipRef || 'N/A'}</p>
                    <table>
                        <tr><th>Description</th><th>Amount</th></tr>
                        <tr><td>Gross Salary</td><td>${currency} ${data.grossSalary.toLocaleString()}</td></tr>
                        <tr><td>Allowances</td><td>${currency} ${data.totalAllowances.toLocaleString()}</td></tr>
                        <tr><td>Deductions</td><td>(${currency} ${data.totalDeductions.toLocaleString()})</td></tr>
                        <tr><td>Tax</td><td>(${currency} ${data.totalTax.toLocaleString()})</td></tr>
                    </table>
                    <div class="net-box">
                        <small>TOTAL NET PAID</small>
                        <h2>${currency} ${data.netSalary.toLocaleString()}</h2>
                    </div>
                </div>
            </body>
        </html>
    `);
    win.document.close();
  };

  const filteredPayrolls = payrolls.filter(p => 
    `${p.employee.firstName} ${p.employee.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.payslipRef?.toLowerCase().includes(search.toLowerCase())
  );

  const activePayrolls = payrolls.filter(p => !p.isVoided);
  const totalNetPayable = activePayrolls.reduce((acc, curr) => acc + curr.netSalary, 0);

  if (loading) return <div className="loading-spinner">Loading Payroll Data...</div>;

  return (
    <div className="payroll-container">
      <div className="payroll-header-section">
        <div>
          <h1 className="header-title">Payroll Command Center</h1>
          <p className="header-subtitle">Professional Disbursement & Audit System</p>
        </div>
        <div className="search-wrapper">
          <input
            type="text" 
            className="search-bar" 
            placeholder="Search Name or Ref #..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Net (Active)</span>
          <span className="stat-value">Rs. {totalNetPayable.toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Processed Monthly</span>
          <span className="stat-value">{activePayrolls.length} Employees</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">System Mode</span>
          <span className={`status-pill status-paid`}>Live - Audit Enabled</span>
        </div>
      </div>

      <div className="payroll-card">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Employee / Ref</th>
              <th>Status</th>
              <th>Net Payable</th>
              <th> Bonus</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayrolls.map(p => (
              <tr key={p.payrollId} className={`table-row-hover ${p.isVoided ? 'row-voided' : ''}`}>
                <td>
                  <span className="emp-name" onClick={() => generatePDFView(p)} style={{cursor: 'pointer', color: '#1a73e8'}}>
                    {p.employee.firstName} {p.employee.lastName}
                  </span>
                  <span className="emp-id">{p.payslipRef || `ID: ${p.employee.empId}`}</span>
                </td>
                <td>
                  <span className={`status-badge ${p.isVoided ? 'status-void' : 'status-paid'}`}>
                    {p.isVoided ? 'VOIDED' : p.status}
                  </span>
                </td>
                <td><span className="amount-net">Rs. {p.netSalary.toLocaleString()}</span></td>
                
                {/* Manual Bonus Column */}
                <td>
                  <div className="bonus-action-cell">
                    <input 
                      type="number" 
                      className="bonus-input-small" 
                      placeholder="Bonus"
                      value={bonuses[p.employee.empId] || ""}
                      onChange={(e) => setBonuses({...bonuses, [p.employee.empId]: e.target.value})}
                      disabled={p.isVoided}
                    />
                    <button 
                      className="btn-bonus-add" 
                      onClick={() => handleManualBonus(p.employee.empId, p.employee.firstName)}
                      disabled={p.isVoided}
                    >
                      Add
                    </button>
                  </div>
                </td>

                <td className="actions-cell">
                  <button className="btn-icon btn-pdf" onClick={() => handleViewHistory(p)}>History</button>
                  <button className="btn-icon btn-email" onClick={() => handleEmailDispatch(p)} disabled={p.isVoided}>Email</button>
                  {!p.isVoided && (
                    <button className="btn-icon btn-void" onClick={() => handleVoidPayroll(p)}>Void</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={historyData} 
        employeeName={selectedEmpName}
      />
    </div>
  );
};

export default PayrollManagement;