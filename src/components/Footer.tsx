import { Mail, Phone, MapPin, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="w-full bg-background/80 border-t border-border/50 py-12 mt-20">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4 text-center md:text-left">
        
        {/* Institute Info */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-2xl font-bold text-primary mb-2">SUTI</h3>
          <p className="font-semibold">Sabiry Ultrasound Training Institute</p>
          <p className="text-sm text-muted-foreground mt-1">Excellence in Ultrasound Education & Training</p>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Get in Touch</h4>
          <ul className="space-y-3">
            <li>
              <a href="mailto:sabiryultrasound@gmail.com" className="flex items-center justify-center md:justify-start gap-3 hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
                <span>sabiryultrasound@gmail.com</span>
              </a>
            </li>
            <li>
              <a href="tel:+923477149100" className="flex items-center justify-center md:justify-start gap-3 hover:text-primary transition-colors">
                <Phone className="h-5 w-5" />
                <span>+92 347 7149100</span>
              </a>
            </li>
            <li className="flex items-center justify-center md:justify-start gap-3">
              <MapPin className="h-5 w-5" />
              <span>Amin Pur Bangla, Pakistan</span>
            </li>
          </ul>
        </div>

        {/* WhatsApp Support */}
        <div className="flex flex-col items-center md:items-start">
          <h4 className="text-lg font-semibold mb-4">Need Help?</h4>
          <p className="text-sm text-muted-foreground mb-4">Our support team is just a message away.</p>
          <Button asChild className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-transform transform hover:scale-105">
            <a 
              href="https://wa.me/923477149100?text=Hello%20SUTI%20Support%2C%20I%20need%20help."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Chat on WhatsApp</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>

      </div>
      <div className="container mx-auto text-center text-sm text-muted-foreground mt-10 pt-6 border-t border-border/50">
        &copy; {new Date().getFullYear()} Sabiry Ultrasound Training Institute. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
