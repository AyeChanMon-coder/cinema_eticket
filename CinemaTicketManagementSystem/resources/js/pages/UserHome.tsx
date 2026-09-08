import { useNavigate } from "react-router-dom";

const UserHome = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_id");
    navigate("/user/login", { replace: true });
  };

  return (
    <main className="user-home">
      <section className="user-home-panel">
        <img className="user-home-logo" src="/cinema-logo.svg" alt="Cinema" />
        <p className="eyebrow">Cinema ticket booking</p>
        <h1>Welcome to Cinema</h1>
        <p>Browse movies and book your next showtime.</p>
        <button className="btn-primary" type="button" onClick={logout}>Sign out</button>
      </section>
    </main>
  );
};

export default UserHome;
