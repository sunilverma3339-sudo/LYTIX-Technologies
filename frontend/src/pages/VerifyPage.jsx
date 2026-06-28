import { BadgeCheck, Search, ShieldAlert } from "lucide-react";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";

import BrandLogo, { BRAND } from "../components/BrandLogo.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api, apiUrl } from "../lib/api";

export default function VerifyPage() {
  const { code } = useParams();
  const [input, setInput] = useState(code || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(code));
  const navigate = useNavigate();

  useEffect(() => {
    setInput(code || "");
    if (!code) {
      setResult(null);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    api(`/verify/${code}`, { token: null })
      .then((data) => {
        setResult(data);
        setError("");
      })
      .catch((err) => {
        setResult(null);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [code]);

  function submit(event) {
    event.preventDefault();
    if (input.trim()) {
      navigate(`/verify/${encodeURIComponent(input.trim())}`);
    }
  }

  const document = result?.certificate;
  const verified = document?.status === "Verified";

  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <BrandLogo size="page" className="mb-6" />
            <p className="eyebrow">Document verification</p>
            <h1 className="page-title">Validate a LYTIX credential.</h1>
            <p className="page-copy">
              {BRAND.tagline} Enter a verification code or scan the QR code printed on the issued PDF.
            </p>
            <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                className="field-input min-h-12 flex-1"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="LYTIX-SAMPLE-VERIFY"
              />
              <button className="btn-primary justify-center">
                <Search size={18} />
                Verify
              </button>
            </form>
          </div>

          <GlassPanel>
            {loading && <div className="loader-panel">Checking document...</div>}
            {!loading && error && (
              <div className="verify-state invalid">
                <ShieldAlert size={42} />
                <h2>Document not found</h2>
                <p>{error}</p>
              </div>
            )}
            {!loading && !error && !result && (
              <div className="verify-state">
                <Search size={42} />
                <h2>Verification ready</h2>
                <p>Use a generated document verification code.</p>
              </div>
            )}
            {!loading && document && (
              <div className="grid gap-6 md:grid-cols-[1fr_180px]">
                <div>
                  <div className={`flex items-center gap-3 ${verified ? "text-mint" : "text-rose"}`}>
                    {verified ? (
                      <motion.span
                        className="relative grid h-11 w-11 place-items-center rounded-full bg-cyan-50 text-mint"
                        initial={{ scale: 0.65, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 420, damping: 18 }}
                      >
                        <motion.span
                          className="absolute inset-0 rounded-full border border-cyan-300"
                          initial={{ scale: 0.7, opacity: 0.8 }}
                          animate={{ scale: 1.8, opacity: 0 }}
                          transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.9, ease: "easeOut" }}
                        />
                        <BadgeCheck size={28} />
                      </motion.span>
                    ) : (
                      <ShieldAlert size={28} />
                    )}
                    <span className="text-sm font-bold">
                      {verified ? "Verified document" : "Document not active"}
                    </span>
                  </div>
                  <h2 className="mt-5 text-3xl font-black">{document.student_name}</h2>
                  <div className="mt-5 grid gap-3 text-sm text-slate-600">
                    <Info label="Status" value={document.status || "Verified"} />
                    <Info label="Document Type" value={formatType(document.document_type)} />
                    <Info label="Certificate ID" value={document.certificate_id || document.document_number} />
                    <Info label="Domain" value={document.domain} />
                    <Info label="Internship ID" value={document.internship_id || "Not available"} />
                    <Info label="College" value={document.college || "Not provided"} />
                    <Info label="Issue Date" value={document.issue_date || document.issued_at} />
                    <Info label="Duration" value={`${document.start_date || "N/A"} to ${document.end_date || "N/A"}`} />
                    <Info label="Verification URL" value={document.verification_url || window.location.href} />
                  </div>
                </div>
                <div className="qr-card">
                  <img
                    src={apiUrl(`/certificates/${document.verification_code}/qr.svg`)}
                    alt="Document QR code preview"
                  />
                  <span className="mt-3 text-center text-xs font-bold text-ink">QR preview</span>
                </div>
              </div>
            )}
          </GlassPanel>
        </div>
      </section>
    </main>
  );
}

function formatType(type) {
  return (type || "certificate").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Info({ label, value }) {
  return (
    <div className="info-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
