"use client";

import { LenisProvider } from "./LenisProvider";
import { HeroSection } from "@/components/blocks/hero-section-5";
import { SocialProof } from "./sections/SocialProof";
import { ProblemStats } from "./sections/ProblemStats";
import { Features } from "./sections/Features";
import { HowItWorks } from "./sections/HowItWorks";
import { PersonaBenefits } from "./sections/PersonaBenefits";
import { ProductShowcase } from "./sections/ProductShowcase";
import { Testimonials } from "./sections/Testimonials";
import { Pricing } from "./sections/Pricing";
import { FinalCTA } from "./sections/FinalCTA";
import { FAQ } from "./sections/FAQ";
import { Footer } from "./sections/Footer";
import { CustomCursor } from "./ui/CustomCursor";
import { ScrollProgress } from "./ui/ScrollProgress";
import { BackToTop } from "./ui/BackToTop";

export function LandingPage() {
  return (
    <LenisProvider>
      <div className="landing-v2 relative">
        <ScrollProgress />
        <CustomCursor />
        <HeroSection />
        <main>
          <SocialProof />
          <ProblemStats />
          <Features />
          <HowItWorks />
          <PersonaBenefits />
          <ProductShowcase />
          <Testimonials />
          <Pricing />
          <FinalCTA />
          <FAQ />
        </main>
        <Footer />
        <BackToTop />
      </div>
    </LenisProvider>
  );
}
