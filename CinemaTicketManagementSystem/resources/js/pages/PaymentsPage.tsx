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

  const filteredPayments = payments.filter((payment) => `${payment.paymentId} ${payment.bookingId} ${payment.paymentMethod} ${payment.paymentStatus} ${payment.booking?.user?.name ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container">
      <div className="page-head"><div><p className="eyebrow">Customer transactions</p><h1>Payments</h1><p className="page-sub">Review payment information and transaction status.</p></div></div>
      <p className="payment-readonly-note">Read-only payment history. Payment records appear after a customer completes a payment.</p>
      {error && <p className="tbl-state error">{error}</p>}
      <section className="card">
        <div className="tbl-toolbar"><input className="tbl-search" aria-label="Search payments" placeholder="Search payments..." value={search} onChange={(event) => setSearch(event.target.value)} /><span className="tbl-count">{filteredPayments.length} payments</span></div>
        {loading ? <p className="tbl-state">Loading payments...</p> : <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Payment</th><th>Booking</th><th>Customer</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody>{filteredPayments.map((payment) => <tr key={payment.paymentId}><td><strong>#{payment.paymentId}</strong></td><td>#{payment.bookingId}</td><td>{payment.booking?.user?.name ?? "-"}</td><td>{payment.paymentMethod}</td><td>{Number(payment.amount).toFixed(2)} MMK</td><td><span className={`badge payment-status-${payment.paymentStatus}`}>{payment.paymentStatus}</span></td></tr>)}</tbody></table>{!filteredPayments.length && <p className="tbl-empty">No customer payments found.</p>}</div>}
      </section>
    </div>
  );
};

export default PaymentsPage;