import React, { useState, useEffect } from 'react';
import api from "../../api/axios"; 
import './Payroll.css';

const AccountantPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewStatus, setViewStatus] = useState("VERIFIED"); 
  
  const [showModal, setShowModal] = useState(false);
  const [selectedEmpHistory, setSelectedEmpHistory] = useState([]);
  const [selectedEmpName, setSelectedEmpName] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 6;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payrolls'); 
      setPayrolls(res.data);
    } catch (err) {
      console.error("System Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    const baseFilter = payrolls.filter(p => {
      const name = `${p.employee?.firstName || ""} ${p.employee?.lastName || ""}`.toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      const matchesStatus = p.status?.toUpperCase() === viewStatus;
      return matchesSearch && matchesStatus;
    });

    if (viewStatus === "PAID") {
      const sorted = [...baseFilter].sort((a, b) => b.payrollId - a.payrollId);
      const uniqueEmpsMap = new Map();
      
      sorted.forEach(record => {
        const empId = record.employee?.id || record.employee?.employeeId;
        const empNameKey = `${record.employee?.firstName}-${record.employee?.lastName}`;
        const uniqueKey = empId || empNameKey;

        if (!uniqueEmpsMap.has(uniqueKey)) {
          uniqueEmpsMap.set(uniqueKey, record);
        }
      });
      return Array.from(uniqueEmpsMap.values());
    }
    
    return baseFilter;
  };

  // --- FIXED: History now filters strictly for ONE employee only ---
  const handleViewHistory = (empId, firstName, lastName) => {
    // 1. Identify the unique employee by ID (or name fallback)
    const specificEmployeeHistory = payrolls.filter(p => {
      const isSameId = empId && p.employee?.id === empId;
      const isSameName = p.employee?.firstName === firstName && p.employee?.lastName === lastName;
      
      // Return true only if it matches this specific person
      return isSameId || isSameName;
    });

    // 2. Sort that specific person's history by date (payrollId)
    const sorted = [...specificEmployeeHistory].sort((a, b) => b.payrollId - a.payrollId);

    setSelectedEmpHistory(sorted);
    setSelectedEmpName(`${firstName} ${lastName}`);
    setShowModal(true);
  };

  const handleRunPayroll = async (payrollId) => {
    try {
      await api.post(`/payrolls/${payrollId}/pay`); 
      alert("Payroll Processed Successfully");
      fetchData();
    } catch (err) {
      console.error("Run Error:", err);
      alert("Failed to process payroll.");
    }
  };

  const filteredRecords = getFilteredData();
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  if (loading) return <div className="loading-state">Syncing Treasury Data...</div>;

  return (
    <div className="content-fade-in">
      <div className="tab-container">
        <button 
          className={`tab-btn ${viewStatus === 'VERIFIED' ? 'active' : ''}`} 
          onClick={() => { setViewStatus('VERIFIED'); setCurrentPage(1); }}
        >
          Verified (Ready)
        </button>
        <button 
          className={`tab-btn ${viewStatus === 'PAID' ? 'active' : ''}`} 
          onClick={() => { setViewStatus('PAID'); setCurrentPage(1); }}
        >
          Paid (Unique Employees)
        </button>
      </div>

      <div className="table-controls">
        <input 
          type="text" 
          placeholder="Search employees..." 
          className="modern-search"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <div className="modern-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Employee Info</th>
              <th>Basic Salary</th>
              <th>Status</th>
              <th className="text-right">Operations</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((p) => (
                <tr key={p.payrollId}>
                  <td>
                    <div className="emp-info">
                      <span className="emp-name">{p.employee?.firstName} {p.employee?.lastName}</span>
                      <span className="emp-id-sub">ID: {p.employee?.id || "N/A"}</span>
                    </div>
                  </td>
                  <td className="currency-font">Rs. {p.grossSalary?.toLocaleString()}</td>
                  <td><span className={`status-tag tag-${p.status?.toLowerCase()}`}>{p.status}</span></td>
                  <td className="text-right">
                    <div className="action-row">
                      {viewStatus === "VERIFIED" && (
                        <button className="run-action" onClick={() => handleRunPayroll(p.payrollId)}>
                          RUN
                        </button>
                      )}
                      <button 
                        className="history-action" 
                        onClick={() => handleViewHistory(p.employee?.id, p.employee?.firstName, p.employee?.lastName)}
                      >
                        HISTORY
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="pagination-bar">
          <span className="pagination-info">Page {currentPage} of {totalPages || 1}</span>
          <div className="pag-nav">
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="pag-btn">Prev</button>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="pag-btn">Next</button>
          </div>
        </div>
      </div>

      {/* --- HISTORY MODAL (Shows ONLY the selected employee) --- */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payroll History: {selectedEmpName}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">&times;</button>
            </div>
            <table className="history-detail-table">
              <thead>
                <tr>
                  <th>Payroll ID</th>
                  <th>Salary Amount</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedEmpHistory.map((h) => (
                  <tr key={h.payrollId}>
                    <td>#{h.payrollId}</td>
                    <td>Rs. {h.grossSalary?.toLocaleString()}</td>
                    <td>
                      <span className={`status-tag tag-${h.status?.toLowerCase()}`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantPayroll;