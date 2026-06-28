import React from "react";
import { HelpCircle } from "lucide-react";

import BrandLogo, { BRAND } from "../components/BrandLogo.jsx";
import GlassPanel from "../components/GlassPanel.jsx";

const faqs = [
  ["How do I apply for an internship?", "Open Programs > Internships, choose a domain, and submit the application form after login."],
  ["How do certificate verification links work?", "Each issued document includes a verification ID and QR code that can be checked on the Verify Certificate page."],
  ["Can clients post freelance projects?", "Yes. Use Freelance Hub > Post a Project. Projects become public after admin approval."],
  ["Is placement support included?", "The platform includes resume tools, ATS placeholders, job alerts, and placement status tracking."],
];

export default function FaqPage() {
  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <BrandLogo size="page" className="mb-6" />
          <p className="eyebrow">Resources</p>
          <h1 className="page-title">Frequently asked questions.</h1>
          <p className="page-copy mt-4">{BRAND.tagline} Quick answers for students, clients, and recruiters using the LYTIX platform.</p>
          <div className="mt-8 grid gap-4">
            {faqs.map(([question, answer]) => (
              <GlassPanel key={question}>
                <div className="flex gap-4">
                  <HelpCircle className="mt-1 shrink-0 text-[#2563EB]" size={22} />
                  <div>
                    <h2 className="text-lg font-black text-slate-950">{question}</h2>
                    <p className="mt-2 leading-7 text-slate-600">{answer}</p>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
