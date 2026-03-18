/**
 * MainLayout.jsx
 * Production-ready React port of the original index.html SalaryProgressionApp.
 */
import React, { useState, useEffect, useRef } from "react";

// ─── Date Utilities ───────────────────────────────────────────────────────────

function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  let day   = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);
  let year  = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (year < 50) year += 2000; else year += 1900;
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  if (!date) return "";
  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getFullYear()).slice(-2),
  ].join("-");
}

/** DD-MM-YY → YYYY-MM-DD conversion utility (kept for internal use). */
function toISODate(dateStr) {
  if (!dateStr) return null;
  const d = parseDate(dateStr);
  if (!d) return null;
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function sanitizeDateInput(text) {
  return text ? text.replace(/[^\d-]/g, "") : "";
}

// ─── Grade / Step option builder ──────────────────────────────────────────────

function getGradeStepOptions(unit, subtype, dateStr) {
  const date = parseDate(dateStr);
  const defaultSteps = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"];
  let grades = [];
  let steps  = defaultSteps;

  if (unit === "Subeb" || unit === "Local Government") {
    grades = Array.from({length:17},(_,i)=>i+1).filter(g=>g!==11).map(String);
  } else if (unit === "Mainstream" || unit === "Tescom") {
    if (subtype === "Standard" || subtype === "HATISS") {
      grades = Array.from({length:17},(_,i)=>i+1).filter(g=>g!==11).map(String);
    } else if (subtype === "HSS" || subtype === "HSS & HATISS") {
      const hssS = new Date(1992,4,1), hssE = new Date(1999,0,1);
      grades = (date && date>=hssS && date<hssE)
        ? Array.from({length:15},(_,i)=>`HSS ${i+1}`)
        : Array.from({length:17},(_,i)=>i+1).map(String);
    } else if (subtype === "MSS") {
      const mssS = new Date(1992,4,1), mssE = new Date(1999,0,1);
      if (date && date>=mssS && date<mssE) {
        grades = Array.from({length:7},(_,i)=>`MSS ${i+1}`);
        steps  = ["1","2","3","4","5","6"];
      } else {
        grades = Array.from({length:17},(_,i)=>i+1).filter(g=>g!==11).map(String);
      }
    } else {
      grades = Array.from({length:17},(_,i)=>i+1).map(String);
    }
  } else {
    grades = Array.from({length:17},(_,i)=>i+1).map(String);
  }
  return { grades, steps };
}

// ─── Grade flag parser ────────────────────────────────────────────────────────

function parseGradeFlags(gradeStr) {
  let grade = gradeStr;
  let hss   = false;
  let mss   = false;
  if (typeof grade === "string") {
    if (grade.startsWith("HSS "))      { grade = parseInt(grade.replace("HSS ",""),10); hss=true; }
    else if (grade.startsWith("MSS ")) { mss = true; }
    else                               { grade = parseInt(grade,10) || grade; }
  } else {
    grade = parseInt(grade,10) || grade;
  }
  return { grade, hss, mss };
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const s = {
  btn:    { padding:"4px 12px", border:"1px solid #ccc", borderRadius:"2px", background:"#F0F0F0", cursor:"pointer", fontSize:"13px" },
  calBtn: { padding:"2px 6px", minWidth:"20px", maxWidth:"20px", border:"1px solid #ccc", borderRadius:"2px", background:"#F0F0F0", cursor:"pointer", fontSize:"13px" },
  input:  { padding:"2px 4px", border:"1px solid #ccc", borderRadius:"2px", fontSize:"13px", background:"white" },
  select: { padding:"2px 4px", border:"1px solid #ccc", borderRadius:"2px", fontSize:"13px", background:"white" },
  section:      { border:"1px solid #ccc", borderRadius:"4px", margin:"10px", padding:"12px", background:"white" },
  sectionTitle: { fontWeight:"bold", fontSize:"10pt", marginBottom:"8px", color:"#333" },
  fieldsRow:    { display:"flex", flexWrap:"wrap", gap:"8px", alignItems:"center" },
  fieldGroup:   { display:"flex", alignItems:"center", gap:"4px" },
  label:        { fontSize:"13px", whiteSpace:"nowrap" },
  th: { border:"1px solid #ddd", padding:"4px", textAlign:"left", fontSize:"12px", background:"#f0f0f0", fontWeight:"bold" },
  td: { border:"1px solid #ddd", padding:"4px", fontSize:"12px" },
};

// ─── Calendar ─────────────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function Calendar({ onDateSelect, onClose, initialDate, position }) {
  const [current,  setCurrent]  = useState(initialDate || new Date());
  const [selected, setSelected] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (position && ref.current) {
      ref.current.style.left = `${position.x}px`;
      ref.current.style.top  = `${position.y}px`;
    }
  }, [position]);

  const daysInMonth = d => new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  const firstDay    = d => new Date(d.getFullYear(), d.getMonth(),   1).getDay();

  const cells = [];
  for (let i=0; i<firstDay(current); i++) cells.push(null);
  for (let d=1; d<=daysInMonth(current); d++) cells.push(d);

  return (
    <div ref={ref} style={{ position:"fixed", background:"white", border:"1px solid #ccc", borderRadius:"4px", boxShadow:"0 4px 12px rgba(0,0,0,0.15)", zIndex:1000, padding:"10px", minWidth:"300px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
        <button style={s.btn} onClick={()=>setCurrent(new Date(current.getFullYear(),current.getMonth()-1,1))}>‹</button>
        <span style={{ fontSize:"13px", fontWeight:"bold" }}>{MONTHS[current.getMonth()]} {current.getFullYear()}</span>
        <button style={s.btn} onClick={()=>setCurrent(new Date(current.getFullYear(),current.getMonth()+1,1))}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px" }}>
        {DAYS.map(d=><div key={d} style={{ fontWeight:"bold", textAlign:"center", fontSize:"11px", padding:"4px 0" }}>{d}</div>)}
        {cells.map((day,idx)=>{
          const isSel = day && selected && day===selected.getDate() && current.getMonth()===selected.getMonth() && current.getFullYear()===selected.getFullYear();
          return (
            <div key={idx} onClick={()=>{ if(!day) return; const nd=new Date(current.getFullYear(),current.getMonth(),day); setSelected(nd); onDateSelect(formatDate(nd)); onClose(); }}
              style={{ padding:"6px", textAlign:"center", fontSize:"12px", cursor:day?"pointer":"default", visibility:day?"visible":"hidden", border:"1px solid #ddd", background:isSel?"#0078D7":"white", color:isSel?"white":"#333" }}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PersonalInfo ─────────────────────────────────────────────────────────────

function PersonalInfo({ data, onChange, disabled }) {
  const [showCal, setShowCal] = useState(false);
  const [calPos,  setCalPos]  = useState({x:0,y:0});
  const openCal = e => { if(disabled) return; const r=e.target.getBoundingClientRect(); setCalPos({x:r.left,y:r.bottom+5}); setShowCal(true); };
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>Personal Information</div>
      <div style={s.fieldsRow}>
        <div style={s.fieldGroup}><label style={s.label}>Name:</label>
          <input type="text" value={data.name||""} placeholder="Enter name" style={s.input} disabled={disabled}
            onChange={e=>onChange({...data,name:e.target.value.replace(/[^a-zA-Z\s-]/g,"")})} /></div>
        <div style={s.fieldGroup}><label style={s.label}>Oracle Number:</label>
          <input type="text" value={data.oracle_number||""} placeholder="Enter oracle number" style={{...s.input,width:"90px"}} disabled={disabled}
            onChange={e=>onChange({...data,oracle_number:e.target.value.replace(/\D/g,"")})} /></div>
        <div style={s.fieldGroup}><label style={s.label}>Sex:</label>
          <select value={data.sex||""} style={{...s.select,width:"60px"}} disabled={disabled} onChange={e=>onChange({...data,sex:e.target.value})}>
            <option value=""> </option><option value="M">M</option><option value="F">F</option>
          </select></div>
        <div style={s.fieldGroup}><label style={s.label}>Date of Birth:</label>
          <input type="text" value={data.dob||""} placeholder="DD-MM-YY" style={{...s.input,width:"90px"}} disabled={disabled}
            onChange={e=>onChange({...data,dob:sanitizeDateInput(e.target.value)})} />
          <button style={s.calBtn} onClick={openCal} disabled={disabled} tabIndex={-1}>📅</button></div>
      </div>
      {showCal && <Calendar onDateSelect={date=>{onChange({...data,dob:date});setShowCal(false);}} onClose={()=>setShowCal(false)} initialDate={parseDate(data.dob)} position={calPos} />}
    </div>
  );
}

// ─── EmployeeInfo ─────────────────────────────────────────────────────────────

function EmployeeInfo({ data, onChange, disabled }) {
  const [showCal,   setShowCal]   = useState(false);
  const [calPos,    setCalPos]    = useState({x:0,y:0});
  const [gradeOpts, setGradeOpts] = useState([]);
  const [stepOpts,  setStepOpts]  = useState([]);

  useEffect(()=>{
    const {grades,steps} = getGradeStepOptions(data.unit,data.subtype,data.appointment_date);
    setGradeOpts(grades); setStepOpts(steps);
  },[data.unit,data.subtype,data.appointment_date]);

  const handleUnitChange = unit => {
    let nd = {...data,unit};
    if (unit==="Subeb"||unit==="Local Government") nd.subtype="Standard";
    else if (unit==="Mainstream"||unit==="Tescom") { if(!nd.subtype) nd.subtype="Standard"; }
    else nd.subtype="";
    onChange(nd);
  };

  const openCal = e=>{ if(disabled) return; const r=e.target.getBoundingClientRect(); setCalPos({x:r.left,y:r.bottom+5}); setShowCal(true); };
  const subtypeDisabled = disabled||data.unit==="Subeb"||data.unit==="Local Government";

  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>Employee Information</div>
      <div style={s.fieldsRow}>
        <div style={s.fieldGroup}><label style={s.label}>Unit:</label>
          <select value={data.unit||""} style={s.select} disabled={disabled} onChange={e=>handleUnitChange(e.target.value)}>
            <option value=""> </option>
            <option value="Mainstream">Mainstream</option>
            <option value="Local Government">Local Government</option>
            <option value="Tescom">Tescom</option>
            <option value="Subeb">Subeb</option>
          </select></div>
        <div style={s.fieldGroup}><label style={s.label}>Sub-Type:</label>
          <select value={data.subtype||""} style={s.select} disabled={subtypeDisabled} onChange={e=>onChange({...data,subtype:e.target.value})}>
            <option value=""> </option>
            <option value="Standard">Standard</option>
            <option value="HATISS">HATISS</option>
            <option value="HSS">HSS</option>
            <option value="HSS & HATISS">HSS &amp; HATISS</option>
            <option value="MSS">MSS</option>
          </select></div>
        <div style={s.fieldGroup}><label style={s.label}>Date of Appointment:</label>
          <input type="text" value={data.appointment_date||""} placeholder="DD-MM-YY" style={{...s.input,width:"90px"}} disabled={disabled}
            onChange={e=>onChange({...data,appointment_date:sanitizeDateInput(e.target.value)})} />
          <button style={s.calBtn} onClick={openCal} disabled={disabled} tabIndex={-1}>📅</button></div>
        <div style={s.fieldGroup}><label style={s.label}>Initial Grade Level:</label>
          <select value={data.grade||""} style={{...s.select,width:"70px"}} disabled={disabled} onChange={e=>onChange({...data,grade:e.target.value})}>
            <option value=""> </option>
            {gradeOpts.map(g=><option key={g} value={g}>{g}</option>)}
          </select></div>
        <div style={s.fieldGroup}><label style={s.label}>Initial Step:</label>
          <select value={data.step||""} style={{...s.select,width:"50px"}} disabled={disabled} onChange={e=>onChange({...data,step:e.target.value})}>
            <option value=""> </option>
            {stepOpts.map(st=><option key={st} value={st}>{st}</option>)}
          </select></div>
      </div>
      {showCal && <Calendar onDateSelect={date=>{onChange({...data,appointment_date:date});setShowCal(false);}} onClose={()=>setShowCal(false)} initialDate={parseDate(data.appointment_date)} position={calPos} />}
    </div>
  );
}

// ─── PromotionHistory ─────────────────────────────────────────────────────────

function PromotionHistory({ promotions, onPromotionsChange, unit, subtype, disabled }) {
  const [form,       setForm]       = useState({date:"",grade:"",step:"",type:"Promotion"});
  const [editingIdx, setEditingIdx] = useState(-1);
  const [selIdx,     setSelIdx]     = useState(-1);
  const [showCal,    setShowCal]    = useState(false);
  const [calPos,     setCalPos]     = useState({x:0,y:0});
  const [gradeOpts,  setGradeOpts]  = useState([]);
  const [stepOpts,   setStepOpts]   = useState([]);
  const dateRef = useRef(null);

  useEffect(()=>{ const {grades,steps}=getGradeStepOptions(unit,subtype,form.date); setGradeOpts(grades); setStepOpts(steps); },[unit,subtype,form.date]);

  const add = () => {
    if (!form.date||!form.grade||!form.type) return;
    if (editingIdx>=0) { const u=[...promotions]; u[editingIdx]={...form}; onPromotionsChange(u); setSelIdx(editingIdx); setEditingIdx(-1); }
    else { const n=[...promotions,{...form}]; onPromotionsChange(n); setSelIdx(n.length-1); }
    setForm({date:"",grade:"",step:"",type:"Promotion"});
    setTimeout(()=>{ if(dateRef.current) dateRef.current.focus(); },0);
  };

  const remove = idx => { if(idx<0||idx>=promotions.length) return; onPromotionsChange(promotions.filter((_,i)=>i!==idx)); if(selIdx===idx) setSelIdx(-1); else if(selIdx>idx) setSelIdx(selIdx-1); };
  const edit   = idx => { if(idx<0||idx>=promotions.length) return; setForm(promotions[idx]); setEditingIdx(idx); setSelIdx(idx); setTimeout(()=>{ if(dateRef.current) dateRef.current.focus(); },0); };
  const clear  = ()  => { if(window.confirm("Clear all promotions?")) { onPromotionsChange([]); setSelIdx(-1); setEditingIdx(-1); } };
  const openCal = e  => { if(disabled) return; const r=e.target.getBoundingClientRect(); setCalPos({x:r.left,y:r.bottom+5}); setShowCal(true); };
  const kd      = e  => { if(e.key==="Enter"&&!disabled){ e.preventDefault(); add(); } };

  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>Promotion/Advancement History</div>
      <div style={s.fieldsRow}>
        <div style={s.fieldGroup}><label style={s.label}>Date:</label>
          <input ref={dateRef} type="text" value={form.date} placeholder="DD-MM-YY" style={{...s.input,width:"90px"}} disabled={disabled}
            onChange={e=>setForm({...form,date:sanitizeDateInput(e.target.value)})} onKeyDown={kd} />
          <button style={s.calBtn} onClick={openCal} disabled={disabled} tabIndex={-1}>📅</button></div>
        <div style={s.fieldGroup}><label style={s.label}>New Grade:</label>
          <select value={form.grade} style={{...s.select,width:"70px"}} disabled={disabled} onChange={e=>setForm({...form,grade:e.target.value})} onKeyDown={kd}>
            <option value=""> </option>{gradeOpts.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
        <div style={s.fieldGroup}><label style={s.label}>New Step:</label>
          <select value={form.step} style={{...s.select,width:"50px"}} disabled={disabled} onChange={e=>setForm({...form,step:e.target.value})} onKeyDown={kd}>
            <option value=""> </option>{stepOpts.map(st=><option key={st} value={st}>{st}</option>)}</select></div>
        <div style={s.fieldGroup}><label style={s.label}>Type:</label>
          <select value={form.type} style={s.select} disabled={disabled} onChange={e=>setForm({...form,type:e.target.value})} onKeyDown={kd}>
            <option value="Promotion">Promotion</option><option value="Advancement">Advancement</option>
            <option value="Conversion">Conversion</option><option value="Harmonization">Harmonization</option>
          </select></div>
        <button style={s.btn} onClick={add} disabled={disabled}>Add Promotion</button>
      </div>
      {promotions.length>0&&(
        <table style={{width:"100%",borderCollapse:"collapse",marginTop:"8px"}}>
          <thead><tr>{["Date","New Grade","New Step","Type"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{promotions.map((p,idx)=>(
            <tr key={idx} onClick={()=>!disabled&&setSelIdx(idx===selIdx?-1:idx)}
              style={{cursor:disabled?"default":"pointer",background:idx===selIdx?"#0078D7":"white",color:idx===selIdx?"white":"#333"}}>
              <td style={s.td}>{p.date}</td><td style={s.td}>{p.grade}</td><td style={s.td}>{p.step}</td><td style={s.td}>{p.type}</td>
            </tr>))}</tbody>
        </table>)}
      <div style={{...s.fieldsRow,marginTop:"8px"}}>
        <button style={s.btn} disabled={disabled||promotions.length===0||selIdx<0} onClick={()=>remove(selIdx)}>Remove Promotion</button>
        <button style={s.btn} disabled={disabled||promotions.length===0||selIdx<0} onClick={()=>edit(selIdx)}>Edit Promotion</button>
        <button style={s.btn} disabled={disabled||promotions.length===0} onClick={clear}>Clear All Promotions</button>
      </div>
      {showCal&&<Calendar onDateSelect={date=>{setForm({...form,date}); setShowCal(false); setTimeout(()=>{if(dateRef.current)dateRef.current.focus();},0);}} onClose={()=>setShowCal(false)} initialDate={parseDate(form.date)} position={calPos} />}
    </div>
  );
}

// ─── ProgressionResults ───────────────────────────────────────────────────────

function ProgressionResults({ results, disabled, sessionData }) {
  const [showRes,     setShowRes]     = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const modal = { position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"white",padding:"20px",border:"1px solid #ccc",borderRadius:"4px",zIndex:2000,maxWidth:"800px",maxHeight:"600px",overflow:"auto",boxShadow:"0 4px 12px rgba(0,0,0,0.15)" };
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>Progression Results</div>
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        <button style={s.btn} onClick={()=>setShowRes(true)} disabled={disabled||!results||results.length===0}>Show Results</button>
        <button style={s.btn} onClick={()=>setShowEntries(true)} disabled={disabled||!sessionData||sessionData.length===0}>View Entries</button>
        <button style={s.btn} onClick={()=>setShowReports(true)}>Reports</button>
      </div>
      {showRes&&results&&results.length>0&&(
        <div style={modal}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px",alignItems:"center"}}><h3 style={{margin:0}}>Salary Progression Results</h3><button style={s.btn} onClick={()=>setShowRes(false)}>Close</button></div>
          <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Date","Event","Grade","Step","Salary"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{results.map((r,i)=><tr key={i}><td style={s.td}>{r.date||""}</td><td style={s.td}>{r.event||""}</td><td style={s.td}>{r.grade||""}</td><td style={s.td}>{r.step||""}</td><td style={s.td}>{r.salary?parseFloat(r.salary).toFixed(2):""}</td></tr>)}</tbody></table>
        </div>)}
      {showEntries&&sessionData&&sessionData.length>0&&(
        <div style={modal}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px",alignItems:"center"}}><h3 style={{margin:0}}>Saved Entries</h3><button style={s.btn} onClick={()=>setShowEntries(false)}>Close</button></div>
          <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["S/N","Name","Oracle Number","GL & Step"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{sessionData.map((e,i)=>{
            let gl="--"; if(e.final_status){const gm=e.final_status.match(/Grade:\s*(.+?)\s+Step/),sm=e.final_status.match(/Step:\s*(.+)/); if(gm&&sm) gl=`${gm[1]} ${sm[1]}`;}
            else if(e.computed_grade&&e.computed_step) gl=`${e.computed_grade} ${e.computed_step}`;
            // Use computed_grade/step stored at save time, fall back to parsed final_status
            const displayGL = (e.computed_grade && e.computed_grade !== "--")
              ? `${e.computed_grade} / ${e.computed_step}`
              : gl;
            return <tr key={i}><td style={s.td}>{i+1}</td><td style={s.td}>{e.name||"--"}</td><td style={s.td}>{e.oracle_number||"--"}</td><td style={s.td}>{displayGL}</td></tr>;
          })}</tbody></table>
        </div>)}
      {showReports&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",padding:"20px",borderRadius:"4px",maxWidth:"90%",maxHeight:"90%",overflow:"auto",boxShadow:"0 4px 12px rgba(0,0,0,0.15)",width:"900px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"15px",alignItems:"center"}}><h2 style={{margin:0}}>Reports - Search &amp; View</h2><button style={s.btn} onClick={()=>setShowReports(false)}>Close</button></div>
            <div style={{marginBottom:"15px"}}><input type="text" placeholder="Search by name, oracle number, unit, or date..." style={{width:"100%",padding:"8px",border:"1px solid #ccc",borderRadius:"2px"}} /></div>
            <div style={{textAlign:"center",padding:"40px"}}><p>Reports functionality will load saved entries from database.</p><p>Full implementation requires backend API endpoints for report management.</p></div>
          </div>
        </div>)}
    </div>
  );
}

// ─── ExportManagement ─────────────────────────────────────────────────────────

function ExportManagement({ sessionActive, sessionData, onNewSession, onContinueSession, onExportSession, backendStatus }) {
  // Derive backend status label — only shown when relevant (waking or unknown after first ping)
  const statusLabel = backendStatus === "waking"
    ? { text: "⏳ Connecting to server…", bg: "#fff3cd", color: "#856404", border: "1px solid #ffc107" }
    : backendStatus === "awake"
    ? { text: "🟢 Server ready",         bg: "#d4edda", color: "#155724", border: "1px solid #c3e6cb" }
    : null; // "unknown" — no label shown before first ping

  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>Export Management</div>
      <div style={s.fieldsRow}>
        <button style={{ ...s.btn, background:sessionActive?"#F0F0F0":"#0078D7", color:sessionActive?"#333":"white", fontWeight:sessionActive?"normal":"bold", border:sessionActive?"1px solid #ccc":"1px solid #005a9e" }} onClick={onNewSession}>New Session</button>
        <button style={s.btn} onClick={onContinueSession} disabled={sessionActive||sessionData.length===0}>Continue Session</button>
        <button style={s.btn} onClick={onExportSession} disabled={sessionData.length===0}>Export Session</button>
      </div>
      <div style={{ padding:"8px", margin:"8px 0", borderRadius:"4px", fontWeight:"bold", background:sessionActive?"#4CAF50":"#999", color:"white" }}>
        {sessionActive?`Active session - ${sessionData.length} entries`:sessionData.length>0?`Inactive session - ${sessionData.length} entries`:"No active session"}
      </div>
      {/* Backend status indicator — visible only when waking or awake */}
      {statusLabel && (
        <div style={{ marginTop:"6px", padding:"5px 10px", borderRadius:"3px", fontSize:"12px", fontWeight:"normal", background:statusLabel.bg, color:statusLabel.color, border:statusLabel.border }}>
          {statusLabel.text}
        </div>
      )}
    </div>
  );
}

// ─── Root MainLayout ──────────────────────────────────────────────────────────

export default function MainLayout({ apiBaseUrl, authToken }) {

  const [personalInfo,  setPersonalInfo]  = useState({ name:"", oracle_number:"", sex:"", dob:"" });
  const [employeeInfo,  setEmployeeInfo]  = useState({ unit:"", subtype:"", appointment_date:"", grade:"", step:"" });
  const [promotions,    setPromotions]    = useState([]);
  const [results,       setResults]       = useState([]);
  const [finalStatus,   setFinalStatus]   = useState("Grade: -- Step: --");
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionData,   setSessionData]   = useState([]);
  const [globalError,   setGlobalError]   = useState(null);
  const [calcError,     setCalcError]     = useState(null);
  const [loading,        setLoading]        = useState(false);
  // "unknown"  — server state not yet checked (initial load)
  // "waking"   — ping sent, awaiting response (Render cold start, ~30-60s)
  // "awake"    — /healthz responded successfully, backend is ready
  const [backendStatus,  setBackendStatus]  = useState("unknown");

  const headers = { "X-API-Key": authToken, "Content-Type": "application/json" };

  const handleNewSession = () => {
    // Guard: warn if previous session has unsaved data
    if (sessionActive && sessionData.length > 0) {
      if (!window.confirm("Previous session has " + sessionData.length + " unsaved entries. Start a new session anyway?")) return;
    }

    // ── Session starts immediately — never blocked by wake-up ────────────────
    setSessionActive(true);
    setSessionData([]);
    setGlobalError(null);
    setCalcError(null);

    // ── Backend wake-up ping ──────────────────────────────────────────────────
    // Only pings if status is unknown or previously failed (not if already awake).
    // Render free tier spins down after ~15 min of inactivity. This ensures the
    // backend is warm by the time the user fills the form and clicks Calculate.
    // The ping is fire-and-forget — it never blocks or delays session start.
    if (backendStatus !== "awake") {
      setBackendStatus("waking");
      fetch(`${apiBaseUrl}/healthz`, {
        method:  "GET",
        headers: { "X-API-Key": authToken },
      })
        .then(res => {
          if (res.ok) {
            setBackendStatus("awake");
          } else {
            // Backend responded but with an error — treat as awake so we
            // don't block the user; the real error will surface on Calculate.
            setBackendStatus("awake");
          }
        })
        .catch(() => {
          // Network error or timeout — reset to unknown so next New Session
          // will try again. Do NOT surface this error to the user here.
          setBackendStatus("unknown");
        });
    }
  };

  const validateSession = () => {
    if (!sessionActive) {
      alert("Please click New Session first.");
      return false;
    }
    return true;
  };

  // ── Calculate Progression ─────────────────────────────────────────────────
  const calculateProgression = async () => {

    if (!sessionActive) {
      alert("Please click New Session first.");
      return;
    }

    if (!employeeInfo.appointment_date) { setCalcError("Missing: Date of Appointment"); return; }
    if (!employeeInfo.grade)            { setCalcError("Missing: Initial Grade Level"); return; }
    if (!employeeInfo.step)             { setCalcError("Missing: Initial Step"); return; }

    // Send date exactly as typed (DD-MM-YY) — backend parses this format natively
    const rawDate = employeeInfo.appointment_date;

    setLoading(true);
    setCalcError(null);
    setGlobalError(null);

    try {
      const { grade: initialGrade, hss: hssFlag, mss: mssFlag } = parseGradeFlags(employeeInfo.grade);

      const promotionEntries = promotions.map((p, i) => {
        const { grade: pg, hss: phss, mss: pmss } = parseGradeFlags(p.grade);
        // Send promotion date as-is — backend parses DD-MM-YY natively
        return { date: p.date, promotion_type: p.type, grade: pg, new_grade: pg, step: p.step ? parseInt(p.step,10) : null, new_step: p.step ? parseInt(p.step,10) : null, hss_grade: phss, mss_grade: pmss };
      });

      const employeeData = {
        employee_id:      personalInfo.oracle_number || `EMP_${Date.now()}`,
        first_name:       personalInfo.name.split(" ")[0] || "",
        last_name:        personalInfo.name.split(" ").slice(1).join(" ") || "",
        appointment_date: rawDate,
        current_grade:    initialGrade,
        initial_grade:    initialGrade,
        current_step:     parseInt(employeeInfo.step, 10) || 1,
        initial_step:     parseInt(employeeInfo.step, 10) || 1,
        unit_type:        employeeInfo.unit,
        unit:             employeeInfo.unit,
        sub_type:         employeeInfo.subtype,
        subtype:          employeeInfo.subtype,
        hss_grade:        hssFlag,
        mss_grade:        mssFlag,
        promotions:       promotionEntries,
        additional_data: {
          name:             personalInfo.name,
          oracle_number:    personalInfo.oracle_number,
          sex:              personalInfo.sex,
          dob:              personalInfo.dob,
          appointment_date: employeeInfo.appointment_date,
          agency_code:      employeeInfo.unit === "Subeb" ? 1 : employeeInfo.unit === "Local Government" ? "L" : "",
        },
      };

      const payload = { employees: [employeeData] };
      const url     = `${apiBaseUrl}/api/v1/compute`;

      const res = await fetch(url, { method:"POST", headers, body: JSON.stringify(payload) });

      if (!res.ok) {
        let detail = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errBody = await res.json();
          if (errBody.detail) {
            detail = Array.isArray(errBody.detail)
              ? errBody.detail.map(e => typeof e==="string" ? e : `${(e.loc||[]).join(".")}: ${e.msg}`).join("; ")
              : String(errBody.detail);
          }
        } catch(pe) { /* ignore parse error, use status text fallback */ }
        throw new Error(detail);
      }

      const data = await res.json();

      const empResults = data.results || [];
      // Each result object contains a `history` array with the full progression.
      // Flatten all history entries across results for the Show Results dialog.
      const allHistory = empResults.flatMap(r => r.history || r.progression || []);
      setResults(allHistory);

      if (empResults.length > 0) {
        const last = empResults[empResults.length - 1];

        // Field resolution — backend returns computed_grade / computed_step
        // (confirmed from diagnostic log). Also checks all other known variants
        // so this remains resilient if the backend schema changes.
        const resolvedGrade =
          last.computed_grade != null ? last.computed_grade :
          last.final_grade    != null ? last.final_grade    :
          last.grade          != null ? last.grade          :
          last.current_grade  != null ? last.current_grade  :
          last.new_grade      != null ? last.new_grade      : "--";

        const resolvedStep =
          last.computed_step  != null ? last.computed_step  :
          last.final_step     != null ? last.final_step     :
          last.step           != null ? last.step           :
          last.current_step   != null ? last.current_step   :
          last.new_step       != null ? last.new_step       : "--";

        const status = "Grade: " + resolvedGrade + " Step: " + resolvedStep;
        setFinalStatus(status);
      } else {
        setFinalStatus("Grade: -- Step: --");
        const m = "API returned 200 but results array is empty. Check backend logic.";
        setCalcError(m);
      }

    } catch (err) {
      const msg = err.message || "Unknown error during calculation";
      setCalcError(msg);
      setFinalStatus("Grade: -- Step: --");
    } finally {
      setLoading(false);
    }
  };

  // ── Clear ─────────────────────────────────────────────────────────────────
  // ── clearAll: wipes everything including unit/subtype. Requires confirmation.
  const clearAll = () => {
    if (!window.confirm("Are you sure you want to clear all data?")) return;
    setPersonalInfo({ name:"", oracle_number:"", sex:"", dob:"" });
    setEmployeeInfo({ unit:"", subtype:"", appointment_date:"", grade:"", step:"" });
    setPromotions([]); setResults([]); setFinalStatus("Grade: -- Step: --");
    setGlobalError(null); setCalcError(null);
  };

  // ── clearForNextEntry: clears all EXCEPT unit and subtype so the next
  //    employee in the same unit can be entered without re-selecting those.
  //    Called automatically after Save for Export. No confirmation.
  const clearForNextEntry = () => {
    setPersonalInfo({ name:"", oracle_number:"", sex:"", dob:"" });
    setEmployeeInfo(prev => ({
      unit:             prev.unit,     // preserved
      subtype:          prev.subtype,  // preserved
      appointment_date: "",
      grade:            "",
      step:             "",
    }));
    setPromotions([]);
    setResults([]);
    setFinalStatus("Grade: -- Step: --");
    setCalcError(null);
  };

  // ── saveForExport: validates required fields, saves entry, then calls
  //    clearForNextEntry() to reset form while preserving unit and subtype.
  //    Matches original index.html saveForExport behaviour exactly.
  const saveForExport = () => {
    if (!validateSession()) return;

    // Validate required personal information fields
    if (!personalInfo.name || !personalInfo.sex || !personalInfo.dob) {
      alert("Please fill in all required personal information (Name, Sex, Date of Birth)");
      return;
    }

    // Extract computed grade/step from finalStatus for View Entries display
    const gradeMatch = finalStatus.match(/Grade:\s*(.+?)\s+Step/);
    const stepMatch  = finalStatus.match(/Step:\s*(.+)/);

    // Get last salary from results history for export
    const lastSalary = results.length > 0
      ? (results[results.length - 1]?.salary || 0)
      : 0;

    const exportEntry = {
      name:             personalInfo.name,
      oracle_number:    personalInfo.oracle_number,
      sex:              personalInfo.sex,
      dob:              personalInfo.dob,
      unit:             employeeInfo.unit,
      subtype:          employeeInfo.subtype,
      appointment_date: employeeInfo.appointment_date,
      grade:            employeeInfo.grade,
      step:             employeeInfo.step,
      promotions:       [...promotions],  // copy, not reference
      final_status:     finalStatus,
      computed_grade:   gradeMatch ? gradeMatch[1].trim() : "",
      computed_step:    stepMatch  ? stepMatch[1].trim()  : "",
      basic_salary:     lastSalary,
    };

    setSessionData(prev => [...prev, exportEntry]);

    alert("Data saved successfully");

    // Clear form for next entry, preserving unit and subtype
    clearForNextEntry();
  };

  const handleContinueSession = () => { if (sessionData.length > 0) setSessionActive(false); };

  // ── Export session ────────────────────────────────────────────────────────
  const handleExportSession = async () => {
    if (sessionData.length === 0) return;
    setLoading(true); setGlobalError(null);
    try {
      const employeesForExport = sessionData.map(entry => {
        const { grade: ig, hss, mss } = parseGradeFlags(entry.grade);
        const proms = (entry.promotions||[]).map(p => {
          const { grade: pg, hss: phss, mss: pmss } = parseGradeFlags(p.grade);
          return { date: p.date, promotion_type: p.type, grade: pg, new_grade: pg, step: p.step?parseInt(p.step,10):null, new_step: p.step?parseInt(p.step,10):null, hss_grade: phss, mss_grade: pmss };
        });
        return { employee_id: entry.oracle_number||`EMP_${Date.now()}`, first_name:(entry.name||"").split(" ")[0]||"", last_name:(entry.name||"").split(" ").slice(1).join(" ")||"", appointment_date: entry.appointment_date, current_grade:ig, initial_grade:ig, current_step:parseInt(entry.step,10)||1, initial_step:parseInt(entry.step,10)||1, unit_type:entry.unit, unit:entry.unit, sub_type:entry.subtype, subtype:entry.subtype, hss_grade:hss, mss_grade:mss, promotions:proms, additional_data:{ name:entry.name, oracle_number:entry.oracle_number, sex:entry.sex, dob:entry.dob, appointment_date:entry.appointment_date, agency_code:entry.unit==="Subeb"?1:entry.unit==="Local Government"?"L":"" } };
      });
      const res = await fetch(`${apiBaseUrl}/api/v1/export/zamara`, { method:"POST", headers, body: JSON.stringify({employees:employeesForExport}) });
      if (!res.ok) { const e=await res.json().catch(()=>({detail:res.statusText})); throw new Error(e.detail||`HTTP ${res.status}`); }
      const data = await res.json();
      if (data.status === "ok" && data.file_url) {
        // ── Download the generated Excel file ─────────────────────────────
        // file_url is "/media/filename.xlsx" — proxied via Vercel to Render.
        // The /media route is a FastAPI StaticFiles mount and does not require
        // the X-API-Key header, so we omit it to avoid CORS preflight issues.
        const downloadUrl = `${apiBaseUrl}${data.file_url}`;
        const filename    = data.filename || "salary_progression_export.xlsx";

        const dlRes = await fetch(downloadUrl);

        if (!dlRes.ok) {
          throw new Error(`File download failed: HTTP ${dlRes.status}`);
        }

        // Guard: reject if the response is HTML (means the proxy returned the
        // SPA index.html instead of the Excel file — vercel.json misconfiguration).
        const contentType = dlRes.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          throw new Error(
            "Download returned an HTML page instead of an Excel file. " +
            "Ensure /media/:path* is proxied in vercel.json."
          );
        }

        const blob = await dlRes.blob();

        // Verify the blob is non-empty
        if (blob.size === 0) {
          throw new Error("Downloaded file is empty. Please try again.");
        }

        // Trigger browser download
        const objectUrl = URL.createObjectURL(blob);
        const anchor    = document.createElement("a");
        anchor.href     = objectUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(objectUrl);

        setSessionActive(false);
        setSessionData([]);
        alert("Session exported successfully.");

      } else {
        throw new Error("Invalid response from export API.");
      }
    } catch (err) { const msg=err.message||"Export failed"; setGlobalError(msg); alert(`Export failed: ${msg}`); }
    finally { setLoading(false); }
  };

  const inputsDisabled = !sessionActive;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"system-ui,-apple-system,sans-serif", background:"#f5f5f5", padding:"10px", fontSize:"14px", minHeight:"100vh", boxSizing:"border-box" }}>
      <div style={{ maxWidth:"1400px", margin:"0 auto", background:"white", borderRadius:"4px", boxShadow:"0 2px 8px rgba(0,0,0,0.1)", overflow:"hidden" }}>

        {/* Global error */}
        {globalError && (
          <div style={{ color:"#c33", background:"#fee", border:"1px solid #fcc", padding:"8px", borderRadius:"4px", margin:"8px" }}>
            {globalError}
          </div>
        )}

        {/* ── FIX 1: Session banner ───────────────────────────────────────── */}
        {!sessionActive && (
          <div style={{ background:"#fff3cd", border:"1px solid #ffc107", borderRadius:"4px", margin:"10px", padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"8px" }}>
            <span style={{ fontSize:"13px", color:"#856404", fontWeight:"bold" }}>
              ⚠&nbsp; Click <strong>New Session</strong> to unlock all fields and the Calculate button.
            </span>
            <button
              style={{ ...s.btn, background:"#0078D7", color:"white", border:"1px solid #005a9e", fontWeight:"bold", padding:"6px 16px" }}
              onClick={handleNewSession}
            >
              New Session
            </button>
          </div>
        )}

        <PersonalInfo data={personalInfo} onChange={d=>{ if(validateSession()) setPersonalInfo(d); }} disabled={inputsDisabled} />
        <EmployeeInfo data={employeeInfo} onChange={d=>{ if(validateSession()) setEmployeeInfo(d); }} disabled={inputsDisabled} />

        <div style={{ display:"flex" }}>
          <div style={{ flex:3 }}>
            <PromotionHistory promotions={promotions} onPromotionsChange={p=>{ if(validateSession()) setPromotions(p); }} unit={employeeInfo.unit} subtype={employeeInfo.subtype} disabled={inputsDisabled} />
          </div>
          <div style={{ flex:1 }}>
            <ProgressionResults results={results} disabled={inputsDisabled} sessionData={sessionData} />
          </div>
        </div>

        {/* Calculate / Final Status / Save */}
        <div style={s.section}>
          <div style={{ display:"flex", gap:"10px", alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              <button
                style={{ ...s.btn, background:inputsDisabled||loading?"#F5F5F5":"#F0F0F0", color:inputsDisabled||loading?"#999":"#333", cursor:inputsDisabled||loading?"not-allowed":"pointer" }}
                onClick={calculateProgression}
                disabled={inputsDisabled || loading}
              >
                {loading ? "Calculating…" : "Calculate Progression"}
              </button>
              <button style={s.btn} onClick={clearAll} disabled={inputsDisabled}>Clear</button>
            </div>
            <div style={{ border:"2px solid #ccc", borderRadius:"4px", padding:"12px", minWidth:"200px" }}>
              <div style={{ fontWeight:"bold", marginBottom:"8px" }}>Final Status as @ 31st March, 2007</div>
              <div style={{ fontSize:"12pt", fontWeight:"bold" }}>{finalStatus}</div>
            </div>
            <button style={{ ...s.btn, alignSelf:"flex-start", marginTop:"12px" }} onClick={saveForExport} disabled={inputsDisabled}>Save for Export</button>
          </div>

          {/* Inline calc error — always visible, directly below buttons */}
          {calcError && (
            <div style={{ marginTop:"10px", padding:"8px 12px", background:"#fee", border:"1px solid #fcc", borderRadius:"4px", color:"#c33", fontSize:"13px" }}>
              ⚠ {calcError}
            </div>
          )}
        </div>

        <ExportManagement
          sessionActive={sessionActive}
          sessionData={sessionData}
          onNewSession={handleNewSession}
          onContinueSession={handleContinueSession}
          onExportSession={handleExportSession}
          backendStatus={backendStatus}
        />

      </div>
    </div>
  );
}
