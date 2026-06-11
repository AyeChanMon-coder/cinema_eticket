import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

interface DashboardData {
  data: string;
}

const Dashboard: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<DashboardData>("/admin/dashboard")
      .then((res) => setMessage(res.data.data))
      .catch(() => {
        // Token သက်တမ်းကုန်လျှင် သို့မဟုတ် Error တစ်ခုခု တက်လျှင် ထွက်မည်
        localStorage.removeItem("admin_token");
        navigate("/login");
      });
  }, [navigate]);

  const handleLogout = async (): Promise<void> => {
    try {
      await api.post("/logout");
    } finally {
      localStorage.removeItem("admin_token");
      navigate("/login");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Admin Dashboard</h1>
      <p>
        Backend Status:{" "}
        <strong style={{ color: "green" }}>{message || "Loading..."}</strong>
      </p>
      <hr />
      <button
        onClick={handleLogout}
        style={{
          backgroundColor: "#dc3545",
          color: "white",
          padding: "10px 20px",
          border: "none",
          cursor: "pointer",
          borderRadius: "4px",
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
