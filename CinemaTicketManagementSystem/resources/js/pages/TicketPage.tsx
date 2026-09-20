import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";

interface Movie {
  title: string;
}

interface Showtime {
  date: string;
  time: string;
}

interface Seat {
  seatNumber: string;
  seatType?: string;
  seatPrice?: number;
}

interface TicketState {
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

const TicketPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { movie, showtime, selectedSeats } = (location.state as TicketState | null) ?? {};

  if (!movie || !showtime || !selectedSeats?.length) {
    return <main className="detail-page"><button className="detail-close" type="button" aria-label="Close ticket" onClick={() => navigate("/", { replace: true })}>x</button><p className="catalog-state">Ticket details are unavailable.</p></main>;
  }

  const total = selectedSeats.reduce((sum, seat) => sum + Number(seat.seatPrice ?? 0), 0);
  const ticketLines = new Map<string, { price: number; quantity: number }>();
  selectedSeats.forEach((seat) => {
    const seatType = seat.seatType ?? "Ticket";
    const current = ticketLines.get(seatType) ?? { price: Number(seat.seatPrice ?? 0), quantity: 0 };
    ticketLines.set(seatType, { ...current, quantity: current.quantity + 1 });
  });

  const downloadTicket = () => {
    const document = new jsPDF();
    const safeTitle = movie.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "cinema-ticket";
    const lines = [...ticketLines.entries()];

    document.setFillColor(32, 32, 42);
    document.rect(0, 0, 210, 34, "F");
    document.setTextColor(255, 255, 255);
    document.setFontSize(22);
    document.setFont("helvetica", "bold");
    document.text("CINEMA TICKET", 20, 22);
    document.setTextColor(32, 32, 42);
    document.setFontSize(16);
    document.text("Booking Detail", 20, 52);

    document.setDrawColor(220, 220, 220);
    document.line(20, 58, 190, 58);
    document.setFontSize(10);
    document.setFont("helvetica", "normal");
    document.text("Movie", 20, 72);
    document.setFont("helvetica", "bold");
    document.text(document.splitTextToSize(movie.title, 150), 20, 80);
    document.setFont("helvetica", "normal");
    document.text("Date", 20, 101);
    document.text(formatDate(showtime.date), 20, 109);
    document.text("Time", 20, 126);
    document.text(showtime.time.slice(0, 5), 20, 134);
    document.text("Seats", 20, 151);
    document.text(selectedSeats.map((seat) => seat.seatNumber).join(", "), 20, 159);

    document.setFont("helvetica", "bold");
    document.text("Transaction Details", 110, 101);
    document.setFont("helvetica", "normal");
    lines.forEach(([seatType, line], index) => {
      const y = 113 + index * 14;
      document.text(seatType.toUpperCase(), 110, y);
      document.text(`${formatPrice(line.price)} x${line.quantity}`, 110, y + 6);
      document.text(formatPrice(line.price * line.quantity), 190, y, { align: "right" });
    });

    const totalY = 113 + lines.length * 14 + 16;
    document.setDrawColor(220, 220, 220);
    document.line(110, totalY - 7, 190, totalY - 7);
    document.setFont("helvetica", "bold");
    document.text("Total Payment", 110, totalY);
    document.text(formatPrice(total), 190, totalY, { align: "right" });
    document.setFont("helvetica", "normal");
    document.setTextColor(110, 110, 110);
    document.text("Thank you for booking with us.", 20, 190);
    document.save(`${safeTitle}.pdf`);
  };

  return (
    <main className="detail-page">
      <button className="detail-close" type="button" aria-label="Close ticket" onClick={() => navigate("/", { replace: true })}>x</button>
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
            {[...ticketLines.entries()].map(([seatType, line]) => <div className="detail-price-line" key={seatType}><span>{seatType.toUpperCase()}</span><span>{formatPrice(line.price)} x{line.quantity}<small>{formatPrice(line.price * line.quantity)}</small></span></div>)}
            <div className="detail-total"><strong>Total Payment</strong><strong>{formatPrice(total)}</strong></div>
            <div className="ticket-actions">
              <button className="detail-checkout" type="button" onClick={downloadTicket}>Download Ticket</button>
              <button className="ticket-home-button" type="button" onClick={() => navigate("/", { replace: true })}>Back to Homepage</button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default TicketPage;
