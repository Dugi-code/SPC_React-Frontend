import React, { useState, useMemo, useEffect } from "react";
import SalaryProgressionSidebar from "./SalaryProgressionSidebar";
import MainLayout from "./MainLayout";

export default function App() {
  // Empty string = relative URL → Vercel proxy forwards to Render backend.
  // This means all API calls go to the same domain as the frontend
  // (e.g. https://your-app.vercel.app/api/v1/compute), so browser
  // extensions and CORS can never block them.
  // For local development, set REACT_APP_API_URL=http://localhost:8000
  // in a .env.local file.
  const apiBaseUrl = process.env.REACT_APP_API_URL ?? "";
  const authToken = process.env.REACT_APP_API_KEY || "CHANGEME";

  const [showSidebar, setShowSidebar] = useState(false);
  const [progressionResult, setProgressionResult] = useState(null);

  // ── Wake-up ping ────────────────────────────────────────────────────────────
  // Render free tier spins down after 15 min of inactivity and takes
  // 30-60 seconds to restart. Pinging /healthz on app mount ensures the
  // backend is warm before the user fills the form and clicks Calculate.
  useEffect(() => {
    fetch(`${apiBaseUrl}/healthz`, {
      method: "GET",
      headers: { "X-API-Key": authToken },
    }).catch(() => {
      // Intentionally silent — this is best-effort wake-up only.
    });
  }, [apiBaseUrl, authToken]);

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
