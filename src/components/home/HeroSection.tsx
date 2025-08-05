import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="pt-20 md:pt-24 pb-12 md:pb-16 px-6">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
              Sabiry Ultrasound Training Institute
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Empowering the next generation of ultrasound professionals with world-class training, advanced technology, and over two decades of proven excellence. Join a legacy of expertise and innovation in diagnostic imaging.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/signup">
                <Button className="btn-neon text-lg px-8 py-4">
                  Start Learning
                </Button>
              </Link>

            </div>
            
          </div>
          
          <div className="relative">
            <div className="glass-card p-8 rounded-2xl">
              <img 
                src="https://res.cloudinary.com/dcmtpky4i/image/upload/v1751401471/WhatsApp_Image_2025-05-15_at_19.31.00_0a0a9434_vmsfvc.jpg"
                alt="Student learning online"
                className="rounded-xl w-full"
              />
              <div className="absolute -bottom-4 -right-4 glass-card p-4 rounded-xl neon-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live Classes Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
