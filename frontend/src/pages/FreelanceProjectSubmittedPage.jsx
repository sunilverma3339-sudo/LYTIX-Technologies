import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function FreelanceProjectSubmittedPage() {
  return (
    <main className="overflow-hidden bg-[#F8FAFC]">
      <section className="relative grid min-h-[72vh] place-items-center overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#EEF4FF] to-[#F8FAFC] px-4 py-16 sm:px-6 lg:px-8">
        <div className="hero-grid" />
        <div className="pointer-events-none absolute inset-x-0 top-20 mx-auto h-72 max-w-4xl rounded-full bg-cyan-400/10 blur-3xl" />
        <motion.div
          className="relative z-10 mx-auto max-w-3xl rounded-2xl border border-[#E2E8F0] bg-white/90 p-8 text-center shadow-[0_24px_70px_rgba(37,99,235,0.14)] backdrop-blur-xl sm:p-12"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={36} />
          </div>
          <p className="eyebrow mt-6">LYTIX Freelance Hub</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-[#0F172A] sm:text-5xl">
            Project Submitted Successfully
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#475569] sm:text-lg">
            Your project has been submitted for review. After approval it will become visible to freelancers.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left">
              <Clock className="text-[#2563EB]" size={22} />
              <h2 className="mt-3 text-sm font-black text-[#0F172A]">Status</h2>
              <p className="mt-1 text-sm text-[#64748B]">Pending Approval</p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left">
              <ShieldCheck className="text-[#2563EB]" size={22} />
              <h2 className="mt-3 text-sm font-black text-[#0F172A]">Next Step</h2>
              <p className="mt-1 text-sm text-[#64748B]">Admin verifies project quality and client details.</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/freelance" className="btn-primary">
              Browse Marketplace
              <ArrowRight size={17} />
            </Link>
            <Link to="/freelance/post-project" className="btn-secondary">
              Post Another Project
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
