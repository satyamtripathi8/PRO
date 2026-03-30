import googleLogo from "../../assets/google.png"

import { API_BASE_URL } from '../../lib/config';

export default function SocialLogin() {
  const handleGoogleLogin = () => {
    // Point directly to backend API
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full border rounded-md py-2 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
    >
     <img src={googleLogo} className="size-6" alt="" />
      Sign in with Google
    </button>
  );
}