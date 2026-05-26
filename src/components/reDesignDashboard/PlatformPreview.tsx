import React from "react";
import platformImage from "../../assets/Built for serious traders.png";

const PlatformPreview: React.FC = () => {
  return (
    <section className="relative py-14 overflow-hidden bg-gradient-to-b from-brand-900 to-slate-950 sm:py-18 lg:py-22">
      {/* Soft Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-[-150px] right-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="relative z-10 max-w-7xl px-5 mx-auto text-center sm:px-8 lg:px-10">
        {/* Heading */}
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Built for Serious Traders
        </h2>

        <p className="max-w-3xl mx-auto mb-10 text-sm leading-relaxed sm:text-base lg:text-lg text-brand-100 sm:mb-14">
          Engineered for speed, stability and execution precision — so your
          strategy performs exactly as intended.
        </p>

        {/* Platform Frame */}
        <div className="relative max-w-6xl mx-auto group">
          {/* Gradient Glow Border */}
          <div className="absolute transition duration-700 -inset-1 rounded-2xl bg-gradient-to-r from-brand-500 via-sky-400 to-brand-500 opacity-20 blur-xl group-hover:opacity-40"></div>

          {/* Glass Container */}
          <div className="relative rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] transition-transform duration-700 group-hover:scale-[1.015] group-hover:-translate-y-1">
            {/* Top Bar (Mock App Frame) */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5 sm:px-6 sm:py-4">
              <div className="w-2.5 h-2.5 bg-red-400 rounded-full sm:w-3 sm:h-3"></div>
              <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full sm:w-3 sm:h-3"></div>
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full sm:w-3 sm:h-3"></div>
            </div>

            {/* Image */}
            <img
              src={platformImage}
              alt="Trading Platform Interface"
              className="w-full h-auto transition duration-700 group-hover:scale-[1.03]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformPreview;
