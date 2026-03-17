/**
 * MainLayout.jsx
 * Exact React port of the original index.html SalaryProgressionApp.
 * Preserves: units (Mainstream/Local Government/Tescom/Subeb),
 * subtypes (Standard/HATISS/HSS/HSS & HATISS/MSS),
 * date format (DD-MM-YY text input + 📅 calendar popup),
 * dynamic grade options per unit/subtype/date, promotion types
 * (Promotion/Advancement/Conversion/Harmonization), table display,
 * results/entries/reports dialogs, session management, API integration.
 */
import React, { useState, useEffect, useRef } from "react";

// ─── Date Utilities ───────────────────────────────────────────────────────────

function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (year < 50) year += 2000;
    else year += 1900;
    return new Date(year, month - 1, day);
  } catch {
    return null;
  }
}

function formatDate(date) {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

function validateDateInput(text) {
  return text ? text.replace(/[^\d-]/g, "") : "";
}

// ─── Grade/Step Option Generator ─────────────────────────────────────────────

function getGradeStepOptions(unit, subtype, dateStr) {
  const date = parseDate(dateStr);
  const defaultSteps = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"];
  let grades = [];
  let steps = defaultSteps;

  if (unit === "Subeb" || unit === "Local Government") {
    grades = Array.from({ length: 17 }, (_, i) => i + 1).filter(g => g !== 11).map(String);
  } else if (unit === "Mainstream" || unit === "Tescom") {
    if (subtype === "Standard" || subtype === "HATISS") {
      grades = Array.from({ length: 17 }, (_, i) => i + 1).filter(g => g !== 11).map(String);
    } else if (subtype === "HSS" || subtype === "HSS & HATISS") {
      if (date) {
        const hssStart = new Date(1992, 4, 1);
        const hssEnd = new Date(1999, 0, 1);
        if (date >= hssStart && date < hssEnd) {
          grades = Array.from({ length: 15 }, (_, i) => `HSS ${i + 1}`);
        } else {
          grades = Array.from({ length: 17 }, (_, i) => i + 1).map(String);
        }
      } else {
        grades = Array.from({ length: 17 }, (_, i) => i + 1).map(String);
      }
    } else if (subtype === "MSS") {
      if (date) {
        const mssStart = new Date(1992, 4, 1);
        const mssEnd = new Date(1999, 0, 1);
        if (date >= mssStart && date < mssEnd) {
          grades = Array.from({ length: 7 }, (_, i) => `MSS ${i + 1}`);
          steps = ["1","2","3","4","5","6"];
        } else {
          grades = Array.from({ length: 17 }, (_, i) => i + 1).filter(g => g !== 11).map(String);
        }
      } else {
        grades = Array.from({ length: 17 }, (_, i) => i + 1).filter(g => g !== 11).map(String);
      }
    } else {
      grades = Array.from({ length: 17 }, (_, i) => i + 1).map(String);
    }
  } else {
    grades = Array.from({ length: 17 }, (_, i) => i + 1).map(String);
  }

  return { grades, steps };
}

// ─── Shared Styles (matching index.html CSS exactly) ─────────────────────────

const s = {
  btn: {
    padding: "4px 12px",
    border: "1px solid #ccc",
    borderRadius: "2px",
    background: "#F0F0F0",
    cursor: "pointer",
    fontSize: "13px",
  },
  calBtn: {
    padding: "2px 6px",
    minWidth: "20px",
    maxWidth: "20px",
    border: "1px solid #ccc",
    borderRadius: "2px",
    background: "#F0F0F0",
    cursor: "pointer",
    fontSize: "13px",
  },
  input: {
    padding: "2px 4px",
    border: "1px solid #ccc",
    borderRadius: "2px",
    fontSize: "13px",
    background: "white",
  },
  select: {
    padding: "2px 4px",
    border: "1px solid #ccc",
    borderRadius: "2px",
    fontSize: "13px",
    background: "white",
  },
  section: {
    border: "1px solid #ccc",
    borderRadius: "4px",
    margin: "10px",
    padding: "12px",
    background: "white",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: "10pt",
    marginBottom: "8px",
    color: "#333",
  },
  fieldsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },
  fieldGroup: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  label: {
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  th: {
    border: "1px solid #ddd",
    padding: "4px",
    textAlign: "left",
    fontSize: "12px",
    background: "#f0f0f0",
    fontWeight: "bold",
  },
  td: {
    border: "1px solid #ddd",
    padding: "4px",
    fontSize: "12px",
  },
};

// ─── Calendar Component ───────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function Calendar({ onDateSelect, onClose, initialDate, position }) {
  const [current, setCurrent] = useState(initialDate || new Date());
  const [selected, setSelected] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (position && ref.current) {
      ref.current.style.left = `${position.x}px`;
      ref.current.style.top = `${position.y}px`;
    }
  }, [position]);

  const daysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const firstDay = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDay(current); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth(current); d++) cells.push(d);

  return (
    <div ref={ref} style={{
      position: "fixed", background: "white", border: "1px solid #ccc",
      borderRadius: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000, padding: "10px", minWidth: "300px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <button style={s.btn} onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}>‹</button>
        <span>{MONTHS[current.getMonth()]} {current.getFullYear()}</span>
        <button style={s.btn} onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {DAYS.map(d => <div key={d} style={{ fontWeight: "bold", textAlign: "center", fontSize: "12px" }}>{d}</div>)}
        {cells.map((day, idx) => (
          <div
            key={idx}
            onClick={() => { if (!day) return; const d = new Date(current.getFullYear(), current.getMonth(), day); setSelected(d); onDateSelect(formatDate(d)); onClose(); }}
            style={{
              padding: "8px", textAlign: "center", fontSize: "12px",
              cursor: day ? "pointer" : "default",
              visibility: day ? "visible" : "hidden",
              border: "1px solid #ddd",
              background: day && selected && day === selected.getDate() ? "#0078D7" : "white",
              color: day && selected && day === selected.getDate() ? "white" : "#333",
            }}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PersonalInfo ─────────────────────────────────────────────────────────────

function PersonalInfo({ data, onChange, disabled }) {
  const [showCal, setShowCal] = useState(false);
  const [calPos, setCalPos] = useState({ x: 0, y: 0 });
  const dobRef = useRef(null);

  const openCal = (e) => {
    if (disabled) return;
    const r = e.target.getBoundingClientRect();
    setCalPos({ x: r.left, y: r.bottom + 5 });
    setShowCal(true);
  };

  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>Personal Information</div>
      <div style={s.fieldsRow}>
        <div style={s.fieldGroup}>
          <label style={s.label}>Name:</label>
          <input type="text" value={data.name || ""} placeholder="Enter name" style={s.input} disabled={disabled}
            onChange={e => onChange({ ...data, name: e.target.value.replace(/[^a-zA-Z\s-]/g, "") })} />
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>Oracle Number:</label>
          <input type="text" value={data.oracle_number || ""} placeholder="Enter oracle number"
            style={{ ...s.input, width: "90px" }} disabled={disabled}
            onChange={e => onChange({ ...data, oracle_number: e.target.value.replace(/\D/g, "") })} />
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>Sex:</label>
          <select value={data.sex || ""} style={{ ...s.select, width: "60px" }} disabled={disabled}
            onChange={e => onChange({ ...data, sex: e.target.value })}>
            <option value=""> </option>
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>Date of Birth:</label>
          <input ref={dobRef} type="text" value={data.dob || ""} placeholder="DD-MM-YY"
            style={{ ...s.input, width: "90px" }} disabled={disabled}
            onChange={e => onChange({ ...data, dob: validateDateInput(e.target.value) })} />
          <button style={s.calBtn} onClick={openCal} disabled={disabled} tabIndex={-1}>📅</button>
        </div>
      </div>
      {showCal && (
        <Calendar
          onDateSelect={date => { onChange({ ...data, dob: date }); setShowCal(false); }}
          onClose={() => setShowCal(false)}
          initialDate={parseDate(data.dob)}
          position={calPos}
        />
      )}
    </div>
  );
}

// ─── EmployeeInfo ─────────────────────────────────────────────────────────────

function EmployeeInfo({ data, onChange, disabled }) {
  const [showCal, setShowCal] = useState(false);
  const [calPos, setCalPos] = useState({ x: 0, y: 0 });
  const [gradeOptions, setGradeOptions] = useState([]);
  const [stepOptions, setStepOptions] = useState([]);

  useEffect(() => {
    const { grades, steps } = getGradeStepOptions(data.unit, data.subtype, data.appointment_date);
    setGradeOptions(grades);
    setStepOptions(steps);
  }, [data.unit, data.subtype, data.appointment_date]);

  const handleUnitChange = (unit) => {
    let nd = { ...data, unit };
    if (unit === "Subeb" || unit === "Local Government") nd.subtype = "Standard";
    else if (unit === "Mainstream" || unit === "Tescom") { if (!nd.subtype) nd.subtype = "Standard"; }
    else nd.subtype = "";
    onChange(nd);
  };

  const openCal = (e) => {
    if (disabled) return;
    const r = e.target.getBoundingClientRect();
    setCalPos({ x: r.left, y: r.bottom + 5 });
    setShowCal(true);
  };

  const subtypeDisabled = disabled || data.unit === "Subeb" || data.unit === "Local Government";

  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>Employee Information</div>
      <div style={s.fieldsRow}>
        <div style={s.fieldGroup}>
          <label style={s.label}>Unit:</label>
          <select value={data.unit || ""} style={s.select} disabled={disabled} onChange={e => handleUnitChange(e.target.value)}>
            <option value=""> </option>
            <option value="Mainstream">Mainstream</option>
            <option value="Local Government">Local Government</option>
            <option value="Tescom">Tescom</option>
            <option value="Subeb">Subeb</option>
          </select>
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>Sub-Type:</label>
          <select value={data.subtype || ""} style={s.select} disabled={subtypeDisabled} onChange={e => onChange({ ...data, subtype: e.target.value })}>
            <option value=""> </option>
            <option value="Standard">Standard</option>
            <option value="HATISS">HATISS</option>
            <option value="HSS">HSS</option>
            <option value="HSS & HATISS">HSS &amp; HATISS</option>
            <option value="MSS">MSS</option>
          </select>
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>Date of Appointment:</label>
          <input type="text" value={data.appointment_date || ""} placeholder="DD-MM-YY"
            style={{ ...s.input, width: "90px" }} disabled={disabled}
            onChange={e => onChange({ ...data, appointment_date: validateDateInput(e.target.value) })} />
          <button style={s.calBtn} onClick={openCal} disabled={disabled} tabIndex={-1}>📅</button>
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>Initial Grade Level:</label>
          <select value={data.grade || ""} style={{ ...s.select, width: "70px" }} disabled={disabled} onChange={e => onChange({ ...data, grade: e.target.value })}>
            <option value=""> </option>
            {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>Initial Step:</label>
          <select value={data.step || ""} style={{ ...s.select, width: "50px" }} disabled={disabled} onChange={e => onChange({ ...data, step: e.target.value })}>
            <option value=""> </option>
            {stepOptions.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      </div>
      {showCal && (
        <Calendar
          onDateSelect={date => { onChange({ ...data, appointment_date: date }); setShowCal(false); }}
          onClose={() => setShowCal(false)}
          initialDate={parseDate(data.appointment_date)}
          position={calPos}
        />
      )}
    </div>
  );
}

// ─── PromotionHistory ─────────────────────────────────────────────────────────

function PromotionHistory({ promotions, onPromotionsChange, unit, subtype, disabled }) {
  const [form, setForm] = useState({ date: "", grade: "", step: "", type: "Promotion" });
  const [editingIdx, setEditingIdx] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [showCal, setShowCal] = useState(false);
  const [calPos, setCalPos] = useState({ x: 0, y: 0 });
  const [gradeOptions, setGradeOptions] = useState([]);
  const [stepOptions, setStepOptions] = useState([]);

  const dateRef = useRef(null);
  const gradeRef = useRef(null);
  const stepRef = useRef(null);
  const typeRef = useRef(null);

  useEffect(() => {
    const { grades, steps } = getGradeStepOptions(unit, subtype, form.date);
    setGradeOptions(grades);
    setStepOptions(steps);
  }, [unit, subtype, form.date]);

  const addPromotion = () => {
    if (!form.date || !form.grade || !form.type) return;
    if (editingIdx >= 0) {
      const updated = [...promotions];
      updated[editingIdx] = { ...form };
      onPromotionsChange(updated);
      setSelectedIdx(editingIdx);
      setEditingIdx(-1);
    } else {
      const next = [...promotions, { ...form }];
      onPromotionsChange(next);
      setSelectedIdx(next.length - 1);
    }
    setForm({ date: "", grade: "", step: "", type: "Promotion" });
    setTimeout(() => { if (dateRef.current) dateRef.current.focus(); }, 0);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !disabled) { e.preventDefault(); addPromotion(); } };

  const removePromotion = (idx) => {
    if (idx < 0 || idx >= promotions.length) return;
    onPromotionsChange(promotions.filter((_, i) => i !== idx));
    if (selectedIdx === idx) setSelectedIdx(-1);
    else if (selectedIdx > idx) setSelectedIdx(selectedIdx - 1);
  };

  const editPromotion = (idx) => {
    if (idx < 0 || idx >= promotions.length) return;
    setForm(promotions[idx]);
    setEditingIdx(idx);
    setSelectedIdx(idx);
    setTimeout(() => { if (dateRef.current) dateRef.current.focus(); }, 0);
  };

  const clearPromotions = () => {
    if (window.confirm("Clear all promotions?")) { onPromotionsChange([]); setSelectedIdx(-1); setEditingIdx(-1); }
  };

  const openCal = (e) => {
    if (disabled) return;
    const r = e.target.getBoundingClientRect();
    setCalPos({ x: r.left, y: r.bottom + 5 });
    setShowCal(true);
  };

  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>Promotion/Advancement History</div>
      <div style={s.fieldsRow}>
        <div style={s.fieldGroup}>
          <label style={s.label}>Date:</label>
          <input ref={dateRef} type="text" value={form.date} placeholder="DD-MM-YY"
            style={{ ...s.input, width: "90px" }} disabled={disabled}
            onChange={e => setForm({ ...form, date: validateDateInput(e.target.value) })}
            onKeyDown={handleKeyDown} />
          <button style={s.calBtn} onClick={openCal} disabled={disabled} tabIndex={-1}>📅</button>
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>New Grade:</label>
          <select ref={gradeRef} value={form.grade} style={{ ...s.select, width: "70px" }} disabled={disabled}
            onChange={e => setForm({ ...form, grade: e.target.value })} onKeyDown={handleKeyDown}>
            <option value=""> </option>
            {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>New Step:</label>
          <select ref={stepRef} value={form.step} style={{ ...s.select, width: "50px" }} disabled={disabled}
            onChange={e => setForm({ ...form, step: e.target.value })} onKeyDown={handleKeyDown}>
            <option value=""> </option>
            {stepOptions.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>Type:</label>
          <select ref={typeRef} value={form.type} style={s.select} disabled={disabled}
            onChange={e => setForm({ ...form, type: e.target.value })} onKeyDown={handleKeyDown}>
            <option value="Promotion">Promotion</option>
            <option value="Advancement">Advancement</option>
            <option value="Conversion">Conversion</option>
            <option value="Harmonization">Harmonization</option>
          </select>
        </div>
        <button style={s.btn} onClick={addPromotion} disabled={disabled}>Add Promotion</button>
      </div>

      {promotions.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px" }}>
          <thead>
            <tr>{["Date","New Grade","New Step","Type"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {promotions.map((p, idx) => (
              <tr key={idx}
                onClick={() => !disabled && setSelectedIdx(idx === selectedIdx ? -1 : idx)}
                style={{
                  cursor: disabled ? "default" : "pointer",
                  background: idx === selectedIdx ? "#0078D7" : "white",
                  color: idx === selectedIdx ? "white" : "#333",
                }}>
                <td style={s.td}>{p.date}</td>
                <td style={s.td}>{p.grade}</td>
                <td style={s.td}>{p.step}</td>
                <td style={s.td}>{p.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ ...s.fieldsRow, marginTop: "8px" }}>
        <button style={s.btn} disabled={disabled || promotions.length === 0 || selectedIdx < 0} onClick={() => removePromotion(selectedIdx)}>Remove Promotion</button>
        <button style={s.btn} disabled={disabled || promotions.length === 0 || selectedIdx < 0} onClick={() => editPromotion(selectedIdx)}>Edit Promotion</button>
        <button style={s.btn} disabled={disabled || promotions.length === 0} onClick={clearPromotions}>Clear All Promotions</button>
      </div>

      {showCal && (
        <Calendar
          onDateSelect={date => { setForm({ ...form, date }); setShowCal(false); setTimeout(() => { if (dateRef.current) dateRef.current.focus(); }, 0); }}
          onClose={() => setShowCal(false)}
          initialDate={parseDate(form.date)}
          position={calPos}
        />
      )}
    </div>
  );
}

// ─── ProgressionResults ───────────────────────────────────────────────────────

function ProgressionResults({ results, disabled, sessionData }) {
  const [showResults, setShowResults] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const [showReports, setShowReports] = useState(false);

  const modalStyle = {
    position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
    background: "white", padding: "20px", border: "1px solid #ccc", borderRadius: "4px",
    zIndex: 2000, maxWidth: "800px", maxHeight: "600px", overflow: "auto",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  };

  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>Progression Results</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button style={s.btn} onClick={() => setShowResults(true)} disabled={disabled || !results || results.length === 0}>Show Results</button>
        <button style={s.btn} onClick={() => setShowEntries(true)} disabled={disabled || !sessionData || sessionData.length === 0}>View Entries</button>
        <button style={s.btn} onClick={() => setShowReports(true)}>Reports</button>
      </div>

      {showResults && results && results.length > 0 && (
        <div style={modalStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Salary Progression Results</h3>
            <button style={s.btn} onClick={() => setShowResults(false)}>Close</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Date","Event","Grade","Step","Salary"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td style={s.td}>{r.date || ""}</td><td style={s.td}>{r.event || ""}</td>
                  <td style={s.td}>{r.grade || ""}</td><td style={s.td}>{r.step || ""}</td>
                  <td style={s.td}>{r.salary ? parseFloat(r.salary).toFixed(2) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEntries && sessionData && sessionData.length > 0 && (
        <div style={modalStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Saved Entries</h3>
            <button style={s.btn} onClick={() => setShowEntries(false)}>Close</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["S/N","Name","Oracle Number","GL & Step"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {sessionData.map((entry, i) => {
                let gl = "--";
                if (entry.final_status) {
                  const gm = entry.final_status.match(/Grade:\s*(.+?)\s+Step/);
                  const sm = entry.final_status.match(/Step:\s*(.+)/);
                  if (gm && sm) gl = `${gm[1]} ${sm[1]}`;
                } else if (entry.computed_grade && entry.computed_step) {
                  gl = `${entry.computed_grade} ${entry.computed_step}`;
                }
                return (
                  <tr key={i}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={s.td}>{entry.name || "--"}</td>
                    <td style={s.td}>{entry.oracle_number || "--"}</td>
                    <td style={s.td}>{gl}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showReports && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "4px", maxWidth: "90%", maxHeight: "90%", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", width: "900px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Reports - Search &amp; View</h2>
              <button style={s.btn} onClick={() => setShowReports(false)}>Close</button>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <input type="text" placeholder="Search by name, oracle number, unit, or date..." style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "2px" }} />
            </div>
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Reports functionality will load saved entries from database.</p>
              <p>Full implementation requires backend API endpoints for report management.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ExportManagement ─────────────────────────────────────────────────────────

function ExportManagement({ sessionActive, sessionData, onNewSession, onContinueSession, onExportSession }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>Export Management</div>
      <div style={s.fieldsRow}>
        <button style={s.btn} onClick={onNewSession}>New Session</button>
        <button style={s.btn} onClick={onContinueSession} disabled={sessionActive || sessionData.length === 0}>Continue Session</button>
        <button style={s.btn} onClick={onExportSession} disabled={sessionData.length === 0}>Export Session</button>
      </div>
      <div style={{
        padding: "8px", margin: "8px 0", borderRadius: "4px", fontWeight: "bold",
        background: sessionActive ? "#4CAF50" : "#999", color: "white",
      }}>
        {sessionActive
          ? `Active session - ${sessionData.length} entries`
          : sessionData.length > 0
            ? `Inactive session - ${sessionData.length} entries`
            : "No active session"}
      </div>
    </div>
  );
}

// ─── Root MainLayout ──────────────────────────────────────────────────────────

export default function MainLayout({ apiBaseUrl, authToken }) {
  const [personalInfo, setPersonalInfo] = useState({ name: "", oracle_number: "", sex: "", dob: "" });
  const [employeeInfo, setEmployeeInfo] = useState({ unit: "", subtype: "", appointment_date: "", grade: "", step: "" });
  const [promotions, setPromotions] = useState([]);
  const [results, setResults] = useState([]);
  const [finalStatus, setFinalStatus] = useState("Grade: -- Step: --");
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const headers = { "X-API-Key": authToken, "Content-Type": "application/json" };

  const validateSession = () => {
    if (!sessionActive) { alert("Please start a new session before making entries"); return false; }
    return true;
  };

  const calculateProgression = async () => {
    if (!validateSession()) return;
    if (!employeeInfo.appointment_date || !employeeInfo.grade || !employeeInfo.step) {
      alert("Please fill in all required employee information"); return;
    }
    setLoading(true); setError(null);
    try {
      let initialGrade = employeeInfo.grade;
      let hssGradeFlag = false, mssGradeFlag = false;
      if (typeof initialGrade === "string") {
        if (initialGrade.startsWith("HSS ")) { initialGrade = parseInt(initialGrade.replace("HSS ", "")); hssGradeFlag = true; }
        else if (initialGrade.startsWith("MSS ")) { mssGradeFlag = true; }
        else { initialGrade = parseInt(initialGrade) || initialGrade; }
      } else { initialGrade = parseInt(initialGrade) || initialGrade; }

      const promotionEntries = promotions.map(p => {
        let pg = p.grade, phss = false, pmss = false;
        if (typeof pg === "string") {
          if (pg.startsWith("HSS ")) { pg = parseInt(pg.replace("HSS ", "")); phss = true; }
          else if (pg.startsWith("MSS ")) { pmss = true; }
          else { pg = parseInt(pg) || pg; }
        } else { pg = parseInt(pg) || pg; }
        return { date: p.date, promotion_type: p.type, grade: pg, new_grade: pg, step: p.step ? parseInt(p.step) : null, new_step: p.step ? parseInt(p.step) : null, hss_grade: phss, mss_grade: pmss };
      });

      const employeeData = {
        employee_id: personalInfo.oracle_number || `EMP_${Date.now()}`,
        first_name: personalInfo.name.split(" ")[0] || "",
        last_name: personalInfo.name.split(" ").slice(1).join(" ") || "",
        appointment_date: employeeInfo.appointment_date,
        current_grade: initialGrade, initial_grade: initialGrade,
        current_step: parseInt(employeeInfo.step) || 1, initial_step: parseInt(employeeInfo.step) || 1,
        unit_type: employeeInfo.unit, unit: employeeInfo.unit,
        sub_type: employeeInfo.subtype, subtype: employeeInfo.subtype,
        hss_grade: hssGradeFlag, mss_grade: mssGradeFlag,
        promotions: promotionEntries,
        additional_data: {
          name: personalInfo.name, oracle_number: personalInfo.oracle_number,
          sex: personalInfo.sex, dob: personalInfo.dob,
          appointment_date: employeeInfo.appointment_date,
          agency_code: employeeInfo.unit === "Subeb" ? 1 : (employeeInfo.unit === "Local Government" ? "L" : ""),
        },
      };

      const res = await fetch(`${apiBaseUrl}/api/v1/compute`, { method: "POST", headers, body: JSON.stringify({ employees: [employeeData] }) });
      if (!res.ok) { const e = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(e.detail || `HTTP ${res.status}`); }
      const data = await res.json();
      const empResults = data.results || [];
      setResults(empResults);
      if (empResults.length > 0) {
        const last = empResults[empResults.length - 1];
        setFinalStatus(`Grade: ${last.grade || "--"} Step: ${last.step || "--"}`);
      }
    } catch (err) {
      setError(err.message || "Calculation failed");
    } finally { setLoading(false); }
  };

  const clearAll = () => {
    setPersonalInfo({ name: "", oracle_number: "", sex: "", dob: "" });
    setEmployeeInfo({ unit: "", subtype: "", appointment_date: "", grade: "", step: "" });
    setPromotions([]); setResults([]); setFinalStatus("Grade: -- Step: --"); setError(null);
  };

  const saveForExport = () => {
    if (!validateSession()) return;
    setSessionData(prev => [...prev, { ...personalInfo, ...employeeInfo, promotions, final_status: finalStatus }]);
    alert("Entry saved to session");
  };

  const handleNewSession = () => { setSessionActive(true); setSessionData([]); };
  const handleContinueSession = () => { if (sessionData.length > 0) setSessionActive(false); };

  const handleExportSession = async () => {
    if (sessionData.length === 0) return;
    setLoading(true); setError(null);
    try {
      const employeesForExport = sessionData.map(entry => {
        let ig = entry.grade, hss = false, mss = false;
        if (typeof ig === "string") {
          if (ig.startsWith("HSS ")) { ig = parseInt(ig.replace("HSS ", "")); hss = true; }
          else if (ig.startsWith("MSS ")) { mss = true; }
          else { ig = parseInt(ig) || ig; }
        }
        const proms = (entry.promotions || []).map(p => {
          let pg = p.grade, phss = false, pmss = false;
          if (typeof pg === "string") {
            if (pg.startsWith("HSS ")) { pg = parseInt(pg.replace("HSS ", "")); phss = true; }
            else if (pg.startsWith("MSS ")) { pmss = true; }
            else { pg = parseInt(pg) || pg; }
          }
          return { date: p.date, promotion_type: p.type, grade: pg, new_grade: pg, step: p.step ? parseInt(p.step) : null, new_step: p.step ? parseInt(p.step) : null, hss_grade: phss, mss_grade: pmss };
        });
        return {
          employee_id: entry.oracle_number || `EMP_${Date.now()}_${Math.random()}`,
          first_name: (entry.name || "").split(" ")[0] || "", last_name: (entry.name || "").split(" ").slice(1).join(" ") || "",
          appointment_date: entry.appointment_date, current_grade: ig, initial_grade: ig,
          current_step: parseInt(entry.step) || 1, initial_step: parseInt(entry.step) || 1,
          unit_type: entry.unit, unit: entry.unit, sub_type: entry.subtype, subtype: entry.subtype,
          hss_grade: hss, mss_grade: mss, promotions: proms,
          additional_data: { name: entry.name, oracle_number: entry.oracle_number, sex: entry.sex, dob: entry.dob, appointment_date: entry.appointment_date, agency_code: entry.unit === "Subeb" ? 1 : (entry.unit === "Local Government" ? "L" : "") },
        };
      });

      const res = await fetch(`${apiBaseUrl}/api/v1/export/zamara`, { method: "POST", headers, body: JSON.stringify({ employees: employeesForExport }) });
      if (!res.ok) { const e = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(e.detail || `HTTP ${res.status}`); }
      const data = await res.json();
      if (data.status === "ok" && data.file_url) {
        const dlRes = await fetch(`${apiBaseUrl}${data.file_url}`, { headers: { "X-API-Key": authToken } });
        if (!dlRes.ok) throw new Error("Failed to download export file");
        const blob = await dlRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = data.filename || "salary_progression_export.xlsx";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSessionActive(false); setSessionData([]);
        alert("Session exported successfully");
      } else { throw new Error("Invalid response from export API"); }
    } catch (err) {
      const msg = err.message || "Export failed";
      setError(msg); alert(`Export failed: ${msg}`);
    } finally { setLoading(false); }
  };

  const inputsDisabled = !sessionActive;

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#f5f5f5", padding: "10px", fontSize: "14px", minHeight: "100vh", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", background: "white", borderRadius: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", overflow: "hidden" }}>

        {error && <div style={{ color: "#c33", background: "#fee", border: "1px solid #fcc", padding: "8px", borderRadius: "4px", margin: "8px" }}>{error}</div>}

        <PersonalInfo data={personalInfo} onChange={d => { if (validateSession()) setPersonalInfo(d); }} disabled={inputsDisabled} />
        <EmployeeInfo data={employeeInfo} onChange={d => { if (validateSession()) setEmployeeInfo(d); }} disabled={inputsDisabled} />

        {/* Promotion History + Progression Results side by side, matching .history-results-container */}
        <div style={{ display: "flex", gap: "0" }}>
          <div style={{ flex: 3 }}>
            <PromotionHistory
              promotions={promotions}
              onPromotionsChange={p => { if (validateSession()) setPromotions(p); }}
              unit={employeeInfo.unit}
              subtype={employeeInfo.subtype}
              disabled={inputsDisabled}
            />
          </div>
          <div style={{ flex: 1 }}>
            <ProgressionResults results={results} disabled={inputsDisabled} sessionData={sessionData} />
          </div>
        </div>

        {/* Calculate / Final Status / Save for Export */}
        <div style={s.section}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button style={s.btn} onClick={calculateProgression} disabled={inputsDisabled || loading}>
                {loading ? "Calculating..." : "Calculate Progression"}
              </button>
              <button style={s.btn} onClick={clearAll} disabled={inputsDisabled}>Clear</button>
            </div>
            <div style={{ border: "2px solid #ccc", borderRadius: "4px", padding: "12px", minWidth: "200px" }}>
              <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Final Status as @ 31st March, 2007</div>
              <div style={{ fontSize: "12pt", fontWeight: "bold" }}>{finalStatus}</div>
            </div>
            <button style={{ ...s.btn, alignSelf: "flex-start", marginTop: "12px" }} onClick={saveForExport} disabled={inputsDisabled}>
              Save for Export
            </button>
          </div>
        </div>

        <ExportManagement
          sessionActive={sessionActive}
          sessionData={sessionData}
          onNewSession={handleNewSession}
          onContinueSession={handleContinueSession}
          onExportSession={handleExportSession}
        />
      </div>
    </div>
  );
}
