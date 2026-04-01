import { useState, useEffect, useRef } from "react";
import AuthCard from "../../components/auth/AuthCard";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Divider } from "../../components/ui/Divider";
import SocialLogin from "../../components/auth/SocialLogin";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup, verifyEmail, resendOTP } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Verification state
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check for OAuth error in URL params
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: 'Google authentication failed. Please try again.',
        no_code: 'Google authentication was cancelled.',
        token_exchange_failed: 'Failed to authenticate with Google. Please try again.',
        userinfo_failed: 'Failed to get user info from Google. Please try again.',
      };
      setError(errorMessages[oauthError] || 'Authentication failed. Please try again.');
    }
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async () => {
    if (loading) return;
    setError("");
    setSuccess("");
    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.requiresVerification) {
          setVerificationEmail(result.email || email);
          setShowVerification(true);
          setSuccess("Please verify your email. Check your inbox for the code.");
          setResendCooldown(30);
        } else {
          // Redirect admins to Admin Dashboard, regular users to Home
          navigate(result.user?.role === 'ADMIN' ? "/Home/admin" : "/Home");
        }
      } else {
        const result = await signup(email, name, password);
        if (result.requiresVerification) {
          setVerificationEmail(result.email || email);
          setShowVerification(true);
          setSuccess("Account created! Please verify your email.");
          setResendCooldown(30);
        } else {
          navigate("/Home");
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    if (pastedData.length === 6) {
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    if (loading) return; // Prevent double-submit

    console.log('[OTP] Verifying code for:', verificationEmail);
    setError("");
    setLoading(true);
    try {
      await verifyEmail(verificationEmail, code);
      // After email verify, fetch user role from context to redirect properly
      navigate("/Home");
    } catch (err: any) {
      console.error('[OTP] Verify failed:', err);
      setError(err.message || "Invalid verification code");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || loading) return;

    console.log('[OTP] Resending OTP to:', verificationEmail);
    setError("");
    setLoading(true);
    try {
      await resendOTP(verificationEmail);
      setSuccess("Verification code sent! Check your inbox.");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      console.error('[OTP] Resend failed:', err);
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  // Verification UI
  if (showVerification) {
    return (
      <AuthCard
        title="Verify your email"
        description={`We sent a 6-digit code to ${verificationEmail}`}
      >
        <div className="space-y-6">
          {/* OTP Input */}
          <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { otpRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-semibold border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          <Button onclick={handleVerify} disabled={loading || otp.join("").length !== 6}>
            {loading ? "Verifying..." : "Verify Email"}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || loading}
              className={`text-sm font-medium ${
                resendCooldown > 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:underline cursor-pointer"
              }`}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </button>
          </div>

          <button
            onClick={() => {
              setShowVerification(false);
              setOtp(["", "", "", "", "", ""]);
              setError("");
              setSuccess("");
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Back to {isLogin ? "Login" : "Sign Up"}
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={isLogin ? "Welcome back" : "Get started with Trevoros"}
      description={isLogin ? "Login to your account" : "Start learning and trading in minutes."}
    >
      <div className="space-y-4">
        {!isLogin && (
          <Input
            label="Full Name"
            placeholder="Enter your name"
            value={name}
            onChange={(e: any) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        )}

        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <Input
          label="Password"
          placeholder={isLogin ? "Enter your password" : "Create a password (min 6 chars)"}
          type="password"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <Button onclick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
        </Button>

        <Divider text="Or Continue With" />
        <SocialLogin />

        <p className="text-sm text-center">
          {isLogin ? "Don't have an account? " : "Already registered? "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }}
          >
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </p>
      </div>
    </AuthCard>
  );
}
