import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

interface Movie {
  movieId: number;
  title: string;
  image?: string | null;
  duration: number;
}

interface Showtime {
  showtimeId: number;
  date: string;
  time: string;
  roomId: number;
  movieId: number;
  room?: {
    name?: string;
    cinema?: {
      name?: string;
      location?: string;
    };
  };
}

const UserBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const movie = (location.state as { movie?: Movie } | null)?.movie;
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("user_token")) {
      navigate("/user/login", { replace: true, state: { userEntry: true } });
      return;
    }

    const loadShowtimes = async () => {
      try {
        const response = await api.get("/showtimes");
        setShowtimes(Array.isArray(response.data) ? response.data : []);
      } finally {
        setLoading(false);
      }
    };
    void loadShowtimes();
  }, [navigate]);

  const movieShowtimes = useMemo(
    () => showtimes.filter((showtime) => showtime.movieId === movie?.movieId),
    [movie?.movieId, showtimes],
  );
  const locations = [...new Set(movieShowtimes.map((showtime) => showtime.room?.cinema?.location).filter((location): location is string => Boolean(location)))];
  const activeLocation = selectedLocation ?? locations[0] ?? null;
  const locationShowtimes = movieShowtimes.filter((showtime) => showtime.room?.cinema?.location === activeLocation);
  const dates = [...new Set(locationShowtimes.map((showtime) => showtime.date))];
  const activeDate = selectedDate ?? dates[0] ?? null;
  const dateShowtimes = locationShowtimes.filter((showtime) => showtime.date === activeDate);
  const selected = movieShowtimes.find((showtime) => showtime.showtimeId === selectedShowtime);

  if (!movie) {
    return <main className="booking-page"><button className="booking-close" type="button" onClick={() => navigate("/", { replace: true })}>×</button><p className="catalog-state">Choose a movie to start booking.</p></main>;
  }

  return (
    <main className="booking-page">
      <button className="booking-close" type="button" aria-label="Close booking" onClick={() => navigate("/", { replace: true })}>×</button>
      <section className="booking-layout">
        <div className="booking-options">
          <h1>Location</h1>
          <div className="booking-chips">{locations.length ? locations.map((locationName) => <button className={`booking-chip${activeLocation === locationName ? " selected" : ""}`} type="button" key={locationName} onClick={() => { setSelectedLocation(locationName); setSelectedDate(null); setSelectedShowtime(null); }}>{locationName}</button>) : <span className="booking-empty">No cinema location available</span>}</div>
          <h2>Date</h2>
          <div className="booking-date-list">{dates.length ? dates.map((date) => <button className={`booking-date${activeDate === date ? " selected" : ""}`} type="button" key={date} onClick={() => { setSelectedDate(date); setSelectedShowtime(null); }}><small>{new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" })}</small><strong>{new Date(`${date}T00:00:00`).getDate()}</strong><small>{new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}</small></button>) : <span className="booking-empty">No dates available</span>}</div>
          <h2>Time</h2>
          <div className="booking-time-list">{loading ? <span className="booking-empty">Loading showtimes...</span> : dateShowtimes.length ? dateShowtimes.map((showtime) => <button className={`booking-time${selectedShowtime === showtime.showtimeId ? " selected" : ""}`} type="button" key={showtime.showtimeId} onClick={() => setSelectedShowtime(showtime.showtimeId)}>{showtime.time.slice(0, 5)}</button>) : <span className="booking-empty">No showtimes available</span>}</div>
        </div>
        <aside className="booking-summary">
          <div className="booking-summary-poster">{movie.image ? <img src={`${window.location.origin}/storage/${movie.image}`} alt={movie.title} /> : <span>No poster</span>}</div>
          <h2>{movie.title}</h2>
          <p>{movie.duration} min</p>
          <div className="booking-confirm"><strong>{selected?.room?.cinema?.location ?? "Select a location"}</strong><span>{selected ? `${selected.date} · ${selected.time.slice(0, 5)}` : "Select a date and time"}</span><button type="button" disabled={!selectedShowtime} onClick={() => selected && navigate("/user/booking/seats", { state: { movie, showtime: selected } })}>Proceed</button></div>
        </aside>
      </section>
    </main>
  );
};

export default UserBooking;
