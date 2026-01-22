import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import "./SalaryAnalytics.css";
import { jsPDF } from "jspdf";

const SalaryAnalytics = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!selectedMonth) return;

    const fetchSalary = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const monthIndex = months.indexOf(selectedMonth) + 1;
        const formattedMonth = `${currentYear}-${monthIndex
          .toString()
          .padStart(2, "0")}`;

        const response = await api.get("/salary-analytics/me", {
          params: { month: formattedMonth },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        /* -----------------------------
           NORMALIZE BACKEND RESPONSE
        ------------------------------ */
        const raw = response.data;

        const normalizedData = {
          baseSalary: raw.baseSalary ?? raw.basicSalary ?? 0,
          totalAllowances: raw.totalAllowances ?? raw.totalAllowance ?? 0,
          totalDeductions: raw.totalDeductions ?? raw.totalDeduction ?? 0,
          netSalary: raw.netSalary ?? raw.netPay ?? 0,
          employeeName: raw.employeeName ?? raw.employeeFullName ?? "N/A",
          designation: raw.designation ?? raw.jobTitle ?? "N/A",
          bankName: raw.bankName ?? "N/A",
          bankAccount: raw.bankAccount ?? "N/A"
        };

        setSalaryData(normalizedData);
      } catch (err) {
        console.error(err);
        setSalaryData(null);
        setError(`No salary records found for ${selectedMonth}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSalary();
  }, [selectedMonth, currentYear]);

  /* -----------------------------
      PDF GENERATION
  ------------------------------ */
  

const handleDownloadPDF = () => {
  if (!salaryData) return;

  const doc = new jsPDF();
  const primaryColor = [0, 70, 180];
  const secondaryColor = [245, 247, 250];
  let y = 20;

  // Helper function for right-aligned currency
  const rightAlign = (text, x) => doc.text(text, x, y, { align: "right" });

  /* ===============================
      HEADER SECTION
  =============================== */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text("NAST COLLEGE", 20, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Dhangadhi, Nepal | contact@nast.edu.np", 20, y + 7);
  doc.text(`Pay Period: ${selectedMonth} ${currentYear}`, 20, y + 12);

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("SALARY SLIP", 160, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`#PAY-${salaryData.user_id || '001'}`, 160, y + 7, { align: "right" });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 160, y + 12, { align: "right" });

  y += 20;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);

  /* ===============================
      EMPLOYEE INFO GRID
  =============================== */
  y += 10;
  doc.setFillColor(...secondaryColor);
  doc.roundedRect(20, y, 170, 35, 2, 2, "F");

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("EMPLOYEE NAME", 25, y + 10);
  doc.text("DESIGNATION", 85, y + 10);
  doc.text("DEPARTMENT", 145, y + 10);

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(salaryData.employeeName.toUpperCase(), 25, y + 16);
  doc.text(salaryData.designation || "Staff", 85, y + 16);
  doc.text(salaryData.department || "Administration", 145, y + 16);

  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("BANK ACCOUNT", 25, y + 26);
  doc.text("EMPLOYMENT STATUS", 85, y + 26);

  doc.setTextColor(0);
  doc.text(`${salaryData.bankName} - ${salaryData.bankAccount}`, 25, y + 32);
  doc.text("Full-Time", 85, y + 32);

  /* ===============================
      EARNINGS & DEDUCTIONS TABLE
  =============================== */
  y += 50;
  doc.setFillColor(...primaryColor);
  doc.rect(20, y, 85, 8, "F"); // Earnings Header
  doc.rect(105, y, 85, 8, "F"); // Deductions Header

  doc.setTextColor(255);
  doc.setFontSize(10);
  doc.text("EARNINGS", 25, y + 5);
  doc.text("DEDUCTIONS", 110, y + 5);

  y += 15;
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");

  // Row 1: Basic Salary & TDS
  doc.text("Basic Salary", 25, y);
  rightAlign(`Rs. ${salaryData.baseSalary.toLocaleString()}`, 100);
  
  doc.text("TDS / Tax", 110, y);
  rightAlign(`Rs. ${salaryData.totalDeductions.toLocaleString()}`, 185);

  // Row 2: Allowances (Dynamic based on your SQL schema)
  y += 10;
  doc.text("Allowances", 25, y);
  rightAlign(`Rs. ${(salaryData.totalallowance || 0).toLocaleString()}`, 100);
  
  doc.text("Other Deductions", 110, y);
  rightAlign(`Rs. ${salaryData.otherDeductions || "0.00"}`, 185);

  // Total Row
  y += 15;
  doc.setDrawColor(200);
  doc.line(20, y - 5, 190, y - 5);
  doc.setFont("helvetica", "bold");
  doc.text("Gross Earnings", 25, y);
  rightAlign(`Rs. ${(salaryData.baseSalary + (salaryData.allowances || 0)).toLocaleString()}`, 100);

  /* ===============================
      NET DISBURSEMENT FOOTER
  =============================== */
  y += 20;
  doc.setFillColor(...primaryColor);
  doc.rect(20, y, 170, 25, "F");

  doc.setTextColor(255);
  doc.setFontSize(10);
  doc.text("TOTAL NET DISBURSEMENT", 25, y + 8);
  doc.setFontSize(18);
  doc.text(`NPR. ${salaryData.netSalary.toLocaleString()}`, 25, y + 18);

  doc.setFontSize(10);
  doc.text("Status: PAID", 185, y + 18, { align: "right" });

  /* ===============================
      FOOTER NOTE
  =============================== */
  doc.save(`Payslip_${salaryData.employeeName}_${selectedMonth}.pdf`);
};

  return (
    <div className="analytics-container">
      {/* Header */}
      <header className="analytics-header">
        <div className="title-group">
          <h1>Salary Analytics</h1>
          <p className="subtitle">
            Insights for {selectedMonth || "..."} {currentYear}
          </p>
        </div>

        <div className="toolbar">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">Choose Month</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <button
            className="btn-download"
            disabled={!salaryData}
            onClick={handleDownloadPDF}
          >
            Download Payslip
          </button>
        </div>
      </header>

      {loading && <div className="state-msg">Processing data...</div>}
      {error && <div className="state-msg error-msg">{error}</div>}

      {salaryData && !loading && (
        <main className="fade-in">
          {/* Net Salary Card */}
          <section className="hero-card">
            <span className="hero-label">Net Salary</span>
            <h2>
              NPR {salaryData.netSalary.toLocaleString()}
            </h2>
          </section>

          {/* Details */}
          <div className="details-grid">
            <div className="glass-card">
              <h3>Financial Breakdown</h3>

              <div className="data-row">
                <span>Base Salary</span>
                <span>Rs. {salaryData.baseSalary.toLocaleString()}</span>
              </div>

              <div className="data-row success">
                <span>Allowances</span>
                <span>+ Rs. {salaryData.totalAllowances.toLocaleString()}</span>
              </div>

              <div className="data-row danger">
                <span>Deductions</span>
                <span>- Rs. {salaryData.totalDeductions.toLocaleString()}</span>
              </div>

              <div className="data-row highlight">
                <span>Net Salary</span>
                <span>Rs. {salaryData.netSalary.toLocaleString()}</span>
              </div>
            </div>

            <div className="glass-card">
              <h3>Employee Information</h3>

              <p><strong>Name:</strong> {salaryData.employeeName}</p>
              <p><strong>Designation:</strong> {salaryData.designation}</p>
              <p>
                <strong>Bank:</strong> {salaryData.bankName} (
                {salaryData.bankAccount})
              </p>
            </div>
          </div>
        </main>
      )}
    </div>
  );

};

export default SalaryAnalytics;
