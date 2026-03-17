import React, { useState, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const GRADE_LEVELS = ["", ...Array.from({ length: 17 }, (_, i) => i + 1)];
const STEPS = ["", ...Array.from({ length: 15 }, (_, i) => i + 1)];
const UNITS = ["", "Mainstream", "Teaching", "Medical", "Judiciary", "Police", "Military"];
const SUB_TYPES = ["", "Standard", "Senior", "Principal", "Director"];
const SEX_OPTIONS = ["", "Male", "Female"];
const PROMOTION_TYPES = ["Promotion", "Conversion", "Appointment"];

const CUTOFF_DATE = "31st March, 2007";

const styles = {
  // Page shell
  page: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    fontSize: "13px",
    backgroundColor: "#f0f0f0",
    minHeight: "100vh",
    padding: "10px",
    boxSizing: "border-box",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "12px 16px",
    marginBottom: "10px",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: "13px",
    marginBottom: "10px",
    color: "#222",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
  },
  label: {
    fontSize: "13px",
    color: "#333",
    whiteSpace: "nowrap",
  },
  input: {
    fontSize: "12px",
    padding: "3px 5px",
    border: "1px solid #999",
    borderRadius: "3px",
    height: "24px",
    boxSizing: "border-box",
  },
  select: {
    fontSize: "12px",
    padding: "2px 4px",
    border: "1px solid #999",
    borderRadius: "3px",
    height: "24px",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  button: {
    fontSize: "12px",
    padding: "3px 10px",
    border: "1px solid #999",
    borderRadius: "3px",
    backgroundColor: "#e8e8e8",
    cursor: "pointer",
    height: "24px",
    whiteSpace: "nowrap",
  },
  buttonActive: {
    backgroundColor: "#d0d0d0",
    fontWeight: "bold",
  },
  // Bottom action row
  bottomRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  finalStatusBox: {
    border: "1px solid #ccc",
    borderRadius: "3px",
    padding: "8px 16px",
    minWidth: "200px",
    fontSize: "13px",
    backgroundColor: "#fff",
  },
  // Right panel
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "200px",
  },
  rightButton: {
    fontSize: "12px",
    padding: "5px 10px",
    border: "1px solid #999",
    borderRadius: "3px",
    backgroundColor: "#e8e8e8",
    cursor: "pointer",
    textAlign: "center",
    width: "100%",
  },
  // Middle section: promotion history + right panel side by side
  middleSection: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
    alignItems: "flex-start",
  },
  promotionCard: {
    flex: 1,
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "12px 16px",
    minHeight: "120px",
  },
  resultsCard: {
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "12px 16px",
    width: "220px",
    flexShrink: 0,
  },
  sessionStatusBar: {
    backgroundColor: "#555",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "3px",
    fontSize: "12px",
    marginTop: "6px",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}-${m}-${y}`;
}

function DateInput({ value, onChange, placeholder = "DD-MM-YY" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...styles.input, width: "120px", opacity: value ? 1 : 0.6 }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MainLayout({ apiBaseUrl, authToken, onOpenSidebar }) {
  // Personal Info
  const [name, setName] = useState("");
  const [oracleNumber, setOracleNumber] = useState("");
  const [sex, setSex] = useState("");
  const [dob, setDob] = useState("");

  // Employee Info
  const [unit, setUnit] = useState("");
  const [subType, setSubType] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [initialGrade, setInitialGrade] = useState("");
  const [initialStep, setInitialStep] = useState("");

  // Promotion form fields
  const [promoDate, setPromoDate] = useState("");
  const [promoGrade, setPromoGrade] = useState("");
  const [promoStep, setPromoStep] = useState("");
  const [promoType, setPromoType] = useState("Promotion");
  const [promotions, setPromotions] = useState([]);
  const [selectedPromoIndex, setSelectedPromoIndex] = useState(null);

  // Results
  const [finalGrade, setFinalGrade] = useState("--");
  const [finalStep, setFinalStep] = useState("--");
  const [isCalculating, setIsCalculating] = useState(false);

  // Export session
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState([]);
  const [sessionStatus, setSessionStatus] = useState("No active session");

  // ── Promotion CRUD ──────────────────────────────────────────────────────────

  const handleAddPromotion = useCallback(() => {
    if (!promoDate || !promoGrade) return;
    const entry = {
      date: promoDate,
      grade: promoGrade,
      step: promoStep,
      type: promoType,
    };
    setPromotions((prev) => [...prev, entry]);
    setPromoDate("");
    setPromoGrade("");
    setPromoStep("");
    setPromoType("Promotion");
  }, [promoDate, promoGrade, promoStep, promoType]);

  const handleRemovePromotion = useCallback(() => {
    if (selectedPromoIndex === null) return;
    setPromotions((prev) => prev.filter((_, i) => i !== selectedPromoIndex));
    setSelectedPromoIndex(null);
  }, [selectedPromoIndex]);

  const handleEditPromotion = useCallback(() => {
    if (selectedPromoIndex === null) return;
    const p = promotions[selectedPromoIndex];
    setPromoDate(p.date);
    setPromoGrade(p.grade);
    setPromoStep(p.step);
    setPromoType(p.type);
    setPromotions((prev) => prev.filter((_, i) => i !== selectedPromoIndex));
    setSelectedPromoIndex(null);
  }, [selectedPromoIndex, promotions]);

  const handleClearPromotions = useCallback(() => {
    setPromotions([]);
    setSelectedPromoIndex(null);
  }, []);

  // ── Progression Calculation ─────────────────────────────────────────────────

  const handleCalculate = useCallback(async () => {
    if (!appointmentDate || !initialGrade) return;
    setIsCalculating(true);
    try {
      const payload = {
        employee_id: oracleNumber || "EMP",
        appointment_date: appointmentDate,
        current_grade: parseInt(initialGrade),
        current_step: parseInt(initialStep) || 1,
        unit_type: unit || "Mainstream",
        sub_type: subType || "Standard",
        promotions: promotions.map((p) => ({
          date: p.date,
          new_grade: parseInt(p.grade),
          new_step: parseInt(p.step) || 1,
          type: p.type,
        })),
      };

      const response = await fetch(`${apiBaseUrl}/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setFinalGrade(data.final_grade ?? "--");
        setFinalStep(data.final_step ?? "--");
      } else {
        setFinalGrade("Err");
        setFinalStep("Err");
      }
    } catch {
      setFinalGrade("Err");
      setFinalStep("Err");
    } finally {
      setIsCalculating(false);
    }
  }, [apiBaseUrl, authToken, appointmentDate, initialGrade, initialStep, unit, subType, promotions, oracleNumber]);

  const handleClear = useCallback(() => {
    setName("");
    setOracleNumber("");
    setSex("");
    setDob("");
    setUnit("");
    setSubType("");
    setAppointmentDate("");
    setInitialGrade("");
    setInitialStep("");
    setPromotions([]);
    setFinalGrade("--");
    setFinalStep("--");
    setSelectedPromoIndex(null);
  }, []);

  // ── Export Session ──────────────────────────────────────────────────────────

  const handleNewSession = useCallback(() => {
    setSessionActive(true);
    setSessionData([]);
    setSessionStatus("Session active — 0 records");
  }, []);

  const handleContinueSession = useCallback(() => {
    if (!sessionActive) return;
    if (finalGrade === "--" || finalGrade === "Err") return;
    const record = {
      name,
      oracle: oracleNumber,
      sex,
      dob,
      unit,
      subType,
      appointmentDate,
      initialGrade,
      initialStep,
      finalGrade,
      finalStep,
      promotions,
    };
    setSessionData((prev) => {
      const updated = [...prev, record];
      setSessionStatus(`Session active — ${updated.length} record(s)`);
      return updated;
    });
  }, [sessionActive, finalGrade, finalStep, name, oracleNumber, sex, dob, unit, subType, appointmentDate, initialGrade, initialStep, promotions]);

  const handleExportSession = useCallback(() => {
    if (!sessionActive || sessionData.length === 0) return;
    const headers = [
      "Name", "Oracle No", "Sex", "DOB", "Unit", "Sub-Type",
      "Appointment Date", "Initial Grade", "Initial Step",
      "Final Grade", "Final Step",
    ];
    const rows = sessionData.map((r) => [
      r.name, r.oracle, r.sex, r.dob, r.unit, r.subType,
      r.appointmentDate, r.initialGrade, r.initialStep,
      r.finalGrade, r.finalStep,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "salary_progression_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    setSessionStatus("Exported successfully");
    setSessionActive(false);
  }, [sessionActive, sessionData]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>

      {/* ── Personal Information ─────────────────────────────────────────── */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Personal Information</div>
        <div style={styles.row}>
          <span style={styles.label}>Name:</span>
          <input
            style={{ ...styles.input, width: "160px" }}
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <span style={styles.label}>Oracle Number:</span>
          <input
            style={{ ...styles.input, width: "120px" }}
            placeholder="Enter oracle no"
            value={oracleNumber}
            onChange={(e) => setOracleNumber(e.target.value)}
          />
          <span style={styles.label}>Sex:</span>
          <select style={{ ...styles.select, width: "80px" }} value={sex} onChange={(e) => setSex(e.target.value)}>
            {SEX_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <span style={styles.label}>Date of Birth:</span>
          <DateInput value={dob} onChange={setDob} />
        </div>
      </div>

      {/* ── Employee Information ─────────────────────────────────────────── */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Employee Information</div>
        <div style={styles.row}>
          <span style={styles.label}>Unit:</span>
          <select style={{ ...styles.select, width: "130px" }} value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <span style={styles.label}>Sub-Type:</span>
          <select style={{ ...styles.select, width: "120px" }} value={subType} onChange={(e) => setSubType(e.target.value)}>
            {SUB_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={styles.label}>Date of Appointment:</span>
          <DateInput value={appointmentDate} onChange={setAppointmentDate} />
          <span style={styles.label}>Initial Grade Level:</span>
          <select style={{ ...styles.select, width: "80px" }} value={initialGrade} onChange={(e) => setInitialGrade(e.target.value)}>
            {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <span style={styles.label}>Initial Step:</span>
          <select style={{ ...styles.select, width: "60px" }} value={initialStep} onChange={(e) => setInitialStep(e.target.value)}>
            {STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ── Promotion History + Progression Results ──────────────────────── */}
      <div style={styles.middleSection}>

        {/* Promotion History */}
        <div style={styles.promotionCard}>
          <div style={styles.sectionTitle}>Promotion/Advancement History</div>

          {/* Input row */}
          <div style={styles.row}>
            <span style={styles.label}>Date:</span>
            <DateInput value={promoDate} onChange={setPromoDate} />
            <span style={styles.label}>New Grade:</span>
            <select style={{ ...styles.select, width: "70px" }} value={promoGrade} onChange={(e) => setPromoGrade(e.target.value)}>
              {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <span style={styles.label}>New Step:</span>
            <select style={{ ...styles.select, width: "60px" }} value={promoStep} onChange={(e) => setPromoStep(e.target.value)}>
              {STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={styles.label}>Type:</span>
            <select style={{ ...styles.select, width: "110px" }} value={promoType} onChange={(e) => setPromoType(e.target.value)}>
              {PROMOTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button style={styles.button} onClick={handleAddPromotion}>Add Promotion</button>
          </div>

          {/* Action buttons */}
          <div style={styles.row}>
            <button style={styles.button} onClick={handleRemovePromotion}>Remove Promotion</button>
            <button style={styles.button} onClick={handleEditPromotion}>Edit Promotion</button>
            <button style={styles.button} onClick={handleClearPromotions}>Clear All Promotions</button>
          </div>

          {/* Promotion list */}
          {promotions.length > 0 && (
            <div style={{ marginTop: "8px", fontSize: "12px" }}>
              {promotions.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedPromoIndex(i === selectedPromoIndex ? null : i)}
                  style={{
                    padding: "3px 6px",
                    cursor: "pointer",
                    backgroundColor: i === selectedPromoIndex ? "#d0e4f7" : i % 2 === 0 ? "#f7f7f7" : "#fff",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {formatDate(p.date)} — Grade {p.grade}, Step {p.step || "—"} ({p.type})
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progression Results */}
        <div style={styles.resultsCard}>
          <div style={styles.sectionTitle}>Progression Results</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button style={styles.rightButton} onClick={handleCalculate} disabled={isCalculating}>
              {isCalculating ? "Calculating..." : "Show Results"}
            </button>
            <button style={styles.rightButton} onClick={onOpenSidebar}>
              View Entries
            </button>
            <button style={{ ...styles.rightButton, fontWeight: "bold" }} onClick={onOpenSidebar}>
              Reports
            </button>
          </div>
        </div>
      </div>

      {/* ── Calculate / Final Status / Save ─────────────────────────────── */}
      <div style={styles.card}>
        <div style={styles.bottomRow}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button style={styles.button} onClick={handleCalculate} disabled={isCalculating}>
              {isCalculating ? "Calculating..." : "Calculate Progression"}
            </button>
            <button style={styles.button} onClick={handleClear}>Clear</button>
          </div>

          <div style={styles.finalStatusBox}>
            <div style={{ fontWeight: "bold" }}>Final Status as @ {CUTOFF_DATE}</div>
            <div style={{ marginTop: "4px" }}>
              Grade: <strong>{finalGrade}</strong>&nbsp;&nbsp;Step: <strong>{finalStep}</strong>
            </div>
          </div>

          <button style={styles.button} onClick={handleContinueSession}>
            Save for Export
          </button>
        </div>
      </div>

      {/* ── Export Management ────────────────────────────────────────────── */}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Export Management</div>
        <div style={styles.row}>
          <button style={{ ...styles.button, fontWeight: sessionActive ? "normal" : "bold" }} onClick={handleNewSession}>
            New Session
          </button>
          <button style={styles.button} onClick={handleContinueSession} disabled={!sessionActive}>
            Continue Session
          </button>
          <button style={styles.button} onClick={handleExportSession} disabled={!sessionActive}>
            Export Session
          </button>
        </div>
        <div style={styles.sessionStatusBar}>{sessionStatus}</div>
      </div>
    </div>
  );
}
