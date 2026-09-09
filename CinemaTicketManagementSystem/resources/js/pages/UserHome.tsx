import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

interface Movie {
  movieId: number;
  title: string;
  genre: string;
  image?: string | null;
  description: string;
  duration: number;
  rating: number;
}

const UserHome = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const logout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_id");
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const response = await api.get("/movies");
        setMovies(Array.isArray(response.data) ? response.data : []);
      } finally {
        setLoading(false);
      }
    };
    void loadMovies();
  }, []);

  useEffect(() => {
    if (!selectedMovie) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedMovie(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [selectedMovie]);

  const filteredMovies = useMemo(() => movies.filter((movie) =>
    `${movie.title} ${movie.genre}`.toLowerCase().includes(search.toLowerCase()),
  ), [movies, search]);

  return (
    <main className="catalog-home">
      <header className="catalog-header">
        <Link className="catalog-brand" to="/"><img src="/cinema-logo.svg" alt="Cinema" /></Link>
        <nav className="catalog-nav">{localStorage.getItem("user_token") ? <div className="user-menu"><button className="profile-button" type="button" aria-label="Open user menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}><img src="/default-user.svg" alt="User profile" /></button>{profileOpen && <div className="profile-dropdown"><button type="button" onClick={() => setProfileOpen(false)}>User Info</button><button type="button" onClick={() => setProfileOpen(false)}>Settings</button><button type="button" onClick={logout}>Sign Out</button></div>}</div> : <><Link to="/user/login" state={{ userEntry: true }}>Login</Link><Link to="/user/register" state={{ userEntry: true }}>Sign up</Link></>}</nav>
      </header>
      <section className="catalog-content">
        <div className="movie-search"><input aria-label="Search movies" placeholder="You can search here !" value={search} onChange={(event) => setSearch(event.target.value)} /><span>⌕</span><button className="booking-icon search-booking" type="button" aria-label="Bookings" onClick={() => navigate("/user/login", { state: { userEntry: true } })}>▤</button></div>
        <h1 className="now-showing-title">Now Showing</h1>
        {loading ? <p className="catalog-state">Loading movies...</p> : <div className="public-movie-grid">{filteredMovies.map((movie) => <article className="public-movie-card" key={movie.movieId}><button className="public-poster" type="button" aria-label={`View details for ${movie.title}`} onClick={() => { setSelectedMovie(movie); setDescriptionExpanded(false); }}>{movie.image ? <img src={`${window.location.origin}/storage/${movie.image}`} alt={movie.title} /> : <span>No poster</span>}</button><strong>{movie.title}</strong><small>{movie.genre} · {movie.duration} min</small></article>)}</div>}
        {!loading && filteredMovies.length === 0 && <p className="catalog-state">No movies found.</p>}
        <div className="catalog-dots"><span className="active" /><span /><span /></div>
      </section>
      {selectedMovie && <div className="movie-detail-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedMovie(null); }}><section className="movie-detail-modal" role="dialog" aria-modal="true" aria-labelledby="movie-detail-title"><button className="movie-detail-close" type="button" aria-label="Close movie details" onClick={() => setSelectedMovie(null)}>×</button><div className="movie-detail-poster">{selectedMovie.image ? <img src={`${window.location.origin}/storage/${selectedMovie.image}`} alt={selectedMovie.title} /> : <span>No poster</span>}</div><div className="movie-detail-copy"><p className="movie-detail-kicker">Now showing</p><h2 id="movie-detail-title">{selectedMovie.title}</h2><p className="movie-detail-meta">{selectedMovie.genre} · {selectedMovie.duration} min · Rating {selectedMovie.rating}</p><p className="movie-detail-description">{descriptionExpanded || selectedMovie.description.length <= 100 ? selectedMovie.description : `${selectedMovie.description.slice(0, 100)}...`}</p>{selectedMovie.description.length > 100 && <button className="movie-detail-more" type="button" onClick={() => setDescriptionExpanded((expanded) => !expanded)}>{descriptionExpanded ? "See less" : "See more"}</button>}<button className="movie-detail-book" type="button" onClick={() => navigate("/user/login", { state: { userEntry: true } })}>Book now</button></div></section></div>}
    </main>
  );
};

export default UserHome;
