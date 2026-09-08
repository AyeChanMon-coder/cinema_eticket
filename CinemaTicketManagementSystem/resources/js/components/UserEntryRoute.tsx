import { Navigate, Outlet, useLocation } from "react-router-dom";

const UserEntryRoute: React.FC = () => {
  const location = useLocation();
  const allowed = Boolean(location.state && (location.state as { userEntry?: boolean }).userEntry);

  return allowed ? <Outlet /> : <Navigate to="/" replace />;
};

export default UserEntryRoute;
