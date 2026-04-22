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
    "We support traders who prove discipline",
  ];

  return (
    <section className="relative flex items-center w-full py-10 overflow-hidden sm:py-14 lg:py-18 xl:py-20">
      <div className="w-full px-5 mx-auto max-w-screen-2xl sm:px-8 lg:px-10">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">

          {/* LEFT CONTENT */}
          <div className="w-full text-center lg:text-left lg:w-[42%] xl:w-[44%] flex-shrink-0">
            {/* Heading */}
            <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl text-slate-900">
              <span className="block whitespace-nowrap">Where Discipline</span>
              <span className="block whitespace-nowrap text-brand-500">Meets Opportunity</span>
            </h1>

            {/* Subtext */}
            <p className="mb-7 text-base leading-relaxed sm:text-lg lg:text-xl text-slate-600">
              Evaluating trades through data, behaviour and performance
            </p>

            {/* Bullet Points */}
            <div className="mb-8 space-y-3.5 text-left">
              {bulletPoints.map((item: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="flex-shrink-0 w-5 h-5 mt-0.5 text-brand-500 sm:w-6 sm:h-6" />
                  <span className="text-sm font-medium text-slate-700 sm:text-base lg:text-base">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex justify-center lg:justify-start">
              <button
                onClick={onHowItWorksClick}
                className="w-full px-8 py-3.5 text-base font-semibold transition-all duration-300 ease-in-out bg-white border rounded-full sm:px-10 sm:py-4 text-slate-700 border-slate-200 sm:text-lg sm:w-auto md:hover:bg-slate-900 md:hover:text-white md:hover:border-slate-900 md:hover:shadow-xl active:bg-slate-900 active:text-white"
              >
                How it works
              </button>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="w-full lg:w-[52%] xl:w-[52%] flex justify-center lg:justify-end flex-shrink-0">
            <img
              src={heroImage}
              alt="Platform Dashboard"
              className="object-contain w-full h-auto max-w-xl lg:max-w-none"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
