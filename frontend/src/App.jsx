import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Footer from "./components/Footer.jsx";
import FloatingAIAssistant from "./components/FloatingAIAssistant.jsx";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminAIInsightsPage from "./pages/AdminAIInsightsPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminDocumentsPage from "./pages/AdminDocumentsPage.jsx";
import AdminFreelanceProjectsPage from "./pages/AdminFreelanceProjectsPage.jsx";
import AdminJobAlertsPage from "./pages/AdminJobAlertsPage.jsx";
import AdminLmsPage from "./pages/AdminLmsPage.jsx";
import AdminPlacementPage from "./pages/AdminPlacementPage.jsx";
import AdminProjectReviewsPage from "./pages/AdminProjectReviewsPage.jsx";
import AdminProjectsPage from "./pages/AdminProjectsPage.jsx";
import AdminResumeReviewPage from "./pages/AdminResumeReviewPage.jsx";
import ApplicationPage from "./pages/ApplicationPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import DomainsPage from "./pages/DomainsPage.jsx";
import EmailLogsPage from "./pages/EmailLogsPage.jsx";
import FaqPage from "./pages/FaqPage.jsx";
import FreelanceHubPage from "./pages/FreelanceHubPage.jsx";
import FreelancePostProjectPage from "./pages/FreelancePostProjectPage.jsx";
import FreelanceProjectSubmittedPage from "./pages/FreelanceProjectSubmittedPage.jsx";
import HackathonsPage from "./pages/HackathonsPage.jsx";
import HRDashboard from "./pages/HRDashboard.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import MarketingPlaceholderPage from "./pages/MarketingPlaceholderPage.jsx";
import MentorDashboard from "./pages/MentorDashboard.jsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.jsx";
import PlacementCellPage from "./pages/PlacementCellPage.jsx";
import RecruiterDashboard from "./pages/RecruiterDashboard.jsx";
import ResourcesPage from "./pages/ResourcesPage.jsx";
import ServicesPage from "./pages/ServicesPage.jsx";
import SolutionsPage from "./pages/SolutionsPage.jsx";
import StudentAIToolsPage from "./pages/StudentAIToolsPage.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import StudentDocumentsPage from "./pages/StudentDocumentsPage.jsx";
import StudentJobAlertsPage from "./pages/StudentJobAlertsPage.jsx";
import StudentLinkedInPage from "./pages/StudentLinkedInPage.jsx";
import StudentLmsPage from "./pages/StudentLmsPage.jsx";
import StudentPlacementPage from "./pages/StudentPlacementPage.jsx";
import StudentProjectPage from "./pages/StudentProjectPage.jsx";
import StudentResumeToolsPage from "./pages/StudentResumeToolsPage.jsx";
import SuccessStoriesPage from "./pages/SuccessStoriesPage.jsx";
import SupportCenterPage from "./pages/SupportCenterPage.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import TalentDirectoryPage from "./pages/TalentDirectoryPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import TeamsPage from "./pages/TeamsPage.jsx";
import VerifyPage from "./pages/VerifyPage.jsx";

const dashboardShellPaths = [
  "/student",
  "/dashboard",
  "/learning",
  "/project",
  "/documents",
  "/linkedin",
  "/placement",
  "/resume",
  "/jobs",
  "/ai-tools",
  "/community",
  "/admin",
  "/hr",
  "/mentor",
  "/recruiter",
  "/teams",
  "/super-admin",
  "/support",
];

