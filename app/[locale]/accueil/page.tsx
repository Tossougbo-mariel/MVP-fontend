import { setRequestLocale } from "next-intl/server";
import Navbar from "./_components/Navbar";
import Hero from "./_components/Hero";
import Features from "./_components/Features";
import HowItWorks from "./_components/HowItWorks";
import Testimonials from "./_components/Testimonials";
import FinalCTA from "./_components/FinalCTA";
import Footer from "./_components/Footer";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  );
}