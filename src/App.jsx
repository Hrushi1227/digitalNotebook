import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { jsPDF } from "jspdf";
import { QRCode } from "antd";
import { auth, db } from "./firebase";
import { ownersFor } from "./data/ganpatiOwners";

const COLLECTIONS = { A: "ganpati_collection_a", B: "ganpati_collection_b" };
const ADMIN_EMAIL = "breezasociety2026@gmail.com";
const UPI_ID = "shakupatil1990-1@okaxis";
const UPI_LINK = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("Breeza Society Ganpati Utsav")}&cu=INR`;
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [wing, setWing] = useState("A");
  const [view, setView] = useState("owners");
  const [entries, setEntries] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);
  const [auditReady, setAuditReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publicStatuses, setPublicStatuses] = useState({});
  const [lowAmountOwners, setLowAmountOwners] = useState({});
  const [publicSummary, setPublicSummary] = useState({ received: 0, spent: 0, pendingReview: 0, balance: 0 });
  const [wingSummaries, setWingSummaries] = useState({ A: { received: 0, spent: 0 }, B: { received: 0, spent: 0 } });
  const [publicExpensesA, setPublicExpensesA] = useState([]);
  const [publicExpensesB, setPublicExpensesB] = useState([]);
  const [publicPendingItems, setPublicPendingItems] = useState([]);
  const [editingContribution, setEditingContribution] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [contributionEdit, setContributionEdit] = useState({ amount: "", mode: "UPI", date: today(), remarks: "" });
  const [paymentStep, setPaymentStep] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
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

  useEffect(() => {
    if (!isAdmin) { setAuditEntries([]); setAuditReady(false); return undefined; }
    setAuditReady(false);
    let buildingA = []; let buildingB = [];
    let loadedA = false; let loadedB = false;
    const updateAuditEntries = () => { setAuditEntries([...buildingA, ...buildingB]); setAuditReady(loadedA && loadedB); };
    const stopA = onSnapshot(collection(db, COLLECTIONS.A), (snapshot) => { buildingA = snapshot.docs.map((item) => ({ id: item.id, wing: "A", ...item.data() })); loadedA = true; updateAuditEntries(); }, () => { setAuditReady(false); setError("Building A audit data could not be loaded."); });
    const stopB = onSnapshot(collection(db, COLLECTIONS.B), (snapshot) => { buildingB = snapshot.docs.map((item) => ({ id: item.id, wing: "B", ...item.data() })); loadedB = true; updateAuditEntries(); }, () => { setAuditReady(false); setError("Building B audit data could not be loaded."); });
    return () => { stopA(); stopB(); };
  }, [isAdmin]);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    const allowed = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    setIsAdmin(allowed);
    if (user && !allowed) signOut(auth).catch(() => {});
  }), []);

  useEffect(() => onSnapshot(collection(db, `ganpati_public_status_${wing.toLowerCase()}`), (snapshot) => {
    const statuses = {};
    const lowAmounts = {};
    snapshot.docs.forEach((item) => { const data = item.data(); if (data.ownerId) { statuses[data.ownerId] = data.received ? "received" : data.pending ? "pending" : "none"; lowAmounts[data.ownerId] = Boolean(data.lowAmount); } });
    setPublicStatuses(statuses);
    setLowAmountOwners(lowAmounts);
  }, () => setError("Public collection status could not be loaded.")), [wing]);

  useEffect(() => onSnapshot(collection(db, "ganpati_public_summary"), (snapshot) => {
    const byWing = { A: { received: 0, spent: 0 }, B: { received: 0, spent: 0 } };
    const combined = snapshot.docs.reduce((total, item) => {
      const data = item.data();
      if (item.id === "A" || item.id === "B") byWing[item.id] = { received: Number(data.received) || 0, spent: Number(data.spent) || 0 };
      total.received += Number(data.received) || 0;
      total.spent += Number(data.spent) || 0;
      total.pendingReview += Number(data.pendingReview) || 0;
      return total;
    }, { received: 0, spent: 0, pendingReview: 0, balance: 0 });
    combined.balance = combined.received - combined.spent;
    setWingSummaries(byWing);
    setPublicSummary((current) => ({ ...combined, pendingReview: current.pendingReview }));
  }, () => setError("Combined society totals could not be loaded.")), []);

  useEffect(() => onSnapshot(collection(db, "ganpati_public_pending"), (snapshot) => {
    const pendingItems = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    const pendingReview = pendingItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    setPublicPendingItems(pendingItems);
    setPublicSummary((current) => ({ ...current, pendingReview }));
  }, () => setError("Pending review total could not be loaded.")), []);

  useEffect(() => {
    const stopA = onSnapshot(collection(db, "ganpati_public_expenses_a"), (snapshot) => setPublicExpensesA(snapshot.docs.map((item) => { const data = item.data(); return { id: item.id, ...data, wing: "A", purpose: `Building A · ${data.purpose || "Expense"}` }; })), () => setError("Building A expenses could not be loaded."));
    const stopB = onSnapshot(collection(db, "ganpati_public_expenses_b"), (snapshot) => setPublicExpensesB(snapshot.docs.map((item) => { const data = item.data(); return { id: item.id, ...data, wing: "B", purpose: `Building B · ${data.purpose || "Expense"}` }; })), () => setError("Building B expenses could not be loaded."));
    return () => { stopA(); stopB(); };
  }, []);

  const normalized = entries.map((item) => ({ ...item, type: item.type || "incoming" }));
  const incoming = normalized.filter((item) => item.type === "incoming" && item.verificationStatus !== "pending").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const outgoing = normalized.filter((item) => item.type === "outgoing").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  useEffect(() => {
    if (!isAdmin || loading) return;
    const pendingReview = normalized.filter((item) => item.type === "incoming" && item.verificationStatus === "pending").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    setDoc(doc(db, "ganpati_public_summary", wing), { received: incoming, spent: outgoing, pendingReview, balance: incoming - outgoing, updatedAt: serverTimestamp() }).catch(() => setError("Public totals could not be refreshed."));
  }, [isAdmin, loading, wing, incoming, outgoing, entries]);

  useEffect(() => {
    if (!isAdmin || loading) return;
    normalized.filter((item) => item.type === "outgoing").forEach((item) => setDoc(doc(db, `ganpati_public_expenses_${wing.toLowerCase()}`, item.id), { purpose: item.purpose || "Expense", amount: Number(item.amount) || 0, mode: item.mode || "Other", date: item.date || "", remarks: item.remarks || "", updatedAt: serverTimestamp() }).catch(() => {}));
  }, [isAdmin, loading, wing, entries]);
  useEffect(() => {
    if (!isAdmin || loading) return;
    normalized.filter((item) => item.type === "incoming" && item.verificationStatus === "pending").forEach((item) => setDoc(doc(db, "ganpati_public_pending", item.id), { amount: Number(item.amount) || 0, wing, pending: true, anonymous: Boolean(item.anonymous), updatedAt: serverTimestamp() }).catch(() => {}));
  }, [isAdmin, loading, wing, entries]);
  useEffect(() => {
    if (!isAdmin || loading) return;
    owners.forEach((owner) => {
      const ownerEntries = normalized.filter((item) => item.type === "incoming" && item.ownerId === owner.id && Number(item.amount) > 0);
      if (!ownerEntries.length) return;
      const received = ownerEntries.some((item) => item.verificationStatus !== "pending");
      const pending = !received && ownerEntries.some((item) => item.verificationStatus === "pending");
      const total = ownerEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      setDoc(doc(db, `ganpati_public_status_${wing.toLowerCase()}`, encodeURIComponent(owner.id)), { ownerId: owner.id, received, pending, lowAmount: total < 100, updatedAt: serverTimestamp() }).catch(() => {});
    });
  }, [isAdmin, loading, wing, entries, owners]);
  const ownerTotals = useMemo(() => normalized.reduce((totals, item) => {
    if ((item.type || "incoming") === "incoming" && item.verificationStatus !== "pending" && item.ownerId) totals[item.ownerId] = (totals[item.ownerId] || 0) + (Number(item.amount) || 0);
    return totals;
  }, {}), [entries]);
  const q = search.trim().toLowerCase();
  const visibleOwners = owners.filter((owner) => `${owner.flat} ${owner.name}`.toLowerCase().includes(q));
  const lowOwnerIndexes = visibleOwners.map((owner, index) => {
    const privateAmounts = normalized.filter((item) => item.type === "incoming" && item.ownerId === owner.id && Number(item.amount) > 0);
    const adminLowAmount = privateAmounts.length > 0 && privateAmounts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) < 100;
    return lowAmountOwners[owner.id] || (isAdmin && adminLowAmount) ? index + 1 : null;
  }).filter(Boolean);
  const visibleLedger = normalized.filter((item) => item.type === "outgoing").sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).filter((item) => `${item.purpose || ""} ${item.remarks || ""}`.toLowerCase().includes(q));
  const visiblePublicExpenses = [...publicExpensesA, ...publicExpensesB].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).filter((item) => `${item.purpose || ""} ${item.remarks || ""} ${item.wing || ""}`.toLowerCase().includes(q));
  const expenseRows = isAdmin ? visibleLedger : visiblePublicExpenses;
  const contributionRows = normalized.filter((item) => item.type === "incoming").sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).filter((item) => `${item.name || ""} ${item.flat || ""} ${item.amount || ""} ${item.remarks || ""}`.toLowerCase().includes(q));
  const privatePendingContributions = normalized.filter((item) => item.type === "incoming" && item.verificationStatus === "pending");
  const unmatchedPublicPending = publicPendingItems.filter((item) => item.wing === wing && !privatePendingContributions.some((entry) => entry.id === item.id));
  const unmatchedPendingOwners = owners.filter((owner) => publicStatuses[owner.id] === "pending" && !privatePendingContributions.some((entry) => entry.ownerId === owner.id));
  const orphanPendingContributions = unmatchedPublicPending.map((item) => {
    const matchedOwner = unmatchedPublicPending.length === 1 && unmatchedPendingOwners.length === 1 && !item.anonymous ? unmatchedPendingOwners[0] : null;
    return { ...item, ownerId: matchedOwner?.id || null, name: matchedOwner?.name || (item.anonymous ? "Anonymous" : "Unlinked pending entry"), flat: matchedOwner?.flat || (item.anonymous ? "Anonymous" : "Details unavailable"), anonymous: Boolean(item.anonymous), orphan: true, verificationStatus: "pending" };
  });
  const pendingContributions = [...privatePendingContributions].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const allReviewItems = [...privatePendingContributions, ...orphanPendingContributions].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).filter((item) => `${item.name || ""} ${item.flat || ""} ${item.amount || ""} ${item.remarks || ""}`.toLowerCase().includes(q));
  const pendingAmount = pendingContributions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const contributionPaymentLink = editingContribution ? `${UPI_LINK}&am=${encodeURIComponent(contributionEdit.amount || "")}&tn=${encodeURIComponent(editingContribution.owner.anonymous ? `Anonymous Ganpati contribution - Building ${wing}` : `Ganpati contribution - Building ${wing}, Flat ${editingContribution.owner.flat}`)}` : UPI_LINK;

  function changeType(type) { setForm({ ...emptyForm, type }); }
  async function copyUpiId() {
    try { await navigator.clipboard.writeText(UPI_ID); setCopiedUpi(true); setTimeout(() => setCopiedUpi(false), 1800); }
    catch { setError(`Please copy the UPI ID: ${UPI_ID}`); }
  }
  async function adminLogin(event) {
    event.preventDefault();
    setLoginError("");
    try { await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password); setShowLogin(false); setPassword(""); }
    catch { setLoginError("Incorrect password."); }
  }
  async function adminLogout() { await signOut(auth); setView("owners"); setShowForm(false); setEditingContribution(null); }
  function startContributionEdit(owner) {
    if (!isAdmin && publicStatuses[owner.id] === "pending") { setError("A payment for this flat is already awaiting admin review."); return; }
    if (!isAdmin && publicStatuses[owner.id] === "received") { setError("A confirmed contribution is already recorded for this flat. Contact the Breeza admin for corrections."); return; }
    const existing = normalized.filter((item) => item.type === "incoming" && item.ownerId === owner.id);
    const latest = existing[0];
    setEditingContribution({ owner, existing: latest || null });
    setPaymentStep(1);
    setContributionEdit({ amount: isAdmin ? (latest?.amount || ownerTotals[owner.id] || "") : "", mode: latest?.mode || "UPI", date: latest?.date || today(), remarks: latest?.remarks || "" });
  }
  function startAnonymousContribution() {
    setEditingContribution({ owner: { id: null, name: "Anonymous contributor", flat: "Anonymous", anonymous: true }, existing: null });
    setPaymentStep(1);
    setContributionEdit({ amount: "", mode: "UPI", date: today(), remarks: "" });
  }
  async function saveContributionEdit(event) {
    event.preventDefault();
    if (!editingContribution || Number(contributionEdit.amount) <= 0) return;
    setSaving(true); setError("");
    try {
      const isAnonymous = Boolean(editingContribution.owner.anonymous);
      const payload = { type: "incoming", ownerId: isAnonymous ? null : editingContribution.owner.id, name: isAnonymous ? "Anonymous" : editingContribution.owner.name, flat: isAnonymous ? "Anonymous" : editingContribution.owner.flat, anonymous: isAnonymous, amount: Number(contributionEdit.amount), mode: isAdmin ? contributionEdit.mode : "UPI", date: contributionEdit.date, remarks: contributionEdit.remarks.trim(), verificationStatus: isAdmin ? "verified" : "pending", wing, updatedAt: serverTimestamp() };
      let contributionRef;
      if (!isAdmin) {
        contributionRef = doc(collection(db, COLLECTIONS[wing]));
        const batch = writeBatch(db);
        batch.set(contributionRef, { ...payload, createdAt: serverTimestamp() });
        batch.set(doc(db, "ganpati_public_pending", contributionRef.id), { amount: Number(contributionEdit.amount), wing, pending: true, anonymous: isAnonymous, createdAt: serverTimestamp() });
        if (!isAnonymous) batch.set(doc(db, `ganpati_public_status_${wing.toLowerCase()}`, encodeURIComponent(editingContribution.owner.id)), { ownerId: editingContribution.owner.id, received: false, pending: true, lowAmount: Number(contributionEdit.amount) < 100, updatedAt: serverTimestamp() });
        await batch.commit();
      } else {
        if (editingContribution.existing) { contributionRef = doc(db, COLLECTIONS[wing], editingContribution.existing.id); await updateDoc(contributionRef, payload); }
        else contributionRef = await addDoc(collection(db, COLLECTIONS[wing]), { ...payload, createdAt: serverTimestamp() });
        if (!isAnonymous) await setDoc(doc(db, `ganpati_public_status_${wing.toLowerCase()}`, encodeURIComponent(editingContribution.owner.id)), { ownerId: editingContribution.owner.id, received: true, pending: false, lowAmount: Number(contributionEdit.amount) < 100, updatedAt: serverTimestamp() });
      }
      if (isAdmin) setEditingContribution(null);
      else {
        const paymentUrl = contributionPaymentLink;
        setEditingContribution(null);
        window.location.assign(paymentUrl);
      }
    } catch { setError("Contribution details could not be updated. Please try again."); }
    finally { setSaving(false); }
  }
  async function deleteContribution() {
    if (!isAdmin || !editingContribution?.existing || !window.confirm(`Delete the contribution for Flat ${editingContribution.owner.flat}? This cannot be undone.`)) return;
    setSaving(true); setError("");
    try {
      await deleteDoc(doc(db, COLLECTIONS[wing], editingContribution.existing.id));
      const hasAnother = normalized.some((item) => item.id !== editingContribution.existing.id && item.type === "incoming" && item.ownerId === editingContribution.owner.id && Number(item.amount) > 0);
      await setDoc(doc(db, `ganpati_public_status_${wing.toLowerCase()}`, encodeURIComponent(editingContribution.owner.id)), { ownerId: editingContribution.owner.id, received: hasAnother, updatedAt: serverTimestamp() });
      setEditingContribution(null);
    } catch { setError("Contribution could not be deleted. Please try again."); }
    finally { setSaving(false); }
  }
  async function deleteExpense(item) {
    if (!isAdmin || !window.confirm(`Delete expense "${item.purpose}"? This cannot be undone.`)) return;
    try { await deleteDoc(doc(db, COLLECTIONS[wing], item.id)); await deleteDoc(doc(db, `ganpati_public_expenses_${wing.toLowerCase()}`, item.id)); }
    catch { setError("Expense could not be deleted. Please try again."); }
  }
  function startExpenseEdit(item) {
    if (!isAdmin) return;
    setEditingExpense({ ...item, purpose: item.purpose || "", amount: String(item.amount || ""), mode: item.mode || "Other", date: item.date || today(), remarks: item.remarks || "" });
  }
  async function saveExpenseEdit(event) {
    event.preventDefault();
    if (!isAdmin || !editingExpense || Number(editingExpense.amount) <= 0 || !editingExpense.purpose.trim()) return;
    setSaving(true); setError("");
    try {
      const expenseWing = editingExpense.wing || wing;
      const payload = { type: "outgoing", purpose: editingExpense.purpose.trim(), amount: Number(editingExpense.amount), mode: editingExpense.mode, date: editingExpense.date, remarks: editingExpense.remarks.trim(), wing: expenseWing, updatedAt: serverTimestamp() };
      const batch = writeBatch(db);
      batch.update(doc(db, COLLECTIONS[expenseWing], editingExpense.id), payload);
      batch.set(doc(db, `ganpati_public_expenses_${expenseWing.toLowerCase()}`, editingExpense.id), { purpose: payload.purpose, amount: payload.amount, mode: payload.mode, date: payload.date, remarks: payload.remarks, updatedAt: serverTimestamp() });
      await batch.commit();
      setEditingExpense(null);
    } catch { setError("Expense could not be updated. Please try again."); }
    finally { setSaving(false); }
  }
  async function approveContribution(item) {
    if (!isAdmin || !window.confirm(`Confirm receipt of ${money.format(Number(item.amount) || 0)} from Flat ${item.flat}?`)) return;
    try {
      if (item.orphan) {
        await addDoc(collection(db, COLLECTIONS[item.wing || wing]), { type: "incoming", ownerId: item.ownerId || null, name: item.ownerId ? item.name : "Anonymous", flat: item.ownerId ? item.flat : "Anonymous", anonymous: !item.ownerId, amount: Number(item.amount) || 0, mode: item.mode || "UPI", date: item.date || today(), remarks: "Recovered from pending payment review", verificationStatus: "verified", wing: item.wing || wing, verifiedAt: serverTimestamp(), createdAt: serverTimestamp() });
        await deleteDoc(doc(db, "ganpati_public_pending", item.id));
        if (item.ownerId) await setDoc(doc(db, `ganpati_public_status_${(item.wing || wing).toLowerCase()}`, encodeURIComponent(item.ownerId)), { ownerId: item.ownerId, received: true, pending: false, lowAmount: Number(item.amount) < 100, updatedAt: serverTimestamp() });
        return;
      }
      await updateDoc(doc(db, COLLECTIONS[wing], item.id), { verificationStatus: "verified", verifiedAt: serverTimestamp() });
      await deleteDoc(doc(db, "ganpati_public_pending", item.id));
      if (item.ownerId) await setDoc(doc(db, `ganpati_public_status_${wing.toLowerCase()}`, encodeURIComponent(item.ownerId)), { ownerId: item.ownerId, received: true, pending: false, lowAmount: Number(item.amount) < 100, updatedAt: serverTimestamp() });
    } catch { setError("Payment could not be confirmed. Please try again."); }
  }
  async function deletePendingContribution(item) {
    if (!isAdmin || !window.confirm(`Delete this pending payment of ${money.format(Number(item.amount) || 0)}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS[wing], item.id));
      await deleteDoc(doc(db, "ganpati_public_pending", item.id));
      if (item.ownerId) {
        const otherItems = normalized.filter((entry) => entry.id !== item.id && entry.type === "incoming" && entry.ownerId === item.ownerId);
        await setDoc(doc(db, `ganpati_public_status_${wing.toLowerCase()}`, encodeURIComponent(item.ownerId)), { ownerId: item.ownerId, received: otherItems.some((entry) => entry.verificationStatus !== "pending"), pending: otherItems.some((entry) => entry.verificationStatus === "pending"), updatedAt: serverTimestamp() });
      }
    } catch { setError("Pending payment could not be deleted. Please try again."); }
  }
  async function deleteLedgerContribution(item) {
    if (!isAdmin || !window.confirm(`Delete this ${item.verificationStatus === "pending" ? "pending" : "confirmed"} contribution of ${money.format(Number(item.amount) || 0)}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS[item.wing || wing], item.id));
      await deleteDoc(doc(db, "ganpati_public_pending", item.id));
      if (item.ownerId) {
        const remaining = normalized.filter((entry) => entry.id !== item.id && entry.type === "incoming" && entry.ownerId === item.ownerId);
        const received = remaining.some((entry) => entry.verificationStatus !== "pending");
        const pending = !received && remaining.some((entry) => entry.verificationStatus === "pending");
        const total = remaining.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        await setDoc(doc(db, `ganpati_public_status_${(item.wing || wing).toLowerCase()}`, encodeURIComponent(item.ownerId)), { ownerId: item.ownerId, received, pending, lowAmount: total > 0 && total < 100, updatedAt: serverTimestamp() });
      }
    } catch { setError("Contribution entry could not be deleted. Please try again."); }
  }
  async function saveTransaction(event) {
    event.preventDefault(); setError("");
    const owner = owners.find((item) => item.id === form.ownerId);
    if (form.type === "incoming" && !form.anonymous && !owner) return setError("Please select an owner or choose Anonymous.");
    if (form.type === "outgoing" && !form.purpose.trim()) return setError("Please enter the expense purpose.");
    setSaving(true);
    try {
      const transactionRef = await addDoc(collection(db, COLLECTIONS[wing]), {
        type: form.type, amount: Number(form.amount), mode: form.mode, date: form.date, remarks: form.remarks.trim(), wing,
        ...(form.type === "incoming" ? { ownerId: form.anonymous ? null : owner.id, name: form.anonymous ? (form.anonymousName.trim() || "Anonymous") : owner.name, flat: form.anonymous ? "Anonymous" : owner.flat, anonymous: form.anonymous } : { purpose: form.purpose.trim() }),
        createdAt: serverTimestamp(),
      });
      if (form.type === "outgoing") await setDoc(doc(db, `ganpati_public_expenses_${wing.toLowerCase()}`, transactionRef.id), { purpose: form.purpose.trim(), amount: Number(form.amount), mode: form.mode, date: form.date, remarks: form.remarks.trim(), createdAt: serverTimestamp() });
      if (form.type === "incoming" && !form.anonymous && owner) await setDoc(doc(db, `ganpati_public_status_${wing.toLowerCase()}`, encodeURIComponent(owner.id)), { ownerId: owner.id, received: true, pending: false, lowAmount: Number(form.amount) < 100, updatedAt: serverTimestamp() });
      setForm(emptyForm); setShowForm(false); setView("ledger");
    } catch { setError("Transaction could not be saved. Please try again."); }
    finally { setSaving(false); }
  }

  function downloadAuditPdf() {
    if (!isAdmin) return;
    const combinedEntries = auditEntries.map((item) => ({ ...item, type: item.type || "incoming" }));
    const contributions = combinedEntries.filter((item) => item.type === "incoming" && item.verificationStatus !== "pending" && Number(item.amount) > 0);
    const expenses = combinedEntries.filter((item) => item.type === "outgoing" && Number(item.amount) > 0);
    const auditRows = [...contributions, ...expenses].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.flat || "").localeCompare(String(b.flat || ""), undefined, { numeric: true }));
    const auditReceived = contributions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const auditSpent = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const auditPending = combinedEntries.filter((item) => item.type === "incoming" && item.verificationStatus === "pending").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
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
      pdf.text("Combined Building A + B Financial Audit", margin, 19);
      pdf.text(`Generated: ${new Date().toLocaleString("en-IN")}`, margin, 24);
      pdf.setTextColor(50, 36, 28);
      const summaryCells = [
        ["Received", Number(publicSummary.received) || 0], ["Spent", Number(publicSummary.spent) || 0], ["Pending review", Number(publicSummary.pendingReview) || 0],
        ["Building A balance", wingSummaries.A.received - wingSummaries.A.spent], ["Building B balance", wingSummaries.B.received - wingSummaries.B.spent], ["Combined A + B", Number(publicSummary.balance) || 0],
      ];
      const summaryWidth = (pageWidth - margin * 2) / 3;
      summaryCells.forEach(([label, value], index) => {
        const col = index % 3; const row = Math.floor(index / 3); const x = margin + col * summaryWidth; const boxY = 32 + row * 13;
        pdf.setDrawColor(224, 205, 191); pdf.setFillColor(row ? 250 : 255, row ? 244 : 250, row ? 238 : 246);
        pdf.rect(x, boxY, summaryWidth, 13, "FD");
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(6.8); pdf.setTextColor(120, 84, 65); pdf.text(label, x + 2, boxY + 4.2);
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(55, 37, 29); pdf.text(`Rs. ${Number(value).toLocaleString("en-IN")}`, x + 2, boxY + 9.8);
      });
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(7.5); pdf.setTextColor(80, 54, 42);
      pdf.text(`Combined ledger: Received Rs. ${auditReceived.toLocaleString("en-IN")}  |  Spent Rs. ${auditSpent.toLocaleString("en-IN")}  |  Balance Rs. ${(auditReceived - auditSpent).toLocaleString("en-IN")}  |  Pending Rs. ${auditPending.toLocaleString("en-IN")}`, margin, 61);
      pdf.setFontSize(8); pdf.setTextColor(255, 255, 255); pdf.setFillColor(74, 48, 36);
      pdf.rect(margin, 64, pageWidth - margin * 2, 8, "F");
      ["No.", "Type", "Resident / Purpose", "Amount", "Mode", "Date", "Remarks"].forEach((label, index) => pdf.text(label, columns[index] + 1.5, 69.2));
      pdf.setTextColor(50, 36, 28); y = 74;
    };

    const addPage = () => { if (page > 0) pdf.addPage(); page += 1; drawHeader(); };
    page = 0; addPage();

    auditRows.forEach((item, index) => {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5);
      const isExpense = item.type === "outgoing";
      const values = [String(index + 1), isExpense ? `${item.wing} Expense` : (item.anonymous ? `${item.wing} Anonymous` : `${item.wing} - Flat ${item.flat || "-"}`), isExpense ? (item.purpose || "Expense") : (item.name || "Anonymous"), `${isExpense ? "-" : "+"} Rs. ${(Number(item.amount) || 0).toLocaleString("en-IN")}`, item.mode || "-", item.date || "-", item.remarks || "-"];
      const lines = values.map((value, col) => pdf.splitTextToSize(String(value), widths[col] - 3));
      const rowHeight = Math.max(8, ...lines.map((line) => line.length * 3.4 + 3));
      if (y + rowHeight > 279) addPage();
      pdf.setDrawColor(224, 211, 201); pdf.setFillColor(index % 2 ? 252 : 255, index % 2 ? 248 : 255, index % 2 ? 244 : 255);
      pdf.rect(margin, y, pageWidth - margin * 2, rowHeight, "FD");
      lines.forEach((line, col) => pdf.text(line, columns[col] + 1.5, y + 4.7));
      y += rowHeight;
    });

    if (!auditRows.length) { pdf.setFontSize(10); pdf.text("No verified financial transactions recorded.", margin, y + 8); }
    const pages = pdf.getNumberOfPages();
    for (let i = 1; i <= pages; i += 1) {
      pdf.setPage(i); pdf.setFontSize(7); pdf.setTextColor(120, 95, 82);
      pdf.text(`Private admin audit - Created by Rushikesh Ghatol, A-1302`, margin, 291);
      pdf.text(`Page ${i} of ${pages}`, pageWidth - margin, 291, { align: "right" });
    }
    pdf.save("Breeza_Ganpati_2026_Combined_A_B_Financial_Audit.pdf");
  }

  function downloadPendingOwnersPdf() {
    if (!isAdmin) return;
    const unpaidOwners = owners.filter((owner) => !ownerTotals[owner.id] && !privatePendingContributions.some((item) => item.ownerId === owner.id));
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 14;
    let page = 0;
    let y = 0;

    const drawHeader = () => {
      pdf.setFillColor(154, 49, 27); pdf.rect(0, 0, pageWidth, 30, "F");
      pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(16);
      pdf.text("Breeza Society - Ganpati Utsav 2026", margin, 12);
      pdf.setFontSize(10); pdf.text(`Building ${wing} - Contribution Yet to Receive`, margin, 20);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.text(`Generated: ${new Date().toLocaleString("en-IN")}`, margin, 26);
      pdf.setTextColor(65, 43, 33); pdf.setFont("helvetica", "bold"); pdf.setFontSize(10);
      pdf.text(`Total owners yet to contribute: ${unpaidOwners.length}`, margin, 39);
      pdf.setFillColor(74, 48, 36); pdf.rect(margin, 44, pageWidth - margin * 2, 9, "F");
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(8);
      pdf.text("No.", margin + 2, 49.8); pdf.text("Flat", margin + 18, 49.8); pdf.text("Resident / Owner name", margin + 48, 49.8); pdf.text("Status", pageWidth - margin - 30, 49.8);
      y = 55;
    };
    const addPage = () => { if (page > 0) pdf.addPage(); page += 1; drawHeader(); };
    addPage();
    unpaidOwners.forEach((owner, index) => {
      const nameLines = pdf.splitTextToSize(owner.name, 92);
      const rowHeight = Math.max(9, nameLines.length * 4 + 4);
      if (y + rowHeight > 279) addPage();
      pdf.setFillColor(index % 2 ? 251 : 255, index % 2 ? 247 : 255, index % 2 ? 243 : 255); pdf.setDrawColor(226, 212, 202);
      pdf.rect(margin, y, pageWidth - margin * 2, rowHeight, "FD");
      pdf.setTextColor(55, 40, 32); pdf.setFont("helvetica", "normal"); pdf.setFontSize(8);
      pdf.text(String(index + 1), margin + 2, y + 5.8); pdf.text(String(owner.flat), margin + 18, y + 5.8); pdf.text(nameLines, margin + 48, y + 5.8);
      pdf.setTextColor(151, 96, 20); pdf.setFont("helvetica", "bold"); pdf.text("Yet to receive", pageWidth - margin - 30, y + 5.8);
      y += rowHeight;
    });
    if (!unpaidOwners.length) { pdf.setTextColor(55, 40, 32); pdf.setFontSize(11); pdf.text("All registered owners have contributed or submitted a payment for review.", margin, y + 10); }
    const pages = pdf.getNumberOfPages();
    for (let index = 1; index <= pages; index += 1) { pdf.setPage(index); pdf.setTextColor(120, 95, 82); pdf.setFontSize(7); pdf.text("Private admin report - Created by Rushikesh Ghatol, A-1302", margin, 291); pdf.text(`Page ${index} of ${pages}`, pageWidth - margin, 291, { align: "right" }); }
    pdf.save(`Breeza_Ganpati_2026_Building_${wing}_Pending_Owners.pdf`);
  }

  return <main className="app-shell">
    <header className="hero"><button className="admin-access" onClick={() => isAdmin ? adminLogout() : setShowLogin(true)}>{isAdmin ? "Exit admin" : "🔒 Admin"}</button><div className="hero-glow"/><div className="ganpati-mark">ॐ</div><p className="eyebrow">Breeza Society</p><h1>Ganpati Utsav 2026</h1><p className="blessing">गणपती बाप्पा मोरया</p><p className="creator-credit">Created by Rushikesh Ghatol · A-1302</p>
      <div className="upi-card hero-upi"><div className="upi-copy"><span>Ganpati contribution UPI</span><div className="upi-id-row"><strong>{UPI_ID}</strong><button onClick={copyUpiId} aria-label="Copy UPI ID">{copiedUpi ? "✓ Copied" : "⧉ Copy"}</button></div></div><div className="qr-frame"><QRCode value={UPI_LINK} size={156} type="svg" bordered={false} errorLevel="H"/></div><div className="upi-actions"><div><strong>Scan to contribute</strong><span>Use any UPI app</span></div><a href={UPI_LINK}>Pay via UPI</a></div></div>
    </header>
    <section className={`content ${view === "reviews" ? "review-mode" : ""} ${view === "owners" ? "owners-mode" : ""} ${view === "contributions" ? "contributions-mode" : ""} ${isAdmin && view === "ledger" ? "admin-expenses-mode" : ""}`}>
      <div className="wing-switch">{["A","B"].map((item) => <button key={item} className={wing === item ? "active" : ""} onClick={() => { setWing(item); setForm(emptyForm); }}>Building {item}</button>)}</div>
      {isAdmin ? <div className="admin-banner"><span>Admin view · Financial details unlocked</span><div className="admin-exports"><button onClick={downloadAuditPdf} disabled={!auditReady}>{auditReady ? "↓ Audit PDF" : "Loading audit…"}</button><button onClick={downloadPendingOwnersPdf}>↓ Pending owners</button></div></div> : <div className="privacy-note"><span>🔒</span><div><strong>Personal contributions are private</strong><p>Only combined society totals are public.</p></div></div>}
      <div className="combined-label">Combined society totals · Building A + B</div><div className="money-grid public-totals"><div className="money-card received"><span>Received</span><strong>{money.format(Number(publicSummary.received) || 0)}</strong><button className="tile-view" onClick={() => isAdmin ? setView("owners") : setShowLogin(true)}>View</button></div><div className="money-card spent"><span>Spent</span><strong>{money.format(Number(publicSummary.spent) || 0)}</strong><button className="tile-view" onClick={() => setView("ledger")}>View expenses</button></div><div className="money-card pending-total"><span>Pending review</span><strong>{money.format(Number(publicSummary.pendingReview) || 0)}</strong><button className="tile-view" onClick={() => isAdmin ? setView("reviews") : setShowLogin(true)}>{isAdmin ? `Review Building ${wing}` : "View"}</button></div><div className="money-card balance"><span>Balance</span><strong>{money.format(Number(publicSummary.balance) || 0)}</strong></div></div>
      <div className="section-balances"><div><span>Building A</span><strong>{money.format(wingSummaries.A.received - wingSummaries.A.spent)}</strong></div><div><span>Building B</span><strong>{money.format(wingSummaries.B.received - wingSummaries.B.spent)}</strong></div><div className="combined"><span>Combined A + B</span><strong>{money.format(Number(publicSummary.balance) || 0)}</strong></div></div>
      {!isAdmin && <button className="anonymous-contribution" onClick={startAnonymousContribution}><span>Anonymous contribution</span><small>Contribute without displaying your name or flat</small></button>}
      {isAdmin && <div className="view-tabs"><button className={view === "owners" ? "active" : ""} onClick={() => setView("owners")}>Owners</button><button className={view === "reviews" ? "active" : ""} onClick={() => setView("reviews")}>To review {allReviewItems.length ? `(${allReviewItems.length})` : ""}</button><button className={view === "contributions" ? "active" : ""} onClick={() => setView("contributions")}>Transactions</button><button className={view === "ledger" ? "active" : ""} onClick={() => setView("ledger")}>Expenses</button></div>}
      <div className="toolbar"><label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={view === "owners" ? "Search owner or flat" : view === "reviews" ? "Search pending payments" : view === "contributions" ? "Search contribution transactions" : "Search expenses"}/></label>{isAdmin && view !== "reviews" && view !== "contributions" && <button className="add-button" onClick={() => setShowForm(!showForm)}>{showForm ? "Close" : "+ Entry"}</button>}</div>
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
      {view === "owners" && lowOwnerIndexes.length > 0 && <style>{lowOwnerIndexes.map((index) => `.owners-mode .contribution-list>.contribution:nth-child(${index}){border-color:#e09a24;background:#fff6d8;box-shadow:0 0 0 2px #f6c65a55}`).join("")}</style>}
      {isAdmin && view === "reviews" && <div className="unified-reviews"><div className="unified-review-heading"><h2>Payments awaiting confirmation</h2><span>{allReviewItems.length}</span></div>{allReviewItems.length ? allReviewItems.map((item) => <article className={`review-card ${item.orphan ? "invalid-review" : ""}`} key={item.id}><div className="review-top"><div className="avatar pending-avatar">{item.orphan ? "!" : "?"}</div><div className="person"><strong>{item.name || "Anonymous"}</strong><span>Building {item.wing || wing} · Flat {item.flat || "Anonymous"} · {item.date || "No date"}</span></div><strong className="review-amount">{money.format(Number(item.amount) || 0)}</strong></div>{item.orphan && <p className="invalid-note">No matching private payment details. Confirm only after checking receipt.</p>}{!item.orphan && <div className="review-meta"><span>{item.mode || "UPI"}</span>{item.remarks && <span>Ref: {item.remarks}</span>}</div>}<div className="review-actions"><button className="approve-payment" onClick={() => approveContribution(item)}>✓ Confirm received</button><button className="delete-invalid-payment" onClick={() => deletePendingContribution(item)}>{item.orphan ? "Delete invalid entry" : "Delete pending entry"}</button></div></article>) : <div className="empty-state"><div>✓</div><strong>All payments reviewed</strong><p>No contribution is waiting for confirmation.</p></div>}</div>}
      {isAdmin && view === "contributions" && <div className="unified-reviews"><div className="unified-review-heading"><h2>All contribution transactions</h2><span>{contributionRows.length}</span></div>{contributionRows.length ? contributionRows.map((item) => <article className="review-card" key={item.id}><div className="review-top"><div className="avatar pending-avatar">{item.anonymous ? "A" : item.flat || "?"}</div><div className="person"><strong>{item.name || "Anonymous"}</strong><span>Building {item.wing || wing} · Flat {item.flat || "Anonymous"} · {item.date || "No date"}</span></div><strong className="review-amount">{money.format(Number(item.amount) || 0)}</strong></div><div className="review-meta"><span>{item.verificationStatus === "pending" ? "Pending review" : "Received"}</span><span>{item.mode || "Other"}</span>{item.remarks && <span>{item.remarks}</span>}</div><button className="delete-invalid-payment" onClick={() => deleteLedgerContribution(item)}>Delete contribution entry</button></article>) : <div className="empty-state"><strong>No contribution transactions</strong></div>}</div>}
      {isAdmin && view === "ledger" && <div className="unified-reviews"><div className="unified-review-heading"><h2>Building {wing} expenses</h2><span>{expenseRows.length}</span></div>{expenseRows.length ? expenseRows.map((item) => <article className="review-card" key={item.id}><div className="review-top"><div className="avatar outgoing">↑</div><div className="person"><strong>{item.purpose}</strong><span>{item.mode || "Other"} · {item.date || "No date"}</span></div><strong className="review-amount">−{money.format(Number(item.amount) || 0)}</strong></div>{item.remarks && <div className="review-meta"><span>{item.remarks}</span></div>}<div className="expense-actions"><button onClick={() => startExpenseEdit(item)}>Edit expense</button><button onClick={() => deleteExpense(item)}>Delete expense</button></div></article>) : <div className="empty-state"><strong>No expenses yet</strong></div>}</div>}
      {isAdmin && view === "reviews" && orphanPendingContributions.length > 0 && <div className="invalid-payment-panel"><strong>Invalid pending entries</strong><small>These entries have no matching private payment details. Delete them after checking payment was not received.</small>{orphanPendingContributions.map((item) => <button key={item.id} onClick={() => deletePendingContribution(item)}><span>{item.anonymous ? "Anonymous" : `Flat ${item.flat}`} · {money.format(Number(item.amount) || 0)}</span><b>Delete</b></button>)}</div>}
      <div className="list-heading"><h2>{view === "owners" ? `Building ${wing} owners` : view === "reviews" ? "Payments awaiting confirmation" : "Society expense details"}</h2><span>{view === "owners" ? visibleOwners.length : view === "reviews" ? pendingContributions.length : expenseRows.length}</span>{!isAdmin && view === "ledger" && <button className="back-owners" onClick={() => setView("owners")}>Back to owners</button>}</div>
      {loading ? <div className="empty-state">Loading Ganpati register…</div> : view === "owners" ? <div className="contribution-list">{visibleOwners.map((owner) => { const pendingEntry = normalized.some((item) => item.type === "incoming" && item.ownerId === owner.id && item.verificationStatus === "pending"); const status = isAdmin ? (ownerTotals[owner.id] ? "received" : pendingEntry ? "pending" : "none") : (publicStatuses[owner.id] || "none"); return <article className="contribution" key={owner.id}><div className="avatar">{owner.flat.split(" ")[0]}</div><div className="person"><strong>{owner.name}</strong><span>Flat {owner.flat}</span></div><div className="amount">{isAdmin ? <strong>{ownerTotals[owner.id] ? money.format(ownerTotals[owner.id]) : pendingEntry ? "Verify" : "—"}</strong> : <button className="private-lock" onClick={() => setShowPrivacyInfo(true)} aria-label="Private amount">🔒</button>}<small className={status === "received" ? "status-received" : status === "pending" ? "status-pending" : "status-waiting"}>{status === "received" ? "Received" : status === "pending" ? "Pending verification" : "Yet to receive"}</small><button className="edit-owner" onClick={() => startContributionEdit(owner)}>{isAdmin ? (pendingEntry ? "Verify contribution" : ownerTotals[owner.id] ? "Edit contribution" : "Add contribution") : status === "pending" ? "Payment submitted" : "Give contribution"}</button></div></article>})}</div> : view === "reviews" && isAdmin ? (pendingContributions.length ? <div className="contribution-list">{pendingContributions.map((item) => <article className="review-card" key={item.id}><div className="review-top"><div className="avatar pending-avatar">?</div><div className="person"><strong>{item.name || "Resident"}</strong><span>Building {wing} · Flat {item.flat || "—"} · {item.date || "No date"}</span></div><strong className="review-amount">{money.format(Number(item.amount) || 0)}</strong></div><div className="review-meta"><span>{item.mode || "UPI"}</span>{item.remarks && <span>Ref: {item.remarks}</span>}</div><button className="approve-payment" onClick={() => approveContribution(item)}>✓ Confirm received</button></article>)}</div> : <div className="empty-state"><div>✓</div><strong>All payments reviewed</strong><p>No contribution is waiting for confirmation.</p></div>) : expenseRows.length ? <div className="contribution-list">{expenseRows.map((item) => <article className="contribution" key={item.id}><div className="avatar outgoing">↑</div><div className="person"><strong>{item.purpose}</strong><span>Expense · {item.mode || "Mode not set"} · {item.date || "No date"}</span>{item.remarks && <em>{item.remarks}</em>}</div><div className="amount outgoing"><strong>−{money.format(Number(item.amount) || 0)}</strong>{isAdmin && <button className="delete-entry" onClick={() => deleteExpense(item)}>Delete</button>}</div></article>)}</div> : <div className="empty-state"><div>🧾</div><strong>No expenses yet</strong><p>Expense details will appear here.</p></div>}
    </section><footer><span>Ganpati-only account · Breeza Society</span><strong>Created by Rushikesh Ghatol · A-1302</strong></footer>
    {showLogin && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowLogin(false)}><form className="login-modal" onSubmit={adminLogin}><button type="button" className="modal-close" onClick={() => setShowLogin(false)}>×</button><div className="lock-icon">🔐</div><h2>Admin access</h2><p>Enter the administrator password to view contributions and expenses.</p><label>Password<div className="password-field"><input autoFocus required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password"/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "🙈" : "👁"}</button></div></label>{loginError && <span className="login-error">{loginError}</span>}<button className="unlock-button">Secure sign in</button></form></div>}
    {editingContribution && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setEditingContribution(null)}><form className="login-modal contribution-modal" onSubmit={saveContributionEdit}><button type="button" className="modal-close" onClick={() => setEditingContribution(null)}>×</button><p className="modal-kicker">Building {wing} · Flat {editingContribution.owner.flat}</p><h2>{isAdmin ? (editingContribution.existing?.verificationStatus === "pending" ? "Verify contribution" : "Manual contribution") : paymentStep === 1 ? "Enter contribution" : "Complete payment"}</h2><p className="frozen-owner">{editingContribution.owner.name}</p>{isAdmin ? <><small>Check the payment record before confirming it as Received.</small><div className="payment-step"><b>1</b><span><strong>Enter or verify payment details</strong><small>Manual entry is restricted to the administrator.</small></span></div><label>Amount<input autoFocus required type="number" min="1" inputMode="numeric" value={contributionEdit.amount} onChange={(e) => setContributionEdit({ ...contributionEdit, amount: e.target.value })} placeholder="₹ 0"/></label><div className="form-row"><label>Payment mode<select value={contributionEdit.mode} onChange={(e) => setContributionEdit({ ...contributionEdit, mode: e.target.value })}><option>UPI</option><option>Cash</option><option>Bank transfer</option><option>Other</option></select></label><label>Payment date<input required type="date" value={contributionEdit.date} onChange={(e) => setContributionEdit({ ...contributionEdit, date: e.target.value })}/></label></div><label>Transaction reference / remarks<input value={contributionEdit.remarks} onChange={(e) => setContributionEdit({ ...contributionEdit, remarks: e.target.value })} placeholder="Optional transaction reference or note"/></label><button className="unlock-button" disabled={saving}>{saving ? "Saving…" : "Confirm received & save"}</button>{editingContribution.existing && <button type="button" className="delete-contribution" onClick={deleteContribution} disabled={saving}>Delete incorrect entry</button>}</> : paymentStep === 1 ? <><small>First save your amount. It will remain Pending until Breeza admin verifies the actual payment.</small><div className="payment-step"><b>1</b><span><strong>Enter contribution amount</strong><small>No payment is claimed at this stage.</small></span></div><label>Amount<input autoFocus required type="number" min="1" inputMode="numeric" value={contributionEdit.amount} onChange={(e) => setContributionEdit({ ...contributionEdit, amount: e.target.value })} placeholder="₹ 0"/></label><button className="unlock-button" disabled={saving}>{saving ? "Saving pending entry…" : "Continue to payment"}</button></> : <><div className="pending-saved">✓ Amount saved as Pending review</div><div className="payment-step"><b>2</b><span><strong>Pay using UPI</strong><small>Scan QR, tap Pay now, or copy the UPI ID.</small></span></div><div className="modal-payment"><div className="mini-qr"><QRCode value={contributionPaymentLink} size={132} type="svg" bordered={false} errorLevel="H"/></div><div><strong>{money.format(Number(contributionEdit.amount) || 0)}</strong><span>{UPI_ID}</span><div className="pay-actions"><a href={contributionPaymentLink}>Pay now</a><button type="button" onClick={copyUpiId}>{copiedUpi ? "Copied ✓" : "Copy UPI"}</button></div><small>Breeza admin will verify receipt before marking Received.</small></div></div><button type="button" className="unlock-button" onClick={() => setEditingContribution(null)}>Done / Close</button></>}</form></div>}
    {editingExpense && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setEditingExpense(null)}><form className="login-modal contribution-modal" onSubmit={saveExpenseEdit}><button type="button" className="modal-close" onClick={() => setEditingExpense(null)}>×</button><p className="modal-kicker">Building {editingExpense.wing || wing}</p><h2>Edit expense</h2><label>Purpose<input autoFocus required value={editingExpense.purpose} onChange={(e) => setEditingExpense({ ...editingExpense, purpose: e.target.value })}/></label><label>Amount<input required type="number" min="1" inputMode="numeric" value={editingExpense.amount} onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}/></label><div className="form-row"><label>Payment mode<select value={editingExpense.mode} onChange={(e) => setEditingExpense({ ...editingExpense, mode: e.target.value })}><option>UPI</option><option>Cash</option><option>Bank transfer</option><option>Other</option></select></label><label>Date<input required type="date" value={editingExpense.date} onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}/></label></div><label>Remarks<input value={editingExpense.remarks} onChange={(e) => setEditingExpense({ ...editingExpense, remarks: e.target.value })} placeholder="Optional note"/></label><button className="unlock-button" disabled={saving}>{saving ? "Saving…" : "Save expense changes"}</button></form></div>}
    {showPrivacyInfo && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowPrivacyInfo(false)}><div className="login-modal privacy-modal"><button className="modal-close" onClick={() => setShowPrivacyInfo(false)}>×</button><div className="lock-icon">🔒</div><h2>Private contribution</h2><p>Contribution amounts and expense details can only be viewed by the Ganpati administrator.</p><button className="unlock-button" onClick={() => { setShowPrivacyInfo(false); setShowLogin(true); }}>Admin sign in</button></div></div>}
  </main>;
}
