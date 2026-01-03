import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import "./Payroll.css";

const PayrollManagement = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadPayrolls();
    }, []);

    const loadPayrolls = async () => {
        const res = await api.get("/payrolls");
        setPayrolls(res.data);
    };

    const handleEmailDispatch = async (id) => {
        try {
            await api.post(`/payrolls/${id}/send-email`);
            alert("Success: Payslip sent to employee's registered email.");
        } catch (err) {
            alert("Error: Access Denied or Email server down.");
        }
    };

    const generatePDFView = (data) => {
        // Logic to open a new window with a printable PDF-style layout
        const win = window.open("", "_blank");
        win.document.write(`
            <html>
                <style>
                    body { font-family: sans-serif; padding: 50px; }
                    .header { text-align: center; border-bottom: 2px solid #444; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
                    .total-box { margin-top: 40px; padding: 20px; background: #f4f7f9; text-align: right; }
                </style>
                <body>
                    <div class="header">
                        <h1>NAST COLLEGE</h1>
                        <p>Dhangadhi, Nepal | Salary Slip</p>
                    </div>
                    <h3>Employee: ${data.employee.firstName} ${data.employee.lastName}</h3>
                    <div class="grid">
                        <div><strong>Earnings</strong><br/>Basic + Allowances: Rs. ${data.grossSalary}</div>
                        <div><strong>Deductions</strong><br/>Tax: Rs. ${data.totalTax.toFixed(2)}<br/>Others: Rs. ${data.totalDeductions}</div>
                    </div>
                    <div class="total-box">
                        <h2>Net Payable: Rs. ${data.netSalary.toLocaleString()}</h2>
                    </div>
                </body>
            </html>
        `);
    };

    const filtered = payrolls.filter(p => 
        (p.employee.firstName + " " + p.employee.lastName).toLowerCase().includes(search.toLowerCase()) ||
        p.employee.empId.toString().includes(search)
    );

    return (
        <div className="payroll-container">
            <div className="payroll-header-section">
                <h2>Payroll Command Center</h2>
                <input 
                    className="search-bar" 
                    placeholder="Search by Name or Employee ID..." 
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="payroll-card">
                <table className="payroll-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Gross Earnings</th>
                            <th>Total Deductions</th>
                            <th>Net Payable</th>
                            <th>Dispatch Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(p => (
                            <tr key={p.payrollId}>
                                <td>
                                    <span className="emp-name">{p.employee.firstName} {p.employee.lastName}</span>
                                    <span className="emp-id">ID: {p.employee.empId}</span>
                                </td>
                                <td>Rs. {p.grossSalary.toLocaleString()}</td>
                                <td style={{color: '#f5365c'}}>Rs. {(p.totalDeductions + p.totalTax).toLocaleString()}</td>
                                <td><span className="amount-net">Rs. {p.netSalary.toLocaleString()}</span></td>
                                <td className="actions-cell">
                                    <button className="btn-icon btn-pdf" onClick={() => generatePDFView(p)}>
                                        View PDF
                                    </button>
                                    <button className="btn-icon btn-email" onClick={() => handleEmailDispatch(p.payrollId)}>
                                        Send Email
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PayrollManagement;