function NotFound() {
  return (
    <main className="page-shell min-h-[70vh]">
      <section className="section-band">
        <p className="eyebrow">404</p>
        <h1 className="page-title">Page not found</h1>
        <p className="page-copy">The LYTIX workspace route you requested is not available.</p>
      </section>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  const dashboardShell = dashboardShellPaths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

  return (
    <div className={`${dashboardShell ? "h-screen overflow-hidden bg-[#07111F] text-white" : "min-h-screen bg-[#F8FAFC] text-slate-950"}`}>
      {!dashboardShell && <Navbar />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className={dashboardShell ? "h-full overflow-hidden" : ""}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/programs" element={<DomainsPage />} />
        <Route path="/domains" element={<DomainsPage />} />
        <Route path="/internships" element={<DomainsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/freelance" element={<FreelanceHubPage />} />
        <Route path="/freelance/post-project" element={<FreelancePostProjectPage />} />
        <Route path="/freelance/project-submitted" element={<FreelanceProjectSubmittedPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/hackathons" element={<HackathonsPage />} />
        <Route path="/talent" element={<TalentDirectoryPage />} />
        <Route path="/freelancers" element={<TalentDirectoryPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/success-stories" element={<SuccessStoriesPage />} />
        <Route path="/faqs" element={<FaqPage />} />
        <Route
          path="/training-programs"
          element={
            <MarketingPlaceholderPage
              eyebrow="Programs"
              title="Training programs for future-ready technical skills."
              copy="Structured training tracks for students and professionals across AI, web, cloud, mobile, security, automation, and career readiness."
              highlights={["Domain-focused cohorts", "Hands-on assignments", "Mentor-guided learning"]}
              primaryCta={["View Internships", "/internships"]}
            />
          }
        />
        <Route
          path="/certifications"
          element={
            <MarketingPlaceholderPage
              eyebrow="Programs"
              title="Verified certifications backed by real project work."
              copy="LYTIX certifications connect learning progress, project submissions, QR verification, and public credential validation."
              highlights={["QR verification", "Document eligibility", "Public credential proof"]}
              primaryCta={["Verify Certificate", "/verify"]}
            />
          }
        />
        <Route
          path="/placement-cell"
          element={<PlacementCellPage />}
        />
        <Route
          path="/blog"
          element={
            <MarketingPlaceholderPage
              eyebrow="Resources"
              title="LYTIX insights and career resources."
              copy="A publishing space for internship guidance, technology explainers, project ideas, placement preparation, and company updates."
              highlights={["Career guides", "Project ideas", "Technology insights"]}
              primaryCta={["Read FAQs", "/faqs"]}
            />
          }
        />
        <Route
          path="/leadership"
          element={
            <MarketingPlaceholderPage
              eyebrow="Company"
              title="Leadership Team."
              copy="LYTIX TECHNOLOGIES is led by Sunil Kumar, Founder & CEO, with a growing network of mentors, operators, and technology collaborators."
              highlights={["Founder-led vision", "Mentor network", "Career-first operations"]}
              primaryCta={["About LYTIX", "/about"]}
            />
          }
        />
        <Route
          path="/careers"
          element={
            <MarketingPlaceholderPage
              eyebrow="Company"
              title="Careers at LYTIX TECHNOLOGIES."
              copy="Join the mission to help students learn, build, earn, and grow through technology, training, internships, freelancing, and career platforms."
              highlights={["Mentor roles", "Technology roles", "Operations roles"]}
              primaryCta={["Contact Us", "/contact"]}
            />
          }
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/apply"
          element={
            <ProtectedRoute>
              <ApplicationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning"
          element={
            <ProtectedRoute>
              <StudentLmsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project"
          element={
            <ProtectedRoute>
              <StudentProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <StudentDocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/linkedin"
          element={
            <ProtectedRoute>
              <StudentLinkedInPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/placement"
          element={
            <ProtectedRoute>
              <StudentPlacementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <StudentResumeToolsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <StudentJobAlertsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-tools"
          element={
            <ProtectedRoute>
              <StudentAIToolsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute role={["student", "mentor", "hr", "recruiter", "admin", "super_admin"]}>
              <SupportCenterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role={["admin", "super_admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/lms"
          element={
            <ProtectedRoute role={["admin", "super_admin"]}>
              <AdminLmsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute role={["admin", "super_admin"]}>
              <AdminProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/project-reviews"
          element={
            <ProtectedRoute role={["admin", "super_admin"]}>
              <AdminProjectReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute role={["admin", "super_admin"]}>
              <AdminDocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/freelance-projects"
          element={
            <ProtectedRoute role={["admin", "super_admin"]}>
              <AdminFreelanceProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/placement"
          element={
            <ProtectedRoute role={["admin", "super_admin"]}>
              <AdminPlacementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/job-alerts"
          element={
            <ProtectedRoute role={["admin", "super_admin"]}>
              <AdminJobAlertsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/resume-review"
          element={
            <ProtectedRoute role={["admin", "super_admin"]}>
              <AdminResumeReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ai-insights"
          element={
            <ProtectedRoute role={["admin", "super_admin"]}>
              <AdminAIInsightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/email-logs"
          element={
            <ProtectedRoute role={["admin", "super_admin"]}>
              <EmailLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr"
          element={<Navigate to="/hr/dashboard" replace />}
        />
        <Route
          path="/hr/dashboard"
          element={
            <ProtectedRoute role={["hr", "admin", "super_admin"]}>
              <HRDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter"
          element={<Navigate to="/recruiter/dashboard" replace />}
        />
        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute role={["recruiter", "admin", "super_admin"]}>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor"
          element={<Navigate to="/mentor/dashboard" replace />}
        />
        <Route
          path="/mentor/dashboard"
          element={
            <ProtectedRoute role={["mentor", "admin", "super_admin"]}>
              <MentorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <ProtectedRoute role={["admin", "mentor", "super_admin"]}>
              <TeamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin"
          element={<Navigate to="/super-admin/dashboard" replace />}
        />
        <Route
          path="/super-admin/dashboard"
          element={
            <ProtectedRoute role="super_admin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/verify/:code" element={<VerifyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
        </motion.div>
      </AnimatePresence>
      <FloatingAIAssistant />
      {!dashboardShell && <Footer />}
    </div>
  );
}
