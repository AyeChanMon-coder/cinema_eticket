import { FormEvent, useEffect, useState } from "react";
import api from "../api/axios";

interface Movie {
  movieId: number;
  title: string;
  genre: string;
  image?: string | null;
  description: string;
  duration: number;
  rating: number;
  showtimes?: Showtime[];
}

type MovieForm = Omit<Movie, "movieId" | "showtimes">;

interface Showtime {
  showtimeId: number;
  date: string;
  time: string;
  roomId: number;
  movieId: number;
}

interface Cinema {
  cinemaId: number;
  name: string;
  location: string;
}

interface Room {
  roomId: number;
  name: string;
  cinemaId: number;
}

interface ShowtimeForm {
  showtimeId?: number;
  date: string;
  time: string;
  cinemaId: string;
  roomId: string;
}

const emptyForm: MovieForm = {
  title: "",
  genre: "",
  description: "",
  duration: 120,
  rating: 0,
};

const emptyShowtime: ShowtimeForm = { date: "", time: "", cinemaId: "", roomId: "" };

const ITEMS_PER_PAGE = 5;

const MoviesPage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [form, setForm] = useState<MovieForm>(emptyForm);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showtimeForms, setShowtimeForms] = useState<ShowtimeForm[]>([]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return undefined;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const loadMovies = async () => {
    try {
      const response = await api.get("/admin/movies");
      setMovies(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError("Unable to load movies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMovies();
    const loadShowtimeOptions = async () => {
      try {
        const [cinemaResponse, roomResponse] = await Promise.all([api.get("/admin/cinemas"), api.get("/admin/rooms")]);
        setCinemas(Array.isArray(cinemaResponse.data) ? cinemaResponse.data : []);
        setRooms(Array.isArray(roomResponse.data) ? roomResponse.data : []);
      } catch {
        setError("Unable to load cinema and room options.");
      }
    };
    void loadShowtimeOptions();
  }, []);

  const openCreate = () => {
    setEditingMovie(null);
    setForm(emptyForm);
    setImageFile(null);
    setRemoveCurrentImage(false);
    setImageInputKey((key) => key + 1);
    setShowtimeForms([]);
    setIsFormOpen(true);
    setError("");
  };

  const openEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setIsFormOpen(true);
    setForm({
      title: movie.title,
      genre: movie.genre,
      description: movie.description ?? "",
      duration: movie.duration,
      rating: movie.rating,
    });
    setImageFile(null);
    setRemoveCurrentImage(false);
    setImageInputKey((key) => key + 1);
    setShowtimeForms((movie.showtimes ?? []).map((showtime) => {
      const room = rooms.find((item) => item.roomId === showtime.roomId);
      return { showtimeId: showtime.showtimeId, date: showtime.date, time: showtime.time.slice(0, 5), cinemaId: room ? String(room.cinemaId) : "", roomId: String(showtime.roomId) };
    }));
    setError("");
  };

  const closeForm = () => {
    setEditingMovie(null);
    setIsFormOpen(false);
    setForm(emptyForm);
    setImageFile(null);
    setRemoveCurrentImage(false);
    setImageInputKey((key) => key + 1);
    setShowtimeForms([]);
  };

  const updateShowtime = (index: number, values: Partial<ShowtimeForm>) => {
    setShowtimeForms((current) => current.map((showtime, itemIndex) => itemIndex === index ? { ...showtime, ...values } : showtime));
  };

  const addShowtime = () => setShowtimeForms((current) => [...current, { ...emptyShowtime }]);

  const removeShowtime = (index: number) => setShowtimeForms((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("genre", form.genre);
      formData.append("description", form.description);
      formData.append("duration", String(form.duration));
      formData.append("rating", String(form.rating));
      if (imageFile) formData.append("image", imageFile);
      if (removeCurrentImage) formData.append("remove_image", "1");

      let movieId = editingMovie?.movieId;
      if (editingMovie) {
        formData.append("_method", "PUT");
        await api.post(`/admin/movies/${editingMovie.movieId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        const response = await api.post("/admin/movies", formData, { headers: { "Content-Type": "multipart/form-data" } });
        movieId = response.data.movieId;
      }
      if (!movieId) throw new Error("Movie was not saved.");
      const originalShowtimeIds = new Set((editingMovie?.showtimes ?? []).map((showtime) => showtime.showtimeId));
      const submittedShowtimeIds = new Set(showtimeForms.filter((showtime) => showtime.showtimeId).map((showtime) => showtime.showtimeId));
      await Promise.all([...originalShowtimeIds].filter((showtimeId) => !submittedShowtimeIds.has(showtimeId)).map((showtimeId) => api.delete(`/admin/showtimes/${showtimeId}`)));
      await Promise.all(showtimeForms.map((showtime) => {
        const payload = { date: showtime.date, time: showtime.time, roomId: Number(showtime.roomId), movieId };
        return showtime.showtimeId ? api.put(`/admin/showtimes/${showtime.showtimeId}`, payload) : api.post("/admin/showtimes", payload);
      }));
      await loadMovies();
      closeForm();
    } catch {
      setError("Please check the movie details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (movie: Movie) => {
    if (!window.confirm(`Delete ${movie.title}?`)) return;

    try {
      await api.delete(`/admin/movies/${movie.movieId}`);
      setMovies((current) => current.filter((item) => item.movieId !== movie.movieId));
    } catch {
      setError("Unable to delete this movie.");
    }
  };

  const filteredMovies = movies.filter((movie) =>
    `${movie.title} ${movie.genre}`.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / ITEMS_PER_PAGE));
  const visibleMovies = filteredMovies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="page-container">
      <div className="page-head">
        <div>
          <p className="eyebrow">Catalog management</p>
          <h1>Movies</h1>
          <p className="page-sub">Create, update, and remove movies from your cinema catalog.</p>
        </div>
        <button className="btn-primary" type="button" onClick={openCreate}>+ Add movie</button>
      </div>

      {error && <p className="tbl-state error">{error}</p>}
      <section className="card">
        <div className="tbl-toolbar">
          <input
            className="tbl-search"
            aria-label="Search movies"
            placeholder="Search movies..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
          />
          <span className="tbl-count">{filteredMovies.length} movies</span>
        </div>
        {loading ? <p className="tbl-state">Loading movies...</p> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Movie</th><th>Genre</th><th>Duration</th><th>Rating</th><th>Showtimes</th><th>Actions</th></tr></thead>
              <tbody>
                {visibleMovies.map((movie) => (
                  <tr key={movie.movieId}>
                    <td><div className="movie-cell">{movie.image ? <img className="movie-thumb" src={`${window.location.origin}/storage/${movie.image}`} alt="" /> : <div className="movie-thumb movie-thumb-empty">No image</div>}<div><strong>{movie.title}</strong><small className="table-description">{movie.description}</small></div></div></td>
                    <td><span className="badge">{movie.genre}</span></td>
                    <td>{movie.duration} min</td>
                    <td>{movie.rating}/10</td>
                    <td>{movie.showtimes?.length ?? 0}</td>
                    <td><div className="tbl-actions"><button className="btn-sm btn-edit" type="button" onClick={() => openEdit(movie)}>Edit</button><button className="btn-sm btn-del" type="button" onClick={() => void remove(movie)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredMovies.length === 0 && <p className="tbl-empty">No movies found.</p>}
            {filteredMovies.length > ITEMS_PER_PAGE && (
              <div className="tbl-pagination">
                <button className="btn-sm" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button key={page} className={`btn-sm${currentPage === page ? " active-page" : ""}`} type="button" onClick={() => setCurrentPage(page)}>{page}</button>
                ))}
                <button className="btn-sm" type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button>
              </div>
            )}
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <div className="modal movie-form-modal">
            <div className="modal-head"><div><p className="eyebrow">Catalog</p><h2>{editingMovie ? "Edit movie" : "Add movie"}</h2></div><button className="modal-close" type="button" aria-label="Close" onClick={closeForm}>×</button></div>
            <form onSubmit={submit}>
                {(imagePreview || (editingMovie?.image && !removeCurrentImage ? `${window.location.origin}/storage/${editingMovie.image}` : null)) && <div className="current-poster-preview"><img src={imagePreview ?? `${window.location.origin}/storage/${editingMovie?.image}`} alt={`${editingMovie?.title ?? "Movie"} poster preview`} /><span>{imageFile ? "New poster preview" : "Current poster"}</span><button className="poster-remove" type="button" onClick={() => { setImageFile(null); setRemoveCurrentImage(true); setImageInputKey((key) => key + 1); }}>Remove</button></div>}
              <div className="modal-field"><label htmlFor="movie-title">Title</label><input id="movie-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></div>
              <div className="modal-grid"><div className="modal-field"><label htmlFor="movie-genre">Genre</label><input id="movie-genre" value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })} required /></div><div className="modal-field"><label htmlFor="movie-duration">Duration (min)</label><input id="movie-duration" type="number" min="1" value={form.duration} onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })} required /></div></div>
              <div className="modal-field"><label htmlFor="movie-rating">Rating</label><input id="movie-rating" type="number" min="0" max="10" step="0.1" value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })} required /></div>
              <div className="modal-field"><label htmlFor="movie-image">{editingMovie ? "Replace poster image" : "Poster image"}</label><input key={imageInputKey} id="movie-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setImageFile(event.target.files?.[0] ?? null); setRemoveCurrentImage(false); }} /><small className="field-help">{editingMovie ? "Choose a new image or leave empty to keep the current poster." : "JPG, PNG, or WebP, up to 5 MB."}</small></div>
              <div className="modal-field"><label htmlFor="movie-description">Description</label><textarea id="movie-description" rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></div>
              <div className="showtime-form-section"><div className="showtime-form-head"><label>Showtimes</label><button className="btn-sm" type="button" onClick={addShowtime}>+ Add showtime</button></div>{showtimeForms.length === 0 && <small className="field-help">Add a date, cinema, room, and time for this movie.</small>}{showtimeForms.map((showtime, index) => <div className="showtime-form-row" key={showtime.showtimeId ?? `new-${index}`}><div className="modal-field"><label htmlFor={`showtime-date-${index}`}>Date</label><input id={`showtime-date-${index}`} type="date" value={showtime.date} onChange={(event) => updateShowtime(index, { date: event.target.value })} required /></div><div className="modal-field"><label htmlFor={`showtime-cinema-${index}`}>Cinema</label><select className="showtime-select" id={`showtime-cinema-${index}`} value={showtime.cinemaId} onChange={(event) => updateShowtime(index, { cinemaId: event.target.value, roomId: "" })} required><option value="">Select cinema</option>{cinemas.map((cinema) => <option value={cinema.cinemaId} key={cinema.cinemaId}>{cinema.name} · {cinema.location}</option>)}</select></div><div className="modal-field"><label htmlFor={`showtime-room-${index}`}>Room</label><select className="showtime-select" id={`showtime-room-${index}`} value={showtime.roomId} onChange={(event) => updateShowtime(index, { roomId: event.target.value })} required disabled={!showtime.cinemaId}><option value="">{showtime.cinemaId ? "Select room" : "Select cinema first"}</option>{rooms.filter((room) => String(room.cinemaId) === showtime.cinemaId).map((room) => <option value={room.roomId} key={room.roomId}>{room.name}</option>)}</select></div><div className="modal-field"><label htmlFor={`showtime-time-${index}`}>Time</label><input id={`showtime-time-${index}`} type="time" value={showtime.time} onChange={(event) => updateShowtime(index, { time: event.target.value })} required /></div><button className="showtime-remove" type="button" aria-label={`Remove showtime ${index + 1}`} onClick={() => removeShowtime(index)}>×</button></div>)}</div>
              <div className="modal-actions"><button className="btn-secondary" type="button" onClick={closeForm}>Cancel</button><button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : editingMovie ? "Save changes" : "Create movie"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviesPage;
