import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="relative w-full bg-gray-900 text-white pt-20 pb-10 mt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-purple-900 to-transparent opacity-20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-tl from-pink-900 to-transparent opacity-20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Institute Info */}
          <div className="md:col-span-2 lg:col-span-1">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">SUTI</h3>
            <p className="text-gray-400">Excellence in Ultrasound Education & Training. Join a legacy of expertise and innovation.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
              <li><a href="#courses" className="text-gray-400 hover:text-white transition-colors">Courses</a></li>
              <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Get in Touch</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:sabiryultrasound@gmail.com" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                  <Mail className="h-5 w-5 text-purple-400" />
                  <span>Email Us</span>
                </a>
              </li>
              <li>
                <a href="tel:+923477149100" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                  <Phone className="h-5 w-5 text-purple-400" />
                  <span>Call Us</span>
                </a>
              </li>
              <li>
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin className="h-5 w-5 text-purple-400" />
                  <span>Amin Pur, Pakistan</span>
                </div>
              </li>
            </ul>
          </div>

          {/* WhatsApp Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Need Help?</h4>
            <p className="text-sm text-gray-400 mb-4">Our support team is just a message away.</p>
            <Button asChild className="w-full text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30 rounded-full px-6 py-5">
              <a 
                href="https://wa.me/923477149100?text=Hello%20SUTI%20Support%2C%20I%20need%20help."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Chat on WhatsApp</span>
              </a>
            </Button>
          </div>
        </div>

        <div className="text-center text-gray-500 mt-16 pt-8 border-t border-gray-800">
          &copy; {new Date().getFullYear()} Sabiry Ultrasound Training Institute. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
