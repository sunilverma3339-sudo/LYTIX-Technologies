import React from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  FileText,
  HelpCircle,
  Newspaper,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import GlassPanel from "../components/GlassPanel.jsx";

const resources = [
  ["Verify Certificate", "Check QR-backed certificates, experience letters, and issued documents.", "/verify", ShieldCheck],
  ["FAQs", "Find answers about internships, payments, certificates, projects, and placement workflows.", "/faqs", HelpCircle],
  ["Privacy Policy", "Understand how LYTIX handles student, placement, document, and platform data.", "/privacy", FileText],
  ["Terms & Conditions", "Review internship enrollment, payments, projects, code of conduct, and credentials.", "/terms", BadgeCheck],
];

const blogCards = [
  ["How to build a portfolio during internship", "A practical guide to GitHub, documentation, demo videos, and LinkedIn proof."],
  ["What recruiters look for in freshers", "Skills, projects, communication, verified credentials, and consistency signals."],
  ["AI career tools for students", "How domain recommendations, resume analysis, and interview simulators improve readiness."],
];

export default function ResourcesPage() {
  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="eyebrow">Resources</p>
              <h1 className="page-title">Support, verification, and career knowledge in one place.</h1>
              <p className="page-copy mt-4">
                Use LYTIX resources to verify credentials, read platform policies, browse FAQs,
                and explore career guidance for internships, projects, freelancing, and placement.
              </p>
            </div>
            <GlassPanel className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <BookOpenText className="text-cyan-100" size={32} />
              <h2 className="mt-5 text-3xl font-black">Credential-first career resources</h2>
              <p className="mt-3 leading-7 text-blue-50">
                Verification, policies, career explainers, and support content are designed to make
                student proof easier to trust and share.
              </p>
              <Link to="/verify" className="mt-6 inline-flex rounded-md bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50">
                Verify Certificate
              </Link>
            </GlassPanel>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {resources.map(([title, copy, to, Icon]) => (
              <GlassPanel key={title} className="transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-glass">
                <Icon className="text-[#2563EB]" size={28} />
                <h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
                <Link to={to} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#2563EB]">
                  Open
                  <ArrowRight size={16} />
                </Link>
              </GlassPanel>
            ))}
          </div>

          <div className="mt-12">
            <p className="eyebrow">Blog cards</p>
            <h2 className="section-title">Latest learning and career guidance.</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {blogCards.map(([title, copy]) => (
                <GlassPanel key={title} className="transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-glass">
                  <Newspaper className="text-[#2563EB]" size={28} />
                  <h3 className="mt-5 text-xl font-black text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
                  <Link to="/blog" className="btn-secondary mt-6 w-full justify-center">Read More</Link>
                </GlassPanel>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
