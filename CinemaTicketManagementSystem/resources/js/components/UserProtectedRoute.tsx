import { Navigate, Outlet } from "react-router-dom";

const UserProtectedRoute: React.FC = () => {
  const token = localStorage.getItem("user_token");

  return token ? <Outlet /> : <Navigate to="/user/login" replace />;
};

export default UserProtectedRoute;
