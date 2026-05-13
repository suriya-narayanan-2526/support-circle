import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { PageContainer } from './components/layout/PageContainer';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ChatBotIcon } from './components/layout/ChatBotIcon';
import { GlobalReviewPrompt } from './components/layout/GlobalReviewPrompt';

// Pages
import { LandingPage } from './features/landing/LandingPage';
import { CommunityPage } from './features/landing/CommunityPage';
import { OrphanageImpactPage } from './features/landing/OrphanageImpactPage';
import { AboutPage } from './features/about/AboutPage';
import { UserHomePage } from './features/home/UserHomePage';
import { LoginPage } from './features/auth/LoginPage';
import { RoleSelectionPage } from './features/auth/RoleSelectionPage';
import { RegisterDonorForm } from './features/auth/RegisterDonorForm';
import { RegisterVolunteerForm } from './features/auth/RegisterVolunteerForm';
import { RegisterOrphanageForm } from './features/auth/RegisterOrphanageForm';
import { RegisterPartnerForm } from './features/auth/RegisterPartnerForm';
import { DonorDashboard } from './features/donor/DonorDashboard';
import { DonationCategoryPage } from './features/donor/DonationCategoryPage';
import { DonationForm } from './features/donor/DonationForm';
import { DonationHistoryPage } from './features/donor/DonationHistoryPage';
import { OrphanageDashboard } from './features/orphanage/OrphanageDashboard';
import { RequestForm } from './features/orphanage/RequestForm';
import { VolunteerDashboard } from './features/volunteer/VolunteerDashboard';
import { PartnerDashboard } from './features/partner/PartnerDashboard';
import { PartnerContributions } from './features/partner/PartnerContributions';
import { PartnerInKind } from './features/partner/PartnerInKind';
import { PartnerFinancial } from './features/partner/PartnerFinancial';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { UserDetails } from './features/admin/UserDetails';
import { VolunteerLiveListener } from './features/volunteer/VolunteerLiveListener';
import { DonorLiveListener } from './features/donor/DonorLiveListener';
import { ImpactHub } from './features/gamification/ImpactHub';

const Placeholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center p-20 text-navy">
    <h1 className="text-3xl font-display font-bold">{title}</h1>
    <p className="mt-4 text-gray-500">Under construction...</p>
  </div>
);

const FooterWrapper = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <Footer />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageContainer>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/request/:id" element={<OrphanageImpactPage />} />
            
            {/* Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RoleSelectionPage />} />
            <Route path="/auth/register/donor" element={<RegisterDonorForm />} />
            <Route path="/auth/register/volunteer" element={<RegisterVolunteerForm />} />
            <Route path="/auth/register/orphanage" element={<RegisterOrphanageForm />} />
            <Route path="/auth/register/partner" element={<RegisterPartnerForm />} />
            
            {/* General Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<UserHomePage />} />
            </Route>

            {/* Shared Donation Routes (Donor & Partner) */}
            <Route element={<ProtectedRoute allowedRoles={['donor', 'community_partner']} />}>
              <Route path="/donor/donate" element={<DonationCategoryPage />} />
              <Route path="/donor/donate/items" element={<DonationForm />} />
            </Route>

            {/* Shared Gamification Routes (Donor & Volunteer) */}
            <Route element={<ProtectedRoute allowedRoles={['donor', 'volunteer']} />}>
              <Route path="/impact-hub" element={<ImpactHub />} />
            </Route>

            {/* Donor Routes (Protected) */}
            <Route element={<ProtectedRoute allowedRoles={['donor']} />}>
              <Route path="/donor/dashboard" element={<DonorDashboard />} />
              <Route path="/donor/history" element={<DonationHistoryPage />} />
            </Route>

            {/* Orphanage Routes (Protected) */}
            <Route element={<ProtectedRoute allowedRoles={['orphanage']} />}>
              <Route path="/orphanage/dashboard" element={<OrphanageDashboard />} />
              <Route path="/orphanage/request" element={<RequestForm />} />
            </Route>

            {/* Volunteer Routes (Protected) */}
            <Route element={<ProtectedRoute allowedRoles={['volunteer']} />}>
              <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
            </Route>

            {/* Partner Routes (Protected) */}
            <Route element={<ProtectedRoute allowedRoles={['community_partner']} />}>
              <Route path="/partner/dashboard" element={<PartnerDashboard />} />
              <Route path="/partner/contributions" element={<PartnerContributions />} />
              <Route path="/partner/contributions/in-kind" element={<PartnerInKind />} />
              <Route path="/partner/contributions/financial" element={<PartnerFinancial />} />
            </Route>

            {/* Admin Routes (Protected) */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users/:id" element={<UserDetails />} />
            </Route>

          </Routes>
          <FooterWrapper />
          <ChatBotIcon />
          <GlobalReviewPrompt />
          <VolunteerLiveListener />
          <DonorLiveListener />
        </PageContainer>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
