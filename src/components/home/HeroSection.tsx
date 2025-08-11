import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-6 bg-gray-900 text-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-900 to-transparent opacity-30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-pink-900 to-transparent opacity-30 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-white to-gray-400">
              Sabiry Ultrasound Training Institute
            </h1>
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Empowering the next generation of ultrasound professionals with world-class training, advanced technology, and over two decades of proven excellence.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30 rounded-full px-10 py-6">
                  Start Your Journey
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse-slow"></div>
            <div className="relative bg-gray-800/60 backdrop-blur-md p-4 rounded-3xl shadow-2xl">
              <img 
                src="https://res.cloudinary.com/dcmtpky4i/image/upload/v1751401471/WhatsApp_Image_2025-05-15_at_19.31.00_0a0a9434_vmsfvc.jpg"
                alt="Student learning online"
                className="rounded-2xl w-full"
              />
              <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md p-3 rounded-full border border-gray-600 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-white">Live Classes Available</span>
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
