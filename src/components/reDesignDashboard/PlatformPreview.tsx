import React from "react";
import platformImage from "../../assets/Built for serious traders.png";

const PlatformPreview: React.FC = () => {
  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-b from-brand-900 to-slate-950">
      {/* Soft Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/3 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-[-200px] right-1/4 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="relative z-10 max-w-7xl px-6 mx-auto text-center">
        {/* Heading */}
        <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Built for Serious Traders
        </h2>

        <p className="max-w-4xl mx-auto mb-20 text-lg leading-relaxed sm:text-xl lg:text-2xl text-brand-100">
          Engineered for speed, stability and execution precision — so your
          strategy performs exactly as intended.
        </p>

        {/* Platform Frame */}
        <div className="relative max-w-7xl mx-auto group">
          {/* Gradient Glow Border */}
          <div className="absolute transition duration-700 -inset-1 rounded-3xl bg-gradient-to-r from-brand-500 via-sky-400 to-brand-500 opacity-20 blur-xl group-hover:opacity-40"></div>

          {/* Glass Container */}
          <div className="relative rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] transition-transform duration-700 group-hover:scale-[1.02] group-hover:-translate-y-2">
            {/* Top Bar (Mock App Frame) */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>

            {/* Image */}
            <img
              src={platformImage}
              alt="Trading Platform Interface"
              className="w-full h-auto transition duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformPreview;
