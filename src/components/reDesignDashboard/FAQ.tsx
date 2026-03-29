import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Question {
  q: string;
  a: string;
}

interface Category {
  category: string;
  questions: Question[];
}

const FAQ: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  const faqData: Category[] = [
    {
      category: "About Trevoros",
      questions: [
        {
          q: "What is Trevoros?",
          a: "Trevoros is a trader evaluation and performance-based capital allocation platform. Traders are evaluated first and funded only after meeting strict discipline and risk criteria.",
        },
        {
          q: "Is Trevoros a prop firm?",
          a: "No. Trevoros is not a traditional prop firm. It focuses on evaluating trader behavior, discipline, and risk management before allocating capital.",
        },
        {
          q: "Do you provide trading signals or tips?",
          a: "No. Trevoros does not provide signals, calls, or recommendations. All trading decisions are made solely by the trader.",
        },
        {
          q: "Is mentorship mandatory?",
          a: "No. Mentorship is optional and focuses on trading psychology, risk management, and discipline—not trade advice or signals.",
        },
        {
          q: "Who can join Trevoros?",
          a: "Both beginners and experienced traders can join. Basic learning resources and mentorship support are available after onboarding.",
        },
      ],
    },
    {
      category: "Evaluation & Funding",
      questions: [
        {
          q: "How does the evaluation process work?",
          a: "Traders are evaluated using simulated capital based on risk management, discipline, and behavioral metrics. Profit alone is not enough to pass.",
        },
        {
          q: "Is real money used during evaluation?",
          a: "No. Evaluation is conducted using simulated capital. Real capital is allocated only after successful completion.",
        },
        {
          q: "How long does the evaluation take?",
          a: "Evaluations run for multiple weeks to assess consistency. Exact timelines are shared during onboarding.",
        },
        {
          q: "How many traders get funded?",
          a: "Only a small percentage of traders pass. The system is intentionally strict to protect capital.",
        },
        {
          q: "Can I retake the evaluation?",
          a: "Yes. You can retake the evaluation up to three times for free. Additional attempts may require payment.",
        },
      ],
    },
    {
      category: "Trading Rules & Platform",
      questions: [
        {
          q: "What markets can I trade?",
          a: "Supported instruments and markets are disclosed during onboarding and depend on the account type.",
        },
        {
          q: "How is discipline measured?",
          a: "Discipline is evaluated through metrics such as stop-loss usage, risk per trade, trade frequency, and behavioral patterns—not just profit.",
        },
        {
          q: "Can I lose my own money?",
          a: "No. Traders do not deposit capital. However, violating risk rules can lead to account termination.",
        },
        {
          q: "Can I trade multiple or automated strategies?",
          a: "Yes, provided all strategies comply with risk rules and platform guidelines. Automation policies are disclosed during onboarding.",
        },
        {
          q: "What happens during drawdowns?",
          a: "Drawdowns are strictly monitored. Exceeding allowed limits results in evaluation failure or account termination.",
        },
      ],
    },
    {
      category: "Payments, Legal & Participation",
      questions: [
        {
          q: "How do funded accounts work?",
          a: "Funded traders trade company capital, follow strict risk rules, and earn through profit-sharing. Capital increases with consistent performance.",
        },
        {
          q: "Is profit sharing fixed?",
          a: "No. Profit sharing varies by level and increases as traders manage larger capital.",
        },
        {
          q: "When and how are payouts made?",
          a: "Payout details, schedules, and methods are shared after funding and are subject to compliance checks.",
        },
        {
          q: "Am I an employee of Trevoros?",
          a: "No. Traders are independent participants and operate under a performance-based agreement.",
        },
        {
          q: "Is Trevoros regulated or licensed?",
          a: "Trevoros does not provide investment advice, brokerage services, or portfolio management. It operates as an evaluation platform.",
        },
      ],
    },
  ];

  const toggleCategory = (index: number): void => {
    setActiveCategory(activeCategory === index ? null : index);
    setActiveQuestion(null);
  };

  const toggleQuestion = (catIndex: number, qIndex: number): void => {
    const key = `${catIndex}-${qIndex}`;
    setActiveQuestion(activeQuestion === key ? null : key);
  };

  return (
    <section className="py-32 bg-gradient-to-b from-sky-50 to-white">
      <div className="max-w-5xl px-6 mx-auto">
        <h2 className="text-4xl font-bold text-center sm:text-5xl md:text-6xl lg:text-7xl text-slate-900 mb-16">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          {faqData.map((cat, catIndex) => {
            const isCategoryOpen = activeCategory === catIndex;

            return (
              <div
                key={catIndex}
                className="overflow-hidden bg-white border shadow-sm rounded-3xl border-slate-200"
              >
                <button
                  onClick={() => toggleCategory(catIndex)}
                  className="flex items-center justify-between w-full px-8 py-6 text-xl font-semibold text-left transition text-slate-900 hover:bg-slate-50 lg:text-2xl"
                >
                  {cat.category}

                  <ChevronDown
                    className={`w-6 h-6 transition-transform duration-300 ${
                      isCategoryOpen ? "rotate-180 text-sky-500" : ""
                    }`}
                  />
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isCategoryOpen
                      ? "max-h-[1000px] opacity-100"
                      : "max-h-0 opacity-0"
                  } overflow-hidden`}
                >
                  <div className="px-6 pb-6 space-y-4">
                    {cat.questions.map((item, qIndex) => {
                      const key = `${catIndex}-${qIndex}`;
                      const isOpen = activeQuestion === key;

                      return (
                        <div
                          key={qIndex}
                          className="overflow-hidden bg-white border border-slate-200 rounded-2xl"
                        >
                          <button
                            onClick={() => toggleQuestion(catIndex, qIndex)}
                            className="flex items-center justify-between w-full px-6 py-5 text-base font-medium text-left transition text-slate-800 hover:bg-slate-50 lg:text-lg"
                          >
                            {item.q}

                            <ChevronDown
                              className={`w-5 h-5 transition-transform duration-300 ${
                                isOpen ? "rotate-180 text-sky-500" : ""
                              }`}
                            />
                          </button>

                          <div
                            className={`grid transition-all duration-300 ease-in-out ${
                              isOpen
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <p className="px-6 pb-5 text-base leading-relaxed text-slate-600 lg:text-lg">
                                {item.a}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
