import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InvitePage from './pages/InvitePage';
import AdminPage from './pages/AdminPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import CMSDashboardPage from './pages/CMSDashboardPage';
import PartnerAdminPage from './pages/PartnerAdminPage';
import PartnerLoginPage from './pages/PartnerLoginPage';
import PartnerRegisterPage from './pages/PartnerRegisterPage';
import PartnerDashboardPage from './pages/PartnerDashboardPage';
import PartnerSettingsPage from './pages/PartnerSettingsPage';
import MyTracksPage from './pages/MyTracksPage';
import AlbumDetailPage from './pages/AlbumDetailPage';
import AudioPlayer from './components/AudioPlayer';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">접근 거부</h1>
          <p className="text-gray-600">관리자 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function PartnerRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/partner/login" />;
  }

  if (user?.role !== 'partner') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">접근 거부</h1>
          <p className="text-gray-600">파트너 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      {/* 글로벌 오디오 플레이어 */}
      <AudioPlayer />

      <Routes>
        {/* 랜딩 페이지 (메인) */}
        <Route path="/" element={<LandingPage />} />

        {/* 앨범 상세 페이지 */}
        <Route path="/albums/:slug" element={<AlbumDetailPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite/:code" element={<InvitePage />} />
        <Route path="/register/:code" element={<RegisterPage />} />

        {/* 사용자 음원 페이지 */}
        <Route path="/my-tracks" element={
          <UserRoute>
            <MyTracksPage />
          </UserRoute>
        } />

        {/* 관리자 메인 페이지 */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } />

        {/* 숨겨진 CMS 라우트 - 외부에서 URL 추측 어려움 */}
        <Route path="/cms-rl2025x" element={
          <AdminRoute>
            <CMSDashboardPage />
          </AdminRoute>
        } />

        {/* CMS 숏컷 라우트 */}
        <Route path="/cms" element={
          <AdminRoute>
            <CMSDashboardPage />
          </AdminRoute>
        } />

        {/* 파트너 관리 (관리자 전용) */}
        <Route path="/partner-admin" element={
          <AdminRoute>
            <PartnerAdminPage />
          </AdminRoute>
        } />

        {/* 관리자 설정 */}
        <Route path="/admin/settings" element={
          <AdminRoute>
            <AdminSettingsPage />
          </AdminRoute>
        } />

        {/* 파트너 페이지 */}
        <Route path="/partner/login" element={<PartnerLoginPage />} />
        <Route path="/partner/register" element={<PartnerRegisterPage />} />
        <Route path="/partner/dashboard" element={
          <PartnerRoute>
            <PartnerDashboardPage />
          </PartnerRoute>
        } />

        {/* 파트너 설정 */}
        <Route path="/partner/settings" element={
          <PartnerRoute>
            <PartnerSettingsPage />
          </PartnerRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
