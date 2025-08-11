import { useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { GraduationCap, Menu, X } from "lucide-react";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false); // Close menu on link click
  };

  const NavLink = ({ to, sectionId, children }: { to?: string, sectionId?: string, children: React.ReactNode }) => {
    const location = useLocation();
    const isActive = to && location.pathname === to;

    const linkClasses = `text-gray-300 hover:text-white transition-colors duration-300 font-medium ${isActive ? 'text-white' : ''}`;

    if (to) {
      return <Link to={to} className={linkClasses}>{children}</Link>;
    }

    return (
      <button onClick={() => scrollToSection(sectionId!)} className={linkClasses}>
        {children}
      </button>
    );
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-900/50 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-purple-400" />
          <span className="text-2xl font-bold text-white">
            SUTI
          </span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
          <NavLink to="/">Home</NavLink>
          <NavLink sectionId="courses">Courses</NavLink>
          <NavLink sectionId="about">Founder & CEO</NavLink>
          <NavLink sectionId="contact">Contact</NavLink>
        </div>
        
        <div className="hidden md:flex items-center space-x-2">
          <Link to="/login">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full">
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30 rounded-full px-5">
              Sign Up
            </Button>
          </Link>
        </div>

        {/* Hamburger Menu for Mobile */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900/95 backdrop-blur-xl absolute top-full left-0 w-full flex flex-col items-center space-y-6 py-8 border-t border-white/10">
          <NavLink to="/">Home</NavLink>
          <NavLink sectionId="courses">Courses</NavLink>
          <NavLink sectionId="about">Founder & CEO</NavLink>
          <NavLink sectionId="contact">Contact</NavLink>
          <div className="flex items-center space-x-4 pt-6">
            <Link to="/login" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full px-6 py-2">
                Login
              </Button>
            </Link>
            <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
              <Button className="text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-6 py-2">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
