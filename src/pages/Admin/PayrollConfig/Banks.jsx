import React, { useEffect, useState } from "react";
import api from "../../../api/axios"; 
import ConfirmModal from "../../../components/ConfirmModal";
import "./PayrollConfig.css";

function MessageModal({ show, type, message, onClose }) {
  if (!show) return null;
  return (
    <div className="message-modal-backdrop">
      <div className={`message-modal ${type}`}>
        <p>{message}</p>
        <button onClick={onClose}>Dismiss</button>
      </div>
    </div>
  );
}

export default function Bank() {
  const [banks, setBanks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    branchName: "",
    branchCode: "",
    address: "",
    contactNumber: ""
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [messageData, setMessageData] = useState({ show: false, type: "", message: "" });

  const API_URL = "/banks";

  const showMessage = (type, message) => setMessageData({ show: true, type, message });
  const closeMessage = () => setMessageData({ show: false, type: "", message: "" });

  useEffect(() => { fetchBanks(); }, []);

  const fetchBanks = async () => {
    try {
      const res = await api.get(API_URL);
      setBanks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Failed to fetch banks");
    }
  };

  const startEdit = (b) => {
    setEditingId(b.bankId);
    setAddingNew(false);
    setFormData({ ...b });
  };

  const cancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({ bankName: "", branchName: "", branchCode: "", address: "", contactNumber: "" });
  };

  const saveEdit = async (id) => {
    if (!formData.bankName.trim()) { showMessage("error", "Bank name is required"); return; }
    try {
      if (addingNew) {
        await api.post(API_URL, formData);
        showMessage("success", "Bank created successfully!");
      } else {
        await api.put(`${API_URL}/${id}`, formData);
        showMessage("success", "Bank updated successfully!");
      }
      fetchBanks();
      cancel();
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Failed to save bank");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`${API_URL}/${deleteId}`);
      showMessage("success", "Bank deleted successfully!");
      fetchBanks();
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Cannot delete bank");
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <div className="org-section payroll-bank">
      <MessageModal {...messageData} onClose={closeMessage} />

      <div className="section-header">
        <h3>Banks</h3>
        <button className="add-btn" onClick={() => { setAddingNew(true); setEditingId(null); setFormData({ bankName: "", branchName: "", branchCode: "", address: "", contactNumber: "" }); }}>
          + Add Bank
        </button>
      </div>

      <div className="table-scroll-container">
        <table className="org-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Bank Name</th>
              <th>Branch Name</th>
              <th>Branch Code</th>
              <th>Address</th>
              <th>Contact Number</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {addingNew && (
              <tr className="adding-row">
                <td className="read-only-id">New</td>
                <td><input autoFocus value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} /></td>
                <td><input value={formData.branchName} onChange={e => setFormData({...formData, branchName: e.target.value})} /></td>
                <td><input value={formData.branchCode} onChange={e => setFormData({...formData, branchCode: e.target.value})} /></td>
                <td><input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></td>
                <td><input value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} /></td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn-small save" onClick={() => saveEdit(null)}>Save</button>
                  <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                </td>
              </tr>
            )}

            {banks.map(b => (
              <tr key={b.bankId}>
                <td className="read-only-id">{b.bankId}</td>
                <td>{editingId === b.bankId ? <input value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} /> : b.bankName}</td>
                <td>{editingId === b.bankId ? <input value={formData.branchName} onChange={e => setFormData({...formData, branchName: e.target.value})} /> : b.branchName}</td>
                <td>{editingId === b.bankId ? <input value={formData.branchCode} onChange={e => setFormData({...formData, branchCode: e.target.value})} /> : b.branchCode}</td>
                <td>{editingId === b.bankId ? <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /> : b.address}</td>
                <td>{editingId === b.bankId ? <input value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} /> : b.contactNumber}</td>
                <td style={{ textAlign: 'center' }}>
                  {editingId === b.bankId ? (
                    <>
                      <button className="btn-small save" onClick={() => saveEdit(b.bankId)}>Save</button>
                      <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-small update" onClick={() => startEdit(b)}>Edit</button>
                      <button className="btn-small delete" onClick={() => { setDeleteId(b.bankId); setShowConfirm(true); }}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        show={showConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        message="Delete this bank?"
      />
    </div>
  );
}
