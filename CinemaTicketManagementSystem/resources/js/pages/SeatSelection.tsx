import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

interface Movie {
  title: string;
  duration: number;
}

interface Showtime {
  showtimeId: number;
  date: string;
  time: string;
  roomId: number;
  room?: { name?: string };
}

interface Seat {
  seatId: number;
  seatNumber: string;
  isBooked: boolean;
  seatType: string;
  seatPrice: number;
}

const SeatSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingState = location.state as { movie?: Movie; showtime?: Showtime } | null;
  const movie = bookingState?.movie;
  const showtime = bookingState?.showtime;
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("user_token")) {
      navigate("/user/login", { replace: true, state: { userEntry: true } });
      return;
    }
    if (!showtime) {
      navigate("/", { replace: true });
      return;
    }

    const loadSeats = async () => {
      try {
        const response = await api.get(`/rooms/${showtime.roomId}/seats`);
        setSeats(Array.isArray(response.data) ? response.data : []);
      } catch {
        setError("Unable to load seats for this room.");
      } finally {
        setLoading(false);
      }
    };
    void loadSeats();
  }, [navigate, showtime]);

  const rows = useMemo(() => {
    const grouped = new Map<string, Seat[]>();
    seats.forEach((seat) => {
      const row = seat.seatNumber.match(/^[A-Za-z]+/)?.[0] ?? "";
      grouped.set(row, [...(grouped.get(row) ?? []), seat]);
    });
    return [...grouped.entries()].map(([row, rowSeats]) => [row, rowSeats.sort((first, second) => Number(first.seatNumber.replace(/\D/g, "")) - Number(second.seatNumber.replace(/\D/g, "")))] as [string, Seat[]]);
  }, [seats]);

  const selectedSeats = seats.filter((seat) => selectedSeatIds.includes(seat.seatId));
  const total = selectedSeats.reduce((sum, seat) => sum + Number(seat.seatPrice), 0);
  const toggleSeat = (seat: Seat) => {
    if (seat.isBooked) return;
    setSelectedSeatIds((current) => current.includes(seat.seatId) ? current.filter((id) => id !== seat.seatId) : [...current, seat.seatId]);
  };

  if (!movie || !showtime) return null;

  return (
    <main className="seat-page">
      <section className="seat-content">
        <h1>Seat</h1>
        {error && <p className="seat-error">{error}</p>}
        {loading ? <p className="seat-state">Loading seats...</p> : <div className="seat-map">{rows.map(([row, rowSeats]) => <div className="seat-row" key={row}><span className="seat-row-label">{row}</span><div className="seat-row-seats">{rowSeats.map((seat) => <button className={`seat${seat.isBooked ? " booked" : ""}${selectedSeatIds.includes(seat.seatId) ? " selected" : ""}`} type="button" key={seat.seatId} disabled={seat.isBooked} aria-label={`${seat.seatNumber}${seat.isBooked ? " booked" : " available"}`} onClick={() => toggleSeat(seat)}>{seat.seatNumber}</button>)}</div></div>)}{rows.length === 0 && <p className="seat-state">No seats configured for this room.</p>}<div className="seat-screen">X</div></div>}
      </section>
      <footer className="seat-footer"><div><small>TOTAL</small><strong>RM {total.toFixed(2)}</strong></div><div><small>SEAT</small><strong>{selectedSeats.length ? selectedSeats.map((seat) => seat.seatNumber).join(", ") : "-"}</strong></div><button className="seat-back" type="button" onClick={() => navigate(-1)}>Back</button><button className="seat-proceed" type="button" disabled={!selectedSeats.length}>Proceed Payment</button></footer>
    </main>
  );
};

export default SeatSelection;
