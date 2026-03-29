import googleLogo from "../../assets/google.png"

export default function SocialLogin() {
  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'http://localhost:3000/api/auth/google';
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