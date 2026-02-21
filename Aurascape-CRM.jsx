import { useState, useEffect } from "react";

const STAGES = ["Lead", "Quoted", "Deposit Paid", "Confirmed", "Completed", "Lost"];
const SERVICES = [
  "Luxury Hotel", "Economical Hotel", "Business/Premium Flight", "Economy Flight",
  "Cruise", "Visa", "Transfer", "Insurance", "Luxe Adventure", "Corporate", "Other"
];
const STAGE_COLORS = {
  "Lead": "bg-blue-100 text-blue-800",
  "Quoted": "bg-yellow-100 text-yellow-800",
  "Deposit Paid": "bg-orange-100 text-orange-800",
  "Confirmed": "bg-purple-100 text-purple-800",
  "Completed": "bg-green-100 text-green-800",
  "Lost": "bg-red-100 text-red-800",
};

const EMPTY_FORM = {
  name: "", email: "", phone: "", type: "Leisure",
  stage: "Lead", services: [], destination: "",
  travelDate: "", budgetUsd: "", notes: "", source: "Referral"
};

const BRAND = "#1B3F6E";
const GOLD = "#C9A84C";

function genId() { return "c_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7); }

function ServiceCheckboxes({ selected, onChange }) {
  function toggle(svc) {
    onChange(selected.includes(svc) ? selected.filter(s => s !== svc) : [...selected, svc]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {SERVICES.map(svc => (
        <button key={svc} type="button" onClick={() => toggle(svc)}
          className="text-xs px-3 py-1.5 rounded-full border font-medium transition"
          style={selected.includes(svc)
            ? { backgroundColor: BRAND, color: "#fff", borderColor: BRAND }
            : { backgroundColor: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }}>
          {svc}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [view, setView] = useState("pipeline");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadContacts(); }, []);

  async function loadContacts() {
    setLoading(true);
    try {
      const result = await window.storage.get("aurascape_crm_contacts");
      if (result && result.value) {
        const data = JSON.parse(result.value);
        const migrated = data.map(c => ({
          ...c,
          services: c.services || (c.service ? [c.service] : [])
        }));
        setContacts(migrated);
      }
    } catch (e) {}
    setLoading(false);
  }

  async function saveContacts(updated) {
    setSaving(true);
    try {
      await window.storage.set("aurascape_crm_contacts", JSON.stringify(updated));
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    const updated = editId
      ? contacts.map(c => c.id === editId ? { ...c, ...form } : c)
      : [...contacts, { ...form, id: genId(), createdAt: new Date().toISOString() }];
    setContacts(updated);
    saveContacts(updated);
    setForm(EMPTY_FORM);
    setEditId(null);
    setView("pipeline");
  }

  function updateStage(id, stage) {
    const updated = contacts.map(c => c.id === id ? { ...c, stage } : c);
    setContacts(updated);
    saveContacts(updated);
    if (selected?.id === id) setSelected(prev => ({ ...prev, stage }));
  }

  function deleteContact(id) {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    saveContacts(updated);
    setSelected(null);
    setView("pipeline");
  }

  function startEdit(contact) {
    setForm({ ...EMPTY_FORM, ...contact, services: contact.services || (contact.service ? [contact.service] : []) });
    setEditId(contact.id);
    setView("add");
  }

  const filtered = contacts.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.destination || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filterStage === "All" || c.stage === filterStage);
  });

  const totalValue = contacts.reduce((sum, c) => sum + parseFloat(c.budgetUsd || 0), 0);
  const activeCount = contacts.filter(c => !["Completed", "Lost"].includes(c.stage)).length;
  const completedCount = contacts.filter(c => c.stage === "Completed").length;

  const svcLabel = c => {
    const s = c.services?.length > 0 ? c.services : (c.service ? [c.service] : []);
    return s.length === 0 ? "—" : s.length === 1 ? s[0] : `${s[0]} +${s.length - 1}`;
  };

  const inp = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300";
  const lbl = "block text-xs font-semibold text-gray-600 mb-1";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ backgroundColor: BRAND }} className="text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-xl font-bold tracking-wide">✈ AuraScape CRM</div>
          <div className="text-blue-200 text-xs mt-0.5">Lead & Booking Pipeline</div>
        </div>
        <div className="flex gap-3 items-center">
          {saving && <span className="text-blue-200 text-xs animate-pulse">Saving...</span>}
          <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setView("add"); }}
            style={{ backgroundColor: GOLD }}
            className="text-white text-sm font-bold px-5 py-2 rounded-lg hover:opacity-90 transition shadow">
            + New Lead
          </button>
        </div>
      </div>

      {/* Nav */}
      <div className="bg-white border-b px-6 flex gap-1 pt-2">
        {[["pipeline", "🗂 Pipeline"], ["list", "📋 All Contacts"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition ${view === v ? "border-blue-700 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading contacts...</div>
      ) : (
        <div className="p-6">

          {/* Stats */}
          {(view === "pipeline" || view === "list") && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                ["Total Contacts", contacts.length, "#1B3F6E"],
                ["Active Pipeline", activeCount, "#7c3aed"],
                ["Completed", completedCount, "#15803d"],
                ["Pipeline Value", "$" + totalValue.toLocaleString(), "#b45309"],
              ].map(([label, val, color]) => (
                <div key={label} className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="text-2xl font-bold" style={{ color }}>{val}</div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* PIPELINE */}
          {view === "pipeline" && (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4 min-w-max pb-4">
                {STAGES.map(stage => {
                  const cards = contacts.filter(c => c.stage === stage);
                  return (
                    <div key={stage} className="w-64 flex-shrink-0">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${STAGE_COLORS[stage]}`}>{stage}</span>
                        <span className="text-xs text-gray-400 font-medium">{cards.length}</span>
                      </div>
                      <div className="space-y-2">
                        {cards.map(c => (
                          <div key={c.id} onClick={() => { setSelected(c); setView("detail"); }}
                            className="bg-white rounded-lg p-3 shadow-sm border hover:shadow-md cursor-pointer transition">
                            <div className="font-semibold text-gray-800 text-sm">{c.name}</div>
                            {c.email && <div className="text-xs text-gray-400 mt-0.5 truncate">✉ {c.email}</div>}
                            <div className="text-xs text-gray-500 mt-1">{svcLabel(c)}</div>
                            {c.destination && <div className="text-xs text-blue-600 mt-0.5">📍 {c.destination}</div>}
                            {c.budgetUsd && <div className="text-xs font-semibold text-green-600 mt-1">${parseFloat(c.budgetUsd).toLocaleString()}</div>}
                            {c.travelDate && <div className="text-xs text-gray-400 mt-0.5">✈ {c.travelDate}</div>}
                            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">{c.type}</div>
                          </div>
                        ))}
                        {!cards.length && (
                          <div className="bg-gray-50 rounded-lg p-4 text-center text-xs text-gray-300 border border-dashed">Empty</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LIST */}
          {view === "list" && (
            <div>
              <div className="flex gap-3 mb-4">
                <input placeholder="Search by name, email or destination..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="All">All Stages</option>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="bg-white rounded-xl shadow-sm border overflow-auto">
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: BRAND }} className="text-white">
                    <tr>
                      {["Name", "Email", "Type", "Services", "Destination", "Stage", "Budget", "Travel Date", "Source"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!filtered.length && (
                      <tr><td colSpan={9} className="text-center py-10 text-gray-400">No contacts found</td></tr>
                    )}
                    {filtered.map((c, i) => (
                      <tr key={c.id} onClick={() => { setSelected(c); setView("detail"); }}
                        className={`cursor-pointer hover:bg-blue-50 transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{c.name}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{c.email || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.type}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{svcLabel(c)}</td>
                        <td className="px-4 py-3 text-blue-600 whitespace-nowrap">{c.destination || "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STAGE_COLORS[c.stage]}`}>{c.stage}</span>
                        </td>
                        <td className="px-4 py-3 text-green-600 font-medium whitespace-nowrap">{c.budgetUsd ? "$" + parseFloat(c.budgetUsd).toLocaleString() : "—"}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.travelDate || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADD / EDIT */}
          {view === "add" && (
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold mb-1" style={{ color: BRAND }}>{editId ? "Edit Contact" : "Add New Lead"}</h2>
              <p className="text-xs text-gray-400 mb-6">Fields marked * are required</p>
              <div className="grid grid-cols-2 gap-4">

                <div className="col-span-2">
                  <label className={lbl}>Full Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Jane Smith" className={inp} />
                </div>

                <div className="col-span-2">
                  <label className={lbl}>📧 Email Address</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. jane@company.com" className={inp} />
                </div>

                <div>
                  <label className={lbl}>📞 Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. +1 876 555 0000" className={inp} />
                </div>

                <div>
                  <label className={lbl}>📍 Destination</label>
                  <input type="text" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })}
                    placeholder="e.g. Paris, France" className={inp} />
                </div>

                <div>
                  <label className={lbl}>✈ Travel Date</label>
                  <input type="date" value={form.travelDate} onChange={e => setForm({ ...form, travelDate: e.target.value })} className={inp} />
                </div>

                <div>
                  <label className={lbl}>💰 Budget (USD)</label>
                  <input type="number" value={form.budgetUsd} onChange={e => setForm({ ...form, budgetUsd: e.target.value })}
                    placeholder="e.g. 5000" className={inp} />
                </div>

                <div>
                  <label className={lbl}>Client Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inp}>
                    {["Leisure", "Corporate", "Luxe Adventure"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className={lbl}>Pipeline Stage</label>
                  <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} className={inp}>
                    {STAGES.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className={lbl}>Lead Source</label>
                  <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className={inp}>
                    {["Referral", "Instagram", "TikTok", "Google Ads", "LinkedIn", "Conference", "Existing Client", "Other"].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className={lbl}>Services Required <span className="text-gray-400 font-normal">(select all that apply)</span></label>
                  <ServiceCheckboxes selected={form.services || []} onChange={svcs => setForm({ ...form, services: svcs })} />
                  {form.services?.length > 0 && (
                    <div className="mt-2 text-xs font-medium" style={{ color: BRAND }}>
                      {form.services.length} selected: {form.services.join(", ")}
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <label className={lbl}>Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
                    placeholder="Special requests, preferences, follow-up actions..."
                    className={inp} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleSubmit} style={{ backgroundColor: BRAND }}
                  className="flex-1 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition">
                  {editId ? "Save Changes" : "Add Lead"}
                </button>
                <button onClick={() => { setView("pipeline"); setForm(EMPTY_FORM); setEditId(null); }}
                  className="px-6 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* DETAIL */}
          {view === "detail" && selected && (() => {
            const svcs = selected.services?.length > 0 ? selected.services : (selected.service ? [selected.service] : []);
            return (
              <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selected.name}</h2>
                    <div className="text-sm text-gray-500 mt-0.5">{selected.type}</div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${STAGE_COLORS[selected.stage]}`}>{selected.stage}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    ["📧 Email", selected.email || "—"],
                    ["📞 Phone", selected.phone || "—"],
                    ["📍 Destination", selected.destination || "—"],
                    ["✈ Travel Date", selected.travelDate || "—"],
                    ["💰 Budget", selected.budgetUsd ? "$" + parseFloat(selected.budgetUsd).toLocaleString() : "—"],
                    ["📣 Source", selected.source || "—"],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-400">{label}</div>
                      <div className="text-sm font-medium text-gray-700 mt-0.5 break-words">{val}</div>
                    </div>
                  ))}
                </div>

                {svcs.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Services</div>
                    <div className="flex flex-wrap gap-2">
                      {svcs.map(s => (
                        <span key={s} className="text-white text-xs px-3 py-1 rounded-full" style={{ backgroundColor: BRAND }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="text-xs font-semibold text-yellow-700 mb-1">Notes</div>
                    <div className="text-sm text-gray-700">{selected.notes}</div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Move Stage</div>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.map(s => (
                      <button key={s} onClick={() => updateStage(selected.id, s)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition border ${selected.stage === s ? STAGE_COLORS[s] + " border-current" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={() => startEdit(selected)} style={{ backgroundColor: BRAND }}
                    className="flex-1 text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 transition">
                    Edit
                  </button>
                  <button onClick={() => setView("pipeline")}
                    className="flex-1 border text-sm text-gray-600 py-2.5 rounded-lg hover:bg-gray-50 transition">
                    Back
                  </button>
                  <button onClick={() => { if (window.confirm("Delete this contact?")) deleteContact(selected.id); }}
                    className="px-4 py-2.5 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition border border-red-200">
                    Delete
                  </button>
                </div>
              </div>
            );
          })()}

        </div>
      )}
    </div>
  );
}
