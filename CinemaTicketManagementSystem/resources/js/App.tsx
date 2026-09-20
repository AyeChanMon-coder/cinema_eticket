import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MoviesPage from "./pages/MoviesPage";
import CinemasPage from "./pages/CinemasPage";
import UsersPage from "./pages/UsersPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import UserLogin from "./pages/UserLogin";
import UserRegister from "./pages/UserRegister";
import UserHome from "./pages/UserHome";
import UserEntryRoute from "./components/UserEntryRoute";
import UserBooking from "./pages/UserBooking";
import SeatSelection from "./pages/SeatSelection";
import BookingDetail from "./pages/BookingDetail";
import PaymentInformation from "./pages/PaymentInformation";
import TicketPage from "./pages/TicketPage";
import UserBookings from "./pages/UserBookings";
import SeatsPage from "./pages/SeatsPage";
import PaymentsPage from "./pages/PaymentsPage";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route element={<UserEntryRoute />}>
          <Route path="/user/login" element={<UserLogin />} />
          <Route path="/user/register" element={<UserRegister />} />
        </Route>
        <Route path="/user/booking" element={<UserBooking />} />
        <Route path="/user/booking/seats" element={<SeatSelection />} />
        <Route path="/user/booking/detail" element={<BookingDetail />} />
        <Route path="/user/booking/payment" element={<PaymentInformation />} />
        <Route path="/user/booking/payment/ticket" element={<TicketPage />} />
        <Route path="/user/bookings" element={<UserBookings />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/movies" element={<MoviesPage />} />
            <Route path="/admin/cinemas" element={<CinemasPage />} />
            <Route path="/admin/seats" element={<SeatsPage />} />
            <Route path="/admin/bookings" element={<Dashboard />} />
            <Route path="/admin/payments" element={<PaymentsPage />} />
            <Route path="/admin/payment-methods" element={<PaymentMethodsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/reports" element={<Dashboard />} />
          </Route>
        </Route>

        <Route path="/user/home" element={<Navigate to="/" replace />} />

        <Route path="/" element={<UserHome />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;