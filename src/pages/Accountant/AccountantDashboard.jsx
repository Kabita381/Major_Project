import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AccountantDashboard.css';

const AccountantDashboard = () => {
  const [metrics, setMetrics] = useState({
    monthlyPayrollTotal: 0,
    payrollStatus: "Loading...",
    compliancePercentage: 0,
    pendingVerifications: 0
  });

  useEffect(() => {
    // Fetch critical metrics from the backend
    axios.get('http://localhost:8080/api/salary-summary/command-center')
      .then(res => {
        setMetrics(res.data);
      })
      .catch(err => {
        console.error("Dashboard data fetch failed:", err);
      });
  }, []);

  // Formatter for "Rs. 4.2M" style
  const formatM = (num) => `Rs. ${(num / 1000000).toFixed(1)}M`;

  return (
    <div className="pro-dash-content">
      <header className="pro-dash-header">
        <div className="header-text">
          <h1>Accountant <span className="highlight">Command Center</span></h1>
          <p>Real-time payroll status for NAST System • Fiscal Year 2025/26</p>
        </div>
        <div className="header-date">
          <span className="calendar-icon">📅</span> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </header>

      <section className="kpi-stack-section">
        <div className="section-header-flex">
            <h3 className="sub-section-title">Critical Metrics</h3>
            <span className="live-indicator">● LIVE DATA</span>
        </div>
        
        <div className="vertical-kpi-stack">
          
          {/* Monthly Payroll Row */}
          <div className="kpi-linear-card blue-glow">
            <div className="kpi-icon-container">💰</div>
            <div className="kpi-main-info">
              <span className="kpi-tag">Monthly Payroll</span>
              <h2 className="kpi-amount">{formatM(metrics.monthlyPayrollTotal)}</h2>
            </div>
            <div className="kpi-meta">
              <span className="meta-label">Status</span>
              <span className="status-pill status-active">{metrics.payrollStatus}</span>
            </div>
          </div>

          {/* Tax Compliance Row */}
          <div className="kpi-linear-card indigo-glow">
            <div className="kpi-icon-container">🏛️</div>
            <div className="kpi-main-info">
              <span className="kpi-tag">Tax & SSF Compliance</span>
              <h2 className="kpi-amount">{metrics.compliancePercentage}% Verified</h2>
            </div>
            <div className="kpi-meta">
              <span className="meta-label">Audit</span>
              <span className="status-pill status-secure">Government Compliant</span>
            </div>
          </div>

          {/* Pending Verifications Row */}
          <div className="kpi-linear-card amber-glow">
            <div className="kpi-icon-container">⏳</div>
            <div className="kpi-main-info">
              <span className="kpi-tag">Pending Verifications</span>
              <h2 className="kpi-amount">{metrics.pendingVerifications} Records</h2>
            </div>
            <div className="kpi-meta">
              <span className="meta-label">Action</span>
              <span className="status-pill status-warn">Review Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Management Portals Section has been removed to keep focus on reporting */}
    </div>
  );
};

export default AccountantDashboard;