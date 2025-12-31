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

export default function PaymentMethod() {
  const [methods, setMethods] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState({ methodName: "", details: "" });

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [messageData, setMessageData] = useState({ show: false, type: "", message: "" });

  const API_URL = "/payment-methods";

  const showMessage = (type, message) => setMessageData({ show: true, type, message });
  const closeMessage = () => setMessageData({ show: false, type: "", message: "" });

  useEffect(() => { fetchMethods(); }, []);

  const fetchMethods = async () => {
    try {
      const res = await api.get(API_URL);
      setMethods(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Failed to fetch payment methods");
    }
  };

  const startEdit = (m) => {
    setEditingId(m.paymentMethodId);
    setAddingNew(false);
    setFormData({ ...m });
  };

  const cancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({ methodName: "", details: "" });
  };

  const saveEdit = async (id) => {
    if (!formData.methodName.trim()) { showMessage("error", "Method name is required"); return; }
    try {
      if (addingNew) {
        await api.post(API_URL, formData);
        showMessage("success", "Payment method added!");
      } else {
        await api.put(`${API_URL}/${id}`, formData);
        showMessage("success", "Payment method updated!");
      }
      fetchMethods();
      cancel();
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Failed to save payment method");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`${API_URL}/${deleteId}`);
      showMessage("success", "Payment method deleted!");
      fetchMethods();
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Cannot delete payment method");
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <div className="org-section payroll-payment-method">
      <MessageModal {...messageData} onClose={closeMessage} />

      <div className="section-header">
        <h3>Payment Methods</h3>
        <button className="add-btn" onClick={() => { setAddingNew(true); setEditingId(null); setFormData({ methodName: "", details: "" }); }}>
          + Add Method
        </button>
      </div>

      <div className="table-scroll-container">
        <table className="org-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Method Name</th>
              <th>Details</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {addingNew && (
              <tr className="adding-row">
                <td className="read-only-id">New</td>
                <td><input autoFocus value={formData.methodName} onChange={e => setFormData({...formData, methodName: e.target.value})} /></td>
                <td><input value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} /></td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn-small save" onClick={() => saveEdit(null)}>Save</button>
                  <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                </td>
              </tr>
            )}

            {methods.map(m => (
              <tr key={m.paymentMethodId}>
                <td className="read-only-id">{m.paymentMethodId}</td>
                <td>{editingId === m.paymentMethodId ? <input value={formData.methodName} onChange={e => setFormData({...formData, methodName: e.target.value})} /> : m.methodName}</td>
                <td>{editingId === m.paymentMethodId ? <input value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} /> : m.details}</td>
                <td style={{ textAlign: 'center' }}>
                  {editingId === m.paymentMethodId ? (
                    <>
                      <button className="btn-small save" onClick={() => saveEdit(m.paymentMethodId)}>Save</button>
                      <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-small update" onClick={() => startEdit(m)}>Edit</button>
                      <button className="btn-small delete" onClick={() => { setDeleteId(m.paymentMethodId); setShowConfirm(true); }}>Delete</button>
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
        message="Delete this payment method?"
      />
    </div>
  );
}
