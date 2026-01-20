import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { WhyQuizLinkSection } from "@/components/landing/why-quizlink-section";
import { FinalCTA } from "@/components/landing/final-cta";

export default async function HomePage() {
  const session = await auth();

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen">
      <HeroSection />
      <HowItWorksSection />
      <UseCasesSection />
      <FeaturesSection />
      <WhyQuizLinkSection />
      <FinalCTA />
    </main>
  );
}
