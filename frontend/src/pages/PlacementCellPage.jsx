import React from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BellRing,
  BriefcaseBusiness,
  FileCheck2,
  MessageSquareText,
  Target,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";

import GlassPanel from "../components/GlassPanel.jsx";

const placementModules = [
  ["Resume Review", "Upload and improve resumes with structured feedback and recruiter-ready formatting.", FileCheck2],
  ["ATS Score", "Track resume readiness with scoring signals, missing skills, and improvement suggestions.", BarChart3],
  ["Mock Interview", "Request HR or technical interview practice before recruiter conversations.", MessageSquareText],
  ["Job Alerts", "View domain-specific openings, deadlines, skill requirements, and application links.", BellRing],
  ["Placement Tracking", "Follow status from resume reviewed to shortlisted, interviewed, and placed.", Target],
];

const pipeline = ["Not Started", "Resume Reviewed", "Mock Interview Done", "Shortlisted", "Placed"];

export default function PlacementCellPage() {
  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="eyebrow">Placement Cell</p>
              <h1 className="page-title">Career readiness tools for internship-to-placement growth.</h1>
              <p className="page-copy mt-4">
                LYTIX Placement Cell brings resume review, ATS readiness, mock interview requests,
                job alerts, placement status tracking, and recruiter visibility into one workflow.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/resume" className="btn-primary">
                  Upload Resume
                  <UploadCloud size={17} />
                </Link>
                <Link to="/jobs" className="btn-secondary">
                  View Job Alerts
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
            <GlassPanel className="relative overflow-hidden bg-slate-950 text-white">
              <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
              <BriefcaseBusiness className="relative text-cyan-200" size={34} />
              <h2 className="relative mt-5 text-3xl font-black">Placement readiness score</h2>
              <div className="relative mt-6 grid gap-4">
                {[
                  ["Resume", "82%", "w-[82%]"],
                  ["Interview", "68%", "w-[68%]"],
                  ["Portfolio", "76%", "w-[76%]"],
                ].map(([label, value, width]) => (
                  <div key={label}>
                    <div className="mb-2 flex justify-between text-sm font-bold text-slate-300">
                      <span>{label}</span>
                      <strong className="text-white">{value}</strong>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <span className={`block h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 ${width}`} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {placementModules.map(([title, copy, Icon]) => (
              <GlassPanel key={title} className="transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-glass">
                <Icon className="text-[#2563EB]" size={28} />
                <h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
              </GlassPanel>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <GlassPanel>
              <h2 className="panel-title">Placement tracking pipeline</h2>
              <div className="mt-6 grid gap-3">
                {pipeline.map((stage, index) => (
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={stage}>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black ${
                      index <= 2 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-black text-slate-950">{stage}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {index <= 2 ? "Active readiness milestone" : "Next career milestone"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
            <GlassPanel>
              <h2 className="panel-title">What students get</h2>
              <div className="mt-6 grid gap-3">
                {["Resume feedback", "ATS score review", "Mock interview request", "Domain job alerts", "Talent directory visibility"].map((item) => (
                  <div className="module-row" key={item}>
                    <BadgeCheck size={18} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/placement" className="btn-secondary mt-6 w-full justify-center">
                Open Student Placement Dashboard
              </Link>
            </GlassPanel>
          </div>
        </div>
      </section>
    </main>
  );
}
