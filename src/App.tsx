import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ScannerPage } from './pages/ScannerPage';
import { SocialScannerPage } from './pages/SocialScannerPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { ScanResultPage } from './pages/ScanResultPage';
import { WebsiteDetailsPage } from './pages/WebsiteDetailsPage';
import { ScanHistoryPage } from './pages/ScanHistoryPage';
import { ReportScamPage } from './pages/ReportScamPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { SafetyTipsPage } from './pages/SafetyTipsPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AiAssistantWidget } from './components/AiAssistantWidget';

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white font-sans antialiased">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/scanner" element={<ScannerPage />} />
                  <Route path="/social-scanner" element={<SocialScannerPage />} />
                  <Route path="/ai-assistant" element={<AiAssistantPage />} />
                  <Route path="/scan/:id" element={<ScanResultPage />} />
                  <Route path="/website/:domain" element={<WebsiteDetailsPage />} />
                  <Route path="/history" element={<ScanHistoryPage />} />
                  <Route path="/report" element={<ReportScamPage />} />
                  <Route path="/my-reports" element={<MyReportsPage />} />
                  <Route path="/safety-tips" element={<SafetyTipsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/dashboard" element={<UserDashboardPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
              <AiAssistantWidget />
            </div>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </Router>
  );
}
