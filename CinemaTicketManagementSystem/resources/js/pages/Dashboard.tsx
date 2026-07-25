import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Dashboard: React.FC = () => {
  const [message, setMessage] = useState("Loading...");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/admin/dashboard");
        setMessage(response.data.data || "Welcome to the Dashboard");
      } catch (error) {
        setMessage("Unable to load dashboard.");
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  return (
    <main>
      <h1>Admin Dashboard</h1>
      <p>{message}</p>
      <button onClick={handleLogout}>Logout</button>
    </main>
  );
};

export default Dashboard;
