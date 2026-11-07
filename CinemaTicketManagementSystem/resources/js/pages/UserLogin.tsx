import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

const UserLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      const response = await api.post("/user/login", { email, password });
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user_id");
      localStorage.removeItem("admin_user_type");
      localStorage.setItem("user_token", response.data.access_token);
      localStorage.setItem("user_id", String(response.data.userId));
      const bookingMovie = (location.state as { bookingMovie?: unknown } | null)?.bookingMovie;
      navigate(bookingMovie ? "/user/booking" : "/", bookingMovie ? { state: { movie: bookingMovie } } : undefined);
    } catch {
      setError("User email or password is incorrect.");
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <img className="login-logo" src="/cinema-logo.svg" alt="Cinema" />
        <p className="login-kicker">Cinema ticket booking</p>
        <h1>USER LOGIN</h1>
        <form onSubmit={submit}>
          <div className="login-field"><label htmlFor="user-login-email">Email</label><input id="user-login-email" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <div className="login-field"><label htmlFor="user-login-password">Password</label><input id="user-login-password" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
          {error && <p className="login-error">{error}</p>}
          <button className="login-button" type="submit">Login</button>
        </form>
        <p className="auth-switch">Don't have an account? <Link to="/user/register" state={{ userEntry: true }}>Sign up</Link></p>
      </section>
    </main>
  );
};

export default UserLogin;
