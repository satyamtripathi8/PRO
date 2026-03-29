import { AlertTriangle, BarChart2, Heart, Clock } from "lucide-react";
import React from "react";

type Card = {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
};

export default function WhatWeDo() {
  const cards: Card[] = [
    {
      icon: AlertTriangle,
      title: "Risk Management",
      description:
        "Structured evaluation with controlled capital exposure to assess true risk awareness.",
    },
    {
      icon: BarChart2,
      title: "Trading Discipline",
      description:
        "Performance tracking focused on rule adherence, not short-term gains.",
    },
    {
      icon: Heart,
      title: "Emotional Control",
      description:
        "Behavior-based filtering to identify consistency under market pressure.",
    },
    {
      icon: Clock,
      title: "Consistency Over Time",
      description:
        "Sustained performance metrics that reward long-term strategic execution.",
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-b from-white to-sky-50">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-150px] left-1/3 w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-7xl px-6 mx-auto">
        {/* Heading */}
        <div className="mb-20 text-center">
          <p className="uppercase tracking-[0.25em] text-sky-600 text-base font-semibold mb-4">
            What We Do
          </p>

          <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-slate-900">
            Earn Access to Capital Through Discipline
          </h2>

          <p className="max-w-3xl mx-auto text-lg leading-relaxed sm:text-xl lg:text-2xl text-slate-600">
            Our evaluation framework is designed to measure structure, composure
            and performance consistency — not luck.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={index}
                className="relative p-10 transition-all duration-500 border group bg-white/80 backdrop-blur-sm border-sky-100 rounded-3xl hover:-translate-y-4 hover:shadow-2xl"
              >
                {/* Icon Circle */}
                <div className="flex items-center justify-center mb-8 transition-all duration-500 w-16 h-16 rounded-xl bg-sky-100 group-hover:bg-sky-500 group-hover:scale-110">
                  <Icon className="transition-colors duration-500 w-8 h-8 text-sky-600 group-hover:text-white" />
                </div>

                {/* Title */}
                <h4 className="mb-4 text-xl font-semibold transition-colors duration-300 text-slate-900 group-hover:text-sky-600 lg:text-2xl">
                  {card.title}
                </h4>

                {/* Description */}
                <p className="text-base leading-relaxed text-slate-600 lg:text-lg">
                  {card.description}
                </p>

                {/* Bottom Accent Line */}
                <div className="absolute bottom-0 left-10 w-0 h-[3px] bg-gradient-to-r from-sky-400 to-sky-600 rounded-full group-hover:w-20 transition-all duration-500"></div>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-20 text-center">
          <p className="max-w-4xl mx-auto text-base text-slate-500 lg:text-lg">
            Only traders who meet our internal standards gain access to
            company-funded capital and structured profit-sharing opportunities.
          </p>
        </div>
      </div>
    </section>
  );
}
