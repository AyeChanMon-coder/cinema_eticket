import { ChangeEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

interface Movie { title: string; }
interface Showtime { showtimeId: number; date: string; time: string; }
interface Seat { seatId: number; seatNumber: string; seatType?: string; seatPrice?: number; }
interface PaymentMethod {
  paymentMethodId: number;
  name: string;
  accountName?: string | null;
  accountNumber?: string | null;
  qrCodeImageUrl?: string | null;
}
interface PaymentInformationState {
  movie?: Movie;
  showtime?: Showtime;
  selectedSeats?: Seat[];
  total?: number;
  paymentMethod?: PaymentMethod;
  paymentId?: number;
}

const getImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return null;
  try {
    const url = new URL(imageUrl, window.location.origin);
    return `${window.location.origin}${url.pathname}`;
  } catch {
    return imageUrl;
  }
};

const PaymentInformation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialState = (location.state as PaymentInformationState | null) ?? {};
  const [movie, setMovie] = useState(initialState.movie);
  const [showtime, setShowtime] = useState(initialState.showtime);
  const [selectedSeats, setSelectedSeats] = useState(initialState.selectedSeats);
  const [total, setTotal] = useState(initialState.total);
  const [paymentMethod, setPaymentMethod] = useState(initialState.paymentMethod);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(initialState.paymentId ?? null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "approved" | "rejected">(initialState.paymentId ? "pending" : "idle");
  const [loadingPayment, setLoadingPayment] = useState(Boolean(initialState.paymentId && (!initialState.movie || !initialState.paymentMethod)));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePaymentSlipChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPaymentSlip(event.target.files?.[0] ?? null);
  };

  useEffect(() => {
    if (!paymentId || (movie && showtime && selectedSeats?.length && paymentMethod)) return;

    const loadPayment = async () => {
      try {
        const response = await api.get(`/payments/${paymentId}/status`);
        const payment = response.data;
        setMovie(payment.booking?.showtime?.movie);
        setShowtime(payment.booking?.showtime);
        setSelectedSeats(payment.booking?.seats ?? []);
        setTotal(Number(payment.amount ?? 0));
        setPaymentMethod(payment.paymentMethod);
        setPaymentStatus(payment.paymentStatus);
      } catch {
        setError("Unable to load payment information.");
      } finally {
        setLoadingPayment(false);
      }
    };

    void loadPayment();
  }, [movie, paymentId, paymentMethod, selectedSeats, showtime]);

  const submitPayment = async () => {
    if (!paymentSlip || !showtime || !selectedSeats?.length || !paymentMethod) {
      setError("Please upload your payment screenshot first.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = new FormData();
      payload.append("showtimeId", String(showtime.showtimeId));
      payload.append("amount", String(total ?? 0));
      payload.append("paymentMethodId", String(paymentMethod.paymentMethodId));
      selectedSeats.forEach((seat) => payload.append("seatIds[]", String(seat.seatId)));
      payload.append("paymentSlip", paymentSlip);
      const response = await api.post("/payments", payload);
      setPaymentId(response.data.paymentId);
      setPaymentStatus("pending");
    } catch (submitError) {
      setError("Unable to submit payment. Please check your screenshot and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!paymentId || paymentStatus === "approved" || paymentStatus === "rejected") return;
    const timer = window.setInterval(async () => {
      try {
        const response = await api.get(`/payments/${paymentId}/status`);
        setPaymentStatus(response.data.paymentStatus);
      } catch {
        // Keep waiting if a transient status request fails.
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paymentId, paymentStatus]);

  if (loadingPayment) {
    return <main className="payment-page"><p className="catalog-state">Loading payment information...</p></main>;
  }

  if (!paymentMethod || !selectedSeats?.length) {
    return <main className="payment-page"><button className="detail-close" type="button" onClick={() => navigate("/", { replace: true })}>×</button><p className="catalog-state">Payment information is unavailable.</p></main>;
  }

  if (paymentStatus === "approved") {
    return <main className="payment-page"><section className="payment-result"><h1>Payment Success</h1><div className="payment-result-icon" aria-hidden="true">✓</div><button className="payment-result-primary" type="button" onClick={() => navigate("/user/booking/payment/ticket", { state: { movie, showtime, selectedSeats } })}>View Ticket</button><button type="button" onClick={() => navigate("/", { replace: true })}>Back to Homepage</button></section></main>;
  }

  const qrImageUrl = getImageUrl(paymentMethod.qrCodeImageUrl);

  return (
    <main className="payment-page">
      <button className="detail-close" type="button" aria-label="Close payment information" onClick={() => navigate(-1)}>×</button>
      <section className="payment-page-card">
        <h1>Payment Information</h1>
        <p className="payment-page-order">{movie?.title ?? "Movie"} · {showtime?.date ?? ""} · {selectedSeats.map((seat) => seat.seatNumber).join(", ")}</p>
        {qrImageUrl ? <img className="payment-info-qr" src={qrImageUrl} alt={`${paymentMethod.name} QR code`} /> : <div className="payment-info-qr payment-info-qr-empty">QR code unavailable</div>}
        <div className="payment-info-bank"><h2>Bank Information</h2><p><strong>Payment method</strong><span>{paymentMethod.name}</span></p><p><strong>Account name</strong><span>{paymentMethod.accountName || "-"}</span></p><p><strong>Account number</strong><span>{paymentMethod.accountNumber || "-"}</span></p><p><strong>Total amount</strong><span>{Number(total ?? 0).toFixed(2)} MMK</span></p></div>
        <label className="payment-slip-upload"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePaymentSlipChange} />{paymentSlip ? paymentSlip.name : "Upload Your Payment Screenshot"}</label>
        {error && <p className="payment-submit-error">{error}</p>}
        {paymentStatus === "pending" && <p className="payment-waiting">Waiting for admin to verify your payment...</p>}
        {paymentStatus === "rejected" && <p className="payment-submit-error">Payment was rejected. Please upload a valid screenshot and submit again.</p>}
        <div className="payment-info-actions"><button type="button" disabled={submitting || paymentStatus === "pending"} onClick={() => void submitPayment()}>{submitting ? "Submitting..." : "Submit"}</button><button type="button" onClick={() => navigate(-1)}>Cancel</button></div>
      </section>
    </main>
  );
};

export default PaymentInformation;