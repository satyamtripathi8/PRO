import React from "react";
import { GraduationCap, Check } from "lucide-react";

const Education: React.FC = () => {
  const benefits: string[] = [
    "Trading psychology (pattern-based feedback)",
    "Process improvement (decision review & consistency)",
    "Rule adherence (AI-monitored discipline tracking)",
  ];

  return (
    <section className="py-20 bg-brand-50/30">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-10">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center px-5 py-3 mb-8 space-x-2 bg-blue-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-brand-600" />
              <span className="text-base font-semibold text-brand-700">
                Education First
              </span>
            </div>

            <h2 className="mb-6 text-3xl font-bold leading-snug sm:text-4xl md:text-5xl lg:text-5xl text-slate-900">
              Learn discipline <br />
              with Mentor AI and experienced traders
            </h2>

            <p className="mb-8 text-lg sm:text-xl lg:text-2xl text-slate-600">
              Traders receive structured mentorship supported by Mentor AI,
              focused on:
            </p>

            <div className="grid gap-6 mb-10 sm:grid-cols-2">
              {benefits.map((benefit: string, index: number) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-7 h-7 bg-blue-100 rounded-full">
                    <Check className="w-4 h-4 text-brand-600" />
                  </div>
                  <span className="font-medium text-slate-700 text-base lg:text-lg">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            <p className="max-w-lg text-base leading-relaxed text-slate-500 lg:text-lg">
              Mentorship is not about tips or signals — it is about building a
              disciplined, professional trading mindset, reinforced by data
            </p>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="relative flex items-center justify-center aspect-square">
              {/* Abstract Illustration Placeholder */}
              <div className="absolute inset-0 transform translate-x-10 translate-y-10 rounded-full bg-brand-600 opacity-5"></div>

              <div className="relative z-10 w-full max-w-lg">
                <div className="relative flex items-center justify-center p-12 overflow-hidden rounded-full shadow-2xl bg-gradient-to-br from-indigo-900 to-brand-900 aspect-square">
                  <div className="absolute top-10 right-10 text-brand-400 opacity-20">
                    <GraduationCap className="w-40 h-40" />
                  </div>

                  <div className="relative z-10 space-y-6 text-center text-white">
                    <div className="flex items-center justify-center w-32 h-32 mx-auto border bg-white/10 backdrop-blur-md rounded-2xl border-white/20">
                      <GraduationCap className="w-16 h-16 text-white" />
                    </div>

                    <div className="space-y-3">
                      <div className="w-40 h-3 mx-auto rounded bg-white/20"></div>
                      <div className="w-32 h-3 mx-auto rounded bg-white/20"></div>
                    </div>
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
