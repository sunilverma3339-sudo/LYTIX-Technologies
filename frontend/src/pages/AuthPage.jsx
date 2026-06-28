import {
  BadgeCheck,
  Clock3,
  LogIn,
  MailCheck,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  UserPlus,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import BrandLogo, { BRAND } from "../components/BrandLogo.jsx";
import GlassPanel from "../components/GlassPanel.jsx";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

const emptyRegister = {
  name: "",
  email: "",
  phone: "",
  college: "",
  graduation_year: "",
  password: "",
};

const OTP_SECONDS = 10 * 60;

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [verification, setVerification] = useState(null);
  const [otpForms, setOtpForms] = useState({ email: "", mobile: "" });
  const [countdowns, setCountdowns] = useState({ email: OTP_SECONDS, mobile: OTP_SECONDS });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [otpBusy, setOtpBusy] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const target = location.state?.from?.pathname || "/student/dashboard";

  useEffect(() => {
    if (!verification || mode !== "register") return undefined;
    const timer = window.setInterval(() => {
      setCountdowns((current) => ({
        email: Math.max(0, current.email - 1),
        mobile: Math.max(0, current.mobile - 1),
      }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [verification, mode]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "login") {
        const user = await login(loginForm);
        navigate(target === "/dashboard" || target === "/student/dashboard" ? homeForRole(user.role) : target, { replace: true });
        return;
      }
      const data = await register(registerForm);
      setVerification(data);
      setOtpForms({ email: "", mobile: "" });
      setCountdowns({ email: OTP_SECONDS, mobile: OTP_SECONDS });
      setLoginForm({ email: data.email, password: "" });
      setNotice(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(channel) {
    setOtpBusy(`verify-${channel}`);
    setError("");
    setNotice("");
    try {
      const data = await api(`/auth/verify-${channel}-otp`, {
        method: "POST",
        token: null,
        body: { email: verification.email, otp: otpForms[channel] },
      });
      setVerification(data);
      setOtpForms((current) => ({ ...current, [channel]: "" }));
      setNotice(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpBusy("");
    }
  }

  async function resendOtp(channel) {
    setOtpBusy(`resend-${channel}`);
    setError("");
    setNotice("");
    try {
      const data = await api(`/auth/resend-${channel}-otp`, {
        method: "POST",
        token: null,
        body: { email: verification.email },
      });
      setVerification(data);
      setOtpForms((current) => ({ ...current, [channel]: "" }));
      setCountdowns((current) => ({ ...current, [channel]: OTP_SECONDS }));
      setNotice(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpBusy("");
    }
  }

  const allVerified = Boolean(verification?.is_email_verified && verification?.is_mobile_verified);

  return (
    <main className="page-shell">
      <section className="section-band">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <BrandLogo size="page" className="mb-6" />
            <p className="eyebrow">Secure access</p>
            <h1 className="page-title">Role-based platform login.</h1>
            <p className="page-copy">
              {BRAND.tagline} JWT auth protects dashboards, applications, offer letters,
              certificates, and admin controls across LYTIX TECHNOLOGIES.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-slate-600">
              <div className="sample-credential">Student: student@lytix.tech / Student@123</div>
              <div className="sample-credential">Admin: admin@lytix.tech / password123</div>
              <div className="sample-credential">HR: hr@lytix.tech / password123</div>
              <div className="sample-credential">Recruiter: recruiter@lytix.tech / password123</div>
              <div className="sample-credential">Mentor: mentor@lytix.tech / password123</div>
              <div className="sample-credential">Super Admin: superadmin@lytix.tech / password123</div>
            </div>
          </div>

          <GlassPanel>
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <BrandLogo size="nav" />
              <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 sm:inline-flex">
                {mode === "login" ? "Login" : verification ? "Verify OTP" : "Register"}
              </span>
            </div>
            <div className="segmented">
              <button
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                  setNotice("");
                }}
                type="button"
              >
                <LogIn size={17} />
                Login
              </button>
              <button
                className={mode === "register" ? "active" : ""}
                onClick={() => {
                  setMode("register");
                  setError("");
                  setNotice("");
                }}
                type="button"
              >
                <UserPlus size={17} />
                Register
              </button>
            </div>

            {mode === "register" && verification ? (
              <VerificationPanel
                verification={verification}
                otpForms={otpForms}
                setOtpForms={setOtpForms}
                countdowns={countdowns}
                verifyOtp={verifyOtp}
                resendOtp={resendOtp}
                otpBusy={otpBusy}
                error={error}
                notice={notice}
                allVerified={allVerified}
                onLogin={() => {
                  setMode("login");
                  setError("");
                  setNotice("Email and mobile verified. You can login now.");
                }}
                onEdit={() => {
                  setVerification(null);
                  setError("");
                  setNotice("");
                }}
              />
            ) : (
              <form onSubmit={submit} className="mt-6 grid gap-4">
                {mode === "register" && (
                  <>
                    <label className="field-label">
                      Name
                      <input
                        className="field-input"
                        value={registerForm.name}
                        onChange={(event) =>
                          setRegisterForm({ ...registerForm, name: event.target.value })
                        }
                        required
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="field-label">
                        Mobile number
                        <input
                          className="field-input"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={registerForm.phone}
                          onChange={(event) =>
                            setRegisterForm({ ...registerForm, phone: event.target.value })
                          }
                          required
                        />
                      </label>
                      <label className="field-label">
                        Graduation year
                        <input
                          className="field-input"
                          value={registerForm.graduation_year}
                          onChange={(event) =>
                            setRegisterForm({
                              ...registerForm,
                              graduation_year: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                    <label className="field-label">
                      College
                      <input
                        className="field-input"
                        value={registerForm.college}
                        onChange={(event) =>
                          setRegisterForm({ ...registerForm, college: event.target.value })
                        }
                      />
                    </label>
                  </>
                )}

                <label className="field-label">
                  Email
                  <input
                    className="field-input"
                    type="email"
                    value={mode === "login" ? loginForm.email : registerForm.email}
                    onChange={(event) =>
                      mode === "login"
                        ? setLoginForm({ ...loginForm, email: event.target.value })
                        : setRegisterForm({ ...registerForm, email: event.target.value })
                    }
                    required
                  />
                </label>
                <label className="field-label">
                  Password
                  <input
                    className="field-input"
                    type="password"
                    value={mode === "login" ? loginForm.password : registerForm.password}
                    onChange={(event) =>
                      mode === "login"
                        ? setLoginForm({ ...loginForm, password: event.target.value })
                        : setRegisterForm({ ...registerForm, password: event.target.value })
                    }
                    required
                    minLength={8}
                  />
                </label>
                {notice && <div className="success-panel">{notice}</div>}
                {error && <div className="error-panel">{error}</div>}
                <button className="btn-primary justify-center" disabled={busy}>
                  {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {busy ? "Processing..." : mode === "login" ? "Login" : "Create account"}
                </button>
              </form>
            )}
          </GlassPanel>
        </div>
      </section>
    </main>
  );
}

function VerificationPanel({
  verification,
  otpForms,
  setOtpForms,
  countdowns,
  verifyOtp,
  resendOtp,
  otpBusy,
  error,
  notice,
  allVerified,
  onLogin,
  onEdit,
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-blue-400/20 bg-slate-950 p-5 text-white shadow-[0_28px_80px_rgba(15,23,42,0.35)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Account verification</p>
          <h2 className="mt-2 text-2xl font-black text-white">Verify email and mobile OTP.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            OTPs expire in 10 minutes. Check the backend terminal in local development for console OTP output.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-slate-200">
          {verification.email}
          <span className="mt-1 block text-xs text-cyan-100">{verification.mobile}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <OtpCard
          title="Email OTP Verification"
          icon={MailCheck}
          verified={verification.is_email_verified}
          value={otpForms.email}
          countdown={countdowns.email}
          busy={otpBusy}
          busyKey="email"
          onChange={(value) => setOtpForms((current) => ({ ...current, email: digitsOnly(value) }))}
          onVerify={() => verifyOtp("email")}
          onResend={() => resendOtp("email")}
        />
        <OtpCard
          title="Mobile OTP Verification"
          icon={Smartphone}
          verified={verification.is_mobile_verified}
          value={otpForms.mobile}
          countdown={countdowns.mobile}
          busy={otpBusy}
          busyKey="mobile"
          onChange={(value) => setOtpForms((current) => ({ ...current, mobile: digitsOnly(value) }))}
          onVerify={() => verifyOtp("mobile")}
          onResend={() => resendOtp("mobile")}
        />
      </div>

      {notice && <div className="mt-5 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-100">{notice}</div>}
      {error && <div className="mt-5 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">{error}</div>}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button className="btn-secondary justify-center" type="button" onClick={onEdit}>
          Edit registration details
        </button>
        <button className="btn-primary justify-center" type="button" onClick={onLogin} disabled={!allVerified}>
          <ShieldCheck size={18} />
          {allVerified ? "Go to Login" : "Verify both OTPs to login"}
        </button>
      </div>
    </div>
  );
}

function OtpCard({ title, icon: Icon, verified, value, countdown, busy, busyKey, onChange, onVerify, onResend }) {
  const verifyBusy = busy === `verify-${busyKey}`;
  const resendBusy = busy === `resend-${busyKey}`;
  return (
    <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.075] p-4 backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-cyan-500/20">
            <Icon size={20} />
          </span>
          <div>
            <h3 className="text-lg font-black text-white">{title}</h3>
            <p className="mt-1 text-xs font-bold text-slate-400">Maximum 5 attempts allowed.</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${verified ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100" : "border-amber-300/30 bg-amber-400/10 text-amber-100"}`}>
          {verified ? <BadgeCheck size={14} /> : <Clock3 size={14} />}
          {verified ? "Verified" : "Pending"}
        </span>
      </div>

      <input
        className="mt-5 w-full rounded-2xl border border-blue-400/30 bg-slate-950/80 px-4 py-4 text-center text-2xl font-black tracking-[0.45em] text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/15"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={verified}
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button className="btn-primary justify-center sm:flex-1" type="button" disabled={verified || verifyBusy || value.length !== 6} onClick={onVerify}>
          <ShieldCheck size={17} />
          {verifyBusy ? "Verifying..." : "Verify"}
        </button>
        <button className="btn-secondary justify-center sm:flex-1" type="button" disabled={verified || resendBusy || countdown > 0} onClick={onResend}>
          <RefreshCcw size={17} />
          {resendBusy ? "Resending..." : countdown > 0 ? `Resend in ${formatCountdown(countdown)}` : "Resend OTP"}
        </button>
      </div>
    </section>
  );
}

function digitsOnly(value) {
  return value.replace(/\D/g, "").slice(0, 6);
}

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function homeForRole(role) {
  const map = {
    admin: "/admin/dashboard",
    super_admin: "/super-admin/dashboard",
    hr: "/hr/dashboard",
    recruiter: "/recruiter/dashboard",
    mentor: "/mentor/dashboard",
    student: "/student/dashboard",
  };
  return map[role] || "/student/dashboard";
}
