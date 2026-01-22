import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from "chart.js";
import api from "../../api/axios";
import "./Report.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

export default function Report() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const [payrollSummary, setPayrollSummary] = useState({
    totalEmployees: 0,
    monthlyPayroll: 0,
    totalDeductions: 0,
    totalAllowances: 0,
    pendingLeaves: 0
  });

  const [monthlyPayrollData, setMonthlyPayrollData] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0
  });

  useEffect(() => {
    fetchPayrollData();
  }, [year]);

  useEffect(() => {
    fetchAttendanceData();
  }, [year, month]);

  const fetchPayrollData = async () => {
    try {
      const [summaryRes, monthlyRes] = await Promise.all([
        api.get(`/reports/analytics/summary?year=${year}`),
        api.get(`/reports/analytics/monthly-payroll?year=${year}`)
      ]);
      setPayrollSummary(summaryRes.data);
      setMonthlyPayrollData(monthlyRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const res = await api.get(
        `/reports/attendance/summary?year=${year}&month=${month}`
      );
      setAttendanceSummary(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const payrollChart = {
    labels: monthlyPayrollData.map(item => item.month),
    datasets: [
      {
        label: "Expenditure (NPR)",
        data: monthlyPayrollData.map(item => item.amount),
        backgroundColor: "rgba(25, 118, 210, 0.8)",
        borderRadius: 6,
        hoverBackgroundColor: "#1976d2"
      }
    ]
  };

  return (
    <div className="report-container">
      {/* 1. TOP TOOLBAR */}
      <div className="report-toolbar">
        <div className="text-content">
          <h1>Analytics Overview</h1>
          <p>Real-time payroll & attendance insights</p>
        </div>

        <div className="filter-group">
          <div className="select-box">
            <span>Year</span>
            <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {[0, 1, 2, 3, 4].map(i => (
                <option key={i} value={currentYear - i}>
                  {currentYear - i}
                </option>
              ))}
            </select>
          </div>

          <div className="select-box">
            <span>Month</span>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
          </div>

          {/* ❌ Download button removed */}
        </div>
      </div>

      {/* 2. TOP STATS RIBBON */}
      <div className="stats-ribbon">
        <StatItem
          title="Staff Count"
          value={payrollSummary.totalEmployees}
          icon="👥"
          color="#3b82f6"
        />
        <StatItem
          title="Total Payroll"
          value={`Rs. ${payrollSummary.monthlyPayroll?.toLocaleString()}`}
          icon="💰"
          color="#10b981"
        />
        <StatItem
          title="Deductions"
          value={`Rs. ${payrollSummary.totalDeductions?.toLocaleString()}`}
          icon="📉"
          color="#ef4444"
        />
        <StatItem
          title="Allowances"
          value={`Rs. ${payrollSummary.totalAllowances?.toLocaleString()}`}
          icon="🧾"
          color="#8b5cf6"
        />
      </div>

      <div className="main-content-grid">
        {/* 3. CHART SECTION */}
        <div className="content-card chart-card">
          <div className="card-header">
            <h3>Monthly Payroll Expenditure</h3>
          </div>

          <div className="chart-wrapper">
            {monthlyPayrollData.length > 0 ? (
              <Bar
                data={payrollChart}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            ) : (
              <div className="empty-state">No data for {year}</div>
            )}
          </div>
        </div>

        {/* 4. ATTENDANCE SECTION */}
        <div className="content-card attendance-card">
          <div className="card-header">
            <h3>Attendance Breakdown</h3>
            <span className="date-tag">
              {month}/{year}
            </span>
          </div>

          <div className="attendance-list">
            <div className="att-item present">
              <span className="dot"></span>
              <span className="label">Present Days</span>
              <span className="count">{attendanceSummary.presentDays}</span>
            </div>

            <div className="att-item absent">
              <span className="dot"></span>
              <span className="label">Absent Days</span>
              <span className="count">{attendanceSummary.absentDays}</span>
            </div>

            <div className="att-item leave">
              <span className="dot"></span>
              <span className="label">On Leave</span>
              <span className="count">{attendanceSummary.leaveDays}</span>
            </div>

            <hr />

            <div className="att-item pending">
              <span className="label">Pending Approval</span>
              <span className="count highlight">
                {payrollSummary.pendingLeaves}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ title, value, icon, color }) {
  return (
    <div className="stat-item" style={{ borderLeft: `4px solid ${color}` }}>
      <div
        className="stat-icon"
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-title">{title}</span>
        <span className="stat-value">{value}</span>
      </div>
    </div>
  );
}
