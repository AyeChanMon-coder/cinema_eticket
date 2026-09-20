import { useEffect, useState } from "react";
import api from "../api/axios";

interface Payment {
  paymentId: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: "pending" | "approved" | "rejected" | string;
  paymentSlipUrl?: string | null;
  bookingId: number;
  booking?: { user?: { name?: string; email?: string } };
}

const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<{ url: string; paymentId: number } | null>(null);

  const loadPayments = async () => {
    try {
      const response = await api.get("/admin/payments");
      setPayments(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError("Unable to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadPayments(); }, []);

  const updateStatus = async (payment: Payment, paymentStatus: "approved" | "rejected") => {
    setUpdatingId(payment.paymentId);
    setError("");
    try {
      const response = await api.patch(`/admin/payments/${payment.paymentId}/status`, { paymentStatus });
      setPayments((current) => current.map((item) => item.paymentId === payment.paymentId ? { ...item, paymentStatus: response.data.paymentStatus } : item));
    } catch {
      setError("Unable to update this payment status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredPayments = payments.filter((payment) => `${payment.paymentId} ${payment.bookingId} ${payment.paymentMethod} ${payment.paymentStatus} ${payment.booking?.user?.name ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const getSlipUrl = (paymentSlipUrl: string) => paymentSlipUrl.startsWith("/") ? `${window.location.origin}${paymentSlipUrl}` : paymentSlipUrl;

  return (
    <div className="page-container">
      <div className="page-head"><div><p className="eyebrow">Customer transactions</p><h1>Payments</h1><p className="page-sub">Review payment information and transaction status.</p></div></div>
      <p className="payment-readonly-note">Review payment screenshots and approve or reject customer transactions.</p>
      {error && <p className="tbl-state error">{error}</p>}
      <section className="card">
        <div className="tbl-toolbar"><input className="tbl-search" aria-label="Search payments" placeholder="Search payments..." value={search} onChange={(event) => setSearch(event.target.value)} /><span className="tbl-count">{filteredPayments.length} payments</span></div>
        {loading ? <p className="tbl-state">Loading payments...</p> : <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Payment</th><th>Booking</th><th>Customer</th><th>Method</th><th>Amount</th><th>Screenshot</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredPayments.map((payment) => <tr key={payment.paymentId}><td><strong>#{payment.paymentId}</strong></td><td>#{payment.bookingId}</td><td>{payment.booking?.user?.name ?? "-"}</td><td>{payment.paymentMethod}</td><td>{Number(payment.amount).toFixed(2)} MMK</td><td>{payment.paymentSlipUrl ? <button className="payment-slip-link" type="button" onClick={() => setSelectedSlip({ url: getSlipUrl(payment.paymentSlipUrl!), paymentId: payment.paymentId })}>View slip</button> : "-"}</td><td><span className={`badge payment-status-${payment.paymentStatus}`}>{payment.paymentStatus}</span></td><td>{payment.paymentStatus === "pending" ? <><button className="btn-sm" type="button" disabled={updatingId === payment.paymentId} onClick={() => void updateStatus(payment, "approved")}>Approve</button> <button className="btn-sm btn-del" type="button" disabled={updatingId === payment.paymentId} onClick={() => void updateStatus(payment, "rejected")}>Reject</button></> : "-"}</td></tr>)}</tbody></table>{!filteredPayments.length && <p className="tbl-empty">No customer payments found.</p>}</div>}
      </section>
      {selectedSlip && <div className="payment-slip-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedSlip(null); }}><div className="payment-slip-modal" role="dialog" aria-modal="true" aria-labelledby="payment-slip-title"><div className="payment-slip-modal-head"><h2 id="payment-slip-title">Payment #{selectedSlip.paymentId} slip</h2><button className="modal-close" type="button" aria-label="Close payment slip" onClick={() => setSelectedSlip(null)}>×</button></div><img className="payment-slip-image" src={selectedSlip.url} alt={`Customer payment slip for payment ${selectedSlip.paymentId}`} /></div></div>}
    </div>
  );
};

export default PaymentsPage;