import React, { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Megaphone,
  MessageCircle,
  RefreshCcw,
  Search,
  SendHorizonal,
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import DashboardShell from "../components/DashboardShell.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const navItems = [
  { label: "Groups", href: "#groups", icon: UsersRound },
  { label: "Posts", href: "#posts", icon: MessageCircle },
  { label: "Create", href: "#create", icon: SendHorizonal },
];

const communityHighlights = [
  ["Hackathons", "Join build challenges, submit projects, and compete with peers.", "/hackathons", Trophy],
  ["Leaderboard", "Track top performers, innovation points, and project recognition.", "/leaderboard", BarChart3],
  ["Talent Directory", "Explore verified student profiles, skills, projects, and credentials.", "/talent", Search],
  ["Success Stories", "Read learner stories from internships, placements, and project wins.", "/success-stories", Star],
  ["Events", "Follow domain-wise announcements, sessions, and community events.", "#posts", CalendarDays],
];

export default function CommunityPage() {
  const { token, user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [filters, setFilters] = useState({ domain_id: "", post_type: "" });
  const [form, setForm] = useState({ group_id: "", domain_id: "", post_type: "discussion", title: "", content: "", event_date: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.domain_id) params.set("domain_id", filters.domain_id);
      if (filters.post_type) params.set("post_type", filters.post_type);
      const [groupRows, postRows] = await Promise.all([
        api("/community/groups", { token }),
        api(`/community/posts${params.toString() ? `?${params}` : ""}`, { token }),
      ]);
      setGroups(groupRows);
      setPosts(postRows);
      const commentRows = await Promise.all(postRows.slice(0, 8).map((post) => api(`/community/posts/${post.id}/comments`, { token })));
      const next = {};
      postRows.slice(0, 8).forEach((post, index) => { next[post.id] = commentRows[index]; });
      setComments(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filters.domain_id, filters.post_type]);

  async function createPost(event) {
    event.preventDefault();
    setBusy("post");
    setError("");
    setNotice("");
    try {
      await api("/community/posts", {
        method: "POST",
        token,
        body: {
          ...form,
          group_id: form.group_id ? Number(form.group_id) : null,
          domain_id: form.domain_id ? Number(form.domain_id) : null,
        },
      });
      setNotice("Community post created.");
      setForm({ group_id: "", domain_id: "", post_type: "discussion", title: "", content: "", event_date: "" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function addComment(postId) {
    const content = commentDrafts[postId] || "";
    if (!content.trim()) return;
    setBusy(`comment-${postId}`);
    setError("");
    setNotice("");
    try {
      await api(`/community/posts/${postId}/comments`, { method: "POST", token, body: { content } });
      setCommentDrafts({ ...commentDrafts, [postId]: "" });
      setNotice("Comment posted.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <main className="page-shell"><section className="section-band"><div className="loader-panel">Loading community...</div></section></main>;
  }

  const canCreateAnnouncements = ["admin", "mentor", "hr", "super_admin"].includes(user?.role);

  return (
    <DashboardShell
      eyebrow="Community"
      title="Domain-wise community."
      subtitle="Discussion groups, announcements, events, and comments for the internship cohort."
      navItems={navItems}
      actions={<button className="btn-secondary" onClick={load}><RefreshCcw size={17} />Refresh</button>}
    >
      {notice && <div className="success-panel mt-6">{notice}</div>}
      {error && <div className="error-panel mt-6">{error}</div>}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {communityHighlights.map(([title, copy, to, Icon]) => (
          <Link
            to={to}
            className="glass-panel transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-glass"
            key={title}
          >
            <Icon className="text-[#2563EB]" size={26} />
            <h2 className="mt-5 text-lg font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
          </Link>
        ))}
      </div>
      <GlassPanel id="groups" className="mt-6">
        <h2 className="panel-title">Groups and filters</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <select className="field-input" value={filters.domain_id} onChange={(event) => setFilters({ ...filters, domain_id: event.target.value })}>
            <option value="">All groups</option>
            {groups.map((group) => <option key={group.id} value={group.domain_id}>{group.name}</option>)}
          </select>
          <select className="field-input" value={filters.post_type} onChange={(event) => setFilters({ ...filters, post_type: event.target.value })}>
            <option value="">All post types</option>
            <option value="discussion">Discussions</option>
            <option value="announcement">Announcements</option>
            <option value="event">Events</option>
          </select>
          <div className="loader-panel">{groups.length} domain groups available</div>
        </div>
      </GlassPanel>
      <GlassPanel id="create" className="mt-6">
        <h2 className="panel-title">Create post</h2>
        <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={createPost}>
          <select className="field-input" value={form.group_id} onChange={(event) => setForm({ ...form, group_id: event.target.value })}>
            <option value="">Select group</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
          <select className="field-input" value={form.post_type} onChange={(event) => setForm({ ...form, post_type: event.target.value })}>
            <option value="discussion">Discussion</option>
            {canCreateAnnouncements && <option value="announcement">Announcement</option>}
            {canCreateAnnouncements && <option value="event">Event</option>}
          </select>
          <input className="field-input" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <input className="field-input" type="date" value={form.event_date} onChange={(event) => setForm({ ...form, event_date: event.target.value })} />
          <textarea className="field-input min-h-28 md:col-span-2" placeholder="Content" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required />
          <button className="btn-primary justify-center md:col-span-2" disabled={busy === "post"}><SendHorizonal size={17} />Post</button>
        </form>
      </GlassPanel>
      <div id="posts" className="mt-6 grid gap-4">
        {posts.length === 0 && <div className="loader-panel">No community posts yet.</div>}
        {posts.map((post) => (
          <GlassPanel key={post.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{post.post_type} | {post.domain_name || "General"}</p>
                <h2 className="panel-title">{post.title}</h2>
                <p className="card-copy mt-2">{post.content}</p>
                <p className="mt-3 text-sm text-slate-500">By {post.author_name} {post.event_date ? `| Event: ${post.event_date}` : ""}</p>
              </div>
              {post.post_type === "event" ? <CalendarDays className="text-mint" /> : <Megaphone className="text-mint" />}
            </div>
            <div className="mt-5 grid gap-3">
              {(comments[post.id] || []).map((comment) => (
                <div className="document-row" key={comment.id}><div><strong>{comment.author_name}</strong><span>{comment.content}</span></div></div>
              ))}
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input className="field-input" placeholder="Add comment" value={commentDrafts[post.id] || ""} onChange={(event) => setCommentDrafts({ ...commentDrafts, [post.id]: event.target.value })} />
                <button className="btn-secondary justify-center" disabled={busy === `comment-${post.id}`} onClick={() => addComment(post.id)}><MessageCircle size={17} />Comment</button>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </DashboardShell>
  );
}
