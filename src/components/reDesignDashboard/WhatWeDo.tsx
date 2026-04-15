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
    <section className="relative py-14 overflow-hidden bg-gradient-to-b from-white to-sky-50 sm:py-18 lg:py-22">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-100px] left-1/3 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-7xl px-5 mx-auto sm:px-8 lg:px-10">
        {/* Heading */}
        <div className="mb-10 text-center sm:mb-14">
          <p className="uppercase tracking-[0.2em] text-sky-600 text-xs font-semibold mb-3 sm:text-sm">
            What We Do
          </p>

          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-slate-900">
            Earn Access to Capital Through Discipline
          </h2>

          <p className="max-w-2xl mx-auto text-sm leading-relaxed sm:text-base lg:text-lg text-slate-600">
            Our evaluation framework is designed to measure structure, composure
            and performance consistency — not luck.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={index}
                className="relative p-6 transition-all duration-500 border group bg-white/80 backdrop-blur-sm border-sky-100 rounded-2xl hover:-translate-y-3 hover:shadow-xl sm:p-8"
              >
                {/* Icon Circle */}
                <div className="flex items-center justify-center mb-5 transition-all duration-500 w-12 h-12 rounded-xl bg-sky-100 group-hover:bg-sky-500 group-hover:scale-110">
                  <Icon className="transition-colors duration-500 w-6 h-6 text-sky-600 group-hover:text-white" />
                </div>

                {/* Title */}
                <h4 className="mb-3 text-base font-semibold transition-colors duration-300 text-slate-900 group-hover:text-sky-600 sm:text-lg">
                  {card.title}
                </h4>

                {/* Description */}
                <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                  {card.description}
                </p>

                {/* Bottom Accent Line */}
                <div className="absolute bottom-0 left-8 w-0 h-[3px] bg-gradient-to-r from-sky-400 to-sky-600 rounded-full group-hover:w-16 transition-all duration-500"></div>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center sm:mt-14">
          <p className="max-w-3xl mx-auto text-sm text-slate-500 sm:text-base">
            Only traders who meet our internal standards gain access to
            company-funded capital and structured profit-sharing opportunities.
          </p>
        </div>
      </div>
    </section>
  );
}
