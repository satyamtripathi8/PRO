import React, { useRef, useState } from "react";
import AuthCard from "../../components/auth/AuthCard";
import { Button } from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
const OTP_LENGTH = 6;

const Verify: React.FC<{ text?: string }> = () => {
  const navigate = useNavigate()

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // move forward
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }


  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    // move back on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    navigate("/auth/setpin")
    const finalOtp = otp.join("");
    console.log("OTP:", finalOtp);

  };

  return (
    <AuthCard title="verify Yourself" >
      <div className="w-full max-w-xl mx-auto  flex flex-col items-center text-center gap-y-2">



        {/* Subtitle */}

        <p className="text-gray-500">Verify your number with OTP</p>
        {/* OTP Boxes */}
        <div className="flex gap-x-2 mt-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              ref={(el) => {inputsRef.current[index] = el}}
              
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-14 h-14 rounded-lg border border-gray-300 text-center text-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>

        {/* Resend */}
        <p className="text-sm text-gray-500 underline cursor-pointer">
          Resend OTP on SMS (00:29)
        </p>

        {/* Button */}
        <div className="w-full mt-6">
          <Button onclick={handleSubmit}>
            Verify
          </Button>
        </div>

      </div>
    </AuthCard>
  );
};

export default Verify;