import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    
    try {
      const response = await api.post("/admin/login", { email, password });
      localStorage.setItem("admin_token", response.data.access_token);
      localStorage.setItem("admin_user_type", String(response.data.userType));
      navigate("/admin/dashboard");
    } catch (err: unknown) {
      setError("Admin email or password is incorrect.");
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <img className="login-logo" src="/cinema-logo.svg" alt="Cinema" />
        <h1>LOGIN</h1>
        <form onSubmit={handleSubmit}>
          <div className="login-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          </div>
          <div className="login-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button className="login-button" type="submit">Login</button>
        </form>
      </section>
    </main>
  );
};

export default Login;
