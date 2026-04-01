import AuthLayout from './components/auth/AuthLayout'
import LoginPage from './app/authform/login'
import PhoneCard from './app/authform/phone'
import Verify from './app/authform/verify'
import SetPin from './app/authform/setpin'
import './App.css'
import { Route, Routes, Navigate } from 'react-router-dom'
import { PanVerify } from './app/authform/PAN'
import { BankDetail } from './app/authform/bankdetail'
import MaritalStatus from './app/authform/MaritalStatus'
import AnualIncome from './app/authform/anualincome'
import Occupations from './app/authform/occupation'
import ExperienceForm from './app/authform/experience'
import ConfirmPin from './app/authform/confirm'
import Dashboard from './pages/Dashboard'
import MainLayout from './components/layout/Mainlayout'
import Trade from './pages/Trade'
import FullscreenChart from './pages/FullscreenChart'
import Profile from './pages/Profile'
import Learn from './pages/Learn'
import Analytics from './pages/Analytics'
import Mentorship from './pages/Mentorship'
import Positions from './pages/Position'
import OptionChainPage from './pages/OptionChainPage'
import Sell from './pages/Sell'
import AiChat from './pages/AiChat'
import SettingsPage from './pages/SettingsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import AdminDashboard from './pages/AdminDashboard'
import LandingPage from './pages/LandingPage'
import { useAuth } from './context/AuthContext'
import { useToast } from './hooks/useToast'
import ToastContainer from './components/common/Toast'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/Home" replace />;
  return <>{children}</>;
}

function App() {
  const { toasts, dismissToast } = useToast();

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthLayout />} >
          <Route index element={<Navigate to="login" replace />} />
          <Route path="login" element={ <LoginPage />} />
          <Route path='phone' element={<PhoneCard />} />
          <Route path='verify' element={<Verify />} />
          <Route path='setpin' element={<SetPin />} />
          <Route path='confirm' element={<ConfirmPin />} />
          <Route path='PAN' element={<PanVerify />} />
          <Route path='bankdetail' element={<BankDetail />} />
          <Route path='marital' element={<MaritalStatus />} />
          <Route path='anualincome' element={<AnualIncome />} />
          <Route path='occupations' element={<Occupations />} />
          <Route path='experience' element={<ExperienceForm />} />
        </Route>
        <Route path='/Home' element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="trade" element={<Trade />} />
          <Route path="trade/fullscreen" element={<FullscreenChart />} />
          <Route path="options/:symbol" element={<OptionChainPage />} />
          <Route path="Profile" element={<Profile />} />
          <Route path="learn" element={<Learn />} />
          <Route path="Mentorship" element={<Mentorship />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="positions" element={<Positions />} />
          <Route path="ai-chat" element={<AiChat />} />
          <Route path="sell/:symbol" element={<Sell />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
        </Route>
        <Route path='/Home/admin' element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
    </>
  )
}

export default App
