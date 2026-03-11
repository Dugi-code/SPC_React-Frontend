import React from "react";

// Government-style salary progression report for web apps
// Props:
// - employee: original employee object sent to /compute
// - result: compute result object for this employee (from API)
//   expected shape: { progression: [...], computed_grade, computed_step, ... }
// - onPrint: function() => invoked when user clicks Print
// - onDownloadPdf: function() => invoked when user clicks Download PDF

export default function ProgressionReport({ employee, result, onPrint, onDownloadPdf }) {
  if (!employee || !result || !Array.isArray(result.progression)) {
    return null;
  }

  const personal = employee || {};
  const progression = result.progression || [];

  const name =
    personal.name ||
    [personal.first_name, personal.last_name].filter(Boolean).join(" ") ||
    "";

  const oracle = personal.oracle_number || personal.oracle || "";
  const sexRaw = (personal.sex || "").toString().toUpperCase();
  const sex =
    sexRaw === "M" ? "Male" : sexRaw === "F" ? "Female" : personal.sex || "";

  const unit = personal.unit_type || personal.unit || "";

  function formatLongDate(value) {
    if (!value) return "";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      const day = String(d.getDate()).padStart(2, "0");
      const monthShort = d.toLocaleString("en-GB", { month: "short" });
      const year = d.getFullYear();
      return `${day}-${monthShort}-${year}`;
    } catch {
      return value;
    }
  }

  function formatShortDate(value) {
    if (!value) return "";
    // API already formats as DD-MM-YY; keep as-is to avoid mismatches
    return value;
  }

  const appointmentDate =
    personal.appointment_date ||
    (personal.additional_data && personal.additional_data.appointment_date) ||
    "";
  const dob = personal.dob || "";

  const appointmentDisplay = formatLongDate(appointmentDate);
  const dobDisplay = formatLongDate(dob);

  // Final grade/step display ("GL X step Y")
  const finalGrade = result.computed_grade || "";
  const finalStep = result.computed_step || "";
  const gradeStepDisplay =
    finalGrade && finalStep ? `GL ${finalGrade} step ${finalStep}` : "";

  // Basic layout styles
  const pageStyle = {
    width: "794px", // ~A4 @96dpi
    margin: "0 auto",
    backgroundColor: "#ffffff",
    border: "1px solid #000000",
    padding: "24px",
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
    fontSize: "12px",
    color: "#000000"
  };

  const sectionTitleBar = {
    backgroundColor: "#f0f0f0",
    borderBottom: "1px solid #666666",
    padding: "4px 8px",
    fontWeight: 600,
    fontSize: "13px"
  };

  const borderedSection = {
    border: "1px solid #666666",
    backgroundColor: "#ffffff",
    marginTop: "12px"
  };

  const infoLabelStyle = {
    fontWeight: 600,
    minWidth: "170px"
  };

  const infoValueBox = {
    border: "1px solid #cccccc",
    padding: "2px 4px",
    minHeight: "20px",
    backgroundColor: "#ffffff"
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "11px",
    marginTop: "6px"
  };

  const thStyle = {
    border: "1px solid #666666",
    backgroundColor: "#e0e0e0",
    padding: "3px",
    fontWeight: 600,
    textAlign: "center"
  };

  const tdStyle = {
    border: "1px solid #dddddd",
    padding: "2px 3px"
  };

  return (
    <div id="laspec-progression-report" style={pageStyle}>
      {/* HEADER */}
      <div
        style={{
          border: "1px solid #000000",
          textAlign: "center",
          padding: "8px",
          marginBottom: "12px"
        }}
      >
        <div style={{ marginBottom: "4px" }}>
          <span style={{ fontWeight: 700, fontSize: "14px" }}>
            Lagos State Pension Commission
          </span>
        </div>
        <div style={{ fontWeight: 700, fontSize: "15px" }}>
          SALARY PROGRESSION REPORT
        </div>
      </div>

      {/* PERSONAL & SERVICE INFORMATION */}
      <div style={borderedSection}>
        <div style={sectionTitleBar}>Personal &amp; Service Information</div>
        <div
          style={{
            display: "flex",
            padding: "8px 10px",
            gap: "16px",
            boxSizing: "border-box"
          }}
        >
          {/* LEFT COLUMN */}
          <div style={{ flex: 1, border: "1px solid #cccccc", padding: "6px" }}>
            <div style={{ marginBottom: "6px", display: "flex" }}>
              <div style={infoLabelStyle}>Name:</div>
              <div style={{ ...infoValueBox, flex: 1 }}>{name}</div>
            </div>
            <div style={{ marginBottom: "6px", display: "flex" }}>
              <div style={infoLabelStyle}>Sex:</div>
              <div style={{ ...infoValueBox, flex: 1 }}>{sex}</div>
            </div>
            <div style={{ marginBottom: "6px", display: "flex" }}>
              <div style={infoLabelStyle}>Unit (MDA):</div>
              <div style={{ ...infoValueBox, flex: 1 }}>{unit}</div>
            </div>
            <div style={{ marginBottom: "6px", display: "flex" }}>
              <div style={infoLabelStyle}>Date of Appointment:</div>
              <div style={{ ...infoValueBox, flex: 1 }}>{appointmentDisplay}</div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ flex: 1, border: "1px solid #cccccc", padding: "6px" }}>
            <div style={{ marginBottom: "6px", display: "flex" }}>
              <div style={infoLabelStyle}>Oracle Number:</div>
              <div style={{ ...infoValueBox, flex: 1 }}>{oracle}</div>
            </div>
            <div style={{ marginBottom: "6px", display: "flex" }}>
              <div style={infoLabelStyle}>Date of Birth:</div>
              <div style={{ ...infoValueBox, flex: 1 }}>{dobDisplay}</div>
            </div>
            <div style={{ marginBottom: "6px", display: "flex" }}>
              <div style={infoLabelStyle}>Grade Level / Step @ 31st March, 2007:</div>
              <div style={{ ...infoValueBox, flex: 1 }}>{gradeStepDisplay}</div>
            </div>
            {/* Service years could be computed server-side; left blank on web for now */}
            <div style={{ marginBottom: "6px", display: "flex" }}>
              <div style={infoLabelStyle}>Total Years of Service:</div>
              <div style={{ ...infoValueBox, flex: 1 }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* SALARY PROGRESSION COMPUTATION RESULTS */}
      <div style={{ ...borderedSection, marginTop: "14px" }}>
        <div style={sectionTitleBar}>Salary Progression Computation Results</div>
        <div style={{ padding: "6px 8px" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: "7%" }}>S/N</th>
                <th style={{ ...thStyle, width: "15%" }}>Date</th>
                <th style={{ ...thStyle, width: "38%" }}>Event</th>
                <th style={{ ...thStyle, width: "15%" }}>Grade</th>
                <th style={{ ...thStyle, width: "10%" }}>Step</th>
                <th style={{ ...thStyle, width: "15%" }}>Salary</th>
              </tr>
            </thead>
            <tbody>
              {progression.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{idx + 1}</td>
                  <td style={{ ...tdStyle, textAlign: "left" }}>
                    {formatShortDate(row.date)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "left" }}>{row.event}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{row.grade}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {row.step != null ? row.step : ""}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    {row.salary != null
                      ? Number(row.salary).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTION BUTTONS (web only) */}
      <div
        style={{
          marginTop: "12px",
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px"
        }}
      >
        <button
          type="button"
          onClick={onPrint}
          style={{
            padding: "6px 12px",
            border: "1px solid #666",
            backgroundColor: "#f0f0f0",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Print
        </button>
        <button
          type="button"
          onClick={onDownloadPdf}
          style={{
            padding: "6px 12px",
            border: "1px solid #666",
            backgroundColor: "#f0f0f0",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}

