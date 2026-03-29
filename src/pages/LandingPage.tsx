import React, { useRef, useState } from "react";

// Using the reDesignDashboard SplashScreen
import SplashScreen from "../components/reDesignDashboard/SplashScreen";

import AnnouncementBanner from "../components/reDesignDashboard/AnnouncementBanner";
import Navbar from "../components/reDesignDashboard/Navbar";
import Hero from "../components/reDesignDashboard/Hero";
import HowItWorks from "../components/reDesignDashboard/HowItWorks";
import WhatWeDo from "../components/reDesignDashboard/WhatWeDo";
import WhoThisIsFor from "../components/reDesignDashboard/WhoThisIsFor";
import PlatformPreview from "../components/reDesignDashboard/PlatformPreview";
import Education from "../components/reDesignDashboard/Education";
import EarlyAccess from "../components/reDesignDashboard/EarlyAccess";
import FAQ from "../components/reDesignDashboard/FAQ";
import Footer from "../components/reDesignDashboard/Footer";

const SPLASH_KEY = "splash_shown";

export default function LandingPage() {
  // Initialize from sessionStorage — if already shown this session, skip splash
  const [splashDone, setSplashDone] = useState<boolean>(
    () => !!sessionStorage.getItem(SPLASH_KEY)
  );

  // Scroll target refs
  const howItWorksRef = useRef<HTMLDivElement | null>(null);
  const faqRef = useRef<HTMLDivElement | null>(null);
  const earlyAccessRef = useRef<HTMLDivElement | null>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_KEY, "1"); // Remember for this session
    setSplashDone(true);
  };

  // Show ONLY splash on first visit — skipped on refresh/navigation
  if (!splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Sticky Navbar */}
      <Navbar
        onFaqClick={() => scrollTo(faqRef)}
        onNotifyClick={() => scrollTo(earlyAccessRef)}
      />

      {/* Hero Section */}
      <div className="pt-24">
        <Hero onHowItWorksClick={() => scrollTo(howItWorksRef)} />
      </div>

      {/* What We Do */}
      <WhatWeDo />

      {/* How It Works */}
      <HowItWorks ref={howItWorksRef} />

      {/* Platform Preview */}
      <PlatformPreview />

      {/* Who This Is For */}
      <WhoThisIsFor />

      {/* Education / Mentorship */}
      <Education />

      {/* Early Access / Contact Form */}
      <div ref={earlyAccessRef}>
        <EarlyAccess />
      </div>

      {/* FAQ */}
      <div ref={faqRef}>
        <FAQ />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
