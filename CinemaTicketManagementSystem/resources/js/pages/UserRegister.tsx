import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const UserRegister = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmation: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmation) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const response = await api.post("/user/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.confirmation,
      });
      localStorage.setItem("user_token", response.data.access_token);
      localStorage.setItem("user_id", String(response.data.userId));
      navigate("/user/home");
    } catch {
      setError("Unable to create account. Check your details and try again.");
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel register-panel">
        <img className="login-logo" src="/cinema-logo.svg" alt="Cinema" />
        <p className="login-kicker">Cinema ticket booking</p>
        <h1>CREATE ACCOUNT</h1>
        <form onSubmit={submit}>
          <div className="login-field"><label htmlFor="register-name">Name</label><input id="register-name" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
          <div className="login-field"><label htmlFor="register-email">Email</label><input id="register-email" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div>
          <div className="login-field"><label htmlFor="register-password">Password</label><input id="register-password" type="password" placeholder="Password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></div>
          <div className="login-field"><label htmlFor="register-confirmation">Confirm password</label><input id="register-confirmation" type="password" placeholder="Confirm password" minLength={8} value={form.confirmation} onChange={(event) => setForm({ ...form, confirmation: event.target.value })} required /></div>
          {error && <p className="login-error">{error}</p>}
          <button className="login-button" type="submit">Sign up</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/user/login">Login</Link></p>
      </section>
    </main>
  );
};

export default UserRegister;
