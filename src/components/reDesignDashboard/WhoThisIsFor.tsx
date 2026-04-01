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
    <section className="relative overflow-hidden py-20 bg-gradient-to-b from-white to-sky-50">
      <div className="max-w-7xl px-6 mx-auto">
        {/* Heading */}
        <div className="mb-20 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-5xl text-slate-900">
            Who This Is For
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-500">
            Trevoros is built for disciplined traders who value structure.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-12 md:grid-cols-3">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={index}
                className="relative p-12 text-center transition-all duration-500 border shadow-sm group bg-white/70 backdrop-blur-sm border-sky-100 rounded-3xl hover:shadow-xl hover:-translate-y-3"
              >
                {/* Icon Circle */}
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-8 transition-all duration-500 rounded-full bg-sky-100 group-hover:bg-sky-500">
                  <Icon className="transition-colors duration-500 w-10 h-10 text-sky-600 group-hover:text-white group-hover:rotate-6" />
                </div>

                {/* Text */}
                <h3 className="text-xl font-semibold leading-relaxed transition-colors duration-300 text-slate-800 group-hover:text-sky-600 lg:text-2xl">
                  {card.text}
                </h3>

                {/* Subtle animated bottom line */}
                <div className="absolute bottom-0 w-0 h-1 transition-all duration-500 rounded-full left-1/2 bg-sky-400 group-hover:w-20 group-hover:-translate-x-1/2"></div>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-20 text-center">
          <p className="text-xl italic text-slate-500 lg:text-2xl">
            If you're looking for shortcuts, this is not for you.
          </p>
        </div>
      </div>
    </section>
  );
}
