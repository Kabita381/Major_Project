import React, { useState, useEffect } from 'react';
import api from "../../api/axios"; 
import './Salary.css';

const Salary = () => {
  const [stats, setStats] = useState({
    totalGross: 0, totalDeductions: 0, totalNet: 0, departments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        // This must match the Controller's @RequestMapping + @GetMapping
        const res = await api.get('/payrolls/summary');
        setStats(res.data);
      } catch (err) {
        console.error("Dashboard connection failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const formatM = (num) => {
    if (!num || isNaN(num)) return "Rs. 0.00M";
    // Sarah & Mike's ~90k will show as 0.09M here. 
    // If you want more detail, use .toLocaleString() instead.
    return `Rs. ${(num / 1000000).toFixed(2)}M`;
  };

  if (loading) return <div className="loading-state">Connecting to Database...</div>;

  return (
    <div className="prof-container">
      <div className="prof-header">
        <h1>Salary Summaries</h1>
        <p>Live departmental expenditure from MySQL Database</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card"><span>Total Gross</span><h2>{formatM(stats.totalGross)}</h2></div>
        <div className="metric-card red-border"><span>Deductions</span><h2>{formatM(stats.totalDeductions)}</h2></div>
        <div className="metric-card green-border"><span>Net Disbursement</span><h2>{formatM(stats.totalNet)}</h2></div>
      </div>

      <div className="prof-card">
        <div className="dept-list">
          {stats.departments && stats.departments.length > 0 ? (
            stats.departments.map((d, i) => (
              <div key={i} className="dept-row">
                <div className="dept-info">
                  <h4>{d.name}</h4>
                  <p>Net Distribution: <strong>Rs. {parseFloat(d.net || 0).toLocaleString()}</strong></p>
                </div>
                <div className="dept-progress-container">
                  <div className="progress-bar">
                    <div className="fill" style={{ width: `${stats.totalNet > 0 ? (d.net / stats.totalNet) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No payroll records found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Salary;