import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import "./Payroll.css";

const PayrollManagement = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayrolls();
  }, []);

  const loadPayrolls = async () => {
    try {
      const res = await api.get("/payrolls");
      setPayrolls(res.data);
    } catch (err) {
      console.error("Failed to fetch payrolls", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Stats Calculation ---
  const totalNetPayable = payrolls.reduce((acc, curr) => acc + curr.netSalary, 0);
  const processedCount = payrolls.length;

  // --- System Audit Logging ---
  const logAction = async (payrollId, actionType, employeeName) => {
    try {
      await api.post("/payroll-audit", {
        payrollId: payrollId,
        action: actionType,
        details: `${actionType === 'EMAIL_SENT' ? 'Payslip emailed' : 'Payslip viewed'} for ${employeeName}`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Audit logging failed", err);
    }
  };

  // --- Email Service ---
  const handleEmailDispatch = async (payroll) => {
    const fullName = `${payroll.employee.firstName} ${payroll.employee.lastName}`;
    if (window.confirm(`Send digital payslip to ${fullName}?`)) {
      try {
        await api.post(`/payrolls/${payroll.payrollId}/send-email`);
        await logAction(payroll.payrollId, "EMAIL_SENT", fullName);
        alert("Success: Digital payslip dispatched.");
      } catch (err) {
        alert("Error: Email service unavailable.");
      }
    }
  };

  // --- PDF Generation Logic ---
  const generatePDFView = async (data) => {
    const fullName = `${data.employee.firstName} ${data.employee.lastName}`;
    
    // 1. Log the audit action
    await logAction(data.payrollId, "PAYSLIP_VIEWED", fullName);

    // 2. Open new window and generate content
    const win = window.open("", "_blank");
    const totalEarnings = data.grossSalary + (data.totalAllowances || 0);
    const totalDeductions = (data.totalDeductions || 0) + (data.totalTax || 0);

    win.document.write(`
        <html>
            <head>
                <title>Payslip - ${fullName}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
                    .payslip-container { max-width: 800px; margin: auto; border: 1px solid #ddd; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; border-bottom: 3px solid #1a73e8; padding-bottom: 10px; margin-bottom: 25px; }
                    .header h1 { margin: 0; color: #1a73e8; letter-spacing: 1px; }
                    .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th { background: #f8f9fa; padding: 12px; border: 1px solid #dee2e6; text-align: left; font-size: 12px; text-transform: uppercase; }
                    td { padding: 12px; border: 1px solid #dee2e6; font-size: 13px; }
                    .text-right { text-align: right; font-weight: bold; }
                    .net-box { background: #1a73e8; color: white; padding: 20px; text-align: right; border-radius: 4px; margin-top: 20px; }
                    .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #777; }
                    @media print { .no-print { display: none; } .payslip-container { border: none; box-shadow: none; } }
                </style>
            </head>
            <body>
                <div class="payslip-container">
                    <div class="header">
                        <h1>NAST COLLEGE</h1>
                        <p>Dhangadhi, Nepal | Monthly Salary Slip</p>
                    </div>
                    <div class="info-section">
                        <div>
                            <p><strong>Employee:</strong> ${fullName}</p>
                            <p><strong>Employee ID:</strong> #${data.employee.empId}</p>
                            <p><strong>Pay Period:</strong> ${data.payPeriodStart || 'N/A'} - ${data.payPeriodEnd || 'N/A'}</p>
                        </div>
                        <div style="text-align: right">
                            <p><strong>Payroll ID:</strong> #${data.payrollId}</p>
                            <p><strong>Pay Date:</strong> ${data.payDate || 'N/A'}</p>
                            <p><strong>Bank Account:</strong> ${data.paymentAccount ? data.paymentAccount.accountNumber : 'N/A'}</p>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Earnings Component</th><th class="text-right">Amount</th>
                                <th>Deductions Component</th><th class="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Basic Gross Salary</td><td class="text-right">Rs. ${data.grossSalary.toLocaleString()}</td>
                                <td>TDS / Income Tax</td><td class="text-right">Rs. ${data.totalTax.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td>Total Allowances</td><td class="text-right">Rs. ${(data.totalAllowances || 0).toLocaleString()}</td>
                                <td>Other Deductions</td><td class="text-right">Rs. ${(data.totalDeductions || 0).toLocaleString()}</td>
                            </tr>
                            <tr style="background:#f1f3f4; font-weight:bold;">
                                <td>Total Earnings (A)</td><td class="text-right">Rs. ${totalEarnings.toLocaleString()}</td>
                                <td>Total Deductions (B)</td><td class="text-right">Rs. ${totalDeductions.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="net-box">
                        <div style="font-size: 14px;">NET PAYABLE (A - B)</div>
                        <h2 style="margin: 5px 0 0 0;">Rs. ${data.netSalary.toLocaleString()}</h2>
                    </div>
                    <div class="footer">
                        <p>This is a system-generated document and does not require a physical signature.</p>
                        <p>Generated on ${new Date().toLocaleString()}</p>
                    </div>
                </div>
                <div class="no-print" style="text-align:center; margin-top:20px;">
                    <button onclick="window.print()" style="padding:12px 25px; background:#1a73e8; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">Print Now</button>
                </div>
            </body>
        </html>
    `);
    win.document.close();
  };

  const filteredPayrolls = payrolls.filter(p => 
    `${p.employee.firstName} ${p.employee.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.employee.empId.toString().includes(search)
  );

  return (
    <div className="payroll-container">
      <div className="payroll-header-section">
        <div>
          <h1 className="header-title">Payroll Command Center</h1>
          <p className="header-subtitle">Manage and disburse employee salaries with full audit tracking</p>
        </div>
        <div className="search-wrapper">
          <input
            type="text" 
            className="search-bar" 
            placeholder="Search Name or Employee ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card clickable-card">
          <span className="stat-label">Total Net Disbursement</span>
          <span className="stat-value">Rs. {totalNetPayable.toLocaleString()}</span>
        </div>
        <div className="stat-card clickable-card">
          <span className="stat-label">Employees Processed</span>
          <span className="stat-value">{processedCount} Records</span>
        </div>
        <div className="stat-card clickable-card">
          <span className="stat-label">System Status</span>
          <span className="stat-status-badge">Live Gateway</span>
        </div>
      </div>

      <div className="payroll-card">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Grade</th>
              <th>Gross Salary</th>
              <th>Tax/Deductions</th>
              <th>Net Payable</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayrolls.map(p => (
              <tr key={p.payrollId} className="table-row-hover">
                <td>
                  <span className="emp-name">{p.employee.firstName} {p.employee.lastName}</span>
                  <span className="emp-id">ID: {p.employee.empId}</span>
                </td>
                <td><span className="grade-badge">{p.employee.salaryGrade?.gradeName || "N/A"}</span></td>
                <td className="amount-text">Rs. {p.grossSalary.toLocaleString()}</td>
                <td className="amount-tax">-Rs. {(p.totalTax + p.totalDeductions).toLocaleString()}</td>
                <td>
                  <span className="amount-net">Rs. {p.netSalary.toLocaleString()}</span>
                </td>
                <td className="actions-cell">
                  {/* Fixed Click Event Here */}
                  <button className="btn-icon btn-pdf" onClick={() => generatePDFView(p)}>
                    View PDF
                  </button>
                  <button className="btn-icon btn-email" onClick={() => handleEmailDispatch(p)}>
                    Email
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPayrolls.length === 0 && !loading && (
          <div className="empty-state">No payroll records found for "{search}"</div>
        )}
      </div>
    </div>
  );
};

export default PayrollManagement;