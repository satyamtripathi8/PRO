import { useState } from "react";
import googleLogo from "../../assets/google.png"

import { API_BASE_URL } from '../../lib/config';

export default function SocialLogin() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    if (loading) return; // Prevent double-clicks
    setLoading(true);
    console.log('[SocialLogin] Redirecting to Google OAuth...');
    // Point directly to backend API
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className={`w-full border rounded-md py-2 flex items-center justify-center gap-2 transition-colors ${
        loading ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50'
      }`}
    >
     <img src={googleLogo} className="size-6" alt="" />
      {loading ? 'Redirecting...' : 'Sign in with Google'}
    </button>
  );
}