import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
