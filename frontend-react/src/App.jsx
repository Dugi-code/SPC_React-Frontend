import React, { useState, useMemo } from "react";
import SalaryProgressionSidebar from "./SalaryProgressionSidebar";
import MainLayout from "./MainLayout";

export default function App() {
  const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const authToken = process.env.REACT_APP_API_KEY || "CHANGEME";

  const [showSidebar, setShowSidebar] = useState(false);
  const [progressionResult, setProgressionResult] = useState(null);

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
      {/* Main layout is always the root view */}
      <MainLayout
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        progressionResult={progressionResult}
        onOpenSidebar={() => setShowSidebar(true)}
      />

      {/* Sidebar renders as overlay only when triggered */}
      {showSidebar && (
        <SalaryProgressionSidebar
          apiBaseUrl={apiBaseUrl}
          authToken={authToken}
          initialEmployees={initialEmployees}
          onClose={() => setShowSidebar(false)}
          onResult={(result) => {
            setProgressionResult(result);
            setShowSidebar(false);
          }}
        />
      )}
    </div>
  );
}
