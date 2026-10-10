import { HeroSection } from "@/components/home/HeroSection";
import { IntroSection } from "@/components/home/IntroSection";
import { DisciplinesSection } from "@/components/home/DisciplinesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { StatsSection } from "@/components/home/StatsSection";
import { CtaSection } from "@/components/home/CtaSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <IntroSection />
      <DisciplinesSection />
      <HowItWorksSection />
      <StatsSection />
      <CtaSection />
    </>
  );
}
