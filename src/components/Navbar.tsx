
import React from 'react';
import { Button } from '@/components/ui/button';
import { Coffee } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-coffee-cream">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-coffee-dark" />
          <span className="font-poppins font-semibold text-xl text-coffee-dark">Caffeinate</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-coffee-dark hover:text-coffee-light transition-colors">Features</a>
          <a href="#benefits" className="text-coffee-dark hover:text-coffee-light transition-colors">Benefits</a>
          <a href="#testimonials" className="text-coffee-dark hover:text-coffee-light transition-colors">Testimonials</a>
          <a href="#download" className="text-coffee-dark hover:text-coffee-light transition-colors">Download</a>
        </nav>
        <div className="flex items-center gap-4">
          <Button className="bg-coffee-dark hover:bg-coffee-medium text-white">Get Started</Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
