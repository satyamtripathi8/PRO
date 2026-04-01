import React, { forwardRef, type ReactElement } from "react";
import { UserPlus, BookOpen, LineChart, Wallet, Rocket } from "lucide-react";

interface Step {
  icon: ReactElement;
  title: string;
  description: string;
  subtitle?: string;
  active?: boolean;
}

const HowItWorks = forwardRef<HTMLDivElement>((_, ref) => {
  const steps: Step[] = [
    {
      icon: <UserPlus />,
      title: "Register & Enroll",
      description: "Start your journey with a paid evaluation program.",
    },
    {
      icon: <LineChart />,
      title: "Trading Evaluation",
      subtitle: "(Paper Trading)",
      description: "Trade with virtual capital under strict rules",
      active: true,
    },
    {
      icon: <BookOpen />,
      title: "Knowledge Check",
      description:
        "Clear a basic MCQ test to ensure foundational understanding.",
    },
    {
      icon: <Wallet />,
      title: "Get Funded",
      description: "Traders who pass gain access to company capital.",
    },
    {
      icon: <Rocket />,
      title: "Grow with Discipline",
      description: "Capital and profit share increase gradually.",
    },
  ];

  return (
      <section
        ref={ref}
        className="relative overflow-hidden py-20 bg-gradient-to-b from-white to-slate-50"
      >
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 blur-3xl rounded-full"></div>

      <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-10">
        {/* Header */}
        <div className="mb-24 text-center opacity-0 animate-fadeInUp">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-5xl text-slate-900">
            How it works
          </h2>
          <p className="max-w-3xl mx-auto text-lg sm:text-xl lg:text-2xl text-slate-600">
            A structured, performance-driven path from evaluation to funded
            capital.
          </p>
        </div>

        <div className="relative">
          {/* Animated Progress Line (Desktop) */}
          <div className="hidden lg:block absolute top-[52px] left-0 right-0 h-0.5 bg-slate-200">
            <div className="h-full bg-brand-500 animate-progress"></div>
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-16 lg:grid-cols-5 lg:gap-10">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center opacity-0 group animate-fadeInUp"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Circle */}
                <div
                  className={`
                    w-28 h-28 rounded-full flex items-center justify-center mb-6 
                    relative border-4 transition-all duration-500 ease-smooth
                    group-hover:scale-110 group-hover:shadow-glow
                    ${
                      step.active
                        ? "bg-white border-brand-500 shadow-soft"
                        : "bg-brand-500 border-white shadow-lg"
                    }
                  `}
                >
                  {React.cloneElement(step.icon as React.ReactElement<any>, {
                    className: `
                      w-10 h-10 transition-all duration-500
                      group-hover:rotate-6 group-hover:scale-125
                      ${step.active ? "text-brand-600" : "text-white"}
                    `,
                  })}
                </div>

                {/* Title */}
                <h3 className="mb-1 text-xl font-bold transition-colors duration-300 text-slate-900 group-hover:text-brand-600">
                  {step.title}
                </h3>

                {step.subtitle && (
                  <span className="block mb-2 text-base font-medium text-slate-500">
                    {step.subtitle}
                  </span>
                )}

                {/* Description */}
                <p className="text-base text-slate-600 leading-relaxed max-w-[240px] group-hover:text-slate-800 transition-colors duration-300">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default HowItWorks;
