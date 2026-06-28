import React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import BrandLogo, { BRAND } from "../components/BrandLogo.jsx";
import GlassPanel from "../components/GlassPanel.jsx";

export default function MarketingPlaceholderPage({
  eyebrow,
  title,
  copy,
  highlights = [],
  primaryCta = ["Explore Internships", "/internships"],
}) {
  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <BrandLogo size="page" className="mb-6" />
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-copy mt-4">{copy}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <GlassPanel key={item}>
                <CheckCircle2 className="text-[#2563EB]" size={24} />
                <h2 className="mt-4 text-lg font-black text-slate-950">{item}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {BRAND.name} will expand this section with live workflows, records, and updates as the platform grows.
                </p>
              </GlassPanel>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={primaryCta[1]} className="btn-primary">
              {primaryCta[0]}
              <ArrowRight size={17} />
            </Link>
            <Link to="/contact" className="btn-secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
