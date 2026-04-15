import { Shield, RefreshCw, Landmark } from "lucide-react";
import React from "react";

type Card = {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  text: string;
};

export default function WhoThisIsFor() {
  const cards: Card[] = [
    {
      icon: Shield,
      text: "Traders who respect structured risk and discipline",
    },
    {
      icon: RefreshCw,
      text: "Traders who think long-term and value consistency",
    },
    {
      icon: Landmark,
      text: "Traders who want to earn capital — not gamble for it",
    },
  ];

  return (
    <section className="relative overflow-hidden py-14 bg-gradient-to-b from-white to-sky-50 sm:py-18 lg:py-22">
      <div className="max-w-7xl px-5 mx-auto sm:px-8 lg:px-10">
        {/* Heading */}
        <div className="mb-10 text-center sm:mb-14">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-slate-900">
            Who This Is For
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-500">
            Trevoros is built for disciplined traders who value structure.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={index}
                className="relative p-8 text-center transition-all duration-500 border shadow-sm group bg-white/70 backdrop-blur-sm border-sky-100 rounded-2xl hover:shadow-xl hover:-translate-y-2 sm:p-10"
              >
                {/* Icon Circle */}
                <div className="flex items-center justify-center w-14 h-14 mx-auto mb-6 transition-all duration-500 rounded-full bg-sky-100 group-hover:bg-sky-500">
                  <Icon className="transition-colors duration-500 w-7 h-7 text-sky-600 group-hover:text-white group-hover:rotate-6" />
                </div>

                {/* Text */}
                <h3 className="text-base font-semibold leading-relaxed transition-colors duration-300 text-slate-800 group-hover:text-sky-600 sm:text-lg">
                  {card.text}
                </h3>

                {/* Subtle animated bottom line */}
                <div className="absolute bottom-0 w-0 h-1 transition-all duration-500 rounded-full left-1/2 bg-sky-400 group-hover:w-16 group-hover:-translate-x-1/2"></div>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center sm:mt-14">
          <p className="text-base italic text-slate-500 sm:text-lg">
            If you're looking for shortcuts, this is not for you.
          </p>
        </div>
      </div>
    </section>
  );
}
