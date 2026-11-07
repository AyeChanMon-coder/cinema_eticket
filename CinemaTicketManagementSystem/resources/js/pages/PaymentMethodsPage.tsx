import { FormEvent, useEffect, useState } from "react";
import api from "../api/axios";

interface PaymentMethod {
  paymentMethodId: number;
  code: string;
  name: string;
  accountName?: string | null;
  accountNumber?: string | null;
  qrCodeImageUrl?: string | null;
  isActive: boolean;
  sortOrder: number | null;
}

type PaymentMethodForm = {
  name: string;
  accountName: string;
  accountNumber: string;
  qrCodeImage: File | null;
};

const emptyForm: PaymentMethodForm = {
  name: "",
  accountName: "",
  accountNumber: "",
  qrCodeImage: null,
};

const getQrImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl, window.location.origin);
    return `${window.location.origin}${url.pathname}`;
  } catch {
    return imageUrl;
  }
};

const PaymentMethodsPage = () => {
  const isSuperadmin = localStorage.getItem("admin_user_type") === "3";
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [form, setForm] = useState<PaymentMethodForm>(emptyForm);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [removeQrImage, setRemoveQrImage] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPaymentMethods = async () => {
    try {
      const response = await api.get("/admin/payment-methods");
      setPaymentMethods(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError("Unable to load payment methods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPaymentMethods();
  }, []);

  const closeForm = () => {
    setForm(emptyForm);
    setEditingPaymentMethod(null);
    setRemoveQrImage(false);
    setIsFormOpen(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("accountName", form.accountName);
      payload.append("accountNumber", form.accountNumber);
      if (editingPaymentMethod) {
        payload.append("_method", "PATCH");
        payload.append("remove_image", String(removeQrImage));
      }
      if (form.qrCodeImage) payload.append("qrCodeImage", form.qrCodeImage);

      await api.post(editingPaymentMethod ? `/admin/payment-methods/${editingPaymentMethod.paymentMethodId}` : "/admin/payment-methods", payload);
      await loadPaymentMethods();
      closeForm();
    } catch {
      setError("Please check the payment method details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setRemoveQrImage(false);
    setForm({
      name: paymentMethod.name,
      accountName: paymentMethod.accountName ?? "",
      accountNumber: paymentMethod.accountNumber ?? "",
      qrCodeImage: null,
    });
    setError("");
    setIsFormOpen(true);
  };

  const remove = async (paymentMethod: PaymentMethod) => {
    if (!window.confirm(`Delete ${paymentMethod.name}?`)) return;

    try {
      await api.delete(`/admin/payment-methods/${paymentMethod.paymentMethodId}`);
      setPaymentMethods((current) => current.filter((item) => item.paymentMethodId !== paymentMethod.paymentMethodId));
    } catch {
      setError("Unable to delete this payment method. It may already be in use.");
    }
  };

  const filteredPaymentMethods = paymentMethods.filter((paymentMethod) =>
    `${paymentMethod.code} ${paymentMethod.name} ${paymentMethod.accountName ?? ""} ${paymentMethod.accountNumber ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="page-container">
      <div className="page-head">
        <div>
          <p className="eyebrow">Payment configuration</p>
          <h1>Payment Methods</h1>
          <p className="page-sub">Manage the payment channels available for customer bookings.</p>
        </div>
        {isSuperadmin && <button className="btn-primary" type="button" onClick={() => { setForm(emptyForm); setError(""); setIsFormOpen(true); }}>+ Add payment method</button>}
      </div>

      {!isSuperadmin && <p className="payment-readonly-note">Read-only payment methods. Contact a superadmin to add or remove a payment channel.</p>}
      {error && <p className="tbl-state error">{error}</p>}
      <section className="card">
        <div className="tbl-toolbar"><input className="tbl-search" aria-label="Search payment methods" placeholder="Search payment methods..." value={search} onChange={(event) => setSearch(event.target.value)} /><span className="tbl-count">{filteredPaymentMethods.length} methods</span></div>
        {loading ? <p className="tbl-state">Loading payment methods...</p> : <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Method</th><th>Account</th><th>QR code</th><th>Status</th>{isSuperadmin && <th>Actions</th>}</tr></thead><tbody>{filteredPaymentMethods.map((paymentMethod) => { const qrImageUrl = getQrImageUrl(paymentMethod.qrCodeImageUrl); return <tr key={paymentMethod.paymentMethodId}><td><strong>{paymentMethod.name}</strong><br /><small>{paymentMethod.code}</small></td><td>{paymentMethod.accountName || "-"}<br />{paymentMethod.accountNumber || "-"}</td><td>{qrImageUrl ? <a href={qrImageUrl} target="_blank" rel="noreferrer"><img src={qrImageUrl} alt={`${paymentMethod.name} QR code`} style={{ width: 64, height: 64, objectFit: "contain" }} /></a> : "-"}</td><td><span className={`badge ${paymentMethod.isActive ? "payment-status-approved" : "payment-status-rejected"}`}>{paymentMethod.isActive ? "Active" : "Inactive"}</span></td>{isSuperadmin && <td><button className="btn-sm" type="button" onClick={() => edit(paymentMethod)}>Edit</button> <button className="btn-sm btn-del" type="button" onClick={() => void remove(paymentMethod)}>Delete</button></td>}</tr>; })}</tbody></table>{!filteredPaymentMethods.length && <p className="tbl-empty">No payment methods found.</p>}</div>}
      </section>

      {isFormOpen && <div className="modal-overlay"><dialog open className="modal" aria-labelledby="payment-method-modal-title"><div className="modal-head"><div><p className="eyebrow">Payment configuration</p><h2 id="payment-method-modal-title">{editingPaymentMethod ? "Edit payment method" : "Add payment method"}</h2></div><button className="modal-close" type="button" aria-label="Close" onClick={closeForm}>×</button></div><form onSubmit={submit} encType="multipart/form-data">{editingPaymentMethod && getQrImageUrl(editingPaymentMethod.qrCodeImageUrl) && !removeQrImage && <div className="current-poster-preview"><img src={getQrImageUrl(editingPaymentMethod.qrCodeImageUrl) ?? undefined} alt={`${editingPaymentMethod.name} QR code`} /><span>Current QR code</span><button className="poster-remove" type="button" onClick={() => setRemoveQrImage(true)}>Remove</button></div>}<div className="modal-field"><label htmlFor="payment-method-name">Name</label><input id="payment-method-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. KPay" required /></div><div className="modal-field"><label htmlFor="payment-method-account-name">Account name</label><input id="payment-method-account-name" value={form.accountName} onChange={(event) => setForm({ ...form, accountName: event.target.value })} /></div><div className="modal-field"><label htmlFor="payment-method-account-number">Account number</label><input id="payment-method-account-number" value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value })} /></div><div className="modal-field"><label htmlFor="payment-method-qr-image">{editingPaymentMethod ? "Replace QR code image" : "QR code image (optional)"}</label><input id="payment-method-qr-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setRemoveQrImage(false); setForm({ ...form, qrCodeImage: event.target.files?.[0] ?? null }); }} /></div><div className="modal-actions"><button className="btn-secondary" type="button" onClick={closeForm}>Cancel</button><button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : editingPaymentMethod ? "Save changes" : "Create payment method"}</button></div></form></dialog></div>}
    </div>
  );
};

export default PaymentMethodsPage;
