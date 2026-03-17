/**
 * Salary Progression Sidebar Component
 * 
 * A single-file React component for salary progression calculations.
 * Can be imported and mounted into any React application.
 * 
 * Props:
 *   - apiBaseUrl: string (e.g., "https://salary.example.com")
 *   - authToken: string (API key for authentication)
 *   - onClose: function() - called when sidebar is closed
 *   - onResult: function(resultArray) - called when computation completes
 *   - onExportReady: function(fileUrl) - called when export is ready
 *   - initialEmployees: array - optional initial employee data
 *   - styles: object - optional style overrides
 */
import React, { useState, useEffect } from "react";
import ProgressionReport from "./ProgressionReport";
import "./SalaryProgressionSidebar.css";

export default function SalaryProgressionSidebar({
  apiBaseUrl,
  authToken,
  onClose,
  onResult,
  onExportReady,
  initialEmployees = null,
  styles = {}
}) {
  const [employeesText, setEmployeesText] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [salaryTables, setSalaryTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [reportContext, setReportContext] = useState(null);

  // Initialize with provided employees if available
  useEffect(() => {
    if (initialEmployees && Array.isArray(initialEmployees)) {
      setEmployeesText(JSON.stringify(initialEmployees, null, 2));
    }
  }, [initialEmployees]);

  // Load salary tables on mount
  useEffect(() => {
    loadSalaryTables();
  }, []);

  const headers = {
    "X-API-Key": authToken,
    "Content-Type": "application/json"
  };

  async function loadSalaryTables() {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/salary-tables`, {
        method: "GET",
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setSalaryTables(data);
      }
    } catch (err) {
      console.error("Failed to load salary tables:", err);
    }
  }

  async function handleCompute() {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Parse employees JSON
      let employees;
      try {
        employees = JSON.parse(employeesText);
        if (!Array.isArray(employees)) {
          employees = [employees];
        }
      } catch (e) {
        throw new Error("Invalid JSON format. Please provide a valid JSON array of employees.");
      }

      // Validate employees
      for (const emp of employees) {
        if (!emp.employee_id) {
          throw new Error("Each employee must have an 'employee_id' field");
        }
        if (!emp.appointment_date) {
          throw new Error("Each employee must have an 'appointment_date' field");
        }
        if (!emp.current_grade) {
          throw new Error("Each employee must have a 'current_grade' field");
        }
        if (emp.current_step === undefined || emp.current_step === null) {
          throw new Error("Each employee must have a 'current_step' field");
        }
      }

      // Prepare request
      const payload = {
        employees: employees,
        salary_table_id: selectedTableId || null
      };

      const res = await fetch(`${apiBaseUrl}/api/v1/compute`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("[SalarySidebar] /compute response:", data);
      setResults(data.results);

      // Extract first employee and its result for the report
      if (Array.isArray(employees) && employees.length > 0 && Array.isArray(data.results) && data.results.length > 0) {
        console.log("[SalarySidebar] Setting reportContext with employee:", employees[0]);
        console.log("[SalarySidebar] Result data:", data.results[0]);
        setReportContext({
          employee: employees[0],
          result: data.results[0]
        });
      } else {
        console.warn("[SalarySidebar] No reportContext set - employees:", employees?.length, "results:", data.results?.length);
        setReportContext(null);
      }

      if (onResult) {
        onResult(data.results);
      }
    } catch (err) {
      setError(err.message || "Compute failed");
      console.error("Compute error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setLoading(true);
    setError(null);

    try {
      // Parse employees JSON
      let employees;
      try {
        employees = JSON.parse(employeesText);
        if (!Array.isArray(employees)) {
          employees = [employees];
        }
      } catch (e) {
        throw new Error("Invalid JSON format. Please provide a valid JSON array of employees.");
      }

      const payload = {
        employees: employees,
        salary_table_id: selectedTableId || null
      };

      const res = await fetch(`${apiBaseUrl}/api/v1/export/zamara`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.file_url) {
        // Open download link
        window.open(`${apiBaseUrl}${data.file_url}`, "_blank");

        if (onExportReady) {
          onExportReady(data.file_url);
        }

        if (onResult) {
          onResult({ exported: data.file_url, filename: data.filename });
        }
      }
    } catch (err) {
      setError(err.message || "Export failed");
      console.error("Export error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setUploadStatus(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${apiBaseUrl}/api/v1/upload-salary-table`, {
        method: "POST",
        headers: {
          "X-API-Key": authToken
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || `Upload failed: ${res.statusText}`);
      }

      const data = await res.json();
      setUploadStatus(`Salary table uploaded successfully! ID: ${data.salary_table_id}`);
      setSelectedTableId(data.salary_table_id);

      // Reload salary tables
      await loadSalaryTables();
    } catch (err) {
      setError(err.message || "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Optional inline style overrides from props (applied on top of CSS classes)
  const overrideStyles = {
    container: styles.container || {},
    header: styles.header || {},
    title: styles.title || {},
    closeButton: styles.closeButton || {}
  };

  function buildReportFilename() {
    if (!reportContext || !reportContext.employee) {
      return "Progression_report.pdf";
    }
    const emp = reportContext.employee;
    const oracle = (emp.oracle_number || emp.oracle || "").toString().trim() || "oracle";
    const name =
      emp.name ||
      [emp.first_name, emp.last_name].filter(Boolean).join(" ") ||
      "Name";
    const safe = (str) =>
      str.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim();
    return `${safe(oracle)}_${safe(name)}_Progression report.pdf`;
  }

  async function handlePrintReport() {
    if (!reportContext) return;
    // Inject simple print CSS to focus on report area if desired
    window.print();
  }

  async function handleDownloadPdf() {
    if (!reportContext) return;
    try {
      const reportElement = document.getElementById("laspec-progression-report");
      if (!reportElement) {
        console.error("[SalarySidebar] Report element not found for PDF generation");
        setError("Report element not found for PDF generation.");
        return;
      }

      const html2canvasModule = await import("html2canvas").catch(() => null);
      const jsPdfModule = await import("jspdf").catch(() => null);

      if (!html2canvasModule || !jsPdfModule) {
        console.error("[SalarySidebar] html2canvas or jsPDF not available");
        setError("PDF libraries are not available in this build.");
        return;
      }

      const html2canvas = html2canvasModule.default || html2canvasModule;
      const JsPDF = jsPdfModule.jsPDF || jsPdfModule.default;

      const canvas = await html2canvas(reportElement, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new JsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      const filename = buildReportFilename();
      pdf.save(filename);
    } catch (err) {
      console.error("[SalarySidebar] Error generating PDF:", err);
      setError("Unable to generate PDF report. See console for details.");
    }
  }

  return (
    <div className="sps-container" style={overrideStyles.container}>
      <div className="sps-header" style={overrideStyles.header}>
        <h3 className="sps-title" style={overrideStyles.title}>Salary Progression</h3>
        {onClose && (
          <button onClick={onClose} className="sps-close-btn" style={overrideStyles.closeButton} title="Close">
            ✕
          </button>
        )}
      </div>

      {error && <div className="sps-error">{error}</div>}
      {uploadStatus && <div className="sps-success">{uploadStatus}</div>}

      <div className="sps-section">
        <label className="sps-label">Salary Table (Optional)</label>
        <select
          value={selectedTableId || ""}
          onChange={(e) => setSelectedTableId(e.target.value || null)}
          className="sps-select"
        >
          <option value="">Use default table</option>
          {salaryTables.map((table) => (
            <option key={table.salary_table_id} value={table.salary_table_id}>
              {table.source_file} ({table.salary_table_id.slice(0, 8)}...)
            </option>
          ))}
        </select>
      </div>

      <div className="sps-section">
        <label className="sps-label">Upload Salary Table</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="sps-file-input"
          disabled={loading}
        />
      </div>

      <div className="sps-section">
        <label className="sps-label">
          Employee Data (JSON Array)
        </label>
        <textarea
          value={employeesText}
          onChange={(e) => setEmployeesText(e.target.value)}
          placeholder={`[\n  {\n    "employee_id": "E123",\n    "first_name": "Ada",\n    "last_name": "Ibekwe",\n    "appointment_date": "1999-03-12",\n    "current_grade": "GL8",\n    "current_step": 4,\n    "calculation_method": "mainstream",\n    "unit_type": "Mainstream",\n    "sub_type": "Standard"\n  }\n]`}
          className="sps-textarea"
          disabled={loading}
        />
      </div>

      <div className="sps-section">
        <button
          onClick={handleCompute}
          disabled={loading || !employeesText.trim()}
          className="sps-btn sps-btn-primary"
        >
          {loading ? "Computing..." : "Compute"}
        </button>
        <button
          onClick={handleExport}
          disabled={loading || !employeesText.trim()}
          className="sps-btn sps-btn-secondary"
        >
          {loading ? "Exporting..." : "Export Zamara"}
        </button>
      </div>

      {results && (
        <div className="sps-results">
          <strong>Raw Results (JSON):</strong>
          <pre className="sps-results-pre">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      {reportContext && (
        <div className="sps-report-section">
          <div className="sps-report-banner">
            📊 Salary Progression Report
          </div>
          <ProgressionReport
            employee={reportContext.employee}
            result={reportContext.result}
            onPrint={handlePrintReport}
            onDownloadPdf={handleDownloadPdf}
          />
        </div>
      )}

      {!reportContext && results && (
        <div className="sps-info-warning">
          ℹ️ Report generation requires employee and result data. Check the raw results above.
        </div>
      )}
    </div>
  );
}

