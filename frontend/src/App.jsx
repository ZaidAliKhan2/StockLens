import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPages from './pages/Auth/AuthPages';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import VerifyOTPPage from './pages/Auth/VerifyOTPPage';
import ComparatorPage from './pages/Comparator/ComparatorPage';
import ExplorerPage from './pages/Explorer/ExplorerPage';
import HomePage from './pages/Home/HomePage';
import PatternFinderPage from './pages/PatternFinder/PatternFinderPage';
import ScreenerPage from './pages/Screener/ScreenerPage';

const App = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/auth" element={<AuthPages />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/verify-otp" element={<VerifyOTPPage />} />
    <Route path="/explorer" element={<ProtectedRoute><ExplorerPage /></ProtectedRoute>} />
    <Route path="/patterns" element={<ProtectedRoute><PatternFinderPage /></ProtectedRoute>} />
    <Route path="/comparator" element={<ProtectedRoute><ComparatorPage /></ProtectedRoute>} />
    <Route path="/screener" element={<ProtectedRoute><ScreenerPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
