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
        {loading ? <p className="catalog-state">Loading movies...</p> : <div className="public-movie-grid">{filteredMovies.map((movie) => <article className="public-movie-card" key={movie.movieId}><div className="public-poster">{movie.image ? <img src={`${window.location.origin}/storage/${movie.image}`} alt={movie.title} /> : <span>No poster</span>}</div><strong>{movie.title}</strong><small>{movie.genre} · {movie.duration} min</small><button type="button" onClick={() => navigate("/user/login", { state: { userEntry: true } })}>More</button></article>)}</div>}
        {!loading && filteredMovies.length === 0 && <p className="catalog-state">No movies found.</p>}
        <div className="catalog-dots"><span className="active" /><span /><span /></div>
      </section>
    </main>
  );
};

export default UserHome;
