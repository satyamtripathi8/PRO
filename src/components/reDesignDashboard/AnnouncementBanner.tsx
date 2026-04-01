import React from "react";
import { Rocket } from "lucide-react";

const AnnouncementBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-4 sm:py-5">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6 text-center">
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40">
            <Rocket className="w-6 h-6 text-white" />
          </div>

          {/* Main Message */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-4">
            
            
            {/* Live Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full">
              <div className="relative flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div>
              </div>
              <span className="text-sm text-white font-semibold tracking-wide">MVP is LIVE!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simple bottom highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400"></div>
    </div>
  );
};

export default AnnouncementBanner;

