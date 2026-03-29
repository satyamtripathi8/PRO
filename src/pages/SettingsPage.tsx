import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { walletApi } from '../lib/api';
import { User, Bell, Shield, Wallet, RefreshCw, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    tradeAlerts: true,
    priceAlerts: false,
    dailySummary: true,
    weeklyReport: true,
  });
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const handleResetWallet = async () => {
    if (!confirm('Reset your wallet to ₹1,00,000? All holdings will be cleared.')) return;
    setResetting(true);
    try {
      await walletApi.reset();
      setResetMsg('✓ Wallet reset to ₹1,00,000');
    } catch (e: any) {
      setResetMsg(e.message || 'Reset failed');
    } finally {
      setResetting(false);
      setTimeout(() => setResetMsg(''), 3000);
    }
  };

  return (
    <main className="p-6 space-y-8 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Section */}
      <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <User size={20} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Profile Information</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-sm text-gray-500">{user?.name || 'Not set'}</p>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-sm text-gray-500">{user?.email || 'Not set'}</p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Verified</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Member Since</p>
              <p className="text-sm text-gray-500">
                {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-amber-600" />
            <h2 className="font-semibold text-gray-800">Notification Preferences</h2>
          </div>
        </div>
        <div className="p-6 space-y-1">
          {([
            { key: 'tradeAlerts', label: 'Trade Alerts', desc: 'Get notified when your orders are executed' },
            { key: 'priceAlerts', label: 'Price Alerts', desc: 'Alerts when stocks hit your target price' },
            { key: 'dailySummary', label: 'Daily Summary', desc: 'End-of-day trading summary' },
            { key: 'weeklyReport', label: 'Weekly Report', desc: 'Weekly performance report' },
          ] as const).map(item => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Account Controls */}
      <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-red-50 to-rose-50">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-red-600" />
            <h2 className="font-semibold text-gray-800">Account Controls</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Reset Wallet</p>
              <p className="text-xs text-gray-400">Reset balance to ₹1,00,000 and clear all holdings</p>
            </div>
            <button
              onClick={handleResetWallet}
              disabled={resetting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {resetting ? <RefreshCw size={14} className="animate-spin" /> : <Wallet size={14} />}
              {resetting ? 'Resetting...' : 'Reset'}
            </button>
          </div>
          {resetMsg && (
            <div className={`text-sm py-2 px-3 rounded-lg ${resetMsg.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {resetMsg}
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Change Password</p>
              <p className="text-xs text-gray-400">Update your account password</p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">Coming Soon</span>
          </div>
        </div>
      </section>
    </main>
  );
}
