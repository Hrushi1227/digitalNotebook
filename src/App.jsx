import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { ownersFor } from "./data/ganpatiOwners";

const COLLECTIONS = { A: "ganpati_collection_a", B: "ganpati_collection_b" };
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
  const emptyForm = { type: "incoming", ownerId: "", anonymous: false, anonymousName: "", purpose: "", amount: "", mode: "UPI", date: today(), remarks: "" };
  const [form, setForm] = useState(emptyForm);
  const owners = useMemo(() => ownersFor(wing), [wing]);

  useEffect(() => {
    setLoading(true); setError("");
    return onSnapshot(collection(db, COLLECTIONS[wing]), (snapshot) => {
      setEntries(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      setLoading(false);
    }, () => { setError("Could not load the Ganpati ledger. Please check your connection."); setLoading(false); });
  }, [wing]);

  const normalized = entries.map((item) => ({ ...item, type: item.type || "incoming" }));
  const incoming = normalized.filter((item) => item.type === "incoming").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const outgoing = normalized.filter((item) => item.type === "outgoing").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const ownerTotals = useMemo(() => normalized.reduce((totals, item) => {
    if ((item.type || "incoming") === "incoming" && item.ownerId) totals[item.ownerId] = (totals[item.ownerId] || 0) + (Number(item.amount) || 0);
    return totals;
  }, {}), [entries]);
  const q = search.trim().toLowerCase();
  const visibleOwners = owners.filter((owner) => `${owner.flat} ${owner.name}`.toLowerCase().includes(q));
  const visibleLedger = normalized.sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).filter((item) => `${item.name || ""} ${item.flat || ""} ${item.purpose || ""} ${item.remarks || ""}`.toLowerCase().includes(q));

  function changeType(type) { setForm({ ...emptyForm, type }); }
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
      setForm(emptyForm); setShowForm(false); setView("ledger");
    } catch { setError("Transaction could not be saved. Please try again."); }
    finally { setSaving(false); }
  }

  return <main className="app-shell">
    <header className="hero"><div className="hero-glow"/><div className="ganpati-mark">ॐ</div><p className="eyebrow">Breeza Society</p><h1>Ganpati Utsav 2026</h1><p className="blessing">गणपती बाप्पा मोरया</p></header>
    <section className="content">
      <div className="wing-switch">{["A","B"].map((item) => <button key={item} className={wing === item ? "active" : ""} onClick={() => { setWing(item); setForm(emptyForm); }}>Building {item}</button>)}</div>
      <div className="money-grid"><div className="money-card received"><span>Received</span><strong>{money.format(incoming)}</strong></div><div className="money-card spent"><span>Spent</span><strong>{money.format(outgoing)}</strong></div><div className="money-card balance"><span>Balance</span><strong>{money.format(incoming - outgoing)}</strong></div></div>
      <div className="view-tabs"><button className={view === "owners" ? "active" : ""} onClick={() => setView("owners")}>Owner register</button><button className={view === "ledger" ? "active" : ""} onClick={() => setView("ledger")}>Income & expenses</button></div>
      <div className="toolbar"><label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={view === "owners" ? "Search owner or flat" : "Search ledger"}/></label><button className="add-button" onClick={() => setShowForm(!showForm)}>{showForm ? "Close" : "+ Entry"}</button></div>
      {showForm && <form className="entry-form" onSubmit={saveTransaction}>
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
      <div className="list-heading"><h2>{view === "owners" ? `Building ${wing} owners` : "Transaction ledger"}</h2><span>{view === "owners" ? visibleOwners.length : visibleLedger.length}</span></div>
      {loading ? <div className="empty-state">Loading Ganpati ledger…</div> : view === "owners" ? <div className="contribution-list">{visibleOwners.map((owner) => <article className="contribution" key={owner.id}><div className="avatar">{owner.flat.split(" ")[0]}</div><div className="person"><strong>{owner.name}</strong><span>Flat {owner.flat}</span></div><div className="amount"><strong>{ownerTotals[owner.id] ? money.format(ownerTotals[owner.id]) : "—"}</strong><small className={ownerTotals[owner.id] ? "received-text" : "pending-text"}>{ownerTotals[owner.id] ? "Received" : "No entry"}</small></div></article>)}</div> : visibleLedger.length ? <div className="contribution-list">{visibleLedger.map((item) => <article className="contribution" key={item.id}><div className={`avatar ${item.type}`}>{item.type === "outgoing" ? "↑" : "↓"}</div><div className="person"><strong>{item.type === "outgoing" ? item.purpose : item.name || "Contribution"}</strong><span>{item.type === "outgoing" ? "Expense" : `Flat ${item.flat || "—"}`} · {item.mode || "Mode not set"} · {item.date || "No date"}</span>{item.remarks && <em>{item.remarks}</em>}</div><div className={`amount ${item.type}`}><strong>{item.type === "outgoing" ? "−" : "+"}{money.format(Number(item.amount) || 0)}</strong></div></article>)}</div> : <div className="empty-state"><div>🙏</div><strong>No transactions yet</strong><p>Add an incoming contribution or outgoing expense.</p></div>}
    </section><footer>Ganpati-only account · Breeza Society</footer>
  </main>;
}
