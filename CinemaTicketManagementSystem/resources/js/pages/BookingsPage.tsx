import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

interface Booking {
  bookingId: number;
  bookingDate: string;
  status: string;
  user?: { name?: string; email?: string; phone?: string | null; userType?: number };
  showtime?: {
    date?: string;
    time?: string;
    movie?: { title?: string };
    room?: { name?: string; cinema?: { name?: string; location?: string } };
  };
  seats?: { seatNumber: string; seatType?: string; seatPrice?: number }[];
  payment?: { amount?: number; paymentMethod?: string; paymentStatus?: string };
}

const ITEMS_PER_PAGE = 10;

const formatDate = (date?: string) => date
  ? new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
  : "-";

const bookingTotal = (booking: Booking) => Number(
  booking.payment?.amount
  ?? booking.seats?.reduce((total, seat) => total + Number(seat.seatPrice ?? 0), 0)
  ?? 0,
);

const isCustomer = (booking: Booking) => Number(booking.user?.userType) === 1;

const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const response = await api.get("/admin/bookings");
        setBookings(Array.isArray(response.data) ? response.data : []);
      } catch {
        setError("Unable to load bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void loadBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === "all" || booking.status.toLowerCase() === statusFilter;
      const searchableText = [
        booking.bookingId,
        isCustomer(booking) ? booking.user?.name : "",
        isCustomer(booking) ? booking.user?.email : "",
        booking.showtime?.movie?.title,
        booking.showtime?.room?.cinema?.name,
        booking.showtime?.room?.cinema?.location,
        booking.seats?.map((seat) => seat.seatNumber).join(" "),
      ].join(" ").toLowerCase();

      return matchesStatus && searchableText.includes(query);
    });
  }, [bookings, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const visibleBookings = filteredBookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const confirmedCount = bookings.filter((booking) => booking.status.toLowerCase() === "confirmed").length;
  const pendingCount = bookings.filter((booking) => booking.status.toLowerCase() === "pending").length;

  const statusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    return <span className={`badge booking-status booking-status-${normalized}`}>{status}</span>;
  };

  return (
    <div className="page-container">
      <div className="page-head">
        <div>
          <p className="eyebrow">Customer reservations</p>
          <h1>Bookings</h1>
          <p className="page-sub">View customer bookings, showtimes, seats, and payment details.</p>
        </div>
      </div>

      <section className="booking-summary-grid" aria-label="Booking totals">
        <article className="booking-summary-card"><span>Total bookings</span><strong>{bookings.length}</strong></article>
        <article className="booking-summary-card"><span>Confirmed</span><strong>{confirmedCount}</strong></article>
        <article className="booking-summary-card"><span>Pending</span><strong>{pendingCount}</strong></article>
      </section>

      {error && <p className="tbl-state error" role="alert">{error}</p>}
      <section className="card">
        <div className="tbl-toolbar">
          <input
            className="tbl-search"
            aria-label="Search bookings"
            placeholder="Search customer, movie, seat..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
          />
          <div className="booking-toolbar-end">
            <label className="booking-filter-label" htmlFor="booking-status-filter">Status</label>
            <select
              id="booking-status-filter"
              className="booking-filter"
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <span className="tbl-count">{filteredBookings.length} bookings</span>
          </div>
        </div>

        {loading ? <p className="tbl-state">Loading bookings...</p> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Booking</th><th>Customer</th><th>Movie & cinema</th><th>Showtime</th><th>Seats</th><th>Total</th><th>Status</th><th>Details</th></tr>
              </thead>
              <tbody>
                {visibleBookings.map((booking) => (
                  <tr key={booking.bookingId}>
                    <td><strong>#{booking.bookingId}</strong><br /><small>{formatDate(booking.bookingDate)}</small></td>
                    <td>{isCustomer(booking) ? <><strong>{booking.user?.name ?? "-"}</strong><br /><small>{booking.user?.email ?? ""}</small></> : "-"}</td>
                    <td><strong>{booking.showtime?.movie?.title ?? "-"}</strong><br /><small>{booking.showtime?.room?.cinema?.name ?? booking.showtime?.room?.cinema?.location ?? "-"}</small></td>
                    <td>{formatDate(booking.showtime?.date)}<br /><small>{booking.showtime?.time?.slice(0, 5) ?? "-"}</small></td>
                    <td>{booking.seats?.map((seat) => seat.seatNumber).join(", ") || "-"}</td>
                    <td>{bookingTotal(booking).toFixed(2)} MMK</td>
                    <td>{statusBadge(booking.status)}</td>
                    <td><button className="btn-sm btn-edit" type="button" onClick={() => setSelectedBooking(booking)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredBookings.length && <p className="tbl-empty">{loading ? "" : "No bookings match your search."}</p>}
            {filteredBookings.length > ITEMS_PER_PAGE && (
              <div className="tbl-pagination">
                <button className="btn-sm" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button>
                <span className="tbl-count">Page {currentPage} of {totalPages}</span>
                <button className="btn-sm" type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button>
              </div>
            )}
          </div>
        )}
      </section>

      {selectedBooking && (
        <div className="payment-slip-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedBooking(null); }}>
          <section className="modal movie-form-modal booking-detail-modal" role="dialog" aria-modal="true" aria-labelledby="booking-detail-title">
            <div className="modal-head">
              <div><p className="eyebrow">Booking details</p><h2 id="booking-detail-title">Booking #{selectedBooking.bookingId}</h2></div>
              <button className="modal-close" type="button" aria-label="Close booking details" onClick={() => setSelectedBooking(null)}>×</button>
            </div>
            <dl className="booking-detail-grid">
              <div><dt>Booking date</dt><dd>{formatDate(selectedBooking.bookingDate)}</dd></div>
              <div><dt>Booking status</dt><dd>{statusBadge(selectedBooking.status)}</dd></div>
              <div><dt>Customer</dt><dd>{isCustomer(selectedBooking) ? selectedBooking.user?.name ?? "-" : "-"}</dd></div>
              <div><dt>Email</dt><dd>{isCustomer(selectedBooking) ? selectedBooking.user?.email ?? "-" : "-"}</dd></div>
              <div><dt>Phone</dt><dd>{isCustomer(selectedBooking) ? selectedBooking.user?.phone ?? "-" : "-"}</dd></div>
              <div><dt>Movie</dt><dd>{selectedBooking.showtime?.movie?.title ?? "-"}</dd></div>
              <div><dt>Cinema</dt><dd>{selectedBooking.showtime?.room?.cinema?.name ?? "-"}</dd></div>
              <div><dt>Location</dt><dd>{selectedBooking.showtime?.room?.cinema?.location ?? "-"}</dd></div>
              <div><dt>Room</dt><dd>{selectedBooking.showtime?.room?.name ?? "-"}</dd></div>
              <div><dt>Showtime</dt><dd>{formatDate(selectedBooking.showtime?.date)} · {selectedBooking.showtime?.time?.slice(0, 5) ?? "-"}</dd></div>
              <div><dt>Seats</dt><dd>{selectedBooking.seats?.map((seat) => `${seat.seatNumber}${seat.seatType ? ` (${seat.seatType})` : ""}`).join(", ") || "-"}</dd></div>
              <div><dt>Payment method</dt><dd>{selectedBooking.payment?.paymentMethod ?? "-"}</dd></div>
              <div><dt>Payment status</dt><dd>{selectedBooking.payment?.paymentStatus ?? "-"}</dd></div>
              <div><dt>Total</dt><dd>{bookingTotal(selectedBooking).toFixed(2)} MMK</dd></div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
