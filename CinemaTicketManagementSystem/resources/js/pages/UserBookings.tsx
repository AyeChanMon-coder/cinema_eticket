import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface Booking {
  bookingId: number;
  bookingDate: string;
  status: string;
  seats?: { seatNumber: string; seatType: string; seatPrice: number }[];
  showtime?: {
    date?: string;
    time?: string;
    movie?: { title?: string; image?: string | null };
    room?: { name?: string; cinema?: { name?: string; location?: string } };
  };
  payment?: { paymentStatus?: string; amount?: number; paymentMethod?: { name?: string } };
}

const formatDate = (date?: string) => date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "-";

const UserBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("user_token")) {
      navigate("/user/login", { replace: true, state: { userEntry: true } });
      return;
    }

    const loadBookings = async () => {
      try {
        const response = await api.get("/bookings");
        setBookings(Array.isArray(response.data) ? response.data : []);
      } catch {
        setError("Unable to load your booking information.");
      } finally {
        setLoading(false);
      }
    };
    void loadBookings();
  }, [navigate]);

  return (
    <main className="user-bookings-page">
      <header className="user-bookings-header"><button type="button" aria-label="Back to movies" onClick={() => navigate("/")}>×</button><h1>My Bookings</h1></header>
      {error && <p className="user-bookings-state error">{error}</p>}
      {loading ? <p className="user-bookings-state">Loading bookings...</p> : !bookings.length ? <p className="user-bookings-state">You have no bookings yet.</p> : <section className="user-bookings-list">{bookings.map((booking) => { const total = Number(booking.payment?.amount ?? booking.seats?.reduce((sum, seat) => sum + Number(seat.seatPrice), 0) ?? 0); const paymentStatus = booking.payment?.paymentStatus ?? booking.status; return <article className="user-booking-card" key={booking.bookingId}><div className="user-booking-card-head"><div><p className="user-booking-kicker">Booking #{booking.bookingId}</p><h2>{booking.showtime?.movie?.title ?? "Movie"}</h2></div><span className={`badge payment-status-${paymentStatus}`}>{paymentStatus}</span></div><dl><div><dt>Date & time</dt><dd>{formatDate(booking.showtime?.date)} · {booking.showtime?.time?.slice(0, 5) ?? "-"}</dd></div><div><dt>Cinema</dt><dd>{booking.showtime?.room?.cinema?.name ?? booking.showtime?.room?.cinema?.location ?? "-"}</dd></div><div><dt>Seats</dt><dd>{booking.seats?.map((seat) => seat.seatNumber).join(", ") || "-"}</dd></div><div><dt>Payment</dt><dd>{booking.payment?.paymentMethod?.name ?? "-"} · {total.toFixed(2)} MMK</dd></div></dl>{paymentStatus === "approved" && <button className="user-booking-ticket-button" type="button" onClick={() => navigate("/user/booking/payment/ticket", { state: { movie: { title: booking.showtime?.movie?.title ?? "Movie" }, showtime: { date: booking.showtime?.date, time: booking.showtime?.time }, selectedSeats: booking.seats } })}>View Ticket</button>}</article>; })}</section>}
    </main>
  );
};

export default UserBookings;