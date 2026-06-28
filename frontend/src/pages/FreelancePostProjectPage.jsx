import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Clock,
  Rocket,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";

const categories = [
  "Web Development",
  "Mobile App Development",
  "AI & Machine Learning",
  "Data Science",
  "UI/UX Design",
  "Cyber Security",
  "Cloud & DevOps",
  "IoT & Automation",
  "Digital Marketing",
  "Content Writing",
];

const experienceLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

const initialForm = {
  title: "",
  category: categories[0],
  description: "",
  budget: "",
  duration: "",
  skills: "",
  experience_level: experienceLevels[1],
  deadline: "",
  client_name: "",
  client_email: "",
  company_name: "",
};

export default function FreelancePostProjectPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const requiredComplete = useMemo(
    () =>
      form.title.trim() &&
      form.category &&
      form.description.trim() &&
      form.budget.trim() &&
      form.duration.trim() &&
      form.skills.trim() &&
      form.experience_level &&
      form.deadline &&
      form.client_name.trim() &&
      form.client_email.trim(),
    [form]
  );

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    if (!requiredComplete) return "Please complete all required fields.";
    if (form.title.trim().length < 3) return "Project title should be at least 3 characters.";
    if (form.description.trim().length < 20) return "Project description should be at least 20 characters.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.client_email.trim())) return "Enter a valid contact email.";
    return "";
  }

  async function submitProject(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);
    try {
      await api("/freelance/projects", {
        method: "POST",
        token: "",
        body: {
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          budget: form.budget.trim(),
          duration: form.duration.trim(),
          skills: form.skills.trim(),
          client_name: form.client_name.trim(),
          client_email: form.client_email.trim().toLowerCase(),
          company_name: form.company_name.trim(),
        },
      });
      setNotice("Project submitted for admin review.");
      navigate("/freelance/project-submitted");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="overflow-hidden bg-[#F8FAFC]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#EEF4FF] to-[#F8FAFC]">
        <div className="hero-grid" />
        <div className="pointer-events-none absolute inset-x-0 top-16 mx-auto h-72 max-w-4xl rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.88fr_1.12fr] lg:px-8 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10"
          >
            <p className="eyebrow">Post a project</p>
            <h1 className="mt-4 max-w-3xl text-[38px] font-black leading-[1.05] text-[#0F172A] sm:text-5xl lg:text-6xl">
              Find verified student freelancers through LYTIX.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#475569] sm:text-lg sm:leading-8">
              Submit a project brief for admin review. Once approved, your project appears in the Freelance Hub marketplace.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <WorkflowCard icon={Rocket} title="Post Project" copy="Share scope, budget, skills, and deadline." />
              <WorkflowCard icon={BadgeCheck} title="Admin Review" copy="LYTIX checks quality and client details." />
              <WorkflowCard icon={BriefcaseBusiness} title="Marketplace" copy="Approved projects become visible to freelancers." />
            </div>
          </motion.div>

          <GlassPanel className="relative z-10">
            <div className="flex flex-col gap-3 border-b border-[#E2E8F0] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#0F172A]">Project brief</h2>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">Fields marked with * are required.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                <Clock size={14} />
                Pending Approval
              </span>
            </div>

            {error && <div className="error-panel mt-5">{error}</div>}
            {notice && <div className="success-panel mt-5">{notice}</div>}

            <form className="mt-6 grid gap-5" onSubmit={submitProject}>
              <label className="field-label">
                Project Title *
                <input
                  className="field-input"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Example: Build a SaaS landing page"
                  required
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="field-label">
                  Project Category *
                  <select
                    className="field-input"
                    value={form.category}
                    onChange={(event) => updateField("category", event.target.value)}
                    required
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Experience Level *
                  <select
                    className="field-input"
                    value={form.experience_level}
                    onChange={(event) => updateField("experience_level", event.target.value)}
                    required
                  >
                    {experienceLevels.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field-label">
                Project Description *
                <textarea
                  className="field-input min-h-36"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Describe the problem, deliverables, expected output, references, and review process."
                  required
                />
              </label>

              <div className="grid gap-5 md:grid-cols-3">
                <label className="field-label">
                  Budget *
                  <input
                    className="field-input"
                    value={form.budget}
                    onChange={(event) => updateField("budget", event.target.value)}
                    placeholder="Rs 15,000"
                    required
                  />
                </label>
                <label className="field-label">
                  Duration *
                  <input
                    className="field-input"
                    value={form.duration}
                    onChange={(event) => updateField("duration", event.target.value)}
                    placeholder="2 weeks"
                    required
                  />
                </label>
                <label className="field-label">
                  Deadline *
                  <input
                    className="field-input"
                    type="date"
                    value={form.deadline}
                    onChange={(event) => updateField("deadline", event.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="field-label">
                Required Skills *
                <input
                  className="field-input"
                  value={form.skills}
                  onChange={(event) => updateField("skills", event.target.value)}
                  placeholder="React, Tailwind CSS, API integration"
                  required
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="field-label">
                  Contact Name *
                  <input
                    className="field-input"
                    value={form.client_name}
                    onChange={(event) => updateField("client_name", event.target.value)}
                    placeholder="Client or hiring manager name"
                    required
                  />
                </label>
                <label className="field-label">
                  Contact Email *
                  <input
                    className="field-input"
                    type="email"
                    value={form.client_email}
                    onChange={(event) => updateField("client_email", event.target.value)}
                    placeholder="client@example.com"
                    required
                  />
                </label>
              </div>

              <label className="field-label">
                Company Name (Optional)
                <input
                  className="field-input"
                  value={form.company_name}
                  onChange={(event) => updateField("company_name", event.target.value)}
                  placeholder="Company or startup name"
                />
              </label>

              <div className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/freelance" className="btn-secondary">
                  Back to Freelance Hub
                </Link>
                <button className="btn-primary" type="submit" disabled={loading || !requiredComplete}>
                  {loading ? "Submitting..." : "Submit for Review"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      </section>
    </main>
  );
}

function WorkflowCard({ icon: Icon, title, copy }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white/80 p-4 shadow-sm">
      <Icon className="text-[#2563EB]" size={22} />
      <h3 className="mt-3 text-sm font-black text-[#0F172A]">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-[#64748B]">{copy}</p>
    </div>
  );
}
