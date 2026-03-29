import React from "react";
import { CheckCircle2 } from "lucide-react";
import heroImage from "../../assets/HERO102.png";

interface HeroProps {
  onHowItWorksClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onHowItWorksClick }) => {
  const bulletPoints: string[] = [
    "We dont give signals",
    "We dont promise overnight profits",
    "We fund traders who prove discipline",
  ];

  return (
    <section className="relative flex items-center w-full py-20 overflow-hidden sm:py-24 lg:py-32 xl:py-40">
      {/* Content Wrapper */}
      <div className="w-full px-6 mx-auto max-w-screen-2xl lg:px-10">

        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">

          {/* LEFT CONTENT — pinned to left, fixed % width */}
          <div className="w-full text-center lg:text-left lg:w-[38%] xl:w-[40%] flex-shrink-0">
            {/* Heading */}
            <h1 className="mb-8 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-slate-900">
              <span className="block whitespace-nowrap">Where Discipline</span>
              <span className="block whitespace-nowrap text-brand-500">Meets Oppurtunity</span>
            </h1>

            {/* Subtext */}
            <p className="mb-10 text-xl leading-relaxed sm:text-2xl lg:text-2xl text-slate-600">
              Evaluating trades through data behaviour and performance
            </p>

            {/* Bullet Points */}
            <div className="mb-12 space-y-5 text-left">
              {bulletPoints.map((item: string, index: number) => (
                <div key={index} className="flex items-start gap-4">
                  <CheckCircle2 className="flex-shrink-0 w-7 h-7 mt-1 text-brand-500 sm:w-8 sm:h-8" />
                  <span className="text-lg font-medium text-slate-700 sm:text-xl lg:text-xl">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex justify-center lg:justify-start">
              <button
                onClick={onHowItWorksClick}
                className="w-full px-10 py-5 text-xl font-semibold transition-all duration-300 ease-in-out bg-white border rounded-full sm:px-12 sm:py-6 text-slate-700 border-slate-200 sm:text-2xl sm:w-auto md:hover:bg-slate-900 md:hover:text-white md:hover:border-slate-900 md:hover:shadow-xl active:bg-slate-900 active:text-white"
              >
                How it works
              </button>
            </div>
          </div>

          {/* RIGHT IMAGE — pinned to right, % width creates center gap */}
          <div className="w-full lg:w-[54%] xl:w-[55%] flex justify-center lg:justify-end flex-shrink-0">
            <img
              src={heroImage}
              alt="Platform Dashboard"
              className="object-contain w-full h-auto"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
