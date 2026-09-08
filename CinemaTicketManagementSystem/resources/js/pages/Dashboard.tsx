import { useEffect, useState } from "react";
import api from "../api/axios";

interface Movie {
  movieId: number;
  title: string;
  genre: string;
  duration: number;
  rating: number;
  showtimes?: Array<Record<string, unknown>>;
}

const Dashboard = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await api.get("/admin/movies");
        setMovies(Array.isArray(response.data) ? response.data : []);
      } catch {
        setError("Unable to load movies.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h1>Movie Lists</h1>
          <p>Manage the current movie catalog from this page.</p>
        </div>
      </header>

      {loading ? (
        <p className="dashboard-state">Loading movies...</p>
      ) : error ? (
        <p className="dashboard-state error">{error}</p>
      ) : (
        <section className="card">
          {movies.length === 0 ? (
            <p className="dashboard-state">No movies found.</p>
          ) : (
            <div className="movie-list">
              {movies.map((movie) => (
                <article key={movie.movieId} className="movie-card">
                  <div>
                    <h2>{movie.title}</h2>
                    <p>{movie.genre}</p>
                  </div>
                  <div className="movie-meta">
                    <span>Duration: {movie.duration} min</span>
                    <span>Rating: {movie.rating}/10</span>
                    <span>Showtimes: {movie.showtimes?.length ?? 0}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Dashboard;