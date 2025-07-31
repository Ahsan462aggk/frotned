import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-background/80 border-t border-border/50 py-6 mt-12">
      <div className="container mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-4 px-4 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-xl font-bold text-primary">SUTI</span>
          <span className="text-sm text-muted-foreground">Sabriy Ultrasound Training Institute</span>
          <span className="text-xs text-muted-foreground mt-1">Excellence in Ultrasound Education & Training</span>
          <div className="space-y-2 mt-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Mail className="h-4 w-4" />
              <span>info@suti.edu.pk</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Phone className="h-4 w-4" />
              <span>+92 300 1234567</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4" />
              <span>Amin Pur Bangla, Pakistan</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <a
                href="https://wa.me/923001234567?text=Hello%20SUTI%20Support%2C%20I%20need%20help."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-green-600 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Support</span>
              </a>
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-center md:text-right">
          &copy; {new Date().getFullYear()} SUTI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
