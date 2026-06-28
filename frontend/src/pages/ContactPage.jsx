import React, { useState } from "react";
import {
  ArrowRight,
  Building2,
  HelpCircle,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  SendHorizonal,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import BrandLogo, { BRAND } from "../components/BrandLogo.jsx";
import GlassPanel from "../components/GlassPanel.jsx";

const contactCards = [
  ["Email", "hello@lytix.tech", Mail],
  ["Phone", "+91 90000 00000", Phone],
  ["Office", "LYTIX TECHNOLOGIES, Bengaluru, India", MapPin],
  ["Social", "LinkedIn | GitHub | Instagram placeholders", Linkedin],
];

const quickFaqs = [
  ["How do I apply for internships?", "/internships"],
  ["How do I verify a certificate?", "/verify"],
  ["How do I request a service?", "/solutions"],
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", interest: "Internships", message: "" });
  const [notice, setNotice] = useState("");

  function submit(event) {
    event.preventDefault();
    setNotice("Thanks. Your contact request has been captured as a frontend placeholder.");
    setForm({ name: "", email: "", subject: "", interest: "Internships", message: "" });
  }

  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <BrandLogo size="page" className="mb-6" />
              <p className="eyebrow">Contact Us</p>
              <h1 className="page-title">Talk to LYTIX TECHNOLOGIES.</h1>
              <p className="page-copy mt-4">
                {BRAND.tagline} Reach out for internship enrollment, training batches,
                technical services, certificate verification, placement partnerships, freelance projects,
                or recruiter access.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {contactCards.map(([label, value, Icon]) => (
                  <Info icon={Icon} label={label} value={value} key={label} />
                ))}
              </div>
            </div>

            <GlassPanel className="bg-white/90">
              <div className="flex items-start gap-4">
                <div className="premium-icon">
                  <SendHorizonal size={23} />
                </div>
                <div>
                  <h2 className="panel-title">Send a message</h2>
                  <p className="card-copy mt-2">This MVP form stores the interaction as a frontend placeholder.</p>
                </div>
              </div>
              <form className="mt-6 grid gap-4" onSubmit={submit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <input className="field-input" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                  <input className="field-input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input className="field-input" placeholder="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required />
                  <select className="field-input" value={form.interest} onChange={(event) => setForm({ ...form, interest: event.target.value })}>
                    <option>Internships</option>
                    <option>Technology Services</option>
                    <option>Placement Partnership</option>
                    <option>Freelance Projects</option>
                    <option>Certificate Verification</option>
                  </select>
                </div>
                <textarea className="field-input min-h-40" placeholder="Message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required />
                {notice && <div className="success-panel">{notice}</div>}
                <button className="btn-primary justify-center" type="submit">
                  <SendHorizonal size={17} />
                  Send Message
                </button>
              </form>
            </GlassPanel>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <GlassPanel>
              <Building2 className="text-[#2563EB]" size={28} />
              <h2 className="panel-title mt-4">Office location placeholder</h2>
              <div className="mt-5 grid min-h-64 place-items-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 text-center">
                <div>
                  <MapPin className="mx-auto text-[#2563EB]" size={34} />
                  <p className="mt-3 text-lg font-black text-slate-950">LYTIX TECHNOLOGIES</p>
                  <p className="mt-1 text-sm font-bold text-slate-600">Bengaluru, India</p>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel>
              <HelpCircle className="text-[#2563EB]" size={28} />
              <h2 className="panel-title mt-4">FAQ quick links</h2>
              <div className="mt-5 grid gap-3">
                {quickFaqs.map(([label, to]) => (
                  <Link className="module-row justify-between transition hover:border-blue-200 hover:bg-blue-50" to={to} key={label}>
                    <span className="font-bold">{label}</span>
                    <ArrowRight size={17} />
                  </Link>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                <Sparkles className="text-cyan-700" size={22} />
                <p className="mt-3 text-sm font-bold leading-6 text-cyan-800">
                  Response-time placeholder: the team typically replies within 24-48 business hours.
                </p>
              </div>
            </GlassPanel>
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="info-line transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50">
      <Icon className="text-[#2563EB]" size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
