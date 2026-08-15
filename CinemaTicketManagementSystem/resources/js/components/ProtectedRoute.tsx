import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute: React.FC = () => {
  const token: string | null = localStorage.getItem("admin_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
