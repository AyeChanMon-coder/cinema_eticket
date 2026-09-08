import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MoviesPage from "./pages/MoviesPage";
import CinemasPage from "./pages/CinemasPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/admin/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/movies" element={<MoviesPage />} />
            <Route path="/admin/cinemas" element={<CinemasPage />} />
            <Route path="/admin/bookings" element={<Dashboard />} />
            <Route path="/admin/users" element={<Dashboard />} />
            <Route path="/admin/reports" element={<Dashboard />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;