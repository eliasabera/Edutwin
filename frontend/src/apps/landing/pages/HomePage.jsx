import React from "react";
import HeroSection from "../components/HeroSection";
import FeaturesGrid from "../components/FeaturesGrid";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import StatsSection from "../components/StatsSection";
import CTASection from "../components/CTASection";

const HomePage = () => {
  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <FeaturesGrid />
      <HowItWorks />
      <StatsSection />
      <Testimonials />
      <CTASection />
    </div>
  );
};

export default HomePage;
