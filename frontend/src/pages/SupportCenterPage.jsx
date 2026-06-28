import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Headphones,
  LayoutDashboard,
  LifeBuoy,
  MessageCircle,
  RefreshCcw,
  Send,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";

import {
  RoleBadge,
  RoleButton,
  RoleDashboardShell,
  RoleEmpty,
  RoleField,
  RoleHero,
  RoleMetricCard,
  RoleNotice,
  RolePanel,
  RoleRefreshButton,
  RoleSectionTitle,
  roleFadeUp,
} from "../components/RoleDashboardShell.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const baseNav = [
  { label: "Dashboard", href: "#dashboard", icon: LayoutDashboard },
  { label: "Create Ticket", href: "#create", icon: LifeBuoy },
  { label: "My Tickets", href: "#tickets", icon: TicketCheck },
  { label: "Ticket Chat", href: "#chat", icon: MessageCircle },
];

const statusOptions = ["Open", "Assigned", "In Progress", "Resolved", "Closed"];
const priorityOptions = ["Low", "Medium", "High", "Urgent"];

export default function SupportCenterPage() {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [options, setOptions] = useState({ categories: [], all_categories: [], priorities: priorityOptions, statuses: statusOptions });
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ category: "", subject: "", description: "", priority: "Medium", attachment_url: "" });
  const [message, setMessage] = useState("");
  const [adminDraft, setAdminDraft] = useState({ status: "Open", priority: "Medium", assigned_to: "", resolution_notes: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isAdmin = ["admin", "super_admin"].includes(user?.role);
  const navItems = isAdmin ? [...baseNav, { label: "Admin Response", href: "#admin-response", icon: ShieldCheck }] : baseNav;

  async function load(selectTicketId = selected?.ticket_id) {
    setLoading(true);
    setError("");
    try {
      const [optionRows, ticketRows] = await Promise.all([
        api("/support/options", { token }),
        api("/support/tickets", { token }),
      ]);
      setOptions(optionRows);
      setTickets(ticketRows);
      const first = ticketRows.find((ticket) => ticket.ticket_id === selectTicketId) || ticketRows[0] || null;
      if (first) {
        await loadTicket(first.ticket_id, false);
      } else {
        setSelected(null);
      }
      setForm((current) => ({
        ...current,
        category: current.category || optionRows.categories?.[0] || optionRows.all_categories?.[0] || "",
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTicket(ticketId, clearNotice = true) {
    if (clearNotice) {
      setError("");
      setNotice("");
    }
    const detail = await api(`/support/tickets/${ticketId}`, { token });
    setSelected(detail);
    setAdminDraft({
      status: detail.status || "Open",
      priority: detail.priority || "Medium",
      assigned_to: detail.assigned_to || "",
      resolution_notes: "",
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function createTicket(event) {
    event.preventDefault();
    setBusy("create");
    setError("");
    setNotice("");
    try {
      const ticket = await api("/support/tickets", { method: "POST", token, body: form });
      setNotice(`Ticket ${ticket.ticket_id} created.`);
      setForm({ category: options.categories?.[0] || "", subject: "", description: "", priority: "Medium", attachment_url: "" });
      await load(ticket.ticket_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!selected) return;
    setBusy("message");
    setError("");
    setNotice("");
    try {
      await api(`/support/tickets/${selected.ticket_id}/messages`, {
        method: "POST",
        token,
        body: { message },
      });
      setMessage("");
      setNotice("Message added to ticket.");
      await loadTicket(selected.ticket_id, false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function updateTicket(event) {
    event.preventDefault();
    if (!selected) return;
    setBusy("update");
    setError("");
    setNotice("");
    try {
      const body = {
        status: adminDraft.status,
        priority: adminDraft.priority,
        assigned_to: adminDraft.assigned_to ? Number(adminDraft.assigned_to) : null,
        resolution_notes: adminDraft.resolution_notes,
      };
      const updated = await api(`/support/tickets/${selected.ticket_id}`, { method: "PATCH", token, body });
      setSelected(updated);
      setNotice("Ticket updated and email notification logged.");
      await load(updated.ticket_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const metrics = useMemo(() => {
    const active = tickets.filter((ticket) => ["Open", "Assigned", "In Progress"].includes(ticket.status)).length;
    const resolved = tickets.filter((ticket) => ["Resolved", "Closed"].includes(ticket.status)).length;
    const urgent = tickets.filter((ticket) => ["High", "Urgent"].includes(ticket.priority)).length;
    return { total: tickets.length, active, resolved, urgent };
  }, [tickets]);

  return (
    <RoleDashboardShell
      roleLabel="LYTIX Support Desk"
      title="Support Ticket Center"
      subtitle="Create tickets, track resolution, chat with admins, and keep email notifications logged."
      navItems={navItems}
      actions={<RoleRefreshButton onClick={() => load()} disabled={loading} />}
      badge={isAdmin ? "Admin Response" : "Support Active"}
    >
      {loading && tickets.length === 0 ? (
        <RolePanel className="grid min-h-[50vh] place-items-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" /></RolePanel>
      ) : (
        <motion.div className="grid min-w-0 gap-6" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <RoleHero
            eyebrow="Support system"
            title="Ticket workflow from open to resolved."
            subtitle="Students, mentors, recruiters, and HR can raise tickets. Admins can assign, respond, resolve, and log email notifications."
            chips={["Open", "Assigned", "In Progress", "Resolved", "Closed"]}
          >
            <div className="grid min-w-[220px] gap-3 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
              <Headphones className="text-cyan-200" size={28} />
              <strong className="text-4xl font-black text-white">{metrics.active}</strong>
              <span className="text-sm font-bold text-slate-400">Active tickets</span>
            </div>
          </RoleHero>

          {notice && <RoleNotice>{notice}</RoleNotice>}
          {error && <RoleNotice type="error">{error}</RoleNotice>}

          <motion.section id="dashboard" className="grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]" variants={roleFadeUp}>
            <RoleMetricCard icon={TicketCheck} label="Total Tickets" value={metrics.total} />
            <RoleMetricCard icon={AlertCircle} label="Active" value={metrics.active} tone="cyan" />
            <RoleMetricCard icon={CheckCircle2} label="Resolved/Closed" value={metrics.resolved} />
            <RoleMetricCard icon={ShieldCheck} label="High Priority" value={metrics.urgent} tone="indigo" />
          </motion.section>

          <motion.section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" variants={roleFadeUp}>
            <RolePanel id="create">
              <RoleSectionTitle eyebrow="Create Ticket" title="Tell support what happened." />
              <form className="mt-6 grid gap-3" onSubmit={createTicket}>
                <RoleField as="select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required>
                  {(options.categories?.length ? options.categories : options.all_categories || []).map((category) => <option key={category}>{category}</option>)}
                </RoleField>
                <RoleField as="select" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                  {(options.priorities || priorityOptions).map((priority) => <option key={priority}>{priority}</option>)}
                </RoleField>
                <RoleField placeholder="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required />
                <RoleField as="textarea" rows={5} placeholder="Describe the issue" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
                <RoleField placeholder="Attachment URL placeholder" value={form.attachment_url} onChange={(event) => setForm({ ...form, attachment_url: event.target.value })} />
                <RoleButton disabled={busy === "create"}>
                  <LifeBuoy size={17} />
                  Create Ticket
                </RoleButton>
              </form>
            </RolePanel>

            <RolePanel id="tickets">
              <RoleSectionTitle eyebrow={isAdmin ? "All Tickets" : "My Tickets"} title="Resolution tracker." />
              <div className="mt-6 grid gap-3">
                {tickets.length === 0 && <RoleEmpty message="No support tickets yet." />}
                {tickets.map((ticket) => (
                  <button
                    className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${selected?.ticket_id === ticket.ticket_id ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 bg-white/[0.055] hover:bg-white/[0.08]"}`}
                    key={ticket.ticket_id}
                    onClick={() => loadTicket(ticket.ticket_id)}
                    type="button"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <RoleBadge tone={statusTone(ticket.status)}>{ticket.status}</RoleBadge>
                          <RoleBadge tone={priorityTone(ticket.priority)}>{ticket.priority}</RoleBadge>
                        </div>
                        <h3 className="mt-3 truncate text-lg font-black text-white">{ticket.subject}</h3>
                        <p className="mt-1 text-sm font-bold text-slate-400">{ticket.ticket_id} | {ticket.category}</p>
                        {isAdmin && <p className="mt-1 text-xs font-bold text-slate-500">{ticket.creator_name} - {ticket.creator_email}</p>}
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100">{ticket.updated_at}</span>
                    </div>
                  </button>
                ))}
              </div>
            </RolePanel>
          </motion.section>

          <motion.section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]" variants={roleFadeUp}>
            <RolePanel id="chat">
              <RoleSectionTitle eyebrow="Ticket Chat" title={selected ? selected.subject : "Select a ticket"} />
              {!selected ? (
                <div className="mt-6"><RoleEmpty message="Choose a ticket to view the chat thread." /></div>
              ) : (
                <>
                  <div className="mt-6 grid max-h-[430px] gap-3 overflow-y-auto pr-1">
                    {(selected.messages || []).map((item) => (
                      <div className={`rounded-2xl border p-4 ${item.sender_id === user?.id ? "ml-auto max-w-[86%] border-cyan-300/30 bg-cyan-300/10" : "mr-auto max-w-[86%] border-white/10 bg-white/[0.055]"}`} key={item.id}>
                        <strong className="block text-sm font-black text-white">{item.sender_name}</strong>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{item.message}</p>
                        <span className="mt-3 block text-xs font-bold text-slate-500">{item.created_at}</span>
                      </div>
                    ))}
                  </div>
                  <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={sendMessage}>
                    <RoleField placeholder="Write a message" value={message} onChange={(event) => setMessage(event.target.value)} required />
                    <RoleButton disabled={busy === "message"}>
                      <Send size={17} />
                      Send
                    </RoleButton>
                  </form>
                </>
              )}
            </RolePanel>

            <RolePanel id="admin-response">
              <RoleSectionTitle eyebrow={isAdmin ? "Admin Response Panel" : "Resolution Tracking"} title="Ticket controls." />
              {!selected ? (
                <div className="mt-6"><RoleEmpty message="Select a ticket to see workflow details." /></div>
              ) : isAdmin ? (
                <form className="mt-6 grid gap-3" onSubmit={updateTicket}>
                  <RoleField as="select" value={adminDraft.status} onChange={(event) => setAdminDraft({ ...adminDraft, status: event.target.value })}>
                    {(options.statuses || statusOptions).map((status) => <option key={status}>{status}</option>)}
                  </RoleField>
                  <RoleField as="select" value={adminDraft.priority} onChange={(event) => setAdminDraft({ ...adminDraft, priority: event.target.value })}>
                    {(options.priorities || priorityOptions).map((priority) => <option key={priority}>{priority}</option>)}
                  </RoleField>
                  <RoleField placeholder="Assign to user ID placeholder" value={adminDraft.assigned_to} onChange={(event) => setAdminDraft({ ...adminDraft, assigned_to: event.target.value })} />
                  <RoleField as="textarea" rows={5} placeholder="Resolution notes / admin response" value={adminDraft.resolution_notes} onChange={(event) => setAdminDraft({ ...adminDraft, resolution_notes: event.target.value })} />
                  <RoleButton disabled={busy === "update"}>
                    <ShieldCheck size={17} />
                    Update Ticket
                  </RoleButton>
                </form>
              ) : (
                <div className="mt-6 grid gap-3">
                  <Info label="Ticket ID" value={selected.ticket_id} />
                  <Info label="Status" value={selected.status} />
                  <Info label="Priority" value={selected.priority} />
                  <Info label="Assigned To" value={selected.assigned_to_name || "Pending"} />
                  <Info label="Resolution" value={selected.resolution_notes || "Support team is reviewing this ticket."} />
                </div>
              )}
            </RolePanel>
          </motion.section>
        </motion.div>
      )}
    </RoleDashboardShell>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-cyan-200">{label}</span>
      <strong className="mt-2 block break-words text-white">{value}</strong>
    </div>
  );
}

function statusTone(status) {
  if (["Resolved", "Closed"].includes(status)) return "green";
  if (status === "In Progress") return "cyan";
  if (status === "Assigned") return "blue";
  return "amber";
}

function priorityTone(priority) {
  if (priority === "Urgent") return "rose";
  if (priority === "High") return "amber";
  if (priority === "Low") return "slate";
  return "cyan";
}

