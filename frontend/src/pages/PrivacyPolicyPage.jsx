import React from "react";
import { Lock, ShieldCheck } from "lucide-react";

import GlassPanel from "../components/GlassPanel.jsx";

const sections = [
  ["Data collection", "We may collect student profile details, contact information, education details, internship applications, domain preferences, task progress, payment status placeholders, documents, resume links, LinkedIn profile URLs, project links, and platform activity."],
  ["Data usage", "Information is used to manage applications, learning, attendance, assignments, quizzes, documents, certificates, placement support, job alerts, hackathons, and talent directory features."],
  ["Security", "The MVP uses JWT authentication and role-based access. Production deployments should add stronger secrets, audit logs, encryption policies, backups, and formal access reviews."],
  ["Certificates and verification", "Certificate and document verification pages may expose limited public information required to validate authenticity, such as student name, internship domain, certificate ID, issue date, and status."],
  ["Payments", "Razorpay is currently a placeholder integration. Real payment processing should be handled by a certified payment provider and governed by its privacy and security policies."],
  ["Cookies and local storage", "The frontend may store an authentication token in browser local storage to keep users logged in. Users can clear browser storage or log out to remove the token."],
  ["Contact", "For privacy questions, contact hello@lytix.tech. This placeholder contact may be replaced with the official privacy officer email."],
];

export default function PrivacyPolicyPage() {
  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow">Privacy Policy</p>
          <h1 className="page-title">LYTIX TECHNOLOGIES privacy policy.</h1>
          <p className="page-copy mt-4">
            This policy explains how LYTIX TECHNOLOGIES may collect, use, and protect
            information across internship, certificate, placement, and community features.
          </p>
          <div className="mt-8 grid gap-4">
            {sections.map(([title, copy]) => (
              <GlassPanel key={title}>
                <div className="flex items-start gap-3">
                  {title === "Security" ? <Lock className="mt-1 text-mint" /> : <ShieldCheck className="mt-1 text-mint" />}
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
