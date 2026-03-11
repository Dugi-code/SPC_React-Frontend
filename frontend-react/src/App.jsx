import React, { useMemo } from "react";
import SalaryProgressionSidebar from "./SalaryProgressionSidebar";

export default function App() {
  const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const authToken = process.env.REACT_APP_API_KEY || "CHANGEME";

  const initialEmployees = useMemo(
    () => [
      {
        employee_id: "EMP001",
        appointment_date: "1985-01-15",
        current_grade: 7,
        current_step: 1,
        unit_type: "Mainstream",
        sub_type: "Standard",
        promotions: [],
      },
    ],
    []
  );

  return (
    <div style={{ height: "100vh" }}>
      <SalaryProgressionSidebar
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        initialEmployees={initialEmployees}
        onClose={() => {}}
        onResult={() => {}}
      />
    </div>
  );
}

