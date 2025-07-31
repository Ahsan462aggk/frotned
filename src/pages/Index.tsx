
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/home/HeroSection";
import CoursesSection from "@/components/home/CoursesSection";
import CEOSection from "@/components/home/CEOSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <div id="courses">
        <CoursesSection />
      </div>
      <div id="about">
        <CEOSection />
      </div>
      <div id="contact">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
