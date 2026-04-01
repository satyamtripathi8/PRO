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
    <section className="relative flex items-center w-full py-8 overflow-hidden sm:py-16 lg:py-16 xl:py-16">
      {/* Content Wrapper */}
      <div className="w-full px-4 mx-auto max-w-screen-xl lg:px-16">

        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">

          {/* LEFT CONTENT — pinned to left, fixed % width */}
          <div className="w-full text-center lg:text-left lg:w-[45%] xl:w-[48%] flex-shrink-0">
            {/* Heading */}
            <h1 className="mb-6 text-3xl font-bold leading-snug tracking-tight sm:text-4xl md:text-5xl lg:text-5xl text-slate-900">
              <span className="block whitespace-nowrap">Where Discipline</span>
              <span className="block whitespace-nowrap text-brand-500">Meets Oppurtunity</span>
            </h1>

            {/* Subtext */}
            <p className="mb-6 text-lg leading-relaxed sm:text-xl lg:text-xl text-slate-600">
              Evaluating trades through data behaviour and performance
            </p>

            {/* Bullet Points */}
            <div className="mb-8 space-y-3 text-left">
              {bulletPoints.map((item: string, index: number) => (
                <div key={index} className="flex items-start gap-4">
                  <CheckCircle2 className="flex-shrink-0 w-5 h-5 mt-1 text-brand-500 sm:w-6 sm:h-6" />
                  <span className="text-base font-medium text-slate-700 sm:text-lg lg:text-lg">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex justify-center lg:justify-start">
              <button
                onClick={onHowItWorksClick}
                className="w-full px-8 py-4 text-lg font-semibold transition-all duration-300 ease-in-out bg-white border rounded-full sm:px-10 sm:py-4 text-slate-700 border-slate-200 sm:text-xl sm:w-auto md:hover:bg-slate-900 md:hover:text-white md:hover:border-slate-900 md:hover:shadow-xl active:bg-slate-900 active:text-white"
              >
                How it works
              </button>
            </div>
          </div>

          {/* RIGHT IMAGE — pinned to right, % width creates center gap */}
          <div className="w-full lg:w-[50%] xl:w-[48%] flex justify-center lg:justify-end flex-shrink-0">
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
