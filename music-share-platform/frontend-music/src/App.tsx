import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyTracksPage from './pages/MyTracksPage';
import InvitePage from './pages/InvitePage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite/:code" element={<InvitePage />} />
        <Route path="/register/:code" element={<RegisterPage />} />

        <Route path="/" element={
          <PrivateRoute>
            <MyTracksPage />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
