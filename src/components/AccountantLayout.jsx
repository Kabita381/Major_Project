import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import './AccountantLayout.css';

const AccountantLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    localStorage.removeItem("user_session");
    navigate("/");
  };

  return (
    <div className="accountant-container">
      {/* SIDEBAR SECTION */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>NAST</h2>
        </div>
        <nav className="sidebar-menu">
          <Link to="dashboard" className={location.pathname.includes('dashboard') ? 'active' : ''}>
            🏠 Dashboard
          </Link>
          <Link to="salary-management" className={location.pathname.includes('salary') ? 'active' : ''}>
            💸 Salary Management
          </Link>
          <Link to="payroll-processing" className={location.pathname.includes('payroll') ? 'active' : ''}>
            💰 Payroll Processing
          </Link>
          <Link to="tax-compliance" className={location.pathname.includes('tax') ? 'active' : ''}>
            📄 Tax & Compliance
          </Link>
          <Link to="financial-reports" className={location.pathname.includes('report') ? 'active' : ''}>
            📊 Financial Reports
          </Link>
        </nav>
        <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
      </aside>

      {/* MAIN CONTENT SECTION */}
      <main className="main-content">
        {/* HEADER: Search removed from here to prevent duplicates */}
        <header className="top-header">
          <div className="header-left">
            {/* This space is now clean for page-specific content */}
          </div>
          <div className="user-info">
             <div className="status-indicator-active"></div>
             <span>Accountant: Finance Dept</span>
          </div>
        </header>

        <section className="page-body">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AccountantLayout;