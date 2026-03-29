import React, { useRef } from "react";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";

const Home: React.FC = () => {
  const howItWorksRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <Hero
        onHowItWorksClick={() => {
          console.log("REF VALUE:", howItWorksRef.current);
          howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
      />
      <HowItWorks ref={howItWorksRef} />
    </>
  );
};

export default Home;