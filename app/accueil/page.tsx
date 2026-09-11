import Navbar from "./_components/Navbar";
import Hero from "./_components/Hero";
import Features from "./_components/Features";
import HowItWorks from "./_components/HowItWorks";
import Testimonials from "./_components/Testimonials";
import FinalCTA from "./_components/FinalCTA";
import Footer from "./_components/Footer";

export default function Home() {
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
