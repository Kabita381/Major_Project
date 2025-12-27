import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalWorkforce: 0,
    dailyAttendance: "0%",
    leaveRequests: "00"
  });
  const [recentAttendance, setRecentAttendance] = useState([]);

  // Formats bulky ISO strings into professional time (e.g., 02:45 pm)
  const formatTime = (timeString) => {
    if (!timeString) return "---";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return timeString;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch top stats cards
        const statsRes = await axios.get('http://localhost:8080/api/dashboard/stats');
        setStats({
          totalWorkforce: statsRes.data.totalWorkforce,
          dailyAttendance: statsRes.data.dailyAttendance,
          leaveRequests: statsRes.data.leaveRequests.toString().padStart(2, '0')
        });

        // Fetch today's attendance records
        const attendanceRes = await axios.get('http://localhost:8080/api/dashboard/recent-attendance');
        setRecentAttendance(attendanceRes.data); 

      } catch (error) {
        console.error("Dashboard failed to fetch data:", error);
      }
    };
    fetchDashboardData();
  }, []);

  const adminStats = [
    { title: "TOTAL WORKFORCE", value: stats.totalWorkforce, icon: "👥" },
    { title: "DAILY ATTENDANCE", value: stats.dailyAttendance, icon: "📅" },
    { title: "LEAVE REQUESTS", value: stats.leaveRequests, icon: "📝" }
  ];

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <p>Real-time summary of the NAST Payroll Management System</p>
        </div>

        <div className="top-stats-grid">
          {adminStats.map((stat, index) => (
            <div key={index} className="horizontal-stat-card">
              <div className="stat-icon-container">
                <span className="icon-main">{stat.icon}</span>
              </div>
              <div className="stat-text-content">
                <span className="stat-label-top">{stat.title}</span>
                <h2 className="stat-value-large">{stat.value}</h2>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-recent-section">
          <h3 className="section-divider-title">Recent Attendance (Today)</h3>
          <div className="recent-table-container">
            <table className="recent-attendance-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Designation</th>
                  <th>Check-In Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.length > 0 ? (
                  recentAttendance.map((record, index) => (
                    <tr key={index}>
                      <td>{record.employee.firstName} {record.employee.lastName}</td>
                      {/* Accessing Employee -> Position (Designation object) -> designationTitle */}
                      <td>{record.employee.position?.designationTitle || "N/A"}</td>
                      <td className="time-cell">{formatTime(record.checkInTime)}</td>
                      <td><span className="status-badge present">Present</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">No attendance recorded today</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;