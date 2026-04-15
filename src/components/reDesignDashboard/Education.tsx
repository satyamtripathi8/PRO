import React from "react";
import { GraduationCap, Check } from "lucide-react";

const Education: React.FC = () => {
  const benefits: string[] = [
    "Trading psychology (pattern-based feedback)",
    "Process improvement (decision review & consistency)",
    "Rule adherence (AI-monitored discipline tracking)",
  ];

  return (
    <section className="py-14 bg-brand-50/30 sm:py-18 lg:py-22">
      <div className="px-5 mx-auto max-w-7xl sm:px-8 lg:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

          {/* LEFT — text content */}
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center px-4 py-2 mb-6 space-x-2 bg-blue-100 rounded-lg">
              <GraduationCap className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-semibold text-brand-700">
                Education First
              </span>
            </div>

            <h2 className="mb-5 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl text-slate-900">
              Learn discipline <br className="hidden sm:block" />
              with Mentor AI and experienced traders
            </h2>

            <p className="mb-6 text-sm sm:text-base lg:text-lg text-slate-600">
              Traders receive structured mentorship supported by Mentor AI,
              focused on:
            </p>

            <div className="grid gap-4 mb-8 sm:grid-cols-2">
              {benefits.map((benefit: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full mt-0.5">
                    <Check className="w-3.5 h-3.5 text-brand-600" />
                  </div>
                  <span className="font-medium text-slate-700 text-sm sm:text-base">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            <p className="max-w-lg text-sm leading-relaxed text-slate-500 sm:text-base">
              Mentorship is not about tips or signals — it is about building a
              disciplined, professional trading mindset, reinforced by data
            </p>
          </div>

          {/* RIGHT — illustration */}
          <div className="relative order-1 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <div className="absolute inset-0 transform translate-x-6 translate-y-6 rounded-full bg-brand-600 opacity-5"></div>

              <div className="relative flex items-center justify-center p-10 overflow-hidden rounded-full shadow-2xl bg-gradient-to-br from-indigo-900 to-brand-900 aspect-square">
                <div className="absolute top-8 right-8 text-brand-400 opacity-20">
                  <GraduationCap className="w-28 h-28" />
                </div>

                <div className="relative z-10 space-y-5 text-center text-white">
                  <div className="flex items-center justify-center w-20 h-20 mx-auto border bg-white/10 backdrop-blur-md rounded-xl border-white/20">
                    <GraduationCap className="w-10 h-10 text-white" />
                  </div>

                  <div className="space-y-2.5">
                    <div className="w-32 h-2.5 mx-auto rounded bg-white/20"></div>
                    <div className="w-24 h-2.5 mx-auto rounded bg-white/20"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Education;
