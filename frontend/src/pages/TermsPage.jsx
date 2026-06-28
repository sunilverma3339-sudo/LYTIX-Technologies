import React from "react";
import { FileCheck2, Scale } from "lucide-react";

import GlassPanel from "../components/GlassPanel.jsx";

const terms = [
  ["Internship enrollment", "Students must provide accurate profile, education, and contact details. Enrollment and access may depend on application status, selection, payment completion, and program capacity."],
  ["Payments", "Payments are represented by a Razorpay placeholder in this MVP. Real payments, refunds, taxes, and invoices should follow the official payment policy published by LYTIX TECHNOLOGIES."],
  ["Certificates and documents", "Offer letters, certificates, experience letters, and LORs are generated only when eligibility rules are met. LYTIX may revoke documents if fraud, misconduct, or incorrect information is discovered."],
  ["LinkedIn workflow", "Students are responsible for maintaining truthful LinkedIn updates, certificate additions, project posts, and professional profile information."],
  ["Project submission", "Projects must be original or properly attributed. Students must submit valid GitHub, documentation, presentation, and demo links where required."],
  ["Code of conduct", "Students, mentors, HR users, recruiters, and admins must behave respectfully in dashboards, community posts, teams, hackathons, and communications."],
  ["Platform changes", "LYTIX TECHNOLOGIES may update workflows, eligibility rules, features, pricing, and verification systems as the platform evolves."],
];

export default function TermsPage() {
  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow">Terms & Conditions</p>
          <h1 className="page-title">LYTIX TECHNOLOGIES terms of use.</h1>
          <p className="page-copy mt-4">
            These terms outline expected usage for internship enrollment, payments,
            documents, project submissions, LinkedIn workflow, and community conduct.
          </p>
          <div className="mt-8 grid gap-4">
            {terms.map(([title, copy]) => (
              <GlassPanel key={title}>
                <div className="flex items-start gap-3">
                  {title === "Code of conduct" ? <Scale className="mt-1 text-mint" /> : <FileCheck2 className="mt-1 text-mint" />}
                  <div>
                    <h2 className="panel-title">{title}</h2>
                    <p className="card-copy mt-2 max-w-none">{copy}</p>
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
