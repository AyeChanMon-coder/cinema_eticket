import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface Movie {
  title: string;
}

interface Showtime {
  date: string;
  time: string;
}

interface Seat {
  seatNumber: string;
  seatType: string;
  seatPrice: number;
}

interface BookingDetailState {
  movie?: Movie;
  showtime?: Showtime;
  selectedSeats?: Seat[];
}

const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const formatPrice = (price: number) => `${price.toFixed(2)} MMK`;

const BookingDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { movie, showtime, selectedSeats } = (location.state as BookingDetailState | null) ?? {};

  const ticketLines = useMemo(() => {
    const grouped = new Map<string, { price: number; quantity: number }>();
    selectedSeats?.forEach((seat) => {
      const current = grouped.get(seat.seatType) ?? { price: Number(seat.seatPrice), quantity: 0 };
      grouped.set(seat.seatType, { ...current, quantity: current.quantity + 1 });
    });
    return [...grouped.entries()];
  }, [selectedSeats]);

  const total = selectedSeats?.reduce((sum, seat) => sum + Number(seat.seatPrice), 0) ?? 0;

  if (!movie || !showtime || !selectedSeats?.length) {
    return <main className="detail-page"><button className="detail-close" type="button" aria-label="Close booking detail" onClick={() => navigate("/", { replace: true })}>x</button><p className="catalog-state">Booking details are unavailable.</p></main>;
  }

  return (
    <main className="detail-page">
      <button className="detail-close" type="button" aria-label="Close booking detail" onClick={() => navigate("/", { replace: true })}>x</button>
      <section className="detail-card">
        <h1>Booking Detail</h1>
        <div className="detail-columns">
          <section className="detail-schedule">
            <h2>Schedule</h2>
            <dl>
              <div><dt>Movie Name</dt><dd>{movie.title}</dd></div>
              <div><dt>Date</dt><dd>{formatDate(showtime.date)}</dd></div>
              <div><dt>Time</dt><dd>{showtime.time.slice(0, 5)}</dd></div>
              <div><dt>Tickets ({selectedSeats.length})</dt><dd>{selectedSeats.map((seat) => seat.seatNumber).join(", ")}</dd></div>
            </dl>
          </section>
          <section className="detail-transaction">
            <h2>Order Summary</h2>
            <h3>Transaction Details</h3>
            {ticketLines.map(([seatType, line]) => <div className="detail-price-line" key={seatType}><span>{seatType.toUpperCase()}</span><span>{formatPrice(line.price)} x{line.quantity}<small>{formatPrice(line.price * line.quantity)}</small></span></div>)}
            <div className="detail-total"><strong>Total Payment</strong><strong>{formatPrice(total)}</strong></div>
            <h3 className="detail-payment-heading">Payment Method</h3>
            <div className="detail-payment"><span aria-hidden="true">*</span><strong>KPay</strong></div>
            <button className="detail-checkout" type="button" onClick={() => navigate("/user/booking/seats", { state: { movie, showtime } })}>Checkout Ticket</button>
          </section>
        </div>
      </section>
    </main>
  );
};

export default BookingDetail;