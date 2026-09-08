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
  showtimes?: Array<Record<string, unknown>>;
}

type MovieForm = Omit<Movie, "movieId" | "showtimes">;

const emptyForm: MovieForm = {
  title: "",
  genre: "",
  description: "",
  duration: 120,
  rating: 0,
};

const MoviesPage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [form, setForm] = useState<MovieForm>(emptyForm);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
  }, []);

  const openCreate = () => {
    setEditingMovie(null);
    setForm(emptyForm);
    setImageFile(null);
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
    setError("");
  };

  const closeForm = () => {
    setEditingMovie(null);
    setIsFormOpen(false);
    setForm(emptyForm);
    setImageFile(null);
  };

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

      if (editingMovie) {
        formData.append("_method", "PUT");
        await api.post(`/admin/movies/${editingMovie.movieId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/admin/movies", formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
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
            onChange={(event) => setSearch(event.target.value)}
          />
          <span className="tbl-count">{filteredMovies.length} movies</span>
        </div>
        {loading ? <p className="tbl-state">Loading movies...</p> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Movie</th><th>Genre</th><th>Duration</th><th>Rating</th><th>Showtimes</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredMovies.map((movie) => (
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
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <div className="modal">
            <div className="modal-head"><div><p className="eyebrow">Catalog</p><h2>{editingMovie ? "Edit movie" : "Add movie"}</h2></div><button className="modal-close" type="button" aria-label="Close" onClick={closeForm}>×</button></div>
            <form onSubmit={submit}>
              <div className="modal-field"><label htmlFor="movie-title">Title</label><input id="movie-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></div>
              <div className="modal-grid"><div className="modal-field"><label htmlFor="movie-genre">Genre</label><input id="movie-genre" value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })} required /></div><div className="modal-field"><label htmlFor="movie-duration">Duration (min)</label><input id="movie-duration" type="number" min="1" value={form.duration} onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })} required /></div></div>
              <div className="modal-field"><label htmlFor="movie-rating">Rating</label><input id="movie-rating" type="number" min="0" max="10" step="0.1" value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })} required /></div>
              <div className="modal-field"><label htmlFor="movie-image">Poster image</label><input id="movie-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} /><small className="field-help">JPG, PNG, or WebP, up to 5 MB.</small></div>
              <div className="modal-field"><label htmlFor="movie-description">Description</label><textarea id="movie-description" rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></div>
              <div className="modal-actions"><button className="btn-secondary" type="button" onClick={closeForm}>Cancel</button><button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : editingMovie ? "Save changes" : "Create movie"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviesPage;
