import React, { useEffect, useState } from "react";
import logo from "../../assets/LOGO.png";

type SplashScreenProps = {
  onComplete: () => void;
};

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState<boolean>(false);

  useEffect(() => {
    // Start exit animation slightly before the parent unmounts/hides
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 2800); // Trigger exit fade out

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000); // Total duration

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-50 transition-opacity duration-700 ${isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
    >
      <div className="relative">
        {/* Pulsing Back Glow */}
        <div className="absolute w-48 h-48 -translate-x-1/2 -translate-y-1/2 rounded-full top-1/2 left-1/2 bg-brand-200 blur-3xl animate-pulse"></div>

        <div className="relative z-10 flex flex-col items-center">
          <img
            src={logo}
            alt="Trevoros Logo"
            className="w-24 h-auto mb-6 animate-bounce-gentle"
          />
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 animate-fade-in-up">
            TREVOROS
          </h1>

          <div className="flex items-center mt-4 space-x-2">
            <span className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-bounce delay-75"></span>
            <span className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-bounce delay-150"></span>
            <span className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-bounce delay-300"></span>
          </div>

          <p className="mt-4 text-sm font-medium tracking-widest uppercase text-brand-600 animate-pulse">
            MVP is Live
          </p>
        </div>
      </div>
    </div>
  );
}