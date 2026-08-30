import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { jsPDF } from "jspdf";
import { auth, db } from "./firebase";
import { ownersFor } from "./data/ganpatiOwners";

const COLLECTIONS = { A: "ganpati_collection_a", B: "ganpati_collection_b" };
const ADMIN_EMAIL = "breezasociety2026@gmail.com";
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [wing, setWing] = useState("A");
  const [view, setView] = useState("owners");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publicStatuses, setPublicStatuses] = useState({});
  const [editingContribution, setEditingContribution] = useState(null);
  const [contributionEdit, setContributionEdit] = useState({ amount: "", mode: "UPI", date: today(), remarks: "" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const emptyForm = { type: "incoming", ownerId: "", anonymous: false, anonymousName: "", purpose: "", amount: "", mode: "UPI", date: today(), remarks: "" };
  const [form, setForm] = useState(emptyForm);
  const owners = useMemo(() => ownersFor(wing), [wing]);

  useEffect(() => {
    if (!isAdmin) { setEntries([]); setLoading(false); return undefined; }
    setLoading(true); setError("");
    return onSnapshot(collection(db, COLLECTIONS[wing]), (snapshot) => {
      setEntries(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      setLoading(false);
    }, () => { setError("Could not load the Ganpati ledger. Please check your connection."); setLoading(false); });
  }, [wing, isAdmin]);

  useEffect(() => onAuthStateChanged(auth, (user) => setIsAdmin(Boolean(user))), []);

  useEffect(() => onSnapshot(collection(db, `ganpati_public_status_${wing.toLowerCase()}`), (snapshot) => {
    const statuses = {};
    snapshot.docs.forEach((item) => { const data = item.data(); if (data.ownerId) statuses[data.ownerId] = data.received === true; });
    setPublicStatuses(statuses);
  }, () => setError("Public collection status could not be loaded.")), [wing]);

  const normalized = entries.map((item) => ({ ...item, type: item.type || "incoming" }));
  const incoming = normalized.filter((item) => item.type === "incoming").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const outgoing = normalized.filter((item) => item.type === "outgoing").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const ownerTotals = useMemo(() => normalized.reduce((totals, item) => {
    if ((item.type || "incoming") === "incoming" && item.ownerId) totals[item.ownerId] = (totals[item.ownerId] || 0) + (Number(item.amount) || 0);
    return totals;
  }, {}), [entries]);
  const q = search.trim().toLowerCase();
  const visibleOwners = owners.filter((owner) => `${owner.flat} ${owner.name}`.toLowerCase().includes(q));
  const visibleLedger = normalized.filter((item) => item.type === "outgoing").sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).filter((item) => `${item.purpose || ""} ${item.remarks || ""}`.toLowerCase().includes(q));

  function changeType(type) { setForm({ ...emptyForm, type }); }
  async function adminLogin(event) {
    event.preventDefault();
    setLoginError("");
    try { await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password); setShowLogin(false); setPassword(""); }
    catch { setLoginError("Incorrect password."); }
  }
  async function adminLogout() { await signOut(auth); setView("owners"); setShowForm(false); setEditingContribution(null); }
  function startContributionEdit(owner) {
    const existing = normalized.filter((item) => item.type === "incoming" && item.ownerId === owner.id);
    const latest = existing[0];
    setEditingContribution({ owner, existing: latest || null });
    setContributionEdit({ amount: isAdmin ? (ownerTotals[owner.id] || "") : "", mode: latest?.mode || "UPI", date: latest?.date || today(), remarks: latest?.remarks || "" });
  }
  async function saveContributionEdit(event) {
    event.preventDefault();
    if (!editingContribution || Number(contributionEdit.amount) < 0) return;
    setSaving(true); setError("");
    try {
      const payload = { type: "incoming", ownerId: editingContribution.owner.id, name: editingContribution.owner.name, flat: editingContribution.owner.flat, amount: Number(contributionEdit.amount), mode: contributionEdit.mode, date: contributionEdit.date, remarks: contributionEdit.remarks.trim(), wing, updatedAt: serverTimestamp() };
      if (editingContribution.existing) await updateDoc(doc(db, COLLECTIONS[wing], editingContribution.existing.id), payload);
      else await addDoc(collection(db, COLLECTIONS[wing]), { ...payload, createdAt: serverTimestamp() });
      await setDoc(doc(db, `ganpati_public_status_${wing.toLowerCase()}`, encodeURIComponent(editingContribution.owner.id)), { ownerId: editingContribution.owner.id, received: Number(contributionEdit.amount) > 0, updatedAt: serverTimestamp() });
      setEditingContribution(null);
    } catch { setError("Contribution details could not be updated. Please try again."); }
    finally { setSaving(false); }
  }
  async function saveTransaction(event) {
    event.preventDefault(); setError("");
    const owner = owners.find((item) => item.id === form.ownerId);
    if (form.type === "incoming" && !form.anonymous && !owner) return setError("Please select an owner or choose Anonymous.");
    if (form.type === "outgoing" && !form.purpose.trim()) return setError("Please enter the expense purpose.");
    setSaving(true);
    try {
      await addDoc(collection(db, COLLECTIONS[wing]), {
        type: form.type, amount: Number(form.amount), mode: form.mode, date: form.date, remarks: form.remarks.trim(), wing,
        ...(form.type === "incoming" ? { ownerId: form.anonymous ? null : owner.id, name: form.anonymous ? (form.anonymousName.trim() || "Anonymous") : owner.name, flat: form.anonymous ? "Anonymous" : owner.flat, anonymous: form.anonymous } : { purpose: form.purpose.trim() }),
        createdAt: serverTimestamp(),
      });
      if (form.type === "incoming" && !form.anonymous && owner) await setDoc(doc(db, `ganpati_public_status_${wing.toLowerCase()}`, encodeURIComponent(owner.id)), { ownerId: owner.id, received: true, updatedAt: serverTimestamp() });
      setForm(emptyForm); setShowForm(false); setView("ledger");
    } catch { setError("Transaction could not be saved. Please try again."); }
    finally { setSaving(false); }
  }

  function downloadAuditPdf() {
    if (!isAdmin) return;
    const contributions = normalized
      .filter((item) => item.type === "incoming" && Number(item.amount) > 0)
      .sort((a, b) => String(a.flat || "").localeCompare(String(b.flat || ""), undefined, { numeric: true }));
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 14;
    const columns = [margin, 23, 48, 106, 127, 149, 171];
    const widths = [9, 25, 58, 21, 22, 22, 25];
    let page = 1;
    let y = 0;

    const drawHeader = () => {
      pdf.setFillColor(154, 49, 27);
      pdf.rect(0, 0, pageWidth, 29, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(16);
      pdf.text("Breeza Society - Ganpati Utsav 2026", margin, 12);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9);
      pdf.text(`Building ${wing} Contribution Audit`, margin, 19);
      pdf.text(`Generated: ${new Date().toLocaleString("en-IN")}`, margin, 24);
      pdf.setTextColor(50, 36, 28);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(11);
      pdf.text(`Total received: Rs. ${incoming.toLocaleString("en-IN")}`, margin, 37);
      pdf.setFontSize(8); pdf.setTextColor(255, 255, 255); pdf.setFillColor(74, 48, 36);
      pdf.rect(margin, 42, pageWidth - margin * 2, 8, "F");
      ["No.", "Flat", "Resident / Owner", "Amount", "Mode", "Date", "Remarks"].forEach((label, index) => pdf.text(label, columns[index] + 1.5, 47.2));
      pdf.setTextColor(50, 36, 28); y = 52;
    };

    const addPage = () => { if (page > 0) pdf.addPage(); page += 1; drawHeader(); };
    page = 0; addPage();

    contributions.forEach((item, index) => {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5);
      const values = [String(index + 1), item.flat || "Anonymous", item.name || "Anonymous", `Rs. ${(Number(item.amount) || 0).toLocaleString("en-IN")}`, item.mode || "-", item.date || "-", item.remarks || "-"];
      const lines = values.map((value, col) => pdf.splitTextToSize(String(value), widths[col] - 3));
      const rowHeight = Math.max(8, ...lines.map((line) => line.length * 3.4 + 3));
      if (y + rowHeight > 279) addPage();
      pdf.setDrawColor(224, 211, 201); pdf.setFillColor(index % 2 ? 252 : 255, index % 2 ? 248 : 255, index % 2 ? 244 : 255);
      pdf.rect(margin, y, pageWidth - margin * 2, rowHeight, "FD");
      lines.forEach((line, col) => pdf.text(line, columns[col] + 1.5, y + 4.7));
      y += rowHeight;
    });

    if (!contributions.length) { pdf.setFontSize(10); pdf.text("No received contributions recorded.", margin, y + 8); }
    const pages = pdf.getNumberOfPages();
    for (let i = 1; i <= pages; i += 1) {
      pdf.setPage(i); pdf.setFontSize(7); pdf.setTextColor(120, 95, 82);
      pdf.text(`Private admin audit - Created by Rushikesh Ghatol, A-1302`, margin, 291);
      pdf.text(`Page ${i} of ${pages}`, pageWidth - margin, 291, { align: "right" });
    }
    pdf.save(`Breeza_Ganpati_2026_Building_${wing}_Contribution_Audit.pdf`);
  }

  return <main className="app-shell">
    <header className="hero"><button className="admin-access" onClick={() => isAdmin ? adminLogout() : setShowLogin(true)}>{isAdmin ? "Exit admin" : "🔒 Admin"}</button><div className="hero-glow"/><div className="ganpati-mark">ॐ</div><p className="eyebrow">Breeza Society</p><h1>Ganpati Utsav 2026</h1><p className="blessing">गणपती बाप्पा मोरया</p><p className="creator-credit">Created by Rushikesh Ghatol · A-1302</p></header>
    <section className="content">
      <div className="wing-switch">{["A","B"].map((item) => <button key={item} className={wing === item ? "active" : ""} onClick={() => { setWing(item); setForm(emptyForm); }}>Building {item}</button>)}</div>
      {isAdmin ? <><div className="admin-banner"><span>Admin view · Financial details unlocked</span><button onClick={downloadAuditPdf}>↓ Audit PDF</button></div><div className="money-grid"><div className="money-card received"><span>Received</span><strong>{money.format(incoming)}</strong></div><div className="money-card spent"><span>Spent</span><strong>{money.format(outgoing)}</strong></div><div className="money-card balance"><span>Balance</span><strong>{money.format(incoming - outgoing)}</strong></div></div><div className="view-tabs"><button className={view === "owners" ? "active" : ""} onClick={() => setView("owners")}>Owner register</button><button className={view === "ledger" ? "active" : ""} onClick={() => setView("ledger")}>Expenses</button></div></> : <div className="privacy-note"><span>🔒</span><div><strong>Contribution amounts are private</strong><p>Only collection status is shown publicly.</p></div></div>}
      <div className="toolbar"><label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={view === "owners" ? "Search owner or flat" : "Search ledger"}/></label>{isAdmin && <button className="add-button" onClick={() => setShowForm(!showForm)}>{showForm ? "Close" : "+ Entry"}</button>}</div>
      {isAdmin && showForm && <form className="entry-form" onSubmit={saveTransaction}>
        <div className="type-switch"><button type="button" className={form.type === "incoming" ? "active incoming" : ""} onClick={() => changeType("incoming")}>↓ Money in</button><button type="button" className={form.type === "outgoing" ? "active outgoing" : ""} onClick={() => changeType("outgoing")}>↑ Expense</button></div>
        {form.type === "incoming" ? <>
          <label className="check-line"><input type="checkbox" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked, ownerId: "" })}/> Anonymous Ganpati contribution</label>
          {form.anonymous ? <label>Name (optional)<input value={form.anonymousName} onChange={(e) => setForm({ ...form, anonymousName: e.target.value })} placeholder="Leave blank for Anonymous"/></label> : <label>Owner / Flat<select required value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}><option value="">Select registered owner</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>Flat {owner.flat} - {owner.name}</option>)}</select></label>}
        </> : <label>Expense purpose<input required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Decoration, prasad, sound…"/></label>}
        <div className="form-row"><label>Amount<input required type="number" min="1" inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="₹ 0"/></label><label>Payment mode<select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option>UPI</option><option>Cash</option><option>Bank transfer</option><option>Other</option></select></label></div>
        <label>Date<input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}/></label><label>Remarks (optional)<input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Receipt or note"/></label>
        <button className="save-button" disabled={saving}>{saving ? "Saving…" : `Save ${form.type === "incoming" ? "contribution" : "expense"}`}</button>
      </form>}
      {error && <p className="error-message">{error}</p>}
      <div className="list-heading"><h2>{view === "owners" ? `Building ${wing} owners` : "Private expense ledger"}</h2><span>{view === "owners" ? visibleOwners.length : visibleLedger.length}</span></div>
      {loading ? <div className="empty-state">Loading Ganpati register…</div> : view === "owners" || !isAdmin ? <div className="contribution-list">{visibleOwners.map((owner) => { const received = isAdmin ? Boolean(ownerTotals[owner.id]) : Boolean(publicStatuses[owner.id]); return <article className="contribution" key={owner.id}><div className="avatar">{owner.flat.split(" ")[0]}</div><div className="person"><strong>{owner.name}</strong><span>Flat {owner.flat}</span></div><div className="amount">{isAdmin ? <strong>{ownerTotals[owner.id] ? money.format(ownerTotals[owner.id]) : "—"}</strong> : <button className="private-lock" onClick={() => setShowPrivacyInfo(true)} aria-label="Private amount">🔒</button>}<small className={received ? "status-received" : "status-waiting"}>{received ? "Received" : "Yet to receive"}</small><button className="edit-owner" onClick={() => startContributionEdit(owner)}>{isAdmin ? (ownerTotals[owner.id] ? "Edit contribution" : "Add contribution") : "Give contribution"}</button></div></article>})}</div> : visibleLedger.length ? <div className="contribution-list">{visibleLedger.map((item) => <article className="contribution" key={item.id}><div className="avatar outgoing">↑</div><div className="person"><strong>{item.purpose}</strong><span>Expense · {item.mode || "Mode not set"} · {item.date || "No date"}</span>{item.remarks && <em>{item.remarks}</em>}</div><div className="amount outgoing"><strong>−{money.format(Number(item.amount) || 0)}</strong></div></article>)}</div> : <div className="empty-state"><div>🧾</div><strong>No expenses yet</strong><p>Expenses added by the admin will appear here.</p></div>}
    </section><footer><span>Ganpati-only account · Breeza Society</span><strong>Created by Rushikesh Ghatol · A-1302</strong></footer>
    {showLogin && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowLogin(false)}><form className="login-modal" onSubmit={adminLogin}><button type="button" className="modal-close" onClick={() => setShowLogin(false)}>×</button><div className="lock-icon">🔐</div><h2>Admin access</h2><p>Enter the administrator password to view contributions and expenses.</p><label>Password<div className="password-field"><input autoFocus required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password"/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "🙈" : "👁"}</button></div></label>{loginError && <span className="login-error">{loginError}</span>}<button className="unlock-button">Secure sign in</button></form></div>}
    {editingContribution && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setEditingContribution(null)}><form className="login-modal contribution-modal" onSubmit={saveContributionEdit}><button type="button" className="modal-close" onClick={() => setEditingContribution(null)}>×</button><p className="modal-kicker">Building {wing} · Flat {editingContribution.owner.flat}</p><h2>{isAdmin ? "Edit contribution" : "Give contribution"}</h2><p className="frozen-owner">{editingContribution.owner.name}</p><small>{isAdmin ? "Owner details are frozen. Only contribution information can be changed." : "Your amount is private and can only be viewed by the administrator."}</small><label>Amount<input autoFocus required type="number" min="1" inputMode="numeric" value={contributionEdit.amount} onChange={(e) => setContributionEdit({ ...contributionEdit, amount: e.target.value })} placeholder="₹ 0"/></label><div className="form-row"><label>Payment mode<select value={contributionEdit.mode} onChange={(e) => setContributionEdit({ ...contributionEdit, mode: e.target.value })}><option>UPI</option><option>Cash</option><option>Bank transfer</option><option>Other</option></select></label><label>Date<input required type="date" value={contributionEdit.date} onChange={(e) => setContributionEdit({ ...contributionEdit, date: e.target.value })}/></label></div><label>Remarks<input value={contributionEdit.remarks} onChange={(e) => setContributionEdit({ ...contributionEdit, remarks: e.target.value })} placeholder="Optional note"/></label><button className="unlock-button" disabled={saving}>{saving ? "Saving…" : "Submit privately"}</button></form></div>}
    {showPrivacyInfo && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowPrivacyInfo(false)}><div className="login-modal privacy-modal"><button className="modal-close" onClick={() => setShowPrivacyInfo(false)}>×</button><div className="lock-icon">🔒</div><h2>Private contribution</h2><p>Contribution amounts and expense details can only be viewed by the Ganpati administrator.</p><button className="unlock-button" onClick={() => { setShowPrivacyInfo(false); setShowLogin(true); }}>Admin sign in</button></div></div>}
  </main>;
}
